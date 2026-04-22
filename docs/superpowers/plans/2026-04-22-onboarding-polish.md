# Onboarding Polish Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish the 10-step onboarding flow with consistent icon cards on the Game step, a celebratory Summary screen, directional slide transitions, and a larger Avatar grid.

**Architecture:** All four changes are self-contained within `OnboardingFlow.jsx`. No new files, no context changes, no data model changes. Each task is an isolated edit to a single component or a shared utility (pageVariants).

**Tech Stack:** React, Framer Motion (via `../../lib/motion-lite`), MUI icons (`@mui/icons-material`), MUI components (via `../../lib/ui-lite`), inline MUI `sx` styling.

---

## Files

- Modify: `src/components/Onboarding/OnboardingFlow.jsx`

No other files are touched.

---

### Task 1: Game Step — Icon Cards

Replace the radio dot with a 32×32 icon box, matching `MorningTypeStep` exactly.

**Files:**
- Modify: `src/components/Onboarding/OnboardingFlow.jsx` — `GameStep` component (lines ~640–683)

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Open http://127.0.0.1:5173 and navigate to the onboarding Game step (step 3) so you can see the change live.

- [ ] **Step 2: Replace the radio dot with an icon box in `GameStep`**

Find the `GameStep` component. The current row renders a radio dot like this:

```jsx
<Box sx={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, bgcolor: selected ? '#FF6B35' : 'transparent', border: `2px solid ${selected ? '#FF6B35' : '#4b5563'}`, transition: 'all 0.15s' }} />
```

Replace that single `<Box>` with this icon box (identical to `MorningTypeStep`):

```jsx
<Box sx={{ width: 32, height: 32, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, bgcolor: selected ? 'rgba(255,107,53,0.15)' : '#1f2937' }}>
  <game.Icon sx={{ fontSize: '1.1rem', color: selected ? '#FF6B35' : '#6b7280' }} />
</Box>
```

The full updated row inside `GAMES.map(...)` should look like this:

```jsx
<Box
  key={game.value}
  onClick={() => onChange(game.value)}
  sx={{
    display: 'flex',
    alignItems: 'center',
    gap: 1.75,
    p: '12px 14px',
    borderRadius: '12px',
    cursor: 'pointer',
    background: selected ? 'rgba(255,107,53,0.06)' : '#111827',
    border: `1px solid ${selected ? '#FF6B35' : '#2d3748'}`,
    transition: 'all 0.15s',
  }}
>
  <Box sx={{ width: 32, height: 32, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, bgcolor: selected ? 'rgba(255,107,53,0.15)' : '#1f2937' }}>
    <game.Icon sx={{ fontSize: '1.1rem', color: selected ? '#FF6B35' : '#6b7280' }} />
  </Box>
  <Box sx={{ flex: 1 }}>
    <Box sx={{ fontWeight: 600, fontSize: '0.9rem', fontFamily: '"Outfit", sans-serif', color: selected ? '#f9fafb' : '#d1d5db' }}>
      {game.label}
    </Box>
    <Box sx={{ fontSize: '0.75rem', color: '#6b7280', fontFamily: '"Outfit", sans-serif' }}>
      {game.desc}
    </Box>
  </Box>
  <Box sx={{ px: 1, py: 0.25, borderRadius: 4, bgcolor: '#1f2937', border: '1px solid #2d3748' }}>
    <Box sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#6b7280', letterSpacing: '0.5px', fontFamily: '"Outfit", sans-serif' }}>
      {game.tag}
    </Box>
  </Box>
</Box>
```

- [ ] **Step 3: Visual check**

In the browser, go to the Game step. Verify:
- Each game option shows a coloured icon box (not a dot)
- Selecting a game highlights the icon in orange and tints the icon box background
- The tag badge (Brain / Visual / Reflex) still appears on the right

- [ ] **Step 4: Commit**

```bash
git add src/components/Onboarding/OnboardingFlow.jsx
git commit -m "fix: game step uses icon cards matching morning type style"
```

---

### Task 2: Directional Slide Transitions

Add a `direction` state and update `pageVariants` so forward navigation slides right-to-left and back navigation slides left-to-right.

**Files:**
- Modify: `src/components/Onboarding/OnboardingFlow.jsx` — `pageVariants`, `pageTransition`, `go()`, `motion.div` (lines ~77–84, ~827–830, ~911–928)

- [ ] **Step 1: Replace `pageVariants` with a direction-aware factory**

Find and replace the current static `pageVariants` object:

```js
// REMOVE this:
const pageVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};
```

Replace with a function:

```js
function makePageVariants(direction) {
  return {
    enter: { x: direction * 40, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: direction * -40, opacity: 0 },
  };
}
```

Also update `pageTransition` to 0.22s:

```js
const pageTransition = { type: 'tween', duration: 0.22, ease: 'easeOut' };
```

- [ ] **Step 2: Add `direction` state inside `OnboardingFlow`**

Inside `OnboardingFlow`, add a `direction` state alongside the existing `animKey`:

```js
const [direction, setDirection] = useState(1);
```

- [ ] **Step 3: Update `go()` to set direction**

Find the `go` function:

```js
function go(delta) {
  setStep((s) => s + delta);
  setAnimKey((k) => k + 1);
}
```

Replace with:

```js
function go(delta) {
  setDirection(delta > 0 ? 1 : -1);
  setStep((s) => s + delta);
  setAnimKey((k) => k + 1);
}
```

- [ ] **Step 4: Pass dynamic variants to `motion.div`**

Find the `motion.div` that uses `pageVariants`:

```jsx
<motion.div
  key={animKey}
  variants={pageVariants}
  initial="enter"
  animate="center"
  exit="exit"
  transition={pageTransition}
  ...
>
```

Change `variants={pageVariants}` to `variants={makePageVariants(direction)}`:

```jsx
<motion.div
  key={animKey}
  variants={makePageVariants(direction)}
  initial="enter"
  animate="center"
  exit="exit"
  transition={pageTransition}
  ...
>
```

- [ ] **Step 5: Visual check**

In the browser:
- Tap Continue — the new step should slide in from the right
- Tap the back arrow — the previous step should slide in from the left
- Ensure no visual glitch on the welcome screen (which has its own `motion.div` with `initial={{ opacity: 0, y: 12 }}` — that is untouched)

- [ ] **Step 6: Commit**

```bash
git add src/components/Onboarding/OnboardingFlow.jsx
git commit -m "feat: directional slide transitions for onboarding steps"
```

---

### Task 3: Summary Screen — Celebratory Hero

Replace the dry 8-row data table with a hero layout: avatar icon, personalised heading, subtitle, and key-choice chips.

**Files:**
- Modify: `src/components/Onboarding/OnboardingFlow.jsx` — `SummaryStep` component (lines ~742–799)

- [ ] **Step 1: Rewrite `SummaryStep`**

Replace the entire `SummaryStep` function with:

```jsx
function SummaryStep({ data }) {
  const morningType = MORNING_TYPES.find((t) => t.value === data.morningRating);
  const game = GAMES.find((g) => g.value === data.favoriteGame);
  const avatar = AVATAR_OPTIONS.find((a) => a.value === data.profileIcon);
  const [h, m] = data.wakeTime.split(':').map(Number);
  const formattedTime = `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;

  const chips = [
    { label: formattedTime },
    { label: game?.label ?? 'No game' },
    { label: data.wakeGoal || morningType?.label || 'No goal' },
  ];

  return (
    <Box>
      <Box sx={{ textAlign: 'center', pt: 1, pb: 2 }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: avatar ? `${avatar.color}18` : 'rgba(255,107,53,0.12)',
            border: `2px solid ${avatar?.color ?? '#FF6B35'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 1.5,
          }}
        >
          {avatar && <avatar.Icon sx={{ fontSize: '1.8rem', color: avatar.color }} />}
        </Box>
        <Box sx={{ fontFamily: '"Fraunces", serif', fontSize: '1.3rem', fontWeight: 700, color: '#f9fafb', mb: 0.5 }}>
          You&apos;re all set, {data.name || 'legend'}!
        </Box>
        <Box sx={{ fontSize: '0.82rem', color: '#6b7280', fontFamily: '"Outfit", sans-serif', mb: 2 }}>
          Your mornings just got an upgrade
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
          {chips.map((chip) => (
            <Box
              key={chip.label}
              sx={{
                px: 1.75,
                py: 0.6,
                borderRadius: 20,
                background: '#111827',
                border: '1px solid #2d3748',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: '#9ca3af',
                fontFamily: '"Outfit", sans-serif',
              }}
            >
              {chip.label}
            </Box>
          ))}
        </Box>
      </Box>
      <Box sx={{ fontSize: '0.85rem', color: '#6b7280', fontFamily: '"Outfit", sans-serif', textAlign: 'center' }}>
        Everything looks good. Create your account below.
      </Box>
    </Box>
  );
}
```

- [ ] **Step 2: Visual check**

Navigate through to the Summary step. Verify:
- The avatar icon is displayed in a coloured circle matching the chosen avatar's colour
- The heading reads "You're all set, [name]!" (or "legend" if name is empty)
- Three chips show: wake time, game name, morning goal (or morning type label if no goal set)
- "Everything looks good. Create your account below." appears below
- The Create My Account button is still visible beneath the card

- [ ] **Step 3: Commit**

```bash
git add src/components/Onboarding/OnboardingFlow.jsx
git commit -m "feat: celebratory summary screen with avatar hero and stat chips"
```

---

### Task 4: Avatar Grid — 3-Column, Larger Icons

Widen the cells to a 3-column grid and increase icon and label sizes.

**Files:**
- Modify: `src/components/Onboarding/OnboardingFlow.jsx` — `AvatarStep` component (lines ~550–587)

- [ ] **Step 1: Update grid and sizes in `AvatarStep`**

Find this line inside `AvatarStep`:

```jsx
<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.5 }}>
```

Change to:

```jsx
<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
```

Then find the avatar circle box:

```jsx
sx={{
  width: 54,
  height: 54,
  ...
}}
```

Change `54` → `66` (both width and height):

```jsx
sx={{
  width: 66,
  height: 66,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: selected ? `${opt.color}18` : '#111827',
  border: `1px solid ${selected ? opt.color : '#2d3748'}`,
  transition: 'all 0.15s',
}}
```

Then find the icon size:

```jsx
<opt.Icon sx={{ fontSize: '1.45rem', color: selected ? opt.color : '#6b7280', transition: 'color 0.15s' }} />
```

Change `1.45rem` → `1.75rem`:

```jsx
<opt.Icon sx={{ fontSize: '1.75rem', color: selected ? opt.color : '#6b7280', transition: 'color 0.15s' }} />
```

Then find the label:

```jsx
sx={{ fontSize: '0.6rem', fontWeight: selected ? 700 : 500, ... }}
```

Change `0.6rem` → `0.72rem`:

```jsx
sx={{ fontSize: '0.72rem', fontWeight: selected ? 700 : 500, fontFamily: '"Outfit", sans-serif', color: selected ? opt.color : '#6b7280', textAlign: 'center', transition: 'color 0.15s' }}
```

- [ ] **Step 2: Visual check**

Navigate to the Avatar step. Verify:
- Icons are arranged in 3 columns (not 4)
- Each circle is noticeably larger
- Labels are readable
- Selected state still highlights correctly with the avatar's colour

- [ ] **Step 3: Commit**

```bash
git add src/components/Onboarding/OnboardingFlow.jsx
git commit -m "feat: avatar grid 3-column layout with larger icons"
```

---

### Task 5: Merge Name + Age + Country into "About You" Step

Collapse three separate steps into one, reducing the flow from 10 steps to 8.

**Files:**
- Modify: `src/components/Onboarding/OnboardingFlow.jsx` — `STEP_IDS`, `AboutYouStep` (new component), `canProceed()`, render block

- [ ] **Step 1: Update `STEP_IDS`**

Find:

```js
const STEP_IDS = ['welcome', 'wakeTime', 'morningType', 'game', 'goal', 'name', 'age', 'country', 'avatar', 'summary'];
```

Replace with:

```js
const STEP_IDS = ['welcome', 'wakeTime', 'morningType', 'game', 'goal', 'aboutYou', 'avatar', 'summary'];
```

- [ ] **Step 2: Add `AboutYouStep` component**

Add this new component after the `GoalStep` function and before `SummaryStep`. It combines the name input, age input, and country preset chips from the three removed steps:

```jsx
function AboutYouStep({ data, onChange }) {
  const [focused, setFocused] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const filteredCountries = COUNTRIES.filter((c) => c.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <Box>
      <StepHeader Icon={PersonIcon} eyebrow="Step 5" title="About you" subtitle="Quick details to personalise the app" />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {/* Name */}
        <Box
          sx={{
            background: '#111827',
            border: `1px solid ${focused === 'name' ? '#FF6B35' : '#2d3748'}`,
            borderRadius: '12px',
            px: 2,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            transition: 'border-color 0.15s',
          }}
        >
          <PersonIcon sx={{ color: focused === 'name' ? '#FF6B35' : '#6b7280', fontSize: '1.1rem', flexShrink: 0, transition: 'color 0.15s' }} />
          <Box
            component="input"
            autoFocus
            autoComplete="off"
            placeholder="Your name..."
            value={data.name}
            maxLength={30}
            onChange={(e) => onChange({ name: e.target.value })}
            onFocus={() => setFocused('name')}
            onBlur={() => setFocused(null)}
            sx={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: '#f9fafb',
              caretColor: '#FF6B35',
              fontSize: '1rem',
              fontWeight: 600,
              fontFamily: '"Outfit", sans-serif',
              '&::placeholder': { color: '#4b5563', fontWeight: 400 },
            }}
          />
        </Box>

        {/* Age */}
        <Box
          sx={{
            background: '#111827',
            border: `1px solid ${focused === 'age' ? '#FF6B35' : '#2d3748'}`,
            borderRadius: '12px',
            px: 2,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            transition: 'border-color 0.15s',
          }}
        >
          <CakeIcon sx={{ color: focused === 'age' ? '#FF6B35' : '#6b7280', fontSize: '1.1rem', flexShrink: 0, transition: 'color 0.15s' }} />
          <Box
            component="input"
            inputMode="numeric"
            placeholder="Your age..."
            value={data.age}
            maxLength={3}
            onChange={(e) => onChange({ age: e.target.value.replace(/\D/g, '').slice(0, 3) })}
            onFocus={() => setFocused('age')}
            onBlur={() => setFocused(null)}
            sx={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: '#f9fafb',
              caretColor: '#FF6B35',
              fontSize: '1rem',
              fontWeight: 600,
              fontFamily: '"Outfit", sans-serif',
              '&::placeholder': { color: '#4b5563', fontWeight: 400 },
            }}
          />
        </Box>

        {/* Country — presets + picker trigger */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          {COUNTRY_PRESETS.map((country) => {
            const selected = data.country === country;
            return (
              <Box
                key={country}
                onClick={() => onChange({ country: selected ? '' : country })}
                sx={{
                  px: 1.5,
                  py: 0.7,
                  borderRadius: 20,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.6,
                  background: selected ? 'rgba(255,107,53,0.08)' : '#111827',
                  border: `1px solid ${selected ? '#FF6B35' : '#2d3748'}`,
                  transition: 'all 0.15s',
                }}
              >
                <PublicIcon sx={{ fontSize: '0.85rem', color: selected ? '#FF6B35' : '#6b7280' }} />
                <Box sx={{ fontSize: '0.78rem', fontWeight: selected ? 700 : 500, fontFamily: '"Outfit", sans-serif', color: selected ? '#FF6B35' : '#9ca3af' }}>
                  {country}
                </Box>
              </Box>
            );
          })}
          <Box
            onClick={() => setPickerOpen(true)}
            sx={{
              px: 1.5,
              py: 0.7,
              borderRadius: 20,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 0.6,
              background: data.country && !COUNTRY_PRESETS.includes(data.country) ? 'rgba(255,107,53,0.08)' : '#111827',
              border: `1px solid ${data.country && !COUNTRY_PRESETS.includes(data.country) ? '#FF6B35' : '#2d3748'}`,
              transition: 'all 0.15s',
            }}
          >
            <SearchIcon sx={{ fontSize: '0.85rem', color: '#6b7280' }} />
            <Box sx={{ fontSize: '0.78rem', fontWeight: 500, fontFamily: '"Outfit", sans-serif', color: '#9ca3af' }}>
              {data.country && !COUNTRY_PRESETS.includes(data.country) ? data.country : 'Other...'}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Full-screen country picker dialog (unchanged from CountryStep) */}
      <Dialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        fullScreen
        PaperProps={{ sx: { background: '#111827' } }}
      >
        <DialogTitle sx={{ p: 0 }}>
          <Box sx={{ px: 2, pt: 'max(env(safe-area-inset-top), 18px)', pb: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton onClick={() => setPickerOpen(false)} sx={{ width: 36, height: 36, bgcolor: '#1f2937', borderRadius: '10px', color: '#9ca3af' }}>
              <ArrowBackIcon sx={{ fontSize: '1rem' }} />
            </IconButton>
            <Box sx={{ fontFamily: '"Fraunces", serif', fontSize: '1.1rem', color: '#f9fafb' }}>Select country</Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: 2, pb: 'max(24px, env(safe-area-inset-bottom))', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Box sx={{ pb: 1.5 }}>
            <Box sx={{ background: '#1E2533', border: '1px solid #2d3748', borderRadius: '12px', px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <SearchIcon sx={{ color: '#6b7280', fontSize: '1.15rem', flexShrink: 0 }} />
              <Box
                component="input"
                autoFocus
                placeholder="Search countries..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                sx={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#f9fafb', caretColor: '#FF6B35', fontSize: '0.98rem', fontFamily: '"Outfit", sans-serif', '&::placeholder': { color: '#4b5563' } }}
              />
            </Box>
          </Box>
          <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', display: 'flex', flexDirection: 'column', gap: 1 }}>
            {filteredCountries.map((country) => {
              const selected = data.country === country;
              return (
                <Box
                  key={country}
                  onClick={() => { onChange({ country }); setPickerOpen(false); setQuery(''); }}
                  sx={{ px: 2, py: 1.45, borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: selected ? 'rgba(255,107,53,0.09)' : '#1E2533', border: `1px solid ${selected ? '#FF6B35' : '#262f40'}`, transition: 'all 0.15s' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                    <PublicIcon sx={{ fontSize: '1rem', color: selected ? '#FF6B35' : '#6b7280' }} />
                    <Box sx={{ color: selected ? '#f9fafb' : '#d1d5db', fontWeight: 600, fontFamily: '"Outfit", sans-serif' }}>{country}</Box>
                  </Box>
                  {selected && <Box sx={{ color: '#FF6B35', fontWeight: 700, fontSize: '0.8rem', fontFamily: '"Outfit", sans-serif' }}>Selected</Box>}
                </Box>
              );
            })}
            {filteredCountries.length === 0 && (
              <Box sx={{ px: 2, py: 2.5, borderRadius: '14px', background: '#1E2533', border: '1px solid #262f40', color: '#6b7280', fontFamily: '"Outfit", sans-serif', textAlign: 'center' }}>
                No countries match that search.
              </Box>
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
```

- [ ] **Step 3: Update `canProceed()` to handle `aboutYou`**

Find the `canProceed` function. Remove the checks for `'name'`, `'age'`, `'country'` and add one for `'aboutYou'`:

```js
function canProceed() {
  if (currentId === 'aboutYou') {
    const age = Number(data.age);
    return data.name.trim().length >= 2 && Number.isInteger(age) && age >= 1 && age <= 120 && data.country.trim().length >= 2;
  }
  if (currentId === 'goal') return data.wakeGoal.trim().length > 0;
  return true;
}
```

- [ ] **Step 4: Update the render block**

Find the section inside the `motion.div` that renders each step by `currentId`. Remove the three individual step renders:

```jsx
{currentId === 'name' && <NameStep value={data.name} onChange={(v) => patch({ name: v })} onSubmit={() => canProceed() && handleButtonClick()} />}
{currentId === 'age' && <AgeStep value={data.age} onChange={(v) => patch({ age: v })} onSubmit={() => canProceed() && handleButtonClick()} />}
{currentId === 'country' && <CountryStep value={data.country} onChange={(v) => patch({ country: v })} />}
```

Replace with:

```jsx
{currentId === 'aboutYou' && <AboutYouStep data={data} onChange={(update) => patch(update)} />}
```

- [ ] **Step 5: Visual check**

Navigate through the onboarding. Verify:
- The flow is 8 steps (welcome + 7 step dots)
- Step 5 shows name, age, and country presets all on one screen
- Continue is disabled until all three fields are filled (valid name ≥ 2 chars, valid age 1–120, country selected)
- Selecting a country preset fills the country field and enables Continue
- "Other..." opens the full-screen country picker and selecting from it also fills the field

- [ ] **Step 6: Delete unused components**

`NameStep`, `AgeStep`, and `CountryStep` are now unused. Delete all three functions from the file.

- [ ] **Step 7: Commit**

```bash
git add src/components/Onboarding/OnboardingFlow.jsx
git commit -m "feat: merge name/age/country into single about you step (10 → 8 steps)"
```

---

## Done

All five changes land in a single file across five commits. No backend changes, no migration needed.
