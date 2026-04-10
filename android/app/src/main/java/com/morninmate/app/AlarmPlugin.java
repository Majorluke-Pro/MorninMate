package com.morninmate.app;

import android.app.AlarmManager;
import android.media.AudioManager;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import android.util.Log;

import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationManagerCompat;

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
    private int savedAlarmVolume = -1;

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

        int today     = cal.get(Calendar.DAY_OF_WEEK) - 1; // 0 = Sunday
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
        Log.d("AlarmPlugin", "doSchedule: id=" + alarmId + " triggerAt=" + triggerAt
            + " now=" + System.currentTimeMillis()
            + " sdk=" + Build.VERSION.SDK_INT);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            boolean canSchedule = am.canScheduleExactAlarms();
            Log.d("AlarmPlugin", "canScheduleExactAlarms=" + canSchedule);
            if (canSchedule) {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pi);
                Log.d("AlarmPlugin", "Alarm set successfully");
            } else {
                Log.e("AlarmPlugin", "BLOCKED: canScheduleExactAlarms=false — alarm NOT scheduled");
            }
        } else {
            am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pi);
            Log.d("AlarmPlugin", "Alarm set (pre-S)");
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

        // Persist so BootReceiver can restore after reboot
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
        Map<String, ?> all = getPrefs().getAll();
        for (String key : all.keySet()) {
            if (key.startsWith("alarm_")) doCancel(key.substring(6));
        }
        getPrefs().edit().remove("pending_alarm").apply();
        call.resolve();
    }

    /**
     * Returns the ID of an alarm that fired while the app was closed, then clears it.
     * Call once after alarms are loaded in AppContext to detect cold-start launches.
     */
    @PluginMethod
    public void getPendingAlarm(PluginCall call) {
        String pendingId = getPrefs().getString("pending_alarm", "");
        getPrefs().edit().remove("pending_alarm").apply();
        JSObject result = new JSObject();
        result.put("alarmId", pendingId.isEmpty() ? null : pendingId);
        call.resolve(result);
    }

    @PluginMethod
    public void dismissAlarm(PluginCall call) {
        String id = call.getString("id");
        Log.d("AlarmPlugin", "dismissAlarm id=" + id);
        getContext().stopService(new Intent(getContext(), AlarmService.class));
        getPrefs().edit().remove("pending_alarm").apply();
        call.resolve();
    }

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

    @PluginMethod
    public void setHardcoreVolume(PluginCall call) {
        AudioManager audio = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
        savedAlarmVolume = audio.getStreamVolume(AudioManager.STREAM_ALARM);
        int maxVolume = audio.getStreamMaxVolume(AudioManager.STREAM_ALARM);
        audio.setStreamVolume(AudioManager.STREAM_ALARM, maxVolume, 0);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            audio.adjustStreamVolume(AudioManager.STREAM_ALARM, AudioManager.ADJUST_UNMUTE, 0);
        }
        call.resolve();
    }

    @PluginMethod
    public void enableHardcoreLock(PluginCall call) {
        MainActivity.isHardcoreLocked = true;
        Intent guardIntent = new Intent(getContext(), HardcoreGuardService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(guardIntent);
        } else {
            getContext().startService(guardIntent);
        }
        call.resolve();
    }

    @PluginMethod
    public void disableHardcoreLock(PluginCall call) {
        MainActivity.isHardcoreLocked = false;
        getContext().stopService(new Intent(getContext(), HardcoreGuardService.class));
        if (savedAlarmVolume >= 0) {
            AudioManager audio = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
            audio.setStreamVolume(AudioManager.STREAM_ALARM, savedAlarmVolume, 0);
            savedAlarmVolume = -1;
        }
        call.resolve();
    }
}
