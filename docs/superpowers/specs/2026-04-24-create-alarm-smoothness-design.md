# Create Alarm — Smoothness & Navigation Design

**Date:** 2026-04-24  
**Scope:** Native Android screen only (`CreateAlarmActivity.kt`, `AppContext.jsx`)

## Problems

1. **Loading screen after saving alarm** — When `CreateAlarmActivity` closes and `MainActivity` resumes, Capacitor fires `appStateChange: { isActive: true }`. This calls `loadUserData`, which unconditionally calls `setLoading(true)`, triggering the full-app loading spinner even though the user's data is already cached locally.

2. **Time picker not obvious** — The `TimeCard` composable is tappable (opens a system `TimePickerDialog`) but the hint text is `TextMuted` color and easy to miss. Users don't know to tap it to change the time.

## Fix 1 — Silent Background Refresh (`AppContext.jsx`)

**File:** `src/context/AppContext.jsx`  
**Function:** `loadUserData(userId)`

Move `setLoading(true)` so it only fires when there is no cached data (`!canBootFromCache`). The cache check already happens at the top of the function — the logic just needs to be reordered:

```
compute canBootFromCache
apply snapshots from cache
if canBootFromCache:
    setOfflineAccess(true)
    setLoading(false)          ← already done, no change
    // DO NOT call setLoading(true) before this point
else:
    setLoading(true)           ← only on cold start with no cache
proceed with network fetch
```

This means every foreground-resume sync (background → foreground, returning from native sub-activity, online event) runs silently when the user has a local cache. The spinner only appears on the very first cold launch before any data is stored.

No other changes to `loadUserData` — the network fetch, error handling, and `finally` block remain identical.

## Fix 2 — Time Picker Clarity (`CreateAlarmActivity.kt`)

**File:** `android/app/src/main/java/com/morninmate/app/CreateAlarmActivity.kt`  
**Composable:** `TimeCard`

Two changes:

1. **Edit icon in top-right corner of the card** — Overlay a small `Icons.Rounded.Edit` icon inside a tinted `Dawn`-colored circle in the `top-end` corner of the `Box`. Uses `Alignment.TopEnd` with `padding(12.dp)`.

2. **Hint text color → Dawn** — Change the hint `Text` from `color = TextMuted` to `color = Dawn` so it reads as an actionable label rather than a description. Text stays as `"Tap to change time"` (shortened from the existing copy).

The import `androidx.compose.material.icons.Icons` and `androidx.compose.material.icons.filled.Edit` are added. `Icons.Default.Edit` is available from `material-icons-core`, which is included transitively via the `material3` BOM already in `app/build.gradle`. No new dependency is needed.

## What Is Not Changing

- The system `TimePickerDialog` stays — no inline picker widget
- Screen layout and section order stay identical
- No animation changes
- No other sections (sound, repeat, intensity, games) are touched
- Web `CreateAlarm.jsx` is not touched
