# Stats Page Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce `StatsTabRevamp` in `src/components/Home/Home.jsx` to five simple sections — Header, Progress, Strengths, Weaknesses, Progression — removing the 4-tile metric grid, the 7-day W/L strip, and the 2×2 breakdown grid.

**Architecture:** Edit a single file (`src/components/Home/Home.jsx`). Extend the existing `buildWakeInsights()` pure function with two new fields (`worstDayIndex`, `worstDayFails`), then rewrite the `StatsTabRevamp` return block to render the simplified layout. All data still comes from `wakeStats.sessions` via `buildWakeInsights()` — no new queries, no new files.

**Tech Stack:** React 19, MUI 7 (`@mui/material` + `@mui/icons-material`). No test harness in the project — manual QA only.

---

## File Structure

**Modify:**
- `src/components/Home/Home.jsx` — extend `buildWakeInsights()` (line 1069); rewrite `StatsTabRevamp()` body (line 1152 onward inside `return (...)`)

**No files created, no files deleted.** The legacy `StatsTab` function (line 748) and `MetricCard` helper stay in place as dead code — out of scope to remove.

---

## Task 1: Extend `buildWakeInsights` with weakest-day fields

**Files:**
- Modify: `src/components/Home/Home.jsx` lines ~1069–1130

- [ ] **Step 1: Add `weekdayFails` counter and new return fields**

Open `src/components/Home/Home.jsx`. Locate `function buildWakeInsights(sessions = [])` at line 1069.

Find this block (around line 1096–1115):

```js
  const weekdayWins = Array(7).fill(0);
  const gameCounts = {};
  const intensityCounts = {};

  successSessions.forEach((session) => {
    weekdayWins[new Date(session.completed_at || session.started_at).getDay()] += 1;

    (Array.isArray(session.games) ? session.games : []).forEach((game) => {
      gameCounts[game] = (gameCounts[game] ?? 0) + 1;
    });

    const intensity = session.intensity || 'moderate';
    intensityCounts[intensity] = (intensityCounts[intensity] ?? 0) + 1;
  });

  const favoriteGame = Object.entries(gameCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const favoriteIntensity = Object.entries(intensityCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const bestDayIndex = weekdayWins.some(Boolean)
    ? weekdayWins.reduce((best, wins, index, arr) => wins > arr[best] ? index : best, 0)
    : null;
```

Replace it with:

```js
  const weekdayWins = Array(7).fill(0);
  const weekdayFails = Array(7).fill(0);
  const gameCounts = {};
  const intensityCounts = {};

  successSessions.forEach((session) => {
    weekdayWins[new Date(session.completed_at || session.started_at).getDay()] += 1;

    (Array.isArray(session.games) ? session.games : []).forEach((game) => {
      gameCounts[game] = (gameCounts[game] ?? 0) + 1;
    });

    const intensity = session.intensity || 'moderate';
    intensityCounts[intensity] = (intensityCounts[intensity] ?? 0) + 1;
  });

  ordered.forEach((session) => {
    if (session.status === 'failed') {
      weekdayFails[new Date(session.completed_at || session.started_at).getDay()] += 1;
    }
  });

  const favoriteGame = Object.entries(gameCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const favoriteIntensity = Object.entries(intensityCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const bestDayIndex = weekdayWins.some(Boolean)
    ? weekdayWins.reduce((best, wins, index, arr) => wins > arr[best] ? index : best, 0)
    : null;
  const worstDayIndex = weekdayFails.some(Boolean)
    ? weekdayFails.reduce((worst, fails, index, arr) => fails > arr[worst] ? index : worst, 0)
    : null;
```

- [ ] **Step 2: Add `worstDayIndex` and `worstDayFails` to the returned object**

Find the return block at line 1117–1129:

```js
  return {
    recentSessions,
    totalFails,
    weeklyWins,
    currentRun,
    bestStreak,
    averageRetries: ordered.length ? totalFails / ordered.length : 0,
    favoriteGame,
    favoriteIntensity,
    bestDayIndex,
    bestDayWins: bestDayIndex === null ? 0 : weekdayWins[bestDayIndex],
    lastCompletedAt: ordered[0]?.completed_at || ordered[0]?.started_at || null,
  };
```

Replace with:

```js
  return {
    recentSessions,
    totalFails,
    weeklyWins,
    currentRun,
    bestStreak,
    averageRetries: ordered.length ? totalFails / ordered.length : 0,
    favoriteGame,
    favoriteIntensity,
    bestDayIndex,
    bestDayWins: bestDayIndex === null ? 0 : weekdayWins[bestDayIndex],
    worstDayIndex,
    worstDayFails: worstDayIndex === null ? 0 : weekdayFails[worstDayIndex],
    lastCompletedAt: ordered[0]?.completed_at || ordered[0]?.started_at || null,
  };
```

- [ ] **Step 3: Verify the dev server still compiles**

Run:

```bash
npm run dev
```

Expected: Vite starts without errors. Stop it with `Ctrl+C` once confirmed.

- [ ] **Step 4: Commit**

```bash
git add src/components/Home/Home.jsx
git commit -m "feat(stats): add worstDayIndex/worstDayFails to wake insights"
```

---

## Task 2: Rewrite the `StatsTabRevamp` body — Progress + Strengths + Weaknesses cards

**Files:**
- Modify: `src/components/Home/Home.jsx` — `StatsTabRevamp()` body at line ~1152–1402 (everything between `return (` and the closing `);` of that function)

This task replaces the whole `return` block of `StatsTabRevamp` with the simplified layout. The function signature, hooks (`useApp`, `useMemo`, `useEffect`), and derived values at the top of the function stay unchanged.

- [ ] **Step 1: Locate the body**

Open `src/components/Home/Home.jsx`. Find `function StatsTabRevamp()` at line 1132. Keep everything from `function StatsTabRevamp() {` through the line `}, [session?.user?.id, refreshWakeStats]);` (around line 1150) intact.

Identify the full block starting at line 1152 `return (` and ending at the `);` that closes the function body (around line 1402, before the closing `}` at line 1403).

- [ ] **Step 2: Replace the return block**

Replace the entire `return ( ... );` block with this content:

```jsx
  const WEEKDAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const totalRoutinesWon = wakeStats?.success ?? 0;
  const strongestDayLabel = insights.bestDayIndex === null ? null : WEEKDAY_FULL[insights.bestDayIndex];
  const weakestDayLabel = insights.worstDayIndex === null ? null : WEEKDAY_FULL[insights.worstDayIndex];

  return (
    <Box>
      <Box sx={{
        background: 'linear-gradient(180deg, #16082E 0%, #121629 56%, #0D0D1A 100%)',
        px: 3,
        pt: 5.5,
        pb: 3.5,
        borderBottom: '1px solid rgba(255,107,53,0.08)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <Box sx={{
          position: 'absolute',
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,107,53,0.14) 0%, transparent 70%)',
          top: -110,
          right: -90,
          filter: 'blur(55px)',
          pointerEvents: 'none',
        }} />
        <Box sx={{
          position: 'absolute',
          inset: 'auto auto -40px -80px',
          width: 240,
          height: 240,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,209,102,0.08) 0%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }} />

        <Typography sx={{ color: '#FF6B35', fontWeight: 800, letterSpacing: '0.14em', fontSize: '0.58rem', mb: 0.5 }}>
          WAKE PERFORMANCE
        </Typography>
        <Typography variant="h4" fontWeight={900} sx={{ lineHeight: 1.04, letterSpacing: '-0.8px', maxWidth: 260 }}>
          Your mornings, at a glance
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 290 }}>
          Progress, strengths, and what to watch.
        </Typography>
      </Box>

      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {totalSessions === 0 ? (
          <Card sx={{ p: 2.75, bgcolor: 'rgba(20,20,36,0.95)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Typography sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.6rem', mb: 1 }}>
              NO WAKE HISTORY YET
            </Typography>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5 }}>
              Finish a few wake-up routines to unlock useful trends
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Once sessions start landing, this page will show your success rate, strongest wake day, and where you tend to slip.
            </Typography>
          </Card>
        ) : (
          <>
            {/* Progress card */}
            <Card sx={{ p: 2.5, bgcolor: 'rgba(20,20,36,0.95)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <SectionLabel title="PROGRESS" subtitle={`Last update ${formatSessionDate(insights.lastCompletedAt)}`} />
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mt: 2 }}>
                <Box>
                  <Typography sx={{ color: 'rgba(255,255,255,0.58)', fontWeight: 700, fontSize: '0.68rem', letterSpacing: '0.08em' }}>
                    OVERALL SUCCESS
                  </Typography>
                  <Typography sx={{
                    mt: 0.75,
                    fontFamily: '"Fraunces", serif',
                    fontSize: '3rem',
                    lineHeight: 0.95,
                    color: '#FFF4E8',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {Math.round(successRate)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {totalRoutinesWon} wins from {totalSessions} completed routines
                  </Typography>
                </Box>
                <Box sx={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
                  <Box sx={{
                    position: 'absolute',
                    inset: -4,
                    borderRadius: '50%',
                    background: 'conic-gradient(from 210deg, rgba(255,107,53,0.16), #FF6B35, #FFD166, rgba(255,255,255,0.16))',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      inset: 4,
                      borderRadius: '50%',
                      background: '#120E1C',
                    },
                  }} />
                  <Avatar sx={{
                    position: 'absolute',
                    inset: 0,
                    width: 72,
                    height: 72,
                    background: 'linear-gradient(135deg, #FF6B35 0%, #E54E1B 100%)',
                    fontWeight: 900,
                    fontSize: '1.45rem',
                    fontFamily: '"Fraunces", serif',
                    boxShadow: '0 0 26px rgba(255,107,53,0.24)',
                  }}>
                    {user.level}
                  </Avatar>
                </Box>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1, mt: 2.25 }}>
                <HeroStat label="Current streak" value={user.streak} hint={user.streak === 1 ? 'day' : 'days'} />
                <HeroStat label="Routines won" value={totalRoutinesWon} hint="all-time wins" />
                <HeroStat label="Wins this week" value={insights.weeklyWins} hint="last 7 days" />
              </Box>
            </Card>

            {/* Strengths card */}
            <Card sx={{
              p: 2.5,
              bgcolor: 'rgba(20,20,36,0.95)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderLeft: '3px solid #06D6A0',
            }}>
              <SectionLabel title="STRENGTHS" subtitle="What's working" />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, mt: 2 }}>
                <InsightRowCompact
                  icon={<CalendarMonthIcon sx={{ fontSize: '1.15rem', color: '#06D6A0' }} />}
                  label="Strongest wake day"
                  value={strongestDayLabel || 'No pattern yet'}
                  hint={strongestDayLabel ? `${insights.bestDayWins} successful wake${insights.bestDayWins === 1 ? '' : 's'}` : 'Need more wins to see a pattern'}
                />
                <InsightRowCompact
                  icon={favoriteGameMeta ? <favoriteGameMeta.Icon sx={{ fontSize: '1.15rem', color: favoriteGameMeta.color }} /> : <BoltIcon sx={{ fontSize: '1.15rem', color: '#8B5CF6' }} />}
                  label="Most-cleared game mix"
                  value={favoriteGameMeta?.label || 'Still learning'}
                  hint={favoriteGameMeta ? 'Shows up most in successful routines' : 'Complete more sessions to rank games'}
                />
              </Box>
            </Card>

            {/* Weaknesses card */}
            <Card sx={{
              p: 2.5,
              bgcolor: 'rgba(20,20,36,0.95)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderLeft: '3px solid #EF476F',
            }}>
              <SectionLabel title="WEAKNESSES" subtitle="What to watch" />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, mt: 2 }}>
                <InsightRowCompact
                  icon={<BedtimeIcon sx={{ fontSize: '1.15rem', color: '#EF476F' }} />}
                  label="Weakest wake day"
                  value={weakestDayLabel || '—'}
                  hint={weakestDayLabel ? `${insights.worstDayFails} missed wake${insights.worstDayFails === 1 ? '' : 's'}` : 'No losses recorded'}
                />
                <InsightRowCompact
                  icon={<ReplayIcon sx={{ fontSize: '1.15rem', color: '#8B5CF6' }} />}
                  label="Avg restarts per routine"
                  value={insights.averageRetries.toFixed(1)}
                  hint={insights.averageRetries > 0 ? 'Restart pressure across your sessions' : 'No restarts yet — keep it up'}
                />
              </Box>
            </Card>
          </>
        )}

        {/* Progression card */}
        <Card sx={{ p: 2.5, bgcolor: 'rgba(20,20,36,0.95)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <SectionLabel title="PROGRESSION" subtitle={`${rankLabel} rank · ${user.xp} total XP`} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 2 }}>
            <Box sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              flexShrink: 0,
              bgcolor: 'rgba(255,107,53,0.08)',
              border: '1px dashed rgba(255,107,53,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <EmojiEventsIcon sx={{ fontSize: '1.4rem', color: '#FFD166' }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography fontWeight={800} sx={{ letterSpacing: '-0.2px' }}>
                Reach Level {user.level + 1}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.75 }}>
                <LinearProgress
                  variant="determinate"
                  value={xpPct}
                  sx={{
                    flex: 1,
                    height: 6,
                    borderRadius: 99,
                    bgcolor: 'rgba(255,255,255,0.06)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 99,
                      background: 'linear-gradient(90deg, #FF6B35, #FFD166)',
                    },
                  }}
                />
                <Typography sx={{ color: '#FF6B35', fontWeight: 700, fontSize: '0.62rem', flexShrink: 0 }}>
                  {Math.round(xpPct)}%
                </Typography>
              </Box>
              <Typography sx={{ color: 'text.disabled', fontSize: '0.62rem', mt: 0.75, display: 'block' }}>
                {xpToNext} XP needed to reach the next level
              </Typography>
            </Box>
          </Box>
        </Card>
      </Box>
    </Box>
  );
```

- [ ] **Step 3: Remove the unused `favoriteIntensityMeta` line inside `StatsTabRevamp`**

Since the new return block no longer references `favoriteIntensityMeta`, remove this line near the top of the function (around line 1145):

```js
  const favoriteIntensityMeta = insights.favoriteIntensity ? INTENSITY_META[insights.favoriteIntensity] : null;
```

Leave `favoriteGameMeta` on line 1144 — it's still used.

Leave all other derived values (`xpInLevel`, `xpToNext`, `xpPct`, `activeCount`, `totalSessions`, `successRate`, `rankLabel`) untouched — they're still referenced in the new return block.

Note: `INTENSITY_META` is also referenced by the legacy `StatsTab` (line 1287) and must stay defined at module scope — do not remove it.

- [ ] **Step 4: Add the `BedtimeIcon` import if not already present**

Open the top of `src/components/Home/Home.jsx` and check the import list (lines ~9–33). If `BedtimeIcon` is not already imported, add it alongside the other `@mui/icons-material` imports:

```js
import BedtimeIcon from '@mui/icons-material/Bedtime';
```

All other icons used in the new return block (`CalendarMonthIcon`, `BoltIcon`, `ReplayIcon`, `EmojiEventsIcon`) are already imported.

- [ ] **Step 5: Add the `InsightRowCompact` helper component**

Locate the existing `InsightRow` helper (starts at line 1440) inside `src/components/Home/Home.jsx`. Immediately after the closing `}` of `InsightRow`, add this new component:

```jsx
function InsightRowCompact({ icon, label, value, hint }) {
  return (
    <Box sx={{
      p: 1.5,
      borderRadius: 3,
      bgcolor: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.05)',
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
    }}>
      <Box sx={{
        width: 34,
        height: 34,
        borderRadius: 2.25,
        bgcolor: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        {icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.62rem', color: 'text.disabled' }}>
          {label}
        </Typography>
        <Typography sx={{ fontWeight: 800, letterSpacing: '-0.2px' }}>
          {value}
        </Typography>
        <Typography sx={{ fontSize: '0.62rem', color: 'text.secondary', mt: 0.2 }}>
          {hint}
        </Typography>
      </Box>
    </Box>
  );
}
```

Leave the old `InsightRow` component in place — it's no longer called by `StatsTabRevamp`, but the legacy `StatsTab` at line 750 does not use it either. Out of scope to remove; ESLint will warn if unused, but removing it would need its own task.

*Note: if ESLint flags `InsightRow` as unused in this pass, delete that component only (lines starting with `function InsightRow(` through its closing `}`) — nothing else references it.*

- [ ] **Step 6: Run the dev server and verify compilation**

Run:

```bash
npm run dev
```

Expected: Vite starts without errors. Open the app, navigate to the Stats tab, and confirm:
- Header gradient + "WAKE PERFORMANCE" eyebrow still renders.
- Progress card shows success %, level avatar, and the 3-stat row.
- Strengths card has a green left border and shows two rows.
- Weaknesses card has a red left border and shows two rows.
- Progression card renders at the bottom.
- 4-tile metric grid is gone.
- 7-day Recent Form strip is gone.
- 2×2 Breakdown grid is gone.

Stop the dev server with `Ctrl+C`.

- [ ] **Step 7: Run the linter**

Run:

```bash
npm run lint
```

Expected: passes. If ESLint flags `favoriteIntensityMeta` or any now-unused local, remove the offending line. If it flags `InsightRow` as unused and the rule is set to error, remove the `InsightRow` function block.

- [ ] **Step 8: Commit**

```bash
git add src/components/Home/Home.jsx
git commit -m "feat(stats): simplify to Progress/Strengths/Weaknesses layout"
```

---

## Task 3: Manual QA across data states

**Files:** none (verification only)

- [ ] **Step 1: Verify empty-session state**

Sign in as a user with no `wake_sessions` rows (or delete them in Supabase briefly, or run with a fresh account). Open the Stats tab.

Expected:
- Header renders.
- Empty-state card shows "NO WAKE HISTORY YET".
- No Progress / Strengths / Weaknesses cards render.
- Progression card still renders at the bottom.

- [ ] **Step 2: Verify single-session state**

With one `success` session:
- Progress card: success % = 100, "1 wins from 1 completed routines".
- Current streak = whatever the server has set on `profiles.streak`.
- Routines won = 1, Wins this week = 1.
- Strengths: strongest wake day = the day that session landed on; game = whatever was in the `games` array.
- Weaknesses: weakest wake day = "—" with "No losses recorded"; avg restarts = 0.0 with "No restarts yet — keep it up".

- [ ] **Step 3: Verify mixed-session state**

With a mix of `success` and `failed` sessions across at least two weekdays:
- Success % = round(success / (success + failed) * 100).
- Strongest wake day names the weekday with the most wins.
- Weakest wake day names the weekday with the most failures.
- Avg restarts = sum of `total_fails` / total sessions, to 1 decimal.

- [ ] **Step 4: Verify visual polish**

- Cards align with the same horizontal padding.
- Green left border on Strengths, red left border on Weaknesses.
- No overflow or text clipping on small screens (test at 360 px width in DevTools device mode).
- Icons render (no broken / missing icon boxes).

- [ ] **Step 5: Commit QA sign-off (optional)**

No code change expected. If any defects are found, fix them and commit before closing the task:

```bash
git commit --allow-empty -m "chore(stats): manual QA pass complete"
```

---

## Self-Review Notes

- **Spec coverage:** Header (Task 2 Step 2), Progress card (Task 2 Step 2), Strengths card (Task 2 Step 2), Weaknesses card (Task 2 Step 2 — uses `worstDayIndex` from Task 1), Progression card (Task 2 Step 2, unchanged). Removals of the 4-tile metric grid, the 7-day strip, and the 2×2 breakdown are implicit in the full `return (...)` replacement in Task 2 Step 2. Edge cases from the spec (no sessions, no losses, single game) covered in Task 3.
- **Type consistency:** `worstDayIndex` / `worstDayFails` defined in Task 1 are referenced by the same names in Task 2. `InsightRowCompact` defined in Task 2 Step 5 is referenced in Task 2 Step 2. `WEEKDAY_FULL` is a local constant inside `StatsTabRevamp` — no collision with the existing module-level `DAY_LABELS` (single-letter array).
- **No placeholders.** Every code block is complete.
