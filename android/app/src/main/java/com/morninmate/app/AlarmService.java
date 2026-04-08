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
