import { useState } from 'react';
import { Box, Typography, Button, TextField, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckIcon from '@mui/icons-material/Check';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

// ─── Static data ──────────────────────────────────────────────────────────────

const INTENSITY = [
  { value: 'gentle',   emoji: '🌱', label: 'Gentle',   desc: '1 game · Easy mode',   xp: 20, color: '#06D6A0' },
  { value: 'moderate', emoji: '🔥', label: 'Moderate', desc: '2 games · Normal mode', xp: 35, color: '#FFD166' },
  { value: 'intense',  emoji: '⚡', label: 'Intense',  desc: '3 games · Hard mode',  xp: 60, color: '#EF476F' },
];

const GAMES = [
  { value: 'math',     emoji: '🧮', label: 'Math Blitz',    desc: 'Arithmetic to dismiss',  color: '#FF6B35' },
  { value: 'memory',   emoji: '🃏', label: 'Memory Match',  desc: 'Flip and match pairs',    color: '#FFD166' },
  { value: 'reaction', emoji: '⚡', label: 'Reaction Rush', desc: 'Tap right on cue',        color: '#06D6A0' },
];

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const QUICK_PRESETS = [
  { label: 'Every day', days: [0, 1, 2, 3, 4, 5, 6] },
  { label: 'Weekdays',  days: [1, 2, 3, 4, 5] },
  { label: 'Weekend',   days: [0, 6] },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CreateAlarm() {
  const navigate = useNavigate();
  const { addAlarm } = useApp();

  const [form, setForm] = useState({
    label: '',
    time: '07:00',
    days: [1, 2, 3, 4, 5],
    pulse: { intensity: 'moderate', games: ['math', 'memory'] },
  });

  // ── Time helpers ──────────────────────────────────────────────────────────

  const [h, m] = form.time.split(':').map(Number);
  const isPM = h >= 12;
  const hour12 = h % 12 || 12;

  function setHour(newH12) {
    const h24 = isPM ? (newH12 % 12) + 12 : newH12 % 12;
    setForm(f => ({ ...f, time: `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}` }));
  }

  function setMin(newM) {
    setForm(f => ({ ...f, time: `${String(h).padStart(2, '0')}:${String(newM).padStart(2, '0')}` }));
  }

  function togglePeriod() {
    const newH = isPM ? h - 12 : h + 12;
    setForm(f => ({ ...f, time: `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}` }));
  }

  // ── Day helpers ───────────────────────────────────────────────────────────

  function toggleDay(i) {
    setForm(f => ({
      ...f,
      days: f.days.includes(i) ? f.days.filter(d => d !== i) : [...f.days, i],
    }));
  }

  function applyPreset(days) {
    setForm(f => ({ ...f, days }));
  }

  // ── Pulse helpers ─────────────────────────────────────────────────────────

  function setIntensity(intensity) {
    const map = { gentle: ['math'], moderate: ['math', 'memory'], intense: ['math', 'memory', 'reaction'] };
    setForm(f => ({ ...f, pulse: { intensity, games: map[intensity] } }));
  }

  function toggleGame(game) {
    setForm(f => {
      const curr = f.pulse.games;
      const next = curr.includes(game) ? curr.filter(g => g !== game) : [...curr, game];
      return { ...f, pulse: { ...f.pulse, games: next.length ? next : curr } };
    });
  }

  // ─────────────────────────────────────────────────────────────────────────

  function handleSave() {
    addAlarm(form);
    navigate('/');
  }

  const timeCtx =
    h >= 0  && h < 4  ? { label: 'Deep night 🌙',          color: '#8B5CF6' } :
    h >= 4  && h < 6  ? { label: 'Before dawn 💪',         color: '#EF476F' } :
    h >= 6  && h < 8  ? { label: 'Early riser 🌅',         color: '#FF6B35' } :
    h >= 8  && h < 10 ? { label: 'Morning sweet spot ☀️',  color: '#FFD166' } :
    h >= 10 && h < 12 ? { label: 'Late morning 🌤️',        color: '#06D6A0' } :
    h >= 12 && h < 14 ? { label: 'Midday 🌞',              color: '#FFD166' } :
    h >= 14 && h < 17 ? { label: 'Afternoon ⛅',            color: '#FF8C5A' } :
    h >= 17 && h < 20 ? { label: 'Evening 🌆',             color: '#FF6B35' } :
    h >= 20 && h < 22 ? { label: 'Night 🌙',               color: '#8B5CF6' } :
                        { label: 'Late night 🦉',           color: '#A0A0B8' };

  const activePreset = QUICK_PRESETS.find(p =>
    p.days.length === form.days.length && p.days.every(d => form.days.includes(d))
  );

  return (
    <Box sx={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', bgcolor: 'background.default' }}>
      <Background />

      <Box sx={{ position: 'relative', zIndex: 1, pb: 14 }}>
        {/* Header */}
        <Box sx={{ px: 3, pt: 5, pb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconButton
            onClick={() => navigate('/')}
            size="small"
            sx={{
              color: 'rgba(255,255,255,0.5)',
              bgcolor: 'rgba(255,255,255,0.06)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
            }}
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Typography variant="h6" fontWeight={800}>New Alarm</Typography>
        </Box>

        {/* ── Time ─────────────────────────────────────────────────────────── */}
        <Section delay={0.04}>
          <SectionLabel>Time</SectionLabel>
          <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
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
              onUp={()   => setMin(m >= 59 ? 0  : m + 1)}
              onDown={()  => setMin(m <= 0  ? 59 : m - 1)}
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
                      '&:hover': { bgcolor: active ? 'primary.dark' : 'rgba(255,255,255,0.14)' },
                    }}
                  >
                    {period}
                  </Box>
                );
              })}
            </Box>
          </Box>
          <Typography
            variant="body2"
            fontWeight={600}
            textAlign="center"
            sx={{ color: timeCtx.color, transition: 'color 0.3s', mt: 0.5 }}
          >
            {timeCtx.label}
          </Typography>
        </Section>

        <Separator />

        {/* ── Label ────────────────────────────────────────────────────────── */}
        <Section delay={0.1}>
          <SectionLabel>Label</SectionLabel>
          <TextField
            fullWidth
            placeholder="Morning routine, Gym, Work..."
            value={form.label}
            onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
            inputProps={{ maxLength: 40 }}
            variant="standard"
            sx={{
              mt: 2,
              '& .MuiInput-input': { fontSize: '1.3rem', fontWeight: 600, py: 1 },
              '& .MuiInput-underline:before': { borderBottomColor: 'rgba(255,255,255,0.1)' },
              '& .MuiInput-underline:after':  { borderBottomColor: '#FF6B35' },
            }}
          />
          <Typography
            variant="caption"
            color="text.disabled"
            sx={{
              display: 'block',
              textAlign: 'right',
              mt: 0.5,
              opacity: form.label.length > 0 ? 1 : 0,
              transition: 'opacity 0.2s',
            }}
          >
            {form.label.length}/40
          </Typography>
        </Section>

        <Separator />

        {/* ── Repeat ───────────────────────────────────────────────────────── */}
        <Section delay={0.15}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <SectionLabel>Repeat</SectionLabel>
            <Typography variant="caption" color="text.disabled">
              {form.days.length === 0
                ? 'One-time alarm'
                : form.days.length === 7
                ? 'Every day'
                : `${form.days.length} day${form.days.length > 1 ? 's' : ''}`}
            </Typography>
          </Box>

          {/* Quick presets */}
          <Box sx={{ display: 'flex', gap: 1, mt: 2, mb: 2.5 }}>
            {QUICK_PRESETS.map(preset => {
              const active = preset.label === activePreset?.label;
              return (
                <Box
                  key={preset.label}
                  onClick={() => applyPreset(preset.days)}
                  sx={{
                    px: 1.75, py: 0.6, borderRadius: 10, cursor: 'pointer', userSelect: 'none',
                    border: active ? '1.5px solid rgba(255,107,53,0.55)' : '1.5px solid rgba(255,255,255,0.1)',
                    bgcolor: active ? 'rgba(255,107,53,0.1)' : 'rgba(255,255,255,0.04)',
                    typography: 'caption',
                    fontWeight: active ? 700 : 500,
                    color: active ? 'primary.main' : 'text.secondary',
                    transition: 'all 0.2s',
                  }}
                >
                  {preset.label}
                </Box>
              );
            })}
          </Box>

          {/* Day circles */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            {DAY_LABELS.map((d, i) => {
              const on = form.days.includes(i);
              return (
                <Box
                  key={i}
                  onClick={() => toggleDay(i)}
                  sx={{
                    flex: 1,
                    aspectRatio: '1',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    userSelect: 'none',
                    bgcolor: on ? 'primary.main' : 'rgba(255,255,255,0.06)',
                    border: `1.5px solid ${on ? '#FF6B35' : 'transparent'}`,
                    fontWeight: 700,
                    fontSize: '0.62rem',
                    boxShadow: on ? '0 4px 12px rgba(255,107,53,0.35)' : 'none',
                    transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
                    transform: on ? 'scale(1.1)' : 'scale(1)',
                  }}
                >
                  {d}
                </Box>
              );
            })}
          </Box>
        </Section>

        <Separator />

        {/* ── Intensity ────────────────────────────────────────────────────── */}
        <Section delay={0.2}>
          <SectionLabel>Wake-up Intensity</SectionLabel>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2.5 }}>
            {INTENSITY.map((opt, i) => {
              const selected = form.pulse.intensity === opt.value;
              return (
                <Box
                  key={opt.value}
                  onClick={() => setIntensity(opt.value)}
                  sx={{
                    p: 2.5, borderRadius: 3, cursor: 'pointer',
                    border: selected ? `1.5px solid ${opt.color}55` : '1.5px solid rgba(255,255,255,0.07)',
                    bgcolor: selected ? `${opt.color}0D` : 'rgba(255,255,255,0.03)',
                    display: 'flex', alignItems: 'center', gap: 2,
                    transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
                    transform: selected ? 'scale(1.02)' : 'scale(1)',
                    '@keyframes intIn': {
                      from: { opacity: 0, transform: 'translateX(-14px)' },
                      to:   { opacity: 1, transform: 'translateX(0)' },
                    },
                    animation: `intIn 0.4s ease ${i * 0.08}s both`,
                  }}
                >
                  <Box
                    sx={{
                      width: 50, height: 50, borderRadius: 3, flexShrink: 0,
                      bgcolor: `${opt.color}18`, border: `1px solid ${opt.color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.4rem',
                    }}
                  >
                    {opt.emoji}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography fontWeight={700} sx={{ color: selected ? opt.color : 'text.primary' }}>
                      {opt.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">{opt.desc}</Typography>
                  </Box>
                  <Box
                    sx={{
                      px: 1.25, py: 0.35, borderRadius: 1.5, flexShrink: 0,
                      bgcolor: `${opt.color}20`, color: opt.color,
                      fontSize: '0.68rem', fontWeight: 800,
                    }}
                  >
                    +{opt.xp} XP
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Section>

        <Separator />

        {/* ── Games ────────────────────────────────────────────────────────── */}
        <Section delay={0.26}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <SectionLabel>Wake-Up Games</SectionLabel>
            <Typography variant="caption" color="text.disabled">
              {form.pulse.games.length} selected
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', mb: 0.5 }}>
            All selected games must be completed to dismiss.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2 }}>
            {GAMES.map((game, i) => {
              const selected = form.pulse.games.includes(game.value);
              return (
                <Box
                  key={game.value}
                  onClick={() => toggleGame(game.value)}
                  sx={{
                    p: 2.5, borderRadius: 3, cursor: 'pointer',
                    border: selected ? `1.5px solid ${game.color}55` : '1.5px solid rgba(255,255,255,0.07)',
                    bgcolor: selected ? `${game.color}0D` : 'rgba(255,255,255,0.03)',
                    display: 'flex', alignItems: 'center', gap: 2.5,
                    transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
                    transform: selected ? 'scale(1.01)' : 'scale(1)',
                    '@keyframes gameCardIn': {
                      from: { opacity: 0, transform: 'translateY(12px)' },
                      to:   { opacity: 1, transform: 'translateY(0)' },
                    },
                    animation: `gameCardIn 0.4s ease ${i * 0.09}s both`,
                  }}
                >
                  <Box
                    sx={{
                      width: 52, height: 52, borderRadius: 3, flexShrink: 0,
                      bgcolor: `${game.color}18`, border: `1px solid ${game.color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.5rem',
                    }}
                  >
                    {game.emoji}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography fontWeight={700}>{game.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{game.desc}</Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                      border: selected ? `2px solid ${game.color}` : '2px solid rgba(255,255,255,0.15)',
                      bgcolor: selected ? game.color : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}
                  >
                    {selected && <CheckIcon sx={{ fontSize: 13, color: '#fff' }} />}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Section>
      </Box>

      {/* Fixed save button */}
      <Box
        sx={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          px: 3, pb: 4, pt: 2,
          bgcolor: 'rgba(13,13,26,0.92)',
          backdropFilter: 'blur(14px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          zIndex: 10,
        }}
      >
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleSave}
          sx={{
            py: 1.75,
            fontWeight: 700,
            borderRadius: 3,
            fontSize: '1rem',
            background: 'linear-gradient(135deg, #FF6B35 0%, #FF8C5A 100%)',
            boxShadow: '0 8px 32px rgba(255,107,53,0.3)',
            transition: 'box-shadow 0.2s',
            '&:hover': { boxShadow: '0 12px 40px rgba(255,107,53,0.45)' },
          }}
        >
          Set Alarm ✓
        </Button>
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
        position: 'absolute', width: 420, height: 420, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,107,53,0.11) 0%, transparent 70%)',
        top: -110, right: -110, filter: 'blur(55px)',
        '@keyframes caOrb1': {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '50%':     { transform: 'translate(-20px,18px) scale(1.05)' },
        },
        animation: 'caOrb1 13s ease-in-out infinite',
      }} />
      <Box sx={{
        position: 'absolute', width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(120,40,220,0.09) 0%, transparent 70%)',
        bottom: '35%', left: -90, filter: 'blur(50px)',
        '@keyframes caOrb2': {
          '0%,100%': { transform: 'translate(0,0)' },
          '50%':     { transform: 'translate(22px,-22px)' },
        },
        animation: 'caOrb2 16s ease-in-out infinite',
      }} />
    </Box>
  );
}

// ─── TimeDrum ─────────────────────────────────────────────────────────────────

function TimeDrum({ display, onUp, onDown }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
      <IconButton
        onClick={onUp}
        sx={{ color: 'primary.main', bgcolor: 'rgba(255,107,53,0.08)', '&:hover': { bgcolor: 'rgba(255,107,53,0.16)' } }}
      >
        <KeyboardArrowUpIcon />
      </IconButton>
      <Box
        sx={{
          width: 76, height: 76, borderRadius: 3,
          bgcolor: 'rgba(255,107,53,0.07)',
          border: '1px solid rgba(255,107,53,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Typography variant="h4" fontWeight={800} sx={{ fontVariantNumeric: 'tabular-nums' }}>
          {display}
        </Typography>
      </Box>
      <IconButton
        onClick={onDown}
        sx={{ color: 'primary.main', bgcolor: 'rgba(255,107,53,0.08)', '&:hover': { bgcolor: 'rgba(255,107,53,0.16)' } }}
      >
        <KeyboardArrowDownIcon />
      </IconButton>
    </Box>
  );
}

// ─── Layout helpers ───────────────────────────────────────────────────────────

function Section({ children, delay = 0 }) {
  return (
    <Box
      sx={{
        px: 3, py: 3,
        '@keyframes secIn': {
          from: { opacity: 0, transform: 'translateY(18px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
        animation: `secIn 0.45s ease ${delay}s both`,
      }}
    >
      {children}
    </Box>
  );
}

function SectionLabel({ children }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ width: 3, height: 14, borderRadius: 2, bgcolor: 'primary.main', flexShrink: 0 }} />
      <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 2, fontSize: '0.62rem' }}>
        {children}
      </Typography>
    </Box>
  );
}

function Separator() {
  return <Box sx={{ height: 1, bgcolor: 'rgba(255,255,255,0.05)', mx: 3 }} />;
}
