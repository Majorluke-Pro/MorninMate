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
        String  alarmId   = intent.getStringExtra("alarmId");
        String  label     = intent.getStringExtra("label");
        int     hour      = intent.getIntExtra("hour", 7);
        int     minute    = intent.getIntExtra("minute", 0);
        boolean repeat    = intent.getBooleanExtra("repeating", false);
        int     targetDay = intent.getIntExtra("targetDay", -1);

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

        // Repeating: reschedule for next week. One-shot: remove from prefs.
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
