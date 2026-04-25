package com.morninmate.app;

import android.app.Activity;
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

import org.json.JSONObject;

public class MainActivity extends BridgeActivity {

    public static boolean isHardcoreLocked = false;
    public static boolean isAppVisible = false;
    private static final int REQUEST_NATIVE_ALARM_EDITOR = 6407;
    private String pendingAlarmEditorAction = "";
    private String pendingAlarmEditorId = "";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(AlarmPlugin.class);
        super.onCreate(savedInstanceState);
        applyAppShell();
        applyAlarmWindowFlags(getIntent());
        NativeBottomNavKt.setupNativeBottomNav(this, tabIndex ->
        {
            WebView webView = getBridge().getWebView();
            if (tabIndex == 2) {
                webView.post(() -> {
                    webView.evaluateJavascript(
                            "document.dispatchEvent(new CustomEvent('navTabChanged',{detail:{tab:2}}));",
                            null
                    );
                    webView.postDelayed(() -> {
                        NativeAlarmsScreenKt.setNativeAlarmsScreenVisible(false);
                        NativeStatsScreenKt.setNativeStatsScreenVisible(false);
                    }, 80);
                });
                return;
            }

            NativeAlarmsScreenKt.setNativeAlarmsScreenVisible(tabIndex == 0);
            NativeStatsScreenKt.setNativeStatsScreenVisible(tabIndex == 1);
            webView.post(() ->
                    webView.evaluateJavascript(
                            "document.dispatchEvent(new CustomEvent('navTabChanged',{detail:{tab:" + tabIndex + "}}));",
                            null
                    )
            );
        }
        );
        NativeStatsScreenKt.setupNativeStatsScreen(this);
        NativeAlarmsScreenKt.setupNativeAlarmsScreen(this);
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

    public void openNativeAlarmEditor(String action, String alarmId, String defaultTime, String alarmJson) {
        pendingAlarmEditorAction = action != null ? action : "create";
        pendingAlarmEditorId = alarmId != null ? alarmId : "";

        Intent intent = new Intent(this, CreateAlarmActivity.class);
        if (defaultTime != null && !defaultTime.isEmpty()) {
            intent.putExtra("defaultTime", defaultTime);
        }
        if (alarmJson != null && !alarmJson.isEmpty()) {
            intent.putExtra("alarm", alarmJson);
        }
        startActivityForResult(intent, REQUEST_NATIVE_ALARM_EDITOR);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != REQUEST_NATIVE_ALARM_EDITOR) return;

        if (resultCode != Activity.RESULT_OK || data == null) {
            pendingAlarmEditorAction = "";
            pendingAlarmEditorId = "";
            return;
        }

        String alarmJson = data.getStringExtra("alarm");
        if (alarmJson == null || alarmJson.isEmpty()) {
            pendingAlarmEditorAction = "";
            pendingAlarmEditorId = "";
            return;
        }

        String detail = "{"
            + "\"action\":" + JSONObject.quote(pendingAlarmEditorAction) + ","
            + "\"id\":" + JSONObject.quote(pendingAlarmEditorId) + ","
            + "\"alarm\":" + alarmJson
            + "}";
        String script = "document.dispatchEvent(new CustomEvent('nativeAlarmEditorResult',{detail:" + detail + "}));";
        getBridge().getWebView().post(() -> getBridge().getWebView().evaluateJavascript(script, null));

        pendingAlarmEditorAction = "";
        pendingAlarmEditorId = "";
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
