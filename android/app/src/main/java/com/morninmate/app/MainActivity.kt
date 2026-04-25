package com.morninmate.app

import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.view.HapticFeedbackConstants
import android.view.WindowManager
import android.widget.FrameLayout
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat
import org.json.JSONObject

class MainActivity : ComponentActivity() {
    private var pendingAlarmEditorId = ""
    private var selectedTab = 0

    private val alarmEditor = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult(),
    ) { result ->
        if (result.resultCode != Activity.RESULT_OK) {
            pendingAlarmEditorId = ""
            return@registerForActivityResult
        }
        val alarmJson = result.data?.getStringExtra("alarm").orEmpty()
        if (alarmJson.isNotBlank()) {
            NativeAlarmStore.save(
                this,
                JSONObject(alarmJson),
                pendingAlarmEditorId.takeIf { it.isNotBlank() },
            )
            refreshNativeScreens()
        }
        pendingAlarmEditorId = ""
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        applyAppShell()
        applyAlarmWindowFlags(intent)
        setContentView(FrameLayout(this))

        setupNativeBottomNav(this) { tabIndex ->
            selectedTab = tabIndex
            applySelectedTabVisibility()
        }
        setupNativeStatsScreen(this)
        setupNativeAlarmsScreen(this)
        setupNativeProfileScreen(this)
        setupNativeRingingAlarmScreen(this)
        refreshNativeScreens()
        handleAlarmIntent(intent)
        setNativeBottomNavVisible(true)
        applySelectedTabVisibility()
    }

    override fun onStart() {
        super.onStart()
        isAppVisible = true
    }

    override fun onStop() {
        isAppVisible = false
        super.onStop()
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        applyAlarmWindowFlags(intent)
        refreshNativeScreens()
        handleAlarmIntent(intent)
    }

    fun openNativeAlarmEditor(action: String, alarmId: String, defaultTime: String, alarmJson: String) {
        pendingAlarmEditorId = if (action == "edit") alarmId else ""
        alarmEditor.launch(Intent(this, CreateAlarmActivity::class.java).apply {
            if (defaultTime.isNotBlank()) putExtra("defaultTime", defaultTime)
            if (alarmJson.isNotBlank()) putExtra("alarm", alarmJson)
        })
    }

    fun handleNativeAlarmAction(action: String, id: String?) {
        when (action) {
            "delete" -> id?.let { NativeAlarmStore.delete(this, it) }
            "toggle" -> id?.let { NativeAlarmStore.toggle(this, it) }
            "test" -> id?.let {
                NativeAlarmStore.test(this, it)
                NativeAlarmStore.ringingAlarm(this, it)?.let(::showNativeRingingAlarm)
            }
            "settings" -> NativeAlarmStore.requestAlarmPermissions(this)
            "logOff" -> NativeAlarmStore.logOff(this)
            "deleteData" -> NativeAlarmStore.deleteData(this)
            "refresh" -> Unit
        }
        refreshNativeScreens()
    }

    fun dismissNativeAlarm(id: String?) {
        NativeAlarmStore.dismissAlarm(this, id)
        hideNativeRingingAlarm()
        refreshNativeScreens()
    }

    fun handleNativeAlarmActiveChange(id: String, active: Boolean) {
        Thread {
            val changed = NativeAlarmStore.setActive(this, id, active)
            runOnUiThread {
                refreshNativeScreens()
                if (active && !changed) {
                    NativeAlarmStore.requestAlarmPermissions(this)
                }
            }
        }.start()
    }

    override fun onBackPressed() {
        if (isHardcoreLocked) {
            window.decorView.performHapticFeedback(HapticFeedbackConstants.REJECT)
            return
        }
        super.onBackPressed()
    }

    private fun refreshNativeScreens() {
        showNativeAlarms(NativeAlarmStore.data(this))
        showNativeStats(NativeAlarmStore.stats(this))
        showNativeProfile(NativeAlarmStore.profile(this))
        applySelectedTabVisibility()
    }

    private fun handleAlarmIntent(intent: Intent?) {
        val alarmId = intent?.getStringExtra("alarmId")
            ?: getSharedPreferences("MorninMateAlarms", MODE_PRIVATE).getString("pending_alarm", null)
        val alarm = NativeAlarmStore.ringingAlarm(this, alarmId)
        if (alarm != null) {
            showNativeRingingAlarm(alarm)
        }
    }

    private fun applySelectedTabVisibility() {
        setNativeAlarmsScreenVisible(selectedTab == 0)
        setNativeStatsScreenVisible(selectedTab == 1)
        setNativeProfileScreenVisible(selectedTab == 2)
    }

    private fun applyAppShell() {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.setStatusBarColor(Color.TRANSPARENT)
        window.setNavigationBarColor(Color.TRANSPARENT)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            val attrs = window.attributes
            attrs.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
            window.attributes = attrs
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.isStatusBarContrastEnforced = false
            window.isNavigationBarContrastEnforced = false
        }

        WindowInsetsControllerCompat(window, window.decorView).apply {
            isAppearanceLightStatusBars = false
            isAppearanceLightNavigationBars = false
        }
    }

    private fun applyAlarmWindowFlags(intent: Intent?) {
        val alarmId = intent?.getStringExtra("alarmId")
        if (alarmId.isNullOrBlank()) return
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        } else {
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                    WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                    WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,
            )
        }
    }

    companion object {
        @JvmField var isHardcoreLocked: Boolean = false
        @JvmField var isAppVisible: Boolean = false
    }
}
