package com.morninmate.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class AlarmDismissReceiver extends BroadcastReceiver {

    private static final String PREFS_NAME = "MorninMateAlarms";

    @Override
    public void onReceive(Context context, Intent intent) {
        String alarmId = intent.getStringExtra("alarmId");
        Log.d("AlarmDismissReceiver", "Dismiss tapped for alarmId=" + alarmId);

        // Stop the foreground service (releases WakeLock + stops ringtone)
        context.stopService(new Intent(context, AlarmService.class));

        // Clear pending_alarm so a subsequent cold-start doesn't re-trigger the alarm UI
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit().remove("pending_alarm").apply();
    }
}
