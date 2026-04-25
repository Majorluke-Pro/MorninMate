package com.morninmate.app

import android.view.View
import android.widget.FrameLayout
import androidx.activity.ComponentActivity
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Alarm
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.ViewCompositionStrategy
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlin.random.Random

private val RingBg = Color(0xFF090912)
private val RingPanel = Color(0xE8151526)
private val RingDawn = Color(0xFFFF6B35)
private val RingDanger = Color(0xFFEF476F)
private val RingText = Color(0xFFFFF5DF)
private val RingMuted = Color(0xB3FFFFFF)

private var ringingView: ComposeView? = null
private var ringingActivity: ComponentActivity? = null
private val ringingState = mutableStateOf<NativeAlarmItem?>(null)

fun setupNativeRingingAlarmScreen(activity: ComponentActivity) {
    ringingActivity = activity
    val root = activity.window.decorView.findViewById<FrameLayout>(android.R.id.content)
    ringingView?.let { root.removeView(it) }

    val composeView = ComposeView(activity).apply {
        isClickable = true
        visibility = View.GONE
        elevation = 70f
        translationZ = 70f
        setViewCompositionStrategy(ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed)
        setContent {
            ringingState.value?.let { NativeRingingAlarmScreen(it) }
        }
    }
    root.addView(
        composeView,
        FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT,
        ),
    )
    ringingView = composeView
}

fun showNativeRingingAlarm(alarm: NativeAlarmItem) {
    ringingState.value = alarm
    ringingView?.post {
        ringingView?.visibility = View.VISIBLE
    }
    if (alarm.intensity == "hardcore") {
        ringingActivity?.let { NativeAlarmStore.enableHardcoreLock(it) }
    }
}

fun hideNativeRingingAlarm() {
    ringingState.value = null
    ringingView?.post {
        ringingView?.visibility = View.GONE
    }
}

@Composable
private fun NativeRingingAlarmScreen(alarm: NativeAlarmItem) {
    var gameIndex by remember(alarm.id) { mutableStateOf(0) }
    val games = remember(alarm.id, alarm.gameIds) { alarm.gameIds.ifEmpty { listOf("math") } }
    val completed = gameIndex >= games.size

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(Color(0xFF270B16), RingBg, Color(0xFF10101F)),
                ),
            )
            .drawBehind {
                drawCircle(Color(0x36FF6B35), radius = 190.dp.toPx(), center = Offset(size.width + 20.dp.toPx(), 40.dp.toPx()))
                drawCircle(Color(0x24EF476F), radius = 150.dp.toPx(), center = Offset(-30.dp.toPx(), size.height - 120.dp.toPx()))
            }
            .statusBarsPadding()
            .navigationBarsPadding()
            .padding(18.dp)
            .verticalScroll(rememberScrollState()),
        contentAlignment = Alignment.Center,
    ) {
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(24.dp),
            color = RingPanel,
            border = BorderStroke(1.dp, Color.White.copy(alpha = 0.12f)),
            shadowElevation = 18.dp,
        ) {
            Column(
                modifier = Modifier.padding(horizontal = 22.dp, vertical = 26.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Box(
                    modifier = Modifier
                        .size(68.dp)
                        .background(RingDawn.copy(alpha = 0.15f), CircleShape),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(Icons.Default.Alarm, contentDescription = null, tint = RingDawn, modifier = Modifier.size(34.dp))
                }
                Spacer(Modifier.height(18.dp))
                Text(formatRingingTime(alarm.time), color = RingText, fontSize = 46.sp, fontWeight = FontWeight.Black, lineHeight = 48.sp)
                Text(alarm.label.ifBlank { "Alarm" }, color = RingMuted, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(10.dp))
                Text(
                    if (completed) "Games complete" else "Game ${gameIndex + 1} of ${games.size}: ${gameLabel(games[gameIndex])}",
                    color = if (completed) RingDawn else RingMuted.copy(alpha = 0.72f),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center,
                )
                Spacer(Modifier.height(18.dp))

                if (completed) {
                    Button(
                        onClick = {
                            (ringingActivity as? MainActivity)?.dismissNativeAlarm(alarm.id)
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = RingDanger),
                        shape = RoundedCornerShape(18.dp),
                    ) {
                        Icon(Icons.Default.Stop, contentDescription = null, modifier = Modifier.size(20.dp))
                        Spacer(Modifier.size(8.dp))
                        Text("Stop alarm", fontWeight = FontWeight.Black)
                    }
                } else {
                    WakeChallenge(
                        game = games[gameIndex],
                        level = gameIndex,
                        onComplete = { gameIndex += 1 },
                    )
                }
            }
        }
    }
}

@Composable
private fun WakeChallenge(game: String, level: Int, onComplete: () -> Unit) {
    when (game) {
        "memory" -> MemoryChallenge(level, onComplete)
        "reaction" -> ReactionChallenge(level, onComplete)
        else -> MathChallenge(level, onComplete)
    }
}

@Composable
private fun MathChallenge(level: Int, onComplete: () -> Unit) {
    var round by remember(level) { mutableStateOf(0) }
    var problem by remember(level, round) { mutableStateOf(newMathProblem(level)) }
    var feedback by remember(level) { mutableStateOf("") }

    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Solve ${3 - round} more", color = RingMuted, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        Text(problem.question, color = RingText, fontSize = 32.sp, fontWeight = FontWeight.Black)
        problem.choices.chunked(2).forEach { row ->
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                row.forEach { choice ->
                    Button(
                        onClick = {
                            if (choice == problem.answer) {
                                feedback = "Correct"
                                if (round >= 2) onComplete() else {
                                    round += 1
                                    problem = newMathProblem(level + round + 1)
                                }
                            } else {
                                feedback = "Try again"
                                problem = newMathProblem(level + round + 3)
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(alpha = 0.10f)),
                        shape = RoundedCornerShape(14.dp),
                    ) {
                        Text(choice.toString(), color = RingText, fontSize = 18.sp, fontWeight = FontWeight.Black)
                    }
                }
            }
        }
        if (feedback.isNotBlank()) Text(feedback, color = if (feedback == "Correct") RingDawn else RingDanger, fontSize = 12.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun MemoryChallenge(level: Int, onComplete: () -> Unit) {
    val cards = remember(level) { listOf("Sun", "Bell", "Zap", "Star").flatMap { listOf(it, it) }.shuffled() }
    var matched by remember(level) { mutableStateOf(setOf<Int>()) }
    var picked by remember(level) { mutableStateOf(listOf<Int>()) }

    LaunchedEffect(picked) {
        if (picked.size == 2) {
            val first = picked[0]
            val second = picked[1]
            if (cards[first] == cards[second]) {
                matched = matched + first + second
                if (matched.size + 2 >= cards.size) onComplete()
            }
            picked = emptyList()
        }
    }

    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Text("Match all pairs", color = RingMuted, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        cards.chunked(4).forEachIndexed { rowIndex, row ->
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                row.forEachIndexed { colIndex, value ->
                    val index = rowIndex * 4 + colIndex
                    val visible = index in matched || index in picked
                    Surface(
                        modifier = Modifier
                            .size(width = 66.dp, height = 54.dp)
                            .clickable(enabled = index !in matched && index !in picked && picked.size < 2) {
                                picked = picked + index
                            },
                        shape = RoundedCornerShape(14.dp),
                        color = if (visible) RingDawn.copy(alpha = 0.18f) else Color.White.copy(alpha = 0.08f),
                        border = BorderStroke(1.dp, if (visible) RingDawn.copy(alpha = 0.45f) else Color.White.copy(alpha = 0.10f)),
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text(if (visible) value else "?", color = RingText, fontSize = 13.sp, fontWeight = FontWeight.Black, textAlign = TextAlign.Center)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ReactionChallenge(level: Int, onComplete: () -> Unit) {
    val labels = listOf("Dawn", "Bell", "Rise", "Go")
    var target by remember(level) { mutableStateOf(labels.random()) }
    var hits by remember(level) { mutableStateOf(0) }
    var misses by remember(level) { mutableStateOf(0) }
    val needed = 5

    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Tap: $target", color = RingText, fontSize = 26.sp, fontWeight = FontWeight.Black)
        Text("$hits/$needed hits${if (misses > 0) " - $misses misses" else ""}", color = RingMuted, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        labels.chunked(2).forEach { row ->
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                row.shuffled().forEach { label ->
                    Button(
                        onClick = {
                            if (label == target) {
                                if (hits + 1 >= needed) onComplete() else {
                                    hits += 1
                                    target = labels.filter { it != target }.random()
                                }
                            } else {
                                misses += 1
                                hits = 0
                                target = labels.random()
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = if (label == target) RingDawn else Color.White.copy(alpha = 0.10f)),
                        shape = RoundedCornerShape(14.dp),
                    ) {
                        Text(label, color = RingText, fontWeight = FontWeight.Black)
                    }
                }
            }
        }
    }
}

private data class MathProblem(val question: String, val answer: Int, val choices: List<Int>)

private fun newMathProblem(level: Int): MathProblem {
    val random = Random(System.nanoTime() + level)
    val left = random.nextInt(8 + level, 24 + level * 3)
    val right = random.nextInt(3, 13 + level)
    val multiply = level > 1 && random.nextBoolean()
    val answer = if (multiply) left * right else left + right
    val question = if (multiply) "$left x $right" else "$left + $right"
    val choices = mutableSetOf(answer)
    while (choices.size < 4) {
        choices += (answer + random.nextInt(-12, 13)).coerceAtLeast(0)
    }
    return MathProblem(question, answer, choices.shuffled())
}

private fun gameLabel(game: String): String = when (game) {
    "memory" -> "Memory Match"
    "reaction" -> "Reaction Rush"
    else -> "Math Blitz"
}

private fun formatRingingTime(time: String): String {
    val parts = time.split(":")
    val h = parts.getOrNull(0)?.toIntOrNull() ?: 7
    val m = parts.getOrNull(1)?.toIntOrNull() ?: 0
    val period = if (h >= 12) "PM" else "AM"
    val hour = h % 12
    return "${if (hour == 0) 12 else hour}:${m.toString().padStart(2, '0')} $period"
}
