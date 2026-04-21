package com.morninmate.app;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.util.Log;
import androidx.core.app.NotificationCompat;

public class AlarmService extends Service {

    private static final String TAG = "AlarmService";
    private static final String CHANNEL_ID = "morninmate_alarm";
    private static final int NOTIF_ID = 7654;
    private static final int NAG_OFFSET = 9999;
    private static final long NAG_DELAY_MS = 10_000L;
    private static final String FALLBACK_SOUND = "gentle_chime";

    private PowerManager.WakeLock wakeLock;
    private MediaPlayer mediaPlayer;
    private Ringtone ringtone;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable stopPreviewRunnable = this::stopSelf;

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String alarmId = intent != null ? intent.getStringExtra("alarmId") : null;
        String label = intent != null ? intent.getStringExtra("label") : "Alarm";
        String sound = intent != null ? intent.getStringExtra("sound") : FALLBACK_SOUND;
        int previewMs = intent != null ? intent.getIntExtra("previewMs", -1) : -1;
        boolean previewOnly = previewMs > 0;

        Log.d(TAG, "onStartCommand alarmId=" + alarmId + " sound=" + sound + " preview=" + previewOnly);

        handler.removeCallbacks(stopPreviewRunnable);
        stopPlayback();
        releaseWakeLock();

        if (!previewOnly) {
            acquireWakeLock();
        }

        createNotificationChannel();

        Intent mainIntent = new Intent(this, MainActivity.class);
        mainIntent.putExtra("alarmId", alarmId);
        mainIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK
            | Intent.FLAG_ACTIVITY_CLEAR_TOP
            | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        int baseCode = alarmId != null ? alarmId.hashCode() : 0;
        PendingIntent contentPi = PendingIntent.getActivity(
            this,
            baseCode,
            mainIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        String body = (label != null && !label.isEmpty())
            ? label + " \u2014 Rise & Shine!"
            : "Rise & Shine, Legend!";

        int iconResId = getResources().getIdentifier("ic_launcher_foreground", "drawable", getPackageName());
        if (iconResId == 0) iconResId = android.R.drawable.ic_dialog_alert;

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(iconResId)
            .setContentTitle("MorninMate")
            .setContentText(previewOnly ? "Previewing alarm sound" : body)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(previewOnly ? NotificationCompat.CATEGORY_SERVICE : NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(true)
            .setContentIntent(contentPi)
            .build();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                NOTIF_ID,
                notification,
                android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
            );
        } else {
            startForeground(NOTIF_ID, notification);
        }

        playSound(sound, !previewOnly);

        if (previewOnly) {
            handler.postDelayed(stopPreviewRunnable, previewMs);
            return START_NOT_STICKY;
        }

        startActivity(mainIntent);
        scheduleNagAlarm(alarmId, label, sound);
        return START_NOT_STICKY;
    }

    @Override
    public void onDestroy() {
        Log.d(TAG, "onDestroy - stopping playback and releasing WakeLock");
        handler.removeCallbacks(stopPreviewRunnable);
        stopPlayback();
        releaseWakeLock();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void acquireWakeLock() {
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "MorninMate::AlarmWakeLock");
        wakeLock.acquire(10 * 60 * 1000L);
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(
                CHANNEL_ID,
                "Alarms",
                NotificationManager.IMPORTANCE_HIGH
            );
            ch.setDescription("MorninMate alarm alerts");
            ch.setBypassDnd(true);
            ch.enableVibration(true);
            ch.setSound(null, null);
            getSystemService(NotificationManager.class).createNotificationChannel(ch);
        }
    }

    private void scheduleNagAlarm(String alarmId, String label, String sound) {
        if (alarmId == null || alarmId.isEmpty()) {
            return;
        }

        Intent nagIntent = new Intent(this, NagAlarmReceiver.class);
        nagIntent.putExtra("alarmId", alarmId);
        nagIntent.putExtra("label", label);
        nagIntent.putExtra("sound", sound);

        PendingIntent nagPi = PendingIntent.getBroadcast(
            this,
            nagRequestCode(alarmId),
            nagIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        AlarmManager am = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
        long triggerAt = System.currentTimeMillis() + NAG_DELAY_MS;
        am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, nagPi);
        Log.d(TAG, "Scheduled nag alarm for " + alarmId + " at " + triggerAt);
    }

    private void playSound(String sound, boolean loop) {
        String resolvedSound = (sound == null || sound.isEmpty()) ? FALLBACK_SOUND : sound;
        try {
            if (resolvedSound.startsWith(ContentResolver.SCHEME_CONTENT)) {
                ringtone = RingtoneManager.getRingtone(this, Uri.parse(resolvedSound));
                if (ringtone == null) {
                    playSound(FALLBACK_SOUND, loop);
                    return;
                }
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                    ringtone.setLooping(loop);
                }
                ringtone.setStreamType(android.media.AudioManager.STREAM_ALARM);
                ringtone.play();
                return;
            }

            int resId = getResources().getIdentifier(resolvedSound, "raw", getPackageName());
            if (resId == 0) {
                if (!FALLBACK_SOUND.equals(resolvedSound)) {
                    playSound(FALLBACK_SOUND, loop);
                }
                return;
            }

            mediaPlayer = MediaPlayer.create(this, resId);
            if (mediaPlayer == null) return;
            mediaPlayer.setAudioAttributes(
                new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build()
            );
            mediaPlayer.setLooping(loop);
            mediaPlayer.start();
        } catch (Exception ignored) {
            if (!FALLBACK_SOUND.equals(resolvedSound)) {
                playSound(FALLBACK_SOUND, loop);
            }
        }
    }

    private void stopPlayback() {
        if (mediaPlayer != null) {
            try {
                if (mediaPlayer.isPlaying()) mediaPlayer.stop();
            } catch (Exception ignored) {}
            mediaPlayer.release();
            mediaPlayer = null;
        }

        if (ringtone != null) {
            try {
                if (ringtone.isPlaying()) ringtone.stop();
            } catch (Exception ignored) {}
            ringtone = null;
        }
    }

    private void releaseWakeLock() {
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        wakeLock = null;
    }

    static int nagRequestCode(String alarmId) {
        int baseCode = alarmId != null ? alarmId.hashCode() : 0;
        return baseCode + NAG_OFFSET;
    }
}
