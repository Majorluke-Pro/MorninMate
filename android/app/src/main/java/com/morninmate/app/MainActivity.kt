package com.morninmate.app

import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.view.HapticFeedbackConstants
import android.view.WindowManager
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.getcapacitor.BridgeActivity
import org.json.JSONTokener
import org.json.JSONObject

class MainActivity : BridgeActivity() {
    private var pendingAlarmEditorId = ""
    private var selectedTab = 0
    private var authSyncScheduled = false
    private var onboardingSyncScheduled = false

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

        setupNativeBottomNav(this) { tabIndex ->
            selectedTab = tabIndex
            applySelectedTabVisibility()
        }
        setupNativeStatsScreen(this)
        setupNativeAlarmsScreen(this)
        setupNativeProfileScreen(this)
        setupNativeRingingAlarmScreen(this)
        setupNativeOnboardingScreen(this)
        applyAppState()
        handleAlarmIntent(intent)
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
                NativeAlarmStore.ringingAlarm(this, it, isTest = true)?.let(::showNativeRingingAlarm)
            }
            "settings" -> NativeAlarmStore.requestAlarmPermissions(this)
            "logOff" -> {
                NativeAlarmStore.logOff(this)
                bridge?.eval(
                    """
                    (function() {
                      try {
                        for (var i = localStorage.length - 1; i >= 0; i--) {
                          var k = localStorage.key(i);
                          if (k && k.startsWith('sb-')) localStorage.removeItem(k);
                        }
                        localStorage.setItem('mm_show_auth_directly', '1');
                        localStorage.removeItem('mm_last_auth_user');
                        window.dispatchEvent(new Event('mmNativeLogOff'));
                        window.dispatchEvent(new Event('mmShowAuthDirectly'));
                      } catch (e) {}
                    })();
                    """.trimIndent(),
                ) { _ ->
                    runOnUiThread {
                        selectNativeTab(0)
                        applyAppState()
                    }
                }
                return
            }
            "deleteData" -> {
                NativeAlarmStore.deleteData(this)
                resetNativeOnboardingScreen()
                selectNativeTab(0)
                applyAppState()
                return
            }
            "refresh" -> Unit
        }
        refreshNativeScreens()
    }

    fun updateNativeProfile(
        userName: String,
        defaultWakeTime: String,
        favoriteGame: String,
        morningRating: Int,
        wakeGoal: String,
        age: String,
        country: String,
        profileIcon: String,
    ) {
        NativeAlarmStore.updateProfile(
            this,
            userName,
            defaultWakeTime,
            favoriteGame,
            morningRating,
            wakeGoal,
            age,
            country,
            profileIcon,
        )
        refreshNativeScreens()
    }

    fun completeNativeOnboarding(
        userName: String,
        defaultWakeTime: String,
        favoriteGame: String,
        morningRating: Int,
        wakeGoal: String,
        age: String,
        country: String,
        profileIcon: String,
    ) {
        NativeAlarmStore.completeOnboarding(
            this,
            userName,
            defaultWakeTime,
            favoriteGame,
            morningRating,
            wakeGoal,
            age,
            country,
            profileIcon,
        )
        selectNativeTab(0)
        applyAppState()
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
        if (NativeAlarmStore.shouldShowAuth(this) || !NativeAlarmStore.isOnboardingComplete(this)) {
            applyAppState()
            return
        }
        showNativeAlarms(NativeAlarmStore.data(this))
        showNativeStats(NativeAlarmStore.stats(this))
        showNativeProfile(NativeAlarmStore.profile(this))
        applySelectedTabVisibility()
    }

    private fun handleAlarmIntent(intent: Intent?) {
        val alarmId = intent?.getStringExtra("alarmId")
            ?: getSharedPreferences("MorninMateAlarms", MODE_PRIVATE).getString("pending_alarm", null)
        val isTest = intent?.getBooleanExtra("testMode", false)
            ?: getSharedPreferences("MorninMateAlarms", MODE_PRIVATE).getBoolean("pending_alarm_test", false)
        val alarm = NativeAlarmStore.ringingAlarm(this, alarmId, isTest)
        if (alarm != null) {
            showNativeRingingAlarm(alarm)
        }
    }

    private fun applySelectedTabVisibility() {
        if (NativeAlarmStore.shouldShowAuth(this) || !NativeAlarmStore.isOnboardingComplete(this)) {
            hideMainNativeScreens()
            return
        }
        setNativeAlarmsScreenVisible(selectedTab == 0)
        setNativeStatsScreenVisible(selectedTab == 1)
        setNativeProfileScreenVisible(selectedTab == 2)
    }

    private fun applyAppState() {
        val showAuth = NativeAlarmStore.shouldShowAuth(this)
        val onboarded = NativeAlarmStore.isOnboardingComplete(this)
        setNativeOnboardingVisible(false)
        setNativeBottomNavVisible(!showAuth && onboarded)
        if (showAuth) {
            hideMainNativeScreens()
            scheduleAuthSync()
        } else if (onboarded) {
            refreshNativeScreens()
        } else {
            hideMainNativeScreens()
            scheduleWebOnboardingSync()
        }
    }

    private fun hideMainNativeScreens() {
        setNativeAlarmsScreenVisible(false)
        setNativeStatsScreenVisible(false)
        setNativeProfileScreenVisible(false)
        hideNativeRingingAlarm()
        setNativeBottomNavVisible(false)
    }

    private fun selectNativeTab(tabIndex: Int) {
        selectedTab = tabIndex
        setNativeBottomNavSelectedTab(tabIndex)
    }

    private fun showWebAuthScreen() {
        bridge?.eval(
            """
            (function() {
              try {
                localStorage.setItem('mm_show_auth_directly', '1');
                localStorage.removeItem('mm_last_auth_user');
                window.dispatchEvent(new Event('mmNativeLogOff'));
                window.dispatchEvent(new Event('mmShowAuthDirectly'));
              } catch (e) {}
            })();
            """.trimIndent(),
            null,
        )
    }

    private fun scheduleAuthSync() {
        if (authSyncScheduled) return
        authSyncScheduled = true
        window.decorView.postDelayed({
            authSyncScheduled = false
            if (!NativeAlarmStore.shouldShowAuth(this)) return@postDelayed
            val currentBridge = bridge
            if (currentBridge == null) {
                scheduleAuthSync()
                return@postDelayed
            }
            currentBridge.eval(
                "(function(){try{var u=localStorage.getItem('mm_last_auth_user');if(!u)return null;var j=JSON.parse(u);var r=(localStorage.getItem('mm_native_reset_needed')==='1'||localStorage.getItem('mm_native_signup_requires_onboarding')==='1')?'1':'0';return (j.email||'')+'|'+r}catch(e){return null}})()",
            ) { value ->
                if (value != null && value != "null" && value.isNotBlank()) {
                    val parts = value.trim('"').split("|")
                    val email = parts.getOrNull(0).orEmpty()
                    val needsReset = parts.getOrNull(1) == "1"
                    if (email.isNotBlank()) {
                        runOnUiThread {
                            if (needsReset) {
                                NativeAlarmStore.resetOnboarding(this)
                                currentBridge.eval("try{localStorage.removeItem('mm_native_reset_needed');localStorage.removeItem('mm_native_signup_requires_onboarding')}catch(e){}", null)
                            }
                            NativeAlarmStore.setEmail(this, email)
                            NativeAlarmStore.setShowAuth(this, false)
                            applyAppState()
                        }
                    } else {
                        scheduleAuthSync()
                    }
                } else {
                    scheduleAuthSync()
                }
            }
        }, 500)
    }

    private fun scheduleWebOnboardingSync() {
        if (onboardingSyncScheduled) return
        onboardingSyncScheduled = true
        window.decorView.postDelayed({
            onboardingSyncScheduled = false
            if (NativeAlarmStore.shouldShowAuth(this) || NativeAlarmStore.isOnboardingComplete(this)) return@postDelayed
            val currentBridge = bridge
            if (currentBridge == null) {
                scheduleWebOnboardingSync()
                return@postDelayed
            }
            currentBridge.eval(
                """
                (function(){
                  try {
                    var raw = localStorage.getItem('mm_native_web_onboarding_complete');
                    if (raw) return raw;
                    var cached = localStorage.getItem('mm_user_cache');
                    if (!cached) return null;
                    var user = JSON.parse(cached);
                    return user && user.onboardingComplete ? JSON.stringify(user) : null;
                  } catch (e) {
                    return null;
                  }
                })()
                """.trimIndent(),
            ) { value ->
                val raw = value?.trim() ?: ""
                if (raw.isBlank() || raw == "null") {
                    scheduleWebOnboardingSync()
                    return@eval
                }
                runCatching {
                    val parsed = JSONTokener(raw).nextValue()
                    when (parsed) {
                        is JSONObject -> parsed
                        is String -> JSONObject(parsed)
                        else -> JSONObject(raw)
                    }
                }.onSuccess { data ->
                    runOnUiThread {
                        NativeAlarmStore.completeOnboarding(
                            this,
                            data.optString("name"),
                            data.optString("wakeTime"),
                            data.optString("favoriteGame"),
                            data.optInt("morningRating", 3),
                            data.optString("wakeGoal"),
                            data.optString("age"),
                            data.optString("country"),
                            data.optString("profileIcon"),
                        )
                        currentBridge.eval("try{localStorage.removeItem('mm_native_web_onboarding_complete')}catch(e){}", null)
                        applyAppState()
                    }
                }.onFailure {
                    scheduleWebOnboardingSync()
                }
            }
        }, 500)
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
