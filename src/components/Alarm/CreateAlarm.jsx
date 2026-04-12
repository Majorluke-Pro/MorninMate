import { useEffect, useState } from 'react';
import { Box, Typography, Button, TextField, IconButton, ToggleButton, ToggleButtonGroup, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CheckIcon from '@mui/icons-material/Check';
import CalculateIcon from '@mui/icons-material/Calculate';
import StyleIcon from '@mui/icons-material/Style';
import BoltIcon from '@mui/icons-material/Bolt';
import SpaIcon from '@mui/icons-material/Spa';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import MusicNoteIcon            from '@mui/icons-material/MusicNote';
import TuneIcon                 from '@mui/icons-material/Tune';
import GraphicEqIcon            from '@mui/icons-material/GraphicEq';
import TrendingUpIcon           from '@mui/icons-material/TrendingUp';
import RadioButtonCheckedIcon   from '@mui/icons-material/RadioButtonChecked';
import SportsEsportsIcon        from '@mui/icons-material/SportsEsports';
import CampaignIcon             from '@mui/icons-material/Campaign';
import WavesIcon                from '@mui/icons-material/Waves';
import PlayArrowIcon            from '@mui/icons-material/PlayArrow';
import NightsStayIcon           from '@mui/icons-material/NightsStay';
import WbTwilightIcon           from '@mui/icons-material/WbTwilight';
import WbSunnyIcon              from '@mui/icons-material/WbSunny';
import LightModeIcon            from '@mui/icons-material/LightMode';
import WbCloudyIcon             from '@mui/icons-material/WbCloudy';
import Brightness4Icon          from '@mui/icons-material/Brightness4';
import HotelIcon                from '@mui/icons-material/Hotel';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { ALARM_SOUNDS, previewAlarmSound } from '../../lib/sounds';
import TimePicker from '../common/TimePicker';

// ─── Static data ──────────────────────────────────────────────────────────────

const INTENSITY = [
  { value: 'gentle',   Icon: SpaIcon,                   label: 'Gentle',   desc: '1 game · Easy mode',         xp: 20,  color: '#06D6A0' },
  { value: 'moderate', Icon: WhatshotIcon,               label: 'Moderate', desc: '2 games · Normal mode',       xp: 35,  color: '#FFD166' },
  { value: 'intense',  Icon: FlashOnIcon,                label: 'Intense',  desc: '3 games · Hard mode',         xp: 60,  color: '#EF476F' },
  { value: 'hardcore', Icon: LocalFireDepartmentIcon,    label: 'Hardcore', desc: '3 games · Hard · No escape',  xp: 100, color: '#EF1C1C' },
];

const GAMES = [
  { value: 'math',     Icon: CalculateIcon, label: 'Math Blitz',    desc: 'Arithmetic to dismiss',  color: '#FF6B35' },
  { value: 'memory',   Icon: StyleIcon,     label: 'Memory Match',  desc: 'Flip and match pairs',    color: '#FFD166' },
  { value: 'reaction', Icon: BoltIcon,      label: 'Reaction Rush', desc: 'Tap right on cue',        color: '#06D6A0' },
];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const SOUND_META = {
  classic: { Icon: NotificationsActiveIcon, color: '#EF476F' },
  chime:   { Icon: MusicNoteIcon,           color: '#FFD166' },
  digital: { Icon: TuneIcon,               color: '#06D6A0' },
  pulse:   { Icon: GraphicEqIcon,           color: '#FF6B35' },
  rise:    { Icon: TrendingUpIcon,          color: '#8B5CF6' },
  ping:    { Icon: RadioButtonCheckedIcon,  color: '#06D6A0' },
  arcade:  { Icon: SportsEsportsIcon,       color: '#FF9F35' },
  bell:    { Icon: CampaignIcon,            color: '#FFD166' },
  warble:  { Icon: WavesIcon,              color: '#C97BE8' },
  buzz:    { Icon: BoltIcon,               color: '#EF476F' },
};

const QUICK_PRESETS = [
  { label: 'Every day', days: [0, 1, 2, 3, 4, 5, 6] },
  { label: 'Weekdays',  days: [1, 2, 3, 4, 5] },
  { label: 'Weekend',   days: [0, 6] },
];

const REQUIRED_GAMES_BY_INTENSITY = {
  gentle: 1,
  moderate: 2,
  intense: 3,
  hardcore: 3,
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CreateAlarm() {
  const navigate = useNavigate();
  const { addAlarm, user } = useApp();

  const [hardcoreWarningOpen, setHardcoreWarningOpen] = useState(false);
  const [showScrollCue, setShowScrollCue] = useState(true);
  const [repeatMode, setRepeatMode] = useState('');

  const [form, setForm] = useState({
    label: '',
    time: user?.wakeTime || '07:00',
    days: [],
    sound: '',
    pulse: { intensity: '', games: [] },
  });

  // ── Time helpers ──────────────────────────────────────────────────────────

  const [h] = form.time ? form.time.split(':').map(Number) : [null];


  // ── Day helpers ───────────────────────────────────────────────────────────

  function toggleDay(i) {
    setForm(f => ({
      ...f,
      days: f.days.includes(i) ? f.days.filter(d => d !== i) : [...f.days, i],
    }));
  }

  function applyRepeatMode(mode) {
    setRepeatMode(mode);
    if (mode === 'once') {
      setForm(f => ({ ...f, days: [] }));
      return;
    }
    if (mode === 'custom') {
      setForm(f => ({ ...f, days: [] }));
      return;
    }

    const presetMap = {
      every: QUICK_PRESETS[0].days,
      weekdays: QUICK_PRESETS[1].days,
      weekend: QUICK_PRESETS[2].days,
    };
    setForm(f => ({ ...f, days: presetMap[mode] || [] }));
  }

  // ── Pulse helpers ─────────────────────────────────────────────────────────

  function setIntensity(intensity) {
    setForm(f => ({
      ...f,
      pulse: {
        intensity,
        games: intensity === 'hardcore' ? ['math', 'memory', 'reaction'] : [],
      },
    }));
  }

  function toggleGame(game) {
    setForm(f => {
      const curr = f.pulse.games;
      const requiredCount = REQUIRED_GAMES_BY_INTENSITY[f.pulse.intensity] ?? 0;
      if (!requiredCount || f.pulse.intensity === 'hardcore') return f;
      if (curr.includes(game)) {
        return { ...f, pulse: { ...f.pulse, games: curr.filter(g => g !== game) } };
      }
      if (curr.length >= requiredCount) return f;
      const next = curr.includes(game) ? curr.filter(g => g !== game) : [...curr, game];
      return { ...f, pulse: { ...f.pulse, games: next } };
    });
  }

  // ─────────────────────────────────────────────────────────────────────────

  function handleSave() {
    if (!canSave) return;
    addAlarm(form);
    navigate('/');
  }

  const timeCtx = form.time && h !== null
    ? h >= 0  && h < 4  ? { label: 'Deep night',        color: '#8B5CF6', Icon: NightsStayIcon  } :
      h >= 4  && h < 6  ? { label: 'Before dawn',       color: '#EF476F', Icon: WbTwilightIcon  } :
      h >= 6  && h < 8  ? { label: 'Early riser',       color: '#FF6B35', Icon: WbTwilightIcon  } :
      h >= 8  && h < 10 ? { label: 'Morning sweet spot',color: '#FFD166', Icon: WbSunnyIcon     } :
      h >= 10 && h < 12 ? { label: 'Late morning',      color: '#06D6A0', Icon: WbSunnyIcon     } :
      h >= 12 && h < 14 ? { label: 'Midday',            color: '#FFD166', Icon: LightModeIcon   } :
      h >= 14 && h < 17 ? { label: 'Afternoon',         color: '#FF8C5A', Icon: WbCloudyIcon    } :
      h >= 17 && h < 20 ? { label: 'Evening',           color: '#FF6B35', Icon: Brightness4Icon } :
      h >= 20 && h < 22 ? { label: 'Night',             color: '#8B5CF6', Icon: NightsStayIcon  } :
                          { label: 'Late night',         color: '#A0A0B8', Icon: HotelIcon       }
    : null;

  const requiredGameCount = REQUIRED_GAMES_BY_INTENSITY[form.pulse.intensity] ?? 0;
  const gamesComplete = form.pulse.intensity === 'hardcore'
    ? true
    : requiredGameCount > 0 && form.pulse.games.length === requiredGameCount;
  const repeatComplete = repeatMode === 'custom' ? form.days.length > 0 : Boolean(repeatMode);
  const canSave = Boolean(form.time)
    && Boolean(form.sound)
    && Boolean(form.pulse.intensity)
    && repeatComplete
    && gamesComplete;
  const missingRequirements = [
    !repeatComplete && 'repeat',
    !form.sound && 'sound',
    !form.pulse.intensity && 'intensity',
    !gamesComplete && 'games',
  ].filter(Boolean);
  const requirementMessage = `Still choose: ${missingRequirements.join(', ')}.`;

  useEffect(() => {
    function updateScrollCue() {
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      const viewportBottom = scrollTop + window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      const nearBottom = viewportBottom >= docHeight - 140;
      setShowScrollCue(scrollTop < 160 && !nearBottom);
    }

    updateScrollCue();
    window.addEventListener('scroll', updateScrollCue, { passive: true });
    window.addEventListener('resize', updateScrollCue);

    return () => {
      window.removeEventListener('scroll', updateScrollCue);
      window.removeEventListener('resize', updateScrollCue);
    };
  }, []);

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
          <TimePicker value={form.time} onChange={t => setForm(f => ({ ...f, time: t }))} />
          <Box sx={{ display:'flex', alignItems:'center', justifyContent:'center', gap:0.75, mt:1.5, minHeight: 24 }}>
            {timeCtx ? (
              <>
                <timeCtx.Icon sx={{ fontSize:'1rem', color: timeCtx.color, transition:'color 0.3s' }}/>
                <Typography variant="body2" fontWeight={600} sx={{ color: timeCtx.color, transition:'color 0.3s' }}>
                  {timeCtx.label}
                </Typography>
              </>
            ) : (
              <Typography variant="body2" fontWeight={600} sx={{ color: 'rgba(255,255,255,0.38)' }}>
                Tap the clock to choose a wake-up time
              </Typography>
            )}
          </Box>
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

        {/* ── Sound ────────────────────────────────────────────────────────── */}
        <Section delay={0.12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <SectionLabel>Alarm Sound</SectionLabel>
            <Typography variant="caption" color="text.disabled">
              {ALARM_SOUNDS.find(s => s.id === form.sound)?.label || 'Required'}
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 1.5,
            }}
          >
            {ALARM_SOUNDS.map(sound => {
              const meta     = SOUND_META[sound.id];
              const selected = form.sound === sound.id;
              return (
                <Box
                  key={sound.id}
                  onClick={() => setForm(f => ({ ...f, sound: sound.id }))}
                  sx={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75,
                    cursor: 'pointer', userSelect: 'none',
                  }}
                >
                  {/* Icon circle */}
                  <Box
                    sx={{
                      width: 52, height: 52, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'relative',
                      border: selected
                        ? `2px solid ${meta.color}`
                        : '2px solid rgba(255,255,255,0.08)',
                      bgcolor: selected ? `${meta.color}18` : 'rgba(255,255,255,0.04)',
                      boxShadow: selected ? `0 0 14px ${meta.color}44` : 'none',
                      transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                      transform: selected ? 'scale(1.1)' : 'scale(1)',
                    }}
                  >
                    <meta.Icon sx={{ fontSize: '1.4rem', color: selected ? meta.color : 'rgba(255,255,255,0.3)' }} />
                    {/* Preview play button — shown on selected */}
                    {selected && (
                      <Box
                        onClick={e => { e.stopPropagation(); previewAlarmSound(sound.id); }}
                        sx={{
                          position: 'absolute', bottom: -4, right: -4,
                          width: 20, height: 20, borderRadius: '50%',
                          bgcolor: meta.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: `0 2px 8px ${meta.color}66`,
                          transition: 'transform 0.15s',
                          '&:active': { transform: 'scale(0.88)' },
                        }}
                      >
                        <PlayArrowIcon sx={{ fontSize: '0.75rem', color: '#fff' }} />
                      </Box>
                    )}
                  </Box>
                  {/* Label */}
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.6rem', fontWeight: selected ? 700 : 500,
                      color: selected ? meta.color : 'rgba(255,255,255,0.35)',
                      textAlign: 'center', letterSpacing: 0.2,
                      transition: 'color 0.2s',
                    }}
                  >
                    {sound.label}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Section>

        <Separator />

        {/* ── Repeat ───────────────────────────────────────────────────────── */}
        <Section delay={0.15}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <SectionLabel>Repeat</SectionLabel>
            <Typography variant="caption" color="text.disabled">
              {!repeatMode
                ? 'Required'
                : repeatMode === 'once'
                ? 'One-time alarm'
                : form.days.length === 0
                ? 'Choose day(s)'
                : form.days.length === 7
                ? 'Every day'
                : `${form.days.length} day${form.days.length > 1 ? 's' : ''}`}
            </Typography>
          </Box>

          {/* Modes (smoother than raw chips) */}
          <Box sx={{ mt: 2, mb: 2.5, display: 'flex', justifyContent: 'center' }}>
            <ToggleButtonGroup
              exclusive
              value={repeatMode}
              onChange={(_, next) => {
                if (!next) return;
                applyRepeatMode(next);
              }}
              sx={{
                bgcolor: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 999,
                p: 0.35,
                '& .MuiToggleButton-root': {
                  border: 'none',
                  borderRadius: 999,
                  textTransform: 'none',
                  px: 1.5,
                  py: 0.7,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: 0.2,
                  color: 'rgba(255,255,255,0.55)',
                  transition: 'background-color 160ms ease, color 160ms ease, transform 120ms ease',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
                  '&.Mui-selected': {
                    color: '#FF6B35',
                    bgcolor: 'rgba(255,107,53,0.14)',
                    boxShadow: '0 8px 18px rgba(255,107,53,0.12)',
                  },
                  '&.Mui-selected:hover': { bgcolor: 'rgba(255,107,53,0.18)' },
                  '&:active': { transform: 'scale(0.98)' },
                },
              }}
            >
              <ToggleButton value="once">Once</ToggleButton>
              <ToggleButton value="custom">Custom</ToggleButton>
              <ToggleButton value="weekdays">Weekdays</ToggleButton>
              <ToggleButton value="weekend">Weekend</ToggleButton>
              <ToggleButton value="every">Every day</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Day circles (custom) */}
          <Box sx={{ display: 'flex', gap: 1, opacity: repeatMode !== 'custom' ? 0.45 : 1, transition: 'opacity 180ms ease' }}>
            {DAY_LABELS.map((d, i) => {
              const on = form.days.includes(i);
              return (
                <ToggleButton
                  key={i}
                  value={i}
                  selected={on}
                  disabled={repeatMode !== 'custom'}
                  onChange={() => toggleDay(i)}
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    aspectRatio: '1',
                    borderRadius: '50%',
                    border: '1.5px solid rgba(255,255,255,0.08)',
                    bgcolor: 'rgba(255,255,255,0.05)',
                    color: 'rgba(255,255,255,0.55)',
                    fontWeight: 800,
                    fontSize: '0.62rem',
                    letterSpacing: 0.3,
                    transition: 'background-color 160ms ease, box-shadow 160ms ease, transform 120ms ease, border-color 160ms ease, color 160ms ease',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                    '&.Mui-selected': {
                      bgcolor: 'rgba(255,107,53,0.9)',
                      borderColor: '#FF6B35',
                      color: '#fff',
                      boxShadow: '0 10px 22px rgba(255,107,53,0.22)',
                    },
                    '&.Mui-selected:hover': { bgcolor: 'rgba(255,107,53,1)' },
                    '&:active': { transform: 'scale(0.97)' },
                    '&.Mui-disabled': { opacity: 0.5, color: 'rgba(255,255,255,0.4)' },
                  }}
                >
                  {d}
                </ToggleButton>
              );
            })}
          </Box>
          {repeatMode === 'custom' && form.days.length === 0 && (
            <Typography variant="caption" sx={{ color: '#FFD166', display: 'block', mt: 1.1 }}>
              Pick at least one day for a custom repeat.
            </Typography>
          )}
        </Section>

        <Separator />

        {/* ── Intensity ────────────────────────────────────────────────────── */}
        <Section delay={0.2}>
          <SectionLabel>Wake-up Intensity</SectionLabel>
          {!form.pulse.intensity && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
              Choose how tough this alarm should be.
            </Typography>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2.5 }}>
            {INTENSITY.map((opt, i) => {
              const selected = form.pulse.intensity === opt.value;
              return (
                <Box
                  key={opt.value}
                  sx={{
                    '@keyframes intIn': {
                      from: { opacity: 0, transform: 'translateX(-14px)' },
                      to:   { opacity: 1, transform: 'translateX(0)' },
                    },
                    animation: `intIn 0.4s ease ${i * 0.08}s both`,
                  }}
                >
                  <Box
                    onClick={() => {
                      if (opt.value === 'hardcore') {
                        setHardcoreWarningOpen(true);
                      } else {
                        setIntensity(opt.value);
                      }
                    }}
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      cursor: 'pointer',
                      border: selected ? `1.5px solid ${opt.color}55` : '1.5px solid rgba(255,255,255,0.07)',
                      bgcolor: selected ? `${opt.color}0D` : 'rgba(255,255,255,0.03)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      transition: 'border-color 0.22s ease, background-color 0.22s ease, box-shadow 0.22s ease, transform 0.22s cubic-bezier(0.34,1.56,0.64,1)',
                      transform: selected ? 'scale(1.02)' : 'scale(1)',
                      boxShadow: selected ? `0 12px 26px ${opt.color}18` : 'none',
                    }}
                  >
                    <Box
                      sx={{
                        width: 50, height: 50, borderRadius: 3, flexShrink: 0,
                        bgcolor: `${opt.color}18`, border: `1px solid ${opt.color}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <opt.Icon sx={{ fontSize: '1.9rem', color: opt.color }} />
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
                </Box>
              );
            })}
          </Box>
        </Section>

        <Separator />

        {/* ── Games ────────────────────────────────────────────────────────── */}
        {form.pulse.intensity !== 'hardcore' && (
        <Section delay={0.26}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <SectionLabel>Wake-Up Games</SectionLabel>
            <Typography variant="caption" color="text.disabled">
              {requiredGameCount ? `${form.pulse.games.length}/${requiredGameCount} selected` : 'Choose intensity first'}
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', mb: 0.5 }}>
            {requiredGameCount
              ? `Choose ${requiredGameCount} game${requiredGameCount > 1 ? 's' : ''}. All selected games must be completed to dismiss.`
              : 'Pick an intensity first so we know how many games this alarm requires.'}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2 }}>
            {GAMES.map((game, i) => {
              const selected = form.pulse.games.includes(game.value);
              const disabled = !requiredGameCount;
              return (
                <Box
                  key={game.value}
                  onClick={() => !disabled && toggleGame(game.value)}
                  sx={{
                    p: 2.5, borderRadius: 3, cursor: 'pointer',
                    border: selected ? `1.5px solid ${game.color}55` : '1.5px solid rgba(255,255,255,0.07)',
                    bgcolor: selected ? `${game.color}0D` : 'rgba(255,255,255,0.03)',
                    display: 'flex', alignItems: 'center', gap: 2.5,
                    transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
                    transform: selected ? 'scale(1.01)' : 'scale(1)',
                    opacity: disabled ? 0.45 : 1,
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
                    }}
                  >
                    <game.Icon sx={{ fontSize: '1.9rem', color: game.color }} />
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
          {requiredGameCount > 0 && !gamesComplete && (
            <Typography variant="caption" sx={{ color: '#FFD166', display: 'block', mt: 1.1 }}>
              Choose {requiredGameCount} game{requiredGameCount > 1 ? 's' : ''} to finish this alarm setup.
            </Typography>
          )}
        </Section>
        )}
      </Box>

      <Dialog
        open={hardcoreWarningOpen}
        onClose={() => setHardcoreWarningOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: '#1A0808',
            border: '1.5px solid rgba(239,28,28,0.4)',
            borderRadius: 4,
            mx: 2,
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <LocalFireDepartmentIcon sx={{ color: '#EF1C1C', fontSize: '1.8rem' }} />
          <Typography fontWeight={900} fontSize="1.15rem">Are you sure?</Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" lineHeight={1.7}>
            <strong style={{ color: '#EF1C1C' }}>Hardcore Mode</strong> forces{' '}
            <strong>maximum volume</strong> and locks your phone to this app until all 3 games
            are completed. There is <strong>no way out</strong>.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setHardcoreWarningOpen(false)}
            sx={{ borderColor: 'rgba(255,255,255,0.15)', color: 'text.secondary', borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => { setIntensity('hardcore'); setHardcoreWarningOpen(false); }}
            sx={{ bgcolor: '#EF1C1C', '&:hover': { bgcolor: '#CC1818' }, borderRadius: 2, fontWeight: 800 }}
          >
            Lock It In
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 98,
        zIndex: 9,
        px: 3,
        pointerEvents: 'none',
        opacity: showScrollCue ? 1 : 0,
        transform: showScrollCue ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 180ms ease, transform 180ms ease',
      }}>
        <Box sx={{
          mx: 'auto',
          width: 'fit-content',
          maxWidth: '100%',
          px: 1.4,
          py: 0.85,
          borderRadius: 999,
          bgcolor: 'rgba(10,10,22,0.88)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(14px)',
          display: 'flex',
          alignItems: 'center',
          gap: 0.6,
          boxShadow: '0 10px 30px rgba(0,0,0,0.28)',
        }}>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.86)' }}>
            Scroll for the rest of the required alarm settings
          </Typography>
          <KeyboardArrowDownIcon sx={{
            fontSize: '1rem',
            color: '#FF6B35',
            animation: 'scrollCueFloat 1.1s ease-in-out infinite',
            '@keyframes scrollCueFloat': {
              '0%,100%': { transform: 'translateY(0)' },
              '50%': { transform: 'translateY(3px)' },
            },
          }} />
        </Box>
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
        {!canSave && (
          <Box sx={{
            mb: 1.2,
            px: 1.2,
            py: 0.9,
            borderRadius: 2.5,
            bgcolor: 'rgba(255,209,102,0.09)',
            border: '1px solid rgba(255,209,102,0.2)',
          }}>
            <Typography sx={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#FFD166',
              textAlign: 'center',
            }}>
              {requirementMessage}
            </Typography>
          </Box>
        )}
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleSave}
          disabled={!canSave}
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
          <CheckIcon sx={{ mr:0.75, fontSize:'1.1rem' }}/>
          {canSave ? 'Set Alarm' : 'Choose All Required Settings'}
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
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
      <Box sx={{
        width: 3, height: 16, borderRadius: 2, flexShrink: 0,
        background: 'linear-gradient(180deg, #FF6B35, #FFD166)',
        boxShadow: '0 0 8px rgba(255,107,53,0.5)',
      }} />
      <Typography sx={{
        fontWeight: 700, color: 'rgba(255,255,255,0.5)',
        letterSpacing: '0.1em', fontSize: '0.6rem',
        textTransform: 'uppercase',
      }}>
        {children}
      </Typography>
    </Box>
  );
}

function Separator() {
  return (
    <Box sx={{ height: '1px', mx: 3, background: 'linear-gradient(90deg, rgba(255,107,53,0.08), rgba(255,255,255,0.04), transparent)' }} />
  );
}
