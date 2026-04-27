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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Alarm
import androidx.compose.material.icons.filled.BatteryChargingFull
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.Calculate
import androidx.compose.material.icons.filled.DeleteForever
import androidx.compose.material.icons.filled.DirectionsRun
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Face
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material.icons.filled.NightsStay
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Psychology
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Style
import androidx.compose.material.icons.filled.TrackChanges
import androidx.compose.material.icons.filled.WbSunny
import androidx.compose.material.icons.filled.WbTwilight
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.ViewCompositionStrategy
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.util.Calendar

private val ProfileBg = Color(0xFF0D0D1A)
private val ProfilePanel = Color(0xFF141A2B)
private val ProfileDawn = Color(0xFFFF6B35)
private val ProfileGold = Color(0xFFFFD166)
private val ProfileMint = Color(0xFF06D6A0)
private val ProfileDanger = Color(0xFFEF476F)
private val ProfileText = Color(0xFFFFF5DF)
private val ProfileMuted = Color(0x99FFFFFF)
private val ProfileBorder = Color(0x16FFFFFF)
private val ProfileInput = Color(0xFF101625)

private data class ProfileOption(
    val value: String,
    val label: String,
    val icon: ImageVector,
    val color: Color,
)

private data class ProfileRatingOption(
    val value: Int,
    val label: String,
    val icon: ImageVector,
)

private data class ProfileDraft(
    val userName: String,
    val age: String,
    val country: String,
    val defaultWakeTime: String,
    val morningRating: Int,
    val favoriteGame: String,
    val wakeGoal: String,
    val profileIcon: String,
)

private val morningTypeOptions = listOf(
    ProfileRatingOption(1, "Night Owl", Icons.Default.NightsStay),
    ProfileRatingOption(2, "Slow Starter", Icons.Default.Alarm),
    ProfileRatingOption(3, "In Between", Icons.Default.WbSunny),
    ProfileRatingOption(4, "Early Bird", Icons.Default.WbTwilight),
    ProfileRatingOption(5, "Morning Person", Icons.Default.Bolt),
)

private val gameOptions = listOf(
    ProfileOption("math", "Math Blitz", Icons.Default.Calculate, ProfileDawn),
    ProfileOption("memory", "Memory Match", Icons.Default.Style, ProfileGold),
    ProfileOption("reaction", "Reaction Rush", Icons.Default.Bolt, ProfileMint),
)

private val avatarOptions = listOf(
    ProfileOption("bolt", "Bolt", Icons.Default.Bolt, ProfileDawn),
    ProfileOption("sun", "Sun", Icons.Default.WbSunny, ProfileGold),
    ProfileOption("focus", "Focus", Icons.Default.TrackChanges, ProfileMint),
    ProfileOption("mind", "Mind", Icons.Default.Psychology, Color(0xFFA78BFA)),
    ProfileOption("run", "Run", Icons.Default.DirectionsRun, Color(0xFF60A5FA)),
    ProfileOption("face", "Face", Icons.Default.Face, ProfileDawn),
)

data class ProfileData(
    val userName: String,
    val age: String,
    val country: String,
    val defaultWakeTime: String,
    val morningRating: Int,
    val favoriteGame: String,
    val wakeGoal: String,
    val profileIcon: String,
    val level: Int,
    val xp: Int,
    val xpPerLevel: Int,
    val streak: Int,
    val alarmsCount: Int,
    val exactAlarmReady: Boolean,
    val email: String = "",
)

private var nativeProfileActivity: ComponentActivity? = null
private var nativeProfileView: ComposeView? = null
private val profileState = mutableStateOf<ProfileData?>(null)

fun setupNativeProfileScreen(activity: ComponentActivity) {
    nativeProfileActivity = activity
    val root = activity.window.decorView.findViewById<FrameLayout>(android.R.id.content)
    nativeProfileView?.let { root.removeView(it) }

    val composeView = ComposeView(activity).apply {
        isClickable = true
        visibility = View.GONE
        elevation = 42f
        translationZ = 42f
        setViewCompositionStrategy(ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed)
        setContent {
            profileState.value?.let { NativeProfileScreen(it) }
        }
    }
    root.addView(
        composeView,
        FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT,
        ),
    )
    nativeProfileView = composeView
}

fun showNativeProfile(data: ProfileData) {
    if (profileState.value != data) {
        profileState.value = data
    }
}

fun setNativeProfileScreenVisible(visible: Boolean) {
    val hasData = profileState.value != null
    nativeProfileView?.post {
        val nextVisibility = if (visible && hasData) View.VISIBLE else View.GONE
        if (nativeProfileView?.visibility != nextVisibility) {
            nativeProfileView?.visibility = nextVisibility
        }
    }
}

@Composable
private fun NativeProfileScreen(data: ProfileData) {
    var editing by remember { mutableStateOf(false) }
    var draft by remember(data) { mutableStateOf(data.toDraft()) }
    var showLogOffConfirm by remember { mutableStateOf(false) }
    var showDeleteConfirm by remember { mutableStateOf(false) }
    val currentYear = remember { Calendar.getInstance().get(Calendar.YEAR) }
    val birthYear = draft.age.toIntOrNull()
    val canSave = draft.userName.trim().isNotBlank() &&
        draft.country.trim().isNotBlank() &&
        draft.defaultWakeTime.matches(Regex("""\d{2}:\d{2}""")) &&
        birthYear != null &&
        birthYear in (currentYear - 100)..currentYear

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(ProfileBg)
            .statusBarsPadding()
            .navigationBarsPadding()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp)
            .padding(bottom = 112.dp),
    ) {
        Spacer(Modifier.height(22.dp))
        ProfileHero(
            data = if (editing) data.copy(userName = draft.userName, profileIcon = draft.profileIcon) else data,
            editing = editing,
            onEdit = {
                draft = data.toDraft()
                editing = true
            },
        )
        Spacer(Modifier.height(16.dp))
        if (editing) {
            ProfileEditor(
                draft = draft,
                onDraftChange = { draft = it },
                canSave = canSave,
                onCancel = {
                    draft = data.toDraft()
                    editing = false
                },
                onSave = {
                    if (!canSave) return@ProfileEditor
                    (nativeProfileActivity as? MainActivity)?.updateNativeProfile(
                        draft.userName.trim(),
                        draft.defaultWakeTime,
                        draft.favoriteGame,
                        draft.morningRating,
                        draft.wakeGoal.trim(),
                        draft.age,
                        draft.country.trim(),
                        draft.profileIcon,
                    )
                    editing = false
                },
            )
        } else {
            ProfileSummary(data)
            Spacer(Modifier.height(16.dp))
            ProfileStatus(data)
            Spacer(Modifier.height(16.dp))
            ProfileSettings()
            Spacer(Modifier.height(16.dp))
            AccountActions(
                onLogOff = { showLogOffConfirm = true },
                onDeleteData = { showDeleteConfirm = true },
            )
        }
    }

    if (showLogOffConfirm) {
        AlertDialog(
            onDismissRequest = { showLogOffConfirm = false },
            containerColor = ProfilePanel,
            title = { Text("Log off?", color = ProfileText, fontWeight = FontWeight.Black) },
            text = { Text("This signs the current profile out on this phone and sends you back to setup. Alarms stay saved on the device.", color = ProfileMuted) },
            confirmButton = {
                Button(
                    onClick = {
                        (nativeProfileActivity as? MainActivity)?.handleNativeAlarmAction("logOff", null)
                        showLogOffConfirm = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = ProfileDawn),
                ) {
                    Text("Log off", fontWeight = FontWeight.Black)
                }
            },
            dismissButton = {
                TextButton(onClick = { showLogOffConfirm = false }) {
                    Text("Cancel", color = ProfileMuted)
                }
            },
        )
    }

    if (showDeleteConfirm) {
        AlertDialog(
            onDismissRequest = { showDeleteConfirm = false },
            containerColor = Color(0xFF210808),
            title = { Text("Delete all data?", color = ProfileText, fontWeight = FontWeight.Black) },
            text = { Text("This removes alarms, stats, and profile setup from this phone. Your account stays signed in.", color = ProfileMuted) },
            confirmButton = {
                Button(
                    onClick = {
                        (nativeProfileActivity as? MainActivity)?.handleNativeAlarmAction("deleteData", null)
                        showDeleteConfirm = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = ProfileDanger),
                ) {
                    Text("Delete data", fontWeight = FontWeight.Black)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteConfirm = false }) {
                    Text("Cancel", color = ProfileMuted)
                }
            },
        )
    }
}

@Composable
private fun ProfileHero(data: ProfileData, editing: Boolean, onEdit: () -> Unit) {
    val avatar = avatarOptions.firstOrNull { it.value == data.profileIcon } ?: avatarOptions.first()

    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        color = ProfilePanel,
        border = BorderStroke(1.dp, ProfileBorder),
        shadowElevation = 8.dp,
    ) {
        Column(
            modifier = Modifier
                .background(Brush.verticalGradient(listOf(Color(0xFF20283A), ProfilePanel)))
                .padding(18.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .background(avatar.color.copy(alpha = 0.18f), CircleShape),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(avatar.icon, contentDescription = null, tint = avatar.color, modifier = Modifier.size(34.dp))
                }
                Column(modifier = Modifier.weight(1f)) {
                    Text(data.userName, color = ProfileText, fontSize = 24.sp, fontWeight = FontWeight.Black)
                    Text("Level ${data.level} ${rankLabelFor(data.level)}", color = ProfileGold, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                }
                if (!editing) {
                    IconButton(
                        onClick = onEdit,
                        modifier = Modifier
                            .size(40.dp)
                            .background(Color.White.copy(alpha = 0.08f), CircleShape),
                    ) {
                        Icon(Icons.Default.Edit, contentDescription = "Edit profile", tint = ProfileText)
                    }
                }
            }
            Spacer(Modifier.height(18.dp))
            LinearProgressIndicator(
                progress = { ((data.xp % data.xpPerLevel).toFloat() / data.xpPerLevel).coerceIn(0f, 1f) },
                modifier = Modifier.fillMaxWidth().height(7.dp),
                color = ProfileDawn,
                trackColor = Color.White.copy(alpha = 0.08f),
            )
            Spacer(Modifier.height(8.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("${data.xp} total XP", color = ProfileMuted, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                Text("${data.streak} day streak", color = ProfileMint, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun ProfileSummary(data: ProfileData) {
    val morningType = morningTypeOptions.firstOrNull { it.value == data.morningRating }?.label ?: "In Between"
    val favoriteGame = gameOptions.firstOrNull { it.value == data.favoriteGame }?.label ?: "Math Blitz"
    val avatar = avatarOptions.firstOrNull { it.value == data.profileIcon }?.label ?: "Bolt"

    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(22.dp),
        color = ProfilePanel,
        border = BorderStroke(1.dp, ProfileBorder),
    ) {
        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("Profile", color = ProfileText, fontSize = 17.sp, fontWeight = FontWeight.Black)
            if (data.email.isNotBlank()) ProfileRow("Account", data.email)
            ProfileRow("Birth year", data.age.ifBlank { "-" })
            ProfileRow("Country", data.country.ifBlank { "-" })
            ProfileRow("Wake time", formatProfileTime(data.defaultWakeTime))
            ProfileRow("Morning type", morningType)
            ProfileRow("Wake-up game", favoriteGame)
            ProfileRow("Profile icon", avatar)
            if (data.wakeGoal.isNotBlank()) {
                ProfileRow("Morning goal", data.wakeGoal)
            }
        }
    }
}

@Composable
private fun ProfileEditor(
    draft: ProfileDraft,
    onDraftChange: (ProfileDraft) -> Unit,
    canSave: Boolean,
    onCancel: () -> Unit,
    onSave: () -> Unit,
) {
    val context = LocalContext.current
    val timeParts = draft.defaultWakeTime.split(":")
    val hour = timeParts.getOrNull(0)?.toIntOrNull()?.coerceIn(0, 23) ?: 7
    val minute = timeParts.getOrNull(1)?.toIntOrNull()?.coerceIn(0, 59) ?: 0

    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(22.dp),
        color = ProfilePanel,
        border = BorderStroke(1.dp, ProfileBorder),
    ) {
        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            Text("Edit profile", color = ProfileText, fontSize = 17.sp, fontWeight = FontWeight.Black)

            ProfileFieldLabel("Display name")
            ProfileTextField(
                value = draft.userName,
                onValueChange = { onDraftChange(draft.copy(userName = it.take(30))) },
                placeholder = "How should MorninMate greet you?",
            )

            ProfileFieldLabel("Birth year")
            ProfileTextField(
                value = draft.age,
                onValueChange = { onDraftChange(draft.copy(age = it.filter(Char::isDigit).take(4))) },
                placeholder = "1999",
                keyboardType = KeyboardType.Number,
            )

            ProfileFieldLabel("Country")
            ProfileTextField(
                value = draft.country,
                onValueChange = { onDraftChange(draft.copy(country = it.take(40))) },
                placeholder = "South Africa",
            )

            ProfileFieldLabel("Default wake-up time")
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable {
                        android.app.TimePickerDialog(context, { _, h, m ->
                            onDraftChange(draft.copy(defaultWakeTime = "%02d:%02d".format(h, m)))
                        }, hour, minute, false).show()
                    },
                shape = RoundedCornerShape(16.dp),
                color = ProfileInput,
                border = BorderStroke(1.dp, ProfileBorder),
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp, vertical = 16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Icon(Icons.Default.Alarm, contentDescription = null, tint = ProfileDawn)
                    Spacer(Modifier.width(12.dp))
                    Text(formatProfileTime(draft.defaultWakeTime), color = ProfileText, fontWeight = FontWeight.Bold)
                }
            }

            ProfileFieldLabel("Morning type")
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                morningTypeOptions.forEach { option ->
                    ProfileChoiceRow(
                        label = option.label,
                        icon = option.icon,
                        selected = draft.morningRating == option.value,
                        accent = ProfileDawn,
                    ) {
                        onDraftChange(draft.copy(morningRating = option.value))
                    }
                }
            }

            ProfileFieldLabel("Wake-up game")
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                gameOptions.forEach { option ->
                    ProfileChoiceRow(
                        label = option.label,
                        icon = option.icon,
                        selected = draft.favoriteGame == option.value,
                        accent = option.color,
                    ) {
                        onDraftChange(draft.copy(favoriteGame = option.value))
                    }
                }
            }

            ProfileFieldLabel("Morning goal")
            ProfileTextField(
                value = draft.wakeGoal,
                onValueChange = { onDraftChange(draft.copy(wakeGoal = it.take(60))) },
                placeholder = "What gets you out of bed?",
                singleLine = false,
                minLines = 2,
            )
            Text("${draft.wakeGoal.length}/60", color = ProfileMuted, fontSize = 11.sp)

            ProfileFieldLabel("Profile icon")
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                avatarOptions.chunked(3).forEach { row ->
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                        row.forEach { option ->
                            val selected = draft.profileIcon == option.value
                            Surface(
                                modifier = Modifier
                                    .weight(1f)
                                    .clickable { onDraftChange(draft.copy(profileIcon = option.value)) },
                                shape = RoundedCornerShape(16.dp),
                                color = if (selected) option.color.copy(alpha = 0.12f) else ProfileInput,
                                border = BorderStroke(1.dp, if (selected) option.color else ProfileBorder),
                            ) {
                                Column(
                                    modifier = Modifier.padding(vertical = 12.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                ) {
                                    Icon(option.icon, contentDescription = null, tint = if (selected) option.color else ProfileMuted, modifier = Modifier.size(26.dp))
                                    Spacer(Modifier.height(6.dp))
                                    Text(option.label, color = if (selected) option.color else ProfileMuted, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }

            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                Button(
                    onClick = onCancel,
                    modifier = Modifier.weight(1f).height(52.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(alpha = 0.10f)),
                ) {
                    Text("Cancel", color = ProfileText, fontWeight = FontWeight.Black)
                }
                Button(
                    onClick = onSave,
                    enabled = canSave,
                    modifier = Modifier.weight(1f).height(52.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = ProfileDawn,
                        disabledContainerColor = Color(0xFF374151),
                        disabledContentColor = Color(0xFF9CA3AF),
                    ),
                ) {
                    Text("Save changes", fontWeight = FontWeight.Black)
                }
            }
        }
    }
}

@Composable
private fun ProfileStatus(data: ProfileData) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            ProfileMetric("Alarms", data.alarmsCount.toString(), Icons.Default.Alarm, ProfileDawn, Modifier.weight(1f))
            ProfileMetric("Permissions", if (data.exactAlarmReady) "Ready" else "Check", Icons.Default.Security, if (data.exactAlarmReady) ProfileMint else ProfileGold, Modifier.weight(1f))
        }
        if (!data.exactAlarmReady) {
            Button(
                onClick = {
                    (nativeProfileActivity as? MainActivity)?.handleNativeAlarmAction("settings", null)
                },
                modifier = Modifier.fillMaxWidth().height(52.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = ProfileDawn),
            ) {
                Text("Open alarm permissions", fontWeight = FontWeight.Black)
            }
        }
    }
}

@Composable
private fun ProfileMetric(label: String, value: String, icon: ImageVector, tint: Color, modifier: Modifier) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(18.dp),
        color = ProfilePanel,
        border = BorderStroke(1.dp, ProfileBorder),
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(22.dp))
            Spacer(Modifier.height(8.dp))
            Text(label, color = ProfileMuted, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            Text(value, color = tint, fontSize = 22.sp, fontWeight = FontWeight.Black)
        }
    }
}

@Composable
private fun ProfileSettings() {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(22.dp),
        color = ProfilePanel,
        border = BorderStroke(1.dp, ProfileBorder),
    ) {
        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            Text("Alarm reliability", color = ProfileText, fontSize = 17.sp, fontWeight = FontWeight.Black)
            SettingRow(Icons.Default.NotificationsActive, "Notifications", "Allow alarm alerts and full-screen wakeups")
            SettingRow(Icons.Default.BatteryChargingFull, "Battery", "Keep alarms reliable while the phone is idle")
        }
    }
}

@Composable
private fun AccountActions(onLogOff: () -> Unit, onDeleteData: () -> Unit) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(22.dp),
        color = ProfilePanel,
        border = BorderStroke(1.dp, ProfileBorder),
    ) {
        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("Account", color = ProfileText, fontSize = 17.sp, fontWeight = FontWeight.Black)
            Button(
                onClick = onLogOff,
                modifier = Modifier.fillMaxWidth().height(52.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(alpha = 0.10f)),
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Logout, contentDescription = null, tint = ProfileText, modifier = Modifier.size(20.dp))
                    Text("Log off", color = ProfileText, fontWeight = FontWeight.Black)
                }
            }
            Button(
                onClick = onDeleteData,
                modifier = Modifier.fillMaxWidth().height(52.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = ProfileDanger.copy(alpha = 0.92f)),
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.DeleteForever, contentDescription = null, tint = Color.White, modifier = Modifier.size(20.dp))
                    Text("Delete data", color = Color.White, fontWeight = FontWeight.Black)
                }
            }
        }
    }
}

@Composable
private fun ProfileFieldLabel(label: String) {
    Text(label, color = ProfileMuted, fontSize = 12.sp, fontWeight = FontWeight.Bold)
}

@Composable
private fun ProfileTextField(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    keyboardType: KeyboardType = KeyboardType.Text,
    singleLine: Boolean = true,
    minLines: Int = 1,
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        modifier = Modifier.fillMaxWidth(),
        singleLine = singleLine,
        minLines = minLines,
        placeholder = { Text(placeholder) },
        shape = RoundedCornerShape(16.dp),
        keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = ProfileDawn,
            unfocusedBorderColor = ProfileBorder,
            focusedContainerColor = ProfileInput,
            unfocusedContainerColor = ProfileInput,
            focusedTextColor = ProfileText,
            unfocusedTextColor = ProfileText,
            focusedPlaceholderColor = ProfileMuted,
            unfocusedPlaceholderColor = ProfileMuted,
            cursorColor = ProfileDawn,
        ),
    )
}

@Composable
private fun ProfileChoiceRow(label: String, icon: ImageVector, selected: Boolean, accent: Color, onClick: () -> Unit) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        color = if (selected) accent.copy(alpha = 0.10f) else ProfileInput,
        border = BorderStroke(1.dp, if (selected) accent else ProfileBorder),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 13.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Icon(icon, contentDescription = null, tint = if (selected) accent else ProfileMuted, modifier = Modifier.size(20.dp))
            Text(label, color = ProfileText, fontWeight = if (selected) FontWeight.Black else FontWeight.Bold, modifier = Modifier.weight(1f))
            if (selected) {
                Text("Selected", color = accent, fontSize = 11.sp, fontWeight = FontWeight.Black)
            }
        }
    }
}

@Composable
private fun ProfileRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(label, color = ProfileMuted, fontSize = 13.sp)
        Text(value, color = ProfileText, fontSize = 13.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun SettingRow(icon: ImageVector, title: String, detail: String) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        Box(
            modifier = Modifier
                .size(42.dp)
                .background(ProfileDawn.copy(alpha = 0.14f), RoundedCornerShape(14.dp)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(icon, contentDescription = null, tint = ProfileDawn, modifier = Modifier.size(22.dp))
        }
        Column(modifier = Modifier.weight(1f)) {
            Text(title, color = ProfileText, fontWeight = FontWeight.Bold, fontSize = 14.sp)
            Text(detail, color = ProfileMuted, fontSize = 12.sp, lineHeight = 16.sp)
        }
    }
}

private fun ProfileData.toDraft(): ProfileDraft =
    ProfileDraft(
        userName = userName,
        age = age,
        country = country,
        defaultWakeTime = defaultWakeTime,
        morningRating = morningRating,
        favoriteGame = favoriteGame,
        wakeGoal = wakeGoal,
        profileIcon = profileIcon,
    )

private fun formatProfileTime(time: String): String {
    val parts = time.split(":")
    val h = parts.getOrNull(0)?.toIntOrNull() ?: 7
    val m = parts.getOrNull(1)?.toIntOrNull() ?: 0
    val period = if (h >= 12) "PM" else "AM"
    val hour = h % 12
    return "${if (hour == 0) 12 else hour}:${m.toString().padStart(2, '0')} $period"
}
