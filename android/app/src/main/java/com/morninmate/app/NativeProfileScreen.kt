package com.morninmate.app

import android.view.View
import android.widget.FrameLayout
import androidx.activity.ComponentActivity
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
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
import androidx.compose.material.icons.filled.BatteryChargingFull
import androidx.compose.material.icons.filled.DeleteForever
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
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
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.ViewCompositionStrategy
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private val ProfileBg = Color(0xFF0D0D1A)
private val ProfilePanel = Color(0xFF141A2B)
private val ProfileDawn = Color(0xFFFF6B35)
private val ProfileGold = Color(0xFFFFD166)
private val ProfileMint = Color(0xFF06D6A0)
private val ProfileDanger = Color(0xFFEF476F)
private val ProfileText = Color(0xFFFFF5DF)
private val ProfileMuted = Color(0x99FFFFFF)
private val ProfileBorder = Color(0x16FFFFFF)

data class ProfileData(
    val userName: String,
    val level: Int,
    val xp: Int,
    val xpPerLevel: Int,
    val streak: Int,
    val alarmsCount: Int,
    val exactAlarmReady: Boolean,
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
    var showLogOffConfirm by remember { mutableStateOf(false) }
    var showDeleteConfirm by remember { mutableStateOf(false) }

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
        ProfileHero(data)
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

    if (showLogOffConfirm) {
        AlertDialog(
            onDismissRequest = { showLogOffConfirm = false },
            containerColor = ProfilePanel,
            title = { Text("Log off?", color = ProfileText, fontWeight = FontWeight.Black) },
            text = { Text("This clears the local signed-in profile state on this phone. Your alarms stay on the device.", color = ProfileMuted) },
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
            text = { Text("This removes alarms, stats, pending alarm state, and local profile data from this phone.", color = ProfileMuted) },
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
private fun ProfileHero(data: ProfileData) {
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
                        .background(ProfileDawn, CircleShape),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(Icons.Default.Person, contentDescription = null, tint = Color.White, modifier = Modifier.size(34.dp))
                }
                Column(modifier = Modifier.weight(1f)) {
                    Text(data.userName, color = ProfileText, fontSize = 24.sp, fontWeight = FontWeight.Black)
                    Text("Level ${data.level} ${rankLabelFor(data.level)}", color = ProfileGold, fontSize = 13.sp, fontWeight = FontWeight.Bold)
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
private fun ProfileMetric(label: String, value: String, icon: androidx.compose.ui.graphics.vector.ImageVector, tint: Color, modifier: Modifier) {
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
private fun SettingRow(icon: androidx.compose.ui.graphics.vector.ImageVector, title: String, detail: String) {
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
