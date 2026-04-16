# Analytics Page Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the raw-numbers Stats tab in `src/components/Home/Home.jsx` with a personalized analytics dashboard driven by existing `wake_sessions` data — trend hero, headline insight, day-of-week bars, game tiles, records list, and a condensed level row.

**Architecture:** A new `src/components/Stats/` directory holds small presentational components. `StatsTab.jsx` fetches sessions from Supabase once per range change and feeds aggregates (computed by pure functions in `src/lib/analytics.js`) into the children. No database schema changes — all metrics derive from the existing `wake_sessions` columns.

**Tech Stack:** React 19, MUI 7, `@mui/icons-material`, Supabase JS client, Vitest (new) for unit tests on the analytics library. No UI test harness — components verified via manual QA checklist.

---

## File Structure

**Create:**
- `src/lib/analytics.js` — pure aggregation/insight functions
- `src/lib/analytics.fixtures.js` — synthetic session arrays shared by tests
- `src/lib/analytics.test.js` — unit tests for analytics.js
- `vitest.config.js` — Vitest configuration
- `src/components/Stats/StatsTab.jsx` — top-level, owns range state + fetch
- `src/components/Stats/RangeToggle.jsx` — segmented 7d/30d/90d/All control
- `src/components/Stats/HeroCard.jsx` — big stat + delta + sparkline + mini calendar
- `src/components/Stats/Sparkline.jsx` — SVG line+area chart
- `src/components/Stats/MiniMonthCalendar.jsx` — 7-column grid, tap-to-drill
- `src/components/Stats/HeadlineInsight.jsx` — rule-picked insight card
- `src/components/Stats/DayOfWeekBars.jsx` — 7 vertical bars, tap-to-drill
- `src/components/Stats/GameTiles.jsx` — 3 game tiles with first-crack %
- `src/components/Stats/RecordsList.jsx` — compact records list
- `src/components/Stats/LevelRow.jsx` — condensed level + XP bar
- `src/components/Stats/DayDetailDrawer.jsx` — bottom sheet for drill-in

**Modify:**
- `package.json` — add Vitest dev dependency and `test` script
- `.gitignore` — add `.superpowers/` (brainstorm session artifacts)
- `src/components/Home/Home.jsx` — remove inline `StatsTab`/`MetricCard`, import new `StatsTab`, clean up now-unused imports

---

## Task 1: Add Vitest test harness

**Files:**
- Modify: `package.json`
- Create: `vitest.config.js`

- [ ] **Step 1: Install Vitest as a dev dependency**

Run:
```bash
npm install --save-dev vitest@^2.1.0
```

Expected: `package.json` gains `"vitest"` under `devDependencies` and `package-lock.json` updates.

- [ ] **Step 2: Add a `test` script to `package.json`**

Open `package.json`. In the `"scripts"` block, insert `"test": "vitest run"` and `"test:watch": "vitest"` between `"lint"` and `"preview"`:

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "lint": "eslint .",
  "test": "vitest run",
  "test:watch": "vitest",
  "preview": "vite preview",
  ...
}
```

- [ ] **Step 3: Create `vitest.config.js`**

Create `vitest.config.js` at the project root:

```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
});
```

- [ ] **Step 4: Verify the test runner works with a sanity check**

Run:
```bash
npm test
```

Expected: Vitest reports "No test files found" and exits 0. (We'll add tests in Task 2.)

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.js
git commit -m "chore: add Vitest for unit testing"
```

---

## Task 2: Analytics fixtures

**Files:**
- Create: `src/lib/analytics.fixtures.js`

Shared fixtures all analytics tests reuse. A session row mirrors the shape returned by the Supabase select in the spec: `{ started_at, status, intensity, games, total_fails, results }`.

- [ ] **Step 1: Create the fixture file**

Create `src/lib/analytics.fixtures.js`:

```js
// Returns an ISO timestamp for midday on the given local date.
// Using a fixed hour keeps day-of-week math deterministic across local TZs.
function at(dateStr) {
  return new Date(`${dateStr}T09:00:00`).toISOString();
}

export const emptySessions = [];

// One successful Math-only session on a Tuesday (2026-04-14).
export const singleSuccessSession = [
  {
    started_at: at('2026-04-14'),
    status: 'success',
    intensity: 'moderate',
    games: ['math'],
    total_fails: 0,
    results: [{ game: 'math', success: true, retries: 0 }],
  },
];

// A realistic 30-day history: mostly wins, two Monday misses, a 5-day streak,
// one hardcore win, all three games represented.
export const fullHistorySessions = [
  { started_at: at('2026-04-15'), status: 'success', intensity: 'moderate', games: ['math'],     total_fails: 0, results: [{ game: 'math',     success: true, retries: 0 }] },
  { started_at: at('2026-04-14'), status: 'success', intensity: 'moderate', games: ['math'],     total_fails: 0, results: [{ game: 'math',     success: true, retries: 0 }] },
  { started_at: at('2026-04-13'), status: 'failed',  intensity: 'moderate', games: ['math'],     total_fails: 2, results: null },
  { started_at: at('2026-04-12'), status: 'success', intensity: 'gentle',   games: ['memory'],   total_fails: 1, results: [{ game: 'memory',   success: true, retries: 1 }] },
  { started_at: at('2026-04-11'), status: 'success', intensity: 'moderate', games: ['math'],     total_fails: 0, results: [{ game: 'math',     success: true, retries: 0 }] },
  { started_at: at('2026-04-10'), status: 'success', intensity: 'hardcore', games: ['math','memory','reaction'], total_fails: 0, results: [
    { game: 'math', success: true, retries: 0 },
    { game: 'memory', success: true, retries: 0 },
    { game: 'reaction', success: true, retries: 0 },
  ] },
  { started_at: at('2026-04-09'), status: 'success', intensity: 'moderate', games: ['math'],     total_fails: 0, results: [{ game: 'math',     success: true, retries: 0 }] },
  { started_at: at('2026-04-08'), status: 'success', intensity: 'moderate', games: ['reaction'], total_fails: 2, results: [{ game: 'reaction', success: true, retries: 2 }] },
  { started_at: at('2026-04-07'), status: 'success', intensity: 'moderate', games: ['math'],     total_fails: 0, results: [{ game: 'math',     success: true, retries: 0 }] },
  { started_at: at('2026-04-06'), status: 'failed',  intensity: 'moderate', games: ['math'],     total_fails: 3, results: null },
  { started_at: at('2026-04-05'), status: 'success', intensity: 'gentle',   games: ['memory'],   total_fails: 0, results: [{ game: 'memory',   success: true, retries: 0 }] },
  { started_at: at('2026-04-04'), status: 'success', intensity: 'moderate', games: ['math'],     total_fails: 0, results: [{ game: 'math',     success: true, retries: 0 }] },
  { started_at: at('2026-04-03'), status: 'success', intensity: 'moderate', games: ['reaction'], total_fails: 1, results: [{ game: 'reaction', success: true, retries: 1 }] },
  { started_at: at('2026-04-02'), status: 'success', intensity: 'moderate', games: ['math'],     total_fails: 0, results: [{ game: 'math',     success: true, retries: 0 }] },
  { started_at: at('2026-04-01'), status: 'success', intensity: 'moderate', games: ['memory'],   total_fails: 0, results: [{ game: 'memory',   success: true, retries: 0 }] },
];

// Small-sample scenario — 3 sessions total, below the 5-session insight threshold.
export const smallSampleSessions = fullHistorySessions.slice(0, 3);
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/analytics.fixtures.js
git commit -m "test: add analytics fixtures"
```

---

## Task 3: `wakeRate`

**Files:**
- Create: `src/lib/analytics.js`
- Create: `src/lib/analytics.test.js`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/analytics.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { wakeRate } from './analytics.js';
import { emptySessions, singleSuccessSession, fullHistorySessions } from './analytics.fixtures.js';

describe('wakeRate', () => {
  it('returns null for an empty array', () => {
    expect(wakeRate(emptySessions)).toBeNull();
  });

  it('returns 1 when every session succeeded', () => {
    expect(wakeRate(singleSuccessSession)).toBe(1);
  });

  it('ignores in_progress sessions', () => {
    const sessions = [
      { status: 'success' },
      { status: 'in_progress' },
      { status: 'in_progress' },
    ];
    expect(wakeRate(sessions)).toBe(1);
  });

  it('computes rate across success and failed only', () => {
    // fullHistorySessions has 13 success + 2 failed
    expect(wakeRate(fullHistorySessions)).toBeCloseTo(13 / 15, 5);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
npm test
```

Expected: FAIL — "Failed to resolve import './analytics.js'"

- [ ] **Step 3: Implement `wakeRate`**

Create `src/lib/analytics.js`:

```js
export function wakeRate(sessions) {
  let success = 0;
  let failed = 0;
  for (const s of sessions) {
    if (s.status === 'success') success++;
    else if (s.status === 'failed') failed++;
  }
  const total = success + failed;
  if (total === 0) return null;
  return success / total;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
npm test
```

Expected: PASS — 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/analytics.js src/lib/analytics.test.js
git commit -m "feat(analytics): add wakeRate aggregation"
```

---

## Task 4: `wakeRateByDayOfWeek`

**Files:**
- Modify: `src/lib/analytics.js`
- Modify: `src/lib/analytics.test.js`

- [ ] **Step 1: Append the failing tests**

Add to `src/lib/analytics.test.js` (append to end, add import at top):

```js
import { wakeRate, wakeRateByDayOfWeek } from './analytics.js';

// ...existing describe blocks...

describe('wakeRateByDayOfWeek', () => {
  it('returns seven buckets keyed 0..6 (Sunday..Saturday)', () => {
    const result = wakeRateByDayOfWeek(emptySessions);
    expect(Object.keys(result).sort()).toEqual(['0', '1', '2', '3', '4', '5', '6']);
  });

  it('each bucket has { rate: null, count: 0 } when empty', () => {
    const result = wakeRateByDayOfWeek(emptySessions);
    for (let d = 0; d < 7; d++) {
      expect(result[d]).toEqual({ rate: null, count: 0 });
    }
  });

  it('counts sessions on the correct weekday', () => {
    // fullHistorySessions: 2026-04-15 is a Wednesday (day 3)
    const result = wakeRateByDayOfWeek(fullHistorySessions);
    // count across a 15-day run ending Wed 2026-04-15 — 3 Wednesdays, 2 Tuesdays, etc.
    expect(result[3].count).toBeGreaterThan(0);
    expect(result[3].rate).not.toBeNull();
  });

  it('ignores in_progress sessions', () => {
    const sessions = [
      { started_at: new Date('2026-04-15T09:00:00').toISOString(), status: 'in_progress' },
    ];
    const result = wakeRateByDayOfWeek(sessions);
    expect(result[3].count).toBe(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
npm test
```

Expected: FAIL — `wakeRateByDayOfWeek` is not exported.

- [ ] **Step 3: Implement `wakeRateByDayOfWeek`**

Append to `src/lib/analytics.js`:

```js
export function wakeRateByDayOfWeek(sessions) {
  const buckets = {};
  for (let d = 0; d < 7; d++) buckets[d] = { success: 0, failed: 0 };

  for (const s of sessions) {
    if (s.status !== 'success' && s.status !== 'failed') continue;
    const day = new Date(s.started_at).getDay(); // 0=Sun..6=Sat (device local TZ)
    if (s.status === 'success') buckets[day].success++;
    else buckets[day].failed++;
  }

  const result = {};
  for (let d = 0; d < 7; d++) {
    const { success, failed } = buckets[d];
    const count = success + failed;
    result[d] = {
      rate: count === 0 ? null : success / count,
      count,
    };
  }
  return result;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
npm test
```

Expected: PASS — all tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/analytics.js src/lib/analytics.test.js
git commit -m "feat(analytics): add wakeRateByDayOfWeek"
```

---

## Task 5: `gameStats`

**Files:**
- Modify: `src/lib/analytics.js`
- Modify: `src/lib/analytics.test.js`

- [ ] **Step 1: Append the failing tests**

Add to the import line and the test file:

```js
import { wakeRate, wakeRateByDayOfWeek, gameStats } from './analytics.js';

// ...existing describes...

describe('gameStats', () => {
  it('returns all three keys even with no data', () => {
    const result = gameStats(emptySessions);
    expect(result).toEqual({
      math:     { firstCrackPct: null, avgRetries: null, count: 0 },
      memory:   { firstCrackPct: null, avgRetries: null, count: 0 },
      reaction: { firstCrackPct: null, avgRetries: null, count: 0 },
    });
  });

  it('computes first-crack % and avg retries per game', () => {
    const sessions = [
      { status: 'success', results: [{ game: 'math', success: true, retries: 0 }] },
      { status: 'success', results: [{ game: 'math', success: true, retries: 2 }] },
      { status: 'success', results: [{ game: 'memory', success: true, retries: 0 }] },
    ];
    const result = gameStats(sessions);
    expect(result.math.count).toBe(2);
    expect(result.math.firstCrackPct).toBe(0.5); // 1 of 2
    expect(result.math.avgRetries).toBe(1);
    expect(result.memory.count).toBe(1);
    expect(result.memory.firstCrackPct).toBe(1);
    expect(result.reaction.count).toBe(0);
  });

  it('ignores sessions with null results (e.g. failed sessions)', () => {
    const sessions = [
      { status: 'failed', results: null },
      { status: 'success', results: [{ game: 'math', success: true, retries: 0 }] },
    ];
    expect(gameStats(sessions).math.count).toBe(1);
  });

  it('counts each game in a multi-game session', () => {
    const sessions = [{
      status: 'success',
      results: [
        { game: 'math', success: true, retries: 0 },
        { game: 'memory', success: true, retries: 1 },
        { game: 'reaction', success: true, retries: 0 },
      ],
    }];
    const r = gameStats(sessions);
    expect(r.math.count).toBe(1);
    expect(r.memory.count).toBe(1);
    expect(r.reaction.count).toBe(1);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
npm test
```

Expected: FAIL — `gameStats` is not exported.

- [ ] **Step 3: Implement `gameStats`**

Append to `src/lib/analytics.js`:

```js
const GAMES = ['math', 'memory', 'reaction'];

export function gameStats(sessions) {
  const buckets = {};
  for (const g of GAMES) buckets[g] = { firstCrack: 0, retriesSum: 0, count: 0 };

  for (const s of sessions) {
    if (!Array.isArray(s.results)) continue;
    for (const r of s.results) {
      if (!buckets[r.game]) continue;
      buckets[r.game].count++;
      buckets[r.game].retriesSum += r.retries ?? 0;
      if ((r.retries ?? 0) === 0) buckets[r.game].firstCrack++;
    }
  }

  const result = {};
  for (const g of GAMES) {
    const b = buckets[g];
    result[g] = b.count === 0
      ? { firstCrackPct: null, avgRetries: null, count: 0 }
      : { firstCrackPct: b.firstCrack / b.count, avgRetries: b.retriesSum / b.count, count: b.count };
  }
  return result;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/analytics.js src/lib/analytics.test.js
git commit -m "feat(analytics): add gameStats per-game aggregation"
```

---

## Task 6: `records`

**Files:**
- Modify: `src/lib/analytics.js`
- Modify: `src/lib/analytics.test.js`

- [ ] **Step 1: Append the failing tests**

Update the import and append:

```js
import { wakeRate, wakeRateByDayOfWeek, gameStats, records } from './analytics.js';

describe('records', () => {
  it('returns zeros / null for an empty history', () => {
    expect(records(emptySessions)).toEqual({
      longestStreak: 0,
      earliestWakeHhMm: null,
      hardcoreWins: 0,
      totalWins: 0,
    });
  });

  it('counts total wins, hardcore wins, and tracks earliest wake', () => {
    const sessions = [
      { started_at: '2026-04-15T06:15:00Z', status: 'success', intensity: 'hardcore' },
      { started_at: '2026-04-14T07:30:00Z', status: 'success', intensity: 'moderate' },
      { started_at: '2026-04-13T08:00:00Z', status: 'failed',  intensity: 'moderate' },
    ];
    const r = records(sessions);
    expect(r.totalWins).toBe(2);
    expect(r.hardcoreWins).toBe(1);
    // earliest among successes only (06:15 in that session's local TZ). Just assert non-null:
    expect(r.earliestWakeHhMm).toMatch(/^\d{2}:\d{2}$/);
  });

  it('computes longest consecutive-day success streak', () => {
    // Three wins on three consecutive days, then gap, then two wins.
    const sessions = [
      { started_at: '2026-04-15T09:00:00', status: 'success', intensity: 'moderate' },
      { started_at: '2026-04-14T09:00:00', status: 'success', intensity: 'moderate' },
      { started_at: '2026-04-13T09:00:00', status: 'success', intensity: 'moderate' },
      { started_at: '2026-04-10T09:00:00', status: 'success', intensity: 'moderate' },
      { started_at: '2026-04-09T09:00:00', status: 'success', intensity: 'moderate' },
    ];
    expect(records(sessions).longestStreak).toBe(3);
  });

  it('breaks the streak on a failed day', () => {
    const sessions = [
      { started_at: '2026-04-15T09:00:00', status: 'success', intensity: 'moderate' },
      { started_at: '2026-04-14T09:00:00', status: 'failed',  intensity: 'moderate' },
      { started_at: '2026-04-13T09:00:00', status: 'success', intensity: 'moderate' },
    ];
    expect(records(sessions).longestStreak).toBe(1);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
npm test
```

Expected: FAIL — `records` not exported.

- [ ] **Step 3: Implement `records`**

Append to `src/lib/analytics.js`:

```js
function dayKey(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function records(sessions) {
  let totalWins = 0;
  let hardcoreWins = 0;
  let earliestMinutes = null;
  let earliestDisplay = null;

  // Map of dayKey -> status ('success' wins over 'failed' if multiple on same day).
  const dayStatus = new Map();

  for (const s of sessions) {
    if (s.status === 'success') totalWins++;
    if (s.status === 'success' && s.intensity === 'hardcore') hardcoreWins++;

    if (s.status === 'success') {
      const d = new Date(s.started_at);
      const minutes = d.getHours() * 60 + d.getMinutes();
      if (earliestMinutes === null || minutes < earliestMinutes) {
        earliestMinutes = minutes;
        earliestDisplay = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      }
    }

    const key = dayKey(s.started_at);
    if (s.status === 'success') dayStatus.set(key, 'success');
    else if (s.status === 'failed' && !dayStatus.has(key)) dayStatus.set(key, 'failed');
  }

  // Longest streak of consecutive days with status='success'.
  const sortedDays = [...dayStatus.entries()].sort(([a], [b]) => a.localeCompare(b));
  let longest = 0;
  let current = 0;
  let prevTime = null;
  const DAY_MS = 86400000;
  for (const [key, status] of sortedDays) {
    const t = new Date(key).getTime();
    if (status !== 'success') {
      current = 0;
      prevTime = t;
      continue;
    }
    if (prevTime !== null && t - prevTime === DAY_MS) {
      current++;
    } else {
      current = 1;
    }
    if (current > longest) longest = current;
    prevTime = t;
  }

  return {
    longestStreak: longest,
    earliestWakeHhMm: earliestDisplay,
    hardcoreWins,
    totalWins,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/analytics.js src/lib/analytics.test.js
git commit -m "feat(analytics): add records aggregation"
```

---

## Task 7: `sparklineSeries`

**Files:**
- Modify: `src/lib/analytics.js`
- Modify: `src/lib/analytics.test.js`

The sparkline shows rolling wake-rate over the selected range. We bucket sessions into ~20 equal-width time slots and compute a rolling average; this keeps short ranges (7d) and long ranges (All) visually comparable.

- [ ] **Step 1: Append the failing tests**

```js
import { wakeRate, wakeRateByDayOfWeek, gameStats, records, sparklineSeries } from './analytics.js';

describe('sparklineSeries', () => {
  it('returns an empty array for no sessions', () => {
    expect(sparklineSeries([], { days: 30 })).toEqual([]);
  });

  it('returns at most 20 points', () => {
    expect(sparklineSeries(fullHistorySessions, { days: 30 }).length).toBeLessThanOrEqual(20);
  });

  it('returns values between 0 and 1 inclusive', () => {
    const series = sparklineSeries(fullHistorySessions, { days: 30 });
    for (const v of series) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
npm test
```

Expected: FAIL — `sparklineSeries` not exported.

- [ ] **Step 3: Implement `sparklineSeries`**

Append to `src/lib/analytics.js`:

```js
// Bucket sessions into up to 20 equal-width time slots across the range,
// then return the wake-rate per bucket (skipping empty buckets — the UI
// draws a line through the points it gets).
export function sparklineSeries(sessions, { days }) {
  const scored = sessions.filter(s => s.status === 'success' || s.status === 'failed');
  if (scored.length === 0) return [];

  const now = Date.now();
  const rangeMs = days ? days * 86400000 : (now - new Date(scored[scored.length - 1].started_at).getTime());
  if (rangeMs <= 0) return [];

  const buckets = 20;
  const bucketMs = rangeMs / buckets;
  const counts = Array.from({ length: buckets }, () => ({ s: 0, f: 0 }));

  for (const session of scored) {
    const t = new Date(session.started_at).getTime();
    const offset = now - t;
    if (offset < 0 || offset > rangeMs) continue;
    const bucketIdx = buckets - 1 - Math.min(buckets - 1, Math.floor(offset / bucketMs));
    if (session.status === 'success') counts[bucketIdx].s++;
    else counts[bucketIdx].f++;
  }

  const series = [];
  for (const { s, f } of counts) {
    if (s + f === 0) continue;
    series.push(s / (s + f));
  }
  return series;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/analytics.js src/lib/analytics.test.js
git commit -m "feat(analytics): add sparklineSeries"
```

---

## Task 8: `monthGrid`

**Files:**
- Modify: `src/lib/analytics.js`
- Modify: `src/lib/analytics.test.js`

- [ ] **Step 1: Append the failing tests**

```js
import { wakeRate, wakeRateByDayOfWeek, gameStats, records, sparklineSeries, monthGrid } from './analytics.js';

describe('monthGrid', () => {
  it('returns an object keyed by day-of-month (1..31)', () => {
    const grid = monthGrid(fullHistorySessions, new Date('2026-04-15T09:00:00'));
    expect(grid[15]).toBeDefined();
    expect(grid[15].status).toBe('success');
  });

  it('marks failed days as failed', () => {
    const grid = monthGrid(fullHistorySessions, new Date('2026-04-15T09:00:00'));
    expect(grid[13].status).toBe('failed');
  });

  it('success wins over failed on the same day', () => {
    const sessions = [
      { started_at: '2026-04-15T07:00:00', status: 'failed',  games: ['math'],   results: null },
      { started_at: '2026-04-15T08:00:00', status: 'success', games: ['memory'], results: [{ game: 'memory', success: true, retries: 0 }] },
    ];
    const grid = monthGrid(sessions, new Date('2026-04-15T09:00:00'));
    expect(grid[15].status).toBe('success');
  });

  it('skips days with no sessions', () => {
    const grid = monthGrid(fullHistorySessions, new Date('2026-04-15T09:00:00'));
    expect(grid[28]).toBeUndefined();
  });

  it('reports dominantGame from the session results', () => {
    const grid = monthGrid(fullHistorySessions, new Date('2026-04-15T09:00:00'));
    expect(grid[15].dominantGame).toBe('math');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
npm test
```

Expected: FAIL — `monthGrid` not exported.

- [ ] **Step 3: Implement `monthGrid`**

Append to `src/lib/analytics.js`:

```js
export function monthGrid(sessions, monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const grid = {};

  for (const s of sessions) {
    const d = new Date(s.started_at);
    if (d.getFullYear() !== year || d.getMonth() !== month) continue;

    const day = d.getDate();
    const existing = grid[day];
    const status = s.status; // 'success' | 'failed' | 'in_progress'

    // Prefer success > failed > in_progress
    const rank = { success: 3, failed: 2, in_progress: 1 };
    if (!existing || (rank[status] ?? 0) > (rank[existing.status] ?? 0)) {
      const dominantGame = Array.isArray(s.results) && s.results.length > 0
        ? s.results[0].game
        : (Array.isArray(s.games) && s.games.length > 0 ? s.games[0] : null);
      grid[day] = { status, dominantGame };
    }
  }
  return grid;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/analytics.js src/lib/analytics.test.js
git commit -m "feat(analytics): add monthGrid for mini calendar"
```

---

## Task 9: `deltaVsPrevious`

**Files:**
- Modify: `src/lib/analytics.js`
- Modify: `src/lib/analytics.test.js`

Compares wake-rate in the current range to the same-length window immediately preceding it. Callers pass the full sessions array and a `days` value; the function splits internally.

- [ ] **Step 1: Append the failing tests**

```js
import { wakeRate, wakeRateByDayOfWeek, gameStats, records, sparklineSeries, monthGrid, deltaVsPrevious } from './analytics.js';

describe('deltaVsPrevious', () => {
  it('returns null when the previous window has no data', () => {
    const sessions = [
      { started_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), status: 'success' },
    ];
    expect(deltaVsPrevious(sessions, { days: 30 })).toBeNull();
  });

  it('returns null when current window has no data', () => {
    const oldIso = new Date(Date.now() - 1000 * 86400 * 60).toISOString();
    const sessions = [{ started_at: oldIso, status: 'success' }];
    expect(deltaVsPrevious(sessions, { days: 30 })).toBeNull();
  });

  it('returns a positive delta when current beats previous', () => {
    const dayMs = 86400000;
    const now = Date.now();
    // Current window (last 10 days): 2 successes
    // Previous window (10-20 days ago): 1 success + 1 failed
    const sessions = [
      { started_at: new Date(now - 1 * dayMs).toISOString(),  status: 'success' },
      { started_at: new Date(now - 2 * dayMs).toISOString(),  status: 'success' },
      { started_at: new Date(now - 11 * dayMs).toISOString(), status: 'success' },
      { started_at: new Date(now - 12 * dayMs).toISOString(), status: 'failed' },
    ];
    // current rate = 1, previous rate = 0.5 → delta = +0.5
    expect(deltaVsPrevious(sessions, { days: 10 })).toBeCloseTo(0.5, 5);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
npm test
```

Expected: FAIL — `deltaVsPrevious` not exported.

- [ ] **Step 3: Implement `deltaVsPrevious`**

Append to `src/lib/analytics.js`:

```js
export function deltaVsPrevious(sessions, { days }) {
  if (!days) return null;
  const dayMs = 86400000;
  const now = Date.now();
  const curStart = now - days * dayMs;
  const prevStart = now - 2 * days * dayMs;

  const inWindow = (iso, start, end) => {
    const t = new Date(iso).getTime();
    return t >= start && t < end;
  };

  const current = sessions.filter(s => inWindow(s.started_at, curStart, now));
  const previous = sessions.filter(s => inWindow(s.started_at, prevStart, curStart));

  const cur = wakeRate(current);
  const prev = wakeRate(previous);
  if (cur === null || prev === null) return null;
  return cur - prev;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/analytics.js src/lib/analytics.test.js
git commit -m "feat(analytics): add deltaVsPrevious"
```

---

## Task 10: `pickHeadlineInsight`

**Files:**
- Modify: `src/lib/analytics.js`
- Modify: `src/lib/analytics.test.js`

Rule engine that picks one insight from aggregated data. Returns an object the UI card can render directly.

- [ ] **Step 1: Append the failing tests**

```js
import {
  wakeRate, wakeRateByDayOfWeek, gameStats, records,
  sparklineSeries, monthGrid, deltaVsPrevious, pickHeadlineInsight,
} from './analytics.js';

describe('pickHeadlineInsight', () => {
  it('returns fallback for small samples', () => {
    const result = pickHeadlineInsight({ totalSessions: 2, userStreak: 0, dowRates: {}, games: {}, isBestEver: false });
    expect(result.kind).toBe('fallback');
  });

  it('prefers best-ever wake rate when the flag is set', () => {
    const result = pickHeadlineInsight({
      totalSessions: 20,
      userStreak: 3,
      dowRates: {},
      games: {},
      isBestEver: true,
    });
    expect(result.kind).toBe('bestEver');
  });

  it('returns activeStreak when streak ≥ 7 and no bestEver', () => {
    const result = pickHeadlineInsight({
      totalSessions: 20,
      userStreak: 8,
      dowRates: {},
      games: {},
      isBestEver: false,
    });
    expect(result.kind).toBe('activeStreak');
    expect(result.body).toMatch(/8/);
  });

  it('returns weakestDay when a day is ≥30% worse than the weekly avg', () => {
    const dowRates = {
      0: { rate: 0.9, count: 5 }, 1: { rate: 0.3, count: 5 }, 2: { rate: 0.9, count: 5 },
      3: { rate: 0.9, count: 5 }, 4: { rate: 0.9, count: 5 }, 5: { rate: 0.9, count: 5 },
      6: { rate: 0.9, count: 5 },
    };
    const result = pickHeadlineInsight({
      totalSessions: 35, userStreak: 0, dowRates, games: {}, isBestEver: false,
    });
    expect(result.kind).toBe('weakestDay');
    expect(result.body).toMatch(/Monday/);
  });

  it('returns bestGame when one game is ≥20pp above the others', () => {
    const games = {
      math:     { firstCrackPct: 0.9, count: 10 },
      memory:   { firstCrackPct: 0.5, count: 10 },
      reaction: { firstCrackPct: 0.5, count: 10 },
    };
    const result = pickHeadlineInsight({
      totalSessions: 30, userStreak: 0, dowRates: {}, games, isBestEver: false,
    });
    expect(result.kind).toBe('bestGame');
    expect(result.body).toMatch(/Math/i);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
npm test
```

Expected: FAIL — `pickHeadlineInsight` not exported.

- [ ] **Step 3: Implement `pickHeadlineInsight`**

Append to `src/lib/analytics.js`:

```js
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const GAME_LABELS = { math: 'Math Blitz', memory: 'Memory Match', reaction: 'Reaction Rush' };

export function pickHeadlineInsight({ totalSessions, userStreak, dowRates, games, isBestEver }) {
  if (totalSessions < 5) {
    return {
      kind: 'fallback',
      icon: 'GpsFixedIcon',
      title: 'Keep going',
      body: 'Patterns will appear once you have a few more wake-ups logged.',
      tone: 'neutral',
    };
  }

  if (isBestEver) {
    return {
      kind: 'bestEver',
      icon: 'TrendingUpIcon',
      title: "You're on fire",
      body: "Best wake rate you've ever had in this range. Keep it going.",
      tone: 'positive',
    };
  }

  if (userStreak >= 7) {
    return {
      kind: 'activeStreak',
      icon: 'LocalFireDepartmentIcon',
      title: `${userStreak}-day streak live`,
      body: `You've woken on time ${userStreak} days in a row. Don't break the chain.`,
      tone: 'positive',
    };
  }

  // Weakest day: find the day whose rate is furthest below the average, needing at least 30pp gap.
  const populatedDays = Object.entries(dowRates).filter(([, v]) => v.rate !== null && v.count >= 2);
  if (populatedDays.length >= 3) {
    const rates = populatedDays.map(([, v]) => v.rate);
    const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
    let worstDay = null;
    let worstRate = 1;
    for (const [d, v] of populatedDays) {
      if (v.rate < worstRate) { worstRate = v.rate; worstDay = Number(d); }
    }
    if (worstDay !== null && avg - worstRate >= 0.3) {
      return {
        kind: 'weakestDay',
        icon: 'BedtimeIcon',
        title: `${DAY_NAMES[worstDay]}s need work`,
        body: `Your ${DAY_NAMES[worstDay]} wake rate is well below the rest of your week.`,
        tone: 'warning',
      };
    }
  }

  // Best game: find the game whose first-crack % is ≥ 20pp above each of the others.
  const populatedGames = Object.entries(games).filter(([, v]) => v.firstCrackPct !== null && v.count >= 3);
  if (populatedGames.length >= 2) {
    populatedGames.sort((a, b) => b[1].firstCrackPct - a[1].firstCrackPct);
    const [topKey, topVal] = populatedGames[0];
    const others = populatedGames.slice(1);
    const dominates = others.every(([, v]) => topVal.firstCrackPct - v.firstCrackPct >= 0.2);
    if (dominates) {
      return {
        kind: 'bestGame',
        icon: 'StarIcon',
        title: `${GAME_LABELS[topKey]} is your weapon`,
        body: `You're getting this first-crack ${Math.round(topVal.firstCrackPct * 100)}% of the time.`,
        tone: 'positive',
      };
    }
  }

  return {
    kind: 'steady',
    icon: 'GpsFixedIcon',
    title: "You're steady",
    body: 'No sharp patterns this range — just consistent work. Nice.',
    tone: 'neutral',
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:
```bash
npm test
```

Expected: PASS — all 6 describe blocks green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/analytics.js src/lib/analytics.test.js
git commit -m "feat(analytics): add pickHeadlineInsight rule engine"
```

---

## Task 11: `RangeToggle` component

**Files:**
- Create: `src/components/Stats/RangeToggle.jsx`

Segmented 4-button toggle. Stateless — parent owns the `range` value.

- [ ] **Step 1: Create the component**

Create `src/components/Stats/RangeToggle.jsx`:

```jsx
import { Box } from '@mui/material';

const OPTIONS = [
  { value: '7d',  label: '7D'  },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: 'all', label: 'All' },
];

export default function RangeToggle({ value, onChange }) {
  return (
    <Box sx={{
      display: 'flex',
      gap: 0.5,
      p: 0.5,
      borderRadius: 99,
      bgcolor: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.06)',
      width: 'fit-content',
      mx: 'auto',
      mb: 2,
    }}>
      {OPTIONS.map(opt => {
        const selected = opt.value === value;
        return (
          <Box
            key={opt.value}
            onClick={() => onChange(opt.value)}
            sx={{
              px: 2, py: 0.75,
              borderRadius: 99,
              fontSize: '0.7rem',
              fontWeight: 800,
              letterSpacing: '0.05em',
              cursor: 'pointer',
              transition: 'all 0.2s',
              color: selected ? '#fff' : 'rgba(255,255,255,0.5)',
              bgcolor: selected ? '#FF6B35' : 'transparent',
              boxShadow: selected ? '0 2px 8px rgba(255,107,53,0.3)' : 'none',
              '&:hover': { color: selected ? '#fff' : 'rgba(255,255,255,0.8)' },
            }}
          >
            {opt.label}
          </Box>
        );
      })}
    </Box>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Stats/RangeToggle.jsx
git commit -m "feat(stats): add RangeToggle segmented control"
```

---

## Task 12: `Sparkline` component

**Files:**
- Create: `src/components/Stats/Sparkline.jsx`

SVG line+area chart with a gold endpoint dot.

- [ ] **Step 1: Create the component**

Create `src/components/Stats/Sparkline.jsx`:

```jsx
import { Box } from '@mui/material';

export default function Sparkline({ series, height = 42, color = '#FF6B35' }) {
  if (!series || series.length < 2) {
    return <Box sx={{ height, opacity: 0.3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', color: 'text.disabled' }}>Not enough data yet</Box>;
  }

  const width = 300;
  const points = series.map((v, i) => {
    const x = (i / (series.length - 1)) * width;
    const y = height - v * (height - 4) - 2;
    return [x, y];
  });
  const path = points.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const areaPath = `${path} L${width},${height} L0,${height} Z`;
  const gradId = `spark-${color.replace('#', '')}`;
  const last = points[points.length - 1];

  return (
    <Box sx={{ width: '100%', height }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.5" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradId})`} />
        <path d={path} stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={last[0]} cy={last[1]} r="3.5" fill="#FFD166" />
      </svg>
    </Box>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Stats/Sparkline.jsx
git commit -m "feat(stats): add Sparkline chart"
```

---

## Task 13: `MiniMonthCalendar` component

**Files:**
- Create: `src/components/Stats/MiniMonthCalendar.jsx`

Shows the current month as a 7-column grid of day cells. Parent supplies the aggregated `grid` (from `monthGrid`).

- [ ] **Step 1: Create the component**

Create `src/components/Stats/MiniMonthCalendar.jsx`:

```jsx
import { Box, Typography, IconButton } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function MiniMonthCalendar({ monthDate, grid, onDayTap, onPrevMonth, onNextMonth }) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Shift so Monday is column 0 (to match Australian/EU week convention matching existing alarm weekday order).
  const firstCol = (firstOfMonth.getDay() + 6) % 7;

  const cells = [];
  for (let i = 0; i < firstCol; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <IconButton size="small" onClick={onPrevMonth} sx={{ color: 'rgba(255,255,255,0.4)' }}><ChevronLeftIcon fontSize="small" /></IconButton>
        <Typography sx={{ fontFamily: '"Fraunces", serif', fontWeight: 800, fontSize: '0.85rem' }}>
          {MONTHS[month]} {year}
        </Typography>
        <IconButton size="small" onClick={onNextMonth} sx={{ color: 'rgba(255,255,255,0.4)' }}><ChevronRightIcon fontSize="small" /></IconButton>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.4, mb: 0.75 }}>
        {['M','T','W','T','F','S','S'].map((l, i) => (
          <Typography key={i} sx={{ textAlign: 'center', fontSize: '0.5rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>{l}</Typography>
        ))}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
        {cells.map((day, i) => {
          if (day === null) return <Box key={i} sx={{ aspectRatio: '1' }} />;

          const cell = grid[day];
          const isToday = isCurrentMonth && day === today.getDate();
          const isFuture = isCurrentMonth && day > today.getDate();

          let bg = 'rgba(255,255,255,0.03)';
          let borderColor = 'transparent';
          if (cell?.status === 'success') {
            bg = 'rgba(6,214,160,0.22)';
            borderColor = 'rgba(6,214,160,0.5)';
          } else if (cell?.status === 'failed') {
            bg = 'rgba(239,71,111,0.18)';
            borderColor = 'rgba(239,71,111,0.45)';
          }

          return (
            <Box
              key={i}
              onClick={cell ? () => onDayTap?.(day, cell) : undefined}
              sx={{
                aspectRatio: '1',
                borderRadius: '8px',
                bgcolor: bg,
                border: `1px solid ${borderColor}`,
                opacity: isFuture ? 0.3 : 1,
                boxShadow: isToday ? 'inset 0 0 0 1.5px #FFD166' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.55rem', fontWeight: 700,
                color: cell ? '#fff' : 'rgba(255,255,255,0.35)',
                cursor: cell ? 'pointer' : 'default',
                transition: 'transform 0.1s',
                '&:active': { transform: cell ? 'scale(0.92)' : 'none' },
              }}
            >
              {day}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Stats/MiniMonthCalendar.jsx
git commit -m "feat(stats): add MiniMonthCalendar"
```

---

## Task 14: `HeroCard` component

**Files:**
- Create: `src/components/Stats/HeroCard.jsx`

Composes the big stat, delta, sparkline, and mini-calendar into one card.

- [ ] **Step 1: Create the component**

Create `src/components/Stats/HeroCard.jsx`:

```jsx
import { Box, Card, Typography } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import Sparkline from './Sparkline.jsx';
import MiniMonthCalendar from './MiniMonthCalendar.jsx';

const RANGE_LABELS = { '7d': 'last 7 days', '30d': 'last 30 days', '90d': 'last 90 days', 'all': 'all time' };

export default function HeroCard({ wakeRateValue, delta, series, range, monthDate, grid, onDayTap, onPrevMonth, onNextMonth }) {
  const pct = wakeRateValue === null ? '—' : `${Math.round(wakeRateValue * 100)}%`;
  const deltaPct = delta === null ? null : Math.round(delta * 100);
  const deltaPositive = deltaPct !== null && deltaPct > 0;
  const deltaNegative = deltaPct !== null && deltaPct < 0;

  return (
    <Card sx={{ p: 2.5, bgcolor: 'rgba(20,20,36,0.95)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 1.5 }}>
        <Box>
          <Typography sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.58rem', textTransform: 'uppercase' }}>
            Wake Rate · {RANGE_LABELS[range]}
          </Typography>
          <Typography sx={{ fontFamily: '"Fraunces", serif', fontWeight: 900, fontSize: '2.2rem', lineHeight: 1, letterSpacing: '-1px' }}>
            {pct}
          </Typography>
        </Box>
        {deltaPct !== null && (
          <Box sx={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.25 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: deltaPositive ? '#06D6A0' : deltaNegative ? '#EF476F' : 'text.secondary' }}>
              {deltaPositive && <TrendingUpIcon sx={{ fontSize: '0.9rem' }} />}
              {deltaNegative && <TrendingDownIcon sx={{ fontSize: '0.9rem' }} />}
              <Typography sx={{ fontWeight: 800, fontSize: '0.65rem' }}>
                {deltaPositive ? '+' : ''}{deltaPct}%
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '0.5rem', color: 'text.disabled' }}>vs prior period</Typography>
          </Box>
        )}
      </Box>

      <Sparkline series={series} height={48} />

      <Box sx={{ mt: 2 }}>
        <MiniMonthCalendar
          monthDate={monthDate}
          grid={grid}
          onDayTap={onDayTap}
          onPrevMonth={onPrevMonth}
          onNextMonth={onNextMonth}
        />
      </Box>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Stats/HeroCard.jsx
git commit -m "feat(stats): add HeroCard composing sparkline and mini calendar"
```

---

## Task 15: `HeadlineInsight` component

**Files:**
- Create: `src/components/Stats/HeadlineInsight.jsx`

Renders the output of `pickHeadlineInsight`. Uses a lookup map to convert the string `icon` name into an MUI component.

- [ ] **Step 1: Create the component**

Create `src/components/Stats/HeadlineInsight.jsx`:

```jsx
import { Box, Card, Typography } from '@mui/material';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BedtimeIcon from '@mui/icons-material/Bedtime';
import StarIcon from '@mui/icons-material/Star';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';

const ICONS = {
  LocalFireDepartmentIcon, TrendingUpIcon, BedtimeIcon, StarIcon, GpsFixedIcon,
};

const TONE_STYLE = {
  positive: {
    bg: 'linear-gradient(135deg, rgba(255,107,53,0.1), rgba(255,209,102,0.04))',
    border: 'rgba(255,107,53,0.25)',
    iconColor: '#FF6B35',
  },
  warning: {
    bg: 'linear-gradient(135deg, rgba(239,71,111,0.1), rgba(239,71,111,0.03))',
    border: 'rgba(239,71,111,0.25)',
    iconColor: '#EF476F',
  },
  neutral: {
    bg: 'rgba(255,255,255,0.035)',
    border: 'rgba(255,255,255,0.08)',
    iconColor: '#FFD166',
  },
};

export default function HeadlineInsight({ insight }) {
  if (!insight) return null;
  const style = TONE_STYLE[insight.tone] ?? TONE_STYLE.neutral;
  const Icon = ICONS[insight.icon] ?? GpsFixedIcon;

  return (
    <Card sx={{
      p: 1.75,
      background: style.bg,
      border: `1px solid ${style.border}`,
      display: 'flex', alignItems: 'flex-start', gap: 1.5,
    }}>
      <Box sx={{
        width: 38, height: 38, flexShrink: 0, borderRadius: 2,
        bgcolor: 'rgba(0,0,0,0.2)', border: `1px solid ${style.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon sx={{ color: style.iconColor, fontSize: '1.3rem' }} />
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 800, fontSize: '0.8rem', letterSpacing: '-0.2px', mb: 0.25 }}>
          {insight.title}
        </Typography>
        <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>
          {insight.body}
        </Typography>
      </Box>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Stats/HeadlineInsight.jsx
git commit -m "feat(stats): add HeadlineInsight card"
```

---

## Task 16: `DayOfWeekBars` component

**Files:**
- Create: `src/components/Stats/DayOfWeekBars.jsx`

7 vertical bars. Bars belonging to the top-3 days use orange, bottom-2 use red, the middle ones use neutral. Tap to drill in.

- [ ] **Step 1: Create the component**

Create `src/components/Stats/DayOfWeekBars.jsx`:

```jsx
import { Box, Card, Typography, Chip } from '@mui/material';

// Display order: Monday → Sunday (weekday index mapping below shifts Sunday).
const DAY_LABELS = ['M','T','W','T','F','S','S'];
const DAY_INDEX_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon..Sun mapped to JS getDay()

export default function DayOfWeekBars({ dowRates, onDayTap }) {
  const ordered = DAY_INDEX_ORDER.map(dayIdx => ({ dayIdx, ...(dowRates[dayIdx] ?? { rate: null, count: 0 }) }));
  const withData = ordered.filter(d => d.rate !== null);
  const hasEnough = withData.length >= 3;

  // Rank by rate for coloring. Top 3 orange, bottom 2 red, middle neutral.
  const sorted = [...withData].sort((a, b) => b.rate - a.rate);
  const topIdx = new Set(sorted.slice(0, 3).map(d => d.dayIdx));
  const bottomIdx = new Set(sorted.slice(-2).map(d => d.dayIdx));

  return (
    <Card sx={{ p: 2, bgcolor: 'rgba(20,20,36,0.95)', border: '1px solid rgba(255,255,255,0.06)', position: 'relative' }}>
      <Typography sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.58rem', textTransform: 'uppercase', mb: 1.5 }}>
        Day of week
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.75, height: 80, position: 'relative' }}>
        {ordered.map(({ dayIdx, rate, count }, i) => {
          const heightPct = rate === null ? 0 : Math.max(10, rate * 100);
          let gradient = 'linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.05))';
          if (topIdx.has(dayIdx))    gradient = 'linear-gradient(180deg, #FF6B35, rgba(255,107,53,0.25))';
          if (bottomIdx.has(dayIdx)) gradient = 'linear-gradient(180deg, #EF476F, rgba(239,71,111,0.25))';

          return (
            <Box
              key={i}
              onClick={count > 0 ? () => onDayTap?.(dayIdx) : undefined}
              sx={{
                flex: 1, height: '100%',
                display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                cursor: count > 0 ? 'pointer' : 'default',
              }}
            >
              <Box sx={{
                width: '100%',
                height: `${heightPct}%`,
                background: gradient,
                borderRadius: '4px 4px 0 0',
                transition: 'all 0.3s ease-out',
              }} />
            </Box>
          );
        })}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 0.75 }}>
        {DAY_LABELS.map((l, i) => (
          <Typography key={i} sx={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>{l}</Typography>
        ))}
      </Box>

      {!hasEnough && (
        <Box sx={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          bgcolor: 'rgba(13,13,26,0.75)', borderRadius: 'inherit',
        }}>
          <Chip label="Not enough data yet" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.06)', color: 'text.secondary', fontWeight: 700, fontSize: '0.65rem' }} />
        </Box>
      )}
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Stats/DayOfWeekBars.jsx
git commit -m "feat(stats): add DayOfWeekBars"
```

---

## Task 17: `GameTiles` component

**Files:**
- Create: `src/components/Stats/GameTiles.jsx`

3 tiles for Math / Memory / Reaction. Winner is highlighted.

- [ ] **Step 1: Create the component**

Create `src/components/Stats/GameTiles.jsx`:

```jsx
import { Box, Card, Typography } from '@mui/material';
import CalculateIcon from '@mui/icons-material/Calculate';
import StyleIcon from '@mui/icons-material/Style';
import BoltIcon from '@mui/icons-material/Bolt';
import StarIcon from '@mui/icons-material/Star';

const GAMES = [
  { key: 'math',     label: 'Math',     Icon: CalculateIcon, color: '#FF6B35' },
  { key: 'memory',   label: 'Memory',   Icon: StyleIcon,     color: '#FFD166' },
  { key: 'reaction', label: 'Reaction', Icon: BoltIcon,      color: '#06D6A0' },
];

export default function GameTiles({ stats }) {
  const winnerKey = (() => {
    const candidates = Object.entries(stats).filter(([, v]) => v.firstCrackPct !== null && v.count >= 3);
    if (candidates.length < 2) return null;
    candidates.sort((a, b) => b[1].firstCrackPct - a[1].firstCrackPct);
    const [top, second] = candidates;
    return top[1].firstCrackPct - second[1].firstCrackPct >= 0.1 ? top[0] : null;
  })();

  return (
    <Box>
      <Typography sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.58rem', textTransform: 'uppercase', mb: 1, px: 0.5 }}>
        Games
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1 }}>
        {GAMES.map(({ key, label, Icon, color }) => {
          const s = stats[key];
          const pctLabel = s.firstCrackPct === null ? '—' : `${Math.round(s.firstCrackPct * 100)}%`;
          const isWinner = key === winnerKey;
          return (
            <Card key={key} sx={{
              p: 1.25, textAlign: 'center',
              bgcolor: isWinner ? `${color}14` : 'rgba(20,20,36,0.95)',
              border: `1px solid ${isWinner ? `${color}55` : 'rgba(255,255,255,0.06)'}`,
              boxShadow: isWinner ? `0 0 16px ${color}22` : 'none',
              position: 'relative',
            }}>
              {isWinner && (
                <StarIcon sx={{ position: 'absolute', top: 6, right: 6, fontSize: '0.85rem', color: '#FFD166' }} />
              )}
              <Icon sx={{ fontSize: '1.4rem', color, mb: 0.5 }} />
              <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, mb: 0.5 }}>{label}</Typography>
              <Typography sx={{ fontFamily: '"Fraunces", serif', fontWeight: 900, fontSize: '0.95rem', color }}>
                {pctLabel}
              </Typography>
              <Typography sx={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', textTransform: 'uppercase', mt: 0.25 }}>
                {s.count === 0 ? 'Not played' : `${s.count} played · 1st try`}
              </Typography>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Stats/GameTiles.jsx
git commit -m "feat(stats): add GameTiles"
```

---

## Task 18: `RecordsList` component

**Files:**
- Create: `src/components/Stats/RecordsList.jsx`

- [ ] **Step 1: Create the component**

Create `src/components/Stats/RecordsList.jsx`:

```jsx
import { Box, Card, Typography } from '@mui/material';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import WbTwilightIcon from '@mui/icons-material/WbTwilight';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TaskAltIcon from '@mui/icons-material/TaskAlt';

function Row({ Icon, label, value, isLast }) {
  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      py: 0.75,
      borderBottom: isLast ? 'none' : '1px dashed rgba(255,255,255,0.06)',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Icon sx={{ fontSize: '1rem', color: 'rgba(255,255,255,0.55)' }} />
        <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.85)' }}>{label}</Typography>
      </Box>
      <Typography sx={{ fontFamily: '"Fraunces", serif', fontWeight: 900, fontSize: '0.85rem', color: '#FF6B35' }}>
        {value}
      </Typography>
    </Box>
  );
}

export default function RecordsList({ records }) {
  return (
    <Card sx={{ p: 2, bgcolor: 'rgba(20,20,36,0.95)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <Typography sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.58rem', textTransform: 'uppercase', mb: 1 }}>
        Personal Records
      </Typography>
      <Row Icon={LocalFireDepartmentIcon} label="Longest streak"  value={`${records.longestStreak} ${records.longestStreak === 1 ? 'day' : 'days'}`} />
      <Row Icon={WbTwilightIcon}          label="Earliest wake"   value={records.earliestWakeHhMm ?? '—'} />
      <Row Icon={EmojiEventsIcon}         label="Hardcore wins"   value={records.hardcoreWins} />
      <Row Icon={TaskAltIcon}             label="Total wakes won" value={records.totalWins} isLast />
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Stats/RecordsList.jsx
git commit -m "feat(stats): add RecordsList"
```

---

## Task 19: `LevelRow` component

**Files:**
- Create: `src/components/Stats/LevelRow.jsx`

Condensed version of the current level card — one row, not a full hero.

- [ ] **Step 1: Create the component**

Create `src/components/Stats/LevelRow.jsx`:

```jsx
import { Box, Card, Typography, LinearProgress, Avatar } from '@mui/material';

const RANK_LABELS = { 1: 'Newcomer', 2: 'Riser', 3: 'Consistent', 4: 'Dedicated', 5: 'Champion', 6: 'Legend' };

export default function LevelRow({ level, xp, xpPerLevel }) {
  const xpInLevel = xp % xpPerLevel;
  const xpPct = (xpInLevel / xpPerLevel) * 100;
  const rank = RANK_LABELS[Math.min(level, 6)] || 'Legend';

  return (
    <Card sx={{ p: 1.75, bgcolor: 'rgba(20,20,36,0.95)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{
          width: 40, height: 40, flexShrink: 0,
          background: 'linear-gradient(135deg, #FF6B35 0%, #E54E1B 100%)',
          fontFamily: '"Fraunces", serif', fontWeight: 900, fontSize: '1rem',
        }}>
          {level}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography sx={{ fontWeight: 800, fontSize: '0.72rem' }}>{rank} — Lv {level}</Typography>
            <Typography sx={{ fontWeight: 800, color: '#FF6B35', fontSize: '0.6rem', fontVariantNumeric: 'tabular-nums' }}>
              {xpInLevel}/{xpPerLevel} XP
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={xpPct}
            sx={{
              height: 5, borderRadius: 99,
              bgcolor: 'rgba(255,255,255,0.06)',
              '& .MuiLinearProgress-bar': { borderRadius: 99, background: 'linear-gradient(90deg, #FF6B35, #FFD166)' },
            }}
          />
        </Box>
      </Box>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Stats/LevelRow.jsx
git commit -m "feat(stats): add condensed LevelRow"
```

---

## Task 20: `DayDetailDrawer` component

**Files:**
- Create: `src/components/Stats/DayDetailDrawer.jsx`

Bottom-sheet drawer used by both the mini calendar (single day) and day-of-week bars (weekday filter). Accepts a `sessions` array that's already been filtered by the parent.

- [ ] **Step 1: Create the component**

Create `src/components/Stats/DayDetailDrawer.jsx`:

```jsx
import { Box, Drawer, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import CalculateIcon from '@mui/icons-material/Calculate';
import StyleIcon from '@mui/icons-material/Style';
import BoltIcon from '@mui/icons-material/Bolt';

const GAME_META = {
  math:     { label: 'Math Blitz',    Icon: CalculateIcon, color: '#FF6B35' },
  memory:   { label: 'Memory Match',  Icon: StyleIcon,     color: '#FFD166' },
  reaction: { label: 'Reaction Rush', Icon: BoltIcon,      color: '#06D6A0' },
};

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}
function formatTime(iso) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

export default function DayDetailDrawer({ open, onClose, title, sessions }) {
  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          bgcolor: '#14142A',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          border: '1px solid rgba(255,255,255,0.08)',
          maxHeight: '70vh',
        },
      }}
    >
      <Box sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Typography sx={{ fontFamily: '"Fraunces", serif', fontWeight: 900, fontSize: '1rem' }}>
            {title}
          </Typography>
          <IconButton size="small" onClick={onClose} sx={{ color: 'rgba(255,255,255,0.5)' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {sessions.length === 0 && (
          <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem', textAlign: 'center', py: 3 }}>
            No sessions logged.
          </Typography>
        )}

        {sessions.map((s, i) => {
          const StatusIcon = s.status === 'success' ? CheckCircleIcon : CancelIcon;
          const statusColor = s.status === 'success' ? '#06D6A0' : '#EF476F';
          return (
            <Box key={i} sx={{
              p: 1.5, mb: 1,
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.035)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <StatusIcon sx={{ fontSize: '0.95rem', color: statusColor }} />
                  <Typography sx={{ fontWeight: 800, fontSize: '0.72rem' }}>
                    {formatDate(s.started_at)}
                  </Typography>
                  <Typography sx={{ fontSize: '0.62rem', color: 'text.secondary' }}>
                    · {formatTime(s.started_at)}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: '0.55rem', color: 'text.disabled', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
                  {s.intensity}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {(s.games ?? []).map((g, gi) => {
                  const meta = GAME_META[g];
                  if (!meta) return null;
                  const result = (s.results ?? []).find(r => r.game === g);
                  return (
                    <Box key={gi} sx={{
                      display: 'flex', alignItems: 'center', gap: 0.5,
                      px: 1, py: 0.25, borderRadius: 99,
                      bgcolor: `${meta.color}14`,
                      border: `1px solid ${meta.color}30`,
                    }}>
                      <meta.Icon sx={{ fontSize: '0.75rem', color: meta.color }} />
                      <Typography sx={{ fontSize: '0.55rem', fontWeight: 700 }}>
                        {meta.label}
                        {result && result.retries > 0 ? ` · ${result.retries} retries` : ''}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Drawer>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Stats/DayDetailDrawer.jsx
git commit -m "feat(stats): add DayDetailDrawer bottom sheet"
```

---

## Task 21: `StatsTab` top-level component

**Files:**
- Create: `src/components/Stats/StatsTab.jsx`

Owns the range state, fetches sessions, derives aggregates, and assembles all the cards. Also handles empty / loading / error states.

- [ ] **Step 1: Create the component**

Create `src/components/Stats/StatsTab.jsx`:

```jsx
import { useState, useEffect, useMemo } from 'react';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import { supabase } from '../../lib/supabase.js';
import { useApp } from '../../context/AppContext.jsx';
import {
  wakeRate, wakeRateByDayOfWeek, gameStats, records,
  sparklineSeries, monthGrid, deltaVsPrevious, pickHeadlineInsight,
} from '../../lib/analytics.js';

import RangeToggle from './RangeToggle.jsx';
import HeroCard from './HeroCard.jsx';
import HeadlineInsight from './HeadlineInsight.jsx';
import DayOfWeekBars from './DayOfWeekBars.jsx';
import GameTiles from './GameTiles.jsx';
import RecordsList from './RecordsList.jsx';
import LevelRow from './LevelRow.jsx';
import DayDetailDrawer from './DayDetailDrawer.jsx';

const RANGE_DAYS = { '7d': 7, '30d': 30, '90d': 90, 'all': null };
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function StatsTab() {
  const { session, user, XP_PER_LEVEL } = useApp();
  const [range, setRange] = useState('90d');
  const [sessions, setSessions] = useState(null); // null = not loaded, [] = empty
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [drawer, setDrawer] = useState(null); // { title, sessions }

  async function fetchSessions() {
    if (!session?.user?.id) return;
    setLoading(true);
    setError(null);

    let query = supabase
      .from('wake_sessions')
      .select('started_at, status, intensity, games, total_fails, results')
      .eq('user_id', session.user.id)
      .order('started_at', { ascending: false });

    const days = RANGE_DAYS[range];
    if (days) {
      const since = new Date(Date.now() - days * 86400000).toISOString();
      query = query.gte('started_at', since);
    }

    const { data, error: fetchErr } = await query;
    if (fetchErr) {
      setError(fetchErr.message);
      setLoading(false);
      return;
    }
    setSessions(data ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchSessions(); }, [session?.user?.id, range]);

  const aggregates = useMemo(() => {
    if (!sessions) return null;
    const days = RANGE_DAYS[range];
    const rate = wakeRate(sessions);
    const dow = wakeRateByDayOfWeek(sessions);
    const gs = gameStats(sessions);
    const rec = records(sessions);
    const spark = sparklineSeries(sessions, { days: days ?? 90 });
    const grid = monthGrid(sessions, monthDate);
    const delta = days ? deltaVsPrevious(sessions, { days }) : null;
    const totalSessions = sessions.filter(s => s.status === 'success' || s.status === 'failed').length;
    const insight = pickHeadlineInsight({
      totalSessions,
      userStreak: user?.streak ?? 0,
      dowRates: dow,
      games: gs,
      isBestEver: false, // (best-ever computation requires comparing all historical windows — deferred)
    });
    return { rate, dow, gs, rec, spark, grid, delta, insight, totalSessions };
  }, [sessions, range, monthDate, user?.streak]);

  // Error state
  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error" fontWeight={700} sx={{ mb: 1 }}>Could not load stats</Typography>
        <Typography color="text.secondary" sx={{ mb: 2, fontSize: '0.75rem' }}>{error}</Typography>
        <Button variant="outlined" startIcon={<ReplayIcon />} onClick={fetchSessions}>Retry</Button>
      </Box>
    );
  }

  // Loading state
  if (loading && !sessions) {
    return (
      <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: '#FF6B35' }} />
      </Box>
    );
  }

  // Empty state
  if (aggregates && aggregates.totalSessions === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography sx={{ fontFamily: '"Fraunces", serif', fontWeight: 900, fontSize: '1.3rem', mb: 1 }}>
          No wake-up data yet
        </Typography>
        <Typography sx={{ color: 'text.secondary', mb: 3, fontSize: '0.85rem' }}>
          Set your first alarm and complete a wake-up routine to start seeing your progress.
        </Typography>
        <RangeToggle value={range} onChange={setRange} />
      </Box>
    );
  }

  // Day-tap handlers
  function handleCalendarDayTap(day, _cell) {
    const match = sessions.filter(s => {
      const d = new Date(s.started_at);
      return d.getFullYear() === monthDate.getFullYear()
        && d.getMonth() === monthDate.getMonth()
        && d.getDate() === day;
    });
    const monthLabel = monthDate.toLocaleDateString(undefined, { month: 'long' });
    setDrawer({ title: `${monthLabel} ${day}`, sessions: match });
  }

  function handleWeekdayTap(dayIdx) {
    const match = sessions.filter(s => new Date(s.started_at).getDay() === dayIdx);
    setDrawer({ title: `${DAY_NAMES[dayIdx]}s`, sessions: match });
  }

  return (
    <Box sx={{ pt: 4, pb: 4 }}>
      <Box sx={{ px: 2 }}>
        <RangeToggle value={range} onChange={setRange} />
      </Box>

      <Box sx={{ px: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <HeroCard
          wakeRateValue={aggregates.rate}
          delta={aggregates.delta}
          series={aggregates.spark}
          range={range}
          monthDate={monthDate}
          grid={aggregates.grid}
          onDayTap={handleCalendarDayTap}
          onPrevMonth={() => setMonthDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
          onNextMonth={() => setMonthDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
        />

        <HeadlineInsight insight={aggregates.insight} />

        <DayOfWeekBars dowRates={aggregates.dow} onDayTap={handleWeekdayTap} />

        <GameTiles stats={aggregates.gs} />

        <RecordsList records={aggregates.rec} />

        <LevelRow level={user.level} xp={user.xp} xpPerLevel={XP_PER_LEVEL} />
      </Box>

      <DayDetailDrawer
        open={!!drawer}
        onClose={() => setDrawer(null)}
        title={drawer?.title ?? ''}
        sessions={drawer?.sessions ?? []}
      />
    </Box>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Stats/StatsTab.jsx
git commit -m "feat(stats): add StatsTab composition and data fetching"
```

---

## Task 22: Swap new `StatsTab` into `Home.jsx`

**Files:**
- Modify: `src/components/Home/Home.jsx`

Remove the old inline `StatsTab()` function (lines ~748–998) and the now-unused `MetricCard()` helper (lines ~1000+). Import the new component.

- [ ] **Step 1: Add the import to `Home.jsx`**

Near the other relative imports at the top of `src/components/Home/Home.jsx`, add:

```jsx
import StatsTab from '../Stats/StatsTab';
```

- [ ] **Step 2: Remove the inline `StatsTab` function**

In `src/components/Home/Home.jsx`, delete the entire block starting with the comment:

```jsx
// ─── Stats Tab ────────────────────────────────────────────────────────────────

function StatsTab() {
  // ...
}
```

…through the end of that function (the closing `}` right before `function MetricCard`).

- [ ] **Step 3: Remove the now-unused `MetricCard` helper**

Delete the entire `function MetricCard(...) { ... }` block that follows (only used by the old StatsTab).

- [ ] **Step 4: Remove imports that are only used by the old StatsTab / MetricCard**

Open `src/components/Home/Home.jsx`. Scan the import block for icons now only referenced by the removed code and delete those lines. Likely candidates (verify each with a quick search before deleting):

- `TaskAltIcon`
- `NotificationsActiveIcon`
- `CheckCircleOutlineIcon`

Use:
```bash
grep -n "TaskAltIcon\|NotificationsActiveIcon\|CheckCircleOutlineIcon" src/components/Home/Home.jsx
```

Remove the import for any name whose only reference was inside the now-deleted StatsTab / MetricCard.

- [ ] **Step 5: Verify the app builds**

Run:
```bash
npm run build
```

Expected: Build completes without errors. `dist/` is produced.

- [ ] **Step 6: Verify lint passes**

Run:
```bash
npm run lint
```

Expected: 0 errors. (Fix any "unused import" warnings by removing the stragglers.)

- [ ] **Step 7: Commit**

```bash
git add src/components/Home/Home.jsx
git commit -m "feat(stats): replace inline StatsTab with modular Stats components"
```

---

## Task 23: Update `.gitignore`

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Add brainstorm session artifacts**

Append to `.gitignore`:

```
# Superpowers brainstorm session artifacts
.superpowers/
```

- [ ] **Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: ignore superpowers brainstorm artifacts"
```

---

## Task 24: Manual QA pass

**Files:** none

- [ ] **Step 1: Run the dev server**

Run:
```bash
npm run dev
```

Open the URL Vite prints. Sign in if needed.

- [ ] **Step 2: Run through the QA checklist**

For each item, verify the behavior and note any issues:

1. Tap the Stats tab — the new page renders.
2. Range toggle: tap each of `7D / 30D / 90D / All`. Hero wake-rate %, sparkline, and delta update each time.
3. Sparkline shows the "Not enough data yet" caption when fewer than 2 data points are available in the range.
4. Mini calendar: correct month label; today ringed in gold; future days dimmed; tapping a day with data opens the drawer; tapping an empty day does nothing.
5. Mini calendar chevrons: go back and forward months; the grid re-renders.
6. Headline insight card renders one of: best-ever / streak / weakest-day / best-game / steady / fallback depending on your data.
7. Day-of-week bars: top 3 days are orange, bottom 2 are red. Tapping a populated bar opens the drawer. Bars show a "Not enough data yet" overlay when fewer than 3 weekdays have data.
8. Game tiles: three tiles render; if one game is ≥10 pp ahead, it gets a star icon and glow. Games never played show `—` with "Not played" caption.
9. Records list: values match intuition (streak, earliest wake time, hardcore wins, total wins).
10. Level row: rank label, level, XP bar render correctly.
11. Drawer close button works. Drawer shows "No sessions logged." for empty tap targets.
12. With a fresh account (no sessions): Stats tab shows the "No wake-up data yet" empty state with the range toggle still visible.
13. Turn Wi-Fi off and hard-reload the Stats tab: the retry error card appears. Turn Wi-Fi back on and tap Retry: page recovers.

- [ ] **Step 3: Record results in the commit message if any are failing**

If everything passes, no commit needed. If follow-up fixes are required, open new tasks or fix inline and commit with a message referencing the failed item.

---

## Self-review notes

Spec coverage verified against `docs/superpowers/specs/2026-04-16-analytics-revamp-design.md`:

- Page structure (range toggle, hero, insight, dow bars, games, records, level) → Tasks 11–21 ✓
- Data model: single query, no schema changes → Task 21 ✓
- Aggregations (wakeRate, dow, gameStats, records, sparkline, monthGrid, delta, insight) → Tasks 3–10 ✓
- Headline insight rules (best-ever, active streak, weakest day, best game, fallback) → Task 10 ✓ (note: `isBestEver` is passed as `false` in Task 21 with a deferred TODO — this matches the spec's allowance that long-range best-ever comparison across windows is a v1 simplification; the rule itself is implemented and unit-tested so enabling it later is a one-line change in `StatsTab.jsx`)
- MUI icons only → Tasks 14, 15, 17, 18, 20 all use icon components, no emoji characters
- Empty / error / small-sample / game-never-played edge cases → Task 21 handles empty + error; child components render `—` / "Not enough data" chips
- Time zone uses device local `new Date(started_at).getDay()` → Tasks 4, 6, 8 ✓
- Tests for analytics.js functions → Tasks 3–10 all include failing-test-first flow ✓
- Manual QA checklist → Task 24 ✓
