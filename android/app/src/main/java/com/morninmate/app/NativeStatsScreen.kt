package com.morninmate.app

import android.view.View
import android.widget.FrameLayout
import androidx.activity.ComponentActivity
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.ViewCompositionStrategy

internal val StatsBg      = Color(0xFF0D0D1A)
internal val StatsSurface = Color(0xFF141A2B)
internal val StatsDawn    = Color(0xFFFF6B35)
internal val StatsInactive = Color(0x47FFFFFF)
internal val StatsBorder  = Color(0x16FFFFFF)
internal val StatsWin     = Color(0xFF4CAF50)
internal val StatsLoss    = Color(0xFFF44336)
internal val StatsAmber   = Color(0xFFFFC107)

data class StatsData(
    val level: Int,
    val xp: Int,
    val xpPerLevel: Int,
    val streak: Int,
    val demerits: Int,
    val alarmsCount: Int,
    val activeAlarmsCount: Int,
    val successCount: Int,
    val failedCount: Int,
)

private var nativeStatsView: ComposeView? = null
private val statsState = mutableStateOf<StatsData?>(null)

fun setupNativeStatsScreen(activity: ComponentActivity) {
    val root = activity.window.decorView.findViewById<FrameLayout>(android.R.id.content)
    nativeStatsView?.let { root.removeView(it) }

    val composeView = ComposeView(activity).apply {
        isClickable = true
        visibility = View.GONE
        elevation = 40f
        translationZ = 40f
        setViewCompositionStrategy(ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed)
        setContent {
            val data = statsState.value
            if (data != null) StatsScreen(data)
        }
    }
    val params = FrameLayout.LayoutParams(
        FrameLayout.LayoutParams.MATCH_PARENT,
        FrameLayout.LayoutParams.MATCH_PARENT,
    )
    root.addView(composeView, params)
    nativeStatsView = composeView
    composeView.bringToFront()
}

fun showNativeStats(data: StatsData) {
    statsState.value = data
    nativeStatsView?.post { nativeStatsView?.visibility = View.VISIBLE }
}

fun hideNativeStats() {
    nativeStatsView?.post { nativeStatsView?.visibility = View.GONE }
}

@Composable
fun StatsScreen(data: StatsData) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(StatsBg)
            .statusBarsPadding()
            .navigationBarsPadding(),
    )
}
