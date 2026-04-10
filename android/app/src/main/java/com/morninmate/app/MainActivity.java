package com.morninmate.app;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    public static boolean isHardcoreLocked = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(AlarmPlugin.class);
        super.onCreate(savedInstanceState);
        applyAlarmWindowFlags(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        String alarmId = intent.getStringExtra("alarmId");
        if (alarmId != null && !alarmId.isEmpty()) {
            applyAlarmWindowFlags(intent);
            // App is already running — fire JS event so AppContext reacts immediately
            getBridge().getWebView().post(() ->
                getBridge().triggerJSEvent(
                    "alarmFired",
                    "document",
                    "{\"alarmId\":\"" + alarmId + "\"}")
            );
        }
    }

    @Override
    public void onBackPressed() {
        if (isHardcoreLocked) return;
        super.onBackPressed();
    }

    private void applyAlarmWindowFlags(Intent intent) {
        if (intent == null) return;
        String alarmId = intent.getStringExtra("alarmId");
        if (alarmId == null || alarmId.isEmpty()) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) { // API 27+
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON  |
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        }
    }
}
