# Native Stats Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the React/WebView Stats tab into a full-screen native Kotlin/Compose overlay that renders over the WebView when tab 1 is active.

**Architecture:** A new `NativeStatsScreen.kt` file creates a full-screen `ComposeView` added to the root `FrameLayout` (same pattern as `NativeBottomNav.kt`). React calls `AlarmPlugin.showNativeStats(data)` / `hideNativeStats()` via Capacitor when tab 1 is entered/exited or when the underlying data changes.

**Tech Stack:** Kotlin, Jetpack Compose (BOM 2024.10.01), Capacitor `AlarmPlugin`, React + Capacitor bridge

---

## File Map

| File | Change |
|---|---|
| `android/app/src/main/java/com/morninmate/app/NativeStatsScreen.kt` | **Create** — all Compose UI + public API |
| `android/app/src/main/java/com/morninmate/app/AlarmPlugin.java` | **Modify** — add 2 `@PluginMethod`s |
| `android/app/src/main/java/com/morninmate/app/MainActivity.java` | **Modify** — call `setupNativeStatsScreen` in `onCreate` |
| `src/lib/nativeAlarms.js` | **Modify** — add `showNativeStats` / `hideNativeStats` exports |
| `src/components/Home/Home.jsx` | **Modify** — tab-switch effect + data-refresh effect |

---

## Task 1: NativeStatsScreen.kt — scaffold, data class, show/hide API

**Files:**
- Create: `android/app/src/main/java/com/morninmate/app/NativeStatsScreen.kt`

- [ ] **Step 1: Create the file with colors, data class, state, and setup/show/hide functions**

```kotlin
package com.morninmate.app

import android.view.View
import android.widget.FrameLayout
import androidx.activity.ComponentActivity
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.ViewCompositionStrategy

internal val StatsBg      = Color(0xFF0D0D1A)
internal val StatsSurface = Color(0xFF141A2B)
internal val StatsDawn    = Color(0xFFFF6B35)
internal val StatsInactive = Color(0x47FFFFFF)
internal val StatsBorder  = Color(0x16FFFFFF)
internal val StatsWin     = Color(0xFF4CAF50)
internal val StatsLoss    = Color(0xFFF44336)
internal val StatsAmber   = Color(0xFFFFC107)

data class StatsData(
    val level: Int,
    val xp: Int,
    val xpPerLevel: Int,
    val streak: Int,
    val demerits: Int,
    val alarmsCount: Int,
    val activeAlarmsCount: Int,
    val successCount: Int,
    val failedCount: Int,
)

private var nativeStatsView: ComposeView? = null
private val statsState = mutableStateOf<StatsData?>(null)

fun setupNativeStatsScreen(activity: ComponentActivity) {
    val root = activity.window.decorView.findViewById<FrameLayout>(android.R.id.content)
    nativeStatsView?.let { root.removeView(it) }

    val composeView = ComposeView(activity).apply {
        visibility = View.GONE
        elevation = 40f
        translationZ = 40f
        setViewCompositionStrategy(ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed)
        setContent {
            val data = statsState.value
            if (data != null) StatsScreen(data)
        }
    }
    val params = FrameLayout.LayoutParams(
        FrameLayout.LayoutParams.MATCH_PARENT,
        FrameLayout.LayoutParams.MATCH_PARENT,
    )
    root.addView(composeView, params)
    nativeStatsView = composeView
    composeView.bringToFront()
}

fun showNativeStats(data: StatsData) {
    statsState.value = data
    nativeStatsView?.post { nativeStatsView?.visibility = View.VISIBLE }
}

fun hideNativeStats() {
    nativeStatsView?.post { nativeStatsView?.visibility = View.GONE }
}

@Composable
fun StatsScreen(data: StatsData) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(StatsBg)
            .statusBarsPadding()
            .navigationBarsPadding(),
    )
}
```

- [ ] **Step 2: Build to confirm it compiles**

```bash
cd /c/dev/MorninMate/android && ./gradlew assembleDebug
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 3: Commit**

```bash
git add android/app/src/main/java/com/morninmate/app/NativeStatsScreen.kt
git commit -m "feat: scaffold NativeStatsScreen with show/hide API"
```

---

## Task 2: NativeStatsScreen.kt — HeroZone (animated ring + rank badge)

**Files:**
- Modify: `android/app/src/main/java/com/morninmate/app/NativeStatsScreen.kt`

- [ ] **Step 1: Add imports needed for Hero zone**

At the top of `NativeStatsScreen.kt`, replace the import block with:

```kotlin
package com.morninmate.app

import android.view.View
import android.widget.FrameLayout
import androidx.activity.ComponentActivity
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.ViewCompositionStrategy
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.Canvas
```

- [ ] **Step 2: Add the `HeroZone` composable and rank helper after the `hideNativeStats` function**

```kotlin
private val RANK_LABELS = listOf("Newcomer", "Riser", "Consistent", "Dedicated", "Legend")

fun rankLabelFor(level: Int): String = RANK_LABELS[minOf(level - 1, 4)]

@Composable
fun HeroZone(data: StatsData, modifier: Modifier = Modifier) {
    val progress = if (data.xpPerLevel > 0)
        (data.xp % data.xpPerLevel).toFloat() / data.xpPerLevel
    else 0f

    val ringProgress = remember { Animatable(0f) }
    LaunchedEffect(data.xp, data.xpPerLevel) {
        ringProgress.animateTo(
            targetValue = progress,
            animationSpec = tween(durationMillis = 800, easing = FastOutSlowInEasing),
        )
    }

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = modifier.fillMaxWidth(),
    ) {
        Box(contentAlignment = Alignment.Center, modifier = Modifier.size(160.dp)) {
            Canvas(modifier = Modifier.size(160.dp)) {
                val strokePx = 8.dp.toPx()
                val diameter = size.minDimension - strokePx
                val topLeft = Offset(strokePx / 2f, strokePx / 2f)
                val arcSize = Size(diameter, diameter)
                // Track
                drawArc(
                    color = StatsSurface,
                    startAngle = -90f,
                    sweepAngle = 360f,
                    useCenter = false,
                    topLeft = topLeft,
                    size = arcSize,
                    style = Stroke(width = strokePx, cap = StrokeCap.Round),
                )
                // Fill
                if (ringProgress.value > 0f) {
                    drawArc(
                        color = StatsDawn,
                        startAngle = -90f,
                        sweepAngle = 360f * ringProgress.value,
                        useCenter = false,
                        topLeft = topLeft,
                        size = arcSize,
                        style = Stroke(width = strokePx, cap = StrokeCap.Round),
                    )
                }
            }
            Text(
                text = data.level.toString(),
                color = Color.White,
                fontSize = 42.sp,
                fontWeight = FontWeight.ExtraBold,
            )
        }

        Spacer(Modifier.height(12.dp))

        Surface(
            shape = RoundedCornerShape(20.dp),
            color = Color.Transparent,
            border = BorderStroke(1.dp, StatsDawn),
        ) {
            Text(
                text = rankLabelFor(data.level),
                color = StatsDawn,
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp),
            )
        }
    }
}
```

- [ ] **Step 3: Update `StatsScreen` to include `HeroZone`**

Replace the current `StatsScreen` composable with:

```kotlin
@Composable
fun StatsScreen(data: StatsData) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(StatsBg)
            .statusBarsPadding()
            .navigationBarsPadding()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp),
    ) {
        Spacer(Modifier.height(28.dp))
        HeroZone(data = data)
        Spacer(Modifier.height(24.dp))
    }
}
```

- [ ] **Step 4: Build**

```bash
cd /c/dev/MorninMate/android && ./gradlew assembleDebug
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 5: Commit**

```bash
git add android/app/src/main/java/com/morninmate/app/NativeStatsScreen.kt
git commit -m "feat: add HeroZone with animated XP ring and rank badge"
```

---

## Task 3: NativeStatsScreen.kt — JourneyTrack

**Files:**
- Modify: `android/app/src/main/java/com/morninmate/app/NativeStatsScreen.kt`

- [ ] **Step 1: Add missing imports for JourneyTrack**

Add these lines to the import block (after existing imports):

```kotlin
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.ui.draw.drawBehind
import kotlinx.coroutines.delay
```

- [ ] **Step 2: Add the `JourneyTrack` composable after `HeroZone`**

```kotlin
@Composable
fun JourneyTrack(level: Int, modifier: Modifier = Modifier) {
    val nodeIndex = minOf(level - 1, 4)

    Column(modifier = modifier.fillMaxWidth()) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(24.dp),
        ) {
            // Connecting lines
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .align(Alignment.Center)
                    .padding(horizontal = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                repeat(4) { i ->
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .height(2.dp)
                            .background(if (i < nodeIndex) StatsDawn else StatsSurface),
                    )
                }
            }
            // Nodes
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                RANK_LABELS.forEachIndexed { index, _ ->
                    val isPast    = index < nodeIndex
                    val isCurrent = index == nodeIndex
                    val size      = if (isCurrent) 20.dp else 14.dp
                    Box(
                        modifier = Modifier
                            .size(size)
                            .let { m ->
                                if (isCurrent) m.drawBehind {
                                    drawCircle(StatsDawn.copy(alpha = 0.25f), radius = 22.dp.toPx())
                                } else m
                            }
                            .background(
                                color = if (isPast || isCurrent) StatsDawn else Color.Transparent,
                                shape = CircleShape,
                            )
                            .let { m ->
                                if (!isPast && !isCurrent)
                                    m.border(1.dp, StatsInactive, CircleShape)
                                else m
                            },
                    )
                }
            }
        }

        Spacer(Modifier.height(6.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            RANK_LABELS.forEachIndexed { index, label ->
                val isCurrent = index == nodeIndex
                Text(
                    text = label,
                    color = if (isCurrent) StatsDawn else StatsInactive,
                    fontSize = 8.sp,
                    fontWeight = if (isCurrent) FontWeight.Bold else FontWeight.Normal,
                )
            }
        }
    }
}
```

- [ ] **Step 3: Add `JourneyTrack` to `StatsScreen`**

```kotlin
@Composable
fun StatsScreen(data: StatsData) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(StatsBg)
            .statusBarsPadding()
            .navigationBarsPadding()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp),
    ) {
        Spacer(Modifier.height(28.dp))
        HeroZone(data = data)
        Spacer(Modifier.height(24.dp))
        JourneyTrack(level = data.level)
        Spacer(Modifier.height(24.dp))
    }
}
```

- [ ] **Step 4: Build**

```bash
cd /c/dev/MorninMate/android && ./gradlew assembleDebug
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 5: Commit**

```bash
git add android/app/src/main/java/com/morninmate/app/NativeStatsScreen.kt
git commit -m "feat: add JourneyTrack rank progression nodes"
```

---

## Task 4: NativeStatsScreen.kt — MetricGrid

**Files:**
- Modify: `android/app/src/main/java/com/morninmate/app/NativeStatsScreen.kt`

- [ ] **Step 1: Add missing imports for MetricGrid**

Add to import block:

```kotlin
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Alarm
import androidx.compose.material.icons.filled.AlarmOn
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Icon
import androidx.compose.runtime.getValue
import androidx.compose.ui.graphics.vector.ImageVector
import kotlinx.coroutines.launch
```

- [ ] **Step 2: Add `MetricItem` data class and `MetricCard` composable after `JourneyTrack`**

```kotlin
private data class MetricItem(
    val label: String,
    val icon: ImageVector,
    val value: String,
    val accentColor: Color,
)

@Composable
private fun MetricCard(item: MetricItem, index: Int, modifier: Modifier = Modifier) {
    val alpha = remember { Animatable(0f) }
    LaunchedEffect(Unit) {
        delay(index * 40L)
        alpha.animateTo(1f, animationSpec = tween(300, easing = FastOutSlowInEasing))
    }
    Surface(
        shape = RoundedCornerShape(14.dp),
        color = StatsSurface,
        border = BorderStroke(1.dp, StatsBorder),
        modifier = modifier.graphicsLayer { this.alpha = alpha.value },
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(3.dp),
        ) {
            Icon(
                imageVector = item.icon,
                contentDescription = item.label,
                tint = item.accentColor,
                modifier = Modifier.size(18.dp),
            )
            Text(
                text = item.label,
                color = StatsInactive,
                fontSize = 10.sp,
                fontWeight = FontWeight.Medium,
            )
            Text(
                text = item.value,
                color = item.accentColor,
                fontSize = 26.sp,
                fontWeight = FontWeight.ExtraBold,
            )
        }
    }
}
```

- [ ] **Step 3: Add `MetricGrid` composable after `MetricCard`**

```kotlin
@Composable
fun MetricGrid(data: StatsData, modifier: Modifier = Modifier) {
    val metrics = listOf(
        MetricItem("Day Streak",    Icons.Default.LocalFireDepartment, data.streak.toString(),           StatsDawn),
        MetricItem("Total XP",      Icons.Default.Star,                data.xp.toString(),              StatsDawn),
        MetricItem("Alarms Set",    Icons.Default.Alarm,               data.alarmsCount.toString(),     Color.White),
        MetricItem("Active",        Icons.Default.AlarmOn,             data.activeAlarmsCount.toString(), Color.White),
        MetricItem("Routines Won",  Icons.Default.EmojiEvents,         data.successCount.toString(),    StatsWin),
        MetricItem("Routines Lost", Icons.Default.Close,               data.failedCount.toString(),     StatsLoss),
    )
    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        for (row in 0 until 3) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                for (col in 0 until 2) {
                    val idx = row * 2 + col
                    MetricCard(
                        item = metrics[idx],
                        index = idx,
                        modifier = Modifier.weight(1f),
                    )
                }
            }
        }
    }
}
```

- [ ] **Step 4: Add `MetricGrid` to `StatsScreen`**

```kotlin
@Composable
fun StatsScreen(data: StatsData) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(StatsBg)
            .statusBarsPadding()
            .navigationBarsPadding()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp),
    ) {
        Spacer(Modifier.height(28.dp))
        HeroZone(data = data)
        Spacer(Modifier.height(24.dp))
        JourneyTrack(level = data.level)
        Spacer(Modifier.height(24.dp))
        MetricGrid(data = data)
        Spacer(Modifier.height(16.dp))
    }
}
```

- [ ] **Step 5: Build**

```bash
cd /c/dev/MorninMate/android && ./gradlew assembleDebug
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 6: Commit**

```bash
git add android/app/src/main/java/com/morninmate/app/NativeStatsScreen.kt
git commit -m "feat: add MetricGrid with 6 animated stat cards"
```

---

## Task 5: NativeStatsScreen.kt — BottomBanner

**Files:**
- Modify: `android/app/src/main/java/com/morninmate/app/NativeStatsScreen.kt`

- [ ] **Step 1: Add missing import for BottomBanner**

Add to import block:

```kotlin
import androidx.compose.material.icons.filled.Warning
```

- [ ] **Step 2: Add `BottomBanner` composable after `MetricGrid`**

```kotlin
@Composable
fun BottomBanner(data: StatsData, modifier: Modifier = Modifier) {
    val nudge = when {
        data.streak >= 30 -> "Legendary ${data.streak}-day streak!"
        data.streak >= 7  -> "On a ${data.streak}-day streak — you're on fire!"
        data.streak >= 1  -> "On a ${data.streak}-day streak — keep going!"
        else              -> "Set your first alarm to start your streak"
    }

    if (data.demerits > 0) {
        Surface(
            shape = RoundedCornerShape(12.dp),
            color = StatsAmber.copy(alpha = 0.15f),
            border = BorderStroke(1.dp, StatsAmber.copy(alpha = 0.4f)),
            modifier = modifier.fillMaxWidth(),
        ) {
            Row(
                modifier = Modifier.padding(12.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(
                    imageVector = Icons.Default.Warning,
                    contentDescription = null,
                    tint = StatsAmber,
                    modifier = Modifier.size(18.dp),
                )
                Text(
                    text = "${data.demerits} demerit${if (data.demerits != 1) "s" else ""} — complete routines to remove them",
                    color = StatsAmber,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium,
                )
            }
        }
    } else {
        Surface(
            shape = RoundedCornerShape(12.dp),
            color = StatsSurface,
            border = BorderStroke(1.dp, StatsBorder),
            modifier = modifier.fillMaxWidth(),
        ) {
            Row(
                modifier = Modifier.padding(12.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(
                    imageVector = Icons.Default.LocalFireDepartment,
                    contentDescription = null,
                    tint = StatsDawn,
                    modifier = Modifier.size(18.dp),
                )
                Text(
                    text = nudge,
                    color = Color.White.copy(alpha = 0.85f),
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium,
                )
            }
        }
    }
}
```

- [ ] **Step 3: Add `BottomBanner` to `StatsScreen` and close with bottom padding**

```kotlin
@Composable
fun StatsScreen(data: StatsData) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(StatsBg)
            .statusBarsPadding()
            .navigationBarsPadding()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp),
    ) {
        Spacer(Modifier.height(28.dp))
        HeroZone(data = data)
        Spacer(Modifier.height(24.dp))
        JourneyTrack(level = data.level)
        Spacer(Modifier.height(24.dp))
        MetricGrid(data = data)
        Spacer(Modifier.height(16.dp))
        BottomBanner(data = data)
        Spacer(Modifier.height(24.dp))
    }
}
```

- [ ] **Step 4: Build**

```bash
cd /c/dev/MorninMate/android && ./gradlew assembleDebug
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 5: Commit**

```bash
git add android/app/src/main/java/com/morninmate/app/NativeStatsScreen.kt
git commit -m "feat: add BottomBanner with demerit warning and streak nudge"
```

---

## Task 6: AlarmPlugin.java — showNativeStats and hideNativeStats plugin methods

**Files:**
- Modify: `android/app/src/main/java/com/morninmate/app/AlarmPlugin.java`

- [ ] **Step 1: Add two plugin methods to `AlarmPlugin.java`**

Insert after the existing `setNativeBottomNavVisible` method (after line 55):

```java
@PluginMethod
public void showNativeStats(PluginCall call) {
    int level             = call.getInt("level", 1);
    int xp                = call.getInt("xp", 0);
    int xpPerLevel        = call.getInt("xpPerLevel", 100);
    int streak            = call.getInt("streak", 0);
    int demerits          = call.getInt("demerits", 0);
    int alarmsCount       = call.getInt("alarmsCount", 0);
    int activeAlarmsCount = call.getInt("activeAlarmsCount", 0);
    int successCount      = call.getInt("successCount", 0);
    int failedCount       = call.getInt("failedCount", 0);

    NativeStatsScreenKt.showNativeStats(new StatsData(
        level, xp, xpPerLevel, streak, demerits,
        alarmsCount, activeAlarmsCount, successCount, failedCount
    ));
    call.resolve();
}

@PluginMethod
public void hideNativeStats(PluginCall call) {
    NativeStatsScreenKt.hideNativeStats();
    call.resolve();
}
```

- [ ] **Step 2: Build**

```bash
cd /c/dev/MorninMate/android && ./gradlew assembleDebug
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 3: Commit**

```bash
git add android/app/src/main/java/com/morninmate/app/AlarmPlugin.java
git commit -m "feat: add showNativeStats and hideNativeStats plugin methods"
```

---

## Task 7: MainActivity.java — wire up setupNativeStatsScreen

**Files:**
- Modify: `android/app/src/main/java/com/morninmate/app/MainActivity.java`

- [ ] **Step 1: Call `setupNativeStatsScreen` in `onCreate`, after `setupNativeBottomNav`**

In `MainActivity.java`, after the `NativeBottomNavKt.setupNativeBottomNav(...)` call (currently ends around line 35), add:

```java
NativeStatsScreenKt.setupNativeStatsScreen(this);
```

The `onCreate` body after the change:

```java
@Override
protected void onCreate(Bundle savedInstanceState) {
    registerPlugin(AlarmPlugin.class);
    super.onCreate(savedInstanceState);
    applyAppShell();
    applyAlarmWindowFlags(getIntent());
    NativeBottomNavKt.setupNativeBottomNav(this, tabIndex ->
        getBridge().getWebView().post(() ->
            getBridge().getWebView().evaluateJavascript(
                "document.dispatchEvent(new CustomEvent('navTabChanged',{detail:{tab:" + tabIndex + "}}));",
                null
            )
        )
    );
    NativeStatsScreenKt.setupNativeStatsScreen(this);
}
```

- [ ] **Step 2: Build**

```bash
cd /c/dev/MorninMate/android && ./gradlew assembleDebug
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 3: Commit**

```bash
git add android/app/src/main/java/com/morninmate/app/MainActivity.java
git commit -m "feat: wire up NativeStatsScreen setup in MainActivity"
```

---

## Task 8: nativeAlarms.js — showNativeStats and hideNativeStats helpers

**Files:**
- Modify: `src/lib/nativeAlarms.js`

- [ ] **Step 1: Add two exported functions at the end of `nativeAlarms.js`**

```js
export async function showNativeStats(data) {
  if (!isNative) return;
  try {
    await AlarmPlugin.showNativeStats(data);
  } catch {}
}

export async function hideNativeStats() {
  if (!isNative) return;
  try {
    await AlarmPlugin.hideNativeStats();
  } catch {}
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/nativeAlarms.js
git commit -m "feat: add showNativeStats and hideNativeStats JS helpers"
```

---

## Task 9: Home.jsx — tab-switch wiring and data-refresh effect

**Files:**
- Modify: `src/components/Home/Home.jsx`

- [ ] **Step 1: Update the nativeAlarms import on line 39**

Change:
```js
import { isNative, openNativeCreateAlarm, setNativeBottomNavVisible } from '../../lib/nativeAlarms';
```
To:
```js
import { isNative, openNativeCreateAlarm, setNativeBottomNavVisible, showNativeStats, hideNativeStats } from '../../lib/nativeAlarms';
```

- [ ] **Step 2: Add `useApp` destructuring inside `Home()` function**

After `const navigate = useNavigate();` (line 116), add:

```js
const { user, alarms, XP_PER_LEVEL, wakeStats } = useApp();
```

- [ ] **Step 3: Add the native stats effect inside `Home()` after the existing two `useEffect` calls (after line 143)**

```js
useEffect(() => {
  if (!isNative) return;
  if (tab === 1) {
    void showNativeStats({
      level:              user?.level ?? 1,
      xp:                 user?.xp ?? 0,
      xpPerLevel:         XP_PER_LEVEL ?? 100,
      streak:             user?.streak ?? 0,
      demerits:           user?.demerits ?? 0,
      alarmsCount:        alarms?.length ?? 0,
      activeAlarmsCount:  alarms?.filter(a => a.active).length ?? 0,
      successCount:       wakeStats?.success ?? 0,
      failedCount:        wakeStats?.failed ?? 0,
    });
  } else {
    void hideNativeStats();
  }
}, [tab, user, alarms, wakeStats, XP_PER_LEVEL]);
```

- [ ] **Step 4: Build the web assets and sync to Android**

```bash
cd /c/dev/MorninMate && npm run build && npx cap sync android
```

Expected: Vite build success, then `Sync finished`.

- [ ] **Step 5: Build debug APK and install**

```bash
cd /c/dev/MorninMate/android && ./gradlew assembleDebug
```

Expected: `BUILD SUCCESSFUL`

Install:
```bash
/c/Users/luker/AppData/Local/Android/Sdk/platform-tools/adb.exe install -r app/build/outputs/apk/debug/app-debug.apk
```

Expected: `Success`

- [ ] **Step 6: Verify on device**

Open the app. Tap the Stats tab (middle icon on the native bottom nav). Verify:
- Dark screen appears (not the React WebView)
- Circular XP ring draws in animated over ~800ms
- Level number is centered in the ring
- Rank badge pill below ring shows correct rank
- 5 journey nodes with connecting lines; current node is larger with orange glow
- 2×3 metric grid shows Day Streak, Total XP, Alarms Set, Active, Routines Won, Routines Lost — each card fades in staggered
- Bottom banner shows demerit warning (if demerits > 0) or streak nudge
- Tapping Alarms or Profile tab hides the native stats screen and shows the correct WebView tab

- [ ] **Step 7: Commit**

```bash
git add src/components/Home/Home.jsx src/lib/nativeAlarms.js
git commit -m "feat: wire native stats screen to tab switches in Home.jsx"
```
