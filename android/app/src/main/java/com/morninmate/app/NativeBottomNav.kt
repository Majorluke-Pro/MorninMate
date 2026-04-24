package com.morninmate.app

import android.view.Gravity
import android.view.HapticFeedbackConstants
import android.view.View
import android.widget.FrameLayout
import androidx.activity.ComponentActivity
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Alarm
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
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
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.ViewCompositionStrategy
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private val NavBorder = Color(0x12FFFFFF)
private val NavDawn = Color(0xFFFF6B35)
private val NavInactive = Color(0x47FFFFFF)
private val NavBase = Color(0xFF0D0D1A)
private val NavPanel = Color(0xF2141A2B)

private data class NavTabItem(val label: String, val icon: ImageVector)

private val NAV_TABS = listOf(
    NavTabItem("Alarms", Icons.Default.Alarm),
    NavTabItem("Stats", Icons.Default.BarChart),
    NavTabItem("Profile", Icons.Default.Person),
)

private var nativeBottomNavView: ComposeView? = null

fun interface NavTabListener {
    fun onTabSelected(tab: Int)
}

fun setupNativeBottomNav(activity: ComponentActivity, listener: NavTabListener) {
    val root = activity.window.decorView.findViewById<FrameLayout>(android.R.id.content)

    // Remove any previously attached nav view (e.g., after Activity recreation)
    nativeBottomNavView?.let { root.removeView(it) }

    val selectedTab = mutableStateOf(0)

    fun selectTab(index: Int) {
        if (selectedTab.value == index) return
        activity.window.decorView.performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK)
        selectedTab.value = index
        listener.onTabSelected(index)
    }

    val composeView = ComposeView(activity).apply {
        isClickable = true
        elevation = 48f
        translationZ = 48f
        visibility = View.GONE
        setViewCompositionStrategy(ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed)
        setContent {
            BottomNavBar(
                selectedTab = selectedTab.value,
                onTabSelected = ::selectTab,
            )
        }
    }
    val params =
        FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.WRAP_CONTENT,
            Gravity.BOTTOM,
        )
    root.addView(composeView, params)
    nativeBottomNavView = composeView
    composeView.bringToFront()
}

fun setNativeBottomNavVisible(visible: Boolean) {
    nativeBottomNavView?.post {
        nativeBottomNavView?.visibility = if (visible) View.VISIBLE else View.GONE
    }
}

@Composable
fun BottomNavBar(
    selectedTab: Int,
    onTabSelected: (Int) -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(NavBase)
            .drawBehind {
                drawLine(
                    color = NavBorder,
                    start = Offset(0f, 0f),
                    end = Offset(size.width, 0f),
                    strokeWidth = 1.dp.toPx(),
                )
            }
            .navigationBarsPadding(),
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 8.dp),
            shape = RoundedCornerShape(28.dp),
            color = NavPanel,
            border = BorderStroke(1.dp, Color(0x16FFFFFF)),
            shadowElevation = 18.dp,
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(66.dp),
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(66.dp),
                ) {
                    NAV_TABS.forEachIndexed { index, tab ->
                        val selected = selectedTab == index
                        val iconScale by animateFloatAsState(
                            targetValue = if (selected) 1.14f else 1f,
                            animationSpec = spring(dampingRatio = 0.65f, stiffness = 420f),
                            label = "scale$index",
                        )

                        Column(
                            modifier = Modifier
                                .weight(1f)
                                .height(66.dp)
                                .clickable(
                                    indication = null,
                                    interactionSource = remember { MutableInteractionSource() },
                                ) {
                                    if (selectedTab == index) return@clickable
                                    onTabSelected(index)
                                },
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center,
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                if (selected) {
                                    Box(
                                        modifier = Modifier
                                            .size(38.dp)
                                            .background(
                                                Brush.radialGradient(
                                                    listOf(NavDawn.copy(alpha = 0.22f), Color.Transparent),
                                                ),
                                                RoundedCornerShape(20.dp),
                                            ),
                                    )
                                }
                                Icon(
                                    imageVector = tab.icon,
                                    contentDescription = tab.label,
                                    tint = if (selected) NavDawn else NavInactive,
                                    modifier = Modifier
                                        .size(23.dp)
                                        .graphicsLayer {
                                            scaleX = iconScale
                                            scaleY = iconScale
                                        },
                                )
                            }
                            Text(
                                text = tab.label,
                                color = if (selected) NavDawn else NavInactive,
                                fontSize = 9.5.sp,
                                fontWeight = FontWeight.ExtraBold,
                            )
                        }
                    }
                }
            }
        }
    }
}
