# Background Alarm Design — AlarmService

**Date:** 2026-04-08
**Status:** Approved
**Target:** Android (Capacitor), API 33+, tested on API 37

## Problem

Alarms only fire while the app is open. The JS `setInterval` in `AppContext.jsx` triggers the alarm UI, but when the app is closed or the screen is locked nothing happens — no notification, no sound, no screen wake.

Root causes:
1. `USE_FULL_SCREEN_INTENT` permission not requested at runtime (API 34+ requires explicit user grant in Settings)
2. No foreground `AlarmService` — without one there is no WakeLock, no continuous sound, and Android's battery optimiser can suppress the broadcast entirely
3. `POST_NOTIFICATIONS` not requested early enough
4. Battery optimisation not exempted

## Goal

When an alarm fires while the app is closed or the screen is locked:
- A high-priority notification appears on the lock screen and as a heads-up
- The default alarm ringtone plays on loop until the user acts
- Tapping the notification OR the "Dismiss" action button stops the ringtone
- Tapping the notification opens MorninMate and shows the wake-up routine
- Completing the routine calls `dismissAlarm()` which stops the service

---

## Architecture

### New components

| Component | Type | Purpose |
|---|---|---|
| `AlarmService.java` | Foreground Service | WakeLock + ringtone loop + alarm notification |
| `AlarmDismissReceiver.java` | BroadcastReceiver | Handles notification "Dismiss" action button |

### Modified components

| Component | Change |
|---|---|
| `AndroidManifest.xml` | Add permissions, register AlarmService + AlarmDismissReceiver |
| `AlarmReceiver.java` | Replace notification code with `startForegroundService(AlarmService)` |
| `AlarmPlugin.java` | Add `dismissAlarm`, `checkAlarmPermissions`, `requestAlarmPermissions` |
| `src/lib/nativeAlarms.js` | Add `dismissAlarm`, `checkAndRequestAlarmPermissions` |
| `src/context/AppContext.jsx` | Call permissions check on load; call `dismissAlarm` in `clearActiveAlarm` |

---

## Detailed Design

### `AndroidManifest.xml`

Add permissions:
```xml
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />
<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
```

Register service and dismiss receiver inside `<application>`:
```xml
<service
    android:name=".AlarmService"
    android:foregroundServiceType="mediaPlayback"
    android:exported="false" />

<receiver android:name=".AlarmDismissReceiver" android:exported="false" />
```

### `AlarmService.java` (new)

`onStartCommand`:
1. Extract `alarmId` and `label` from intent extras
2. Acquire `PowerManager.PARTIAL_WAKE_LOCK`
3. Get `RingtoneManager.getDefaultUri(TYPE_ALARM)` and play on loop (`setLooping(true)` API 28+)
4. Build foreground notification:
   - Channel `morninmate_alarm` (IMPORTANCE_HIGH, bypass DnD, vibration enabled)
   - `CATEGORY_ALARM`, `PRIORITY_MAX`, `VISIBILITY_PUBLIC`, `setOngoing(true)`
   - Content intent + full-screen intent → `MainActivity` with `alarmId` extra
   - Action "Dismiss" → `AlarmDismissReceiver` broadcast with `alarmId`
5. Call `startForeground(notificationId, notification, FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK)`
6. Call `startActivity(mainIntent)` directly to force the screen on

`onDestroy`:
- Stop ringtone
- Release WakeLock

### `AlarmDismissReceiver.java` (new)

On receive:
1. `stopService(new Intent(context, AlarmService.class))`
2. `SharedPreferences.edit().remove("pending_alarm").apply()` so cold-start doesn't re-trigger

### `AlarmReceiver.java` (update)

Remove all notification-building code. Replace with:
```java
Intent serviceIntent = new Intent(context, AlarmService.class);
serviceIntent.putExtra("alarmId", alarmId);
serviceIntent.putExtra("label", label);
context.startForegroundService(serviceIntent);
```

Keep: `pending_alarm` SharedPreferences write + repeating alarm reschedule logic.

### `AlarmPlugin.java` (update)

**`dismissAlarm`:**
```java
@PluginMethod
public void dismissAlarm(PluginCall call) {
    String id = call.getString("id");
    getContext().stopService(new Intent(getContext(), AlarmService.class));
    getPrefs().edit().remove("pending_alarm").apply();
    call.resolve();
}
```

**`checkAlarmPermissions`:** returns a `JSObject` with:
- `postNotifications` — `NotificationManagerCompat.areNotificationsEnabled()`
- `fullScreenIntent` — `notificationManager.canUseFullScreenIntent()` (API 34+, else `true`)
- `batteryOptimization` — `powerManager.isIgnoringBatteryOptimizations(packageName)`

**`requestAlarmPermissions`:**
- `POST_NOTIFICATIONS` → `ActivityCompat.requestPermissions()`
- `USE_FULL_SCREEN_INTENT` → `startActivity(ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT)`
- Battery optimization → `startActivity(ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)`

### `nativeAlarms.js` (update)

```js
export async function dismissAlarm(id) {
  if (!isNative) return;
  await AlarmPlugin.dismissAlarm({ id });
}

export async function checkAndRequestAlarmPermissions() {
  if (!isNative) return;
  const result = await AlarmPlugin.checkAlarmPermissions();
  const needsRequest = !result.postNotifications
    || !result.fullScreenIntent
    || !result.batteryOptimization;
  if (needsRequest) await AlarmPlugin.requestAlarmPermissions();
}
```

### `AppContext.jsx` (update)

After `syncAllAlarms()` in `loadUserData`:
```js
checkAndRequestAlarmPermissions(); // fire-and-forget, native only
```

Update `clearActiveAlarm`:
```js
function clearActiveAlarm() {
  if (activeAlarm) dismissAlarm(activeAlarm.id);
  setActiveAlarm(null);
}
```

---

## Full Data Flow

```
AlarmManager fires
  → AlarmReceiver.onReceive()
      writes pending_alarm to SharedPreferences
      startForegroundService(AlarmService)
          acquires WakeLock
          plays ringtone on loop
          posts foreground notification (full-screen intent on lock screen)
          startActivity(MainActivity, alarmId)

App opens
  cold-start  → AppContext.loadUserData() → getPendingAlarm() → setActiveAlarm()
  backgrounded → MainActivity.onNewIntent() → JS "alarmFired" event → setActiveAlarm()

User acts
  completes wake-up game → clearActiveAlarm() → dismissAlarm(id)
                                                    → stopService(AlarmService)
                                                        ringtone stops, WakeLock released
  taps "Dismiss" on notification
      → AlarmDismissReceiver → stopService(AlarmService)
```

---

## Permission Sequence

| Permission | API requirement | How requested |
|---|---|---|
| `POST_NOTIFICATIONS` | API 33+ | `requestPermissions()` call |
| `USE_FULL_SCREEN_INTENT` | API 34+ explicit grant | Open `ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT` |
| Battery optimization exemption | All APIs | `ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` dialog |
| `USE_EXACT_ALARM` | Auto-granted API 33+ | No action needed |

All three are requested once per install, on first alarm load (not on every launch).

---

## Out of Scope

- iOS support
- Snooze functionality
- Custom alarm sounds (uses system default alarm ringtone)
- Web/PWA alarm sound (existing browser `Notification` path unchanged)
