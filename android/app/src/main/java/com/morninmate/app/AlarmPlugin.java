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
}
