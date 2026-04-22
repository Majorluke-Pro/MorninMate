import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from '../../lib/motion-lite';
import { Box, Typography, Button, TextField, IconButton, CircularProgress, Alert } from '../../lib/ui-lite';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import AlarmIcon from '@mui/icons-material/Alarm';
import PersonIcon from '@mui/icons-material/Person';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import EmojiPeopleIcon from '@mui/icons-material/EmojiPeople';
import CalculateIcon from '@mui/icons-material/Calculate';
import StyleIcon from '@mui/icons-material/Style';
import BoltIcon from '@mui/icons-material/Bolt';
import NightsStayIcon from '@mui/icons-material/NightsStay';
import SnoozeIcon from '@mui/icons-material/Snooze';
import DragHandleIcon from '@mui/icons-material/DragHandle';
import WbTwilightIcon from '@mui/icons-material/WbTwilight';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import FaceIcon from '@mui/icons-material/Face';
import { useApp } from '../../context/AppContext';
import { AVATAR_OPTIONS } from '../../lib/avatars';
import TimePicker from '../common/TimePicker';

const MORNING_TYPES = [
  { value: 1, Icon: NightsStayIcon, label: 'Night Owl', desc: 'Mornings are your nemesis' },
  { value: 2, Icon: SnoozeIcon, label: 'Slow Starter', desc: 'Need a few coffees to function' },
  { value: 3, Icon: DragHandleIcon, label: 'In Between', desc: 'Neither early nor late' },
  { value: 4, Icon: WbTwilightIcon, label: 'Early Bird', desc: 'You enjoy the quiet morning' },
  { value: 5, Icon: FlashOnIcon, label: 'Morning Person', desc: 'Up at 5am, annoyingly alive' },
];

const GAMES = [
  { value: 'math', Icon: CalculateIcon, label: 'Math Blitz', desc: 'Solve quick arithmetic to dismiss', tag: 'Brain' },
  { value: 'memory', Icon: StyleIcon, label: 'Memory Match', desc: 'Flip and match emoji pairs', tag: 'Visual' },
  { value: 'reaction', Icon: BoltIcon, label: 'Reaction Rush', desc: 'Tap right on cue — no cheating', tag: 'Reflex' },
];

const GOAL_PRESETS = [
  { Icon: FitnessCenterIcon, label: 'Gym session' },
  { Icon: MenuBookIcon, label: 'Study time' },
  { Icon: SelfImprovementIcon, label: 'Meditate' },
  { Icon: LocalCafeIcon, label: 'Slow morning' },
  { Icon: DirectionsRunIcon, label: 'Morning run' },
  { Icon: HistoryEduIcon, label: 'Journaling' },
];

const STEP_IDS = ['welcome', 'name', 'avatar', 'wakeTime', 'morningType', 'game', 'goal', 'summary'];

const pageVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

const pageTransition = { type: 'tween', duration: 0.18, ease: 'easeOut' };

function DotsProgress({ step, totalSteps }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', py: 2 }}>
      {Array.from({ length: totalSteps }).map((_, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <Box
            key={i}
            sx={{
              width: active ? 8 : 6,
              height: active ? 8 : 6,
              borderRadius: '50%',
              bgcolor: done || active ? '#FF6B35' : '#1f2937',
              boxShadow: active ? '0 0 8px rgba(255,107,53,0.6)' : 'none',
              transition: 'all 0.2s ease',
              flexShrink: 0,
            }}
          />
        );
      })}
    </Box>
  );
}

function StepHeader({ Icon, title, subtitle, eyebrow }) {
  return (
    <Box sx={{ mb: 2 }}>
      {eyebrow && (
        <Box
          sx={{
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color: '#FF6B35',
            mb: 0.75,
            fontFamily: '"Outfit", sans-serif',
          }}
        >
          {eyebrow}
        </Box>
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.75 }}>
        {Icon && (
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              bgcolor: '#FF6B35',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon sx={{ fontSize: '1.1rem', color: 'white' }} />
          </Box>
        )}
        <Box sx={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: '"Fraunces", serif', color: '#f9fafb', lineHeight: 1.25 }}>
          {title}
        </Box>
      </Box>
      {subtitle && (
        <Box sx={{ fontSize: '0.85rem', color: '#6b7280', fontFamily: '"Outfit", sans-serif', lineHeight: 1.55 }}>
          {subtitle}
        </Box>
      )}
    </Box>
  );
}

function WelcomeStep() {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: 'easeOut' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 2, py: 2 }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: '18px',
            background: 'linear-gradient(135deg, #FF6B35, #FFD166)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <WbSunnyIcon sx={{ fontSize: '1.8rem', color: 'white' }} />
        </Box>

        <Box>
          <Box sx={{ fontFamily: '"Fraunces", serif', fontSize: 'clamp(2rem, 8vw, 2.6rem)', fontWeight: 700, color: '#f9fafb', lineHeight: 1.1, mb: 1 }}>
            Wake up.
            <br />
            <Box component="span" sx={{ color: '#FF6B35' }}>
              Level up.
            </Box>
          </Box>
          <Box sx={{ fontSize: '0.9rem', color: '#6b7280', fontFamily: '"Outfit", sans-serif', lineHeight: 1.6, maxWidth: 260, mx: 'auto' }}>
            Earn XP, build streaks, and actually wake up one game at a time.
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { Icon: SportsEsportsIcon, label: 'Mini-games' },
            { Icon: EmojiObjectsIcon, label: 'XP & Levels' },
            { Icon: FlashOnIcon, label: 'Streaks' },
          ].map(({ Icon, label }) => (
            <Box
              key={label}
              sx={{
                px: 1.75,
                py: 0.75,
                borderRadius: 20,
                background: '#111827',
                border: '1px solid #2d3748',
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
              }}
            >
              <Icon sx={{ fontSize: 13, color: '#FF6B35' }} />
              <Box sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#9ca3af', fontFamily: '"Outfit", sans-serif' }}>
                {label}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </motion.div>
  );
}

function NameStep({ value, onChange, onSubmit }) {
  const [focused, setFocused] = useState(false);

  return (
    <Box>
      <StepHeader Icon={PersonIcon} eyebrow="Step 2" title="What's your name?" subtitle="We'll personalise your experience" />
      <Box
        sx={{
          background: '#111827',
          border: `1px solid ${focused ? '#FF6B35' : '#2d3748'}`,
          borderRadius: '12px',
          px: 2,
          py: 1.75,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          transition: 'border-color 0.15s',
        }}
      >
        <PersonIcon sx={{ color: focused ? '#FF6B35' : '#6b7280', fontSize: '1.2rem', flexShrink: 0, transition: 'color 0.15s' }} />
        <Box
          component="input"
          autoFocus
          autoComplete="off"
          placeholder="Enter your name..."
          value={value}
          maxLength={30}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
          sx={{
            flex: 1,
            background: 'none',
            border: 'none',
            outline: 'none',
            color: '#f9fafb',
            caretColor: '#FF6B35',
            fontSize: '1.2rem',
            fontWeight: 600,
            fontFamily: '"Fraunces", serif',
            '&::placeholder': {
              color: '#4b5563',
              fontWeight: 400,
              fontFamily: '"Outfit", sans-serif',
              fontSize: '1rem',
            },
          }}
        />
      </Box>
    </Box>
  );
}

function AvatarStep({ value, onChange }) {
  return (
    <Box>
      <StepHeader Icon={FaceIcon} eyebrow="Step 3" title="Pick your profile icon" subtitle="This shows up on your home screen" />
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.5 }}>
        {AVATAR_OPTIONS.map((opt) => {
          const selected = value === opt.value;
          return (
            <Box
              key={opt.value}
              onClick={() => onChange(opt.value)}
              sx={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75 }}
            >
              <Box
                sx={{
                  width: 54,
                  height: 54,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: selected ? `${opt.color}18` : '#111827',
                  border: `1px solid ${selected ? opt.color : '#2d3748'}`,
                  transition: 'all 0.15s',
                }}
              >
                <opt.Icon sx={{ fontSize: '1.45rem', color: selected ? opt.color : '#6b7280', transition: 'color 0.15s' }} />
              </Box>
              <Box sx={{ fontSize: '0.6rem', fontWeight: selected ? 700 : 500, fontFamily: '"Outfit", sans-serif', color: selected ? opt.color : '#6b7280', textAlign: 'center', transition: 'color 0.15s' }}>
                {opt.label}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function WakeTimeStep({ value, onChange }) {
  return (
    <Box>
      <StepHeader Icon={AlarmIcon} eyebrow="Step 4" title="When do you wake up?" subtitle="Use the same clock picker as your alarm setup" />
      <TimePicker value={value} onChange={onChange} />
    </Box>
  );
}

function MorningTypeStep({ value, onChange }) {
  return (
    <Box>
      <StepHeader Icon={EmojiPeopleIcon} eyebrow="Step 5" title="What kind of morning person are you?" subtitle="Be honest — this shapes your experience" />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
        {MORNING_TYPES.map((type) => {
          const selected = value === type.value;
          return (
            <Box
              key={type.value}
              onClick={() => onChange(type.value)}
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
                <type.Icon sx={{ fontSize: '1.1rem', color: selected ? '#FF6B35' : '#6b7280' }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ fontWeight: 600, fontSize: '0.9rem', fontFamily: '"Outfit", sans-serif', color: selected ? '#f9fafb' : '#d1d5db' }}>
                  {type.label}
                </Box>
                <Box sx={{ fontSize: '0.75rem', color: '#6b7280', fontFamily: '"Outfit", sans-serif' }}>
                  {type.desc}
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

function GameStep({ value, onChange }) {
  return (
    <Box>
      <StepHeader Icon={SportsEsportsIcon} eyebrow="Step 6" title="Pick your wake-up game" subtitle="This is how you'll prove you're actually awake" />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
        {GAMES.map((game) => {
          const selected = value === game.value;
          return (
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
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, bgcolor: selected ? '#FF6B35' : 'transparent', border: `2px solid ${selected ? '#FF6B35' : '#4b5563'}`, transition: 'all 0.15s' }} />
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
          );
        })}
      </Box>
    </Box>
  );
}

function GoalStep({ value, onChange }) {
  return (
    <Box>
      <StepHeader Icon={TrackChangesIcon} eyebrow="Step 7" title="What's your morning goal?" subtitle="What gets you out of bed? It shows on your home screen" />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2, mt: 1 }}>
        {GOAL_PRESETS.map((preset) => {
          const selected = value === preset.label;
          return (
            <Box
              key={preset.label}
              onClick={() => onChange(selected ? '' : preset.label)}
              sx={{
                px: 1.75,
                py: 0.85,
                borderRadius: 20,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                background: selected ? 'rgba(255,107,53,0.08)' : '#111827',
                border: `1px solid ${selected ? '#FF6B35' : '#2d3748'}`,
                transition: 'all 0.15s',
              }}
            >
              <preset.Icon sx={{ fontSize: '1rem', color: selected ? '#FF6B35' : '#6b7280' }} />
              <Box sx={{ fontSize: '0.85rem', fontWeight: selected ? 700 : 500, fontFamily: '"Outfit", sans-serif', color: selected ? '#FF6B35' : '#9ca3af' }}>
                {preset.label}
              </Box>
            </Box>
          );
        })}
      </Box>
      <TextField
        fullWidth
        placeholder="Or describe your own goal..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        size="small"
        inputProps={{ maxLength: 60 }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            fontFamily: '"Outfit", sans-serif',
            background: '#111827',
            '& fieldset': { borderColor: '#2d3748' },
            '&:hover fieldset': { borderColor: '#4b5563' },
            '&.Mui-focused fieldset': { borderColor: '#FF6B35' },
          },
        }}
      />
      <Box sx={{ mt: 0.75, textAlign: 'right', fontSize: '0.72rem', color: '#4b5563', fontFamily: '"Outfit", sans-serif' }}>
        {value.length}/60
      </Box>
    </Box>
  );
}

function SummaryStep({ data }) {
  const morningType = MORNING_TYPES.find((t) => t.value === data.morningRating);
  const game = GAMES.find((g) => g.value === data.favoriteGame);
  const avatar = AVATAR_OPTIONS.find((a) => a.value === data.profileIcon);
  const [h, m] = data.wakeTime.split(':').map(Number);
  const formattedTime = `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;

  const rows = [
    { label: 'Icon', value: avatar?.label ?? '—' },
    { label: 'Wake time', value: formattedTime },
    { label: 'Morning type', value: morningType?.label ?? '—' },
    { label: 'Wake-up game', value: game?.label ?? '—' },
    { label: 'Morning goal', value: data.wakeGoal || '—' },
  ];

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Box sx={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#FF6B35', mb: 0.5, fontFamily: '"Outfit", sans-serif' }}>
          All set
        </Box>
        <Box sx={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: '"Fraunces", serif', color: '#f9fafb', mb: 0.5 }}>
          Here's your profile, {data.name}
        </Box>
        <Box sx={{ fontSize: '0.85rem', color: '#6b7280', fontFamily: '"Outfit", sans-serif' }}>
          Everything looks good. Create your account below.
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {rows.map((row) => (
          <Box
            key={row.label}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              p: '10px 14px',
              borderRadius: '10px',
              background: '#111827',
              border: '1px solid #1f2937',
            }}
          >
            <Box sx={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.8px', fontFamily: '"Outfit", sans-serif' }}>
              {row.label}
            </Box>
            <Box sx={{ fontSize: '13px', fontWeight: 600, color: '#f9fafb', fontFamily: '"Outfit", sans-serif', textAlign: 'right' }}>
              {row.value}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default function OnboardingFlow() {
  const { session, completeOnboarding, setPendingOnboarding, setShowAuthDirectly } = useApp();
  const [step, setStep] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [data, setData] = useState({
    name: '',
    wakeTime: '07:00',
    morningRating: 3,
    favoriteGame: 'math',
    wakeGoal: '',
    profileIcon: 'bolt',
  });

  const currentId = STEP_IDS[step];
  const isWelcome = currentId === 'welcome';

  useEffect(() => {
    setSaveError('');
  }, [step]);

  function go(delta) {
    setStep((s) => s + delta);
    setAnimKey((k) => k + 1);
  }

  async function handleNext() {
    if (currentId === 'summary') {
      if (session || !navigator.onLine) {
        setSaving(true);
        setSaveError('');
        try {
          await completeOnboarding(data);
        } catch {
          setSaveError('Failed to save. Please try again.');
          setSaving(false);
        }
      } else {
        setPendingOnboarding(data);
      }
      return;
    }
    go(1);
  }

  function canProceed() {
    if (currentId === 'name') return data.name.trim().length >= 2;
    if (currentId === 'goal') return data.wakeGoal.trim().length > 0;
    return true;
  }

  function handleButtonClick() {
    if (!canProceed() || saving) return;
    handleNext();
  }

  function patch(update) {
    setData((prev) => ({ ...prev, ...update }));
  }

  const buttonLabel = currentId === 'welcome'
    ? 'Get Started'
    : currentId === 'summary'
      ? (session ? 'Save Profile' : !navigator.onLine ? 'Continue Offline' : 'Create My Account')
      : 'Continue';

  return (
    <Box sx={{ height: '100dvh', minHeight: '-webkit-fill-available', display: 'flex', flexDirection: 'column', background: '#111827', overflow: 'hidden' }}>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ px: 3, pt: 'max(env(safe-area-inset-top), 20px)', pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ width: 32 }}>
            {step > 0 && (
              <IconButton
                onClick={() => go(-1)}
                size="small"
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: '#1f2937',
                  borderRadius: '10px',
                  color: '#9ca3af',
                  '&:hover': { bgcolor: '#262f40' },
                }}
              >
                <ArrowBackIcon sx={{ fontSize: '1rem' }} />
              </IconButton>
            )}
          </Box>

          <Box component="span" sx={{ fontFamily: '"Fraunces", serif', fontSize: '0.9rem', fontStyle: 'italic', color: '#FF6B35', fontWeight: 700 }}>
            MorninMate
          </Box>

          <Box sx={{ width: 32 }} />
        </Box>

        {!isWelcome && <DotsProgress step={step} totalSteps={STEP_IDS.length} />}

        <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={animKey}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={pageTransition}
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: isWelcome ? 'center' : 'flex-start',
                padding: '8px 24px 16px',
                overflowY: 'auto',
                willChange: 'transform, opacity',
              }}
            >
              <Box sx={{ background: '#1E2533', borderRadius: '20px', border: '1px solid #262f40', p: '22px 18px' }}>
                {currentId === 'welcome' && <WelcomeStep />}
                {currentId === 'name' && <NameStep value={data.name} onChange={(v) => patch({ name: v })} onSubmit={() => canProceed() && handleButtonClick()} />}
                {currentId === 'avatar' && <AvatarStep value={data.profileIcon} onChange={(v) => patch({ profileIcon: v })} />}
                {currentId === 'wakeTime' && <WakeTimeStep value={data.wakeTime} onChange={(v) => patch({ wakeTime: v })} />}
                {currentId === 'morningType' && <MorningTypeStep value={data.morningRating} onChange={(v) => patch({ morningRating: v })} />}
                {currentId === 'game' && <GameStep value={data.favoriteGame} onChange={(v) => patch({ favoriteGame: v })} />}
                {currentId === 'goal' && <GoalStep value={data.wakeGoal} onChange={(v) => patch({ wakeGoal: v })} />}
                {currentId === 'summary' && <SummaryStep data={data} />}
              </Box>
            </motion.div>
          </AnimatePresence>
        </Box>

        <Box sx={{ px: 3, pt: 1, pb: 'max(24px, env(safe-area-inset-bottom))' }}>
          {saveError && <Alert severity="error" sx={{ borderRadius: 3, mb: 2 }}>{saveError}</Alert>}
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleButtonClick}
            disabled={!canProceed() || saving}
            sx={{
              py: 1.75,
              fontWeight: 700,
              borderRadius: '14px',
              fontSize: '0.9rem',
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
              fontFamily: '"Outfit", sans-serif',
              background: '#FF6B35',
              boxShadow: 'none',
              '&:hover': { background: '#F05B23', boxShadow: 'none' },
              '&:disabled': { background: '#374151', color: '#9ca3af' },
            }}
          >
            {saving ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : buttonLabel}
          </Button>

          {currentId === 'welcome' && (
            <Typography variant="body2" textAlign="center" sx={{ mt: 2, color: '#4b5563', fontFamily: '"Outfit", sans-serif' }}>
              Already have an account?{' '}
              <Box
                component="span"
                onClick={() => setShowAuthDirectly(true)}
                sx={{ color: '#FF6B35', fontWeight: 700, cursor: 'pointer' }}
              >
                Sign in
              </Box>
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}
