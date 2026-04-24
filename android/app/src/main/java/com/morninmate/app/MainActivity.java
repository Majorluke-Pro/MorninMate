package com.morninmate.app;

import android.content.Intent;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.HapticFeedbackConstants;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebView;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    public static boolean isHardcoreLocked = false;
    public static boolean isAppVisible = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(AlarmPlugin.class);
        super.onCreate(savedInstanceState);
        applyAppShell();
        applyAlarmWindowFlags(getIntent());
        NativeBottomNavKt.setupNativeBottomNav(this, tabIndex ->
            getBridge().triggerJSEvent(
                "navTabChanged",
                "document",
                "{\"tab\":" + tabIndex + "}")
        );
    }

    @Override
    public void onStart() {
        super.onStart();
        isAppVisible = true;
    }

    @Override
    public void onStop() {
        isAppVisible = false;
        super.onStop();
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
        if (isHardcoreLocked) {
            getWindow().getDecorView().performHapticFeedback(HapticFeedbackConstants.REJECT);
            return;
        }
        super.onBackPressed();
    }

    private void applyAppShell() {
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarColor(Color.TRANSPARENT);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            WindowManager.LayoutParams attrs = getWindow().getAttributes();
            attrs.layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            getWindow().setAttributes(attrs);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            getWindow().setStatusBarContrastEnforced(false);
            getWindow().setNavigationBarContrastEnforced(false);
        }

        WindowInsetsControllerCompat controller =
            new WindowInsetsControllerCompat(getWindow(), getWindow().getDecorView());
        controller.setAppearanceLightStatusBars(false);
        controller.setAppearanceLightNavigationBars(false);

        WebView webView = getBridge().getWebView();
        webView.setBackgroundColor(Color.TRANSPARENT);
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webView.setVerticalScrollBarEnabled(false);
        webView.setHorizontalScrollBarEnabled(false);
        webView.setHapticFeedbackEnabled(true);
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
