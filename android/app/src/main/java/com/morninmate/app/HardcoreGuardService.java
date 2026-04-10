package com.morninmate.app;

import android.app.Application;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;

import androidx.core.app.NotificationCompat;

import java.util.concurrent.atomic.AtomicInteger;

public class HardcoreGuardService extends Service {

    private static final String CHANNEL_ID = "morninmate_hardcore_guard";
    private static final int    NOTIF_ID   = 7655;

    private final AtomicInteger activitiesStarted = new AtomicInteger(0);
    private Application.ActivityLifecycleCallbacks lifecycleCallbacks;

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        createNotificationChannel();
        startForeground(NOTIF_ID, buildNotification());

        lifecycleCallbacks = new Application.ActivityLifecycleCallbacks() {
            @Override public void onActivityCreated(android.app.Activity a, android.os.Bundle b) {}
            @Override public void onActivityResumed(android.app.Activity a) {}
            @Override public void onActivityPaused(android.app.Activity a) {}
            @Override public void onActivitySaveInstanceState(android.app.Activity a, android.os.Bundle b) {}
            @Override public void onActivityDestroyed(android.app.Activity a) {}

            @Override
            public void onActivityStarted(android.app.Activity activity) {
                activitiesStarted.incrementAndGet();
            }

            @Override
            public void onActivityStopped(android.app.Activity activity) {
                if (activitiesStarted.decrementAndGet() <= 0 && MainActivity.isHardcoreLocked) {
                    relaunchApp();
                }
            }
        };

        ((Application) getApplicationContext()).registerActivityLifecycleCallbacks(lifecycleCallbacks);
        return START_STICKY;
    }

    private void relaunchApp() {
        Intent launch = new Intent(this, MainActivity.class);
        launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        startActivity(launch);
    }

    @Override
    public void onDestroy() {
        if (lifecycleCallbacks != null) {
            ((Application) getApplicationContext())
                .unregisterActivityLifecycleCallbacks(lifecycleCallbacks);
        }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }

    private Notification buildNotification() {
        int iconResId = getResources().getIdentifier(
            "ic_launcher_foreground", "drawable", getPackageName());
        if (iconResId == 0) iconResId = android.R.drawable.ic_dialog_alert;

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(iconResId)
            .setContentTitle("MorninMate Hardcore")
            .setContentText("Finish your games to dismiss the alarm.")
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(
                CHANNEL_ID, "Hardcore Guard", NotificationManager.IMPORTANCE_LOW);
            ch.setDescription("Keeps hardcore alarm active if app is backgrounded");
            getSystemService(NotificationManager.class).createNotificationChannel(ch);
        }
    }
}
