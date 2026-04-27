import { useEffect, useState } from 'react';
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
import { motion } from '../../lib/motion-lite';
import { useApp } from '../../context/AppContext';
import { ALARM_SOUNDS, previewAlarmSound } from '../../lib/sounds';
import { isNative, openRingtonePicker, previewSound as previewNativeSound } from '../../lib/nativeAlarms';
import TimePicker from '../common/TimePicker';

// ─── Static data ──────────────────────────────────────────────────────────────

const PAGE_TRANSITION = {
  initial:    { opacity: 0, x: 24 },
  animate:    { opacity: 1, x: 0 },
  exit:       { opacity: 0, x: -12 },
  transition: { duration: 0.28, ease: [0.32, 0.72, 0, 1] },
};

const INTENSITY = [
  { value: 'gentle',   Icon: SpaIcon,                   label: 'Gentle',   desc: '1 game · Easy mode',         xp: 20,  color: '#06D6A0' },
  { value: 'moderate', Icon: WhatshotIcon,               label: 'Moderate', desc: '2 games · Normal mode',       xp: 35,  color: '#FFD166' },
  { value: 'intense',  Icon: FlashOnIcon,                label: 'Intense',  desc: '3 games · Hard mode',         xp: 60,  color: '#EF476F' },
  { value: 'hardcore', Icon: LocalFireDepartmentIcon,    label: 'Hardcore', desc: 'Barcode scan · No escape',    xp: 100, color: '#EF1C1C' },
];

const GAMES = [
  { value: 'math',     Icon: CalculateIcon, label: 'Math Blitz',    desc: 'Arithmetic to dismiss',  color: '#FF6B35' },
  { value: 'memory',   Icon: StyleIcon,     label: 'Memory Match',  desc: 'Flip and match pairs',    color: '#FFD166' },
  { value: 'reaction', Icon: BoltIcon,      label: 'Reaction Rush', desc: 'Tap right on cue',        color: '#06D6A0' },
];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const SOUND_META = {
  gentle_chime: { Icon: MusicNoteIcon,         color: '#FFD166' },
  morning_birds:{ Icon: WavesIcon,             color: '#06D6A0' },
  soft_piano:   { Icon: GraphicEqIcon,         color: '#9AD1D4' },
  rising_bell:  { Icon: TrendingUpIcon,        color: '#8B5CF6' },
  classic_beep: { Icon: NotificationsActiveIcon,color: '#EF476F' },
  digital_buzz: { Icon: TuneIcon,              color: '#FF6B35' },
  urgent_ring:  { Icon: CampaignIcon,          color: '#F97316' },
  radar_pulse:  { Icon: RadioButtonCheckedIcon,color: '#06B6D4' },
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
  hardcore: 1,
};

const DIFFICULTY_LEVEL_BY_INTENSITY = {
  gentle: 1,
  moderate: 2,
  intense: 3,
  hardcore: 4,
};

const REPEAT_MODES = [
  { value: 'once',     label: 'Once' },
  { value: 'custom',   label: 'Custom' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'weekend',  label: 'Weekend' },
  { value: 'every',    label: 'Every day' },
];

function DifficultyDots({ level }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
      {Array.from({ length: 4 }).map((_, index) => {
        const filled = index < level;
        return (
          <span
            key={index}
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: filled ? '#FF6B35' : 'rgba(255,255,255,0.16)',
              boxShadow: filled ? '0 0 8px rgba(255,107,53,0.35)' : 'none',
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CreateAlarm() {
  const navigate = useNavigate();
  const { addAlarm, user } = useApp();

  const [hardcoreWarningOpen, setHardcoreWarningOpen] = useState(false);
  const [showScrollCue, setShowScrollCue] = useState(true);
  const [repeatMode, setRepeatMode] = useState('once');
  const [deviceSoundName, setDeviceSoundName] = useState('');
  const [soundPickerOpen, setSoundPickerOpen] = useState(false);

  const [form, setForm] = useState({
    label: '',
    time: user?.wakeTime || '07:00',
    days: [],
    sound: 'gentle_chime',
    pulse: { intensity: 'gentle', games: ['math'] },
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
        games: intensity === 'hardcore' ? ['barcode'] : [],
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

  async function handlePreviewSound(soundId) {
    if (isNative) {
      await previewNativeSound(soundId, 3000);
      return;
    }
    previewAlarmSound(soundId);
  }

  async function handlePickDeviceSound() {
    if (!isNative) return;
    const picked = await openRingtonePicker();
    if (!picked?.uri) return;

    setDeviceSoundName(picked.name || 'Device sound');
    setForm(f => ({
      ...f,
      sound: picked.uri,
    }));
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
  const selectedSoundLabel = form.sound?.startsWith('content://')
    ? deviceSoundName || 'Device sound'
    : ALARM_SOUNDS.find(s => s.id === form.sound)?.label || 'Required';
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
    <motion.div
      initial={PAGE_TRANSITION.initial}
      animate={PAGE_TRANSITION.animate}
      exit={PAGE_TRANSITION.exit}
      transition={PAGE_TRANSITION.transition}
      style={{ minHeight: '100dvh', willChange: 'transform, opacity' }}
    >
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <Background />

      <div style={{ position: 'relative', zIndex: 1, paddingBottom: '7rem' }}>
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-full active:scale-90 transition-transform touch-manipulation"
            style={{ color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.06)' }}
          >
            <ArrowBackIcon fontSize="small" />
          </button>
          <h6 className="text-lg font-semibold" style={{ fontWeight: 800 }}>New Alarm</h6>
        </div>

        {/* ── Time ─────────────────────────────────────────────────────────── */}
        <Section delay={0.04}>
          <SectionLabel>Time</SectionLabel>
          <TimePicker value={form.time} onChange={t => setForm(f => ({ ...f, time: t }))} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.1875rem', marginTop: '0.375rem', minHeight: 24 }}>
            {timeCtx ? (
              <>
                <timeCtx.Icon style={{ fontSize: '1rem', color: timeCtx.color, transition: 'color 0.3s' }} />
                <p className="text-sm" style={{ fontWeight: 600, color: timeCtx.color, transition: 'color 0.3s', margin: 0 }}>
                  {timeCtx.label}
                </p>
              </>
            ) : (
              <p className="text-sm" style={{ fontWeight: 600, color: 'rgba(255,255,255,0.38)', margin: 0 }}>
                Tap the clock to choose a wake-up time
              </p>
            )}
          </div>
        </Section>

        <Separator />

        {/* ── Label ────────────────────────────────────────────────────────── */}
        <Section delay={0.1}>
          <SectionLabel>Label</SectionLabel>
          <input
            type="text"
            placeholder="Morning routine, Gym, Work..."
            value={form.label}
            onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
            maxLength={40}
            className="input-field"
            style={{ marginTop: '0.5rem', width: '100%', fontSize: '1.3rem', fontWeight: 600 }}
          />
          <span
            className="text-xs"
            style={{
              display: 'block',
              textAlign: 'right',
              marginTop: '0.125rem',
              color: 'rgba(255,255,255,0.4)',
              opacity: form.label.length > 0 ? 1 : 0,
              transition: 'opacity 0.2s',
            }}
          >
            {form.label.length}/40
          </span>
        </Section>

        <Separator />

        {/* ── Sound ────────────────────────────────────────────────────────── */}
        <Section delay={0.12}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <SectionLabel>Alarm Sound</SectionLabel>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {selectedSoundLabel}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSoundPickerOpen(true)}
            style={{
              width: '100%',
              border: '1px solid rgba(255,209,102,0.26)',
              borderRadius: '1.15rem',
              background: 'rgba(255,209,102,0.09)',
              color: '#FFF5DF',
              padding: '0.95rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <NotificationsActiveIcon style={{ color: '#FFD166' }} />
              Alarm Sounds
            </span>
            <KeyboardArrowDownIcon style={{ color: 'rgba(255,255,255,0.55)', transform: 'rotate(-90deg)' }} />
          </button>
        </Section>

        {soundPickerOpen && (
          <SoundPickerCard
            selectedSound={form.sound}
            selectedSoundLabel={selectedSoundLabel}
            deviceSoundName={deviceSoundName}
            onClose={() => setSoundPickerOpen(false)}
            onSelect={sound => setForm(f => ({ ...f, sound }))}
            onPreview={() => handlePreviewSound(form.sound)}
            onPickDevice={handlePickDeviceSound}
            isNative={isNative}
          />
        )}

        <Separator />

        {/* ── Repeat ───────────────────────────────────────────────────────── */}
        <Section delay={0.15}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <SectionLabel>Repeat</SectionLabel>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {!repeatMode
                ? 'Required'
                : repeatMode === 'once'
                ? 'One-time alarm'
                : form.days.length === 0
                ? 'Choose day(s)'
                : form.days.length === 7
                ? 'Every day'
                : `${form.days.length} day${form.days.length > 1 ? 's' : ''}`}
            </span>
          </div>

          {/* Repeat mode selector */}
          <div style={{ marginTop: '0.5rem', marginBottom: '0.625rem', display: 'flex', justifyContent: 'center' }}>
            <div
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 999,
                padding: '0.2rem',
                display: 'flex',
                gap: '0.125rem',
              }}
            >
              {REPEAT_MODES.map(mode => (
                <button
                  key={mode.value}
                  onClick={() => applyRepeatMode(mode.value)}
                  style={{
                    border: 'none',
                    borderRadius: 999,
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: 0.2,
                    cursor: 'pointer',
                    transition: 'background-color 160ms ease, color 160ms ease, transform 120ms ease',
                    color: repeatMode === mode.value ? '#FF6B35' : 'rgba(255,255,255,0.55)',
                    background: repeatMode === mode.value ? 'rgba(255,107,53,0.14)' : 'transparent',
                    boxShadow: repeatMode === mode.value ? '0 8px 18px rgba(255,107,53,0.12)' : 'none',
                  }}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* Day circles (custom) */}
          <div style={{ display: 'flex', gap: '0.25rem', opacity: repeatMode !== 'custom' ? 0.45 : 1, transition: 'opacity 180ms ease' }}>
            <div className="flex gap-1.5 flex-wrap" style={{ width: '100%', justifyContent: 'space-between' }}>
              {DAY_LABELS.map((day, i) => (
                <button
                  key={i}
                  onClick={() => repeatMode === 'custom' && toggleDay(i)}
                  disabled={repeatMode !== 'custom'}
                  className={`w-9 h-9 rounded-full text-xs font-bold touch-manipulation transition-all active:scale-90 ${
                    form.days.includes(i)
                      ? 'bg-primary text-white'
                      : 'bg-white/8 text-muted'
                  }`}
                  style={{
                    border: form.days.includes(i) ? '1.5px solid #FF6B35' : '1.5px solid rgba(255,255,255,0.08)',
                    background: form.days.includes(i) ? 'rgba(255,107,53,0.9)' : 'rgba(255,255,255,0.05)',
                    color: form.days.includes(i) ? '#fff' : 'rgba(255,255,255,0.55)',
                    boxShadow: form.days.includes(i) ? '0 10px 22px rgba(255,107,53,0.22)' : 'none',
                    cursor: repeatMode !== 'custom' ? 'default' : 'pointer',
                    flex: 1,
                    minWidth: 0,
                    aspectRatio: '1',
                  }}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
          {repeatMode === 'custom' && form.days.length === 0 && (
            <span className="text-xs" style={{ color: '#FFD166', display: 'block', marginTop: '0.275rem' }}>
              Pick at least one day for a custom repeat.
            </span>
          )}
        </Section>

        <Separator />

        {/* ── Intensity ────────────────────────────────────────────────────── */}
        <Section delay={0.2}>
          <SectionLabel>Wake-up Intensity</SectionLabel>
          {!form.pulse.intensity && (
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)', marginTop: '0.1875rem', marginBottom: 0 }}>
              Choose how tough this alarm should be.
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginTop: '0.625rem' }}>
            {INTENSITY.map((opt, i) => {
              const selected = form.pulse.intensity === opt.value;
              return (
                <div
                  key={opt.value}
                  style={{
                    animation: `intIn 0.4s ease ${i * 0.08}s both`,
                  }}
                >
                  <style>{`@keyframes intIn { from { opacity: 0; transform: translateX(-14px); } to { opacity: 1; transform: translateX(0); } }`}</style>
                  <button
                    onClick={() => {
                      if (opt.value === 'hardcore') {
                        setHardcoreWarningOpen(true);
                      } else {
                        setIntensity(opt.value);
                      }
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all touch-manipulation active:scale-95 w-full text-left ${
                      selected
                        ? 'border-primary bg-primary/10'
                        : 'border-white/10 bg-white/5'
                    }`}
                    style={{
                      padding: '0.625rem',
                      borderRadius: '0.75rem',
                      cursor: 'pointer',
                      border: selected ? `1.5px solid ${opt.color}55` : '1.5px solid rgba(255,255,255,0.07)',
                      background: selected ? `${opt.color}0D` : 'rgba(255,255,255,0.03)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'border-color 0.22s ease, background-color 0.22s ease, box-shadow 0.22s ease, transform 0.22s cubic-bezier(0.34,1.56,0.64,1)',
                      transform: selected ? 'scale(1.02)' : 'scale(1)',
                      boxShadow: selected ? `0 12px 26px ${opt.color}18` : 'none',
                      width: '100%',
                      textAlign: 'left',
                    }}
                  >
                    <div
                      style={{
                        width: 50, height: 50, borderRadius: '0.75rem', flexShrink: 0,
                        background: `${opt.color}18`, border: `1px solid ${opt.color}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <opt.Icon style={{ fontSize: '1.9rem', color: opt.color }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, color: selected ? opt.color : 'rgba(255,255,255,0.9)', margin: 0 }}>
                        {opt.label}
                      </p>
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{opt.desc}</span>
                    </div>
                    <div
                      style={{
                        padding: '0.0875rem 0.3125rem', borderRadius: '0.375rem', flexShrink: 0,
                        background: `${opt.color}20`, color: opt.color,
                        fontSize: '0.68rem', fontWeight: 800,
                      }}
                    >
                      +{opt.xp} XP
                    </div>
                    <DifficultyDots level={DIFFICULTY_LEVEL_BY_INTENSITY[opt.value] ?? 0} />
                  </button>
                </div>
              );
            })}
          </div>
        </Section>

        <Separator />

        {/* ── Games ────────────────────────────────────────────────────────── */}
        {form.pulse.intensity !== 'hardcore' && (
        <Section delay={0.26}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <SectionLabel>Wake-Up Games</SectionLabel>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {requiredGameCount ? `${form.pulse.games.length}/${requiredGameCount} selected` : 'Choose intensity first'}
            </span>
          </div>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)', marginTop: '0.125rem', marginBottom: '0.125rem' }}>
            {requiredGameCount
              ? `Choose ${requiredGameCount} game${requiredGameCount > 1 ? 's' : ''}. All selected games must be completed to dismiss.`
              : 'Pick an intensity first so we know how many games this alarm requires.'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginTop: '0.5rem' }}>
            {GAMES.map((game, i) => {
              const selected = form.pulse.games.includes(game.value);
              const disabled = !requiredGameCount;
              return (
                <button
                  key={game.value}
                  onClick={() => !disabled && toggleGame(game.value)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all touch-manipulation active:scale-95 w-full text-left ${
                    selected
                      ? 'border-primary bg-primary/10'
                      : 'border-white/10 bg-white/5'
                  }`}
                  style={{
                    padding: '0.625rem',
                    borderRadius: '0.75rem',
                    cursor: disabled ? 'default' : 'pointer',
                    border: selected ? `1.5px solid ${game.color}55` : '1.5px solid rgba(255,255,255,0.07)',
                    background: selected ? `${game.color}0D` : 'rgba(255,255,255,0.03)',
                    display: 'flex', alignItems: 'center', gap: '0.625rem',
                    transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
                    transform: selected ? 'scale(1.01)' : 'scale(1)',
                    opacity: disabled ? 0.45 : 1,
                    animation: `gameCardIn 0.4s ease ${i * 0.09}s both`,
                    width: '100%',
                    textAlign: 'left',
                  }}
                >
                  <style>{`@keyframes gameCardIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }`}</style>
                  <div
                    style={{
                      width: 52, height: 52, borderRadius: '0.75rem', flexShrink: 0,
                      background: `${game.color}18`, border: `1px solid ${game.color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <game.Icon style={{ fontSize: '1.9rem', color: game.color }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, color: 'rgba(255,255,255,0.9)', margin: 0 }}>{game.label}</p>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{game.desc}</span>
                  </div>
                  <div
                    style={{
                      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                      border: selected ? `2px solid ${game.color}` : '2px solid rgba(255,255,255,0.15)',
                      background: selected ? game.color : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}
                  >
                    {selected && <CheckIcon style={{ fontSize: 13, color: '#fff' }} />}
                  </div>
                </button>
              );
            })}
          </div>
          {requiredGameCount > 0 && !gamesComplete && (
            <span className="text-xs" style={{ color: '#FFD166', display: 'block', marginTop: '0.275rem' }}>
              Choose {requiredGameCount} game{requiredGameCount > 1 ? 's' : ''} to finish this alarm setup.
            </span>
          )}
        </Section>
        )}
      </div>

      {/* Hardcore Warning Dialog */}
      {hardcoreWarningOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(6px)',
            padding: '0 1.25rem',
          }}
          onClick={() => setHardcoreWarningOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 400,
              background: 'linear-gradient(160deg, #1C0606 0%, #220A0A 100%)',
              border: '1.5px solid rgba(239,28,28,0.3)',
              borderRadius: '1.375rem',
              padding: '1.75rem 1.5rem 1.5rem',
              boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(239,28,28,0.08)',
            }}
          >
            {/* Icon */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'rgba(239,28,28,0.12)',
                border: '2px solid rgba(239,28,28,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <LocalFireDepartmentIcon style={{ color: '#EF1C1C', fontSize: '2rem' }} />
              </div>
            </div>

            {/* Title */}
            <p style={{ fontWeight: 900, fontSize: '1.25rem', color: '#fff', textAlign: 'center', margin: '0 0 0.75rem' }}>
              Are you sure?
            </p>

            {/* Body */}
            <p style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.75, textAlign: 'center', fontSize: '0.875rem', margin: '0 0 1.5rem' }}>
              <strong style={{ color: '#EF4444' }}>Hardcore Mode</strong> forces{' '}
              <strong style={{ color: '#fff' }}>maximum volume</strong> and locks your phone
              to this app until any barcode is scanned with the phone camera. There is{' '}
              <strong style={{ color: '#EF4444' }}>no way out</strong>.
            </p>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setHardcoreWarningOpen(false)}
                style={{
                  flex: 1, padding: '0.8rem',
                  borderRadius: '0.75rem',
                  fontWeight: 700, fontSize: '0.95rem',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1.5px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.6)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => { setIntensity('hardcore'); setHardcoreWarningOpen(false); }}
                style={{
                  flex: 1, padding: '0.8rem',
                  borderRadius: '0.75rem',
                  fontWeight: 800, fontSize: '0.95rem',
                  background: 'linear-gradient(135deg, #EF1C1C 0%, #B01010 100%)',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(239,28,28,0.4)',
                }}
              >
                Lock It In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scroll cue */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 98,
          zIndex: 9,
          padding: '0 0.75rem',
          pointerEvents: 'none',
          opacity: showScrollCue ? 1 : 0,
          transform: showScrollCue ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 180ms ease, transform 180ms ease',
        }}
      >
        <div
          style={{
            margin: '0 auto',
            width: 'fit-content',
            maxWidth: '100%',
            padding: '0.2125rem 0.35rem',
            borderRadius: 999,
            background: 'rgba(10,10,22,0.88)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(14px)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.15rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.28)',
          }}
        >
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.86)' }}>
            Scroll for the rest of the required alarm settings
          </span>
          <KeyboardArrowDownIcon
            style={{
              fontSize: '1rem',
              color: '#FF6B35',
              animation: 'scrollCueFloat 1.1s ease-in-out infinite',
            }}
          />
          <style>{`@keyframes scrollCueFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(3px); } }`}</style>
        </div>
      </div>

      {/* Fixed save button */}
      <div
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          padding: '0.5rem 0.75rem 1rem',
          background: 'rgba(13,13,26,0.92)',
          backdropFilter: 'blur(14px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          zIndex: 10,
        }}
      >
        {!canSave && (
          <div
            style={{
              marginBottom: '0.3rem',
              padding: '0.225rem 0.3rem',
              borderRadius: '0.625rem',
              background: 'rgba(255,209,102,0.09)',
              border: '1px solid rgba(255,209,102,0.2)',
            }}
          >
            <p
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#FFD166',
                textAlign: 'center',
                margin: 0,
              }}
            >
              {requirementMessage}
            </p>
          </div>
        )}
        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={!canSave}
          style={{
            width: '100%',
            padding: '0.4375rem 0',
            fontWeight: 700,
            borderRadius: '0.75rem',
            fontSize: '1rem',
            background: canSave ? 'linear-gradient(135deg, #FF6B35 0%, #FF8C5A 100%)' : undefined,
            boxShadow: canSave ? '0 8px 32px rgba(255,107,53,0.3)' : undefined,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.1875rem',
          }}
        >
          <CheckIcon style={{ marginRight: '0.1875rem', fontSize: '1.1rem' }} />
          {canSave ? 'Set Alarm' : 'Choose All Required Settings'}
        </button>
      </div>
    </div>
    </motion.div>
  );
}

// ─── Background ───────────────────────────────────────────────────────────────

function Background() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #08081A 0%, #14082A 55%, #0D0D1A 100%)' }} />
      <div
        style={{
          position: 'absolute', width: 420, height: 420, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,107,53,0.11) 0%, transparent 70%)',
          top: -110, right: -110, filter: 'blur(55px)',
          animation: 'caOrb1 13s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes caOrb1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-20px,18px) scale(1.05); } }
        @keyframes caOrb2 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(22px,-22px); } }
      `}</style>
      <div
        style={{
          position: 'absolute', width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(120,40,220,0.09) 0%, transparent 70%)',
          bottom: '35%', left: -90, filter: 'blur(50px)',
          animation: 'caOrb2 16s ease-in-out infinite',
        }}
      />
    </div>
  );
}

// ─── Layout helpers ───────────────────────────────────────────────────────────

function SoundPickerCard({
  selectedSound,
  selectedSoundLabel,
  deviceSoundName,
  onClose,
  onSelect,
  onPreview,
  onPickDevice,
  isNative,
}) {
  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        background: 'rgba(5,5,14,0.78)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'flex-end',
        padding: '0.85rem',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 480,
          margin: '0 auto',
          maxHeight: 'min(82vh, 680px)',
          overflowY: 'auto',
          borderRadius: '1.35rem',
          background: 'linear-gradient(180deg, #1E2636 0%, #121827 100%)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 24px 70px rgba(0,0,0,0.62)',
          padding: '0.95rem',
        }}
      >
        <div style={{ width: 42, height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.16)', margin: '0 auto 0.9rem' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '0.9rem' }}>
          <div>
            <div style={{ color: '#FFF5DF', fontSize: '1.08rem', fontWeight: 900 }}>Alarm Sounds</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.76rem' }}>{selectedSoundLabel}</div>
          </div>
          <button type="button" onClick={onPreview} style={soundPreviewButtonStyle}>
            <PlayArrowIcon style={{ fontSize: '1rem' }} /> Preview
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.45rem' }}>
          {ALARM_SOUNDS.map(sound => {
            const meta = SOUND_META[sound.id];
            const selected = selectedSound === sound.id;
            return (
              <button
                type="button"
                key={sound.id}
                onClick={() => onSelect(sound.id)}
                style={{
                  borderRadius: '0.95rem',
                  border: selected ? `1.5px solid ${meta.color}` : '1px solid rgba(255,255,255,0.08)',
                  background: selected ? `linear-gradient(135deg, ${meta.color}22, rgba(255,255,255,0.035))` : 'rgba(255,255,255,0.045)',
                  color: '#FFF5DF',
                  padding: '0.72rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.72rem',
                  textAlign: 'left',
                  cursor: 'pointer',
                  boxShadow: selected ? `0 8px 22px ${meta.color}18` : 'none',
                }}
              >
                <span
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: selected ? `${meta.color}22` : 'rgba(255,255,255,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <meta.Icon style={{ fontSize: '1.15rem', color: selected ? meta.color : 'rgba(255,255,255,0.45)' }} />
                </span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: 850 }}>{sound.label}</span>
                  <span style={{ display: 'block', fontSize: '0.68rem', color: 'rgba(255,255,255,0.48)' }}>{sound.desc}</span>
                </span>
                {selected && (
                  <span style={{ marginLeft: 'auto', width: 20, height: 20, borderRadius: '50%', background: meta.color, color: '#fff', display: 'grid', placeItems: 'center', fontSize: '0.75rem', fontWeight: 900 }}>
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onPickDevice}
          disabled={!isNative}
          style={{
            marginTop: '0.75rem',
            width: '100%',
            borderRadius: '1rem',
            border: selectedSound?.startsWith('content://')
              ? '1.5px solid rgba(255,209,102,0.45)'
              : '1.5px solid rgba(255,255,255,0.08)',
            background: selectedSound?.startsWith('content://')
              ? 'rgba(255,209,102,0.10)'
              : 'rgba(255,255,255,0.04)',
            color: '#fff',
            padding: '0.875rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            cursor: isNative ? 'pointer' : 'not-allowed',
            opacity: isNative ? 1 : 0.55,
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left' }}>
            <span style={deviceSoundIconStyle}>
              <NotificationsActiveIcon style={{ color: '#FFD166' }} />
            </span>
            <span>
              <span style={{ display: 'block', fontSize: '0.92rem', fontWeight: 800 }}>Choose from device</span>
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)' }}>
                {selectedSound?.startsWith('content://')
                  ? deviceSoundName || 'Selected from Android ringtone library'
                  : isNative
                  ? 'Use any ringtone or alarm sound on this phone'
                  : 'Available on Android'}
              </span>
            </span>
          </span>
          <KeyboardArrowDownIcon style={{ color: 'rgba(255,255,255,0.45)', transform: 'rotate(-90deg)' }} />
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.65rem', marginTop: '0.75rem' }}>
          <button type="button" onClick={onClose} style={soundDoneButtonStyle}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

const soundPreviewButtonStyle = {
  border: '1px solid rgba(255,107,53,0.4)',
  borderRadius: '999px',
  background: 'rgba(255,107,53,0.12)',
  color: '#FF6B35',
  padding: '0.5rem 0.78rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.35rem',
  fontWeight: 800,
  flexShrink: 0,
};

const deviceSoundIconStyle = {
  width: 42,
  height: 42,
  borderRadius: '0.9rem',
  background: 'rgba(255,209,102,0.12)',
  border: '1px solid rgba(255,209,102,0.24)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const soundDoneButtonStyle = {
  marginTop: '0.75rem',
  width: '100%',
  border: 0,
  borderRadius: '1rem',
  background: '#FF6B35',
  color: '#fff',
  padding: '0.9rem',
  fontWeight: 900,
};

function Section({ children, delay = 0 }) {
  return (
    <div
      style={{
        padding: '0.75rem',
        animation: `secIn 0.45s ease ${delay}s both`,
      }}
    >
      <style>{`@keyframes secIn { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      {children}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3125rem' }}>
      <div
        style={{
          width: 3, height: 16, borderRadius: 2, flexShrink: 0,
          background: 'linear-gradient(180deg, #FF6B35, #FFD166)',
          boxShadow: '0 0 8px rgba(255,107,53,0.5)',
        }}
      />
      <span
        style={{
          fontWeight: 700, color: 'rgba(255,255,255,0.5)',
          letterSpacing: '0.1em', fontSize: '0.6rem',
          textTransform: 'uppercase',
        }}
      >
        {children}
      </span>
    </div>
  );
}

function Separator() {
  return (
    <div style={{ height: '1px', margin: '0 0.75rem', background: 'linear-gradient(90deg, rgba(255,107,53,0.08), rgba(255,255,255,0.04), transparent)' }} />
  );
}
