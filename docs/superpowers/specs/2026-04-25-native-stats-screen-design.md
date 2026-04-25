# Native Stats Screen Design

## Goal

Migrate the React/WebView Stats tab into a full-screen native Kotlin/Compose screen that renders over the WebView when tab 1 is active, with polished animations and a gamification-focused layout.

---

## Architecture

### New file: `NativeStatsScreen.kt`

Follows the same overlay pattern as `NativeBottomNav.kt`.

**Public API:**
- `setupNativeStatsScreen(activity: ComponentActivity)` — called once in `MainActivity.onCreate`. Creates a `ComposeView` backed by a `mutableStateOf<StatsData?>`, adds it to `FrameLayout(android.R.id.content)` with `MATCH_PARENT` width/height, starts `GONE`.
- `showNativeStats(data: StatsData)` — updates state, sets visibility to `VISIBLE`.
- `hideNativeStats()` — sets visibility to `GONE`.

**StatsData data class:**
```kotlin
data class StatsData(
    val level: Int,
    val xp: Int,
    val xpPerLevel: Int,
    val streak: Int,
    val demerits: Int,
    val alarmsCount: Int,
    val activeAlarmsCount: Int,
    val successCount: Int,
    val failedCount: Int
)
```

**Global state:** `private var nativeStatsView: ComposeView? = null` — dedup guard prevents adding multiple views on activity recreation.

### Modified: `AlarmPlugin.java`

Two new `@PluginMethod`s:

- `showNativeStats(call)` — reads JSON fields from `call.data`, constructs `StatsData`, calls `NativeStatsScreenKt.showNativeStats(data)`, resolves call.
- `hideNativeStats(call)` — calls `NativeStatsScreenKt.hideNativeStats()`, resolves call.

### Modified: `src/lib/nativeAlarms.js`

Two new exported helpers:
- `showNativeStats(data)` — calls `AlarmPlugin.showNativeStats(data)` on native, no-op on web.
- `hideNativeStats()` — calls `AlarmPlugin.hideNativeStats()` on native, no-op on web.

### Modified: `src/components/Home/Home.jsx`

In the `navTabChanged` event handler (and the matching web tab-switch logic):
- Switching **to** tab 1: call `showNativeStats(buildStatsPayload())` where `buildStatsPayload()` assembles the current `user`, `wakeStats`, `alarms` into the payload shape.
- Switching **away** from tab 1: call `hideNativeStats()`.

Add a separate `useEffect` that watches `[user, wakeStats, alarms]` — if `currentTab === 1` on native, re-call `showNativeStats(buildStatsPayload())` to keep data fresh without requiring a tab switch.

**Data payload shape:**
```js
{
  level: user.level,
  xp: user.xp,
  xpPerLevel: XP_PER_LEVEL,
  streak: user.streak ?? 0,
  demerits: user.demerits ?? 0,
  alarmsCount: alarms.length,
  activeAlarmsCount: alarms.filter(a => a.enabled).count,
  successCount: wakeStats.success ?? 0,
  failedCount: wakeStats.failed ?? 0
}
```

---

## Visual Layout

### Colors

| Token | Hex | Usage |
|---|---|---|
| `StatsBg` | `#0D0D1A` | Screen background |
| `StatsSurface` | `#141A2B` | Metric card background |
| `StatsDawn` | `#FF6B35` | Ring fill, active journey node, selected accents |
| `StatsInactive` | `#47FFFFFF` | Muted labels, future journey nodes |
| `StatsBorder` | `#16FFFFFF` | Card borders |
| `StatsWin` | `#4CAF50` | Routines Won accent |
| `StatsLoss` | `#F44336` | Routines Lost accent |
| `StatsAmber` | `#FFC107` | Demerit warning banner |

### Layout (top to bottom, full screen)

**1. Hero zone (~38% of screen height)**

Centered column with `statusBarsPadding()` at top:

- Circular progress ring:
  - Size: 160dp × 160dp
  - Stroke: 8dp, `StrokeCap.Round`
  - Track color: `StatsSurface` (full circle background arc)
  - Fill color: `StatsDawn`
  - Progress: `(xp % xpPerLevel).toFloat() / xpPerLevel`
  - Animated: `Animatable(0f)` launches to target progress over 800ms with `FastOutSlowInEasing`
- Inside ring (centered overlay): level number, 42sp, `FontWeight.ExtraBold`, white
- Below ring (8dp gap): rank badge pill
  - `RoundedCornerShape(20dp)`, `BorderStroke(1.dp, StatsDawn)`, horizontal padding 16dp, vertical 4dp
  - Rank label text, 13sp, `FontWeight.Bold`, `StatsDawn`

**Rank table:**

| Level | Label |
|---|---|
| 1 | Newcomer |
| 2 | Riser |
| 3 | Consistent |
| 4 | Dedicated |
| 5+ | Legend |

Journey nodes (5): Newcomer → Riser → Consistent → Dedicated → Legend. Active node = `min(level - 1, 4)`.

**2. Journey track (~14% of screen height)**

Horizontal `Row` with 5 nodes, centered, 8dp top margin:

5 nodes map to: Newcomer (1), Riser (2), Consistent (3), Dedicated (4), Legend (5+).

- Connecting lines between nodes: 2dp height, `StatsSurface` for future, `StatsDawn` for past
- Current node index: `min(level - 1, 4)` (clamped to 0–4)
- Node circles:
  - Past (index < current): 14dp, filled `StatsDawn`
  - Current (index == current): 20dp, filled `StatsDawn`, radial glow via `drawBehind` (`StatsDawn.copy(alpha=0.25f)`, radius 22dp)
  - Future (index > current): 14dp, outlined `StatsInactive`, no fill
- Below each node: rank name in 8sp, `StatsInactive` (active node uses `StatsDawn`)
- Staggered fade-in: each node animates in with 60ms delay per index

**3. Metric grid (~34% of screen height)**

`LazyVerticalGrid(columns = GridCells.Fixed(2))`, `verticalArrangement = 8dp`, `horizontalArrangement = 8dp`, 12dp horizontal padding, non-scrollable (fixed 3-row height).

Six cards, each:
- Background: `StatsSurface`, `RoundedCornerShape(14dp)`, `BorderStroke(1.dp, StatsBorder)`
- Padding: 16dp
- Content: `Icon` (24dp, tinted) + label text (10sp, `StatsInactive`) + value text (28sp, `FontWeight.ExtraBold`, white)
- Entry animation: `alpha` + `translationY` (+20dp → 0), staggered 40ms per card index

| # | Label | Icon | Value | Accent |
|---|---|---|---|---|
| 0 | Day Streak | `Icons.Default.LocalFire Department` | `streak` | `StatsDawn` |
| 1 | Total XP | `Icons.Default.Star` | `xp` | `StatsDawn` |
| 2 | Alarms Set | `Icons.Default.Alarm` | `alarmsCount` | white |
| 3 | Active | `Icons.Default.AlarmOn` | `activeAlarmsCount` | white |
| 4 | Routines Won | `Icons.Default.EmojiEvents` | `successCount` | `StatsWin` |
| 5 | Routines Lost | `Icons.Default.Close` | `failedCount` | `StatsLoss` |

**4. Bottom banner (~14% of screen height)**

If `demerits > 0`:
- Amber warning card: `StatsAmber.copy(alpha=0.15f)` background, `StatsAmber` border, `WarningAmber` icon, text "{n} demerit{s} — complete routines to remove them"

If `demerits == 0`:
- Motivational nudge based on streak:
  - 0: "Set your first alarm to start your streak"
  - 1–6: "On a {n}-day streak — keep going!"
  - 7–29: "On a {n}-day streak — you're on fire!"
  - 30+: "Legendary {n}-day streak!"

Bottom padding: `navigationBarsPadding()`

---

## Animations Summary

| Element | Animation | Duration | Easing |
|---|---|---|---|
| XP ring fill | `Animatable` 0 → progress | 800ms | FastOutSlowIn |
| Journey nodes | Staggered fade-in (60ms/node) | 300ms each | Linear |
| Metric cards | Staggered fade + slide-up (40ms/card) | 250ms each | FastOutSlowIn |

---

## What is NOT changing

- The React StatsTab JSX remains in `Home.jsx` but its container `div` gets `display: 'none'` when `isNative` is true and tab 1 is active (consistent with how other tabs work). It is never fully removed.
- No new Capacitor plugin is added — `AlarmPlugin.java` is extended.
- No changes to Supabase, auth, or alarm data flow.

---

## Files Touched

| File | Change |
|---|---|
| `android/app/src/main/java/com/morninmate/app/NativeStatsScreen.kt` | Create |
| `android/app/src/main/java/com/morninmate/app/AlarmPlugin.java` | Add 2 plugin methods |
| `android/app/src/main/java/com/morninmate/app/MainActivity.java` | Call `setupNativeStatsScreen` in `onCreate` |
| `src/lib/nativeAlarms.js` | Add `showNativeStats` / `hideNativeStats` |
| `src/components/Home/Home.jsx` | Call show/hide on tab switch + data-change effect |
