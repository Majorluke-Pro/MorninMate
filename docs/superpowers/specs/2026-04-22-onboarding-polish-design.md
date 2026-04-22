# Onboarding Polish Pass — Design Spec

**Date:** 2026-04-22  
**Scope:** Option A – Polish existing 10-step onboarding flow. No step reordering or merging.

---

## What We're Fixing

Four issues in `src/components/Onboarding/OnboardingFlow.jsx`:

1. **Game step** uses a tiny radio dot instead of icon cards, inconsistent with the Morning Type step.
2. **Summary screen** is a dry data table — anticlimactic after 10 steps of setup.
3. **Transitions** are a flat 0.18s opacity fade — no spatial direction.
4. **Avatar grid** is a cramped 4-column layout with 54px circles and 0.6rem labels.

---

## Changes

### 1. Game Step — Icon Cards

Replace the radio dot pattern with the same icon-card rows used by `MorningTypeStep`.

**Current:** each game row has a `10×10` radio dot, label, description, tag badge.  
**New:** each row gets a `32×32` rounded icon box (matching Morning Type), no radio dot. Selected state: orange-tinted border + background, icon color switches to `#FF6B35`.

The `tag` badge (Brain / Visual / Reflex) stays — move it to the right side of the row, same as it is now.

No data changes — `GAMES` array already has `Icon`, `label`, `desc`, `tag`.

### 2. Summary Screen — Celebratory Hero

Replace the plain `rows` table with a hero + stat chips layout.

**Layout:**
- Centered avatar circle (64px, `opt.color` border + tint background, icon at `1.8rem`)
- Name in `Fraunces` serif: `"You're all set, {name}!"`
- Subtitle: `"Your mornings just got an upgrade"`
- Row of pill chips showing the 3 key choices: wake time, game name, morning goal
- Below the card (unchanged): "Everything looks good. Create your account below."

The plain table of 8 rows is removed entirely.

### 3. Directional Slide Transitions

Replace the current fade-only `pageVariants` with a directional slide.

**Direction logic:** forward navigation slides new screen in from the right; back navigation slides it in from the left.

**New variants** (parameterised by direction):
```js
// direction: 1 = forward, -1 = back
enter: { x: direction * 40, opacity: 0 }
center: { x: 0, opacity: 1 }
exit:  { x: direction * -40, opacity: 0 }
```

Track direction in state alongside `animKey`. Pass direction into `AnimatePresence` via a render-prop or a wrapper component that receives the direction value.

Transition: `{ type: 'tween', duration: 0.22, ease: 'easeOut' }` — slightly longer than current 0.18s to let the slide read.

The `go(delta)` function already has `delta` (+1 / -1) — use that to set direction.

### 4. Avatar Grid — Larger, 3-Column

Change the grid from 4 columns to 3, increase circle size from 54px to 66px, icon from `1.45rem` to `1.75rem`, label from `0.6rem` to `0.72rem`.

No other changes to avatar logic or `AVATAR_OPTIONS`.

---

## Files Changed

- `src/components/Onboarding/OnboardingFlow.jsx` — all four changes are self-contained within this file

---

## Out of Scope

- Step order / count (stays at 10)
- Merging Name/Age/Country steps
- Welcome screen changes
- Country picker UX
- Any backend / context changes
