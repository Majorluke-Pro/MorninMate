# Stats Page Simplification — Design Spec

**Date:** 2026-04-17
**Status:** Pending user review

## Problem

The Stats tab (`StatsTabRevamp` in `src/components/Home/Home.jsx` starting line 1132) shows too many cards. It currently renders a hero with success %, a 4-tile metric grid, a 7-day recent-form strip, a 2×2 breakdown grid, and a progression card. The density buries the signal.

The user wants a simpler page that tells them three things: how they're progressing, what they're good at, and where they're weak.

## Goals

1. Reduce the page to five sections: Header, Progress, Strengths, Weaknesses, Progression.
2. Every number on the page reads as one of: progress, a strength, or a weakness.
3. No new data sources — derive everything from `wakeStats.sessions` via the existing `buildWakeInsights()`.

## Non-goals

- No range toggle, no sparkline, no calendar.
- No new Supabase queries or schema changes.
- No file extraction out of `Home.jsx` (stays inline).
- Not executing the prior `2026-04-16-analytics-revamp` spec — this supersedes it for the current iteration.

## Page structure (top → bottom)

1. **Header** — unchanged. Gradient, "WAKE PERFORMANCE" eyebrow, title, subtitle.
2. **Progress card** — large success % on the left, level avatar (with existing conic ring) on the right. Single row below with three plain stats: `Current streak` · `Routines won` · `Wins this week`.
3. **Strengths card** — "What's working". Two rows:
   - Best wake day — uses `insights.bestDayIndex` and `insights.bestDayWins`.
   - Most-cleared game mix — uses `insights.favoriteGame` + `GAME_META`.
4. **Weaknesses card** — "What to watch". Two rows:
   - Weakest wake day — NEW: `insights.worstDayIndex` + `insights.worstDayFails`.
   - Avg restarts per routine — uses `insights.averageRetries`.
5. **Progression card** — unchanged. Level bar, `Reach Level N+1`, XP progress.

**Removed** from the current `StatsTabRevamp`:
- The 4-tile `MetricCard` grid (Current run / Best run / Avg restarts / Wins this week).
- The 7-day "Recent Form" W/L strip.
- The 2×2 `Breakdown` grid — its content folds into Strengths and Weaknesses.

## Data model

No schema changes. Single additive change to `buildWakeInsights()` in `Home.jsx`:

- Add a `weekdayFails = Array(7).fill(0)` counter populated from `ordered.filter(s => s.status === 'failed')`, keyed by `new Date(completed_at || started_at).getDay()`.
- Return two new fields:
  - `worstDayIndex` — index of max in `weekdayFails`, or `null` if no fails recorded.
  - `worstDayFails` — `worstDayIndex === null ? 0 : weekdayFails[worstDayIndex]`.

All existing fields stay untouched; the removed sections stop consuming them but the function itself remains backward-compatible.

## Component changes

Edit only `src/components/Home/Home.jsx`:

- Extend `buildWakeInsights` with the two fields above.
- Rewrite the `StatsTabRevamp` return block to render the five sections listed.
- Remove `MetricCard` usages inside `StatsTabRevamp` (keep the `MetricCard` component — it's still used by the legacy `StatsTab` below, which stays as dead code for now).
- Remove the `InsightRow` 2×2 grid. Replace with two smaller cards (`StrengthsCard`, `WeaknessesCard`) each using a tighter row layout — icon + label + value + hint — rendered as two stacked rows, not a grid.
- Keep `HeroStat`, `SectionLabel` helpers.

## Visual / UX

- Reuse existing card styling: `bgcolor: 'rgba(20,20,36,0.95)', border: '1px solid rgba(255,255,255,0.06)', p: 2.5`.
- Strengths card — left-accent border `borderLeft: '3px solid #06D6A0'` (success green).
- Weaknesses card — left-accent border `borderLeft: '3px solid #EF476F'` (warning red).
- Icons stay MUI; no emojis. Reuse `CalendarMonthIcon`, `BedtimeIcon`, `ReplayIcon`, game icons from `GAME_META`.
- Section spacing stays at `gap: 3` inside the outer `Box`.

## Edge cases

- **No sessions** — existing empty-state card ("Finish a few wake-up routines…") still renders in place of Progress/Strengths/Weaknesses. Progression card always renders.
- **No losses yet** — Weaknesses card shows `worstDayIndex === null` fallback: weakest-day row renders `—` with hint "No losses recorded".
- **All wins on one day** — `bestDayIndex` and `worstDayIndex` could share the same index if there's both a win and a loss on the same weekday; this is acceptable and not specially handled.
- **Single game played** — `favoriteGame` still resolves; that's fine.

## Testing

Manual QA only (no test harness exists in the project):
- Empty state renders (no sessions).
- Single-session state doesn't crash.
- Loss-free state: Weaknesses card shows `—` for weakest day.
- Full data: Progress shows correct success %; Strengths names a day + game; Weaknesses names a day + restart average.
- Progression bar animates to correct % on load.

## Rollout

In-place edit to `Home.jsx`. No flag, no migration. Next app launch after build picks it up.

## Out of scope

- The larger `2026-04-16-analytics-revamp` spec (sparkline, range toggle, mini calendar, day-of-week bars, extracted `src/components/Stats/` directory) remains on file but is not executed now.
- File extraction / `Home.jsx` split — deferred.
- Removing the unused legacy `StatsTab()` function — deferred.
