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
                JSONObject json  = new JSONObject((String) entry.getValue());
                String  alarmId  = json.getString("id");
                String  label    = json.optString("label", "Alarm");
                String[] parts   = json.getString("time").split(":");
                int     hour     = Integer.parseInt(parts[0]);
                int     minute   = Integer.parseInt(parts[1]);
                JSONArray days   = json.optJSONArray("days");

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
