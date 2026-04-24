package com.morninmate.app

import android.view.Gravity
import android.widget.FrameLayout
import androidx.activity.ComponentActivity
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Alarm
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Icon
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

private val NavNight    = Color(0xFF0D0D1A)
private val NavBorder   = Color(0x0EFFFFFF)
private val NavDawn     = Color(0xFFFF6B35)
private val NavSunrise  = Color(0xFFFFD166)
private val NavInactive = Color(0x47FFFFFF)

private data class NavTabItem(val label: String, val icon: ImageVector)

private val NAV_TABS = listOf(
    NavTabItem("Alarms",  Icons.Default.Alarm),
    NavTabItem("Stats",   Icons.Default.BarChart),
    NavTabItem("Profile", Icons.Default.Person),
)

fun interface NavTabListener {
    fun onTabSelected(tab: Int)
}

fun setupNativeBottomNav(activity: ComponentActivity, listener: NavTabListener) {
    val root = activity.window.decorView.findViewById<FrameLayout>(android.R.id.content)
    val composeView = ComposeView(activity).apply {
        setViewCompositionStrategy(ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed)
        setContent {
            BottomNavBar(onTabSelected = { listener.onTabSelected(it) })
        }
    }
    root.addView(
        composeView,
        FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.WRAP_CONTENT,
            Gravity.BOTTOM,
        ),
    )
}

@Composable
fun BottomNavBar(onTabSelected: (Int) -> Unit) {
    var selectedTab by remember { mutableStateOf(0) }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(NavNight)
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
        BoxWithConstraints(
            modifier = Modifier
                .fillMaxWidth()
                .height(64.dp),
        ) {
            val tabWidth = maxWidth / 3
            val pillTargetX = tabWidth * selectedTab.toFloat() + tabWidth / 2 - 22.dp
            val pillX by animateDpAsState(
                targetValue = pillTargetX,
                animationSpec = spring(dampingRatio = 0.7f, stiffness = 400f),
                label = "pillX",
            )

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(64.dp),
            ) {
                NAV_TABS.forEachIndexed { index, tab ->
                    val selected = selectedTab == index
                    val iconScale by animateFloatAsState(
                        targetValue = if (selected) 1.1f else 1f,
                        animationSpec = spring(dampingRatio = 0.7f, stiffness = 400f),
                        label = "scale$index",
                    )
                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .height(64.dp)
                            .clickable(
                                indication = null,
                                interactionSource = remember { MutableInteractionSource() },
                            ) {
                                selectedTab = index
                                onTabSelected(index)
                            },
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center,
                    ) {
                        Icon(
                            imageVector = tab.icon,
                            contentDescription = tab.label,
                            tint = if (selected) NavDawn else NavInactive,
                            modifier = Modifier
                                .size(23.dp)
                                .graphicsLayer { scaleX = iconScale; scaleY = iconScale },
                        )
                        Text(
                            text = tab.label,
                            color = if (selected) NavDawn else NavInactive,
                            fontSize = 9.3.sp,
                            fontWeight = FontWeight.Bold,
                        )
                    }
                }
            }

            // Sliding pill anchored to bottom
            Box(
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .offset(x = pillX, y = (-8).dp)
                    .width(44.dp)
                    .height(3.dp)
                    .background(
                        Brush.horizontalGradient(listOf(NavDawn, NavSunrise)),
                        RoundedCornerShape(2.dp),
                    ),
            )
        }
    }
}
