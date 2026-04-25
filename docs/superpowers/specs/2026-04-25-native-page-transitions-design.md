# Native-feel page transitions

**Date:** 2026-04-25
**Status:** Approved (pending implementation plan)

## Problem

The app is a Capacitor 8 + React 19 WebView wrapping native Compose screens. Page changes feel "webby":

- Route changes between `/` (Home) and `/create-alarm` are hard cuts. `<Routes>` swaps the tree with no transition.
- Onboarding step transitions are coded against `motion-lite` — but `motion-lite` is a stub: `AnimatePresence` is `({ children }) => children`, so step exits never animate. The intended slide/fade never runs.
- The native handoff (Home → `NativeStatsScreen` / `NativeAlarmsScreen`) flips `View.VISIBLE` ↔ `View.GONE` instantly. The Compose screen pops in over the WebView with no choreography.

Net effect: the app reads as a website-in-a-shell, not a native Android app.

## Goals

1. Page-level transitions on the React side (Home ↔ CreateAlarm) feel like a native Android stack — not a route swap.
2. The FAB → CreateAlarm interaction has a container morph (the "feels like an app" headline moment).
3. Existing onboarding step transitions start working without rewriting them.
4. The React ↔ Compose handoff cross-fades cleanly — neither side pops.
5. Primary nav taps land with a light haptic before the visual move.

## Non-goals

- Swipe-back / edge-swipe gesture support.
- Auth → Onboarding → Home boot sequence transitions.
- Wake-up flow entrance choreography.
- React Router `view-transitions-api` integration.
- iOS-style push/pop motion (we are Android-first; iOS uses the same code but the timing is tuned to Material).

## Approach

### Library choice: real `framer-motion`

Add `framer-motion` as a dependency (~30kb gzipped — negligible inside a 10MB+ APK). The current `src/lib/motion-lite.jsx` shim becomes a one-line re-export of the real library. Every existing `motion.*` call site (notably `OnboardingFlow.jsx`) starts animating immediately with zero call-site changes.

Rationale for not using Web Animations API or CSS-only: the FAB → CreateAlarm container morph requires shared-element layout animation, which framer-motion's `LayoutGroup` + `layoutId` solves in ~5 lines. Hand-rolling that is significantly more code and harder to keep correct across screen sizes.

### Motion language: hybrid pragmatic, Material-leaning

- **Forward route push:** slide in from right by 24px + fade. ~280ms.
- **Back pop:** slide out to right + fade. ~280ms.
- **Easing:** `cubic-bezier(0.32, 0.72, 0, 1)` (Material 3 emphasized-decelerate). Applied to all page-level transitions for consistency.
- **24px slide distance is deliberate:** small enough to feel Android (not the 100% sliding panel of iOS push), large enough to read as movement.
- **Container morph:** the FAB and the CreateAlarm shell share a `layoutId`. Tap FAB → it visually expands into the screen instead of being replaced by it. If the morph fails to find a target (e.g. mid-transition), the route slide is the fallback.
- **Native handoff:** WebView content fades to 0 (180ms) just before the native screen is shown. The Compose screen fades in (220ms) + slides up by `height/8`. ~120ms perceived overlap → reads as cross-fade, not handoff.

### Architecture

```
src/lib/
  motion-lite.jsx      ← becomes: export { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
  transitions.js       ← NEW: transition presets + tapTransition() helper

src/
  App.jsx              ← wrap <Routes> in <AnimatePresence mode="wait"> + page wrapper
  components/
    Home/Home.jsx      ← LayoutGroup + layoutId on FAB; tapTransition() on FAB / bottom-nav
    Alarm/CreateAlarm.jsx ← matching layoutId on page shell

android/app/src/main/java/com/morninmate/app/
  NativeStatsScreen.kt   ← AnimatedVisibility wrapper, drive by state
  NativeAlarmsScreen.kt  ← AnimatedVisibility wrapper, drive by state
  AlarmPlugin.java       ← UNCHANGED (bridge surface preserved)
```

### Component contracts

**`src/lib/transitions.js`** exports:
- `pageSlide` — variants object `{ initial, animate, exit }` for forward/back route slides.
- `containerMorph` — variants for the FAB → CreateAlarm shell.
- `crossFade` — short opacity transitions for the WebView side of the native handoff.
- `MATERIAL_EMPHASIZED` — the easing curve constant.
- `tapTransition(navigate, path)` — fires `Haptics.impact({ style: Light })` then calls `navigate(path)`. No-op haptic on web.

**`src/lib/motion-lite.jsx`** becomes:
```jsx
export { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
```

**`<Routes>` wrapper in `App.jsx`**:
```jsx
<AnimatePresence mode="wait" initial={false}>
  <Routes location={location} key={location.pathname}>
    <Route path="/" element={<Home />} />
    <Route path="/create-alarm" element={<CreateAlarm />} />
  </Routes>
</AnimatePresence>
```
Each route element wraps its content in a `motion.div` using `pageSlide` variants.

**Native side — `NativeStatsScreen.kt` (and parallel for Alarms)**:
- Replace `View.GONE` / `View.VISIBLE` toggles with a `mutableStateOf<Boolean>` (`statsVisible`) read inside the Compose tree.
- Wrap `StatsScreen(data)` in `AnimatedVisibility(visible = statsVisible, enter = fadeIn(220ms) + slideInVertically(...), exit = fadeOut(180ms) + slideOutVertically(...))`.
- The `ComposeView` itself stays `View.VISIBLE` while `statsVisible` toggles internally — this keeps the Compose tree alive across show/hide and lets `AnimatedVisibility` actually run.
- After `statsVisible` flips to `false`, a `LaunchedEffect(statsVisible)` waits for the exit animation duration (~220ms) then sets the outer `ComposeView.visibility = View.GONE` via the activity reference. This prevents the (now invisible) `ComposeView` from intercepting WebView touches. The reverse path: `showNativeStats` first sets `View.VISIBLE` on the outer view, then flips `statsVisible = true` on the next frame so `AnimatedVisibility` runs the enter animation.

### Haptic integration

`tapTransition(navigate, path)` is called on:
- The home FAB (Add alarm)
- Bottom-nav taps that change route or trigger native screens
- The back arrow inside CreateAlarm

Light impact only — heavy/medium would feel wrong for routine navigation. No haptic on web (gated by `Capacitor.isNativePlatform()`).

## Risks and edge cases

- **Layout shift on first paint**: `AnimatePresence` with `initial={false}` is required so the first render doesn't animate-in.
- **Mid-transition route changes**: `mode="wait"` queues the next transition until the current one finishes. This can introduce a perceptible delay if the user taps very fast — acceptable tradeoff vs. overlap glitches.
- **`layoutId` collision**: only one element with a given `layoutId` may be visible at a time. The FAB unmounts the moment the route changes (its parent screen unmounts), so the shell's `layoutId` takes over. Verified by the AnimatePresence + LayoutGroup interaction model.
- **Compose screen still alive while hidden**: keeping the `ComposeView` mounted (just internally hidden) increases idle memory marginally. Tradeoff is required for `AnimatedVisibility` to function. Acceptable on a 2-screen surface.
- **WebView fade timing**: if JS fires the WebView fade and the native `show` call out of order, the user sees a brief flash. Mitigation: serialize via `await` — fade JS first (await ~180ms), then call `showNativeStats`.
- **Reduced-motion preference**: framer-motion respects `prefers-reduced-motion` automatically when transitions use the standard `transition` shape. We will not add additional gating.

## Testing plan

- Manual: install APK on the test device (`adb install -r app-debug.apk`), exercise each transition: FAB → Create Alarm, back, bottom-nav → Stats, back, bottom-nav → Alarms, back, full Onboarding flow forward + back.
- Visual sanity: each transition runs without flicker, hard cut, or pop.
- Performance: confirm no jank on scroll-heavy screens (Home alarm list) immediately after a transition.
- Cross-platform: verify web (`npm run dev`) still renders correctly — haptic calls are no-ops, `framer-motion` runs natively in browser.
- Regression: verify Onboarding step transitions now actually animate (they previously did not).

## Out of scope (future work)

- Swipe-from-edge back gesture (would require gesture handling library + per-screen pop targets).
- Wake-up flow entrance / exit choreography.
- Auth → Onboarding boot transition.
- Coordinated keyboard-aware transitions (e.g. when CreateAlarm opens with the keyboard already up).
