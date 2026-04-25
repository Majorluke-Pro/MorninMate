package com.morninmate.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

import java.util.Calendar;

public class AlarmReceiver extends BroadcastReceiver {

    private static final String PREFS_NAME = "MorninMateAlarms";

    @Override
    public void onReceive(Context context, Intent intent) {
        String  alarmId   = intent.getStringExtra("alarmId");
        String  label     = intent.getStringExtra("label");
        String  sound     = intent.getStringExtra("sound");
        int     hour      = intent.getIntExtra("hour", 7);
        int     minute    = intent.getIntExtra("minute", 0);
        boolean repeat    = intent.getBooleanExtra("repeating", false);
        int     targetDay = intent.getIntExtra("targetDay", -1);

        Log.d("AlarmReceiver", "onReceive fired! alarmId=" + alarmId);
        if (alarmId == null) { Log.e("AlarmReceiver", "alarmId is null — ignoring"); return; }

        // Persist alarm ID so the native launch screen can react on cold start.
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit().putString("pending_alarm", alarmId).apply();

        // Delegate to AlarmService — it handles WakeLock, ringtone, and notification
        Intent serviceIntent = new Intent(context, AlarmService.class);
        serviceIntent.putExtra("alarmId", alarmId);
        serviceIntent.putExtra("label",   label);
        serviceIntent.putExtra("sound",   sound);
        serviceIntent.putExtra("previewMs", -1);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent);
        } else {
            context.startService(serviceIntent);
        }

        // Repeating: reschedule for next week. One-shot: remove from prefs.
        if (repeat && targetDay >= 0) {
            reschedule(context, alarmId, label, sound, hour, minute, targetDay);
        } else {
            context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .edit().remove("alarm_" + alarmId).apply();
        }
    }

    private void reschedule(Context context, String alarmId, String label, String sound,
                             int hour, int minute, int targetDay) {
        // Same weekday, exactly one week from now
        Calendar cal = Calendar.getInstance();
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        cal.set(Calendar.HOUR_OF_DAY, hour);
        cal.set(Calendar.MINUTE, minute);
        cal.add(Calendar.DAY_OF_YEAR, 7);

        Intent intent = new Intent(context, AlarmReceiver.class);
        intent.putExtra("alarmId",   alarmId);
        intent.putExtra("label",     label);
        intent.putExtra("sound",     sound);
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
