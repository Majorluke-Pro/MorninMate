# Native Bottom Navigation Bar Design

**Date:** 2026-04-24  
**Scope:** Native Android bottom nav (Kotlin/Compose) + React tab preloading

## Problem

The React bottom nav bar handles taps through the WebView JavaScript event loop, introducing ~100–300ms of latency before the tab switches. This makes the app feel non-native. Moving the bar to Kotlin/Compose gives single-frame (~16ms) tap response.

A secondary issue: tabs are conditionally mounted (`tab === 0 && <AlarmsTab />`), which unmounts and remounts the entire tab on every switch. Preloading all tabs (keep mounted, CSS visibility toggle) makes re-visiting a tab instant.

## Architecture

### Files

| File | Action | Responsibility |
|------|--------|---------------|
| `android/app/src/main/java/com/morninmate/app/NativeBottomNav.kt` | **Create** | `BottomNavBar` Composable + `setupNativeBottomNav()` setup function |
| `android/app/src/main/java/com/morninmate/app/MainActivity.java` | **Modify** | Call `setupNativeBottomNav()` in `onCreate`, fire `navTabChanged` JS events |
| `android/app/build.gradle` | **Modify** | Add `material-icons-extended` dependency |
| `src/components/Home/Home.jsx` | **Modify** | Hide React nav on native, listen for `navTabChanged`, preload tabs |

### Communication Protocol

**Native → JS (tab tap):**  
`getBridge().triggerJSEvent("navTabChanged", "document", "{\"tab\":N}")` where N is 0, 1, or 2.

**JS → Native (none required):**  
Native nav always initialises on tab 0, matching the React default. No reverse sync needed.

### Overlay Setup

`setupNativeBottomNav()` in `NativeBottomNav.kt`:
1. Find `activity.window.decorView.findViewById<FrameLayout>(android.R.id.content)`
2. Create a `ComposeView` with `ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed`
3. Set content to `BottomNavBar(onTabSelected = onTabSelected)`
4. Add to the root `FrameLayout` with `LayoutParams(MATCH_PARENT, WRAP_CONTENT, Gravity.BOTTOM)`

`MainActivity.java` calls this in `onCreate` after `super.onCreate`:
```java
NativeBottomNavKt.setupNativeBottomNav(this, tabIndex -> {
    getBridge().triggerJSEvent(
        "navTabChanged", "document",
        "{\"tab\":" + tabIndex + "}");
    return Unit.INSTANCE;
});
```

## Native Nav Visual Design (`NativeBottomNav.kt`)

Matches the existing React nav bar exactly:

| Property | Value |
|----------|-------|
| Background | `Color(0xFF0D0D1A)` (Night) — solid, no blur |
| Top border | 1dp `Color(0x0EFFFFFF)` |
| Active colour | `Color(0xFFFF6B35)` (Dawn) |
| Inactive colour | `Color(0x47FFFFFF)` (28% white) |
| Height | 64dp + `navigationBarsPadding()` |
| Pill size | 44dp × 3dp |
| Pill style | `Dawn → Sunrise` horizontal gradient, `0 0 10px Dawn@60%` glow |
| Pill animation | Spring: `dampingRatio=0.7f`, `stiffness=400f` via `animateFloatAsState` |
| Icon scale (active) | 1.1× via `animateFloatAsState` |
| Tabs | Alarm, BarChart, Person (from `material-icons-extended`) |

## React Changes (`Home.jsx`)

### 1. Hide React nav on native
Wrap the existing nav `Box` in `{!isNative && ( ... )}`.

### 2. Listen for native tab events
In a `useEffect` (runs once on mount):
```js
if (!isNative) return;
function handleNavTab(e) { setTab(e.detail?.tab ?? 0); }
document.addEventListener('navTabChanged', handleNavTab);
return () => document.removeEventListener('navTabChanged', handleNavTab);
```

### 3. Preload all tabs (CSS visibility)
Replace conditional mounting with always-mounted panels using inline `display` style:
```jsx
<div style={{ display: tab === 0 ? 'block' : 'none' }}><AlarmsTab /></div>
<div style={{ display: tab === 1 ? 'block' : 'none' }}><StatsTab /></div>
<div style={{ display: tab === 2 ? 'block' : 'none' }}><ProfileTab /></div>
```
All three tabs initialise on first load. Switching between visited tabs is instant (no remount).

`alarmOverlayOpen` still controls native nav visibility — when an overlay is open in the Alarms tab, the native nav must also hide. This is done by firing a second JS event (`navOverlayChanged`) from `AlarmsTab` and listening in `MainActivity`, OR more simply: always show the native nav regardless of overlay state and let the overlay draw on top (the React overlay already has `zIndex` higher than the nav).

**Decision:** Let the React overlay draw on top of the native nav bar. No extra communication needed. The native nav remains visible but is obscured by the overlay, which is acceptable UX.

## What Is Not Changing

- Tab content components (`AlarmsTab`, `StatsTab`, `ProfileTab`) — untouched
- Routing (`App.jsx`) — untouched
- The sliding pill animation exists in both the old React nav and the new Kotlin nav; the React version is simply hidden on native
- Web (non-native) behaviour is completely unchanged
