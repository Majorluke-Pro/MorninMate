# Background Alarm — Full-Screen Intent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make MorninMate alarms fire when the app is closed, waking the screen and opening the WakeUpFlow over the lock screen.

**Architecture:** A custom Capacitor Java plugin (`AlarmPlugin`) schedules exact alarms via `AlarmManager`. When the alarm fires, `AlarmReceiver` shows a full-screen intent notification that launches `MainActivity` with the alarm ID. `AppContext` reads the alarm ID on startup (cold start via `getPendingAlarm()`) or in real-time (backgrounded app via a `document` event) and sets `activeAlarm`, opening `WakeUpFlow` where existing JS sounds play.

**Tech Stack:** Capacitor 8, Android AlarmManager, Android NotificationCompat (full-screen intent), SharedPreferences (alarm persistence), React + Supabase (existing JS layer)

---

## File Map

| Action | File |
|--------|------|
| Create | `android/app/src/main/java/com/morninmate/app/AlarmPlugin.java` |
| Create | `android/app/src/main/java/com/morninmate/app/AlarmReceiver.java` |
| Create | `android/app/src/main/java/com/morninmate/app/BootReceiver.java` |
| Modify | `android/app/src/main/AndroidManifest.xml` |
| Modify | `android/app/src/main/java/com/morninmate/app/MainActivity.java` |
| Modify | `src/lib/nativeAlarms.js` |
| Modify | `src/context/AppContext.jsx` |

---

## Task 1: Update AndroidManifest.xml

**Files:**
- Modify: `android/app/src/main/AndroidManifest.xml`

- [ ] **Step 1: Add permissions and register receivers**

Replace the entire `AndroidManifest.xml` with:

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Existing -->
    <uses-permission android:name="android.permission.INTERNET" />

    <!-- Alarm permissions -->
    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
    <uses-permission android:name="android.permission.USE_EXACT_ALARM" />
    <uses-permission android:name="android.permission.USE_FULL_SCREEN_INTENT" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">

        <activity
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode|navigation"
            android:name=".MainActivity"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask"
            android:exported="true"
            android:showOnLockScreen="true">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

        </activity>

        <!-- Alarm receiver — fires when AlarmManager triggers -->
        <receiver
            android:name=".AlarmReceiver"
            android:exported="false" />

        <!-- Boot receiver — reschedules alarms after phone reboot -->
        <receiver
            android:name=".BootReceiver"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
            </intent-filter>
        </receiver>

        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>

    </application>

</manifest>
```

- [ ] **Step 2: Commit**

```bash
git add android/app/src/main/AndroidManifest.xml
git commit -m "feat(android): add alarm permissions and receiver declarations"
```

---

## Task 2: Create AlarmReceiver.java

**Files:**
- Create: `android/app/src/main/java/com/morninmate/app/AlarmReceiver.java`

This receiver fires when `AlarmManager` triggers. It saves the alarm ID to SharedPreferences (for cold-start detection), then posts a full-screen intent notification that launches `MainActivity`.

- [ ] **Step 1: Create the file**

```java
package com.morninmate.app;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import androidx.core.app.NotificationCompat;

import java.util.Calendar;

public class AlarmReceiver extends BroadcastReceiver {

    private static final String CHANNEL_ID = "morninmate_alarm";
    private static final String PREFS_NAME  = "MorninMateAlarms";

    @Override
    public void onReceive(Context context, Intent intent) {
        String alarmId   = intent.getStringExtra("alarmId");
        String label     = intent.getStringExtra("label");
        int    hour      = intent.getIntExtra("hour", 7);
        int    minute    = intent.getIntExtra("minute", 0);
        boolean repeat   = intent.getBooleanExtra("repeating", false);
        int    targetDay = intent.getIntExtra("targetDay", -1);

        if (alarmId == null) return;

        // Persist alarm ID so JS can read it on cold start
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit().putString("pending_alarm", alarmId).apply();

        createNotificationChannel(context);

        // Intent that opens MainActivity with the alarm ID
        Intent mainIntent = new Intent(context, MainActivity.class);
        mainIntent.putExtra("alarmId", alarmId);
        mainIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK
            | Intent.FLAG_ACTIVITY_CLEAR_TOP
            | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        PendingIntent fullScreenPi = PendingIntent.getActivity(
            context,
            alarmId.hashCode(),
            mainIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        String body = (label != null && !label.isEmpty())
            ? label + " \u2014 Rise & Shine!"
            : "Rise & Shine, Legend!";

        // Resolve notification small icon (uses ic_launcher_foreground if present)
        int iconResId = context.getResources().getIdentifier(
            "ic_launcher_foreground", "drawable", context.getPackageName());
        if (iconResId == 0) iconResId = android.R.drawable.ic_dialog_alert;

        Notification notification = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(iconResId)
            .setContentTitle("MorninMate")
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setFullScreenIntent(fullScreenPi, true)
            .setContentIntent(fullScreenPi)
            .setAutoCancel(true)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .build();

        NotificationManager nm =
            (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        nm.notify(alarmId.hashCode(), notification);

        // Repeating alarms: reschedule for next week. One-shot: remove from prefs.
        if (repeat && targetDay >= 0) {
            reschedule(context, alarmId, label, hour, minute, targetDay);
        } else {
            context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .edit().remove("alarm_" + alarmId).apply();
        }
    }

    private void createNotificationChannel(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(
                CHANNEL_ID, "Alarms", NotificationManager.IMPORTANCE_HIGH);
            ch.setDescription("MorninMate alarm alerts");
            ch.setBypassDnd(true);
            ch.enableVibration(true);
            context.getSystemService(NotificationManager.class).createNotificationChannel(ch);
        }
    }

    private void reschedule(Context context, String alarmId, String label,
                             int hour, int minute, int targetDay) {
        // Next occurrence = same weekday, one week from now
        Calendar cal = Calendar.getInstance();
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        cal.set(Calendar.HOUR_OF_DAY, hour);
        cal.set(Calendar.MINUTE, minute);
        cal.add(Calendar.DAY_OF_YEAR, 7);

        Intent intent = new Intent(context, AlarmReceiver.class);
        intent.putExtra("alarmId",   alarmId);
        intent.putExtra("label",     label);
        intent.putExtra("hour",      hour);
        intent.putExtra("minute",    minute);
        intent.putExtra("repeating", true);
        intent.putExtra("targetDay", targetDay);

        PendingIntent pi = PendingIntent.getBroadcast(
            context,
            requestCode(alarmId, targetDay + 1),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (am.canScheduleExactAlarms()) {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, cal.getTimeInMillis(), pi);
            }
        } else {
            am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, cal.getTimeInMillis(), pi);
        }
    }

    static int requestCode(String alarmId, int dayIndex) {
        int hash = 0;
        for (int i = 0; i < alarmId.length(); i++) {
            hash = 31 * hash + alarmId.charAt(i);
        }
        return Math.abs(hash) * 10 + dayIndex;
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add android/app/src/main/java/com/morninmate/app/AlarmReceiver.java
git commit -m "feat(android): add AlarmReceiver with full-screen intent"
```

---

## Task 3: Create BootReceiver.java

**Files:**
- Create: `android/app/src/main/java/com/morninmate/app/BootReceiver.java`

Reads all saved alarms from SharedPreferences after reboot and re-registers them with `AlarmManager`.

- [ ] **Step 1: Create the file**

```java
package com.morninmate.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Calendar;
import java.util.Map;

public class BootReceiver extends BroadcastReceiver {

    private static final String PREFS_NAME = "MorninMateAlarms";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (!Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) return;

        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);

        for (Map.Entry<String, ?> entry : prefs.getAll().entrySet()) {
            if (!entry.getKey().startsWith("alarm_")) continue;
            try {
                JSONObject json   = new JSONObject((String) entry.getValue());
                String  alarmId   = json.getString("id");
                String  label     = json.optString("label", "Alarm");
                String[] parts    = json.getString("time").split(":");
                int     hour      = Integer.parseInt(parts[0]);
                int     minute    = Integer.parseInt(parts[1]);
                JSONArray days    = json.optJSONArray("days");

                if (days == null || days.length() == 0) {
                    scheduleOne(context, am, alarmId, label, hour, minute, -1, false, 0);
                } else {
                    for (int i = 0; i < days.length(); i++) {
                        scheduleOne(context, am, alarmId, label, hour, minute,
                            days.getInt(i), true, i + 1);
                    }
                }
            } catch (Exception ignored) {}
        }
    }

    private void scheduleOne(Context context, AlarmManager am, String alarmId, String label,
                              int hour, int minute, int targetDay, boolean repeating, int codeIndex) {
        Intent intent = new Intent(context, AlarmReceiver.class);
        intent.putExtra("alarmId",   alarmId);
        intent.putExtra("label",     label);
        intent.putExtra("hour",      hour);
        intent.putExtra("minute",    minute);
        intent.putExtra("repeating", repeating);
        intent.putExtra("targetDay", targetDay);

        PendingIntent pi = PendingIntent.getBroadcast(
            context,
            AlarmReceiver.requestCode(alarmId, codeIndex),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        long triggerAt = nextOccurrence(hour, minute, targetDay);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (am.canScheduleExactAlarms()) {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pi);
            }
        } else {
            am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pi);
        }
    }

    private long nextOccurrence(int hour, int minute, int targetDay) {
        Calendar cal = Calendar.getInstance();
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        cal.set(Calendar.HOUR_OF_DAY, hour);
        cal.set(Calendar.MINUTE, minute);

        if (targetDay < 0) {
            if (cal.getTimeInMillis() <= System.currentTimeMillis()) {
                cal.add(Calendar.DAY_OF_YEAR, 1);
            }
            return cal.getTimeInMillis();
        }

        int today     = cal.get(Calendar.DAY_OF_WEEK) - 1; // 0 = Sunday
        int daysUntil = (targetDay - today + 7) % 7;
        cal.add(Calendar.DAY_OF_YEAR, daysUntil);
        if (cal.getTimeInMillis() <= System.currentTimeMillis()) {
            cal.add(Calendar.DAY_OF_YEAR, 7);
        }
        return cal.getTimeInMillis();
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add android/app/src/main/java/com/morninmate/app/BootReceiver.java
git commit -m "feat(android): add BootReceiver to reschedule alarms after reboot"
```

---

## Task 4: Create AlarmPlugin.java

**Files:**
- Create: `android/app/src/main/java/com/morninmate/app/AlarmPlugin.java`

Capacitor plugin that exposes `schedule`, `cancel`, `cancelAll`, and `getPendingAlarm` to JavaScript.

- [ ] **Step 1: Create the file**

```java
package com.morninmate.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Calendar;
import java.util.Map;

@CapacitorPlugin(name = "AlarmPlugin")
public class AlarmPlugin extends Plugin {

    private static final String PREFS_NAME = "MorninMateAlarms";

    private AlarmManager getAlarmManager() {
        return (AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE);
    }

    private SharedPreferences getPrefs() {
        return getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    private long nextOccurrence(int hour, int minute, int targetDay) {
        Calendar cal = Calendar.getInstance();
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        cal.set(Calendar.HOUR_OF_DAY, hour);
        cal.set(Calendar.MINUTE, minute);

        if (targetDay < 0) {
            if (cal.getTimeInMillis() <= System.currentTimeMillis()) {
                cal.add(Calendar.DAY_OF_YEAR, 1);
            }
            return cal.getTimeInMillis();
        }

        int today     = cal.get(Calendar.DAY_OF_WEEK) - 1;
        int daysUntil = (targetDay - today + 7) % 7;
        cal.add(Calendar.DAY_OF_YEAR, daysUntil);
        if (cal.getTimeInMillis() <= System.currentTimeMillis()) {
            cal.add(Calendar.DAY_OF_YEAR, 7);
        }
        return cal.getTimeInMillis();
    }

    private void doSchedule(String alarmId, String label, int hour, int minute,
                             int targetDay, int codeIndex, boolean repeating) {
        Intent intent = new Intent(getContext(), AlarmReceiver.class);
        intent.putExtra("alarmId",   alarmId);
        intent.putExtra("label",     label);
        intent.putExtra("hour",      hour);
        intent.putExtra("minute",    minute);
        intent.putExtra("repeating", repeating);
        intent.putExtra("targetDay", targetDay);

        PendingIntent pi = PendingIntent.getBroadcast(
            getContext(),
            AlarmReceiver.requestCode(alarmId, codeIndex),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        long triggerAt = nextOccurrence(hour, minute, targetDay);
        AlarmManager am = getAlarmManager();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (am.canScheduleExactAlarms()) {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pi);
            }
        } else {
            am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pi);
        }
    }

    private void doCancel(String alarmId) {
        AlarmManager am = getAlarmManager();
        for (int i = 0; i < 8; i++) {
            Intent intent = new Intent(getContext(), AlarmReceiver.class);
            PendingIntent pi = PendingIntent.getBroadcast(
                getContext(),
                AlarmReceiver.requestCode(alarmId, i),
                intent,
                PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE);
            if (pi != null) { am.cancel(pi); pi.cancel(); }
        }
        getPrefs().edit().remove("alarm_" + alarmId).apply();
    }

    @PluginMethod
    public void schedule(PluginCall call) {
        String  id    = call.getString("id");
        String  label = call.getString("label", "Alarm");
        String  time  = call.getString("time", "07:00");
        JSArray days  = call.getArray("days");

        if (id == null || time == null) { call.reject("id and time required"); return; }

        String[] parts = time.split(":");
        int hour   = Integer.parseInt(parts[0]);
        int minute = Integer.parseInt(parts[1]);

        // Persist alarm so BootReceiver can restore it
        try {
            JSONObject json = new JSONObject();
            json.put("id",    id);
            json.put("label", label);
            json.put("time",  time);
            json.put("days",  days != null ? days : new JSArray());
            getPrefs().edit().putString("alarm_" + id, json.toString()).apply();
        } catch (JSONException e) {
            call.reject("Serialization failed");
            return;
        }

        // Register with AlarmManager
        try {
            if (days == null || days.length() == 0) {
                doSchedule(id, label, hour, minute, -1, 0, false);
            } else {
                for (int i = 0; i < days.length(); i++) {
                    doSchedule(id, label, hour, minute, days.getInt(i), i + 1, true);
                }
            }
        } catch (JSONException e) {
            call.reject("Scheduling failed");
            return;
        }

        call.resolve();
    }

    @PluginMethod
    public void cancel(PluginCall call) {
        String id = call.getString("id");
        if (id == null) { call.reject("id required"); return; }
        doCancel(id);
        call.resolve();
    }

    @PluginMethod
    public void cancelAll(PluginCall call) {
        for (String key : getPrefs().getAll().keySet()) {
            if (key.startsWith("alarm_")) doCancel(key.substring(6));
        }
        getPrefs().edit().remove("pending_alarm").apply();
        call.resolve();
    }

    /**
     * Returns the alarm ID that fired while the app was closed, then clears it.
     * Call this once on app startup to detect cold-start alarm launches.
     */
    @PluginMethod
    public void getPendingAlarm(PluginCall call) {
        String pendingId = getPrefs().getString("pending_alarm", "");
        getPrefs().edit().remove("pending_alarm").apply();
        JSObject result = new JSObject();
        result.put("alarmId", pendingId.isEmpty() ? null : pendingId);
        call.resolve(result);
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add android/app/src/main/java/com/morninmate/app/AlarmPlugin.java
git commit -m "feat(android): add AlarmPlugin Capacitor bridge (schedule/cancel/getPendingAlarm)"
```

---

## Task 5: Update MainActivity.java

**Files:**
- Modify: `android/app/src/main/java/com/morninmate/app/MainActivity.java`

Register `AlarmPlugin` with Capacitor and handle the alarm launch intent. When `alarmId` is present, turn the screen on and show the app over the lock screen. For backgrounded launches (`onNewIntent`), also fire a JS event so `AppContext` can react immediately.

- [ ] **Step 1: Replace the file**

```java
package com.morninmate.app;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(AlarmPlugin.class);
        super.onCreate(savedInstanceState);
        applyAlarmWindowFlags(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        String alarmId = intent.getStringExtra("alarmId");
        if (alarmId != null && !alarmId.isEmpty()) {
            applyAlarmWindowFlags(intent);
            // App is already running — fire JS event immediately via the bridge
            getBridge().getWebView().post(() ->
                getBridge().triggerJSEvent(
                    "alarmFired",
                    "document",
                    "{\"alarmId\":\"" + alarmId + "\"}")
            );
        }
    }

    private void applyAlarmWindowFlags(Intent intent) {
        if (intent == null) return;
        String alarmId = intent.getStringExtra("alarmId");
        if (alarmId == null || alarmId.isEmpty()) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) { // API 27+
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON  |
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        }
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add android/app/src/main/java/com/morninmate/app/MainActivity.java
git commit -m "feat(android): register AlarmPlugin and handle alarm launch intent in MainActivity"
```

---

## Task 6: Update nativeAlarms.js

**Files:**
- Modify: `src/lib/nativeAlarms.js`

Replace the `@capacitor/local-notifications` scheduling with `AlarmPlugin`. Keeps the same public function names so `AppContext` imports don't break. Adds `getPendingAlarm()` for cold-start detection.

- [ ] **Step 1: Replace the file**

```javascript
/**
 * nativeAlarms.js
 * Wraps the native AlarmPlugin for scheduling exact Android alarms.
 * Falls back gracefully on web (no-ops).
 */

import { Capacitor, registerPlugin } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export const isNative = Capacitor.isNativePlatform();

const AlarmPlugin = registerPlugin('AlarmPlugin');

// ─── Permissions ─────────────────────────────────────────────────────────────
// On Android 13+, POST_NOTIFICATIONS is auto-prompted when the first
// notification is posted. No manual request needed from JS.

export async function requestNotificationPermission() {
  if (!isNative) {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      return Notification.requestPermission();
    }
  }
}

// ─── Schedule ─────────────────────────────────────────────────────────────────

export async function scheduleAlarm(alarm) {
  if (!isNative || !alarm.active) return;
  await cancelAlarmNotifications(alarm.id);
  try {
    await AlarmPlugin.schedule({
      id:    alarm.id,
      label: alarm.label || '',
      time:  alarm.time,
      days:  alarm.days || [],
    });
  } catch (e) {
    console.warn('Failed to schedule alarm:', e);
  }
}

// ─── Cancel ───────────────────────────────────────────────────────────────────

export async function cancelAlarmNotifications(alarmId) {
  if (!isNative) return;
  try {
    await AlarmPlugin.cancel({ id: alarmId });
  } catch (_) {}
}

// ─── Sync all (called after loading alarms from Supabase) ─────────────────────

export async function syncAllAlarms(alarms) {
  if (!isNative) return;
  for (const alarm of alarms) {
    if (alarm.active) await scheduleAlarm(alarm);
    else await cancelAlarmNotifications(alarm.id);
  }
}

// ─── Pending alarm (cold-start detection) ─────────────────────────────────────
// Returns the ID of an alarm that fired while the app was closed, then clears it.
// Call once after alarms are loaded in AppContext.

export async function getPendingAlarm() {
  if (!isNative) return null;
  try {
    const { alarmId } = await AlarmPlugin.getPendingAlarm();
    return alarmId || null;
  } catch (_) {
    return null;
  }
}

// ─── Haptics ──────────────────────────────────────────────────────────────────

export async function vibrateAlarm() {
  if (!isNative) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Heavy });
    setTimeout(() => Haptics.impact({ style: ImpactStyle.Heavy }), 300);
    setTimeout(() => Haptics.impact({ style: ImpactStyle.Heavy }), 600);
  } catch (_) {}
}

export async function vibrateSuccess() {
  if (!isNative) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch (_) {}
}

// ─── Notification tap listener ────────────────────────────────────────────────
// Kept as a no-op for API compatibility — alarm firing is now handled via
// AlarmPlugin.getPendingAlarm() (cold start) and the 'alarmFired' document
// event (backgrounded app).

export function onNotificationTap() {
  return () => {};
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/nativeAlarms.js
git commit -m "feat(js): replace LocalNotifications scheduling with AlarmPlugin"
```

---

## Task 7: Update AppContext.jsx

**Files:**
- Modify: `src/context/AppContext.jsx`

Two changes:
1. Add `getPendingAlarm` import and call it in `loadUserData` after alarms are fetched (cold-start case).
2. Add a `document` event listener for `alarmFired` (backgrounded-app case, fired from `MainActivity.onNewIntent`).

- [ ] **Step 1: Update the import line at the top of AppContext.jsx**

Find this import block (lines 1–11):
```javascript
import {
  isNative,
  requestNotificationPermission,
  scheduleAlarm,
  cancelAlarmNotifications,
  syncAllAlarms,
  vibrateAlarm,
  onNotificationTap,
} from '../lib/nativeAlarms';
```

Replace with:
```javascript
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

- [ ] **Step 2: Add the alarmFired event listener effect**

After the existing `onNotificationTap` effect (around line 186), add this new `useEffect`:

```javascript
  // ─── alarmFired event (backgrounded-app case) ────────────────────────────────
  // MainActivity.onNewIntent() fires this when an alarm launches the app
  // while it is already running in the background.

  useEffect(() => {
    function handleAlarmFired(e) {
      let alarmId;
      try { alarmId = JSON.parse(e.detail).alarmId; } catch (_) { alarmId = e.detail?.alarmId; }
      if (!alarmId || activeRef.current) return;
      const alarm = alarmsRef.current.find(a => a.id === alarmId);
      if (alarm) { vibrateAlarm(); setActiveAlarm(alarm); }
    }
    document.addEventListener('alarmFired', handleAlarmFired);
    return () => document.removeEventListener('alarmFired', handleAlarmFired);
  }, []); // Uses refs — safe to register once on mount
```

- [ ] **Step 3: Add pending alarm check inside loadUserData**

Find this block inside `loadUserData` (around line 205–213):
```javascript
    if (alarmsResult.data) {
      const mapped = alarmsResult.data.map(a => ({
        id: a.id, label: a.label, time: a.time,
        sound: a.pulse?.sound || 'classic',
        pulse: a.pulse, active: a.active, days: (a.days || []).map(Number),
      }));
      setAlarms(mapped);
      syncAllAlarms(mapped);
    }
```

Replace with:
```javascript
    if (alarmsResult.data) {
      const mapped = alarmsResult.data.map(a => ({
        id: a.id, label: a.label, time: a.time,
        sound: a.pulse?.sound || 'classic',
        pulse: a.pulse, active: a.active, days: (a.days || []).map(Number),
      }));
      setAlarms(mapped);
      syncAllAlarms(mapped);

      // Cold-start: check if an alarm fired while the app was closed
      const pendingAlarmId = await getPendingAlarm();
      if (pendingAlarmId) {
        const alarm = mapped.find(a => a.id === pendingAlarmId);
        if (alarm) { vibrateAlarm(); setActiveAlarm(alarm); }
      }
    }
```

- [ ] **Step 4: Commit**

```bash
git add src/context/AppContext.jsx
git commit -m "feat(js): handle cold-start and backgrounded alarm firing in AppContext"
```

---

## Task 8: Build, Sync, and Test on Emulator

- [ ] **Step 1: Build the React app and sync to Android**

Run from the project root (`C:\dev\MorninMate`):
```bash
npm run build && npx cap sync android
```

Expected: no build errors. Android assets updated in `android/app/src/main/assets/public/`.

- [ ] **Step 2: Open Android Studio and sync Gradle**

In Android Studio: **File → Sync Project with Gradle Files** (or click the elephant icon in the toolbar).  
Expected: Gradle syncs successfully. No compile errors.

- [ ] **Step 3: Grant "Alarms & Reminders" permission (Android 12+ only)**

On Android 12 (API 31–32), exact alarms require manual permission:
1. Run the app on the emulator once
2. Go to **Settings → Apps → MorninMate → Alarms & Reminders**
3. Toggle it ON

On Android 13+ (`USE_EXACT_ALARM` is in the manifest), this step is not needed.

- [ ] **Step 4: Test cold-start alarm firing**

1. In the app, create an alarm set **2 minutes from the current emulator time**
2. Press the Android **Home** button to close the app (send to background), then swipe it away from recents to kill it
3. Wait for the alarm time
4. Expected: screen turns on, MorninMate opens over the lock screen showing `WakeUpFlow`

- [ ] **Step 5: Test backgrounded alarm firing**

1. Create another alarm set **2 minutes from now**
2. Press Home (app goes to background — do NOT swipe away)
3. Wait for alarm time
4. Expected: screen turns on, app comes to foreground, `WakeUpFlow` shows

- [ ] **Step 6: Test alarm cancellation**

1. Create an alarm 1 minute from now
2. Toggle it OFF in the Home screen before it fires
3. Wait past the alarm time
4. Expected: nothing happens — alarm was cancelled
