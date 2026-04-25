package com.morninmate.app

import android.view.View
import android.widget.FrameLayout
import androidx.activity.ComponentActivity
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Alarm
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.ViewCompositionStrategy
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.zIndex
import org.json.JSONArray
import org.json.JSONObject
import java.util.Calendar

private val AlarmBg = Color(0xFF0D0D1A)
private val AlarmPanel = Color(0xFF141A2B)
private val AlarmDawn = Color(0xFFFF6B35)
private val AlarmSunrise = Color(0xFFFFD166)
private val AlarmMint = Color(0xFF06D6A0)
private val AlarmText = Color(0xFFFFF5DF)
private val AlarmMuted = Color(0x99FFFFFF)
private val AlarmBorder = Color(0x16FFFFFF)

data class NativeAlarmItem(
    val id: String,
    val label: String,
    val time: String,
    val active: Boolean,
    val days: List<Int>,
    val intensity: String,
    val games: Int,
    val gameIds: List<String>,
    val rawJson: String,
)

data class NativeAlarmsData(
    val userName: String,
    val defaultWakeTime: String,
    val wakeGoal: String,
    val favoriteGame: String,
    val streak: Int,
    val xp: Int,
    val xpPerLevel: Int,
    val xpProgress: Float,
    val demerits: Int,
    val exactAlarmReady: Boolean,
    val alarms: List<NativeAlarmItem>,
)

private var nativeAlarmsView: ComposeView? = null
private var nativeAlarmsActivity: ComponentActivity? = null
private val alarmsState = mutableStateOf<NativeAlarmsData?>(null)

fun setupNativeAlarmsScreen(activity: ComponentActivity) {
    nativeAlarmsActivity = activity
    val root = activity.window.decorView.findViewById<FrameLayout>(android.R.id.content)
    nativeAlarmsView?.let { root.removeView(it) }

    val composeView = ComposeView(activity).apply {
        isClickable = true
        visibility = View.GONE
        elevation = 38f
        translationZ = 38f
        setViewCompositionStrategy(ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed)
        setContent {
            alarmsState.value?.let { NativeAlarmsScreen(it) }
        }
    }
    root.addView(
        composeView,
        FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT,
        ),
    )
    nativeAlarmsView = composeView
}

fun showNativeAlarms(data: NativeAlarmsData) {
    if (alarmsState.value != data) {
        alarmsState.value = data
    }
}

fun hideNativeAlarms() {
    nativeAlarmsView?.post {
        if (nativeAlarmsView?.visibility != View.GONE) {
            nativeAlarmsView?.visibility = View.GONE
        }
    }
}

fun setNativeAlarmsScreenVisible(visible: Boolean) {
    val hasData = alarmsState.value != null
    nativeAlarmsView?.post {
        val nextVisibility = if (visible && hasData) View.VISIBLE else View.GONE
        if (nativeAlarmsView?.visibility != nextVisibility) {
            nativeAlarmsView?.visibility = nextVisibility
        }
    }
}

fun nativeAlarmsDataFromJson(payload: JSONObject): NativeAlarmsData {
    val alarmsJson = JSONArray(payload.optString("alarms", "[]"))
    val alarms = mutableListOf<NativeAlarmItem>()
    for (i in 0 until alarmsJson.length()) {
        val item = alarmsJson.optJSONObject(i) ?: continue
        val pulse = item.optJSONObject("pulse") ?: JSONObject()
        val daysJson = item.optJSONArray("days") ?: JSONArray()
        val days = mutableListOf<Int>()
        for (d in 0 until daysJson.length()) days.add(daysJson.optInt(d))
        alarms.add(
            NativeAlarmItem(
                id = item.optString("id"),
                label = item.optString("label", "Alarm"),
                time = item.optString("time", "07:00"),
                active = item.optBoolean("active", true),
                days = days,
                intensity = pulse.optString("intensity", "gentle"),
                games = pulse.optJSONArray("games")?.length() ?: 1,
                gameIds = pulse.optJSONArray("games")?.let { gamesJson ->
                    List(gamesJson.length()) { index -> gamesJson.optString(index) }
                        .filter { it in setOf("math", "memory", "reaction") }
                        .ifEmpty { listOf("math") }
                } ?: listOf("math"),
                rawJson = item.toString(),
            ),
        )
    }

    return NativeAlarmsData(
        userName = payload.optString("userName", "Mate"),
        defaultWakeTime = payload.optString("defaultWakeTime", "07:00"),
        wakeGoal = payload.optString("wakeGoal", ""),
        favoriteGame = payload.optString("favoriteGame", "math"),
        streak = payload.optInt("streak", 0),
        xp = payload.optInt("xp", 0),
        xpPerLevel = payload.optInt("xpPerLevel", 100),
        xpProgress = payload.optDouble("xpProgress", 0.0).toFloat().coerceIn(0f, 1f),
        demerits = payload.optInt("demerits", 0),
        exactAlarmReady = payload.optBoolean("exactAlarmReady", false),
        alarms = alarms,
    )
}

private fun openNativeAlarmEditor(action: String, alarmId: String? = null, defaultTime: String? = null, alarmJson: String? = null) {
    val activity = nativeAlarmsActivity as? MainActivity ?: return
    activity.openNativeAlarmEditor(action, alarmId ?: "", defaultTime ?: "", alarmJson ?: "")
}

private fun emitAlarmAction(action: String, id: String? = null) {
    val activity = nativeAlarmsActivity as? MainActivity ?: return
    activity.handleNativeAlarmAction(action, id)
}

private fun emitAlarmActiveChange(id: String, active: Boolean) {
    val activity = nativeAlarmsActivity as? MainActivity ?: return
    activity.handleNativeAlarmActiveChange(id, active)
}

@Composable
private fun NativeAlarmsScreen(data: NativeAlarmsData) {
    var actionTarget by remember { mutableStateOf<NativeAlarmItem?>(null) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Color(0xFF171B2A), AlarmBg))),
    ) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .zIndex(2f)
                .statusBarsPadding()
                .navigationBarsPadding()
                .padding(bottom = 104.dp),
        ) {
            item(key = "header") {
                AlarmHeader(data)
            }
            item(key = "list-header") {
                AlarmListHeader(data)
            }
            if (data.alarms.isEmpty()) {
                item(key = "empty") {
                    Box(Modifier.padding(horizontal = 16.dp, vertical = 12.dp)) {
                        EmptyNativeState()
                    }
                }
            } else {
                val nextActiveId = data.alarms.firstOrNull { it.active }?.id
                items(
                    items = data.alarms,
                    key = { it.id },
                ) { alarm ->
                    Box(Modifier.padding(horizontal = 16.dp, vertical = 6.dp)) {
                        AlarmCardNative(
                            alarm = alarm,
                            isNext = alarm.id == nextActiveId,
                            onLongPress = { actionTarget = it },
                        )
                    }
                }
            }
        }

        FloatingActionButton(
            onClick = { openNativeAlarmEditor("create", defaultTime = data.defaultWakeTime) },
            containerColor = AlarmDawn,
            contentColor = Color.White,
            shape = CircleShape,
            modifier = Modifier
                .zIndex(6f)
                .semantics { contentDescription = "Add alarm" }
                .align(Alignment.BottomEnd)
                .navigationBarsPadding()
                .padding(end = 18.dp, bottom = 122.dp),
        ) {
            Icon(Icons.Default.Add, contentDescription = "Add alarm")
        }
    }

    val actionAlarm = actionTarget
    if (actionAlarm != null) {
        AlertDialog(
            onDismissRequest = { actionTarget = null },
            containerColor = AlarmPanel,
            title = { Text(actionAlarm.label.ifBlank { formatTime(actionAlarm.time) }, color = AlarmText, fontWeight = FontWeight.Black) },
            text = { Text("Choose what to do with this alarm.", color = AlarmMuted, lineHeight = 20.sp) },
            confirmButton = {
                Button(
                    onClick = {
                        emitAlarmAction("delete", actionAlarm.id)
                        actionTarget = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF476F)),
                ) {
                    Icon(Icons.Default.Delete, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.size(8.dp))
                    Text("Delete", fontWeight = FontWeight.Black)
                }
            },
            dismissButton = {
                Button(
                    onClick = {
                        emitAlarmAction("test", actionAlarm.id)
                        actionTarget = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = AlarmDawn),
                ) {
                    Icon(Icons.Default.PlayArrow, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.size(8.dp))
                    Text("Test", fontWeight = FontWeight.Black)
                }
            },
        )
    }
}

@Composable
private fun AlarmHeader(data: NativeAlarmsData) {
    val now = Calendar.getInstance()
    val nextAlarm = data.alarms.firstOrNull { it.active }
    val title = nextAlarm?.let { formatTime(it.time) } ?: "No alarm set"
    val subtitle = nextAlarm?.label?.takeIf { it.isNotBlank() }
        ?: data.wakeGoal.takeIf { it.isNotBlank() }
        ?: "No goal set"
    val displayName = data.userName.takeIf { it.isNotBlank() } ?: "Mate"

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 20.dp),
    ) {
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(24.dp),
            color = AlarmPanel,
            border = BorderStroke(1.dp, AlarmBorder),
        ) {
            Column(
                modifier = Modifier
                    .background(Brush.verticalGradient(listOf(Color(0xFF20283A), AlarmPanel)))
                    .padding(18.dp),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column(
                        verticalArrangement = Arrangement.spacedBy(4.dp),
                        modifier = Modifier.weight(1f),
                    ) {
                        Text(displayName, color = AlarmText, fontSize = 26.sp, fontWeight = FontWeight.Black, maxLines = 1)
                        Text("${greeting(now.get(Calendar.HOUR_OF_DAY))} - next alarm coming up", color = AlarmSunrise, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                    Surface(
                        shape = RoundedCornerShape(999.dp),
                        color = AlarmDawn.copy(alpha = 0.14f),
                        border = BorderStroke(1.dp, AlarmDawn.copy(alpha = 0.28f)),
                    ) {
                        Text(
                            "Next alarm",
                            color = AlarmDawn,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                        )
                    }
                }

                Spacer(Modifier.height(18.dp))
                Text("Coming up", color = AlarmMuted, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(4.dp))
                Text(title, color = AlarmText, fontSize = 34.sp, fontWeight = FontWeight.Black, lineHeight = 36.sp)
                Spacer(Modifier.height(4.dp))
                Text(subtitle, color = AlarmMuted, fontSize = 13.sp, maxLines = 1)
                Spacer(Modifier.height(14.dp))
                LinearProgressIndicator(
                    progress = { data.xpProgress },
                    modifier = Modifier.fillMaxWidth().height(6.dp),
                    color = AlarmDawn,
                    trackColor = Color.White.copy(alpha = 0.08f),
                )
                Spacer(Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        "${data.xp % data.xpPerLevel}/${data.xpPerLevel} XP",
                        color = AlarmMuted,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Medium,
                    )
                    Text(
                        "${data.alarms.count { it.active }} active",
                        color = AlarmMint,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                    )
                }
            }
        }
    }
}

@Composable
private fun AlarmListHeader(data: NativeAlarmsData) {
    Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 18.dp)) {
        if (data.exactAlarmReady) {
            Text("Alarm setup ready", color = AlarmSunrise, fontSize = 11.sp, fontWeight = FontWeight.Bold)
        } else {
            ReadinessCard()
        }
        Spacer(Modifier.height(14.dp))
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Text("Your Alarms", color = AlarmText, fontSize = 18.sp, fontWeight = FontWeight.Bold)
            Text("${data.alarms.count { it.active }} active", color = AlarmMuted, fontSize = 12.sp, fontWeight = FontWeight.Medium)
        }
    }
}

@Composable
private fun ReadinessCard() {
    Surface(shape = RoundedCornerShape(16.dp), color = AlarmPanel, border = BorderStroke(1.dp, AlarmBorder)) {
        Row(modifier = Modifier.padding(14.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Icon(Icons.Default.Warning, contentDescription = null, tint = AlarmDawn, modifier = Modifier.size(30.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text("Finish Android alarm setup", color = AlarmText, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                Text("Exact alarm permission still needs attention before alarms can be trusted.", color = AlarmMuted, fontSize = 12.sp)
                Spacer(Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(onClick = { emitAlarmAction("settings") }, colors = ButtonDefaults.buttonColors(containerColor = AlarmDawn), shape = RoundedCornerShape(10.dp)) {
                        Text("Open Settings", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Medium)
                    }
                    TextButton(onClick = { emitAlarmAction("refresh") }) {
                        Text("Refresh", color = AlarmMuted, fontSize = 11.sp)
                    }
                }
            }
        }
    }
}

@Composable
private fun EmptyNativeState() {
    Surface(shape = RoundedCornerShape(18.dp), color = AlarmPanel, border = BorderStroke(1.dp, AlarmBorder)) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth().padding(28.dp)) {
            Icon(Icons.Default.Alarm, contentDescription = null, tint = AlarmDawn, modifier = Modifier.size(42.dp))
            Spacer(Modifier.height(10.dp))
            Text("No alarms yet", color = AlarmText, fontWeight = FontWeight.Bold, fontSize = 18.sp)
            Text("Set your next wake-up to start building momentum.", color = AlarmMuted, fontSize = 12.sp)
            Spacer(Modifier.height(14.dp))
            Button(onClick = { openNativeAlarmEditor("create") }, colors = ButtonDefaults.buttonColors(containerColor = AlarmDawn), shape = RoundedCornerShape(10.dp)) {
                Text("Create alarm", color = Color.White, fontWeight = FontWeight.Medium)
            }
        }
    }
}

@Composable
@OptIn(ExperimentalFoundationApi::class)
private fun AlarmCardNative(
    alarm: NativeAlarmItem,
    isNext: Boolean,
    onLongPress: (NativeAlarmItem) -> Unit,
) {
    var active by remember(alarm.id) { mutableStateOf(alarm.active) }
    var togglePending by remember(alarm.id) { mutableStateOf(false) }

    LaunchedEffect(alarm.active) {
        active = alarm.active
        togglePending = false
    }

    Box(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .combinedClickable(
                    onClick = { openNativeAlarmEditor("edit", alarm.id, alarmJson = alarm.rawJson) },
                    onLongClick = { onLongPress(alarm) },
                ),
        ) {
            Row(
                modifier = Modifier.padding(vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(
                    modifier = Modifier
                        .padding(top = 8.dp)
                        .size(width = 4.dp, height = 62.dp)
                        .background(if (isNext) AlarmDawn else AlarmBorder, RoundedCornerShape(999.dp)),
                )
                Spacer(Modifier.size(14.dp))
                Column(modifier = Modifier.weight(1f).padding(vertical = 8.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.weight(1f)) {
                            if (isNext) {
                                Text("NEXT", color = AlarmDawn, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                            Text(alarm.label.ifBlank { "Alarm" }, color = AlarmMuted, fontSize = 12.sp, maxLines = 1)
                        }
                        SmoothAlarmToggle(
                            checked = active,
                            pending = togglePending,
                            onCheckedChange = { checked ->
                                if (togglePending) return@SmoothAlarmToggle
                                active = checked
                                togglePending = true
                                emitAlarmActiveChange(alarm.id, checked)
                            },
                        )
                    }
                    Text(formatTime(alarm.time), color = AlarmText.copy(alpha = if (active) 1f else 0.52f), fontSize = 38.sp, fontWeight = FontWeight.Bold, lineHeight = 40.sp)
                    if (alarm.days.isNotEmpty()) {
                        Spacer(Modifier.height(8.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            listOf("S", "M", "T", "W", "T", "F", "S").forEachIndexed { index, label ->
                                val on = alarm.days.contains(index)
                                Box(
                                    modifier = Modifier
                                        .size(24.dp)
                                        .background(if (on) AlarmDawn.copy(alpha = 0.18f) else Color.Transparent, CircleShape),
                                    contentAlignment = Alignment.Center,
                                ) {
                                    Text(label, color = if (on) AlarmSunrise else AlarmMuted.copy(alpha = 0.6f), fontSize = 9.sp, fontWeight = FontWeight.Medium)
                                }
                            }
                        }
                    }
                    Spacer(Modifier.height(10.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                        Chip(labelForIntensity(alarm.intensity), colorForIntensity(alarm.intensity))
                        Chip("${alarm.games} game${if (alarm.games == 1) "" else "s"}", AlarmMuted)
                    }
                }
            }
            Spacer(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(1.dp)
                    .background(if (isNext) AlarmDawn.copy(alpha = 0.24f) else AlarmBorder)
            )
        }
    }
}

@Composable
private fun SmoothAlarmToggle(
    checked: Boolean,
    pending: Boolean,
    onCheckedChange: (Boolean) -> Unit,
) {
    val animation = tween<Color>(durationMillis = 120)
    val dpAnimation = tween<androidx.compose.ui.unit.Dp>(durationMillis = 120)
    val trackColor by animateColorAsState(
        targetValue = if (checked) AlarmDawn else Color.White.copy(alpha = 0.14f),
        animationSpec = animation,
        label = "alarmToggleTrack",
    )
    val thumbColor by animateColorAsState(
        targetValue = if (checked) Color.White else AlarmText.copy(alpha = 0.82f),
        animationSpec = animation,
        label = "alarmToggleThumb",
    )
    val thumbOffset by animateDpAsState(
        targetValue = if (checked) 24.dp else 2.dp,
        animationSpec = dpAnimation,
        label = "alarmToggleThumbOffset",
    )
    val thumbScale by animateFloatAsState(
        targetValue = if (pending) 0.92f else 1f,
        animationSpec = tween(durationMillis = 90),
        label = "alarmToggleThumbScale",
    )
    val interactionSource = remember { MutableInteractionSource() }

    Box(
        modifier = Modifier
            .size(width = 56.dp, height = 36.dp)
            .background(trackColor, CircleShape)
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                enabled = !pending,
            ) { onCheckedChange(!checked) }
            .semantics {
                contentDescription = if (checked) "Alarm on" else "Alarm off"
            },
        contentAlignment = Alignment.CenterStart,
    ) {
        Box(
            modifier = Modifier
                .offset(x = thumbOffset)
                .size(30.dp)
                .graphicsLayer {
                    scaleX = thumbScale
                    scaleY = thumbScale
                    alpha = if (pending) 0.92f else 1f
                }
                .background(thumbColor, CircleShape),
        )
    }
}

@Composable
private fun Chip(text: String, color: Color) {
    Surface(shape = RoundedCornerShape(10.dp), color = AlarmPanel, border = BorderStroke(1.dp, AlarmBorder)) {
        Text(text, color = color, fontSize = 10.sp, fontWeight = FontWeight.Medium, modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp))
    }
}

private fun formatTime(time: String): String {
    val parts = time.split(":")
    val h = parts.getOrNull(0)?.toIntOrNull() ?: 7
    val m = parts.getOrNull(1)?.toIntOrNull() ?: 0
    val period = if (h >= 12) "PM" else "AM"
    val hour = h % 12
    return "${if (hour == 0) 12 else hour}:${m.toString().padStart(2, '0')} $period"
}

private fun greeting(hour: Int): String = when {
    hour < 5 -> "G'night"
    hour < 12 -> "G'day"
    hour < 17 -> "Arvo"
    hour < 21 -> "G'evening"
    else -> "G'night"
}

private fun colorForIntensity(intensity: String): Color = when (intensity) {
    "gentle" -> AlarmMint
    "moderate" -> AlarmSunrise
    "intense" -> AlarmDawn
    "hardcore" -> Color(0xFFEF476F)
    else -> AlarmMuted
}

private fun labelForIntensity(intensity: String): String = when (intensity) {
    "gentle" -> "Gentle"
    "moderate" -> "Moderate"
    "intense" -> "Intense"
    "hardcore" -> "Hardcore"
    else -> "Alarm"
}
