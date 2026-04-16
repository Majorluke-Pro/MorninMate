# Analytics Page Revamp — Design Spec

**Date:** 2026-04-16
**Status:** Approved, pending implementation plan

## Problem

The current Stats tab in `src/components/Home/Home.jsx` (the `StatsTab()` function starting at line 748) shows raw counters — level, XP, streak, alarms set, routines won/lost — without revealing the rich behavioral data already captured in the `wake_sessions` table.

Users value feeling progress and self-improvement over time. The current page doesn't tell users:
- Whether they're getting better
- Which days of the week they struggle with
- Which games they're best at
- What their long-term trajectory looks like

This spec revamps the Stats tab into a personalized analytics page that surfaces behavioral patterns from existing session data — no new tables needed.

## Goals

1. Users feel they're improving over time (wake-rate trend, deltas vs prior periods).
2. Users see a personalized snapshot of their habits (best day, weakest day, best game).
3. Users get one actionable insight per visit ("headline insight").
4. The page feels like *their* app — not a generic dashboard.

## Non-goals

- Adding new tracked metrics (we work from existing `wake_sessions` columns only).
- Per-game elapsed time ("fastest Math finish") — not currently persisted, dropped from v1.
- Historical comparisons across users / leaderboards.
- Goal-setting UI.

## Design direction

**Training Log** style — data-dense dashboard composition. Charts and numbers are the primary storytelling medium, with one headline insight card softening the experience. MUI icons throughout — no emojis in production UI.

## Page structure (top to bottom)

1. **Range toggle** — sticky segmented control: `7d / 30d / 90d / All`. Default `90d`.
2. **Hero card**
   - Large wake-rate % (success / (success + failed) within range).
   - Trend delta vs previous equivalent window — `TrendingUpIcon` + `+23% vs last month`. `TrendingDownIcon` if negative.
   - Sparkline of rolling wake-rate across the range.
   - Mini month calendar for the current month, one cell per day colored by outcome. Today ringed in gold. Future days dimmed.
3. **Headline insight card** — single rule-picked sentence + MUI icon. Rotates based on current patterns.
4. **Day-of-week bars** — 7 bars, weekday success rate. Top days in orange, weakest in red. Thresholds relative to the user's own distribution.
5. **Games** — 3 tiles (Math / Memory / Reaction). First-crack % with session count below. Strongest tile highlighted with orange glow + `StarIcon`.
6. **Personal records** — compact list: longest streak, earliest wake, hardcore wins, total wakes won.
7. **Level row** — condensed level + XP bar. Demoted from its current hero position (already visible on Home tab).

## Data model

**No schema changes.** All aggregations derive from existing tables.

### Source data

- `wake_sessions` — `started_at`, `status` (`success`/`failed`/`in_progress`), `intensity`, `games` (jsonb), `total_fails`, `results` (jsonb array of `{ game, success, retries }` per game played).
- `alarms` — `days` (for future alarm-vs-session comparisons; not used in v1).
- `profiles` — `level`, `xp`, `streak`, `demerits` (for the Level row only; progression updates handled by existing server-side flow).

### Query

Single query on Stats tab mount and on range change:

```js
supabase
  .from('wake_sessions')
  .select('started_at, status, intensity, games, total_fails, results')
  .eq('user_id', userId)
  .gte('started_at', rangeStartIso) // omitted for 'All'
  .order('started_at', { ascending: false })
```

Indexes already exist (`wake_sessions_user_id_idx`, `wake_sessions_started_at_idx`).

### Client-side aggregations — `src/lib/analytics.js`

Pure functions, no side effects:

- `wakeRate(sessions)` → `success / (success + failed)`
- `wakeRateByDayOfWeek(sessions)` → 7 numeric buckets keyed Mon..Sun, plus sample size per bucket
- `sparklineSeries(sessions, range)` → rolling-window array, ~20 points
- `gameStats(sessions)` → `{ math, memory, reaction }` each with `{ firstCrackPct, avgRetries, count }`
- `monthGrid(sessions, monthDate)` → map of day-of-month → `{ status, dominantGame }`
- `records(sessions)` → `{ longestStreak, earliestWakeHhMm, hardcoreWins, totalWins }`
- `deltaVsPrevious(sessions, range)` → percent change vs prior same-length window
- `pickHeadlineInsight(aggregates)` → `{ icon, title, body, tone }`

### Headline insight rules (priority order)

1. **Best-ever wake rate** — if current-range wake-rate exceeds all prior equivalent windows.
2. **Active streak** — if `user.streak` from AppContext is ≥ 7 (server-tracked, not recomputed).
3. **Weakest day** — if lowest weekday's miss rate is ≥ 30% higher than the weekly average.
4. **Best game** — if one game's first-crack % is ≥ 20 points above the others.
5. **Fallback** — "Keep going — patterns will appear soon" for small-sample users.

Time-zone: all day-of-week and calendar math uses `new Date(started_at).getDay()` (device local TZ), matching how `AppContext.jsx`'s alarm scheduler already interprets weekdays.

## Component structure

New directory `src/components/Stats/`. `Home.jsx`'s inline `StatsTab()` function is removed and replaced with `import StatsTab from '../Stats/StatsTab'`.

```
src/components/Stats/
  StatsTab.jsx              top-level, owns range state + fetched sessions
  RangeToggle.jsx           segmented 7d/30d/90d/All control
  HeroCard.jsx              big stat + delta + sparkline + mini calendar
  Sparkline.jsx             thin SVG line+area chart
  MiniMonthCalendar.jsx     7-col grid, tap-to-drill
  HeadlineInsight.jsx       rule-picked insight card
  DayOfWeekBars.jsx         7 vertical bars, tap-to-drill
  GameTiles.jsx             3 tiles with first-crack %
  RecordsList.jsx           compact records list
  LevelRow.jsx              condensed level + XP bar
  DayDetailDrawer.jsx       bottom sheet for mini-calendar / day-of-week drill-in
```

### Data flow

- `StatsTab` owns `range` state (default `90d`), fetches sessions via Supabase, and passes derived values to child cards via props.
- All child cards are pure presentational — they receive numbers, not the raw sessions array.
- Refetch on range change; no optimistic updates needed (read-only view).

### State ownership

- Session fetch: local to `StatsTab` (not AppContext — this is screen-specific).
- Existing `wakeStats` in `AppContext.jsx` (aggregate counts) stays untouched; it's used on the Home tab and other places. The new rich sessions query is additional, not a replacement.

## Visual / UX details

### Color system (reuses theme)

- Positive / success: `#06D6A0`
- Warning / weak days: `#EF476F`
- Primary brand: `#FF6B35`
- Gold accents (records, best-game badge, today ring): `#FFD166`
- Card background: `rgba(255,255,255,0.035)` with `rgba(255,255,255,0.06)` border

### Icons — MUI only

All iconography via `@mui/icons-material`. No emojis. Reference mapping:

| Purpose | Icon |
|---|---|
| Streak / fire | `LocalFireDepartmentIcon` |
| Records / trophy | `EmojiEventsIcon` |
| Math game | `CalculateIcon` (existing) |
| Memory game | `StyleIcon` (existing) |
| Reaction game | `BoltIcon` (existing) |
| Best game badge | `StarIcon` |
| Targeted insight | `GpsFixedIcon` |
| Weak day / sleep | `BedtimeIcon` |
| Trend up / down | `TrendingUpIcon` / `TrendingDownIcon` |
| Earliest wake | `WbTwilightIcon` |

### Interactions

- **Mini calendar** — tap a day → `DayDetailDrawer` with session details. Chevron buttons to navigate months (swipe is a post-v1 enhancement).
- **Day-of-week bar** — tap → `DayDetailDrawer` listing all sessions from that weekday.
- **Range toggle** — tap segment → refetch + animate numbers.

### Animations

- Cards fade+slide up on mount, 100 ms stagger.
- Bars and sparkline animate from zero on first paint.
- No bouncing — subtle easing only.

## Edge cases

- **No sessions** — hero shows "Set your first alarm to see progress" with a CTA to the Alarms tab; all other cards hidden.
- **Small sample (< 5 in range)** — headline insight falls back to generic copy. Day-of-week bars render with a "Not enough data" chip overlay.
- **Game never played** — game tile shows `—` instead of a percentage.
- **Only successes or only fails in range** — delta computation guards against div-by-zero, displays `—`.
- **Mid-session visit** — `in_progress` sessions are excluded from wake-rate math; they don't count either way.

## Error handling

- Query failure → inline error card with Retry button. Hero never partial-renders.
- Network offline → same retry card. Existing session stays valid (AppContext already handles re-auth).

## Testing

- **Unit tests** for `src/lib/analytics.js`:
  - Fixture-driven — synthetic session arrays covering empty, small-sample, and full-data scenarios.
  - One test per pure function.
  - One test per headline-insight rule firing under its expected condition.
- **No UI test harness** exists in the project; manual QA checklist replaces component tests:
  - Empty state renders correctly.
  - Single-session state doesn't crash aggregations.
  - Full-data state matches expected visual.
  - Each range toggle changes hero + sparkline + calendar window.
  - Drawer opens from mini-calendar and from day-of-week bars.

## Performance

- Single indexed query per range change. A power user accumulates ~1 session/day = ~90 rows for the 90-day window. Client-side aggregation is trivially cheap.
- No memoization or caching needed in v1. If the user toggles the range heavily, we could add a simple in-memory cache keyed by range; not required now.

## Rollout

Not gated — replaces the existing Stats tab in-place. No feature flag, no migration. Users see the new page on next app launch after the update ships.

## Out of scope (future)

- Per-game elapsed time records (requires capturing `elapsedMs` in `results` jsonb on the client).
- Weekly digest notifications ("Your week in MorninMate").
- Comparison with friends / leaderboards.
- Goal setting ("I want to wake by 6:30 AM on Mondays").
- Swipe gestures on the mini calendar.
