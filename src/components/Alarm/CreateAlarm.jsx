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

const REPEAT_MODES = [
  { value: 'once',     label: 'Once' },
  { value: 'custom',   label: 'Custom' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'weekend',  label: 'Weekend' },
  { value: 'every',    label: 'Every day' },
];

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
              {ALARM_SOUNDS.find(s => s.id === form.sound)?.label || 'Required'}
            </span>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '0.375rem',
            }}
          >
            {ALARM_SOUNDS.map(sound => {
              const meta     = SOUND_META[sound.id];
              const selected = form.sound === sound.id;
              return (
                <div
                  key={sound.id}
                  onClick={() => setForm(f => ({ ...f, sound: sound.id }))}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.1875rem',
                    cursor: 'pointer', userSelect: 'none',
                  }}
                >
                  {/* Icon circle */}
                  <div
                    style={{
                      width: 52, height: 52, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'relative',
                      border: selected
                        ? `2px solid ${meta.color}`
                        : '2px solid rgba(255,255,255,0.08)',
                      background: selected ? `${meta.color}18` : 'rgba(255,255,255,0.04)',
                      boxShadow: selected ? `0 0 14px ${meta.color}44` : 'none',
                      transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                      transform: selected ? 'scale(1.1)' : 'scale(1)',
                    }}
                  >
                    <meta.Icon style={{ fontSize: '1.4rem', color: selected ? meta.color : 'rgba(255,255,255,0.3)' }} />
                    {/* Preview play button — shown on selected */}
                    {selected && (
                      <div
                        onClick={e => { e.stopPropagation(); previewAlarmSound(sound.id); }}
                        style={{
                          position: 'absolute', bottom: -4, right: -4,
                          width: 20, height: 20, borderRadius: '50%',
                          background: meta.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: `0 2px 8px ${meta.color}66`,
                          transition: 'transform 0.15s',
                          cursor: 'pointer',
                        }}
                      >
                        <PlayArrowIcon style={{ fontSize: '0.75rem', color: '#fff' }} />
                      </div>
                    )}
                  </div>
                  {/* Label */}
                  <span
                    style={{
                      fontSize: '0.6rem', fontWeight: selected ? 700 : 500,
                      color: selected ? meta.color : 'rgba(255,255,255,0.35)',
                      textAlign: 'center', letterSpacing: 0.2,
                      transition: 'color 0.2s',
                    }}
                  >
                    {sound.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Section>

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
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
          onClick={() => setHardcoreWarningOpen(false)}
        >
          <div
            className="bg-card rounded-t-3xl w-full max-w-[480px] p-6"
            onClick={e => e.stopPropagation()}
            style={{
              background: '#1A0808',
              border: '1.5px solid rgba(239,28,28,0.4)',
              borderRadius: '1rem',
              margin: '0 0.5rem',
            }}
          >
            <h3 className="text-lg font-bold mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', paddingBottom: '0.25rem' }}>
              <LocalFireDepartmentIcon style={{ color: '#EF1C1C', fontSize: '1.8rem' }} />
              <span style={{ fontWeight: 900, fontSize: '1.15rem' }}>Are you sure?</span>
            </h3>
            <div className="mb-4">
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
                <strong style={{ color: '#EF1C1C' }}>Hardcore Mode</strong> forces{' '}
                <strong>maximum volume</strong> and locks your phone to this app until all 3 games
                are completed. There is <strong>no way out</strong>.
              </p>
            </div>
            <div className="flex gap-3 justify-end mt-4">
              <button
                className="btn-outline"
                onClick={() => setHardcoreWarningOpen(false)}
                style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', borderRadius: '0.5rem' }}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={() => { setIntensity('hardcore'); setHardcoreWarningOpen(false); }}
                style={{ background: '#EF1C1C', borderRadius: '0.5rem', fontWeight: 800 }}
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
