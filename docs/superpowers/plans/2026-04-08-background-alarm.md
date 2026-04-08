# Background Alarm Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make alarms fire as a lock-screen notification with looping ringtone when the app is closed, via an Android foreground service.

**Architecture:** `AlarmReceiver` starts a new `AlarmService` foreground service instead of posting a notification directly. `AlarmService` acquires a WakeLock, plays the system alarm ringtone on loop, and posts a persistent `setOngoing` notification with a full-screen intent and a "Dismiss" button. A new `dismissAlarm()` plugin method stops the service; JS calls it when the user completes the wake-up routine or taps Dismiss.

**Tech Stack:** Android Java (Capacitor plugin), React/JSX (AppContext + nativeAlarms.js), Capacitor 8

---

## File Map

| File | Action |
|---|---|
| `android/app/src/main/AndroidManifest.xml` | Add 3 permissions, register `AlarmService` + `AlarmDismissReceiver` |
| `android/app/src/main/java/com/morninmate/app/AlarmDismissReceiver.java` | Create |
| `android/app/src/main/java/com/morninmate/app/AlarmService.java` | Create |
| `android/app/src/main/java/com/morninmate/app/AlarmReceiver.java` | Update — replace notification code with `startForegroundService` |
| `android/app/src/main/java/com/morninmate/app/AlarmPlugin.java` | Update — add `dismissAlarm`, `checkAlarmPermissions`, `requestAlarmPermissions` |
| `src/lib/nativeAlarms.js` | Update — add `dismissAlarm`, `checkAndRequestAlarmPermissions` |
| `src/context/AppContext.jsx` | Update — import new exports, call on load + in `clearActiveAlarm` |

---

## Task 1: Update `AndroidManifest.xml`

**Files:**
- Modify: `android/app/src/main/AndroidManifest.xml`

- [ ] **Step 1: Add three new `<uses-permission>` entries**

Open `android/app/src/main/AndroidManifest.xml`. After the line:
```xml
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```
Add:
```xml
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />
    <uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
```

- [ ] **Step 2: Register `AlarmService` and `AlarmDismissReceiver` inside `<application>`**

Inside the `<application>` block, directly after the closing `</receiver>` tag of `BootReceiver`, add:
```xml
        <!-- Foreground service — plays ringtone while alarm is ringing -->
        <service
            android:name=".AlarmService"
            android:foregroundServiceType="mediaPlayback"
            android:exported="false" />

        <!-- Receives the "Dismiss" action from the alarm notification -->
        <receiver android:name=".AlarmDismissReceiver" android:exported="false" />
```

- [ ] **Step 3: Verify manifest compiles**

```bash
cd android && ./gradlew assembleDebug 2>&1 | tail -20
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 4: Commit**

```bash
git add android/app/src/main/AndroidManifest.xml
git commit -m "feat(android): add foreground service permissions and register AlarmService"
```

---

## Task 2: Create `AlarmDismissReceiver.java`

**Files:**
- Create: `android/app/src/main/java/com/morninmate/app/AlarmDismissReceiver.java`

- [ ] **Step 1: Create the file**

```java
package com.morninmate.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class AlarmDismissReceiver extends BroadcastReceiver {

    private static final String PREFS_NAME = "MorninMateAlarms";

    @Override
    public void onReceive(Context context, Intent intent) {
        String alarmId = intent.getStringExtra("alarmId");
        Log.d("AlarmDismissReceiver", "Dismiss tapped for alarmId=" + alarmId);

        // Stop the foreground service (releases WakeLock + stops ringtone)
        context.stopService(new Intent(context, AlarmService.class));

        // Clear pending_alarm so a subsequent cold-start doesn't re-trigger the alarm UI
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit().remove("pending_alarm").apply();
    }
}
```

- [ ] **Step 2: Build to verify no compile errors**

```bash
cd android && ./gradlew assembleDebug 2>&1 | tail -20
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 3: Commit**

```bash
git add android/app/src/main/java/com/morninmate/app/AlarmDismissReceiver.java
git commit -m "feat(android): add AlarmDismissReceiver for notification dismiss action"
```

---

## Task 3: Create `AlarmService.java`

**Files:**
- Create: `android/app/src/main/java/com/morninmate/app/AlarmService.java`

- [ ] **Step 1: Create the file**

```java
package com.morninmate.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;

import androidx.core.app.NotificationCompat;

public class AlarmService extends Service {

    private static final String TAG        = "AlarmService";
    private static final String CHANNEL_ID = "morninmate_alarm";
    private static final int    NOTIF_ID   = 7654;

    private PowerManager.WakeLock wakeLock;
    private Ringtone ringtone;

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String alarmId = intent != null ? intent.getStringExtra("alarmId") : null;
        String label   = intent != null ? intent.getStringExtra("label")   : "Alarm";
        Log.d(TAG, "onStartCommand alarmId=" + alarmId);

        // 1. Acquire WakeLock (max 10 min — service stopped earlier by dismiss)
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "MorninMate::AlarmWakeLock");
        wakeLock.acquire(10 * 60 * 1000L);

        // 2. Play alarm ringtone on loop
        Uri alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
        if (alarmUri == null) {
            alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        }
        ringtone = RingtoneManager.getRingtone(this, alarmUri);
        if (ringtone != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) { // API 28
                ringtone.setLooping(true);
            }
            ringtone.play();
        }

        // 3. Build notification
        createNotificationChannel();

        Intent mainIntent = new Intent(this, MainActivity.class);
        mainIntent.putExtra("alarmId", alarmId);
        mainIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK
            | Intent.FLAG_ACTIVITY_CLEAR_TOP
            | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        int baseCode = alarmId != null ? alarmId.hashCode() : 0;

        PendingIntent contentPi = PendingIntent.getActivity(
            this, baseCode, mainIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Intent dismissIntent = new Intent(this, AlarmDismissReceiver.class);
        dismissIntent.putExtra("alarmId", alarmId);
        PendingIntent dismissPi = PendingIntent.getBroadcast(
            this, baseCode + 1, dismissIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        String body = (label != null && !label.isEmpty())
            ? label + " \u2014 Rise & Shine!"
            : "Rise & Shine, Legend!";

        int iconResId = getResources().getIdentifier(
            "ic_launcher_foreground", "drawable", getPackageName());
        if (iconResId == 0) iconResId = android.R.drawable.ic_dialog_alert;

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(iconResId)
            .setContentTitle("MorninMate")
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(true)
            .setFullScreenIntent(contentPi, true)
            .setContentIntent(contentPi)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Dismiss", dismissPi)
            .build();

        // 4. Start foreground (with service type on API 29+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) { // API 29
            startForeground(NOTIF_ID, notification,
                android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(NOTIF_ID, notification);
        }

        // 5. Launch MainActivity to bring app to foreground / over lock screen
        startActivity(mainIntent);

        return START_NOT_STICKY;
    }

    @Override
    public void onDestroy() {
        Log.d(TAG, "onDestroy — stopping ringtone and releasing WakeLock");
        if (ringtone != null && ringtone.isPlaying()) ringtone.stop();
        if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(
                CHANNEL_ID, "Alarms", NotificationManager.IMPORTANCE_HIGH);
            ch.setDescription("MorninMate alarm alerts");
            ch.setBypassDnd(true);
            ch.enableVibration(true);
            getSystemService(NotificationManager.class).createNotificationChannel(ch);
        }
    }
}
```

- [ ] **Step 2: Build to verify no compile errors**

```bash
cd android && ./gradlew assembleDebug 2>&1 | tail -20
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 3: Commit**

```bash
git add android/app/src/main/java/com/morninmate/app/AlarmService.java
git commit -m "feat(android): add AlarmService foreground service with WakeLock and ringtone"
```

---

## Task 4: Update `AlarmReceiver.java`

**Files:**
- Modify: `android/app/src/main/java/com/morninmate/app/AlarmReceiver.java`

- [ ] **Step 1: Replace the `onReceive` method body**

The current `onReceive` builds a notification directly. Replace the entire `onReceive` method with this version (keep the `reschedule` and `requestCode` methods below it unchanged):

```java
    @Override
    public void onReceive(Context context, Intent intent) {
        String  alarmId   = intent.getStringExtra("alarmId");
        String  label     = intent.getStringExtra("label");
        int     hour      = intent.getIntExtra("hour", 7);
        int     minute    = intent.getIntExtra("minute", 0);
        boolean repeat    = intent.getBooleanExtra("repeating", false);
        int     targetDay = intent.getIntExtra("targetDay", -1);

        Log.d("AlarmReceiver", "onReceive fired! alarmId=" + alarmId);
        if (alarmId == null) { Log.e("AlarmReceiver", "alarmId is null — ignoring"); return; }

        // Persist alarm ID so JS can read it on cold start
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit().putString("pending_alarm", alarmId).apply();

        // Delegate to AlarmService — it handles WakeLock, ringtone, and notification
        Intent serviceIntent = new Intent(context, AlarmService.class);
        serviceIntent.putExtra("alarmId", alarmId);
        serviceIntent.putExtra("label",   label);
        context.startForegroundService(serviceIntent);

        // Repeating: reschedule for next week. One-shot: remove from prefs.
        if (repeat && targetDay >= 0) {
            reschedule(context, alarmId, label, hour, minute, targetDay);
        } else {
            context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .edit().remove("alarm_" + alarmId).apply();
        }
    }
```

- [ ] **Step 2: Remove now-unused imports and the `createNotificationChannel` method**

Delete these four import lines (no longer needed — notification code moved to `AlarmService`):
```java
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import androidx.core.app.NotificationCompat;
```

Delete the `createNotificationChannel` private method (the one that creates `morninmate_alarm` channel) — `AlarmService` now owns it.

Delete the `CHANNEL_ID` constant at the top of the class.

- [ ] **Step 3: Build to verify no compile errors**

```bash
cd android && ./gradlew assembleDebug 2>&1 | tail -20
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 4: Commit**

```bash
git add android/app/src/main/java/com/morninmate/app/AlarmReceiver.java
git commit -m "feat(android): AlarmReceiver delegates to AlarmService instead of posting notification"
```

---

## Task 5: Update `AlarmPlugin.java`

**Files:**
- Modify: `android/app/src/main/java/com/morninmate/app/AlarmPlugin.java`

- [ ] **Step 1: Add five missing imports**

After the existing import block, add:
```java
import android.net.Uri;
import android.os.PowerManager;
import android.provider.Settings;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationManagerCompat;
```

- [ ] **Step 2: Add `dismissAlarm` method**

After the closing `}` of `getPendingAlarm`, add:

```java
    @PluginMethod
    public void dismissAlarm(PluginCall call) {
        String id = call.getString("id");
        Log.d("AlarmPlugin", "dismissAlarm id=" + id);
        getContext().stopService(new Intent(getContext(), AlarmService.class));
        getPrefs().edit().remove("pending_alarm").apply();
        call.resolve();
    }
```

- [ ] **Step 3: Add `checkAlarmPermissions` method**

```java
    @PluginMethod
    public void checkAlarmPermissions(PluginCall call) {
        boolean postNotifications =
            NotificationManagerCompat.from(getContext()).areNotificationsEnabled();

        boolean fullScreenIntent = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) { // API 34
            NotificationManager nm =
                (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
            fullScreenIntent = nm.canUseFullScreenIntent();
        }

        PowerManager pm = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
        boolean batteryOptimization =
            pm.isIgnoringBatteryOptimizations(getContext().getPackageName());

        JSObject result = new JSObject();
        result.put("postNotifications",   postNotifications);
        result.put("fullScreenIntent",    fullScreenIntent);
        result.put("batteryOptimization", batteryOptimization);
        call.resolve(result);
    }
```

- [ ] **Step 4: Add `requestAlarmPermissions` method**

```java
    @PluginMethod
    public void requestAlarmPermissions(PluginCall call) {
        // POST_NOTIFICATIONS — runtime request (API 33+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) { // API 33
            if (!NotificationManagerCompat.from(getContext()).areNotificationsEnabled()) {
                ActivityCompat.requestPermissions(
                    getActivity(),
                    new String[]{ android.Manifest.permission.POST_NOTIFICATIONS },
                    1001);
            }
        }

        // USE_FULL_SCREEN_INTENT — must be granted in Settings (API 34+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) { // API 34
            NotificationManager nm =
                (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
            if (!nm.canUseFullScreenIntent()) {
                Intent intent = new Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT);
                intent.setData(Uri.parse("package:" + getContext().getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
            }
        }

        // Battery optimization exemption
        PowerManager pm = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
        if (!pm.isIgnoringBatteryOptimizations(getContext().getPackageName())) {
            Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
            intent.setData(Uri.parse("package:" + getContext().getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
        }

        call.resolve();
    }
```

- [ ] **Step 5: Build to verify no compile errors**

```bash
cd android && ./gradlew assembleDebug 2>&1 | tail -20
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 6: Commit**

```bash
git add android/app/src/main/java/com/morninmate/app/AlarmPlugin.java
git commit -m "feat(android): add dismissAlarm, checkAlarmPermissions, requestAlarmPermissions to AlarmPlugin"
```

---

## Task 6: Update `src/lib/nativeAlarms.js`

**Files:**
- Modify: `src/lib/nativeAlarms.js`

- [ ] **Step 1: Add `dismissAlarm` export**

After the `getPendingAlarm` function (after line 74 in the current file), add:

```js
// ─── Dismiss (stops AlarmService: ringtone + WakeLock) ────────────────────────

export async function dismissAlarm(id) {
  if (!isNative) return;
  try {
    await AlarmPlugin.dismissAlarm({ id });
  } catch (_) {}
}
```

- [ ] **Step 2: Add `checkAndRequestAlarmPermissions` export**

After `dismissAlarm`, add:

```js
// ─── Alarm permissions (USE_FULL_SCREEN_INTENT, battery opt, notifications) ────

export async function checkAndRequestAlarmPermissions() {
  if (!isNative) return;
  try {
    const result = await AlarmPlugin.checkAlarmPermissions();
    const needsRequest = !result.postNotifications
      || !result.fullScreenIntent
      || !result.batteryOptimization;
    if (needsRequest) await AlarmPlugin.requestAlarmPermissions();
  } catch (e) {
    console.warn('checkAndRequestAlarmPermissions failed:', e);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/nativeAlarms.js
git commit -m "feat(js): add dismissAlarm and checkAndRequestAlarmPermissions to nativeAlarms"
```

---

## Task 7: Update `src/context/AppContext.jsx`

**Files:**
- Modify: `src/context/AppContext.jsx`

- [ ] **Step 1: Extend the import from `nativeAlarms`**

Find the existing import block at the top of `AppContext.jsx` (lines 1–13):

```js
import {
  isNative,
  requestNotificationPermission,
  scheduleAlarm,
  cancelAlarmNotifications,
  syncAllAlarms,
  vibrateAlarm,
  onNotificationTap,
  getPendingAlarm,
} from '../lib/nativeAlarms';
```

Replace with:

```js
import {
  isNative,
  requestNotificationPermission,
  scheduleAlarm,
  cancelAlarmNotifications,
  syncAllAlarms,
  vibrateAlarm,
  onNotificationTap,
  getPendingAlarm,
  dismissAlarm,
  checkAndRequestAlarmPermissions,
} from '../lib/nativeAlarms';
```

- [ ] **Step 2: Call `checkAndRequestAlarmPermissions` after `syncAllAlarms` in `loadUserData`**

Find this block inside `loadUserData` (around line 229):

```js
      setAlarms(mapped);
      syncAllAlarms(mapped);

      // Cold-start: check if an alarm fired while the app was closed
```

Replace with:

```js
      setAlarms(mapped);
      syncAllAlarms(mapped);
      checkAndRequestAlarmPermissions(); // request missing alarm permissions once per install

      // Cold-start: check if an alarm fired while the app was closed
```

- [ ] **Step 3: Update `clearActiveAlarm` to stop the foreground service**

Find (around line 469):

```js
  function clearActiveAlarm()   { setActiveAlarm(null); }
```

Replace with:

```js
  function clearActiveAlarm() {
    if (activeRef.current) dismissAlarm(activeRef.current.id);
    setActiveAlarm(null);
  }
```

- [ ] **Step 4: Build the web bundle**

```bash
npm run build 2>&1 | tail -20
```

Expected: no errors.

- [ ] **Step 5: Sync to Android and build APK**

```bash
npx cap sync android && cd android && ./gradlew assembleDebug 2>&1 | tail -20
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 6: Commit**

```bash
git add src/lib/nativeAlarms.js src/context/AppContext.jsx
git commit -m "feat(js): wire dismissAlarm and alarm permission checks into AppContext"
```

---

## Task 8: Test on Emulator

- [ ] **Step 1: Install the debug APK**

```bash
cd android && ./gradlew installDebug 2>&1 | tail -10
```

Expected: `BUILD SUCCESSFUL`, app installs on emulator.

- [ ] **Step 2: Grant permissions on first launch**

Launch the app and log in. You should see:
1. A system dialog: "Allow MorninMate to ignore battery optimizations?" — tap **Allow**
2. A Settings page for full-screen intents — enable the toggle for MorninMate, then press Back

- [ ] **Step 3: Set a test alarm 2 minutes from now (no repeat days)**

In the app, add a one-shot alarm set to current emulator time + 2 minutes.

- [ ] **Step 4: Kill the app**

Press the square (recent apps) button on the emulator and swipe MorninMate away.

- [ ] **Step 5: Lock the screen**

```bash
adb shell input keyevent 26
```

- [ ] **Step 6: Wait for the alarm — verify these three things**

1. Screen turns on automatically
2. Alarm notification appears on the lock screen with "MorninMate" title and "Dismiss" button
3. Alarm ringtone plays on loop

- [ ] **Step 7: Tap the notification body**

Expected: App opens, wake-up routine screen shows, ringtone continues playing until you complete the routine.

- [ ] **Step 8: Complete the wake-up routine**

Expected: `clearActiveAlarm()` is called → `dismissAlarm()` runs → ringtone stops, notification is removed.

- [ ] **Step 9: Repeat the test but tap "Dismiss" instead**

Set another alarm 2 minutes out, kill the app, wait for it to fire. When the notification appears, tap **Dismiss**.

Expected: Ringtone stops immediately, notification disappears, app does NOT open.

- [ ] **Step 10: If anything fails, check logcat**

```bash
adb logcat -s AlarmReceiver AlarmService AlarmPlugin AlarmDismissReceiver
```

Look for this sequence on success:
```
AlarmReceiver: onReceive fired! alarmId=<id>
AlarmService:  onStartCommand alarmId=<id>
AlarmService:  onDestroy — stopping ringtone and releasing WakeLock
```
