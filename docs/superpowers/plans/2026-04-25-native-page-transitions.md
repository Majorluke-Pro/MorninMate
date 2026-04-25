# Native-feel Page Transitions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current "webby" page changes (instant route swaps + `View.VISIBLE` pops) with framer-motion route transitions, a FAB → CreateAlarm container morph, and Compose `AnimatedVisibility` for the native Stats/Alarms screens — orchestrated through a small `transitions.js` preset module.

**Architecture:** Add real `framer-motion`, replace the `motion-lite` stub with a one-line re-export, wrap `<Routes>` in `<AnimatePresence mode="wait">`, share a `layoutId` between the Home FAB and the CreateAlarm shell, and convert the Compose screens from `View.VISIBLE/GONE` toggles to `AnimatedVisibility` driven by `mutableStateOf<Boolean>`. The JS bridge fires a short opacity fade on the WebView before the native screen appears.

**Tech Stack:** Capacitor 8, React 19, react-router-dom 7, framer-motion (new), Tailwind v4, Jetpack Compose Material 3, `@capacitor/haptics`.

**Project notes for the implementer:**
- The repo has **no JavaScript test framework** (`package.json` has no `test` script). Verification per task is `npm run lint` + visual check on a connected Android device. This is intentional and matches the rest of the codebase — do not add Jest/Vitest as part of this work.
- The user's working shell is **PowerShell** on Windows. Build chain:
  ```powershell
  npm run build
  npx cap sync android
  cd android
  .\gradlew.bat assembleDebug
  & "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" install -r app\build\outputs\apk\debug\app-debug.apk
  ```
- On **native**, the FAB launches `CreateAlarmActivity` directly (Android transitions). The `/create-alarm` React route is hit only on **web/dev**. The morph + route slide therefore primarily benefit the web build, but they are still part of the spec because the route exists and must transition correctly.
- The native Compose screens (`NativeStatsScreen.kt`, `NativeAlarmsScreen.kt`) are the real production-facing wins on Android.

---

## File Structure

**New files:**
- `src/lib/transitions.js` — transition presets + `tapTransition()` helper

**Modified files:**
- `package.json` — add `framer-motion` dependency
- `src/lib/motion-lite.jsx` — replace 100-line stub with a 3-line re-export
- `src/App.jsx` — wrap `<Routes>` in `<AnimatePresence mode="wait">`
- `src/components/Home/Home.jsx` — `LayoutGroup` + `layoutId` on FAB; `tapTransition()` on FAB & bottom-nav; WebView fade before native handoff
- `src/components/Alarm/CreateAlarm.jsx` — matching `layoutId` on page shell; wrap content in `motion.div` with page slide variants
- `android/app/src/main/java/com/morninmate/app/NativeStatsScreen.kt` — `AnimatedVisibility` wrapper; `mutableStateOf<Boolean>` visibility; deferred outer `View.GONE`
- `android/app/src/main/java/com/morninmate/app/NativeAlarmsScreen.kt` — same pattern as Stats

**Unchanged:**
- `android/app/src/main/java/com/morninmate/app/AlarmPlugin.java` — bridge surface preserved

---

### Task 1: Add framer-motion dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install framer-motion**

Run from `C:\dev\MorninMate` (project root):

```powershell
npm install framer-motion@^11
```

Expected: `framer-motion` appears in `package.json` `dependencies`. `package-lock.json` updated.

- [ ] **Step 2: Verify install succeeded**

Run:

```powershell
npm ls framer-motion
```

Expected: prints a single line like `framer-motion@11.x.x` with no peer-dep warnings related to React 19. (framer-motion v11 supports React 19.)

- [ ] **Step 3: Commit**

```powershell
git add package.json package-lock.json
git commit -m "chore: add framer-motion dependency"
```

---

### Task 2: Replace motion-lite stub with framer-motion re-export

**Files:**
- Modify: `src/lib/motion-lite.jsx` (entire file replaced)

The current file is a stub that pretends to animate but doesn't (`AnimatePresence = ({children}) => children`). Existing call sites (notably `OnboardingFlow.jsx`) already use the right API surface — they just need the real library behind it.

- [ ] **Step 1: Replace `motion-lite.jsx` contents**

Overwrite the entire file with:

```jsx
// Thin re-export of framer-motion so existing call sites (`from '../../lib/motion-lite'`)
// keep working without rewriting imports across the codebase. If we ever swap libraries
// again, this is the only file that needs to change.
export { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
```

- [ ] **Step 2: Verify no import errors**

Run:

```powershell
npm run lint
```

Expected: no new errors introduced by this change. (Pre-existing lint warnings unrelated to motion are fine.)

- [ ] **Step 3: Smoke-test the dev server**

Run:

```powershell
npm run dev
```

Open `http://127.0.0.1:5173` (or whichever port Vite reports), navigate to onboarding (the auth → onboarding path). Confirm step transitions now actually slide+fade — the existing `makePageVariants` in `OnboardingFlow.jsx` should now be live.

Stop the dev server (Ctrl+C).

- [ ] **Step 4: Commit**

```powershell
git add src/lib/motion-lite.jsx
git commit -m "refactor: replace motion-lite stub with framer-motion re-export"
```

---

### Task 3: Create transitions preset module

**Files:**
- Create: `src/lib/transitions.js`

This module is the single source of truth for animation timing/easing. Every screen imports presets from here so we can tune feel in one place.

- [ ] **Step 1: Create `src/lib/transitions.js`**

```js
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { isNative } from './nativeAlarms';

// Material 3 emphasized-decelerate easing.
// Used for all page-level transitions for consistency.
export const MATERIAL_EMPHASIZED = [0.32, 0.72, 0, 1];

// Forward route push: slide in from right + fade.
// Back pop: slide out to right + fade.
// 24px is intentionally small so it feels Android, not iOS.
export const pageSlide = {
  initial:  { opacity: 0, x: 24 },
  animate:  { opacity: 1, x: 0 },
  exit:     { opacity: 0, x: -12 },
  transition: { duration: 0.28, ease: MATERIAL_EMPHASIZED },
};

// Container morph spring — used implicitly by framer-motion's layout
// animation when two elements share a layoutId. Tuned to feel responsive
// without bouncing.
export const containerMorph = {
  type: 'spring',
  stiffness: 380,
  damping: 34,
  mass: 0.8,
};

// Short opacity fade applied to the WebView root (`#root`) just before
// a native Compose screen is shown, and reversed when it's hidden.
export const NATIVE_HANDOFF_FADE_MS = 180;

// Duration the native side animates for (Compose AnimatedVisibility).
// Kept here so JS and Kotlin agree on the perceived overlap (~120ms).
export const NATIVE_ENTER_MS = 220;
export const NATIVE_EXIT_MS  = 180;

// Fade the WebView root to 0 over NATIVE_HANDOFF_FADE_MS, then resolve.
// No-op on web (still resolves immediately).
export function fadeOutWebView() {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve();
      return;
    }
    const root = document.getElementById('root');
    if (!root) {
      resolve();
      return;
    }
    root.style.transition = `opacity ${NATIVE_HANDOFF_FADE_MS}ms ease-out`;
    root.style.opacity = '0';
    window.setTimeout(resolve, NATIVE_HANDOFF_FADE_MS);
  });
}

// Restore the WebView root opacity. Call after hiding a native screen.
export function fadeInWebView() {
  if (typeof document === 'undefined') return;
  const root = document.getElementById('root');
  if (!root) return;
  root.style.transition = `opacity ${NATIVE_HANDOFF_FADE_MS}ms ease-out`;
  root.style.opacity = '1';
}

// Fire a Light haptic impact, then run the action on the next frame so the
// haptic is perceived BEFORE the visual change (this is the "feels native"
// trick — order matters more than people think).
// `action` is the function that triggers the navigation/transition.
export function tapTransition(action) {
  if (isNative) {
    // Don't await — fire-and-forget so we don't add latency to the visual.
    void Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
  }
  // RAF instead of setTimeout(0) so we land on a render boundary.
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => action());
  } else {
    action();
  }
}
```

- [ ] **Step 2: Verify lint passes**

Run:

```powershell
npm run lint
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```powershell
git add src/lib/transitions.js
git commit -m "feat: add transitions preset module with tapTransition helper"
```

---

### Task 4: Wrap `<Routes>` in `<AnimatePresence>` with location key

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Update imports in `src/App.jsx`**

Replace the import block at the top of the file:

```jsx
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from './lib/motion-lite';
import { AppProvider, useApp } from './context/AppContext';
import AuthScreen from './components/Auth/AuthScreenModern';
import OnboardingFlow from './components/Onboarding/OnboardingFlow';
import Home from './components/Home/Home';
import CreateAlarm from './components/Alarm/CreateAlarm';
import WakeUpFlow from './components/WakeUp/WakeUpFlow';
import { LoadingScreen, LoadingScreenPreview } from './components/common/LoadingScreen';
```

- [ ] **Step 2: Wrap `<Routes>` in the `canUseApp` branch**

Replace the existing `<Routes>` block (lines 51-58) with:

```jsx
  if (canUseApp) {
    return (
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/create-alarm" element={<CreateAlarm />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    );
  }
```

The `key={location.pathname}` is what makes `<AnimatePresence>` see route changes as enter/exit pairs. `mode="wait"` queues the next transition until the current exit completes — required to avoid overlap glitches with our 24px slide.

- [ ] **Step 3: Verify lint passes**

Run:

```powershell
npm run lint
```

Expected: no new errors.

- [ ] **Step 4: Verify dev server still renders**

Run:

```powershell
npm run dev
```

Open the app at the dev URL, navigate to `/`. The page should render normally — there's no per-route motion wrapper yet, so transitions still look like hard cuts. That's expected; the wrappers come in Task 5 / 6.

Stop the dev server.

- [ ] **Step 5: Commit**

```powershell
git add src/App.jsx
git commit -m "feat: wrap Routes in AnimatePresence keyed by pathname"
```

---

### Task 5: Add page-slide motion wrapper to CreateAlarm

**Files:**
- Modify: `src/components/Alarm/CreateAlarm.jsx`

We wrap CreateAlarm first because it's the simpler of the two (no native handoff logic to coordinate). Home gets the same treatment plus the `LayoutGroup` later.

- [ ] **Step 1: Add motion + transitions imports near the top of `src/components/Alarm/CreateAlarm.jsx`**

Find the existing import block (around lines 1-32). Add these two lines after the existing imports:

```jsx
import { motion } from '../../lib/motion-lite';
import { pageSlide } from '../../lib/transitions';
```

- [ ] **Step 2: Wrap the top-level returned element of the default-exported component in a `motion.div`**

Locate the default-exported component in `CreateAlarm.jsx` (the function that renders the entire screen — find it by searching for `export default`). Find its top-level `return (`. Wrap whatever JSX is currently being returned at the top level with a `motion.div`:

Before:
```jsx
return (
  <Box ...>
    {/* ...existing content... */}
  </Box>
);
```

After:
```jsx
return (
  <motion.div
    initial={pageSlide.initial}
    animate={pageSlide.animate}
    exit={pageSlide.exit}
    transition={pageSlide.transition}
    style={{ minHeight: '100dvh', willChange: 'transform, opacity' }}
  >
    <Box ...>
      {/* ...existing content... */}
    </Box>
  </motion.div>
);
```

`willChange` is important: without it the browser may not promote the element to its own layer and you get sub-pixel rendering jank during the slide.

- [ ] **Step 3: Verify lint passes**

Run:

```powershell
npm run lint
```

Expected: no new errors.

- [ ] **Step 4: Visual check on web**

Run `npm run dev`, open the app, sign in (or use the offline path), tap to navigate from `/` to `/create-alarm`, then back. Both transitions should now have a subtle slide+fade. Stop the dev server.

- [ ] **Step 5: Commit**

```powershell
git add src/components/Alarm/CreateAlarm.jsx
git commit -m "feat: add page slide transition to CreateAlarm screen"
```

---

### Task 6: Add page-slide motion wrapper + LayoutGroup to Home

**Files:**
- Modify: `src/components/Home/Home.jsx`

- [ ] **Step 1: Add imports to `src/components/Home/Home.jsx`**

Find the existing import block at the top. Add after the existing motion-related lines:

```jsx
import { motion, LayoutGroup } from '../../lib/motion-lite';
import { pageSlide, tapTransition } from '../../lib/transitions';
```

- [ ] **Step 2: Wrap the Home component's top-level return in a `motion.div` and `<LayoutGroup>`**

Locate the default-exported Home component and its top-level `return (`. Wrap the existing returned JSX:

Before:
```jsx
return (
  <Box ...>
    {/* ...alarm list, FAB, dialogs... */}
  </Box>
);
```

After:
```jsx
return (
  <LayoutGroup>
    <motion.div
      initial={pageSlide.initial}
      animate={pageSlide.animate}
      exit={pageSlide.exit}
      transition={pageSlide.transition}
      style={{ minHeight: '100dvh', willChange: 'transform, opacity' }}
    >
      <Box ...>
        {/* ...alarm list, FAB, dialogs... */}
      </Box>
    </motion.div>
  </LayoutGroup>
);
```

`<LayoutGroup>` makes sibling-rendered components (which Home and CreateAlarm aren't, but the `layoutId` magic still works between them via framer-motion's global layout tracking) coordinate their layout animations. We add it here defensively so future screens inside Home that want a morph already have the parent.

- [ ] **Step 3: Verify lint passes**

Run:

```powershell
npm run lint
```

Expected: no new errors.

- [ ] **Step 4: Commit**

```powershell
git add src/components/Home/Home.jsx
git commit -m "feat: add page slide transition + LayoutGroup to Home"
```

---

### Task 7: Add shared `layoutId` for FAB → CreateAlarm container morph

**Files:**
- Modify: `src/components/Home/Home.jsx`
- Modify: `src/components/Alarm/CreateAlarm.jsx`

Both elements get the same `layoutId="create-alarm-surface"`. When the route swap unmounts the FAB and mounts CreateAlarm, framer-motion morphs the FAB's bounding rect into the CreateAlarm shell's bounding rect.

- [ ] **Step 1: Wrap the Home FAB in a `motion.div` with `layoutId`**

In `src/components/Home/Home.jsx`, locate the existing FAB block (around lines 885-907 — search for `<Fab`). Replace this block:

Before:
```jsx
{!editTarget && !deleteTarget && (
  <Box sx={{
    position: 'fixed',
    right: 'max(16px, calc(env(safe-area-inset-right) + 16px))',
    bottom: 'calc(env(safe-area-inset-bottom) + 110px)',
    zIndex: 140,
  }}>
    <Box sx={{
      position: 'absolute', inset: -8, borderRadius: '50%',
      border: '2px solid rgba(255,107,53,0.25)', pointerEvents: 'none',
      animation: 'fabRing 2.4s ease-out infinite',
      '@keyframes fabRing': { '0%': { transform: 'scale(1)', opacity: 0.5 }, '100%': { transform: 'scale(1.65)', opacity: 0 } },
    }} />
    <Fab
      color="primary"
      onClick={handleCreateAlarm}
      sx={{ boxShadow: '0 8px 28px rgba(255,107,53,0.5)', '&:active': { transform: 'scale(0.94)' } }}
    >
      <AddIcon />
    </Fab>
  </Box>
)}
```

After:
```jsx
{!editTarget && !deleteTarget && (
  <Box sx={{
    position: 'fixed',
    right: 'max(16px, calc(env(safe-area-inset-right) + 16px))',
    bottom: 'calc(env(safe-area-inset-bottom) + 110px)',
    zIndex: 140,
  }}>
    <Box sx={{
      position: 'absolute', inset: -8, borderRadius: '50%',
      border: '2px solid rgba(255,107,53,0.25)', pointerEvents: 'none',
      animation: 'fabRing 2.4s ease-out infinite',
      '@keyframes fabRing': { '0%': { transform: 'scale(1)', opacity: 0.5 }, '100%': { transform: 'scale(1.65)', opacity: 0 } },
    }} />
    <motion.div layoutId="create-alarm-surface" style={{ borderRadius: '50%' }}>
      <Fab
        color="primary"
        onClick={() => tapTransition(() => handleCreateAlarm())}
        sx={{ boxShadow: '0 8px 28px rgba(255,107,53,0.5)', '&:active': { transform: 'scale(0.94)' } }}
      >
        <AddIcon />
      </Fab>
    </motion.div>
  </Box>
)}
```

Two things changed: (1) the `<Fab>` is wrapped in `<motion.div layoutId=...>`, (2) `onClick` is routed through `tapTransition()` so the haptic fires before navigation.

- [ ] **Step 2: Add the matching `layoutId` to CreateAlarm's outer wrapper**

In `src/components/Alarm/CreateAlarm.jsx`, modify the `motion.div` you added in Task 5. Add `layoutId="create-alarm-surface"` to its props:

```jsx
return (
  <motion.div
    layoutId="create-alarm-surface"
    initial={pageSlide.initial}
    animate={pageSlide.animate}
    exit={pageSlide.exit}
    transition={pageSlide.transition}
    style={{ minHeight: '100dvh', willChange: 'transform, opacity', borderRadius: 0 }}
  >
    <Box ...>
      {/* ...existing content... */}
    </Box>
  </motion.div>
);
```

When the FAB's `motion.div` (a small round element) and CreateAlarm's `motion.div` (a full-screen rectangle) share `layoutId`, framer-motion animates between their bounding rects, producing the "FAB expanding into the screen" effect. The morph spring physics come from framer-motion's defaults; no `transition` override needed for the layout part.

- [ ] **Step 3: Verify lint passes**

Run:

```powershell
npm run lint
```

Expected: no new errors.

- [ ] **Step 4: Visual check on web**

Run `npm run dev`, navigate to Home, tap the FAB. The FAB should visually expand into the CreateAlarm screen instead of being replaced by a slide. Tap back; the screen should collapse back into the FAB.

If you instead see a hard cut, the most likely cause is the `motion.div` not being part of the same React tree as the new route mounts. Verify both screens are reached via the `<AnimatePresence>` from Task 4.

Stop the dev server.

- [ ] **Step 5: Commit**

```powershell
git add src/components/Home/Home.jsx src/components/Alarm/CreateAlarm.jsx
git commit -m "feat: add FAB to CreateAlarm container morph via shared layoutId"
```

---

### Task 8: Wire `tapTransition()` to bottom-nav and CreateAlarm back arrow

**Files:**
- Modify: `src/components/Home/Home.jsx`
- Modify: `src/components/Alarm/CreateAlarm.jsx`

- [ ] **Step 1: Wrap bottom-nav `setTab` calls with `tapTransition()`**

In `src/components/Home/Home.jsx`, locate the web bottom-nav `Box` rendering (around line 228 — search for `NAV_ITEMS.map`). The current `onClick` is:

```jsx
onClick={() => setTab(i)}
```

Change it to:

```jsx
onClick={() => tapTransition(() => setTab(i))}
```

- [ ] **Step 2: Wrap the CreateAlarm back-arrow click**

In `src/components/Alarm/CreateAlarm.jsx`, find the back-arrow button (search for `ArrowBackIcon`). Its `onClick` currently calls `navigate(-1)` or `navigate('/')`. Wrap that call:

Before:
```jsx
onClick={() => navigate(-1)}
```

After:
```jsx
onClick={() => tapTransition(() => navigate(-1))}
```

If there are multiple `navigate(...)` calls on back/cancel/save buttons, wrap each one. Imports for `tapTransition` were already added in Task 5.

Wait — the imports were added in Task 5 to CreateAlarm? Re-check: Task 5 added `motion` and `pageSlide`. We need to also import `tapTransition` here. Add it now if not present:

```jsx
import { pageSlide, tapTransition } from '../../lib/transitions';
```

- [ ] **Step 3: Verify lint passes**

Run:

```powershell
npm run lint
```

Expected: no new errors.

- [ ] **Step 4: Commit**

```powershell
git add src/components/Home/Home.jsx src/components/Alarm/CreateAlarm.jsx
git commit -m "feat: route navigation taps through tapTransition for haptic feedback"
```

---

### Task 9: Convert NativeStatsScreen.kt to AnimatedVisibility

**Files:**
- Modify: `android/app/src/main/java/com/morninmate/app/NativeStatsScreen.kt`

We change the model: instead of `View.VISIBLE` ↔ `View.GONE` toggling the outer `ComposeView`, we keep the `ComposeView` mounted with `View.VISIBLE` while it has data, and drive an internal `mutableStateOf<Boolean>` through `AnimatedVisibility`. After the exit animation completes, a `LaunchedEffect` flips the outer `ComposeView` to `View.GONE` so it doesn't intercept WebView touches.

- [ ] **Step 1: Add new imports at the top of `NativeStatsScreen.kt`**

Find the existing imports block. Add the following imports (alphabetically grouped to match the file's existing style):

```kotlin
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.runtime.remember
import kotlinx.coroutines.delay
```

- [ ] **Step 2: Add a visibility state alongside `statsState`**

Find this line near the top of the file:

```kotlin
private val statsState = mutableStateOf<StatsData?>(null)
```

Add directly below it:

```kotlin
private val statsVisible = mutableStateOf(false)
```

- [ ] **Step 3: Update `setupNativeStatsScreen` to render through `AnimatedVisibility`**

Replace the `setContent { ... }` block inside `setupNativeStatsScreen` (around lines 92-95). Before:

```kotlin
setContent {
    val data = statsState.value
    if (data != null) StatsScreen(data)
}
```

After:

```kotlin
setContent {
    val data = statsState.value
    val visible = statsVisible.value
    AnimatedVisibility(
        visible = visible && data != null,
        enter = fadeIn(animationSpec = tween(durationMillis = 220)) +
                slideInVertically(
                    animationSpec = tween(durationMillis = 220),
                    initialOffsetY = { it / 8 },
                ),
        exit = fadeOut(animationSpec = tween(durationMillis = 180)) +
               slideOutVertically(
                   animationSpec = tween(durationMillis = 180),
                   targetOffsetY = { it / 8 },
               ),
    ) {
        if (data != null) StatsScreen(data)
    }

    // After the exit animation finishes, hide the outer ComposeView so it
    // doesn't intercept WebView touches when invisible.
    LaunchedEffect(visible) {
        if (!visible) {
            delay(220) // matches exit duration with a small buffer
            nativeStatsView?.post {
                if (!statsVisible.value && nativeStatsView?.visibility != View.GONE) {
                    nativeStatsView?.visibility = View.GONE
                }
            }
        }
    }
}
```

- [ ] **Step 4: Update `showNativeStats` to drive state, not visibility**

Replace the existing `showNativeStats` function. Before:

```kotlin
fun showNativeStats(data: StatsData) {
    if (statsState.value != data) {
        statsState.value = data
    }
    nativeStatsView?.post {
        if (nativeStatsView?.visibility != View.VISIBLE) {
            nativeStatsView?.visibility = View.VISIBLE
        }
    }
}
```

After:

```kotlin
fun showNativeStats(data: StatsData) {
    if (statsState.value != data) {
        statsState.value = data
    }
    nativeStatsView?.post {
        // Outer ComposeView must be VISIBLE for AnimatedVisibility to render.
        // The actual entrance animation runs internally based on statsVisible.
        if (nativeStatsView?.visibility != View.VISIBLE) {
            nativeStatsView?.visibility = View.VISIBLE
        }
        statsVisible.value = true
    }
}
```

- [ ] **Step 5: Update `hideNativeStats` to flip state, not visibility**

Replace the existing `hideNativeStats`. Before:

```kotlin
fun hideNativeStats() {
    nativeStatsView?.post {
        if (nativeStatsView?.visibility != View.GONE) {
            nativeStatsView?.visibility = View.GONE
        }
    }
}
```

After:

```kotlin
fun hideNativeStats() {
    nativeStatsView?.post {
        // Flip the state — AnimatedVisibility runs the exit animation, then
        // the LaunchedEffect inside setContent flips the outer view to GONE.
        statsVisible.value = false
    }
}
```

- [ ] **Step 6: Update `setNativeStatsScreenVisible` to drive state**

Replace the existing function. Before:

```kotlin
fun setNativeStatsScreenVisible(visible: Boolean) {
    val hasData = statsState.value != null
    nativeStatsView?.post {
        val nextVisibility = if (visible && hasData) View.VISIBLE else View.GONE
        if (nativeStatsView?.visibility != nextVisibility) {
            nativeStatsView?.visibility = nextVisibility
        }
    }
}
```

After:

```kotlin
fun setNativeStatsScreenVisible(visible: Boolean) {
    val hasData = statsState.value != null
    nativeStatsView?.post {
        if (visible && hasData) {
            if (nativeStatsView?.visibility != View.VISIBLE) {
                nativeStatsView?.visibility = View.VISIBLE
            }
            statsVisible.value = true
        } else {
            statsVisible.value = false
        }
    }
}
```

- [ ] **Step 7: Build the app**

Run:

```powershell
cd C:\dev\MorninMate
npm run build
npx cap sync android
cd android
.\gradlew.bat assembleDebug
```

Expected: BUILD SUCCESSFUL. If Kotlin compilation fails, the most likely cause is a missing import — check the imports added in Step 1 against the actual symbols used.

- [ ] **Step 8: Install and verify on device**

Run from `C:\dev\MorninMate\android`:

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" install -r app\build\outputs\apk\debug\app-debug.apk
```

Open the app, tap the **Stats** tab in the bottom nav. The stats screen should now fade in + slide up from the bottom by ~12% of screen height, instead of popping. Tap a different tab — it should fade out + slide down.

- [ ] **Step 9: Commit**

```powershell
cd C:\dev\MorninMate
git add android/app/src/main/java/com/morninmate/app/NativeStatsScreen.kt
git commit -m "feat: animate NativeStatsScreen entrance/exit with AnimatedVisibility"
```

---

### Task 10: Convert NativeAlarmsScreen.kt to AnimatedVisibility

**Files:**
- Modify: `android/app/src/main/java/com/morninmate/app/NativeAlarmsScreen.kt`

Same pattern as Task 9. Read this entire task before starting — the structure mirrors Task 9 exactly.

- [ ] **Step 1: Read the existing NativeAlarmsScreen.kt to understand the parallel structure**

Open `android/app/src/main/java/com/morninmate/app/NativeAlarmsScreen.kt`. It will have a parallel pattern: a private `nativeAlarmsView: ComposeView?`, a `mutableStateOf` for alarms data, a `setupNativeAlarmsScreen` function, and `showNativeAlarms` / `hideNativeAlarms` functions that toggle `View.VISIBLE` ↔ `View.GONE`. Note the exact field names so you can apply the same edits.

- [ ] **Step 2: Add the same imports as Task 9 Step 1**

```kotlin
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.runtime.remember
import kotlinx.coroutines.delay
```

- [ ] **Step 3: Add an `alarmsVisible` mutableStateOf alongside the existing data state**

Find the line declaring the alarms data state (something like `private val alarmsState = mutableStateOf(...)`). Below it, add:

```kotlin
private val alarmsVisible = mutableStateOf(false)
```

- [ ] **Step 4: Wrap the `setContent` body with the same `AnimatedVisibility` + `LaunchedEffect` block as Task 9 Step 3**

Apply the same shape — replace `statsState` references with the alarms data state name, `statsVisible` with `alarmsVisible`, `nativeStatsView` with `nativeAlarmsView`, and the inner `StatsScreen(data)` call with whatever Composable renders the alarms list (look at the current `setContent` body to find it; commonly something like `AlarmsScreen(data)`).

The animation specs (`fadeIn(220ms) + slideInVertically(it/8)` enter, `fadeOut(180ms) + slideOutVertically(it/8)` exit, 220ms `delay` in the `LaunchedEffect`) are identical.

- [ ] **Step 5: Update `showNativeAlarms` to flip `alarmsVisible` to true**

Same pattern as Task 9 Step 4: keep the existing data-update logic, ensure `View.VISIBLE` is set on the outer view, then `alarmsVisible.value = true`.

- [ ] **Step 6: Update `hideNativeAlarms` to flip `alarmsVisible` to false**

Same pattern as Task 9 Step 5: just flip the state — the `LaunchedEffect` handles the deferred outer-view hide.

- [ ] **Step 7: Update any `setNativeAlarmsScreenVisible`-style helper if present**

If there's a parallel `setNativeAlarmsScreenVisible(...)` function (like Task 9 Step 6), apply the same conversion.

- [ ] **Step 8: Build**

```powershell
cd C:\dev\MorninMate
npm run build
npx cap sync android
cd android
.\gradlew.bat assembleDebug
```

Expected: BUILD SUCCESSFUL.

- [ ] **Step 9: Install and verify**

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" install -r app\build\outputs\apk\debug\app-debug.apk
```

Trigger the path that calls `showNativeAlarms` (whichever flow in the app uses it — typically a tab or specific button). Confirm the alarms screen now fades in + slides up like Stats did in Task 9.

- [ ] **Step 10: Commit**

```powershell
cd C:\dev\MorninMate
git add android/app/src/main/java/com/morninmate/app/NativeAlarmsScreen.kt
git commit -m "feat: animate NativeAlarmsScreen entrance/exit with AnimatedVisibility"
```

---

### Task 11: Coordinate WebView fade with native handoff in Home.jsx

**Files:**
- Modify: `src/components/Home/Home.jsx`

The native side now animates in over 220ms. We want the WebView root to fade out over 180ms before that, so the perceived effect is a cross-fade rather than the native screen popping over a fully-visible WebView.

- [ ] **Step 1: Add `fadeOutWebView` and `fadeInWebView` imports**

In `src/components/Home/Home.jsx`, update the `transitions` import added in Task 6:

```jsx
import { pageSlide, tapTransition, fadeOutWebView, fadeInWebView } from '../../lib/transitions';
```

- [ ] **Step 2: Wrap the `showNativeStats` / `hideNativeStats` effect**

Find the effect that toggles native stats (around lines 179-192 of the current Home.jsx — search for `showNativeStats(nativeStatsPayload)`). Modify it to fade the WebView before showing, and restore it after hiding:

Before:
```jsx
useEffect(() => {
  if (!isNative) return;
  if (tab !== 1 || !nativeStatsPayload) {
    if (nativeStatsPayloadRef.current === 'hidden') return;
    nativeStatsPayloadRef.current = 'hidden';
    void hideNativeStats();
    return;
  }

  const serialized = JSON.stringify(nativeStatsPayload);
  if (nativeStatsPayloadRef.current === serialized) return;
  nativeStatsPayloadRef.current = serialized;
  void showNativeStats(nativeStatsPayload);
}, [tab, nativeStatsPayload]);
```

After:
```jsx
useEffect(() => {
  if (!isNative) return;
  if (tab !== 1 || !nativeStatsPayload) {
    if (nativeStatsPayloadRef.current === 'hidden') return;
    nativeStatsPayloadRef.current = 'hidden';
    void hideNativeStats();
    fadeInWebView();
    return;
  }

  const serialized = JSON.stringify(nativeStatsPayload);
  if (nativeStatsPayloadRef.current === serialized) return;
  nativeStatsPayloadRef.current = serialized;
  // Fade the WebView root out, THEN show the native screen, so they cross-fade.
  void fadeOutWebView().then(() => {
    void showNativeStats(nativeStatsPayload);
  });
}, [tab, nativeStatsPayload]);
```

- [ ] **Step 3: Wrap any `showNativeAlarms` / `hideNativeAlarms` calls the same way**

In `Home.jsx`, search for `showNativeAlarms` and `hideNativeAlarms`. For each call site:

- Before showing: `await fadeOutWebView()` then `await showNativeAlarms(...)`.
- After hiding: call `fadeInWebView()` directly after `hideNativeAlarms(...)`.

If the call sites are inside non-async functions, refactor to `.then(...)` chains as in Step 2.

- [ ] **Step 4: Verify lint passes**

Run:

```powershell
npm run lint
```

Expected: no new errors.

- [ ] **Step 5: Build, install, and verify on device**

```powershell
npm run build
npx cap sync android
cd android
.\gradlew.bat assembleDebug
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" install -r app\build\outputs\apk\debug\app-debug.apk
cd ..
```

Tap the Stats tab. The WebView content should fade out as the Compose stats screen fades in — no flash of the WebView still visible behind the stats screen, no abrupt cut. Tap back to Alarms; the Compose screen fades down and the WebView fades back in.

- [ ] **Step 6: Commit**

```powershell
git add src/components/Home/Home.jsx
git commit -m "feat: cross-fade WebView with native screens for clean handoff"
```

---

### Task 12: End-to-end verification on device

**Files:**
- (None — verification only)

- [ ] **Step 1: Clean build**

```powershell
cd C:\dev\MorninMate
npm run build
npx cap sync android
cd android
.\gradlew.bat clean assembleDebug
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" install -r app\build\outputs\apk\debug\app-debug.apk
cd ..
```

- [ ] **Step 2: Walk every transition**

On the device, exercise each transition listed below. For each, confirm: the move is smooth (~280ms), no flash/pop, no jank, no visual regression. Note any failures in your subagent report.

1. **App boot → Home** — already-existing screens should look identical to before (we only changed transitions, not steady-state UI).
2. **Tap FAB on Home** — on web, the FAB should expand into CreateAlarm; on native, the native CreateAlarmActivity opens (Android handles its own transition). Light haptic should fire on tap (native only).
3. **Back from CreateAlarm** — on web, the screen should collapse back into the FAB position.
4. **Tap Stats tab** — WebView fades out, Compose stats fade + slide up. Light haptic on tap.
5. **Tap Alarms tab** — Compose stats fade + slide down, WebView fades back in.
6. **Tap Profile tab** — Stats hides cleanly; Profile content fades in (Profile is web-rendered).
7. **Onboarding flow forward + back** — every step transition slides+fades (this was previously broken).
8. **Trigger native alarms screen** (whatever flow uses `showNativeAlarms`) — same fade-up behavior as Stats.

- [ ] **Step 3: Sanity check production build**

Run:

```powershell
cd C:\dev\MorninMate
npm run build
```

Expected: build succeeds without warnings about framer-motion / motion-lite. Check `dist/assets/*.js` size grew by roughly 30-40kb gzipped vs. before — confirms framer-motion is bundled correctly.

- [ ] **Step 4: Update docs and commit final**

If any deviation from the spec was made during implementation (different timing, different easing, an additional file touched), append a short note to `docs/superpowers/specs/2026-04-25-native-page-transitions-design.md` under a new "## Implementation notes" section, then commit:

```powershell
git add docs/superpowers/specs/2026-04-25-native-page-transitions-design.md
git commit -m "docs: note implementation deviations from native-transitions spec"
```

If implementation matched the spec exactly, skip this step.

---

## Self-review summary

- All four spec patterns covered: route slide (Tasks 4-6), container morph (Task 7), onboarding (free win from Task 2), native handoff (Tasks 9-11).
- All seven listed file changes from the spec map to tasks.
- Haptic integration covered in Task 8 (bottom-nav, back arrow) and Task 7 (FAB).
- No `TBD` / `add appropriate error handling` placeholders.
- Type/name consistency: `statsVisible` and `alarmsVisible` follow the same pattern; `tapTransition` signature is consistent across call sites; `pageSlide`, `containerMorph`, `MATERIAL_EMPHASIZED` defined in Task 3 and used as named in Tasks 5-7.
- Out-of-scope items from spec (swipe-back, boot transitions, wake-up flow) explicitly not in the plan.
