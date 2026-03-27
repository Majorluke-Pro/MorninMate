import { useState } from 'react';
import { Box, Typography, Button, TextField, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CheckIcon from '@mui/icons-material/Check';
import { useApp } from '../../context/AppContext';

// ─── Static data ──────────────────────────────────────────────────────────────

const MORNING_TYPES = [
  { value: 1, emoji: '🦇', label: 'Night Owl',      desc: 'Mornings are your nemesis' },
  { value: 2, emoji: '😴', label: 'Slow Starter',   desc: 'Need a few coffees to function' },
  { value: 3, emoji: '😐', label: 'In Between',     desc: 'Neither early nor late' },
  { value: 4, emoji: '🌅', label: 'Early Bird',     desc: 'You enjoy the quiet morning' },
  { value: 5, emoji: '⚡', label: 'Morning Person', desc: 'Up at 5am, annoyingly alive' },
];

const GAMES = [
  { value: 'math',     emoji: '🧮', label: 'Math Blitz',    desc: 'Solve quick arithmetic to dismiss',  tag: 'Brain',  color: '#FF6B35' },
  { value: 'memory',   emoji: '🃏', label: 'Memory Match',  desc: 'Flip and match emoji pairs',         tag: 'Visual', color: '#FFD166' },
  { value: 'reaction', emoji: '⚡', label: 'Reaction Rush', desc: 'Tap right on cue — no cheating',    tag: 'Reflex', color: '#06D6A0' },
];

const GOAL_PRESETS = [
  { emoji: '💪', label: 'Gym session' },
  { emoji: '📚', label: 'Study time' },
  { emoji: '🧘', label: 'Meditate' },
  { emoji: '☕', label: 'Slow morning' },
  { emoji: '🏃', label: 'Morning run' },
  { emoji: '✍️', label: 'Journaling' },
];

// welcome + 5 data steps + summary
const STEP_IDS = ['welcome', 'name', 'wakeTime', 'morningType', 'game', 'goal', 'summary'];
const DATA_STEP_IDS = ['name', 'wakeTime', 'morningType', 'game', 'goal'];

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function OnboardingFlow() {
  const { completeOnboarding } = useApp();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [animKey, setAnimKey] = useState(0);
  const [data, setData] = useState({
    name: '',
    wakeTime: '07:00',
    morningRating: 3,
    favoriteGame: 'math',
    wakeGoal: '',
  });

  const currentId = STEP_IDS[step];

  function go(delta) {
    setDirection(delta);
    setAnimKey(k => k + 1);
    setStep(s => s + delta);
  }

  function handleNext() {
    if (currentId === 'summary') {
      completeOnboarding(data);
    } else {
      go(1);
    }
  }

  function canProceed() {
    if (currentId === 'name') return data.name.trim().length >= 2;
    if (currentId === 'goal') return data.wakeGoal.trim().length > 0;
    return true;
  }

  function patch(updates) {
    setData(d => ({ ...d, ...updates }));
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <Background />

      <Box sx={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <Box sx={{ px: 3, pt: 5, pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {step > 0 ? (
            <IconButton
              onClick={() => go(-1)}
              size="small"
              sx={{
                color: 'rgba(255,255,255,0.5)',
                bgcolor: 'rgba(255,255,255,0.06)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.11)' },
              }}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          ) : (
            <Box sx={{ width: 36 }} />
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <WbSunnyIcon sx={{ color: 'primary.main', fontSize: 15 }} />
            <Typography variant="caption" fontWeight={800} color="primary.main" letterSpacing={1.5}>
              MORNINMATE
            </Typography>
          </Box>

          <Box sx={{ width: 36 }} />
        </Box>

        {/* Step dots — only visible during data steps */}
        <Box sx={{ height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75 }}>
          {DATA_STEP_IDS.map(id => {
            const idx = STEP_IDS.indexOf(id);
            const isActive = idx === step;
            const isDone = idx < step;
            return (
              <Box
                key={id}
                sx={{
                  width: isActive ? 22 : 7,
                  height: 7,
                  borderRadius: 4,
                  bgcolor: isActive
                    ? 'primary.main'
                    : isDone
                    ? 'rgba(255,107,53,0.45)'
                    : 'rgba(255,255,255,0.12)',
                  transition: 'all 0.38s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  opacity: ['welcome', 'summary'].includes(currentId) ? 0 : 1,
                }}
              />
            );
          })}
        </Box>

        {/* Animated step content */}
        <Box
          key={animKey}
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: currentId === 'welcome' ? 'center' : 'flex-start',
            px: 3,
            pt: currentId === 'welcome' ? 0 : 3,
            pb: 2,
            overflowY: 'auto',
            '@keyframes slideFromRight': {
              from: { opacity: 0, transform: 'translateX(52px)' },
              to:   { opacity: 1, transform: 'translateX(0)' },
            },
            '@keyframes slideFromLeft': {
              from: { opacity: 0, transform: 'translateX(-52px)' },
              to:   { opacity: 1, transform: 'translateX(0)' },
            },
            animation: `${direction >= 0 ? 'slideFromRight' : 'slideFromLeft'} 0.38s cubic-bezier(0.16, 1, 0.3, 1)`,
          }}
        >
          {currentId === 'welcome'    && <WelcomeStep />}
          {currentId === 'name'       && <NameStep value={data.name} onChange={v => patch({ name: v })} onSubmit={() => canProceed() && handleNext()} />}
          {currentId === 'wakeTime'   && <WakeTimeStep value={data.wakeTime} onChange={v => patch({ wakeTime: v })} />}
          {currentId === 'morningType'&& <MorningTypeStep value={data.morningRating} onChange={v => patch({ morningRating: v })} />}
          {currentId === 'game'       && <GameStep value={data.favoriteGame} onChange={v => patch({ favoriteGame: v })} />}
          {currentId === 'goal'       && <GoalStep value={data.wakeGoal} onChange={v => patch({ wakeGoal: v })} />}
          {currentId === 'summary'    && <SummaryStep data={data} />}
        </Box>

        {/* CTA */}
        <Box sx={{ px: 3, pb: 5, pt: 1 }}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleNext}
            disabled={!canProceed()}
            sx={{
              py: 1.75,
              fontWeight: 700,
              borderRadius: 3,
              fontSize: '1rem',
              background: canProceed() ? 'linear-gradient(135deg, #FF6B35 0%, #FF8C5A 100%)' : undefined,
              boxShadow: canProceed() ? '0 8px 32px rgba(255,107,53,0.3)' : 'none',
              transition: 'all 0.25s',
            }}
          >
            {currentId === 'welcome' && 'Get Started →'}
            {currentId === 'summary' && 'Begin My Journey 🚀'}
            {!['welcome', 'summary'].includes(currentId) && 'Continue →'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

// ─── Background ───────────────────────────────────────────────────────────────

function Background() {
  return (
    <Box sx={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #08081A 0%, #14082A 55%, #0D0D1A 100%)' }} />

      <Box sx={{
        position: 'absolute', width: 480, height: 480, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,107,53,0.13) 0%, transparent 70%)',
        top: -140, right: -140, filter: 'blur(60px)',
        '@keyframes orb1': {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '33%':     { transform: 'translate(-28px,22px) scale(1.04)' },
          '66%':     { transform: 'translate(18px,-18px) scale(0.97)' },
        },
        animation: 'orb1 14s ease-in-out infinite',
      }} />

      <Box sx={{
        position: 'absolute', width: 380, height: 380, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(120,40,220,0.1) 0%, transparent 70%)',
        bottom: -60, left: -120, filter: 'blur(60px)',
        '@keyframes orb2': {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '50%':     { transform: 'translate(38px,-28px) scale(1.07)' },
        },
        animation: 'orb2 17s ease-in-out infinite',
      }} />

      <Box sx={{
        position: 'absolute', width: 260, height: 260, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,209,102,0.07) 0%, transparent 70%)',
        bottom: '22%', right: '8%', filter: 'blur(40px)',
        '@keyframes orb3': {
          '0%,100%': { transform: 'translate(0,0)' },
          '50%':     { transform: 'translate(-18px,28px)' },
        },
        animation: 'orb3 11s ease-in-out infinite',
      }} />
    </Box>
  );
}

// ─── Welcome step ─────────────────────────────────────────────────────────────

function WelcomeStep() {
  return (
    <Box sx={{ textAlign: 'center', px: 1 }}>
      <Box sx={{
        display: 'inline-block', mb: 4,
        '@keyframes sunGlow': {
          '0%,100%': { filter: 'drop-shadow(0 0 18px rgba(255,107,53,0.35))' },
          '50%':     { filter: 'drop-shadow(0 0 48px rgba(255,107,53,0.75))' },
        },
        animation: 'sunGlow 3s ease-in-out infinite',
      }}>
        <WbSunnyIcon sx={{ fontSize: 88, color: 'primary.main' }} />
      </Box>

      <Typography variant="h2" fontWeight={900} letterSpacing="-1px" sx={{
        mb: 1,
        '@keyframes wFadeUp': { from: { opacity: 0, transform: 'translateY(22px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        animation: 'wFadeUp 0.65s cubic-bezier(0.16,1,0.3,1) 0.1s both',
      }}>
        MorninMate
      </Typography>

      <Typography variant="h5" fontWeight={700} color="primary.main" sx={{
        mb: 2,
        animation: 'wFadeUp 0.65s cubic-bezier(0.16,1,0.3,1) 0.25s both',
      }}>
        Turn your alarm into a ritual.
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{
        maxWidth: 290, mx: 'auto', lineHeight: 1.7,
        animation: 'wFadeUp 0.65s cubic-bezier(0.16,1,0.3,1) 0.4s both',
      }}>
        Earn XP, build streaks, and actually wake up — one game at a time.
      </Typography>

      <Box sx={{
        display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap', mt: 4,
        animation: 'wFadeUp 0.65s cubic-bezier(0.16,1,0.3,1) 0.55s both',
      }}>
        {['🎮 Mini-games', '⭐ XP & Levels', '🔥 Streaks'].map(label => (
          <Box key={label} sx={{
            px: 2, py: 0.75, borderRadius: 10,
            bgcolor: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            typography: 'caption', fontWeight: 600, color: 'text.secondary',
          }}>
            {label}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// ─── Name step ────────────────────────────────────────────────────────────────

function NameStep({ value, onChange, onSubmit }) {
  return (
    <Box>
      <StepHeader emoji="👋" title="First things first —" subtitle="What should we call you?" />
      <Box sx={{ mt: 5 }}>
        <TextField
          fullWidth
          placeholder="Your name"
          value={value}
          onChange={e => onChange(e.target.value)}
          autoFocus
          autoComplete="off"
          inputProps={{ maxLength: 30 }}
          onKeyDown={e => e.key === 'Enter' && onSubmit()}
          variant="standard"
          sx={{
            '& .MuiInput-input': { fontSize: '2rem', fontWeight: 700, textAlign: 'center', py: 1 },
            '& .MuiInput-underline:before': { borderBottomColor: 'rgba(255,255,255,0.1)' },
            '& .MuiInput-underline:after':  { borderBottomColor: '#FF6B35' },
          }}
        />
        {value.trim().length >= 2 && (
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{
            mt: 2,
            '@keyframes nameFadeIn': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
            animation: 'nameFadeIn 0.3s ease',
          }}>
            Nice to meet you,{' '}
            <Box component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>{value.trim()}</Box> 👋
          </Typography>
        )}
      </Box>
    </Box>
  );
}

// ─── Wake time step ───────────────────────────────────────────────────────────

function WakeTimeStep({ value, onChange }) {
  const [h, m] = value.split(':').map(Number);
  const isPM = h >= 12;
  const hour12 = h % 12 || 12;

  function setHour(newH12) {
    const h24 = isPM ? (newH12 % 12) + 12 : newH12 % 12;
    onChange(`${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }

  function setMin(newM) {
    onChange(`${String(h).padStart(2, '0')}:${String(newM).padStart(2, '0')}`);
  }

  function togglePeriod() {
    const newH = isPM ? h - 12 : h + 12;
    onChange(`${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }

  const ctx =
    h >= 0  && h < 4  ? { label: 'Deep night 🌙',         color: '#8B5CF6' } :
    h >= 4  && h < 6  ? { label: 'Before dawn 💪',        color: '#EF476F' } :
    h >= 6  && h < 8  ? { label: 'Early riser 🌅',        color: '#FF6B35' } :
    h >= 8  && h < 10 ? { label: 'Morning sweet spot ☀️', color: '#FFD166' } :
    h >= 10 && h < 12 ? { label: 'Late morning 🌤️',       color: '#06D6A0' } :
    h >= 12 && h < 14 ? { label: 'Midday 🌞',             color: '#FFD166' } :
    h >= 14 && h < 17 ? { label: 'Afternoon ⛅',           color: '#FF8C5A' } :
    h >= 17 && h < 20 ? { label: 'Evening 🌆',            color: '#FF6B35' } :
    h >= 20 && h < 22 ? { label: 'Night 🌙',              color: '#8B5CF6' } :
                        { label: 'Late night 🦉',          color: '#A0A0B8' };

  return (
    <Box>
      <StepHeader emoji="⏰" title="When do you want to wake up?" subtitle="Set your default alarm time." />

      <Box sx={{ mt: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <TimeDrum
          display={String(hour12).padStart(2, '0')}
          onUp={()   => setHour(hour12 === 12 ? 1  : hour12 + 1)}
          onDown={()  => setHour(hour12 === 1  ? 12 : hour12 - 1)}
        />

        <Typography variant="h3" fontWeight={900} color="primary.main" sx={{ mb: 2, userSelect: 'none' }}>
          :
        </Typography>

        <TimeDrum
          display={String(m).padStart(2, '0')}
          onUp={()   => setMin(m >= 55 ? 0  : m + 5)}
          onDown={()  => setMin(m <= 0  ? 55 : m - 5)}
        />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
          {['AM', 'PM'].map(period => {
            const active = (period === 'PM') === isPM;
            return (
              <Box
                key={period}
                onClick={() => !active && togglePeriod()}
                sx={{
                  px: 1.75, py: 0.75, borderRadius: 2, userSelect: 'none',
                  cursor: active ? 'default' : 'pointer',
                  bgcolor: active ? 'primary.main' : 'rgba(255,255,255,0.07)',
                  fontWeight: 700, fontSize: '0.8rem',
                  transition: 'all 0.2s',
                  '&:hover': { bgcolor: active ? 'primary.dark' : 'rgba(255,255,255,0.13)' },
                }}
              >
                {period}
              </Box>
            );
          })}
        </Box>
      </Box>

      <Typography variant="body2" fontWeight={600} textAlign="center"
        sx={{ color: ctx.color, transition: 'color 0.3s', mt: 1 }}>
        {ctx.label}
      </Typography>
    </Box>
  );
}

function TimeDrum({ display, onUp, onDown }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
      <IconButton onClick={onUp} sx={{ color: 'primary.main', bgcolor: 'rgba(255,107,53,0.08)', '&:hover': { bgcolor: 'rgba(255,107,53,0.16)' } }}>
        <KeyboardArrowUpIcon />
      </IconButton>
      <Box sx={{
        width: 76, height: 76, borderRadius: 3,
        bgcolor: 'rgba(255,107,53,0.07)',
        border: '1px solid rgba(255,107,53,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Typography variant="h4" fontWeight={800} sx={{ fontVariantNumeric: 'tabular-nums' }}>
          {display}
        </Typography>
      </Box>
      <IconButton onClick={onDown} sx={{ color: 'primary.main', bgcolor: 'rgba(255,107,53,0.08)', '&:hover': { bgcolor: 'rgba(255,107,53,0.16)' } }}>
        <KeyboardArrowDownIcon />
      </IconButton>
    </Box>
  );
}

// ─── Morning type step ────────────────────────────────────────────────────────

function MorningTypeStep({ value, onChange }) {
  return (
    <Box>
      <StepHeader emoji="🧠" title="What kind of morning person are you?" subtitle="Be honest — this shapes your experience." />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 4 }}>
        {MORNING_TYPES.map((type, i) => {
          const selected = value === type.value;
          return (
            <Box
              key={type.value}
              onClick={() => onChange(type.value)}
              sx={{
                p: 2, borderRadius: 3, cursor: 'pointer',
                border: selected ? '1.5px solid rgba(255,107,53,0.55)' : '1.5px solid rgba(255,255,255,0.07)',
                bgcolor: selected ? 'rgba(255,107,53,0.08)' : 'rgba(255,255,255,0.03)',
                display: 'flex', alignItems: 'center', gap: 2,
                transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
                transform: selected ? 'scale(1.02)' : 'scale(1)',
                '@keyframes rowIn': {
                  from: { opacity: 0, transform: 'translateX(-18px)' },
                  to:   { opacity: 1, transform: 'translateX(0)' },
                },
                animation: `rowIn 0.4s ease ${i * 0.07}s both`,
              }}
            >
              <Typography sx={{ fontSize: '1.6rem', lineHeight: 1 }}>{type.emoji}</Typography>
              <Box sx={{ flex: 1 }}>
                <Typography fontWeight={700} variant="body1">{type.label}</Typography>
                <Typography variant="caption" color="text.secondary">{type.desc}</Typography>
              </Box>
              <Box sx={{
                width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                border: selected ? '2px solid #FF6B35' : '2px solid rgba(255,255,255,0.15)',
                bgcolor: selected ? '#FF6B35' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}>
                {selected && <CheckIcon sx={{ fontSize: 11, color: '#fff' }} />}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

// ─── Game step ────────────────────────────────────────────────────────────────

function GameStep({ value, onChange }) {
  return (
    <Box>
      <StepHeader emoji="🎮" title="Pick your wake-up game" subtitle="This is how you'll prove you're actually awake." />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 4 }}>
        {GAMES.map((game, i) => {
          const selected = value === game.value;
          return (
            <Box
              key={game.value}
              onClick={() => onChange(game.value)}
              sx={{
                p: 2.5, borderRadius: 3, cursor: 'pointer',
                border: selected ? `1.5px solid ${game.color}55` : '1.5px solid rgba(255,255,255,0.07)',
                bgcolor: selected ? `${game.color}0D` : 'rgba(255,255,255,0.03)',
                display: 'flex', alignItems: 'center', gap: 2.5,
                transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
                transform: selected ? 'scale(1.02)' : 'scale(1)',
                '@keyframes gameIn': {
                  from: { opacity: 0, transform: 'translateY(14px)' },
                  to:   { opacity: 1, transform: 'translateY(0)' },
                },
                animation: `gameIn 0.4s ease ${i * 0.1}s both`,
              }}
            >
              <Box sx={{
                width: 54, height: 54, borderRadius: 3, flexShrink: 0,
                bgcolor: `${game.color}18`, border: `1px solid ${game.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.6rem',
              }}>
                {game.emoji}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                  <Typography fontWeight={700}>{game.label}</Typography>
                  <Box sx={{
                    px: 1, py: 0.1, borderRadius: 1,
                    bgcolor: `${game.color}20`, color: game.color,
                    fontSize: '0.6rem', fontWeight: 700, letterSpacing: 0.5,
                  }}>
                    {game.tag}
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary">{game.desc}</Typography>
              </Box>
              <Box sx={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                border: selected ? `2px solid ${game.color}` : '2px solid rgba(255,255,255,0.15)',
                bgcolor: selected ? game.color : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}>
                {selected && <CheckIcon sx={{ fontSize: 12, color: '#fff' }} />}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

// ─── Goal step ────────────────────────────────────────────────────────────────

function GoalStep({ value, onChange }) {
  return (
    <Box>
      <StepHeader
        emoji="🎯"
        title="What's your morning goal?"
        subtitle="What gets you out of bed? It shows on your home screen."
      />

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25, mt: 4, mb: 3 }}>
        {GOAL_PRESETS.map(preset => {
          const selected = value === preset.label;
          return (
            <Box
              key={preset.label}
              onClick={() => onChange(selected ? '' : preset.label)}
              sx={{
                px: 2, py: 1, borderRadius: 10, cursor: 'pointer', userSelect: 'none',
                border: selected ? '1.5px solid rgba(255,107,53,0.55)' : '1.5px solid rgba(255,255,255,0.1)',
                bgcolor: selected ? 'rgba(255,107,53,0.1)' : 'rgba(255,255,255,0.04)',
                display: 'flex', alignItems: 'center', gap: 0.75,
                transition: 'all 0.2s',
              }}
            >
              <Typography sx={{ fontSize: '1rem' }}>{preset.emoji}</Typography>
              <Typography variant="body2" fontWeight={selected ? 700 : 500}
                sx={{ color: selected ? 'primary.main' : 'text.primary' }}>
                {preset.label}
              </Typography>
            </Box>
          );
        })}
      </Box>

      <TextField
        fullWidth
        placeholder="Or describe your own goal..."
        value={value}
        onChange={e => onChange(e.target.value)}
        size="small"
        inputProps={{ maxLength: 60 }}
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
      />
      <Typography variant="caption" color="text.disabled" sx={{ mt: 0.75, display: 'block', textAlign: 'right' }}>
        {value.length}/60
      </Typography>
    </Box>
  );
}

// ─── Summary step ─────────────────────────────────────────────────────────────

function SummaryStep({ data }) {
  const morningType = MORNING_TYPES.find(t => t.value === data.morningRating);
  const game = GAMES.find(g => g.value === data.favoriteGame);
  const [h, m] = data.wakeTime.split(':').map(Number);
  const formattedTime = `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;

  const items = [
    { emoji: '👤', label: 'Name',         value: data.name },
    { emoji: '⏰', label: 'Wake time',    value: formattedTime },
    { emoji: morningType?.emoji, label: 'Morning type', value: morningType?.label },
    { emoji: game?.emoji,        label: 'Wake-up game', value: game?.label },
    { emoji: '🎯',               label: 'Morning goal', value: data.wakeGoal || '—' },
  ];

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Box sx={{
        width: 80, height: 80, borderRadius: '50%', mx: 'auto', mb: 3,
        bgcolor: 'rgba(6,214,160,0.1)', border: '2px solid rgba(6,214,160,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        '@keyframes checkPop': {
          '0%':   { transform: 'scale(0)', opacity: 0 },
          '65%':  { transform: 'scale(1.18)' },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
        animation: 'checkPop 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.1s both',
      }}>
        <CheckIcon sx={{ fontSize: 36, color: '#06D6A0' }} />
      </Box>

      <Typography variant="h5" fontWeight={800} sx={{
        mb: 0.5,
        '@keyframes sFadeUp': { from: { opacity: 0, transform: 'translateY(14px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        animation: 'sFadeUp 0.5s ease 0.3s both',
      }}>
        You're all set, {data.name}!
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 4, animation: 'sFadeUp 0.5s ease 0.42s both' }}>
        Here's your morning profile
      </Typography>

      <Box sx={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        {items.map((item, i) => (
          <Box
            key={item.label}
            sx={{
              display: 'flex', alignItems: 'center', gap: 2,
              p: 1.75, borderRadius: 2.5,
              bgcolor: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              '@keyframes itemIn': {
                from: { opacity: 0, transform: 'translateX(18px)' },
                to:   { opacity: 1, transform: 'translateX(0)' },
              },
              animation: `itemIn 0.4s ease ${0.5 + i * 0.08}s both`,
            }}
          >
            <Typography sx={{ fontSize: '1.2rem', lineHeight: 1, width: 24, textAlign: 'center' }}>
              {item.emoji}
            </Typography>
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
              <Typography variant="caption" color="text.secondary">{item.label}</Typography>
              <Typography variant="body2" fontWeight={600}>{item.value}</Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// ─── Shared ───────────────────────────────────────────────────────────────────

function StepHeader({ emoji, title, subtitle }) {
  return (
    <Box>
      <Typography sx={{ fontSize: '2.4rem', mb: 2, lineHeight: 1 }}>{emoji}</Typography>
      <Typography variant="h5" fontWeight={800} sx={{ mb: 1, lineHeight: 1.25 }}>{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>{subtitle}</Typography>
    </Box>
  );
}
