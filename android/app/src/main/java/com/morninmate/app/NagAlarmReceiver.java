package com.morninmate.app;

import android.content.BroadcastReceiver;
import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

public class NagAlarmReceiver extends BroadcastReceiver {

    private static final String TAG = "NagAlarmReceiver";
    private static final String PREFS_NAME = "MorninMateAlarms";

    @Override
    public void onReceive(Context context, Intent intent) {
        String alarmId = intent.getStringExtra("alarmId");
        String label = intent.getStringExtra("label");
        String sound = intent.getStringExtra("sound");
        Log.d(TAG, "onReceive alarmId=" + alarmId);

        if (alarmId == null || alarmId.isEmpty()) {
            return;
        }

        String pendingAlarm = context
            .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .getString("pending_alarm", "");

        if (!alarmId.equals(pendingAlarm)) {
            Log.d(TAG, "Skipping nag restart because pending_alarm no longer matches");
            return;
        }

        if (MainActivity.isAppVisible) {
            Log.d(TAG, "App is visible, deferring nag restart");
            reschedule(context, alarmId, label, sound);
            return;
        }

        Intent serviceIntent = new Intent(context, AlarmService.class);
        serviceIntent.putExtra("alarmId", alarmId);
        serviceIntent.putExtra("label", label);
        serviceIntent.putExtra("sound", sound);
        serviceIntent.putExtra("previewMs", -1);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent);
        } else {
            context.startService(serviceIntent);
        }
    }

    private void reschedule(Context context, String alarmId, String label, String sound) {
        Intent nagIntent = new Intent(context, NagAlarmReceiver.class);
        nagIntent.putExtra("alarmId", alarmId);
        nagIntent.putExtra("label", label);
        nagIntent.putExtra("sound", sound);

        PendingIntent nagPi = PendingIntent.getBroadcast(
            context,
            AlarmService.nagRequestCode(alarmId),
            nagIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        am.setExactAndAllowWhileIdle(
            AlarmManager.RTC_WAKEUP,
            System.currentTimeMillis() + 10_000L,
            nagPi
        );
    }
}
