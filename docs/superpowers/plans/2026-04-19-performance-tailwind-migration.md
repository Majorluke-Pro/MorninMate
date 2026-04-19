# Performance Overhaul: MUI → Tailwind Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate WebView lag by removing MUI + Emotion CSS-in-JS runtime, fixing the 300ms Android tap delay, and replacing Framer Motion with CSS transitions — making the Capacitor WebView app feel responsive.

**Architecture:** Replace all `@mui/material` component imports with plain HTML elements styled via Tailwind CSS utility classes. The existing color palette in `src/theme/theme.js` is translated 1:1 into Tailwind v4 CSS variables. No component structure, routing, or business logic changes.

**Tech Stack:** Tailwind CSS v4 (via `@tailwindcss/vite`), React 19, Capacitor 8, Vite 8

---

## Global Tailwind Class Reference

Use this mapping throughout all conversion tasks.

### MUI Component → HTML + Tailwind

| MUI | HTML + Tailwind classes |
|-----|------------------------|
| `<Box sx={{ display:'flex' }}>` | `<div className="flex">` |
| `<Box sx={{ display:'flex', flexDirection:'column' }}>` | `<div className="flex flex-col">` |
| `<Box sx={{ display:'flex', alignItems:'center' }}>` | `<div className="flex items-center">` |
| `<Box sx={{ display:'flex', justifyContent:'center' }}>` | `<div className="flex justify-center">` |
| `<Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>` | `<div className="flex items-center justify-between">` |
| `<Box sx={{ p: 2 }}>` (p=2 = 16px) | `<div className="p-4">` |
| `<Box sx={{ mb: 2 }}>` | `<div className="mb-4">` |
| `<Box sx={{ gap: 1 }}>` (gap=1 = 8px) | `<div className="gap-2">` |
| `<Card>` / `<Paper>` | `<div className="bg-card rounded-2xl">` |
| `<Typography variant="h4" sx={{ fontWeight:700 }}>` | `<h4 className="text-2xl font-bold">` |
| `<Typography variant="h5">` | `<h5 className="text-xl font-bold">` |
| `<Typography variant="h6">` | `<h6 className="text-lg font-semibold">` |
| `<Typography variant="body1">` | `<p className="text-base">` |
| `<Typography variant="body2">` | `<p className="text-sm">` |
| `<Typography variant="caption">` | `<span className="text-xs">` |
| `<Typography sx={{ color:'text.secondary' }}>` | add `text-muted` class |
| `<Button variant="contained" color="primary">` | `<button className="bg-primary text-white rounded-xl px-6 py-3 font-bold active:scale-95 transition-transform touch-manipulation">` |
| `<Button variant="outlined">` | `<button className="border border-primary text-primary rounded-xl px-6 py-3 font-bold active:scale-95 transition-transform touch-manipulation">` |
| `<Button variant="text">` | `<button className="text-primary font-semibold px-4 py-2 rounded-xl active:scale-95 transition-transform touch-manipulation">` |
| `<IconButton>` | `<button className="p-2 rounded-full active:scale-90 transition-transform touch-manipulation">` |
| `<TextField label="X">` | see Task 2 for full input pattern |
| `<Switch checked={x} onChange={fn}>` | see Task 2 for full switch pattern |
| `<LinearProgress variant="determinate" value={x}>` | `<div className="h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full transition-all" style={{ width: `${x}%` }} /></div>` |
| `<CircularProgress>` | `<div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin">` |
| `<Divider>` | `<hr className="border-white/10">` |
| `<Dialog open={x}>` | see Task 2 for full dialog pattern |
| `<Fade in={x}>` | wrap in `<div className={x ? 'opacity-100' : 'opacity-0'} style={{ transition: 'opacity 0.3s' }}>` |
| `<Avatar src={x}>` | `<img src={x} className="w-10 h-10 rounded-full object-cover">` |

### MUI `sx` spacing scale → Tailwind

MUI spacing multiplier is 8px. Tailwind spacing multiplier is 4px.
- `sx={{ p:1 }}` (8px) → `p-2`
- `sx={{ p:2 }}` (16px) → `p-4`
- `sx={{ p:3 }}` (24px) → `p-6`
- `sx={{ gap:1 }}` (8px) → `gap-2`
- `sx={{ gap:2 }}` (16px) → `gap-4`
- `sx={{ mb:1 }}` → `mb-2`, `sx={{ mb:2 }}` → `mb-4`, `sx={{ mb:3 }}` → `mb-6`

### Color tokens

| MUI palette | Tailwind class |
|-------------|---------------|
| `primary.main` / `#FF6B35` | `text-primary` / `bg-primary` |
| `primary.light` / `#FF8C5A` | `text-primary-light` / `bg-primary-light` |
| `secondary.main` / `#FFD166` | `text-secondary` / `bg-secondary` |
| `background.default` / `#0D0D1A` | `bg-base` |
| `background.paper` / `#16162A` | `bg-card` |
| `success.main` / `#06D6A0` | `text-success` / `bg-success` |
| `error.main` / `#EF476F` | `text-error` / `bg-error` |
| `info.main` / `#118AB2` | `text-info` / `bg-info` |
| `text.primary` / `#F0F0FA` | `text-content` |
| `text.secondary` / `#9898B8` | `text-muted` |

---

## Task 1: Quick wins — tap delay + hardware acceleration

**Files:**
- Modify: `src/index.css`
- Modify: `android/app/src/main/AndroidManifest.xml`

- [ ] **Step 1: Add tap delay fix and hardware acceleration hints to global CSS**

Replace the entire `*` block and add new rules in `src/index.css`:

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

body {
  background-color: #0D0D1A;
  color: #F8F9FA;
  font-family: 'Ubuntu', 'Helvetica', 'Arial', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overscroll-behavior: none;
}

#root {
  max-width: 480px;
  margin: 0 auto;
  min-height: 100vh;
}

/* Prevent input zoom on iOS/Android WebView */
input, textarea, select {
  font-size: 16px;
}

/* Hide number input arrows */
input[type='number']::-webkit-outer-spin-button,
input[type='number']::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type='number'] {
  -moz-appearance: textfield;
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 4px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(255, 107, 53, 0.3);
  border-radius: 2px;
}
```

- [ ] **Step 2: Enable hardware acceleration in AndroidManifest**

In `android/app/src/main/AndroidManifest.xml`, find the `<application` tag and add `android:hardwareAccelerated="true"`:

```xml
<application
    android:allowBackup="true"
    android:hardwareAccelerated="true"
    android:icon="@mipmap/ic_launcher"
    android:label="@string/app_name"
    android:roundIcon="@mipmap/ic_launcher_round"
    android:supportsRtl="true"
    android:theme="@style/AppTheme">
```

- [ ] **Step 3: Commit**

```bash
git add src/index.css android/app/src/main/AndroidManifest.xml
git commit -m "perf: fix 300ms tap delay and enable hardware acceleration"
```

---

## Task 2: Install and configure Tailwind CSS v4

**Files:**
- Create: `tailwind.config.js` (not needed for v4 — config lives in CSS)
- Modify: `vite.config.js`
- Modify: `src/index.css`
- Modify: `package.json` (via npm install)

- [ ] **Step 1: Install Tailwind v4 via the Vite plugin**

```bash
npm install -D tailwindcss @tailwindcss/vite
```

Expected: packages installed, no errors.

- [ ] **Step 2: Add Tailwind to vite.config.js**

Replace `vite.config.js` entirely:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          icons: ['@mui/icons-material'],
        },
      },
    },
  },
})
```

- [ ] **Step 3: Add Tailwind import and theme variables to src/index.css**

Add the Tailwind import and custom theme at the TOP of `src/index.css` (before existing rules):

```css
@import "tailwindcss";

@theme {
  --color-primary: #FF6B35;
  --color-primary-light: #FF8C5A;
  --color-primary-dark: #E54E1B;
  --color-secondary: #FFD166;
  --color-secondary-light: #FFE09A;
  --color-secondary-dark: #E6B800;
  --color-base: #0D0D1A;
  --color-card: #16162A;
  --color-success: #06D6A0;
  --color-error: #EF476F;
  --color-info: #118AB2;
  --color-content: #F0F0FA;
  --color-muted: #9898B8;
  --font-family-outfit: "Outfit", sans-serif;
  --font-family-ubuntu: "Ubuntu", sans-serif;
}
```

So the top of the file reads:

```css
@import "tailwindcss";

@theme {
  /* ... theme vars above ... */
}

* {
  box-sizing: border-box;
  /* ... rest of existing rules ... */
}
```

- [ ] **Step 4: Verify build succeeds**

```bash
npm run build
```

Expected: `dist/` folder created, no errors. (App will look broken until MUI is removed but build must succeed.)

- [ ] **Step 5: Add reusable component patterns to src/index.css**

Add these utility classes after `@theme` — these handle patterns that are tedious to repeat inline:

```css
/* Reusable component patterns */
.btn-primary {
  @apply bg-primary text-white rounded-xl px-6 py-3 font-bold active:scale-95 transition-transform touch-manipulation w-full;
}

.btn-outline {
  @apply border border-primary text-primary rounded-xl px-6 py-3 font-bold active:scale-95 transition-transform touch-manipulation;
}

.btn-ghost {
  @apply text-primary font-semibold px-4 py-2 rounded-xl active:scale-95 transition-transform touch-manipulation;
}

.card {
  @apply bg-card rounded-2xl;
}

.input-field {
  @apply w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-content placeholder:text-muted focus:outline-none focus:border-primary/50 transition-colors;
  font-size: 16px;
}
```

- [ ] **Step 6: Commit**

```bash
git add vite.config.js src/index.css package.json package-lock.json
git commit -m "feat: add Tailwind CSS v4 with brand color theme"
```

---

## Task 3: Convert App.jsx

**Files:**
- Modify: `src/App.jsx`
- Delete reference: `src/theme/theme.js` (no longer imported)

App.jsx currently wraps everything in `<ThemeProvider>` and `<CssBaseline>`. Both are removed. The loading spinner replaces `CircularProgress`.

- [ ] **Step 1: Rewrite src/App.jsx**

```jsx
import { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import AuthScreen from './components/Auth/AuthScreenModern';
import OnboardingFlow from './components/Onboarding/OnboardingFlow';
import Home from './components/Home/Home';
import CreateAlarm from './components/Alarm/CreateAlarm';
import WakeUpFlow from './components/WakeUp/WakeUpFlow';

function AppRoutes() {
  const { session, user, activeAlarm, loading, pendingOnboarding, showAuthDirectly } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base">
        <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    if (pendingOnboarding || showAuthDirectly) return <AuthScreen />;
    return <OnboardingFlow />;
  }

  if (activeAlarm) return <WakeUpFlow />;

  if (!user.onboardingComplete) return <OnboardingFlow />;

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/create-alarm" element={<CreateAlarm />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
```

- [ ] **Step 2: Verify build succeeds**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "refactor: remove MUI ThemeProvider from App.jsx"
```

---

## Task 4: Convert ScrollDrum.jsx

**Files:**
- Modify: `src/components/common/ScrollDrum.jsx`

ScrollDrum uses only `Box` and `Typography`. The drum logic (pointer events, scroll physics) is untouched — only markup changes.

- [ ] **Step 1: Replace MUI imports and markup in ScrollDrum.jsx**

```jsx
import { useState, useEffect, useRef } from 'react';

export const HOURS   = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
export const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
export const PERIODS = ['AM', 'PM'];

const ITEM_H  = 56;
const VISIBLE = 5;

export default function ScrollDrum({ items, value, onChange, width = 80 }) {
  const idxOf  = v => items.indexOf(v);
  const [scrollY,  setScrollY]  = useState(() => idxOf(value) * ITEM_H);
  const [snapping, setSnapping] = useState(false);
  const drag = useRef({ active: false, startY: 0, startScroll: 0, lastY: 0, lastT: 0, vel: 0 });

  useEffect(() => {
    if (drag.current.active) return;
    const idx = idxOf(value);
    if (idx >= 0) setScrollY(idx * ITEM_H);
  }, [value]);

  const containerH = ITEM_H * VISIBLE;
  const clampScroll = s => Math.max(0, Math.min(s, (items.length - 1) * ITEM_H));

  function onPointerDown(e) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { active: true, startY: e.clientY, startScroll: scrollY, lastY: e.clientY, lastT: Date.now(), vel: 0 };
    setSnapping(false);
  }

  function onPointerMove(e) {
    if (!drag.current.active) return;
    const dy = e.clientY - drag.current.startY;
    const now = Date.now();
    drag.current.vel = (e.clientY - drag.current.lastY) / Math.max(1, now - drag.current.lastT);
    drag.current.lastY = e.clientY;
    drag.current.lastT = now;
    setScrollY(clampScroll(drag.current.startScroll - dy));
  }

  function onPointerUp() {
    if (!drag.current.active) return;
    drag.current.active = false;
    setSnapping(true);
    const vel = drag.current.vel;
    let projected = scrollY - vel * 80;
    projected = clampScroll(projected);
    const snapped = Math.round(projected / ITEM_H) * ITEM_H;
    setScrollY(snapped);
    const idx = Math.round(snapped / ITEM_H);
    onChange(items[Math.min(idx, items.length - 1)]);
  }

  const offset = scrollY - (VISIBLE - 1) / 2 * ITEM_H;

  return (
    <div
      style={{ width, height: containerH, overflow: 'hidden', position: 'relative', cursor: 'grab', userSelect: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Highlight band */}
      <div style={{
        position: 'absolute',
        top: (containerH - ITEM_H) / 2,
        left: 0, right: 0,
        height: ITEM_H,
        background: 'rgba(255,107,53,0.12)',
        borderRadius: 8,
        pointerEvents: 'none',
      }} />

      {/* Items */}
      <div style={{
        transform: `translateY(${-offset}px)`,
        transition: snapping ? 'transform 0.2s cubic-bezier(0.25,0.46,0.45,0.94)' : 'none',
      }}>
        {items.map((item, i) => {
          const itemScrollCenter = i * ITEM_H + ITEM_H / 2;
          const viewCenter = scrollY + containerH / 2;
          const dist = Math.abs(itemScrollCenter - viewCenter) / containerH;
          const opacity = Math.max(0.2, 1 - dist * 2.5);
          const isSelected = idxOf(value) === i;
          return (
            <div
              key={item}
              style={{ height: ITEM_H, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity }}
            >
              <span style={{
                fontSize: isSelected ? '1.25rem' : '1rem',
                fontWeight: isSelected ? 700 : 400,
                color: isSelected ? '#FF6B35' : '#F0F0FA',
                transition: 'all 0.15s',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {item}
              </span>
            </div>
          );
        })}
      </div>

      {/* Top/bottom fade masks */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: ITEM_H * 1.5,
        background: 'linear-gradient(to bottom, #0D0D1A, transparent)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: ITEM_H * 1.5,
        background: 'linear-gradient(to top, #0D0D1A, transparent)',
        pointerEvents: 'none',
      }} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/common/ScrollDrum.jsx
git commit -m "refactor: convert ScrollDrum to plain HTML (remove MUI)"
```

---

## Task 5: Convert TimePicker.jsx

**Files:**
- Modify: `src/components/common/TimePicker.jsx`

TimePicker uses `Box`, `InputBase`, `Typography`. The SVG clock face and all pointer logic are untouched.

- [ ] **Step 1: Replace MUI in TimePicker.jsx**

Replace the import line and all JSX. All logic functions (`commitTick`, `handlePointerDown`, etc.) are identical — only the `return (...)` block changes:

```jsx
import { useEffect, useRef, useState } from 'react';
```

(Remove `Box`, `InputBase`, `Typography` imports — they are the only MUI imports.)

Replace the `return (...)` block (starting at line 179) with:

```jsx
  return (
    <div className="py-4 px-3">

      {/* Time display */}
      <div className="flex items-center justify-center gap-1 mb-5">
        <div
          onClick={() => startManualEdit('hour')}
          className="px-3 py-1 rounded-lg cursor-pointer leading-none transition-all min-w-[78px] text-center"
          style={{
            background: mode === 'hour' ? 'rgba(255,107,53,0.18)' : 'transparent',
            color: !hasValue ? 'rgba(255,255,255,0.28)' : mode === 'hour' ? '#FF6B35' : 'rgba(255,255,255,0.45)',
            fontWeight: 900,
            fontSize: '3rem',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {editingPart === 'hour' ? (
            <input
              ref={inputRef}
              value={draftValue}
              onChange={e => setDraftValue(e.target.value.replace(/\D/g, '').slice(0, 2))}
              onBlur={commitManualEdit}
              onKeyDown={handleManualKeyDown}
              inputMode="numeric"
              maxLength={2}
              className="w-12 bg-transparent text-center outline-none"
              style={{ color: '#FF6B35', fontWeight: 900, fontSize: '3rem', padding: 0 }}
            />
          ) : (
            hour12 == null ? '--' : String(hour12).padStart(2, '0')
          )}
        </div>

        <span style={{ fontWeight: 900, fontSize: '3rem', lineHeight: 1, color: 'rgba(255,255,255,0.25)', marginBottom: 4 }}>:</span>

        <div
          onClick={() => startManualEdit('minute')}
          className="px-3 py-1 rounded-lg cursor-pointer leading-none transition-all min-w-[78px] text-center"
          style={{
            background: mode === 'minute' ? 'rgba(255,107,53,0.18)' : 'transparent',
            color: !hasValue ? 'rgba(255,255,255,0.28)' : mode === 'minute' ? '#FF6B35' : 'rgba(255,255,255,0.45)',
            fontWeight: 900,
            fontSize: '3rem',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {editingPart === 'minute' ? (
            <input
              ref={inputRef}
              value={draftValue}
              onChange={e => setDraftValue(e.target.value.replace(/\D/g, '').slice(0, 2))}
              onBlur={commitManualEdit}
              onKeyDown={handleManualKeyDown}
              inputMode="numeric"
              maxLength={2}
              className="w-12 bg-transparent text-center outline-none"
              style={{ color: '#FF6B35', fontWeight: 900, fontSize: '3rem', padding: 0 }}
            />
          ) : (
            m == null ? '--' : String(m).padStart(2, '0')
          )}
        </div>

        {/* AM / PM */}
        <div className="flex flex-col gap-1.5 ml-2">
          {['AM', 'PM'].map(p => {
            const active = (p === 'PM') === isPM;
            return (
              <div
                key={p}
                onClick={() => !active && togglePeriod()}
                className="px-3 py-1 rounded-full select-none transition-all"
                style={{
                  cursor: !hasValue || active ? 'default' : 'pointer',
                  background: !hasValue ? 'rgba(255,255,255,0.05)' : active ? '#FF6B35' : 'rgba(255,255,255,0.08)',
                  color: !hasValue ? 'rgba(255,255,255,0.28)' : active ? '#fff' : 'rgba(255,255,255,0.35)',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                }}
              >
                {p}
              </div>
            );
          })}
        </div>
      </div>

      {/* Clock face */}
      <div className="flex justify-center">
        <svg
          width={SIZE}
          height={SIZE}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          style={{ touchAction: 'none', userSelect: 'none', cursor: 'pointer', display: 'block' }}
        >
          <circle cx={CENTER} cy={CENTER} r={CENTER - 2} fill="rgba(255,255,255,0.05)" />
          {hasValue && (
            <line x1={CENTER} y1={CENTER} x2={handPos.x} y2={handPos.y}
              stroke="#FF6B35" strokeWidth={2} strokeLinecap="round" opacity={0.6} />
          )}
          <circle cx={CENTER} cy={CENTER} r={5} fill={hasValue ? '#FF6B35' : 'rgba(255,255,255,0.28)'} />
          {hasValue && <circle cx={handPos.x} cy={handPos.y} r={8} fill="#FF6B35" opacity={0.95} />}
          {(mode === 'hour' ? HOURS : MINUTES).map((item, i) => {
            const { x, y } = itemPos(i);
            const sel = hasValue && i === liveIdx;
            return (
              <g key={item}>
                <circle cx={x} cy={y} r={20}
                  fill={sel ? '#FF6B35' : 'rgba(255,255,255,0.0)'}
                  style={{ transition: 'fill 0.15s' }}
                />
                <text x={x} y={y} textAnchor="middle" dominantBaseline="central"
                  fill={sel ? '#fff' : 'rgba(255,255,255,0.6)'}
                  fontWeight={sel ? 800 : 500}
                  fontSize={mode === 'hour' ? 15 : 13}
                  style={{ userSelect: 'none', pointerEvents: 'none', transition: 'fill 0.15s' }}
                >
                  {mode === 'minute' ? String(item).padStart(2, '0') : item}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Mode hint */}
      <span className="block text-center mt-3" style={{ color: 'rgba(255,255,255,0.25)', letterSpacing: '1.5px', fontSize: '0.6rem' }}>
        {mode === 'hour' ? 'TAP TO SET HOUR' : 'TAP TO SET MINUTE'}
      </span>

    </div>
  );
```

- [ ] **Step 2: Commit**

```bash
git add src/components/common/TimePicker.jsx
git commit -m "refactor: convert TimePicker to plain HTML (remove MUI)"
```

---

## Task 6: Convert MathGame.jsx

**Files:**
- Modify: `src/components/Games/MathGame.jsx`

MathGame uses `Box`, `Typography`, `LinearProgress`. All game logic is untouched.

- [ ] **Step 1: Read the full file, identify all MUI usages**

Read `src/components/Games/MathGame.jsx` in full. The MUI imports are:
```js
import { Box, Typography, LinearProgress } from '@mui/material';
```

- [ ] **Step 2: Replace import line**

```js
// Remove entirely — no MUI needed
```

- [ ] **Step 3: Replace all MUI JSX using these rules**

- `<Box sx={{ ... }}>` → `<div className="...">` (translate sx props using the Global Reference table)
- `<Typography variant="h4" ...>` → `<h4 className="text-2xl font-bold ...">` 
- `<Typography variant="body1" ...>` → `<p className="text-base ...">`
- `<Typography variant="caption" ...>` → `<span className="text-xs ...">`
- `<LinearProgress variant="determinate" value={x} ...>` → 
  ```jsx
  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${x}%` }} />
  </div>
  ```
- The numpad digit buttons are likely already `<Box>` with `onClick`. Replace with:
  ```jsx
  <button
    onClick={() => handleDigit(n)}
    className="flex items-center justify-center bg-white/8 rounded-xl text-2xl font-bold active:scale-90 active:bg-white/15 transition-all touch-manipulation"
    style={{ aspectRatio: '1', width: '100%' }}
  >
    {n}
  </button>
  ```
- The backspace button:
  ```jsx
  <button
    onClick={handleBackspace}
    className="flex items-center justify-center bg-white/8 rounded-xl active:scale-90 active:bg-white/15 transition-all touch-manipulation"
    style={{ aspectRatio: '1', width: '100%' }}
  >
    <BackspaceIcon sx={{ fontSize: 24, color: '#9898B8' }} />
  </button>
  ```
- The check/submit button:
  ```jsx
  <button
    onClick={handleSubmit}
    className="flex items-center justify-center bg-primary rounded-xl active:scale-90 transition-all touch-manipulation"
    style={{ aspectRatio: '1', width: '100%' }}
  >
    <CheckIcon sx={{ fontSize: 28, color: '#fff' }} />
  </button>
  ```

Note: MUI icons (`BackspaceIcon`, `CheckIcon`) are kept as-is with their `sx` prop for sizing/color — `@mui/icons-material` is not being removed.

- [ ] **Step 4: Commit**

```bash
git add src/components/Games/MathGame.jsx
git commit -m "refactor: convert MathGame to plain HTML (remove MUI)"
```

---

## Task 7: Convert MemoryGame.jsx and ReactionGame.jsx

**Files:**
- Modify: `src/components/Games/MemoryGame.jsx`
- Modify: `src/components/Games/ReactionGame.jsx`

Both use only `Box`, `Typography`, `LinearProgress` from MUI — same replacements as Task 6.

- [ ] **Step 1: Convert MemoryGame.jsx**

Read the full file. Remove `{ Box, Typography, LinearProgress }` import. Apply the same replacement rules from Task 6:
- `<Box>` → `<div>`
- `<Typography>` → appropriate heading/paragraph tags
- `<LinearProgress>` → custom progress bar div pattern
- Memory card tiles: replace `<Box onClick={...} sx={{ ... }}>` with `<button onClick={...} className="...">` using Tailwind classes

Cards should look like:
```jsx
<button
  onClick={() => handleFlip(i)}
  className="flex items-center justify-center bg-card rounded-xl active:scale-95 transition-all touch-manipulation"
  style={{ aspectRatio: '1', width: '100%' }}
>
  {/* icon or back face */}
</button>
```

- [ ] **Step 2: Convert ReactionGame.jsx**

Read the full file. Same removal and replacement pattern. The main tap target — replace with:
```jsx
<button
  onClick={handleTap}
  className="w-full flex items-center justify-center rounded-2xl active:scale-95 transition-transform touch-manipulation"
  style={{ minHeight: 200, background: 'rgba(255,255,255,0.05)' }}
>
  {/* content */}
</button>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Games/MemoryGame.jsx src/components/Games/ReactionGame.jsx
git commit -m "refactor: convert MemoryGame and ReactionGame to plain HTML (remove MUI)"
```

---

## Task 8: Convert AuthScreenModern.jsx

**Files:**
- Modify: `src/components/Auth/AuthScreenModern.jsx`

Uses `Alert`, `Box`, `Button`, `Checkbox`, `CircularProgress`, `FormControlLabel`, `IconButton`, `Typography` from MUI. Also uses `lucide-react` icons (these stay).

- [ ] **Step 1: Read the full file**

Read `src/components/Auth/AuthScreenModern.jsx` in full.

- [ ] **Step 2: Remove MUI import line**

```js
// Remove this entire line:
import { Alert, Box, Button, Checkbox, CircularProgress, FormControlLabel, IconButton, Typography } from '@mui/material';
```

- [ ] **Step 3: Apply replacements**

| MUI component | Replacement |
|--------------|-------------|
| `<CircularProgress>` | `<div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin">` |
| `<Alert severity="error">` | `<div className="bg-error/15 border border-error/30 text-error text-sm px-4 py-3 rounded-xl">{children}</div>` |
| `<Alert severity="success">` | `<div className="bg-success/15 border border-success/30 text-success text-sm px-4 py-3 rounded-xl">{children}</div>` |
| `<Button variant="contained" fullWidth>` | `<button className="btn-primary">` |
| `<Button variant="text">` | `<button className="btn-ghost">` |
| `<IconButton onClick={toggleShow}>` | `<button onClick={toggleShow} className="p-2 text-muted active:scale-90 transition-transform touch-manipulation">` |
| `<Checkbox checked={x} onChange={fn}>` | `<input type="checkbox" checked={x} onChange={fn} className="w-4 h-4 accent-primary">` |
| `<FormControlLabel label="X" control={<Checkbox ...>}>` | `<label className="flex items-center gap-2 text-sm text-muted cursor-pointer"><input type="checkbox" ...> X</label>` |
| `<TextField label="Email" ...>` | `<input type="email" placeholder="Email" className="input-field" ...>` |
| `<TextField type="password" ...>` | `<div className="relative"><input type={show ? 'text' : 'password'} className="input-field pr-12" ...><button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">...</button></div>` |
| `<Box component="form">` | `<form>` |

- [ ] **Step 4: Commit**

```bash
git add src/components/Auth/AuthScreenModern.jsx
git commit -m "refactor: convert AuthScreenModern to plain HTML (remove MUI)"
```

---

## Task 9: Convert WakeUpFlow.jsx

**Files:**
- Modify: `src/components/WakeUp/WakeUpFlow.jsx`

Uses `Box`, `Typography`, `Card`, `Button`, `LinearProgress`, `Fade` from MUI.

- [ ] **Step 1: Read the full file**

Read `src/components/WakeUp/WakeUpFlow.jsx` in full.

- [ ] **Step 2: Remove MUI import**

```js
// Remove:
import { Box, Typography, Card, Button, LinearProgress, Fade } from '@mui/material';
```

- [ ] **Step 3: Apply replacements**

| MUI | Replacement |
|-----|-------------|
| `<Card sx={{ p:2, ... }}>` | `<div className="card p-4 ...">` |
| `<Button variant="contained" fullWidth>` | `<button className="btn-primary">` |
| `<Button variant="outlined">` | `<button className="btn-outline">` |
| `<LinearProgress variant="determinate" value={x}>` | `<div className="h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full transition-all" style={{ width: \`${x}%\` }} /></div>` |
| `<Fade in={show}>` | `<div style={{ opacity: show ? 1 : 0, transition: 'opacity 0.3s' }}>` |

- [ ] **Step 4: Commit**

```bash
git add src/components/WakeUp/WakeUpFlow.jsx
git commit -m "refactor: convert WakeUpFlow to plain HTML (remove MUI)"
```

---

## Task 10: Convert CreateAlarm.jsx

**Files:**
- Modify: `src/components/Alarm/CreateAlarm.jsx`

Uses `Box`, `Typography`, `Button`, `TextField`, `IconButton`, `ToggleButton`, `ToggleButtonGroup`, `Dialog`, `DialogTitle`, `DialogContent`, `DialogActions` from MUI.

- [ ] **Step 1: Read the full file**

Read `src/components/Alarm/CreateAlarm.jsx` in full.

- [ ] **Step 2: Remove MUI import**

```js
// Remove:
import { Box, Typography, Button, TextField, IconButton, ToggleButton, ToggleButtonGroup, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
```

- [ ] **Step 3: Apply replacements**

| MUI | Replacement |
|-----|-------------|
| `<ToggleButtonGroup value={x} onChange={fn}>` | `<div className="flex gap-2">` (manage selection in existing state) |
| `<ToggleButton value="x">` | `<button onClick={() => handleToggle('x')} className={selected === 'x' ? 'bg-primary text-white rounded-xl px-4 py-2 font-bold touch-manipulation' : 'bg-white/8 text-muted rounded-xl px-4 py-2 font-semibold touch-manipulation active:scale-95 transition-all'}>` |
| `<Dialog open={open} onClose={onClose}>` | `{open && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}><div className="bg-card rounded-t-3xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>` |
| `<DialogTitle>` | `<h3 className="text-lg font-bold mb-4">` |
| `<DialogContent>` | `<div className="mb-4">` |
| `<DialogActions>` | `<div className="flex gap-3 justify-end">` |
| `<TextField label="Name" value={x} onChange={fn}>` | `<div className="flex flex-col gap-1"><label className="text-xs text-muted uppercase tracking-widest">Name</label><input value={x} onChange={fn} className="input-field" /></div>` |

Day selector chips (replace `ToggleButton` day buttons):
```jsx
{DAY_LABELS.map((day, i) => (
  <button
    key={i}
    onClick={() => toggleDay(i)}
    className={`w-9 h-9 rounded-full text-xs font-bold touch-manipulation transition-all active:scale-90 ${
      days.includes(i)
        ? 'bg-primary text-white'
        : 'bg-white/8 text-muted'
    }`}
  >
    {day}
  </button>
))}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/Alarm/CreateAlarm.jsx
git commit -m "refactor: convert CreateAlarm to plain HTML (remove MUI)"
```

---

## Task 11: Convert OnboardingFlow.jsx (also removes Framer Motion)

**Files:**
- Modify: `src/components/Onboarding/OnboardingFlow.jsx`

Uses `motion`, `AnimatePresence` from `framer-motion` AND `Box`, `Typography`, `Button`, `TextField`, `IconButton`, `CircularProgress`, `Alert` from MUI.

- [ ] **Step 1: Read the full file**

Read `src/components/Onboarding/OnboardingFlow.jsx` in full.

- [ ] **Step 2: Remove both MUI and Framer Motion imports**

```js
// Remove:
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Typography, Button, TextField, IconButton, CircularProgress, Alert } from '@mui/material';
```

- [ ] **Step 3: Replace Framer Motion slide transitions**

Framer Motion's slide-in pattern is used for step transitions. Replace with CSS:

Add this state to track transition direction:
```jsx
const [transitioning, setTransitioning] = useState(false);
```

Replace `<motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -100, opacity: 0 }}>` with:
```jsx
<div
  key={step}
  style={{
    animation: 'slideIn 0.25s ease-out',
  }}
>
```

Add to `src/index.css`:
```css
@keyframes slideIn {
  from { opacity: 0; transform: translateX(24px); }
  to   { opacity: 1; transform: translateX(0); }
}
```

Replace `<AnimatePresence>` with `<>` (or remove entirely if just wrapping a single child).

- [ ] **Step 4: Replace MUI components**

Same rules as previous tasks. Additional patterns for onboarding:

Avatar selection grid (replace `<Box>` grid with):
```jsx
<div className="grid grid-cols-4 gap-3">
  {AVATAR_OPTIONS.map(avatar => (
    <button
      key={avatar.id}
      onClick={() => setSelected(avatar.id)}
      className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all touch-manipulation active:scale-95 ${
        selected === avatar.id ? 'bg-primary/20 ring-2 ring-primary' : 'bg-white/5'
      }`}
    >
      <span className="text-3xl">{avatar.emoji}</span>
    </button>
  ))}
</div>
```

Step progress dots:
```jsx
<div className="flex gap-2 justify-center">
  {steps.map((_, i) => (
    <div
      key={i}
      className={`rounded-full transition-all ${
        i === currentStep ? 'w-6 h-2 bg-primary' : 'w-2 h-2 bg-white/20'
      }`}
    />
  ))}
</div>
```

- [ ] **Step 5: Commit**

```bash
git add src/components/Onboarding/OnboardingFlow.jsx src/index.css
git commit -m "refactor: convert OnboardingFlow to plain HTML, replace Framer Motion with CSS"
```

---

## Task 12: Convert Home.jsx

**Files:**
- Modify: `src/components/Home/Home.jsx`

The largest file (1382 lines). Uses `Box`, `Typography`, `Card`, `IconButton`, `Switch`, `LinearProgress`, `Fab`, `Dialog`, `DialogTitle`, `DialogContent`, `DialogActions`, `Button`, `TextField`, `Divider`, `Avatar`, `Menu`, `MenuItem` from MUI.

- [ ] **Step 1: Read the full file**

Read `src/components/Home/Home.jsx` in full. (Read in two passes if needed: lines 1-700, then 700-1382.)

- [ ] **Step 2: Remove MUI import**

```js
// Remove:
import {
  Box, Typography, Card, IconButton, Switch, LinearProgress,
  Fab, Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, Divider, Avatar, Menu, MenuItem,
} from '@mui/material';
```

- [ ] **Step 3: Apply replacements for all MUI components**

Additional Home-specific patterns not covered in previous tasks:

**Switch (alarm toggle):**
```jsx
<button
  role="switch"
  aria-checked={checked}
  onClick={() => onChange(!checked)}
  className={`relative w-12 h-6 rounded-full transition-colors touch-manipulation ${checked ? 'bg-primary' : 'bg-white/20'}`}
>
  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-0.5'}`} />
</button>
```

**Fab (floating action button for adding alarm):**
```jsx
<button
  onClick={handleAdd}
  className="fixed bottom-24 right-6 w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/40 active:scale-90 transition-transform touch-manipulation z-10"
>
  <AddIcon sx={{ color: '#fff', fontSize: 28 }} />
</button>
```

**Menu (three-dot menu):**
```jsx
{menuOpen && (
  <div className="absolute right-0 top-8 bg-card rounded-xl shadow-xl z-20 min-w-[140px] overflow-hidden border border-white/10">
    <button onClick={handleEdit} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-content hover:bg-white/5 touch-manipulation">
      <EditIcon sx={{ fontSize: 18 }} /> Edit
    </button>
    <button onClick={handleDelete} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-error hover:bg-white/5 touch-manipulation">
      <DeleteOutlineIcon sx={{ fontSize: 18 }} /> Delete
    </button>
  </div>
)}
```

**Bottom nav bar:**
```jsx
<nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-card border-t border-white/8 flex z-10">
  {NAV_ITEMS.map(({ label, Icon }) => {
    const active = activeTab === label;
    return (
      <button
        key={label}
        onClick={() => setActiveTab(label)}
        className={`flex-1 flex flex-col items-center gap-1 py-3 touch-manipulation transition-colors ${active ? 'text-primary' : 'text-muted'}`}
      >
        <Icon sx={{ fontSize: 22 }} />
        <span className="text-xs font-medium">{label}</span>
      </button>
    );
  })}
</nav>
```

- [ ] **Step 4: Commit**

```bash
git add src/components/Home/Home.jsx
git commit -m "refactor: convert Home to plain HTML (remove MUI)"
```

---

## Task 13: Remove unused packages and verify build

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Remove MUI and Framer Motion packages**

```bash
npm uninstall @mui/material @emotion/react @emotion/styled framer-motion
```

Expected: packages removed, no errors.

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: no errors, `dist/` folder created.

If there are import errors, search for remaining MUI imports:
```bash
grep -r "from '@mui/material'" src/
grep -r "from 'framer-motion'" src/
```

Fix any remaining instances using the patterns from previous tasks.

- [ ] **Step 3: Check bundle size improvement**

```bash
ls -lh dist/assets/*.js
```

Expected: the largest JS chunk is significantly smaller than before (Emotion alone was ~15KB gzipped).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: remove @mui/material, @emotion, framer-motion (migration complete)"
```

---

## Task 14: Android build and smoke test

- [ ] **Step 1: Sync Capacitor and open Android Studio**

```bash
npm run cap:android
```

Expected: Android Studio opens with the project.

- [ ] **Step 2: Build debug APK and install on device/emulator**

In Android Studio: Run > Run 'app', or via CLI:
```bash
cd android && ./gradlew assembleDebug
```

Install the APK on a physical Android device (emulator performance is not representative).

- [ ] **Step 3: Smoke test checklist**

Verify on the physical device:
- [ ] App loads without visual artifacts
- [ ] Tap a button — response should feel instant (no 300ms pause)
- [ ] Navigate between Home tabs — smooth, no jank
- [ ] Open Create Alarm screen — time picker works, all controls responsive
- [ ] Alarm toggle switch responds immediately
- [ ] Dialog/modal opens and closes cleanly
- [ ] Onboarding flow step transitions are smooth
- [ ] WakeUp flow loads and game buttons respond instantly

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "build: verified Android performance overhaul complete"
```
