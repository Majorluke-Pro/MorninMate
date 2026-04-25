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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Alarm
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.WbSunny
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
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
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
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
private val AlarmPanel = Color(0xF2141424)
private val AlarmDawn = Color(0xFFFF6B35)
private val AlarmSunrise = Color(0xFFFFD166)
private val AlarmMint = Color(0xFF06D6A0)
private val AlarmText = Color(0xFFFFF5DF)
private val AlarmMuted = Color(0x99FFFFFF)
private val AlarmBorder = Color(0x12FFFFFF)

data class NativeAlarmItem(
    val id: String,
    val label: String,
    val time: String,
    val active: Boolean,
    val days: List<Int>,
    val intensity: String,
    val games: Int,
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
    var deleteTarget by remember { mutableStateOf<NativeAlarmItem?>(null) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(AlarmBg),
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
                            onDelete = { deleteTarget = it },
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
                .padding(end = 18.dp, bottom = 94.dp),
        ) {
            Icon(Icons.Default.Add, contentDescription = "Add alarm")
        }
    }

    val target = deleteTarget
    if (target != null) {
        AlertDialog(
            onDismissRequest = { deleteTarget = null },
            containerColor = Color(0xFF171E2B),
            title = { Text("Delete Alarm?", color = AlarmText, fontWeight = FontWeight.Black) },
            text = { Text("Remove \"${target.label.ifBlank { formatTime(target.time) }}\"?", color = AlarmMuted) },
            confirmButton = {
                Button(
                    onClick = {
                        emitAlarmAction("delete", target.id)
                        deleteTarget = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF476F)),
                ) {
                    Text("Delete", fontWeight = FontWeight.Black)
                }
            },
            dismissButton = {
                TextButton(onClick = { deleteTarget = null }) {
                    Text("Cancel", color = AlarmMuted)
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
        ?: if (nextAlarm != null) "Tomorrow focus" else "Build tomorrow tonight"

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                Brush.verticalGradient(
                    listOf(Color(0xFF16082E), Color(0xFF14142A), AlarmBg),
                ),
            )
            .drawBehind {
                drawCircle(Color(0x24FF6B35), radius = 175.dp.toPx(), center = Offset(size.width + 30.dp.toPx(), -38.dp.toPx()))
                drawCircle(Color(0x12FFD166), radius = 105.dp.toPx(), center = Offset(-20.dp.toPx(), size.height - 30.dp.toPx()))
            }
            .padding(horizontal = 20.dp, vertical = 22.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                Icon(Icons.Default.WbSunny, contentDescription = null, tint = AlarmDawn, modifier = Modifier.size(14.dp))
                Text("MORNINMATE", color = AlarmDawn, fontSize = 10.sp, fontWeight = FontWeight.Black, letterSpacing = 1.8.sp)
            }
            ClockPill(now)
        }

        Spacer(Modifier.height(18.dp))

        Surface(
            shape = RoundedCornerShape(24.dp),
            color = Color(0xC70F0F1C),
            border = BorderStroke(1.dp, Color(0x12FFFFFF)),
            shadowElevation = 8.dp,
        ) {
            Column(Modifier.padding(14.dp)) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Column(modifier = Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Box(Modifier.size(7.dp).background(Color(0xFFFF9A6D), CircleShape))
                            Text("${greeting(now.get(Calendar.HOUR_OF_DAY))}, ${data.userName}", color = AlarmMuted, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                        Spacer(Modifier.height(4.dp))
                        Text(title, color = AlarmText, fontSize = 31.sp, fontWeight = FontWeight.Black, lineHeight = 32.sp)
                        Text(subtitle, color = AlarmMuted, fontSize = 12.sp, maxLines = 1)
                    }
                    if (nextAlarm != null) {
                        Surface(shape = RoundedCornerShape(16.dp), color = Color.White.copy(alpha = 0.045f), border = BorderStroke(1.dp, Color(0x12FFFFFF))) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)) {
                                Text("NEXT", color = AlarmMuted, fontSize = 9.sp, fontWeight = FontWeight.Black)
                                Text("Tomorrow", color = Color(0xFFFFB07B), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
                Spacer(Modifier.height(12.dp))
                LinearProgressIndicator(
                    progress = { data.xpProgress },
                    modifier = Modifier.fillMaxWidth().height(6.dp),
                    color = AlarmDawn,
                    trackColor = Color.White.copy(alpha = 0.07f),
                )
                Spacer(Modifier.height(6.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("XP Progress", color = Color.White.copy(alpha = 0.48f), fontSize = 9.sp, fontWeight = FontWeight.Black)
                    Text("${data.xp % data.xpPerLevel}/${data.xpPerLevel}", color = Color.White.copy(alpha = 0.62f), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
private fun ClockPill(now: Calendar) {
    val hour = now.get(Calendar.HOUR)
    val displayHour = if (hour == 0) 12 else hour
    val minute = now.get(Calendar.MINUTE)
    val amPm = if (now.get(Calendar.AM_PM) == Calendar.AM) "AM" else "PM"
    Surface(shape = RoundedCornerShape(20.dp), color = Color(0xF2141424), border = BorderStroke(1.dp, Color(0x18FFFFFF))) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)) {
            Box(Modifier.size(8.dp).background(AlarmSunrise, CircleShape))
            Column {
                Text("%02d:%02d".format(displayHour, minute), color = AlarmText, fontSize = 16.sp, fontWeight = FontWeight.Black)
                Text(amPm, color = Color.White.copy(alpha = 0.42f), fontSize = 8.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun AlarmListHeader(data: NativeAlarmsData) {
    Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 18.dp)) {
        if (data.exactAlarmReady) {
            Text("✓  Alarm setup ready", color = AlarmMint.copy(alpha = 0.75f), fontSize = 11.sp, fontWeight = FontWeight.Bold)
        } else {
            ReadinessCard()
        }
        Spacer(Modifier.height(16.dp))
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Text("Your Alarms", color = AlarmText, fontSize = 18.sp, fontWeight = FontWeight.Bold)
            Surface(shape = RoundedCornerShape(12.dp), color = AlarmDawn.copy(alpha = 0.10f), border = BorderStroke(1.dp, AlarmDawn.copy(alpha = 0.18f))) {
                Text("${data.alarms.count { it.active }} active", color = AlarmDawn, fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp))
            }
        }
    }
}

@Composable
private fun ReadinessCard() {
    Surface(shape = RoundedCornerShape(20.dp), color = AlarmDawn.copy(alpha = 0.07f), border = BorderStroke(1.dp, AlarmDawn.copy(alpha = 0.18f))) {
        Row(modifier = Modifier.padding(14.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Icon(Icons.Default.Warning, contentDescription = null, tint = Color(0xFFFF9A6D), modifier = Modifier.size(30.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text("Finish Android alarm setup", color = AlarmText, fontSize = 15.sp, fontWeight = FontWeight.Black)
                Text("Exact alarm permission still needs attention before alarms can be trusted.", color = AlarmMuted, fontSize = 12.sp)
                Spacer(Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(onClick = { emitAlarmAction("settings") }, colors = ButtonDefaults.buttonColors(containerColor = AlarmDawn), shape = RoundedCornerShape(14.dp)) {
                        Text("Open Settings", fontSize = 11.sp, fontWeight = FontWeight.Bold)
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
    Surface(shape = RoundedCornerShape(24.dp), color = AlarmPanel, border = BorderStroke(1.dp, AlarmBorder)) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth().padding(28.dp)) {
            Icon(Icons.Default.Alarm, contentDescription = null, tint = AlarmDawn, modifier = Modifier.size(42.dp))
            Spacer(Modifier.height(10.dp))
            Text("No alarms yet", color = AlarmText, fontWeight = FontWeight.Black, fontSize = 18.sp)
            Text("Set your next wake-up to start building momentum.", color = AlarmMuted, fontSize = 12.sp)
            Spacer(Modifier.height(14.dp))
            Button(onClick = { openNativeAlarmEditor("create") }, colors = ButtonDefaults.buttonColors(containerColor = AlarmDawn), shape = RoundedCornerShape(16.dp)) {
                Text("Create alarm", fontWeight = FontWeight.Black)
            }
        }
    }
}

@Composable
private fun AlarmCardNative(
    alarm: NativeAlarmItem,
    isNext: Boolean,
    onDelete: (NativeAlarmItem) -> Unit,
) {
    val pulseColor = colorForIntensity(alarm.intensity)
    var active by remember(alarm.id) { mutableStateOf(alarm.active) }
    var menuOpen by remember(alarm.id) { mutableStateOf(false) }

    LaunchedEffect(alarm.active) {
        active = alarm.active
    }

    Box(modifier = Modifier.fillMaxWidth()) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .clickable { openNativeAlarmEditor("edit", alarm.id, alarmJson = alarm.rawJson) },
            shape = RoundedCornerShape(18.dp),
            color = if (active) AlarmPanel else Color(0xB010101A),
            border = BorderStroke(1.dp, if (active) pulseColor.copy(alpha = 0.20f) else Color(0x0DFFFFFF)),
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.weight(1f)) {
                        if (isNext) {
                            Surface(shape = RoundedCornerShape(8.dp), color = AlarmDawn.copy(alpha = 0.15f), border = BorderStroke(1.dp, AlarmDawn.copy(alpha = 0.30f))) {
                                Text("NEXT", color = AlarmDawn, fontSize = 8.sp, fontWeight = FontWeight.Black, modifier = Modifier.padding(horizontal = 7.dp, vertical = 2.dp))
                            }
                        }
                        Text(alarm.label.ifBlank { "Alarm" }, color = AlarmMuted, fontSize = 12.sp, maxLines = 1)
                    }
                    Switch(
                        checked = active,
                        onCheckedChange = { checked ->
                            active = checked
                            emitAlarmActiveChange(alarm.id, checked)
                        },
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = Color.White,
                            checkedTrackColor = AlarmDawn,
                            uncheckedThumbColor = Color.White.copy(alpha = 0.72f),
                            uncheckedTrackColor = Color.White.copy(alpha = 0.16f),
                            uncheckedBorderColor = Color.White.copy(alpha = 0.18f),
                        ),
                    )
                    Box {
                        IconButton(onClick = { menuOpen = true }) {
                            Icon(Icons.Default.MoreVert, contentDescription = "Actions", tint = Color.White.copy(alpha = 0.40f))
                        }
                        AlarmActionsMenu(
                            expanded = menuOpen,
                            onDismiss = { menuOpen = false },
                            onTest = {
                                menuOpen = false
                                emitAlarmAction("test", alarm.id)
                            },
                            onEdit = {
                                menuOpen = false
                                openNativeAlarmEditor("edit", alarm.id, alarmJson = alarm.rawJson)
                            },
                            onDelete = {
                                menuOpen = false
                                onDelete(alarm)
                            },
                        )
                    }
                }
                Text(formatTime(alarm.time), color = AlarmText.copy(alpha = if (active) 1f else 0.65f), fontSize = 43.sp, fontWeight = FontWeight.Black, lineHeight = 45.sp)
                if (alarm.days.isNotEmpty()) {
                    Spacer(Modifier.height(10.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        listOf("S", "M", "T", "W", "T", "F", "S").forEachIndexed { index, label ->
                            val on = alarm.days.contains(index)
                            Box(modifier = Modifier.size(25.dp).background(if (on) pulseColor.copy(alpha = 0.16f) else Color.White.copy(alpha = 0.04f), CircleShape), contentAlignment = Alignment.Center) {
                                Text(label, color = if (on) pulseColor else Color.White.copy(alpha = 0.18f), fontSize = 9.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
                Spacer(Modifier.height(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    Chip(labelForIntensity(alarm.intensity), pulseColor)
                    Chip("${alarm.games} game${if (alarm.games == 1) "" else "s"}", Color.White.copy(alpha = 0.34f))
                }
            }
        }
    }
}

@Composable
private fun AlarmActionsMenu(
    expanded: Boolean,
    onDismiss: () -> Unit,
    onTest: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
) {
    DropdownMenu(
        expanded = expanded,
        onDismissRequest = onDismiss,
        containerColor = Color(0xFF1A1A30),
        tonalElevation = 8.dp,
        shadowElevation = 12.dp,
    ) {
        DropdownMenuItem(
            text = { Text("Test alarm", color = AlarmText, fontWeight = FontWeight.Bold) },
            leadingIcon = { Icon(Icons.Default.PlayArrow, contentDescription = null, tint = AlarmDawn) },
            onClick = onTest,
        )
        DropdownMenuItem(
            text = { Text("Edit", color = AlarmText, fontWeight = FontWeight.Bold) },
            leadingIcon = { Icon(Icons.Default.Edit, contentDescription = null, tint = AlarmSunrise) },
            onClick = onEdit,
        )
        HorizontalDivider(color = Color.White.copy(alpha = 0.08f))
        DropdownMenuItem(
            text = { Text("Delete", color = Color(0xFFEF476F), fontWeight = FontWeight.Bold) },
            leadingIcon = { Icon(Icons.Default.Delete, contentDescription = null, tint = Color(0xFFEF476F)) },
            onClick = onDelete,
        )
    }
}

@Composable
private fun Chip(text: String, color: Color) {
    Surface(shape = RoundedCornerShape(12.dp), color = color.copy(alpha = 0.10f), border = BorderStroke(1.dp, color.copy(alpha = 0.18f))) {
        Text(text, color = color, fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 10.dp, vertical = 3.dp))
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
    "intense" -> Color(0xFFEF476F)
    "hardcore" -> Color(0xFFEF1C1C)
    else -> AlarmDawn
}

private fun labelForIntensity(intensity: String): String = when (intensity) {
    "gentle" -> "Gentle"
    "moderate" -> "Moderate"
    "intense" -> "Intense"
    "hardcore" -> "Hardcore"
    else -> "Alarm"
}
