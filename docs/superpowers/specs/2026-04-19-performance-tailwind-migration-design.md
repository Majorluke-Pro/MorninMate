# Performance Overhaul: MUI → Tailwind Migration

**Date:** 2026-04-19  
**Goal:** Eliminate WebView lag, 300ms tap delay, and render jank by removing CSS-in-JS runtime overhead and fixing Android WebView touch handling.

---

## Root Causes

1. **MUI + Emotion (CSS-in-JS)** — used in all 12 component files. Emotion computes styles in JavaScript on every render and injects them into the DOM. In a Capacitor WebView on Android this causes significant render lag and jank.
2. **Missing tap delay fix** — no `touch-action: manipulation` in global CSS, causing Android WebView to wait ~300ms on every tap for double-tap zoom detection.
3. **Framer Motion** — JS-driven animations in `OnboardingFlow.jsx` instead of GPU-accelerated CSS transitions. Adds ~30KB to the bundle.

---

## What Changes

| Before | After |
|--------|-------|
| `@mui/material` | Tailwind CSS utility classes |
| `@emotion/react` / `@emotion/styled` | Removed entirely |
| `framer-motion` | CSS transitions / keyframes |
| No tap delay fix | `touch-action: manipulation` globally |
| No hardware acceleration config | Enabled in AndroidManifest.xml |
| No code splitting | React.lazy + Suspense per route |

**Unchanged:** Capacitor, Supabase, react-router-dom, `@mui/icons-material`, all business logic, component structure, visual design.

---

## Color System Translation

Existing MUI theme palette maps directly to Tailwind config:

```js
// tailwind.config.js
colors: {
  primary: { DEFAULT: '#FF6B35', light: '#FF8C5A', dark: '#E54E1B' },
  secondary: { DEFAULT: '#FFD166', light: '#FFE09A', dark: '#E6B800' },
  bg: { base: '#0D0D1A', paper: '#16162A' },
  success: '#06D6A0',
  error: '#EF476F',
  info: '#118AB2',
  text: { primary: '#F0F0FA', muted: '#9898B8' },
}
```

Font families (Outfit, Ubuntu) carried over in Tailwind `fontFamily` config.

---

## Implementation Steps

### Step 1 — Immediate wins (no component rewrites)

**`src/index.css`** — add to `* {}` block:
```css
touch-action: manipulation;
-webkit-tap-highlight-color: transparent;
overscroll-behavior: none;
```

**`android/app/src/main/AndroidManifest.xml`** — add to `<application>` tag:
```xml
android:hardwareAccelerated="true"
```

### Step 2 — Install & configure Tailwind

```bash
npm install -D tailwindcss autoprefixer
npx tailwindcss init -p
```

- Configure `tailwind.config.js` with color palette, fonts, content paths
- Add `@tailwind base/components/utilities` to `src/index.css`
- Remove `@mui/material`, `@emotion/react`, `@emotion/styled`, `framer-motion` from `package.json` after migration is complete
- Keep `@mui/icons-material`

### Step 3 — Convert components (in priority order)

Each file: remove MUI imports, replace MUI components with HTML elements + Tailwind classes. No logic changes.

| File | Lines | Notes |
|------|-------|-------|
| [Home.jsx](../../../src/components/Home/Home.jsx) | 1382 | Highest user-facing impact |
| [WakeUpFlow.jsx](../../../src/components/WakeUp/WakeUpFlow.jsx) | 581 | Critical path on wake-up |
| [CreateAlarm.jsx](../../../src/components/Alarm/CreateAlarm.jsx) | 842 | Frequently used |
| [OnboardingFlow.jsx](../../../src/components/Onboarding/OnboardingFlow.jsx) | 1509 | Also removes Framer Motion |
| Auth screens | ~300 | AuthScreen + AuthScreenModern |
| Games | ~3 files | MathGame, MemoryGame, ReactionGame |
| Common components | ScrollDrum, TimePicker | Already custom, minimal MUI |
| App.jsx | — | Theme provider removal + lazy loading |

**MUI → HTML mapping:**
- `Box` → `div`
- `Typography` → `p`, `h1`–`h6`, `span` with Tailwind text classes
- `Button` → `button` with Tailwind classes
- `TextField` → `input` / `textarea` with Tailwind classes
- `Card` / `Paper` → `div` with `bg-paper rounded-2xl`
- `Stack` → `div flex flex-col` or `flex flex-row`
- `IconButton` → `button` with icon child
- `ThemeProvider` / `CssBaseline` → removed entirely

### Step 4 — Code splitting

**`src/App.jsx`** — wrap route components with React.lazy:
```jsx
const Home = React.lazy(() => import('./components/Home/Home'));
const WakeUpFlow = React.lazy(() => import('./components/WakeUp/WakeUpFlow'));
// etc.
```

Wrap router with `<Suspense fallback={<div className="bg-bg-base min-h-screen" />}>`.

**`vite.config.js`** — add manual chunk splitting:
```js
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['react', 'react-dom', 'react-router-dom'],
        supabase: ['@supabase/supabase-js'],
        icons: ['@mui/icons-material'],
      }
    }
  }
}
```

---

## Success Criteria

- Tap response feels immediate (no perceptible delay)
- Page transitions smooth (no jank)
- Initial bundle size reduced (Emotion + MUI removed from main chunk)
- Visual appearance identical to current design
- All existing functionality works

---

## Out of Scope

- Migrating to React Native / Expo
- Changing routing architecture
- Any feature additions or behavior changes
