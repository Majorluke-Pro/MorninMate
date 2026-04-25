package com.morninmate.app

import android.app.Activity
import android.app.TimePickerDialog
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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.core.view.WindowCompat
import org.json.JSONArray
import org.json.JSONObject
import java.util.Calendar

// ── Colours ──────────────────────────────────────────────────────────────────
private val Dawn      = Color(0xFFFF6B35)
private val Sunrise   = Color(0xFFFFD166)
private val Mint      = Color(0xFF06D6A0)
private val Danger    = Color(0xFFEF476F)
private val Hardcore  = Color(0xFFEF1C1C)
private val Night     = Color(0xFF0D0D1A)
private val Panel     = Color(0xFF171E2B)
private val PanelSoft = Color(0xFF20283A)
private val Row1      = Color(0xFF1C2336)   // alternating row tint inside cards
private val Divider   = Color(0xFF252D40)
private val TextPrimary = Color(0xFFFFF5DF)
private val TextMuted   = Color(0xFFA7ADC0)

// ── Data ─────────────────────────────────────────────────────────────────────
@Immutable private data class SoundOption(val id: String, val label: String, val desc: String, val color: Color)
@Immutable private data class IntensityOption(val id: String, val label: String, val desc: String, val xp: Int, val color: Color)
@Immutable private data class GameOption(val id: String, val label: String, val desc: String, val color: Color)

private val sounds = listOf(
    SoundOption("gentle_chime",  "Gentle Chime",  "Soft bell loop",            Sunrise),
    SoundOption("morning_birds", "Morning Birds",  "Light birdsong ambience",   Mint),
    SoundOption("soft_piano",    "Soft Piano",     "Warm mellow notes",         Color(0xFF9AD1D4)),
    SoundOption("rising_bell",   "Rising Bell",    "Gradually intensifies",     Color(0xFF8B5CF6)),
    SoundOption("classic_beep",  "Classic Beep",   "Traditional alarm tone",    Danger),
    SoundOption("digital_buzz",  "Digital Buzz",   "Sharp electronic beeps",    Dawn),
    SoundOption("urgent_ring",   "Urgent Ring",    "Fast ringing pattern",      Color(0xFFF97316)),
    SoundOption("radar_pulse",   "Radar Pulse",    "Repeating low pulse",       Color(0xFF06B6D4)),
)

private val repeatModes = listOf(
    "once"     to "Once",
    "custom"   to "Custom",
    "weekdays" to "Weekdays",
    "weekend"  to "Weekend",
    "every"    to "Every day",
)

private val dayLabels = listOf("Sun","Mon","Tue","Wed","Thu","Fri","Sat")

private val intensities = listOf(
    IntensityOption("gentle",   "Gentle",   "1 game · Easy",          20,  Mint),
    IntensityOption("moderate", "Moderate", "2 games · Normal",       35,  Sunrise),
    IntensityOption("intense",  "Intense",  "3 games · Hard",         60,  Danger),
    IntensityOption("hardcore", "Hardcore", "3 games · No escape",   100,  Hardcore),
)

private val games = listOf(
    GameOption("math",     "Math Blitz",    "Arithmetic to dismiss", Dawn),
    GameOption("memory",   "Memory Match",  "Flip and match pairs",  Sunrise),
    GameOption("reaction", "Reaction Rush", "Tap right on cue",      Mint),
)

private val requiredGamesByIntensity = mapOf(
    "gentle" to 1, "moderate" to 2, "intense" to 3, "hardcore" to 3,
)

// ── Activity ──────────────────────────────────────────────────────────────────
class CreateAlarmActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        setContent {
            NativeCreateAlarmScreen(
                defaultTime  = intent.getStringExtra("defaultTime"),
                initialAlarm = intent.getStringExtra("alarm"),
                onClose      = { finish() },
                onSave       = { result ->
                    setResult(Activity.RESULT_OK, Intent().putExtra("alarm", result.toString()))
                    finish()
                },
            )
        }
    }
}

// ── Screen ────────────────────────────────────────────────────────────────────
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun NativeCreateAlarmScreen(
    defaultTime: String?,
    initialAlarm: String?,
    onClose: () -> Unit,
    onSave: (JSONObject) -> Unit,
) {
    val context = LocalContext.current
    val alarm           = remember(initialAlarm) { parseInitialAlarm(initialAlarm) }
    val defaultCalendar = remember(defaultTime, alarm) { calendarFromDefaultTime(alarm?.optString("time") ?: defaultTime) }

    var label         by remember { mutableStateOf(alarm?.optString("label")?.takeIf { it.isNotBlank() } ?: "") }
    var hour          by remember { mutableStateOf(defaultCalendar.get(Calendar.HOUR_OF_DAY)) }
    var minute        by remember { mutableStateOf(defaultCalendar.get(Calendar.MINUTE)) }
    var sound         by remember { mutableStateOf(initialSound(alarm)) }
    var soundLabel    by remember { mutableStateOf(soundLabelFor(initialSound(alarm))) }
    var repeat        by remember { mutableStateOf(repeatFromDays(initialDays(alarm))) }
    var days          by remember { mutableStateOf(initialDays(alarm).toSet()) }
    var intensity     by remember { mutableStateOf(alarm?.optJSONObject("pulse")?.optString("intensity")?.takeIf { requiredGamesByIntensity.containsKey(it) } ?: "gentle") }
    var selectedGames by remember { mutableStateOf(initialGames(alarm, intensity)) }

    var showHardcoreWarning by remember { mutableStateOf(false) }
    var showSoundPicker     by remember { mutableStateOf(false) }
    var wakeExpanded        by remember { mutableStateOf(false) }

    val isEditing = alarm != null

    val ringtoneLauncher = rememberLauncherForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        if (result.resultCode != Activity.RESULT_OK) return@rememberLauncherForActivityResult
        val uri = result.data?.getParcelableExtra<android.net.Uri>(RingtoneManager.EXTRA_RINGTONE_PICKED_URI)
            ?: return@rememberLauncherForActivityResult
        val ringtone = RingtoneManager.getRingtone(context, uri)
        sound      = uri.toString()
        soundLabel = ringtone?.getTitle(context) ?: "Device sound"
    }

    val requiredGameCount by remember(intensity)  { derivedStateOf { requiredGamesByIntensity[intensity] ?: 0 } }
    val repeatComplete    by remember(repeat,days) { derivedStateOf { repeat != "custom" || days.isNotEmpty() } }
    val gamesComplete     by remember(intensity, selectedGames, requiredGameCount) {
        derivedStateOf { intensity == "hardcore" || selectedGames.size == requiredGameCount }
    }
    val canSave by remember(sound, intensity, repeatComplete, gamesComplete) {
        derivedStateOf { sound.isNotBlank() && intensity.isNotBlank() && repeatComplete && gamesComplete }
    }
    val missing by remember(repeatComplete, sound, intensity, gamesComplete) {
        derivedStateOf {
            listOfNotNull(
                if (!repeatComplete) "repeat" else null,
                if (sound.isBlank())     "sound"  else null,
                if (intensity.isBlank()) "intensity" else null,
                if (!gamesComplete)      "games"  else null,
            )
        }
    }

    // ── Dialogs ───────────────────────────────────────────────────────────────
    if (showHardcoreWarning) {
        AlertDialog(
            onDismissRequest = { showHardcoreWarning = false },
            containerColor   = Color(0xFF210808),
            title   = { Text("Are you sure?", color = TextPrimary, fontWeight = FontWeight.Black) },
            text    = {
                Text(
                    "Hardcore Mode forces maximum volume and locks your phone to this app until all 3 games are completed. There is no way out.",
                    color = TextMuted, lineHeight = 20.sp,
                )
            },
            confirmButton = {
                Button(
                    onClick = { intensity = "hardcore"; selectedGames = games.map { it.id }.toSet(); showHardcoreWarning = false },
                    colors  = ButtonDefaults.buttonColors(containerColor = Hardcore),
                ) { Text("Lock it in", fontWeight = FontWeight.Black) }
            },
            dismissButton = {
                TextButton(onClick = { showHardcoreWarning = false }) { Text("Cancel", color = TextMuted) }
            },
        )
    }

    if (showSoundPicker) {
        Dialog(onDismissRequest = { showSoundPicker = false }) {
            Surface(
                modifier      = Modifier.fillMaxWidth(),
                shape         = RoundedCornerShape(24.dp),
                color         = Panel,
                border        = BorderStroke(1.dp, Divider),
                tonalElevation = 12.dp,
            ) {
                Column(Modifier.padding(20.dp)) {
                    // drag handle
                    Box(
                        Modifier.align(Alignment.CenterHorizontally)
                            .width(36.dp).height(4.dp)
                            .background(Color.White.copy(alpha = 0.15f), CircleShape),
                    )
                    Spacer(Modifier.height(14.dp))
                    Text("Alarm Sound", color = TextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Black)
                    Text(soundLabel, color = Sunrise, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.height(12.dp))
                    // grouped list
                    GroupCard {
                        sounds.forEachIndexed { i, option ->
                            SoundPickerRow(
                                option   = option,
                                selected = sound == option.id,
                                isLast   = i == sounds.lastIndex,
                                onClick  = { sound = option.id; soundLabel = option.label },
                            )
                        }
                    }
                    Spacer(Modifier.height(10.dp))
                    OutlinedButton(
                        onClick  = {
                            ringtoneLauncher.launch(
                                Intent(RingtoneManager.ACTION_RINGTONE_PICKER).apply {
                                    putExtra(RingtoneManager.EXTRA_RINGTONE_TYPE, RingtoneManager.TYPE_ALARM)
                                    putExtra(RingtoneManager.EXTRA_RINGTONE_SHOW_DEFAULT, true)
                                    putExtra(RingtoneManager.EXTRA_RINGTONE_SHOW_SILENT, false)
                                },
                            )
                        },
                        modifier = Modifier.fillMaxWidth(),
                        border   = BorderStroke(1.dp, Sunrise.copy(alpha = 0.35f)),
                        shape    = RoundedCornerShape(14.dp),
                    ) { Text("Choose from device", color = TextPrimary, fontWeight = FontWeight.Bold) }
                    Spacer(Modifier.height(8.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedButton(
                            onClick  = { previewSound(context, sound) },
                            modifier = Modifier.weight(1f),
                            border   = BorderStroke(1.dp, Dawn.copy(alpha = 0.45f)),
                            shape    = RoundedCornerShape(14.dp),
                        ) { Text("Preview", color = Dawn, fontWeight = FontWeight.Black) }
                        Button(
                            onClick  = { showSoundPicker = false },
                            modifier = Modifier.weight(1f),
                            shape    = RoundedCornerShape(14.dp),
                            colors   = ButtonDefaults.buttonColors(containerColor = Dawn),
                        ) { Text("Done", fontWeight = FontWeight.Black) }
                    }
                }
            }
        }
    }

    // ── Layout ────────────────────────────────────────────────────────────────
    Scaffold(
        modifier       = Modifier.fillMaxSize(),
        containerColor = Night,
        topBar = {
            TopBar(
                title   = if (isEditing) "Edit Alarm" else "New Alarm",
                onClose = onClose,
                onSave  = {
                    if (!canSave) return@TopBar
                    onSave(
                        JSONObject()
                            .put("label",  label.ifBlank { "Alarm" })
                            .put("time",   "%02d:%02d".format(hour, minute))
                            .put("sound",  sound)
                            .put("days",   JSONArray(daysForRepeat(repeat, days)))
                            .put("pulse",  JSONObject()
                                .put("intensity", intensity)
                                .put("games",     JSONArray(selectedGames.toList()))
                                .put("sound",     sound)),
                    )
                },
                canSave = canSave,
            )
        },
        bottomBar = {
            if (!canSave) {
                Surface(
                    modifier       = Modifier.fillMaxWidth(),
                    color          = Night.copy(alpha = 0.97f),
                    border         = BorderStroke(1.dp, Sunrise.copy(alpha = 0.22f)),
                ) {
                    Text(
                        "Still needed: ${missing.joinToString(", ")}",
                        modifier = Modifier
                            .navigationBarsPadding()
                            .padding(horizontal = 20.dp, vertical = 12.dp),
                        color      = Sunrise,
                        fontSize   = 12.sp,
                        fontWeight = FontWeight.Bold,
                    )
                }
            }
        },
    ) { inner ->
        LazyColumn(
            modifier        = Modifier.fillMaxSize().padding(inner),
            contentPadding  = PaddingValues(horizontal = 16.dp, vertical = 20.dp),
            verticalArrangement = Arrangement.spacedBy(24.dp),
        ) {

            // ── Time & Label ─────────────────────────────────────────────────
            item(key = "time") {
                SectionLabel("Schedule")
                GroupCard {
                    // Time row
                    SettingsRow(
                        label    = "Wake-up time",
                        value    = formatTime12(hour, minute),
                        valueColor = Dawn,
                        isLast   = false,
                        onClick  = {
                            TimePickerDialog(context, { _, h, m -> hour = h; minute = m }, hour, minute, false).show()
                        },
                        trailing = {
                            Icon(Icons.Default.Edit, null, tint = TextMuted, modifier = Modifier.size(15.dp))
                        },
                    )
                    // Label row (inline text field styled as a row)
                    LabelRow(value = label, onValueChange = { label = it.take(40) })
                }
            }

            // ── Sound ────────────────────────────────────────────────────────
            item(key = "sound") {
                SectionLabel("Alarm Sound")
                GroupCard {
                    SettingsRow(
                        label    = "Sound",
                        value    = soundLabel,
                        isLast   = true,
                        onClick  = { showSoundPicker = true },
                    )
                }
            }

            // ── Repeat ───────────────────────────────────────────────────────
            item(key = "repeat") {
                SectionLabel("Repeat")
                GroupCard {
                    repeatModes.forEachIndexed { i, (id, displayLabel) ->
                        val isSelected = repeat == id
                        SettingsRow(
                            label    = displayLabel,
                            value    = if (isSelected && id == "custom" && days.isNotEmpty())
                                "${days.size} day${if (days.size == 1) "" else "s"}" else "",
                            isLast   = i == repeatModes.lastIndex && !(repeat == "custom"),
                            onClick  = {
                                repeat = id
                                days   = daysForRepeat(id, emptySet()).toSet()
                            },
                            trailing = {
                                if (isSelected) {
                                    Icon(Icons.Default.Check, null, tint = Dawn, modifier = Modifier.size(17.dp))
                                }
                            },
                        )
                    }
                    if (repeat == "custom") {
                        // Day picker row
                        Box(
                            Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 12.dp),
                        ) {
                            DayPicker(selectedDays = days, onToggle = { day ->
                                days = if (days.contains(day)) days - day else days + day
                            })
                        }
                        if (days.isEmpty()) {
                            Text(
                                "Pick at least one day",
                                modifier   = Modifier.padding(start = 16.dp, bottom = 10.dp),
                                color      = Sunrise,
                                fontSize   = 12.sp,
                                fontWeight = FontWeight.Bold,
                            )
                        }
                    }
                }
            }

            // ── Wake Check ───────────────────────────────────────────────────
            item(key = "wake") {
                SectionLabel("Wake Check")
                GroupCard {
                    // Intensity rows
                    intensities.forEachIndexed { i, option ->
                        val isSelected = intensity == option.id
                        val isLastIntensity = i == intensities.lastIndex
                        SettingsRow(
                            label      = option.label,
                            sublabel   = option.desc,
                            value      = "+${option.xp} XP",
                            valueColor = option.color,
                            isLast     = isLastIntensity && !wakeExpanded,
                            onClick    = {
                                if (option.id == "hardcore") showHardcoreWarning = true
                                else { intensity = option.id; selectedGames = emptySet() }
                            },
                            trailing = {
                                if (isSelected) Icon(Icons.Default.Check, null, tint = option.color, modifier = Modifier.size(17.dp))
                            },
                        )
                    }

                    // Expandable games section
                    if (intensity != "hardcore") {
                        ExpandableHeader(
                            label    = "Wake-up Games",
                            badge    = "${selectedGames.size}/$requiredGameCount",
                            expanded = wakeExpanded,
                            isLast   = !wakeExpanded,
                            onToggle = { wakeExpanded = !wakeExpanded },
                        )
                        if (wakeExpanded) {
                            games.forEachIndexed { i, game ->
                                val isSelected = selectedGames.contains(game.id)
                                SettingsRow(
                                    label    = game.label,
                                    sublabel = game.desc,
                                    isLast   = i == games.lastIndex,
                                    onClick  = {
                                        selectedGames = if (isSelected) selectedGames - game.id
                                        else if (selectedGames.size < requiredGameCount) selectedGames + game.id
                                        else selectedGames
                                    },
                                    trailing = {
                                        if (isSelected) Icon(Icons.Default.Check, null, tint = Dawn, modifier = Modifier.size(17.dp))
                                    },
                                )
                            }
                        }
                    } else {
                        // Hardcore: all games locked
                        ExpandableHeader(
                            label    = "Wake-up Games",
                            badge    = "3/3 locked",
                            expanded = wakeExpanded,
                            isLast   = !wakeExpanded,
                            onToggle = { wakeExpanded = !wakeExpanded },
                        )
                        if (wakeExpanded) {
                            games.forEachIndexed { i, game ->
                                SettingsRow(
                                    label    = game.label,
                                    sublabel = game.desc,
                                    isLast   = i == games.lastIndex,
                                    onClick  = {},
                                    trailing = {
                                        Icon(Icons.Default.Check, null, tint = Hardcore, modifier = Modifier.size(17.dp))
                                    },
                                )
                            }
                        }
                    }
                }
                if (!gamesComplete && intensity != "hardcore") {
                    Text(
                        "Choose $requiredGameCount game${if (requiredGameCount > 1) "s" else ""} to finish setup",
                        modifier   = Modifier.padding(start = 16.dp, top = 6.dp),
                        color      = Sunrise,
                        fontSize   = 12.sp,
                        fontWeight = FontWeight.Bold,
                    )
                }
            }

            item { Spacer(Modifier.height(8.dp)) }
        }
    }
}

// ── Reusable components ───────────────────────────────────────────────────────

@Composable
private fun TopBar(title: String, onClose: () -> Unit, onSave: () -> Unit, canSave: Boolean) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color    = Night.copy(alpha = 0.98f),
        border   = BorderStroke(1.dp, Divider),
    ) {
        Row(
            modifier            = Modifier.fillMaxWidth().statusBarsPadding().height(56.dp).padding(horizontal = 4.dp),
            verticalAlignment   = Alignment.CenterVertically,
        ) {
            IconButton(onClick = onClose) {
                Text("✕", color = TextMuted, fontSize = 16.sp, fontWeight = FontWeight.Bold)
            }
            Text(
                title,
                modifier   = Modifier.weight(1f).padding(horizontal = 4.dp),
                color      = TextPrimary,
                fontSize   = 17.sp,
                fontWeight = FontWeight.Black,
            )
            IconButton(onClick = onSave, enabled = canSave) {
                Icon(
                    Icons.Default.Check,
                    contentDescription = "Save",
                    tint   = if (canSave) Dawn else TextMuted.copy(alpha = 0.4f),
                    modifier = Modifier.size(22.dp),
                )
            }
        }
    }
}

/** iOS-style section label above a GroupCard */
@Composable
private fun SectionLabel(text: String) {
    Text(
        text.uppercase(),
        modifier   = Modifier.padding(start = 16.dp, bottom = 6.dp),
        color      = TextMuted,
        fontSize   = 11.sp,
        fontWeight = FontWeight.Bold,
        letterSpacing = 0.8.sp,
    )
}

/** Rounded card that wraps a group of rows */
@Composable
private fun GroupCard(content: @Composable () -> Unit) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape    = RoundedCornerShape(14.dp),
        color    = Panel,
        border   = BorderStroke(1.dp, Divider),
    ) {
        Column { content() }
    }
}

/** Single settings row: label left, value + chevron right */
@Composable
private fun SettingsRow(
    label: String,
    sublabel: String? = null,
    value: String = "",
    valueColor: Color = TextMuted,
    isLast: Boolean,
    onClick: () -> Unit,
    trailing: (@Composable () -> Unit)? = null,
) {
    Column {
        Row(
            modifier            = Modifier.fillMaxWidth().clickable(onClick = onClick).padding(horizontal = 16.dp, vertical = 13.dp),
            verticalAlignment   = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(label, color = TextPrimary, fontSize = 15.sp, fontWeight = FontWeight.Medium)
                if (sublabel != null) Text(sublabel, color = TextMuted, fontSize = 12.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
            if (value.isNotEmpty()) {
                Text(value, color = valueColor, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, maxLines = 1)
            }
            if (trailing != null) trailing()
            else Icon(Icons.Default.ChevronRight, null, tint = TextMuted.copy(alpha = 0.4f), modifier = Modifier.size(18.dp))
        }
        if (!isLast) Box(Modifier.fillMaxWidth().height(1.dp).padding(start = 16.dp).background(Divider))
    }
}

/** Expandable header row (for Wake-up Games) */
@Composable
private fun ExpandableHeader(label: String, badge: String, expanded: Boolean, isLast: Boolean, onToggle: () -> Unit) {
    Column {
        Box(Modifier.fillMaxWidth().height(1.dp).padding(start = 16.dp).background(Divider))
        Row(
            modifier            = Modifier.fillMaxWidth().clickable(onClick = onToggle).padding(horizontal = 16.dp, vertical = 13.dp),
            verticalAlignment   = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text(label, color = TextPrimary, fontSize = 15.sp, fontWeight = FontWeight.Medium, modifier = Modifier.weight(1f))
            Text(badge, color = TextMuted, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
            Icon(
                if (expanded) Icons.Default.ChevronRight else Icons.Default.ChevronRight,
                null,
                tint     = TextMuted.copy(alpha = 0.5f),
                modifier = Modifier.size(18.dp),
            )
        }
        if (!isLast && !expanded) Box(Modifier.fillMaxWidth().height(1.dp).padding(start = 16.dp).background(Divider))
    }
}

/** Inline text field as an iOS row */
@Composable
private fun LabelRow(value: String, onValueChange: (String) -> Unit) {
    Column {
        Box(Modifier.fillMaxWidth().height(1.dp).padding(start = 16.dp).background(Divider))
        Row(
            modifier          = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 13.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text("Label", color = TextPrimary, fontSize = 15.sp, fontWeight = FontWeight.Medium)
            BasicTextField(
                value         = value,
                onValueChange = onValueChange,
                singleLine    = true,
                textStyle     = TextStyle(color = TextPrimary, fontSize = 15.sp, fontWeight = FontWeight.Normal),
                cursorBrush   = Brush.verticalGradient(listOf(Dawn, Dawn)),
                modifier      = Modifier.weight(1f),
                decorationBox = { inner ->
                    Box(contentAlignment = Alignment.CenterEnd) {
                        if (value.isBlank()) Text("Optional", color = TextMuted, fontSize = 15.sp)
                        inner()
                    }
                },
            )
            Text("${value.length}/40", color = TextMuted.copy(alpha = if (value.isBlank()) 0f else 0.6f), fontSize = 11.sp)
        }
    }
}

/** Day-of-week pill row */
@Composable
private fun DayPicker(selectedDays: Set<Int>, onToggle: (Int) -> Unit) {
    Row(horizontalArrangement = Arrangement.spacedBy(5.dp)) {
        dayLabels.forEachIndexed { index, lbl ->
            val selected = selectedDays.contains(index)
            Box(
                modifier            = Modifier.weight(1f).clip(CircleShape)
                    .background(if (selected) Dawn else PanelSoft)
                    .clickable { onToggle(index) }
                    .padding(vertical = 9.dp),
                contentAlignment    = Alignment.Center,
            ) {
                Text(lbl.take(1), color = if (selected) Color.White else TextMuted, fontWeight = FontWeight.Black, fontSize = 12.sp)
            }
        }
    }
}

/** Sound row inside the picker sheet */
@Composable
private fun SoundPickerRow(option: SoundOption, selected: Boolean, isLast: Boolean, onClick: () -> Unit) {
    Column {
        Row(
            modifier            = Modifier.fillMaxWidth().clickable(onClick = onClick).padding(horizontal = 14.dp, vertical = 11.dp),
            verticalAlignment   = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Box(
                modifier         = Modifier.size(32.dp).background(option.color.copy(alpha = 0.15f), RoundedCornerShape(9.dp)),
                contentAlignment = Alignment.Center,
            ) { Text(option.label.first().toString(), color = option.color, fontWeight = FontWeight.Black, fontSize = 13.sp) }
            Column(modifier = Modifier.weight(1f)) {
                Text(option.label, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                Text(option.desc,  color = TextMuted,   fontSize = 12.sp)
            }
            if (selected) Icon(Icons.Default.Check, null, tint = Dawn, modifier = Modifier.size(17.dp))
        }
        if (!isLast) Box(Modifier.fillMaxWidth().height(1.dp).padding(start = 14.dp).background(Divider))
    }
}

// ── Pure helpers ──────────────────────────────────────────────────────────────

private fun formatTime12(hour: Int, minute: Int): String {
    val h12 = hour % 12
    return "%d:%02d %s".format(if (h12 == 0) 12 else h12, minute, if (hour >= 12) "PM" else "AM")
}

private fun parseInitialAlarm(json: String?): JSONObject? =
    if (json.isNullOrBlank()) null else try { JSONObject(json) } catch (_: Exception) { null }

private fun calendarFromDefaultTime(defaultTime: String?): Calendar {
    val cal   = Calendar.getInstance()
    val parts = defaultTime?.split(":")
    if (parts?.size == 2) {
        val h = parts[0].toIntOrNull()
        val m = parts[1].toIntOrNull()
        if (h != null && m != null && h in 0..23 && m in 0..59) {
            cal.set(Calendar.HOUR_OF_DAY, h); cal.set(Calendar.MINUTE, m)
            cal.set(Calendar.SECOND, 0);      cal.set(Calendar.MILLISECOND, 0)
            return cal
        }
    }
    return cal.apply { add(Calendar.MINUTE, 5) }
}

private fun initialSound(alarm: JSONObject?): String {
    val ps = alarm?.optJSONObject("pulse")?.optString("sound").orEmpty()
    return alarm?.optString("sound")?.takeIf { it.isNotBlank() }
        ?: ps.takeIf { it.isNotBlank() }
        ?: "gentle_chime"
}

private fun soundLabelFor(sound: String): String =
    sounds.firstOrNull { it.id == sound }?.label ?: "Device sound"

private fun initialDays(alarm: JSONObject?): List<Int> {
    val result = mutableListOf<Int>()
    val array  = alarm?.optJSONArray("days") ?: return result
    for (i in 0 until array.length()) { val d = array.optInt(i, -1); if (d in 0..6) result.add(d) }
    return result.distinct()
}

private fun initialGames(alarm: JSONObject?, intensity: String): Set<String> {
    if (intensity == "hardcore") return games.map { it.id }.toSet()
    val valid  = games.map { it.id }.toSet()
    val parsed = mutableSetOf<String>()
    val array  = alarm?.optJSONObject("pulse")?.optJSONArray("games")
    if (array != null) for (i in 0 until array.length()) { val g = array.optString(i); if (valid.contains(g)) parsed.add(g) }
    val required = requiredGamesByIntensity[intensity] ?: 1
    return parsed.takeIf { it.size == required } ?: games.take(required).map { it.id }.toSet()
}

private fun repeatFromDays(days: List<Int>): String = when (days.sorted()) {
    emptyList<Int>()           -> "once"
    listOf(1,2,3,4,5)          -> "weekdays"
    listOf(0,6)                -> "weekend"
    listOf(0,1,2,3,4,5,6)     -> "every"
    else                       -> "custom"
}

private fun daysForRepeat(repeat: String, customDays: Set<Int>): List<Int> = when (repeat) {
    "custom"   -> customDays.sorted()
    "weekdays" -> listOf(1,2,3,4,5)
    "weekend"  -> listOf(0,6)
    "every"    -> listOf(0,1,2,3,4,5,6)
    else       -> emptyList()
}

private fun repeatSummary(repeat: String, days: Set<Int>): String = when {
    repeat == "once"                    -> "One-time"
    repeat == "custom" && days.isEmpty()-> "Choose day(s)"
    repeat == "custom"                  -> "${days.size} day${if (days.size==1) "" else "s"}"
    repeat == "weekdays"                -> "5 days"
    repeat == "weekend"                 -> "2 days"
    repeat == "every"                   -> "Every day"
    else                                -> "Required"
}

private fun timeContextLabel(hour: Int): String = when (hour) {
    in 0..3  -> "Deep night"
    in 4..5  -> "Before dawn"
    in 6..7  -> "Early riser"
    in 8..9  -> "Morning sweet spot"
    in 10..11-> "Late morning"
    in 12..13-> "Midday"
    in 14..16-> "Afternoon"
    in 17..19-> "Evening"
    in 20..21-> "Night"
    else     -> "Late night"
}

private fun previewSound(context: android.content.Context, sound: String) {
    val intent = Intent(context, AlarmService::class.java)
        .putExtra("sound",     sound.ifBlank { "gentle_chime" })
        .putExtra("previewMs", 3000)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) context.startForegroundService(intent)
    else context.startService(intent)
}
