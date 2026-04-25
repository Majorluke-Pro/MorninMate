package com.morninmate.app

import android.view.View
import android.widget.FrameLayout
import androidx.activity.ComponentActivity
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.ViewCompositionStrategy
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.Canvas

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

internal val RANK_LABELS = listOf("Newcomer", "Riser", "Consistent", "Dedicated", "Legend")

internal fun rankLabelFor(level: Int): String = RANK_LABELS[minOf(level - 1, 4)]

@Composable
fun HeroZone(data: StatsData, modifier: Modifier = Modifier) {
    val progress = if (data.xpPerLevel > 0)
        (data.xp % data.xpPerLevel).toFloat() / data.xpPerLevel
    else 0f

    val ringProgress = remember { Animatable(0f) }
    LaunchedEffect(data.xp, data.xpPerLevel) {
        ringProgress.animateTo(
            targetValue = progress,
            animationSpec = tween(durationMillis = 800, easing = FastOutSlowInEasing),
        )
    }

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = modifier.fillMaxWidth(),
    ) {
        Box(contentAlignment = Alignment.Center, modifier = Modifier.size(160.dp)) {
            Canvas(modifier = Modifier.size(160.dp)) {
                val strokePx = 8.dp.toPx()
                val diameter = size.minDimension - strokePx
                val topLeft = Offset(strokePx / 2f, strokePx / 2f)
                val arcSize = Size(diameter, diameter)
                // Track
                drawArc(
                    color = StatsSurface,
                    startAngle = -90f,
                    sweepAngle = 360f,
                    useCenter = false,
                    topLeft = topLeft,
                    size = arcSize,
                    style = Stroke(width = strokePx, cap = StrokeCap.Round),
                )
                // Fill
                if (ringProgress.value > 0f) {
                    drawArc(
                        color = StatsDawn,
                        startAngle = -90f,
                        sweepAngle = 360f * ringProgress.value,
                        useCenter = false,
                        topLeft = topLeft,
                        size = arcSize,
                        style = Stroke(width = strokePx, cap = StrokeCap.Round),
                    )
                }
            }
            Text(
                text = data.level.toString(),
                color = Color.White,
                fontSize = 42.sp,
                fontWeight = FontWeight.ExtraBold,
            )
        }

        Spacer(Modifier.height(12.dp))

        Surface(
            shape = RoundedCornerShape(20.dp),
            color = Color.Transparent,
            border = BorderStroke(1.dp, StatsDawn),
        ) {
            Text(
                text = rankLabelFor(data.level),
                color = StatsDawn,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp),
            )
        }
    }
}

@Composable
fun StatsScreen(data: StatsData) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(StatsBg)
            .statusBarsPadding()
            .navigationBarsPadding()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp),
    ) {
        Spacer(Modifier.height(28.dp))
        HeroZone(data = data)
        Spacer(Modifier.height(24.dp))
    }
}
