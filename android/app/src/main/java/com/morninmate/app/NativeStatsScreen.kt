package com.morninmate.app

import android.view.View
import android.widget.FrameLayout
import androidx.activity.ComponentActivity
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Alarm
import androidx.compose.material.icons.filled.AlarmOn
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.ViewCompositionStrategy
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

internal val StatsBg       = Color(0xFF0D0D1A)
internal val StatsSurface  = Color(0xFF141A2B)
internal val StatsDawn     = Color(0xFFFF6B35)
internal val StatsInactive = Color(0x47FFFFFF)
internal val StatsBorder   = Color(0x16FFFFFF)
internal val StatsWin      = Color(0xFF4CAF50)
internal val StatsLoss     = Color(0xFFF44336)
internal val StatsAmber    = Color(0xFFFFC107)

internal val RANK_LABELS = listOf("Newcomer", "Riser", "Consistent", "Dedicated", "Legend")
internal fun rankLabelFor(level: Int): String = RANK_LABELS[minOf(level - 1, 4)]

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
    if (statsState.value != data) {
        statsState.value = data
    }
}

fun hideNativeStats() {
    nativeStatsView?.post {
        if (nativeStatsView?.visibility != View.GONE) {
            nativeStatsView?.visibility = View.GONE
        }
    }
}

fun setNativeStatsScreenVisible(visible: Boolean) {
    val hasData = statsState.value != null
    nativeStatsView?.post {
        val nextVisibility = if (visible && hasData) View.VISIBLE else View.GONE
        if (nativeStatsView?.visibility != nextVisibility) {
            nativeStatsView?.visibility = nextVisibility
        }
    }
}

// ─── StatsScreen ─────────────────────────────────────────────────────────────

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
        Spacer(Modifier.height(28.dp))
        JourneyTrack(level = data.level)
        Spacer(Modifier.height(24.dp))
        MetricGrid(data = data)
        Spacer(Modifier.height(16.dp))
        BottomBanner(data = data)
        Spacer(Modifier.height(24.dp))
    }
}

// ─── HeroZone ────────────────────────────────────────────────────────────────

@Composable
fun HeroZone(data: StatsData, modifier: Modifier = Modifier) {
    val progress = if (data.xpPerLevel > 0)
        (data.xp % data.xpPerLevel).toFloat() / data.xpPerLevel
    else 0f

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
                drawArc(
                    color = StatsSurface,
                    startAngle = -90f,
                    sweepAngle = 360f,
                    useCenter = false,
                    topLeft = topLeft,
                    size = arcSize,
                    style = Stroke(width = strokePx, cap = StrokeCap.Round),
                )
                if (progress > 0f) {
                    drawArc(
                        color = StatsDawn,
                        startAngle = -90f,
                        sweepAngle = 360f * progress,
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

// ─── JourneyTrack ────────────────────────────────────────────────────────────

@Composable
fun JourneyTrack(level: Int, modifier: Modifier = Modifier) {
    val nodeIndex = minOf(level - 1, 4)

    Column(modifier = modifier.fillMaxWidth()) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(24.dp),
        ) {
            // Connecting lines
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .align(Alignment.Center)
                    .padding(horizontal = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                repeat(4) { i ->
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .height(2.dp)
                            .background(if (i < nodeIndex) StatsDawn else StatsSurface),
                    )
                }
            }
            // Nodes
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                RANK_LABELS.forEachIndexed { index, _ ->
                    val isPast    = index < nodeIndex
                    val isCurrent = index == nodeIndex
                    val nodeSize  = if (isCurrent) 20.dp else 14.dp
                    Box(
                        modifier = Modifier
                            .size(nodeSize)
                            .let { m ->
                                if (isCurrent) m.drawBehind {
                                    drawCircle(StatsDawn.copy(alpha = 0.25f), radius = 22.dp.toPx())
                                } else m
                            }
                            .background(
                                color = if (isPast || isCurrent) StatsDawn else Color.Transparent,
                                shape = CircleShape,
                            )
                            .let { m ->
                                if (!isPast && !isCurrent)
                                    m.border(1.dp, StatsInactive, CircleShape)
                                else m
                            },
                    )
                }
            }
        }

        Spacer(Modifier.height(6.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            RANK_LABELS.forEachIndexed { index, label ->
                val isCurrent = index == nodeIndex
                Text(
                    text = label,
                    color = if (isCurrent) StatsDawn else StatsInactive,
                    fontSize = 8.sp,
                    fontWeight = if (isCurrent) FontWeight.Bold else FontWeight.Normal,
                )
            }
        }
    }
}

// ─── MetricGrid ──────────────────────────────────────────────────────────────

private data class MetricItem(
    val label: String,
    val icon: ImageVector,
    val value: String,
    val accentColor: Color,
)

@Composable
private fun MetricCard(item: MetricItem, modifier: Modifier = Modifier) {
    Surface(
        shape = RoundedCornerShape(14.dp),
        color = StatsSurface,
        border = BorderStroke(1.dp, StatsBorder),
        modifier = modifier,
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(3.dp),
        ) {
            Icon(
                imageVector = item.icon,
                contentDescription = item.label,
                tint = item.accentColor,
                modifier = Modifier.size(18.dp),
            )
            Text(
                text = item.label,
                color = StatsInactive,
                fontSize = 10.sp,
                fontWeight = FontWeight.Medium,
            )
            Text(
                text = item.value,
                color = item.accentColor,
                fontSize = 26.sp,
                fontWeight = FontWeight.ExtraBold,
            )
        }
    }
}

@Composable
fun MetricGrid(data: StatsData, modifier: Modifier = Modifier) {
    val metrics = listOf(
        MetricItem("Day Streak",    Icons.Default.LocalFireDepartment, data.streak.toString(),             StatsDawn),
        MetricItem("Total XP",      Icons.Default.Star,                data.xp.toString(),                StatsDawn),
        MetricItem("Alarms Set",    Icons.Default.Alarm,               data.alarmsCount.toString(),       Color.White),
        MetricItem("Active",        Icons.Default.AlarmOn,             data.activeAlarmsCount.toString(), Color.White),
        MetricItem("Routines Won",  Icons.Default.EmojiEvents,         data.successCount.toString(),      StatsWin),
        MetricItem("Routines Lost", Icons.Default.Close,               data.failedCount.toString(),       StatsLoss),
    )
    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        for (row in 0 until 3) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                for (col in 0 until 2) {
                    val idx = row * 2 + col
                    MetricCard(item = metrics[idx], modifier = Modifier.weight(1f))
                }
            }
        }
    }
}

// ─── BottomBanner ────────────────────────────────────────────────────────────

@Composable
fun BottomBanner(data: StatsData, modifier: Modifier = Modifier) {
    val nudge = when {
        data.streak >= 30 -> "Legendary ${data.streak}-day streak!"
        data.streak >= 7  -> "On a ${data.streak}-day streak — you're on fire!"
        data.streak >= 1  -> "On a ${data.streak}-day streak — keep going!"
        else              -> "Set your first alarm to start your streak"
    }

    if (data.demerits > 0) {
        Surface(
            shape = RoundedCornerShape(12.dp),
            color = StatsAmber.copy(alpha = 0.15f),
            border = BorderStroke(1.dp, StatsAmber.copy(alpha = 0.4f)),
            modifier = modifier.fillMaxWidth(),
        ) {
            Row(
                modifier = Modifier.padding(12.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(Icons.Default.Warning, contentDescription = null, tint = StatsAmber, modifier = Modifier.size(18.dp))
                Text(
                    text = "${data.demerits} demerit${if (data.demerits != 1) "s" else ""} — complete routines to remove them",
                    color = StatsAmber,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium,
                )
            }
        }
    } else {
        Surface(
            shape = RoundedCornerShape(12.dp),
            color = StatsSurface,
            border = BorderStroke(1.dp, StatsBorder),
            modifier = modifier.fillMaxWidth(),
        ) {
            Row(
                modifier = Modifier.padding(12.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(Icons.Default.LocalFireDepartment, contentDescription = null, tint = StatsDawn, modifier = Modifier.size(18.dp))
                Text(
                    text = nudge,
                    color = Color.White.copy(alpha = 0.85f),
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium,
                )
            }
        }
    }
}
