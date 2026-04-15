package com.morninmate.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class AlarmDismissReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        String alarmId = intent.getStringExtra("alarmId");
        Log.d("AlarmDismissReceiver", "Dismiss tapped for alarmId=" + alarmId);

        // Defensive fallback in case this receiver is still triggered from an older build.
        // The separate nag alarm will restart the alarm unless tasks were completed in-app.
        context.stopService(new Intent(context, AlarmService.class));
    }
}
