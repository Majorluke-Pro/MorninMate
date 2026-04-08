# Background Alarm — Full-Screen Intent Design

**Date:** 2026-04-08  
**Status:** Approved

## Problem

The alarm currently fires only while the app is open. It relies on a JavaScript `setInterval` in `AppContext.jsx`. When the app is closed or backgrounded, no alarm fires. The goal is: set an alarm, close the app, and when it fires, the screen turns on, the app opens over the lock screen, and the WakeUpFlow plays custom sounds.

## Approach

Custom Capacitor plugin using Android `AlarmManager` + full-screen intent. Replaces the `@capacitor/local-notifications` scheduling path. The JS public API in `nativeAlarms.js` stays the same so `AppContext` changes are minimal.

---

## Architecture

### Scheduling Phase (JS → Native)

```
nativeAlarms.js
  └─ AlarmPlugin.schedule({ id, label, time, days })
       └─ AlarmPlugin.java
            └─ AlarmManager.setExactAndAllowWhileIdle()
            └─ SharedPreferences.putString(id, alarmJson)
```

### Firing Phase (Native → JS)

```
AlarmManager fires at scheduled time
  └─ AlarmReceiver.java
       └─ builds full-screen intent → MainActivity (with alarmId extra)
            └─ Cold start: MainActivity.onCreate() reads alarmId
            └─ Backgrounded: MainActivity.onNewIntent() reads alarmId
                 └─ bridge.triggerJSEvent("alarmFired", { alarmId })
                      └─ AppContext.jsx listener → setActiveAlarm(alarm)
                           └─ WakeUpFlow renders + plays custom sound
```

### Reboot Resilience

```
BOOT_COMPLETED broadcast
  └─ BootReceiver.java
       └─ reads all alarms from SharedPreferences
            └─ re-registers each with AlarmManager
```

---

## Components

### New Native Files

| File | Purpose |
|------|---------|
| `android/app/src/main/java/com/morninmate/app/AlarmPlugin.java` | Capacitor plugin — JS bridge for schedule/cancel/cancelAll |
| `android/app/src/main/java/com/morninmate/app/AlarmReceiver.java` | BroadcastReceiver — fires at alarm time, shows full-screen intent |
| `android/app/src/main/java/com/morninmate/app/BootReceiver.java` | BroadcastReceiver — reschedules alarms after phone reboot |

### Modified Files

| File | Change |
|------|--------|
| `android/app/src/main/AndroidManifest.xml` | Add permissions + register receivers |
| `android/app/src/main/java/com/morninmate/app/MainActivity.java` | Read alarmId from launch intent, fire bridge event |
| `src/lib/nativeAlarms.js` | Replace LocalNotifications.schedule() with AlarmPlugin calls |
| `src/context/AppContext.jsx` | Add `alarmFired` bridge event listener on startup |

---

## Data Flow

### Scheduling

`addAlarm()` in AppContext calls `scheduleAlarm(alarm)` in `nativeAlarms.js`, which calls `AlarmPlugin.schedule()` with:
- `id` — UUID string
- `label` — alarm label string
- `time` — `"HH:MM"` string
- `days` — array of 0–6 integers (empty = one-shot)

For **repeating alarms**: one `AlarmManager` entry per day, each set to fire weekly (`setExactAndAllowWhileIdle` + reschedule in receiver).  
For **one-shot alarms**: single entry at next occurrence of `HH:MM`.

All alarm data is serialized as JSON and saved to `SharedPreferences` under key `alarm_<id>`.

### Firing

`AlarmReceiver` receives the broadcast with `alarmId` as an intent extra. It constructs a `PendingIntent` to launch `MainActivity` with `alarmId`. It posts a high-priority notification with `setFullScreenIntent(pendingIntent, true)` and acquires a `WAKE_LOCK` to turn on the screen.

Two launch cases handled in `MainActivity`:

- **Cold start** (`onCreate`): reads `getIntent().getStringExtra("alarmId")`, calls `bridge.triggerJSEvent("alarmFired", "{ \"alarmId\": \"...\", \"channel\": \"document\" }")`
- **Backgrounded** (`onNewIntent`): same logic on the new intent

`AppContext.jsx` registers a listener for `"alarmFired"` on `document` at startup. On receiving it, finds the alarm in state and calls `setActiveAlarm`.

### Repeat Scheduling

After each weekly repeating alarm fires, `AlarmReceiver` re-schedules itself for the next week using `AlarmManager.setExactAndAllowWhileIdle()`. For one-shot alarms, `AlarmReceiver` removes the alarm from `SharedPreferences` after firing.

---

## Android Manifest Changes

### Permissions to add

```xml
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
<uses-permission android:name="android.permission.USE_EXACT_ALARM" />
<uses-permission android:name="android.permission.USE_FULL_SCREEN_INTENT" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

### Receivers to register (inside `<application>`)

```xml
<receiver android:name=".AlarmReceiver" android:exported="false" />
<receiver android:name=".BootReceiver" android:exported="true">
    <intent-filter>
        <action android:name="android.intent.action.BOOT_COMPLETED" />
    </intent-filter>
</receiver>
```

---

## Error Handling & Edge Cases

| Scenario | Handling |
|----------|---------|
| `SCHEDULE_EXACT_ALARM` permission denied (Android 12+) | `AlarmPlugin.schedule()` returns error to JS; `nativeAlarms.js` logs warning; app doesn't crash |
| Multiple alarms fire at same minute | Each has unique `alarmId`; first sets `activeAlarm`; rest ignored by `activeRef` guard in AppContext |
| Alarm cancelled while app is closed | `AlarmPlugin.cancel(id)` removes PendingIntent from AlarmManager + deletes from SharedPreferences |
| Phone rebooted before alarm fires | `BootReceiver` re-reads SharedPreferences, re-registers all active alarms |
| Alarm fires but scheduled time already passed (post-reboot) | AlarmReceiver / scheduling logic recalculates next valid occurrence |
| App already in WakeUpFlow when second alarm fires | `activeRef.current` guard in AppContext prevents double-trigger |

---

## Out of Scope

- Snooze functionality
- Custom alarm sound played from the notification channel (sounds play via app JS once WakeUpFlow renders)
- iOS implementation (separate effort)
