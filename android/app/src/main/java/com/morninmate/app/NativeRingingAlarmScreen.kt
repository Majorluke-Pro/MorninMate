package com.morninmate.app

import android.view.View
import android.widget.FrameLayout
import androidx.activity.ComponentActivity
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.defaultMinSize
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
import androidx.compose.material.icons.filled.Backspace
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
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
import kotlinx.coroutines.delay
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
    if (!alarm.isTest && alarm.intensity == "hardcore") {
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
    var phase by remember(alarm.id) { mutableStateOf("intro") }
    var restarts by remember(alarm.id) { mutableStateOf(0) }
    var results by remember(alarm.id) { mutableStateOf(emptyList<String>()) }
    val games = remember(alarm.id, alarm.gameIds) { alarm.gameIds.ifEmpty { listOf("math") } }
    val completed = gameIndex >= games.size
    val difficulty = difficultyForIntensity(alarm.intensity)

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
                if (alarm.isTest) {
                    TestAlarmStopButton {
                        (ringingActivity as? MainActivity)?.dismissNativeAlarm(alarm.id)
                    }
                    Spacer(Modifier.height(10.dp))
                }
                when {
                    phase == "intro" -> WakeIntro(
                        alarm = alarm,
                        games = games,
                        onStart = { phase = "playing" },
                    )

                    completed -> WakeComplete(
                        results = results,
                        restarts = restarts,
                        onDismiss = { (ringingActivity as? MainActivity)?.dismissNativeAlarm(alarm.id) },
                    )

                    else -> {
                        WakeProgressHeader(
                            gameIndex = gameIndex,
                            games = games,
                            restarts = restarts,
                        )
                        Spacer(Modifier.height(16.dp))
                        WakeChallenge(
                            game = games[gameIndex],
                            difficulty = difficulty,
                            restartKey = restarts,
                            onComplete = {
                                results = results + games[gameIndex]
                                gameIndex += 1
                            },
                            onFail = {
                                restarts += 1
                            },
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun TestAlarmStopButton(onStop: () -> Unit) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        color = RingDanger.copy(alpha = 0.12f),
        border = BorderStroke(1.dp, RingDanger.copy(alpha = 0.36f)),
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Text(
                "Test alarm",
                color = RingDanger,
                fontSize = 12.sp,
                fontWeight = FontWeight.Black,
            )
            Text(
                "You can stop a test without completing wake-up games.",
                color = RingMuted,
                fontSize = 12.sp,
                textAlign = TextAlign.Center,
            )
            Button(
                onClick = onStop,
                colors = ButtonDefaults.buttonColors(containerColor = RingDanger),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Icon(Icons.Default.Stop, contentDescription = null, modifier = Modifier.size(20.dp))
                Spacer(Modifier.size(8.dp))
                Text("End test alarm", fontWeight = FontWeight.Black)
            }
        }
    }
}

@Composable
private fun WakeIntro(alarm: NativeAlarmItem, games: List<String>, onStart: () -> Unit) {
    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text(
            "Complete these to dismiss",
            color = RingMuted,
            fontSize = 12.sp,
            fontWeight = FontWeight.Black,
        )
        games.forEachIndexed { index, game ->
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                color = gameColor(game).copy(alpha = 0.10f),
                border = BorderStroke(1.dp, gameColor(game).copy(alpha = 0.28f)),
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    GameIcon(game, gameColor(game))
                    Text(gameLabel(game), color = RingText, fontWeight = FontWeight.Black, modifier = Modifier.weight(1f))
                    Text("${index + 1}", color = RingMuted, fontWeight = FontWeight.Black)
                }
            }
        }
        Text(
            "${alarm.intensity.replaceFirstChar { it.uppercase() }} pulse - ${games.size} game${if (games.size == 1) "" else "s"}",
            color = RingMuted.copy(alpha = 0.75f),
            fontSize = 12.sp,
            textAlign = TextAlign.Center,
        )
        Button(
            onClick = onStart,
            colors = ButtonDefaults.buttonColors(containerColor = RingDawn),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text(if (alarm.intensity == "hardcore") "Begin - No escape" else "Start wake-up routine", fontWeight = FontWeight.Black)
        }
    }
}

@Composable
private fun WakeProgressHeader(gameIndex: Int, games: List<String>, restarts: Int) {
    val progress = gameIndex / games.size.toFloat()
    Column(modifier = Modifier.fillMaxWidth()) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                "Game ${gameIndex + 1} of ${games.size}",
                color = RingMuted,
                fontSize = 12.sp,
                fontWeight = FontWeight.Black,
                modifier = Modifier.weight(1f),
            )
            if (restarts > 0) {
                Text("$restarts restart${if (restarts == 1) "" else "s"}", color = RingDanger, fontSize = 12.sp, fontWeight = FontWeight.Black)
            }
        }
        Spacer(Modifier.height(7.dp))
        LinearProgressIndicator(
            progress = { progress },
            modifier = Modifier.fillMaxWidth().height(7.dp),
            color = RingDawn,
            trackColor = Color.White.copy(alpha = 0.10f),
        )
        Spacer(Modifier.height(12.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(7.dp), modifier = Modifier.fillMaxWidth()) {
            games.forEachIndexed { index, game ->
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(5.dp)
                        .background(
                            if (index < gameIndex) RingMint else if (index == gameIndex) gameColor(game) else Color.White.copy(alpha = 0.10f),
                            CircleShape,
                        ),
                )
            }
        }
        Spacer(Modifier.height(8.dp))
        Text(gameLabel(games[gameIndex]), color = gameColor(games[gameIndex]), fontSize = 15.sp, fontWeight = FontWeight.Black)
    }
}

@Composable
private fun WakeComplete(results: List<String>, restarts: Int, onDismiss: () -> Unit) {
    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Icon(Icons.Default.CheckCircle, contentDescription = null, tint = RingMint, modifier = Modifier.size(52.dp))
        Text("Games complete", color = RingText, fontSize = 24.sp, fontWeight = FontWeight.Black)
        results.forEach { game ->
            Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                GameIcon(game, gameColor(game))
                Spacer(Modifier.size(10.dp))
                Text(gameLabel(game), color = RingText, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                Text("Done", color = RingMint, fontSize = 12.sp, fontWeight = FontWeight.Black)
            }
        }
        if (restarts > 0) {
            Text("$restarts restart${if (restarts == 1) "" else "s"} before finishing", color = RingMuted, fontSize = 12.sp)
        }
        Button(
            onClick = onDismiss,
            colors = ButtonDefaults.buttonColors(containerColor = RingDanger),
            shape = RoundedCornerShape(18.dp),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Icon(Icons.Default.Stop, contentDescription = null, modifier = Modifier.size(20.dp))
            Spacer(Modifier.size(8.dp))
            Text("Stop alarm", fontWeight = FontWeight.Black)
        }
    }
}

@Composable
private fun WakeChallenge(game: String, difficulty: WakeDifficulty, restartKey: Int, onComplete: () -> Unit, onFail: () -> Unit) {
    when (game) {
        "memory" -> MemoryChallenge(difficulty, restartKey, onComplete, onFail)
        "reaction" -> ReactionChallenge(difficulty, restartKey, onComplete, onFail)
        else -> MathChallenge(difficulty, restartKey, onComplete, onFail)
    }
}

@Composable
private fun MathChallenge(difficulty: WakeDifficulty, restartKey: Int, onComplete: () -> Unit, onFail: () -> Unit) {
    val totalQuestions = difficulty.mathQuestions
    val maxWrong = difficulty.mathWrong
    var questionIndex by remember(restartKey) { mutableStateOf(0) }
    var input by remember(restartKey) { mutableStateOf("") }
    var wrong by remember(restartKey) { mutableStateOf(0) }
    var timeLeft by remember(restartKey) { mutableStateOf(difficulty.mathSeconds) }
    var flash by remember(restartKey) { mutableStateOf("") }
    var problem by remember(restartKey, questionIndex) { mutableStateOf(newMathProblem(difficulty)) }

    LaunchedEffect(restartKey, timeLeft) {
        if (timeLeft <= 0) {
            onFail()
        } else {
            delay(1000)
            timeLeft -= 1
        }
    }

    fun submit() {
        val value = input.toIntOrNull() ?: return
        if (value == problem.answer) {
            flash = "correct"
            if (questionIndex + 1 >= totalQuestions) {
                onComplete()
            } else {
                questionIndex += 1
                input = ""
                problem = newMathProblem(difficulty)
            }
        } else {
            flash = "wrong"
            input = ""
            wrong += 1
            timeLeft = (timeLeft - 8).coerceAtLeast(1)
            if (wrong >= maxWrong) onFail()
        }
    }

    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
        TimedHeader(
            title = "Math Blitz",
            left = "${questionIndex + 1} / $totalQuestions",
            right = "${timeLeft}s",
            progress = timeLeft / difficulty.mathSeconds.toFloat(),
            color = timerColor(timeLeft, difficulty.mathSeconds),
        )
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            repeat(maxWrong) { index ->
                Box(
                    modifier = Modifier
                        .size(11.dp)
                        .background(if (index < maxWrong - wrong) RingDanger else Color.White.copy(alpha = 0.12f), CircleShape),
                )
            }
        }
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(18.dp),
            color = when (flash) {
                "correct" -> RingMint.copy(alpha = 0.12f)
                "wrong" -> RingDanger.copy(alpha = 0.10f)
                else -> Color.White.copy(alpha = 0.05f)
            },
            border = BorderStroke(1.dp, when (flash) {
                "correct" -> RingMint
                "wrong" -> RingDanger
                else -> Color.White.copy(alpha = 0.10f)
            }),
        ) {
            Column(modifier = Modifier.padding(18.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Text("${problem.question} = ?", color = RingText, fontSize = 38.sp, fontWeight = FontWeight.Black, textAlign = TextAlign.Center)
                Spacer(Modifier.height(14.dp))
                Surface(shape = RoundedCornerShape(14.dp), color = Color.Black.copy(alpha = 0.24f), border = BorderStroke(1.dp, if (input.isBlank()) Color.White.copy(alpha = 0.10f) else RingDawn.copy(alpha = 0.55f))) {
                    Text(input.ifBlank { "-" }, color = if (input.isBlank()) RingMuted.copy(alpha = 0.45f) else RingText, fontSize = 26.sp, fontWeight = FontWeight.Black, modifier = Modifier.padding(horizontal = 42.dp, vertical = 10.dp), textAlign = TextAlign.Center)
                }
            }
        }
        listOf(listOf("7", "8", "9"), listOf("4", "5", "6"), listOf("1", "2", "3"), listOf("back", "0", "ok")).forEach { row ->
            Row(horizontalArrangement = Arrangement.spacedBy(9.dp), modifier = Modifier.fillMaxWidth()) {
                row.forEach { key ->
                    Button(
                        onClick = {
                            when (key) {
                                "back" -> input = input.dropLast(1)
                                "ok" -> submit()
                                else -> if (input.length < 5) input += key
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = if (key == "ok") RingDawn.copy(alpha = 0.28f) else Color.White.copy(alpha = 0.08f)),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier.weight(1f).defaultMinSize(minHeight = 52.dp),
                    ) {
                        if (key == "back") Icon(Icons.Default.Backspace, contentDescription = "Backspace", tint = RingMuted)
                        else Text(if (key == "ok") "OK" else key, color = RingText, fontSize = 18.sp, fontWeight = FontWeight.Black)
                    }
                }
            }
        }
    }
}

@Composable
private fun MemoryChallenge(difficulty: WakeDifficulty, restartKey: Int, onComplete: () -> Unit, onFail: () -> Unit) {
    val pairs = difficulty.memoryPairs
    val cards = remember(restartKey) { memorySymbols.take(pairs).flatMap { listOf(it, it) }.shuffled() }
    var matched by remember(restartKey) { mutableStateOf(setOf<Int>()) }
    var picked by remember(restartKey) { mutableStateOf(listOf<Int>()) }
    var moves by remember(restartKey) { mutableStateOf(0) }
    var previewing by remember(restartKey) { mutableStateOf(true) }
    var timeLeft by remember(restartKey) { mutableStateOf(difficulty.memorySeconds) }

    LaunchedEffect(restartKey) {
        delay(difficulty.memoryPreviewMs)
        previewing = false
    }

    LaunchedEffect(restartKey, previewing, timeLeft) {
        if (previewing) return@LaunchedEffect
        if (timeLeft <= 0) {
            onFail()
        } else {
            delay(1000)
            timeLeft -= 1
        }
    }

    LaunchedEffect(picked) {
        if (picked.size == 2) {
            val first = picked[0]
            val second = picked[1]
            if (cards[first] == cards[second]) {
                delay(250)
                val nextMatched = matched + first + second
                matched = nextMatched
                if (nextMatched.size >= cards.size) onComplete()
            } else {
                delay(700)
            }
            picked = emptyList()
        }
    }

    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(10.dp)) {
        TimedHeader(
            title = "Memory Match",
            left = "${matched.size / 2} / $pairs pairs",
            right = if (previewing) "Memorise" else "${difficulty.memoryMoves - moves} moves",
            progress = matched.size / cards.size.toFloat(),
            color = if (previewing) RingSunrise else RingMint,
        )
        if (!previewing) {
            LinearProgressIndicator(
                progress = { timeLeft / difficulty.memorySeconds.toFloat() },
                modifier = Modifier.fillMaxWidth().height(5.dp),
                color = timerColor(timeLeft, difficulty.memorySeconds),
                trackColor = Color.White.copy(alpha = 0.08f),
            )
        }
        cards.chunked(if (pairs <= 4) 4 else 4).forEachIndexed { rowIndex, row ->
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                row.forEachIndexed { colIndex, value ->
                    val index = rowIndex * 4 + colIndex
                    val visible = previewing || index in matched || index in picked
                    Surface(
                        modifier = Modifier
                            .size(width = 66.dp, height = 58.dp)
                            .clickable(enabled = !previewing && index !in matched && index !in picked && picked.size < 2) {
                                picked = picked + index
                                if (picked.isEmpty()) {
                                    moves += 1
                                    if (moves + 1 > difficulty.memoryMoves) onFail()
                                }
                            },
                        shape = RoundedCornerShape(14.dp),
                        color = when {
                            index in matched -> RingMint.copy(alpha = 0.13f)
                            visible -> RingDawn.copy(alpha = 0.18f)
                            else -> Color.White.copy(alpha = 0.08f)
                        },
                        border = BorderStroke(1.dp, if (visible) RingDawn.copy(alpha = 0.45f) else Color.White.copy(alpha = 0.10f)),
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text(if (visible) value else "?", color = if (index in matched) RingMint else RingText, fontSize = 13.sp, fontWeight = FontWeight.Black, textAlign = TextAlign.Center)
                        }
                    }
                }
            }
        }
        if (previewing) Text("Remember positions before the cards flip", color = RingSunrise, fontSize = 12.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun ReactionChallenge(difficulty: WakeDifficulty, restartKey: Int, onComplete: () -> Unit, onFail: () -> Unit) {
    var phase by remember(restartKey) { mutableStateOf("countdown") }
    var countdown by remember(restartKey) { mutableStateOf(3) }
    var round by remember(restartKey) { mutableStateOf(0) }
    var lives by remember(restartKey) { mutableStateOf(3) }
    var armedAt by remember(restartKey) { mutableStateOf(0L) }
    var lastMs by remember(restartKey) { mutableStateOf<Int?>(null) }
    var times by remember(restartKey) { mutableStateOf(emptyList<Int>()) }

    LaunchedEffect(restartKey, phase, countdown, round, lives) {
        when (phase) {
            "countdown" -> {
                if (countdown > 0) {
                    delay(1000)
                    countdown -= 1
                } else {
                    phase = "wait"
                }
            }
            "wait" -> {
                delay(Random.nextLong(900, 2300))
                armedAt = System.currentTimeMillis()
                phase = "tap"
            }
            "tap" -> {
                delay(difficulty.reactionWindowMs)
                if (phase == "tap") {
                    lives -= 1
                    phase = "missed"
                    if (lives - 1 <= 0) onFail()
                }
            }
            "early", "missed", "hit" -> {
                delay(850)
                if (phase == "hit") {
                    if (round + 1 >= difficulty.reactionRounds) onComplete() else {
                        round += 1
                        phase = "wait"
                    }
                } else if (lives > 0) {
                    phase = "wait"
                }
            }
        }
    }

    fun tap() {
        when (phase) {
            "wait" -> {
                lives -= 1
                phase = "early"
                if (lives - 1 <= 0) onFail()
            }
            "tap" -> {
                val ms = (System.currentTimeMillis() - armedAt).toInt()
                lastMs = ms
                times = times + ms
                phase = "hit"
            }
        }
    }

    val avg = times.takeIf { it.isNotEmpty() }?.average()?.toInt()
    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Text("Reaction Rush", color = RingMuted, fontSize = 12.sp, fontWeight = FontWeight.Black, modifier = Modifier.weight(1f))
            repeat(3) { index ->
                Icon(
                    if (index < lives) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                    contentDescription = null,
                    tint = if (index < lives) RingDanger else Color.White.copy(alpha = 0.16f),
                    modifier = Modifier.size(20.dp),
                )
            }
        }
        TimedHeader(
            title = "",
            left = "Round ${minOf(round + 1, difficulty.reactionRounds)} / ${difficulty.reactionRounds}",
            right = avg?.let { "avg ${it}ms" } ?: "",
            progress = round / difficulty.reactionRounds.toFloat(),
            color = RingPurple,
        )
        Surface(
            modifier = Modifier.size(286.dp).clickable { tap() },
            shape = CircleShape,
            color = reactionBg(phase),
            border = BorderStroke(3.dp, reactionColor(phase)),
            shadowElevation = if (phase == "tap") 24.dp else 8.dp,
        ) {
            Box(contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        reactionLabel(phase, countdown, lastMs),
                        color = reactionColor(phase),
                        fontSize = if (phase == "countdown") 58.sp else 42.sp,
                        fontWeight = FontWeight.Black,
                        textAlign = TextAlign.Center,
                    )
                    Text(reactionSubLabel(phase), color = reactionColor(phase).copy(alpha = 0.72f), fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    if (phase == "tap") Icon(Icons.Default.Bolt, contentDescription = null, tint = RingMint, modifier = Modifier.size(34.dp))
                }
            }
        }
        if (times.isNotEmpty()) {
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                times.takeLast(5).forEach {
                    Surface(shape = RoundedCornerShape(30.dp), color = ratingColor(it).copy(alpha = 0.10f), border = BorderStroke(1.dp, ratingColor(it).copy(alpha = 0.35f))) {
                        Text("${it}ms", color = ratingColor(it), fontSize = 11.sp, fontWeight = FontWeight.Black, modifier = Modifier.padding(horizontal = 9.dp, vertical = 4.dp))
                    }
                }
            }
        }
    }
}

private data class MathProblem(val question: String, val answer: Int, val choices: List<Int>)

private data class WakeDifficulty(
    val mathQuestions: Int,
    val mathSeconds: Int,
    val mathWrong: Int,
    val memoryPairs: Int,
    val memorySeconds: Int,
    val memoryMoves: Int,
    val memoryPreviewMs: Long,
    val reactionRounds: Int,
    val reactionWindowMs: Long,
)

private val RingMint = Color(0xFF06D6A0)
private val RingSunrise = Color(0xFFFFD166)
private val RingPurple = Color(0xFFA78BFA)
private val memorySymbols = listOf("Sun", "Bell", "Zap", "Star", "Brain", "Cup", "Goal", "Tree")

private fun difficultyForIntensity(intensity: String): WakeDifficulty = when (intensity) {
    "gentle" -> WakeDifficulty(3, 75, 2, 4, 90, 14, 2000, 4, 1100)
    "intense", "hardcore" -> WakeDifficulty(6, 60, 1, 8, 70, 28, 1000, 7, 650)
    else -> WakeDifficulty(4, 70, 2, 6, 80, 20, 1500, 5, 850)
}

private fun newMathProblem(difficulty: WakeDifficulty): MathProblem {
    val random = Random(System.nanoTime())
    val hard = difficulty.mathQuestions >= 6
    val ops = if (hard) listOf("+", "-", "x") else listOf("+", "-")
    val op = ops.random(random)
    val max = if (difficulty.mathQuestions <= 3) 15 else if (hard) 50 else 30
    val a = random.nextInt(5, max + 5)
    val b = random.nextInt(5, max + 5)
    return when (op) {
        "x" -> {
            val left = random.nextInt(2, 13)
            val right = random.nextInt(2, 13)
            MathProblem("$left x $right", left * right, emptyList())
        }
        "-" -> {
            val big = maxOf(a, b)
            val small = minOf(a, b)
            MathProblem("$big - $small", big - small, emptyList())
        }
        else -> MathProblem("$a + $b", a + b, emptyList())
    }
}

@Composable
private fun TimedHeader(title: String, left: String, right: String, progress: Float, color: Color) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(title.ifBlank { left }, color = RingMuted, fontSize = 12.sp, fontWeight = FontWeight.Black, modifier = Modifier.weight(1f))
            Text(right, color = color, fontSize = 12.sp, fontWeight = FontWeight.Black)
        }
        if (title.isNotBlank()) Text(left, color = RingMuted.copy(alpha = 0.75f), fontSize = 11.sp)
        Spacer(Modifier.height(6.dp))
        LinearProgressIndicator(
            progress = { progress.coerceIn(0f, 1f) },
            modifier = Modifier.fillMaxWidth().height(6.dp),
            color = color,
            trackColor = Color.White.copy(alpha = 0.08f),
        )
    }
}

@Composable
private fun GameIcon(game: String, color: Color) {
    Surface(shape = RoundedCornerShape(12.dp), color = color.copy(alpha = 0.14f), border = BorderStroke(1.dp, color.copy(alpha = 0.30f))) {
        Box(modifier = Modifier.size(42.dp), contentAlignment = Alignment.Center) {
            Text(when (game) { "memory" -> "M"; "reaction" -> "R"; else -> "123" }, color = color, fontWeight = FontWeight.Black, fontSize = 13.sp)
        }
    }
}

private fun timerColor(value: Int, total: Int): Color {
    val pct = value / total.toFloat()
    return when {
        pct > 0.5f -> RingMint
        pct > 0.25f -> RingSunrise
        else -> RingDanger
    }
}

private fun reactionBg(phase: String): Color = when (phase) {
    "tap" -> Color(0xFF063C26)
    "wait" -> Color(0xFF500808)
    "early" -> Color(0xFF321600)
    "missed" -> Color(0xFF320505)
    "hit" -> Color(0xFF081632)
    else -> Color(0xFF1E143C)
}

private fun reactionColor(phase: String): Color = when (phase) {
    "tap" -> RingMint
    "wait", "missed" -> RingDanger
    "early" -> Color(0xFFFF8C5A)
    "hit" -> Color(0xFF118AB2)
    else -> RingSunrise
}

private fun reactionLabel(phase: String, countdown: Int, lastMs: Int?): String = when (phase) {
    "countdown" -> if (countdown > 0) countdown.toString() else "Go"
    "tap" -> "TAP!"
    "wait" -> "WAIT"
    "early" -> "EARLY"
    "missed" -> "MISSED"
    "hit" -> lastMs?.let { "${it}ms" } ?: "HIT"
    else -> ""
}

private fun reactionSubLabel(phase: String): String = when (phase) {
    "countdown" -> "Tap when it turns green"
    "wait" -> "Don't tap yet"
    "tap" -> "Now"
    "early" -> "Wait for green"
    "missed" -> "Too slow"
    "hit" -> "Good"
    else -> ""
}

private fun ratingColor(ms: Int): Color = when {
    ms < 300 -> RingMint
    ms < 450 -> RingSunrise
    ms < 600 -> Color(0xFFFF8C5A)
    else -> RingDanger
}

private fun gameColor(game: String): Color = when (game) {
    "memory" -> RingSunrise
    "reaction" -> RingMint
    else -> RingDawn
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
