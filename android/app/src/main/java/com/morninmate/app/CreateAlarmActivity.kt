package com.morninmate.app

import android.app.Activity
import android.content.Intent
import android.media.RingtoneManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.core.view.WindowCompat
import kotlinx.coroutines.flow.distinctUntilChanged
import org.json.JSONArray
import org.json.JSONObject
import java.util.Calendar

private val Dawn = Color(0xFFFF6B35)
private val Sunrise = Color(0xFFFFD166)
private val Mint = Color(0xFF06D6A0)
private val Danger = Color(0xFFEF476F)
private val Hardcore = Color(0xFFEF1C1C)
private val Night = Color(0xFF0D0D1A)
private val Panel = Color(0xFF171E2B)
private val PanelSoft = Color(0xFF20283A)
private val TextPrimary = Color(0xFFFFF5DF)
private val TextMuted = Color(0xFFA7ADC0)
private val WheelRowHeight = 46.dp
private const val WheelVisibleRows = 5
private const val WheelCycles = 200

@Immutable
private data class SoundOption(val id: String, val label: String, val desc: String, val color: Color)
@Immutable
private data class IntensityOption(val id: String, val label: String, val desc: String, val xp: Int, val color: Color)
@Immutable
private data class GameOption(val id: String, val label: String, val desc: String, val color: Color)

private val sounds = listOf(
    SoundOption("gentle_chime", "Gentle Chime", "Soft bell loop", Sunrise),
    SoundOption("morning_birds", "Morning Birds", "Light birdsong ambience", Mint),
    SoundOption("soft_piano", "Soft Piano", "Warm mellow notes", Color(0xFF9AD1D4)),
    SoundOption("rising_bell", "Rising Bell", "Gradually intensifies", Color(0xFF8B5CF6)),
    SoundOption("classic_beep", "Classic Beep", "Traditional alarm tone", Danger),
    SoundOption("digital_buzz", "Digital Buzz", "Sharp electronic beeps", Dawn),
    SoundOption("urgent_ring", "Urgent Ring", "Fast ringing pattern", Color(0xFFF97316)),
    SoundOption("radar_pulse", "Radar Pulse", "Repeating low pulse", Color(0xFF06B6D4)),
)

private val repeatModes = listOf(
    "once" to "Once",
    "custom" to "Custom",
    "weekdays" to "Weekdays",
    "weekend" to "Weekend",
    "every" to "Every day",
)

private val dayLabels = listOf("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat")

private val intensities = listOf(
    IntensityOption("gentle", "Gentle", "1 game - Easy mode", 20, Mint),
    IntensityOption("moderate", "Moderate", "2 games - Normal mode", 35, Sunrise),
    IntensityOption("intense", "Intense", "3 games - Hard mode", 60, Danger),
    IntensityOption("hardcore", "Hardcore", "3 games - Hard - No escape", 100, Hardcore),
)

private val games = listOf(
    GameOption("math", "Math Blitz", "Arithmetic to dismiss", Dawn),
    GameOption("memory", "Memory Match", "Flip and match pairs", Sunrise),
    GameOption("reaction", "Reaction Rush", "Tap right on cue", Mint),
)

private val requiredGamesByIntensity = mapOf(
    "gentle" to 1,
    "moderate" to 2,
    "intense" to 3,
    "hardcore" to 3,
)

class CreateAlarmActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, false)

        setContent {
            NativeCreateAlarmScreen(
                defaultTime = intent.getStringExtra("defaultTime"),
                initialAlarm = intent.getStringExtra("alarm"),
                onClose = { finish() },
                onSave = { result ->
                    setResult(Activity.RESULT_OK, Intent().putExtra("alarm", result.toString()))
                    finish()
                },
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun NativeCreateAlarmScreen(
    defaultTime: String?,
    initialAlarm: String?,
    onClose: () -> Unit,
    onSave: (JSONObject) -> Unit,
) {
    val context = LocalContext.current
    val alarm = remember(initialAlarm) { parseInitialAlarm(initialAlarm) }
    val defaultCalendar = remember(defaultTime, alarm) { calendarFromDefaultTime(alarm?.optString("time") ?: defaultTime) }
    var label by remember { mutableStateOf(alarm?.optString("label")?.takeIf { it.isNotBlank() } ?: "") }
    var hour by remember { mutableStateOf(defaultCalendar.get(Calendar.HOUR_OF_DAY)) }
    var minute by remember { mutableStateOf(defaultCalendar.get(Calendar.MINUTE)) }
    var sound by remember { mutableStateOf(initialSound(alarm)) }
    var soundLabel by remember { mutableStateOf(soundLabelFor(initialSound(alarm))) }
    var repeat by remember { mutableStateOf(repeatFromDays(initialDays(alarm))) }
    var days by remember { mutableStateOf(initialDays(alarm).toSet()) }
    var intensity by remember { mutableStateOf(alarm?.optJSONObject("pulse")?.optString("intensity")?.takeIf { requiredGamesByIntensity.containsKey(it) } ?: "gentle") }
    var selectedGames by remember { mutableStateOf(initialGames(alarm, intensity)) }
    var showHardcoreWarning by remember { mutableStateOf(false) }
    var showSoundPicker by remember { mutableStateOf(false) }
    val isEditing = alarm != null

    val ringtoneLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.StartActivityForResult(),
    ) { result ->
        if (result.resultCode != Activity.RESULT_OK) return@rememberLauncherForActivityResult
        val uri = result.data?.getParcelableExtra<android.net.Uri>(RingtoneManager.EXTRA_RINGTONE_PICKED_URI)
            ?: return@rememberLauncherForActivityResult
        val ringtone = RingtoneManager.getRingtone(context, uri)
        sound = uri.toString()
        soundLabel = ringtone?.getTitle(context) ?: "Device sound"
    }

    val requiredGameCount by remember(intensity) {
        derivedStateOf { requiredGamesByIntensity[intensity] ?: 0 }
    }
    val repeatComplete by remember(repeat, days) {
        derivedStateOf { repeat != "custom" || days.isNotEmpty() }
    }
    val gamesComplete by remember(intensity, selectedGames, requiredGameCount) {
        derivedStateOf { intensity == "hardcore" || selectedGames.size == requiredGameCount }
    }
    val canSave by remember(sound, intensity, repeatComplete, gamesComplete) {
        derivedStateOf { sound.isNotBlank() && intensity.isNotBlank() && repeatComplete && gamesComplete }
    }
    val missing by remember(repeatComplete, sound, intensity, gamesComplete) {
        derivedStateOf {
            listOfNotNull(
                if (!repeatComplete) "repeat" else null,
                if (sound.isBlank()) "sound" else null,
                if (intensity.isBlank()) "intensity" else null,
                if (!gamesComplete) "games" else null,
            )
        }
    }

    if (showHardcoreWarning) {
        AlertDialog(
            onDismissRequest = { showHardcoreWarning = false },
            containerColor = Color(0xFF210808),
            title = {
                Text("Are you sure?", color = TextPrimary, fontWeight = FontWeight.Black)
            },
            text = {
                Text(
                    "Hardcore Mode forces maximum volume and locks your phone to this app until all 3 games are completed. There is no way out.",
                    color = TextMuted,
                    lineHeight = 20.sp,
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        intensity = "hardcore"
                        selectedGames = games.map { it.id }.toSet()
                        showHardcoreWarning = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Hardcore),
                ) {
                    Text("Lock it in", fontWeight = FontWeight.Black)
                }
            },
            dismissButton = {
                TextButton(onClick = { showHardcoreWarning = false }) {
                    Text("Cancel", color = TextMuted)
                }
            },
        )
    }

    if (showSoundPicker) {
        Dialog(onDismissRequest = { showSoundPicker = false }) {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(28.dp),
                color = Panel,
                border = BorderStroke(1.dp, Color(0x18FFFFFF)),
                tonalElevation = 12.dp,
            ) {
                Column(
                    modifier = Modifier
                        .background(
                            Brush.verticalGradient(
                                listOf(Color(0xFF20283A), Color(0xFF151A28)),
                            ),
                        )
                        .padding(18.dp),
                ) {
                    Box(
                        modifier = Modifier
                            .align(Alignment.CenterHorizontally)
                            .width(42.dp)
                            .height(4.dp)
                            .background(Color.White.copy(alpha = 0.18f), CircleShape),
                    )
                    Spacer(Modifier.height(16.dp))
                    Text("Alarm Sounds", color = TextPrimary, fontSize = 20.sp, fontWeight = FontWeight.Black)
                    Text(soundLabel, color = Sunrise, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(14.dp))
                    Column(
                        modifier = Modifier
                            .heightIn(max = 360.dp)
                            .verticalScroll(rememberScrollState()),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        sounds.forEach { option ->
                            SoundRow(
                                option = option,
                                selected = sound == option.id,
                                onClick = {
                                    sound = option.id
                                    soundLabel = option.label
                                },
                            )
                        }
                    }
                    Spacer(Modifier.height(12.dp))
                    OutlinedButton(
                        onClick = {
                            ringtoneLauncher.launch(
                                Intent(RingtoneManager.ACTION_RINGTONE_PICKER).apply {
                                    putExtra(RingtoneManager.EXTRA_RINGTONE_TYPE, RingtoneManager.TYPE_ALARM)
                                    putExtra(RingtoneManager.EXTRA_RINGTONE_SHOW_DEFAULT, true)
                                    putExtra(RingtoneManager.EXTRA_RINGTONE_SHOW_SILENT, false)
                                },
                            )
                        },
                        modifier = Modifier.fillMaxWidth(),
                        border = BorderStroke(1.dp, Sunrise.copy(alpha = 0.35f)),
                        shape = RoundedCornerShape(18.dp),
                    ) {
                        Text("Choose from device", color = TextPrimary, fontWeight = FontWeight.Bold)
                    }
                    Spacer(Modifier.height(10.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        OutlinedButton(
                            onClick = { previewSound(context, sound) },
                            modifier = Modifier.weight(1f),
                            border = BorderStroke(1.dp, Dawn.copy(alpha = 0.45f)),
                            shape = RoundedCornerShape(18.dp),
                        ) {
                            Text("Preview", color = Dawn, fontWeight = FontWeight.Black)
                        }
                        Button(
                            onClick = { showSoundPicker = false },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(18.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Dawn),
                        ) {
                            Text("Done", fontWeight = FontWeight.Black)
                        }
                    }
                }
            }
        }
    }

    MaterialTheme {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Night),
        ) {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Night)
                    .statusBarsPadding()
                    .navigationBarsPadding()
                    .padding(top = 84.dp, bottom = 112.dp),
                contentPadding = PaddingValues(horizontal = 20.dp),
            ) {
                item {
                    TimeCard(hour, minute) { pickedHour, pickedMinute ->
                        hour = pickedHour
                        minute = pickedMinute
                    }
                    Spacer(Modifier.height(18.dp))
                }

                item {
                    LabelField(
                        value = label,
                        onValueChange = { label = it.take(40) },
                    )
                    Text(
                        "${label.length}/40",
                        modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
                        color = TextMuted.copy(alpha = if (label.isBlank()) 0f else 1f),
                        fontSize = 12.sp,
                    )
                }

                item {
                    Section("Alarm sound", trailing = soundLabel) {
                        OutlinedButton(
                            onClick = { showSoundPicker = true },
                            modifier = Modifier.fillMaxWidth(),
                            border = BorderStroke(1.dp, Sunrise.copy(alpha = 0.35f)),
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Text("Alarm Sounds", color = TextPrimary, fontWeight = FontWeight.Black)
                                Text(soundLabel, color = TextMuted, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }

                item {
                    Section("Repeat", trailing = repeatSummary(repeat, days)) {
                        ChipRow(
                            options = repeatModes,
                            selected = repeat,
                            onSelected = { selected ->
                                repeat = selected
                                days = daysForRepeat(selected, emptySet()).toSet()
                            },
                        )
                        Spacer(Modifier.height(12.dp))
                        DayPicker(
                            enabled = repeat == "custom",
                            selectedDays = days,
                            onToggle = { day ->
                                days = if (days.contains(day)) days - day else days + day
                            },
                        )
                        if (repeat == "custom" && days.isEmpty()) {
                            Text(
                                "Pick at least one day for a custom repeat.",
                                modifier = Modifier.padding(top = 8.dp),
                                color = Sunrise,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                            )
                        }
                    }
                }

                item {
                    Section("Wake-up intensity") {
                        intensities.forEach { option ->
                            IntensityCard(
                                option = option,
                                selected = intensity == option.id,
                                onClick = {
                                    if (option.id == "hardcore") {
                                        showHardcoreWarning = true
                                    } else {
                                        intensity = option.id
                                        selectedGames = emptySet()
                                    }
                                },
                            )
                            Spacer(Modifier.height(8.dp))
                        }
                    }
                }

                item {
                    if (intensity != "hardcore") {
                        Section(
                            "Wake-up games",
                            trailing = "${selectedGames.size}/$requiredGameCount selected",
                        ) {
                            Text(
                                "Choose $requiredGameCount game${if (requiredGameCount > 1) "s" else ""}. All selected games must be completed to dismiss.",
                                color = TextMuted,
                                fontSize = 13.sp,
                            )
                            Spacer(Modifier.height(10.dp))
                            games.forEach { game ->
                                GameCard(
                                    option = game,
                                    selected = selectedGames.contains(game.id),
                                    onClick = {
                                        if (selectedGames.contains(game.id)) {
                                            selectedGames = selectedGames - game.id
                                        } else if (selectedGames.size < requiredGameCount) {
                                            selectedGames = selectedGames + game.id
                                        }
                                    },
                                )
                                Spacer(Modifier.height(8.dp))
                            }
                            if (!gamesComplete) {
                                Text(
                                    "Choose $requiredGameCount game${if (requiredGameCount > 1) "s" else ""} to finish setup.",
                                    color = Sunrise,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                )
                            }
                        }
                    } else {
                        Section("Wake-up games", trailing = "3/3 selected") {
                            Text(
                                "Hardcore uses all games and locks the app until every challenge is completed.",
                                color = TextMuted,
                                fontSize = 13.sp,
                            )
                            Spacer(Modifier.height(10.dp))
                            games.forEach { game ->
                                GameCard(option = game, selected = true, onClick = {})
                                Spacer(Modifier.height(8.dp))
                            }
                        }
                    }
                }

                item { Spacer(Modifier.height(28.dp)) }
            }
            HeaderBar(
                title = if (isEditing) "Edit alarm" else "New alarm",
                onClose = onClose,
                modifier = Modifier.align(Alignment.TopCenter),
            )
            SaveBar(
                canSave = canSave,
                missing = missing,
                saveLabel = if (isEditing) "Save changes" else "Set alarm",
                onSave = {
                    if (!canSave) return@SaveBar
                    onSave(
                        JSONObject()
                            .put("label", label.ifBlank { "Alarm" })
                            .put("time", "%02d:%02d".format(hour, minute))
                            .put("sound", sound)
                            .put("days", JSONArray(daysForRepeat(repeat, days)))
                            .put(
                                "pulse",
                                JSONObject()
                                    .put("intensity", intensity)
                                    .put("games", JSONArray(selectedGames.toList()))
                                    .put("sound", sound),
                            ),
                    )
                },
                modifier = Modifier.align(Alignment.BottomCenter),
            )
        }
    }
}

@Composable
private fun HeaderBar(title: String, onClose: () -> Unit, modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier
            .fillMaxWidth()
            .statusBarsPadding(),
        color = Night.copy(alpha = 0.98f),
        border = BorderStroke(1.dp, Color(0x0FFFFFFF)),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(72.dp)
                .padding(horizontal = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            IconButton(onClick = onClose) {
                Text("X", color = TextPrimary, fontWeight = FontWeight.Black)
            }
            Text(title, color = TextPrimary, fontSize = 22.sp, fontWeight = FontWeight.Black)
        }
    }
}

@Composable
private fun LabelField(value: String, onValueChange: (String) -> Unit) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        color = Panel,
        border = BorderStroke(1.dp, Color(0x22FFFFFF)),
    ) {
        BasicTextField(
            value = value,
            onValueChange = onValueChange,
            singleLine = true,
            textStyle = TextStyle(
                color = TextPrimary,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
            ),
            cursorBrush = Brush.verticalGradient(listOf(Dawn, Dawn)),
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 16.dp),
            decorationBox = { innerTextField ->
                if (value.isBlank()) {
                    Text("Label", color = TextMuted, fontSize = 16.sp)
                }
                innerTextField()
            },
        )
    }
}

@Composable
private fun TimeCard(hour: Int, minute: Int, onPicked: (Int, Int) -> Unit) {
    val period = if (hour >= 12) "PM" else "AM"
    val hour12 = hour % 12
    val displayHour = if (hour12 == 0) 12 else hour12
    val contextLabel = timeContextLabel(hour)

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(30.dp),
        colors = CardDefaults.cardColors(containerColor = Panel),
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Panel)
                .padding(24.dp),
        ) {
            Column {
                Text("Wake-up time", color = TextMuted, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(8.dp))
                Row(verticalAlignment = Alignment.Bottom) {
                    Text(
                        "%d:%02d".format(displayHour, minute),
                        color = TextPrimary,
                        fontSize = 56.sp,
                        fontWeight = FontWeight.Black,
                    )
                    Spacer(Modifier.width(10.dp))
                    Text(period, color = Sunrise, fontSize = 18.sp, fontWeight = FontWeight.Black)
                }
                Spacer(Modifier.height(12.dp))
                Text(contextLabel, color = Dawn, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(18.dp))
                TimeWheelPicker(hour = hour, minute = minute, onPicked = onPicked)
            }
            Box(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .size(32.dp)
                    .background(Dawn.copy(alpha = 0.15f), CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    imageVector = Icons.Default.Edit,
                    contentDescription = "Time picker",
                    tint = Dawn,
                    modifier = Modifier.size(16.dp),
                )
            }
        }
    }
}

@Composable
private fun TimeWheelPicker(hour: Int, minute: Int, onPicked: (Int, Int) -> Unit) {
    val period = if (hour >= 12) "PM" else "AM"
    val hour12 = hour % 12
    val displayHour = if (hour12 == 0) 12 else hour12
    val hours = remember { (1..12).toList() }
    val minutes = remember { (0..59).toList() }
    val periods = remember { listOf("AM", "PM") }

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        WheelColumn(
            values = hours,
            selectedValue = displayHour,
            label = "Hour",
            display = { it.toString() },
            onSelected = { pickedHour ->
                onPicked(to24Hour(pickedHour, period), minute)
            },
            modifier = Modifier.weight(1f),
        )
        WheelColumn(
            values = minutes,
            selectedValue = minute,
            label = "Minute",
            display = { "%02d".format(it) },
            onSelected = { pickedMinute -> onPicked(hour, pickedMinute) },
            modifier = Modifier.weight(1f),
        )
        WheelColumn(
            values = periods,
            selectedValue = period,
            label = "",
            display = { it },
            onSelected = { pickedPeriod ->
                onPicked(to24Hour(displayHour, pickedPeriod), minute)
            },
            modifier = Modifier.weight(0.82f),
        )
    }
}

@Composable
private fun <T> WheelColumn(
    values: List<T>,
    selectedValue: T,
    label: String,
    display: (T) -> String,
    onSelected: (T) -> Unit,
    modifier: Modifier = Modifier,
) {
    val valueCount = values.size.coerceAtLeast(1)
    val selectedIndex = values.indexOf(selectedValue).coerceAtLeast(0)
    val initialIndex = remember(valueCount) { (valueCount * WheelCycles / 2) + selectedIndex }
    val listState = rememberLazyListState(initialFirstVisibleItemIndex = initialIndex)
    val rowHeightPx = with(LocalDensity.current) { WheelRowHeight.toPx() }
    val virtualCount = valueCount * WheelCycles
    val centeredIndex by remember {
        derivedStateOf {
            (listState.firstVisibleItemIndex +
                if (listState.firstVisibleItemScrollOffset > rowHeightPx / 2f) 1 else 0)
                .coerceIn(0, virtualCount - 1)
        }
    }
    val centeredValueIndex by remember {
        derivedStateOf { wheelIndex(centeredIndex, valueCount) }
    }

    LaunchedEffect(selectedIndex) {
        if (!listState.isScrollInProgress && selectedIndex != centeredValueIndex) {
            listState.scrollToItem(nearestWheelIndex(centeredIndex, selectedIndex, valueCount))
        }
    }

    LaunchedEffect(listState, values) {
        snapshotFlow { centeredValueIndex }
            .distinctUntilChanged()
            .collect { index -> onSelected(values[index]) }
    }

    LaunchedEffect(listState, values) {
        snapshotFlow { listState.isScrollInProgress }
            .distinctUntilChanged()
            .collect { scrolling ->
                if (!scrolling) {
                    listState.animateScrollToItem(centeredIndex)
                }
            }
    }

    Column(modifier = modifier, horizontalAlignment = Alignment.CenterHorizontally) {
        if (label.isNotBlank()) {
            Text(label, color = TextMuted, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(6.dp))
        } else {
            Spacer(Modifier.height(25.dp))
        }
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(WheelRowHeight * WheelVisibleRows),
            contentAlignment = Alignment.Center,
        ) {
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(WheelRowHeight),
                shape = RoundedCornerShape(14.dp),
                color = Dawn.copy(alpha = 0.12f),
                border = BorderStroke(1.dp, Dawn.copy(alpha = 0.38f)),
            ) {}
            LazyColumn(
                state = listState,
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(vertical = WheelRowHeight * 2),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                items(virtualCount) { index ->
                    val valueIndex = wheelIndex(index, valueCount)
                    val value = values[valueIndex]
                    val selected = index == centeredIndex
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(WheelRowHeight)
                            .clickable { onSelected(value) },
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(
                            text = display(value),
                            color = if (selected) TextPrimary else TextMuted.copy(alpha = 0.58f),
                            fontSize = if (selected) 24.sp else 18.sp,
                            fontWeight = if (selected) FontWeight.Black else FontWeight.Bold,
                            textAlign = TextAlign.Center,
                        )
                    }
                }
            }
            Box(
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .fillMaxWidth()
                    .height(WheelRowHeight * 2)
                    .background(Brush.verticalGradient(listOf(Panel, Panel.copy(alpha = 0f)))),
            )
            Box(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .height(WheelRowHeight * 2)
                    .background(Brush.verticalGradient(listOf(Panel.copy(alpha = 0f), Panel))),
            )
        }
    }
}

private fun to24Hour(hour12: Int, period: String): Int =
    when {
        period == "AM" && hour12 == 12 -> 0
        period == "AM" -> hour12
        hour12 == 12 -> 12
        else -> hour12 + 12
    }

private fun wheelIndex(index: Int, valueCount: Int): Int =
    ((index % valueCount) + valueCount) % valueCount

private fun nearestWheelIndex(currentIndex: Int, selectedIndex: Int, valueCount: Int): Int {
    val currentValueIndex = wheelIndex(currentIndex, valueCount)
    val forward = (selectedIndex - currentValueIndex + valueCount) % valueCount
    val backward = forward - valueCount
    val delta = if (kotlin.math.abs(backward) < forward) backward else forward
    return currentIndex + delta
}

@Composable
private fun Section(
    title: String,
    trailing: String? = null,
    content: @Composable () -> Unit,
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(title, color = TextPrimary, fontSize = 15.sp, fontWeight = FontWeight.Black)
            if (trailing != null) {
                Text(trailing, color = TextMuted, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        }
        Spacer(Modifier.height(10.dp))
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(22.dp),
            color = Panel.copy(alpha = 0.78f),
        ) {
            Box(Modifier.padding(14.dp)) {
                Column {
                    content()
                }
            }
        }
        Spacer(Modifier.height(18.dp))
    }
}

@Composable
private fun SoundPicker(
    selectedSound: String,
    onSelected: (SoundOption) -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        sounds.chunked(2).forEach { row ->
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                row.forEach { sound ->
                    SoundCard(
                        option = sound,
                        selected = selectedSound == sound.id,
                        onClick = { onSelected(sound) },
                        modifier = Modifier.weight(1f),
                    )
                }
                if (row.size == 1) Spacer(Modifier.weight(1f))
            }
        }
    }
}

@Composable
private fun SoundCard(
    option: SoundOption,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier.clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        color = if (selected) option.color.copy(alpha = 0.12f) else PanelSoft,
        border = BorderStroke(1.dp, if (selected) option.color else Color(0x22FFFFFF)),
    ) {
        Column(Modifier.padding(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(10.dp)
                        .background(if (selected) option.color else TextMuted.copy(alpha = 0.35f), CircleShape),
                )
                Spacer(Modifier.width(8.dp))
                Text(option.label, color = TextPrimary, fontWeight = FontWeight.Black, fontSize = 13.sp)
            }
            Spacer(Modifier.height(4.dp))
            Text(option.desc, color = TextMuted, fontSize = 11.sp, lineHeight = 14.sp)
        }
    }
}

@Composable
private fun SoundRow(option: SoundOption, selected: Boolean, onClick: () -> Unit) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(18.dp),
        color = if (selected) option.color.copy(alpha = 0.13f) else Color.White.copy(alpha = 0.045f),
        border = BorderStroke(1.dp, if (selected) option.color.copy(alpha = 0.75f) else Color.White.copy(alpha = 0.08f)),
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .background(option.color.copy(alpha = 0.18f), CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                Text(option.label.first().toString(), color = option.color, fontWeight = FontWeight.Black)
            }
            Column(modifier = Modifier.weight(1f)) {
                Text(option.label, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Black)
                Text(option.desc, color = TextMuted, fontSize = 12.sp)
            }
            if (selected) {
                Box(
                    modifier = Modifier
                        .size(22.dp)
                        .background(option.color, CircleShape),
                    contentAlignment = Alignment.Center,
                ) {
                    Text("✓", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Black)
                }
            }
        }
    }
}

@Composable
private fun DayPicker(
    enabled: Boolean,
    selectedDays: Set<Int>,
    onToggle: (Int) -> Unit,
) {
    Row(horizontalArrangement = Arrangement.spacedBy(5.dp)) {
        dayLabels.forEachIndexed { index, label ->
            val selected = selectedDays.contains(index)
            Surface(
                modifier = Modifier
                    .weight(1f)
                    .clickable(enabled = enabled) { onToggle(index) },
                shape = CircleShape,
                color = when {
                    selected -> Dawn
                    enabled -> PanelSoft
                    else -> PanelSoft.copy(alpha = 0.45f)
                },
                border = BorderStroke(1.dp, if (selected) Dawn else Color(0x22FFFFFF)),
            ) {
                Box(contentAlignment = Alignment.Center, modifier = Modifier.padding(vertical = 10.dp)) {
                    Text(
                        label.take(1),
                        color = if (selected) Color.White else TextMuted,
                        fontWeight = FontWeight.Black,
                        fontSize = 12.sp,
                    )
                }
            }
        }
    }
}

@Composable
private fun IntensityCard(option: IntensityOption, selected: Boolean, onClick: () -> Unit) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(18.dp),
        color = if (selected) option.color.copy(alpha = 0.10f) else PanelSoft,
        border = BorderStroke(1.dp, if (selected) option.color.copy(alpha = 0.65f) else Color(0x18FFFFFF)),
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .background(option.color.copy(alpha = 0.18f), RoundedCornerShape(14.dp)),
                contentAlignment = Alignment.Center,
            ) {
                Text(option.label.first().toString(), color = option.color, fontWeight = FontWeight.Black)
            }
            Column(modifier = Modifier.weight(1f)) {
                Text(option.label, color = if (selected) option.color else TextPrimary, fontWeight = FontWeight.Black)
                Text(option.desc, color = TextMuted, fontSize = 12.sp)
            }
            Text("+${option.xp} XP", color = option.color, fontWeight = FontWeight.Black, fontSize = 12.sp)
        }
    }
}

@Composable
private fun GameCard(option: GameOption, selected: Boolean, onClick: () -> Unit) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(18.dp),
        color = if (selected) option.color.copy(alpha = 0.10f) else PanelSoft,
        border = BorderStroke(1.dp, if (selected) option.color.copy(alpha = 0.65f) else Color(0x18FFFFFF)),
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .background(option.color.copy(alpha = 0.18f), RoundedCornerShape(14.dp)),
                contentAlignment = Alignment.Center,
            ) {
                Text(option.label.first().toString(), color = option.color, fontWeight = FontWeight.Black)
            }
            Column(modifier = Modifier.weight(1f)) {
                Text(option.label, color = TextPrimary, fontWeight = FontWeight.Black)
                Text(option.desc, color = TextMuted, fontSize = 12.sp)
            }
            Box(
                modifier = Modifier
                    .size(24.dp)
                    .background(if (selected) option.color else Color.Transparent, CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                if (selected) Text("✓", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Black)
            }
        }
    }
}

@Composable
private fun ChipRow(
    options: List<Pair<String, String>>,
    selected: String,
    onSelected: (String) -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        options.chunked(3).forEach { row ->
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                row.forEach { (value, label) ->
                    val isSelected = selected == value
                    Surface(
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(18.dp),
                        color = if (isSelected) Dawn.copy(alpha = 0.22f) else PanelSoft,
                        border = BorderStroke(1.dp, if (isSelected) Dawn else Color(0x33FFFFFF)),
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onSelected(value) }
                                .padding(horizontal = 12.dp, vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center,
                        ) {
                            if (isSelected) {
                                Box(
                                    modifier = Modifier
                                        .size(8.dp)
                                        .background(Sunrise, CircleShape),
                                )
                                Spacer(Modifier.width(7.dp))
                            }
                            Text(
                                label,
                                color = if (isSelected) TextPrimary else TextMuted,
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp,
                                maxLines = 1,
                            )
                        }
                    }
                }
                repeat(3 - row.size) {
                    Spacer(Modifier.weight(1f))
                }
            }
        }
    }
}

@Composable
private fun SaveBar(
    canSave: Boolean,
    missing: List<String>,
    saveLabel: String,
    onSave: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier.fillMaxWidth(),
        color = Night.copy(alpha = 0.96f),
        tonalElevation = 8.dp,
        border = BorderStroke(1.dp, Color(0x12FFFFFF)),
    ) {
        Column(
            modifier = Modifier
                .navigationBarsPadding()
                .padding(horizontal = 16.dp, vertical = 10.dp),
        ) {
            if (!canSave) {
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    color = Sunrise.copy(alpha = 0.10f),
                    border = BorderStroke(1.dp, Sunrise.copy(alpha = 0.22f)),
                ) {
                    Text(
                        "Still choose: ${missing.joinToString(", ")}.",
                        modifier = Modifier.padding(8.dp),
                        color = Sunrise,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Black,
                    )
                }
                Spacer(Modifier.height(8.dp))
            }
            Button(
                onClick = onSave,
                enabled = canSave,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                shape = RoundedCornerShape(18.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Dawn, disabledContainerColor = PanelSoft),
            ) {
                Text(
                    if (canSave) saveLabel else "Choose all required settings",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Black,
                )
            }
        }
    }
}

private fun parseInitialAlarm(alarmJson: String?): JSONObject? {
    if (alarmJson.isNullOrBlank()) return null
    return try {
        JSONObject(alarmJson)
    } catch (_: Exception) {
        null
    }
}

private fun calendarFromDefaultTime(defaultTime: String?): Calendar {
    val calendar = Calendar.getInstance()
    val parts = defaultTime?.split(":")
    if (parts?.size == 2) {
        val h = parts[0].toIntOrNull()
        val m = parts[1].toIntOrNull()
        if (h != null && m != null && h in 0..23 && m in 0..59) {
            calendar.set(Calendar.HOUR_OF_DAY, h)
            calendar.set(Calendar.MINUTE, m)
            calendar.set(Calendar.SECOND, 0)
            calendar.set(Calendar.MILLISECOND, 0)
            return calendar
        }
    }
    return calendar.apply { add(Calendar.MINUTE, 5) }
}

private fun initialSound(alarm: JSONObject?): String {
    val pulseSound = alarm?.optJSONObject("pulse")?.optString("sound").orEmpty()
    return alarm?.optString("sound")?.takeIf { it.isNotBlank() }
        ?: pulseSound.takeIf { it.isNotBlank() }
        ?: "gentle_chime"
}

private fun soundLabelFor(sound: String): String {
    return sounds.firstOrNull { it.id == sound }?.label ?: "Device sound"
}

private fun initialDays(alarm: JSONObject?): List<Int> {
    val result = mutableListOf<Int>()
    val array = alarm?.optJSONArray("days") ?: return result
    for (i in 0 until array.length()) {
        val day = array.optInt(i, -1)
        if (day in 0..6) result.add(day)
    }
    return result.distinct()
}

private fun initialGames(alarm: JSONObject?, intensity: String): Set<String> {
    if (intensity == "hardcore") return games.map { it.id }.toSet()
    val validGames = games.map { it.id }.toSet()
    val parsed = mutableSetOf<String>()
    val array = alarm?.optJSONObject("pulse")?.optJSONArray("games")
    if (array != null) {
        for (i in 0 until array.length()) {
            val game = array.optString(i)
            if (validGames.contains(game)) parsed.add(game)
        }
    }
    val required = requiredGamesByIntensity[intensity] ?: 1
    return parsed.takeIf { it.size == required } ?: games.take(required).map { it.id }.toSet()
}

private fun repeatFromDays(days: List<Int>): String {
    val sorted = days.sorted()
    return when (sorted) {
        emptyList<Int>() -> "once"
        listOf(1, 2, 3, 4, 5) -> "weekdays"
        listOf(0, 6) -> "weekend"
        listOf(0, 1, 2, 3, 4, 5, 6) -> "every"
        else -> "custom"
    }
}

private fun daysForRepeat(repeat: String, customDays: Set<Int>): List<Int> {
    return when (repeat) {
        "custom" -> customDays.sorted()
        "weekdays" -> listOf(1, 2, 3, 4, 5)
        "weekend" -> listOf(0, 6)
        "every" -> listOf(0, 1, 2, 3, 4, 5, 6)
        else -> emptyList()
    }
}

private fun repeatSummary(repeat: String, days: Set<Int>): String {
    return when {
        repeat == "once" -> "One-time alarm"
        repeat == "custom" && days.isEmpty() -> "Choose day(s)"
        repeat == "custom" -> "${days.size} day${if (days.size == 1) "" else "s"}"
        repeat == "weekdays" -> "5 days"
        repeat == "weekend" -> "2 days"
        repeat == "every" -> "Every day"
        else -> "Required"
    }
}

private fun timeContextLabel(hour: Int): String {
    return when (hour) {
        in 0..3 -> "Deep night"
        in 4..5 -> "Before dawn"
        in 6..7 -> "Early riser"
        in 8..9 -> "Morning sweet spot"
        in 10..11 -> "Late morning"
        in 12..13 -> "Midday"
        in 14..16 -> "Afternoon"
        in 17..19 -> "Evening"
        in 20..21 -> "Night"
        else -> "Late night"
    }
}

private fun previewSound(context: android.content.Context, sound: String) {
    val intent = Intent(context, AlarmService::class.java)
        .putExtra("sound", sound.ifBlank { "gentle_chime" })
        .putExtra("previewMs", 3000)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.startForegroundService(intent)
    } else {
        context.startService(intent)
    }
}
