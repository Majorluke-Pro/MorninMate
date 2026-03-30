import { useState } from 'react';
import { Box, Typography, Button, TextField, IconButton, CircularProgress, Alert } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CheckIcon from '@mui/icons-material/Check';
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
import { useApp } from '../../context/AppContext';

// ─── Static data ──────────────────────────────────────────────────────────────

const MORNING_TYPES = [
  { value: 1, Icon: NightsStayIcon,  label: 'Night Owl',      desc: 'Mornings are your nemesis' },
  { value: 2, Icon: SnoozeIcon,      label: 'Slow Starter',   desc: 'Need a few coffees to function' },
  { value: 3, Icon: DragHandleIcon,  label: 'In Between',     desc: 'Neither early nor late' },
  { value: 4, Icon: WbTwilightIcon,  label: 'Early Bird',     desc: 'You enjoy the quiet morning' },
  { value: 5, Icon: FlashOnIcon,     label: 'Morning Person', desc: 'Up at 5am, annoyingly alive' },
];

const GAMES = [
  { value: 'math',     Icon: CalculateIcon, label: 'Math Blitz',    desc: 'Solve quick arithmetic to dismiss',  tag: 'Brain',  color: '#FF6B35' },
  { value: 'memory',   Icon: StyleIcon,     label: 'Memory Match',  desc: 'Flip and match emoji pairs',         tag: 'Visual', color: '#FFD166' },
  { value: 'reaction', Icon: BoltIcon,      label: 'Reaction Rush', desc: 'Tap right on cue — no cheating',    tag: 'Reflex', color: '#06D6A0' },
];

const GOAL_PRESETS = [
  { Icon: FitnessCenterIcon,   label: 'Gym session' },
  { Icon: MenuBookIcon,        label: 'Study time' },
  { Icon: SelfImprovementIcon, label: 'Meditate' },
  { Icon: LocalCafeIcon,       label: 'Slow morning' },
  { Icon: DirectionsRunIcon,   label: 'Morning run' },
  { Icon: HistoryEduIcon,      label: 'Journaling' },
];

const STEP_CONFIG = {
  welcome:     { mood: 'wave',      speech: "G'day mate! Ready to crush those mornings? 🌿" },
  name:        { mood: 'happy',     speech: "Crikey, who are ya? Introduce yourself! 🐨" },
  wakeTime:    { mood: 'sleepy',    speech: "When d'ya wanna drag yourself outta the swag?" },
  morningType: { mood: 'thinking',  speech: "No worries, be honest! Which one are ya, mate?" },
  game:        { mood: 'excited',   speech: "Bonzer! Pick your wake-up weapon, legend!" },
  goal:        { mood: 'cool',      speech: "What gets ya outta bed each arvo... I mean morning?" },
  summary:     { mood: 'celebrate', speech: "You're a fair dinkum legend! Let's go! 🎉" },
};

// welcome + 5 data steps + summary
const STEP_IDS = ['welcome', 'name', 'wakeTime', 'morningType', 'game', 'goal', 'summary'];
const DATA_STEP_IDS = ['name', 'wakeTime', 'morningType', 'game', 'goal'];

// ─── Koala SVG ────────────────────────────────────────────────────────────────

function Koala({ mood = 'happy', size = 120 }) {
  const scale = size / 120;

  // Mouth shapes per mood
  const mouths = {
    happy:     <path d="M 48 88 Q 60 98 72 88" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" />,
    sleepy:    <path d="M 50 90 Q 60 86 70 90" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />,
    excited:   <ellipse cx="60" cy="91" rx="10" ry="7" fill="#fff" opacity="0.9" />,
    thinking:  <path d="M 52 89 Q 60 93 70 87" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />,
    wave:      <path d="M 48 88 Q 60 98 72 88" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" />,
    cool:      <path d="M 50 89 Q 60 97 70 89" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" />,
    celebrate: <ellipse cx="60" cy="91" rx="12" ry="8" fill="#fff" opacity="0.9" />,
  };

  // Eye shapes per mood
  const eyes = {
    happy:     <><circle cx="44" cy="62" r="7" fill="#fff" /><circle cx="76" cy="62" r="7" fill="#fff" /><circle cx="45" cy="63" r="3.5" fill="#262638" /><circle cx="77" cy="63" r="3.5" fill="#262638" /><circle cx="46.5" cy="61" r="1.2" fill="#fff" /><circle cx="78.5" cy="61" r="1.2" fill="#fff" /></>,
    sleepy:    <><ellipse cx="44" cy="62" rx="7" ry="4" fill="#fff" /><ellipse cx="76" cy="62" rx="7" ry="4" fill="#fff" /><circle cx="45" cy="63" r="2.5" fill="#262638" /><circle cx="77" cy="63" r="2.5" fill="#262638" /><path d="M 37 59 Q 44 56 51 59" stroke="#7878A0" strokeWidth="1.5" fill="none" /><path d="M 69 59 Q 76 56 83 59" stroke="#7878A0" strokeWidth="1.5" fill="none" /></>,
    excited:   <><circle cx="44" cy="62" r="8" fill="#fff" /><circle cx="76" cy="62" r="8" fill="#fff" /><circle cx="44" cy="62" r="4.5" fill="#262638" /><circle cx="76" cy="62" r="4.5" fill="#262638" /><circle cx="46" cy="60" r="1.5" fill="#fff" /><circle cx="78" cy="60" r="1.5" fill="#fff" /></>,
    thinking:  <><circle cx="44" cy="62" r="7" fill="#fff" /><circle cx="76" cy="62" r="7" fill="#fff" /><circle cx="46" cy="62" r="3.5" fill="#262638" /><circle cx="78" cy="62" r="3.5" fill="#262638" /><circle cx="47.5" cy="60.5" r="1.2" fill="#fff" /><circle cx="79.5" cy="60.5" r="1.2" fill="#fff" /></>,
    wave:      <><circle cx="44" cy="62" r="7" fill="#fff" /><circle cx="76" cy="62" r="7" fill="#fff" /><circle cx="45" cy="63" r="3.5" fill="#262638" /><circle cx="77" cy="63" r="3.5" fill="#262638" /><circle cx="46.5" cy="61" r="1.2" fill="#fff" /><circle cx="78.5" cy="61" r="1.2" fill="#fff" /></>,
    cool:      <><rect x="35" y="58" width="17" height="8" rx="4" fill="#262638" /><rect x="67" y="58" width="17" height="8" rx="4" fill="#262638" /><rect x="51" y="60" width="18" height="4" rx="2" fill="#262638" /></>,
    celebrate: <><circle cx="44" cy="62" r="8" fill="#fff" /><circle cx="76" cy="62" r="8" fill="#fff" /><circle cx="44" cy="62" r="4.5" fill="#262638" /><circle cx="76" cy="62" r="4.5" fill="#262638" /><circle cx="46" cy="60" r="1.5" fill="#fff" /><circle cx="78" cy="60" r="1.5" fill="#fff" /></>,
  };

  // Right arm — wave raises it
  const rightArm = mood === 'wave'
    ? <ellipse cx="98" cy="96" rx="9" ry="18" fill="#9090AA" transform="rotate(-70, 98, 96)" />
    : mood === 'celebrate'
    ? <ellipse cx="100" cy="92" rx="9" ry="18" fill="#9090AA" transform="rotate(-80, 100, 92)" />
    : <ellipse cx="100" cy="108" rx="9" ry="18" fill="#9090AA" transform="rotate(-20, 100, 108)" />;

  // Thinking bubble
  const thinkBubble = mood === 'thinking'
    ? <><circle cx="82" cy="46" r="3" fill="rgba(255,255,255,0.25)" /><circle cx="89" cy="38" r="5" fill="rgba(255,255,255,0.2)" /><circle cx="97" cy="29" r="7" fill="rgba(255,255,255,0.15)" /></>
    : null;

  // Stars for celebrate
  const celebrationStars = mood === 'celebrate'
    ? <><text x="12" y="30" fontSize="12" fill="#FFD166">✦</text><text x="95" y="22" fontSize="10" fill="#06D6A0">✦</text><text x="5" y="55" fontSize="8" fill="#FF6B35">★</text><text x="104" y="48" fontSize="8" fill="#FFD166">★</text></>
    : null;

  return (
    <svg
      viewBox="0 0 120 150"
      width={size}
      height={size * 1.25}
      style={{ display: 'block', overflow: 'visible' }}
    >
      {/* Left ear */}
      <ellipse cx="23" cy="30" rx="22" ry="24" fill="#7878A0" />
      <ellipse cx="23" cy="32" rx="14" ry="16" fill="#E0B8D0" />
      {/* Right ear */}
      <ellipse cx="97" cy="30" rx="22" ry="24" fill="#7878A0" />
      <ellipse cx="97" cy="32" rx="14" ry="16" fill="#E0B8D0" />

      {/* Body */}
      <ellipse cx="60" cy="120" rx="30" ry="28" fill="#7878A0" />
      {/* Belly */}
      <ellipse cx="60" cy="122" rx="20" ry="18" fill="#C8C8D8" />

      {/* Head */}
      <ellipse cx="60" cy="63" rx="40" ry="38" fill="#9090AA" />

      {/* Nose */}
      <ellipse cx="60" cy="72" rx="16" ry="12" fill="#262638" />
      <ellipse cx="60" cy="70" rx="9" ry="5" fill="#3A3A58" />
      <ellipse cx="57" cy="68" rx="4" ry="2.5" fill="rgba(255,255,255,0.12)" />

      {/* Eyes */}
      {eyes[mood] || eyes.happy}

      {/* Mouth */}
      {mouths[mood] || mouths.happy}

      {/* Left arm */}
      <ellipse cx="20" cy="108" rx="9" ry="18" fill="#9090AA" transform="rotate(20, 20, 108)" />

      {/* Right arm */}
      {rightArm}

      {/* Thinking bubble */}
      {thinkBubble}

      {/* Celebration extras */}
      {celebrationStars}
    </svg>
  );
}

// ─── Eucalyptus branch (Welcome scene) ───────────────────────────────────────

function EucalyptusBranch() {
  return (
    <svg viewBox="0 0 320 120" width="320" height="120" style={{ display: 'block', overflow: 'visible' }}>
      {/* Main branch */}
      <path d="M 0 40 Q 80 35 160 45 Q 240 55 320 42" stroke="#4A6741" strokeWidth="7" fill="none" strokeLinecap="round" />
      {/* Sub branches */}
      <path d="M 55 38 Q 45 18 35 8" stroke="#4A6741" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M 130 43 Q 120 22 108 12" stroke="#4A6741" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M 200 47 Q 212 28 222 16" stroke="#4A6741" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M 268 43 Q 275 24 282 13" stroke="#4A6741" strokeWidth="3.5" fill="none" strokeLinecap="round" />

      {/* Leaves on sub-branches */}
      {[
        [30, 6, -30], [22, 12, -50], [40, 4, -10],
        [104, 10, -35], [112, 8, -15], [96, 16, -55],
        [224, 14, 25], [216, 8, 10], [232, 18, 40],
        [280, 11, 20], [288, 7, 35],
      ].map(([cx, cy, rot], i) => (
        <ellipse
          key={i}
          cx={cx} cy={cy}
          rx="10" ry="5.5"
          fill="#5A8A50"
          transform={`rotate(${rot}, ${cx}, ${cy})`}
          opacity="0.85"
        />
      ))}

      {/* Hanging rope for koala */}
      <path d="M 160 45 L 160 78" stroke="#6B5A3E" strokeWidth="3" strokeLinecap="round" strokeDasharray="3,3" />
    </svg>
  );
}

// ─── Floating eucalyptus leaves background ────────────────────────────────────

const LEAF_DEFS = [
  { left: '8%',  delay: 0,    dur: 8,  size: 22, rot: 20 },
  { left: '22%', delay: 1.5,  dur: 11, size: 16, rot: -35 },
  { left: '40%', delay: 0.8,  dur: 9,  size: 20, rot: 55 },
  { left: '58%', delay: 2.2,  dur: 13, size: 14, rot: -20 },
  { left: '72%', delay: 0.3,  dur: 10, size: 18, rot: 40 },
  { left: '85%', delay: 1.8,  dur: 8,  size: 12, rot: -60 },
  { left: '92%', delay: 3.1,  dur: 12, size: 16, rot: 15 },
  { left: '15%', delay: 4.0,  dur: 14, size: 13, rot: -45 },
  { left: '50%', delay: 2.7,  dur: 9,  size: 19, rot: 30 },
  { left: '68%', delay: 0.6,  dur: 11, size: 15, rot: -10 },
];

function FloatingLeaves() {
  return (
    <Box sx={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {LEAF_DEFS.map((l, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            top: '-40px',
            left: l.left,
            width: l.size,
            height: l.size * 0.55,
            borderRadius: '50% 50% 50% 50% / 30% 30% 70% 70%',
            background: 'linear-gradient(135deg, #5A8A50 0%, #3D6B34 60%, #4A7A42 100%)',
            opacity: 0.28,
            '@keyframes leafFall': {
              '0%':   { transform: `translateY(0) rotate(${l.rot}deg)`, opacity: 0 },
              '8%':   { opacity: 0.28 },
              '92%':  { opacity: 0.2 },
              '100%': { transform: `translateY(110vh) rotate(${l.rot + 180}deg)`, opacity: 0 },
            },
            animationName: 'leafFall',
            animationDuration: `${l.dur}s`,
            animationDelay: `${l.delay}s`,
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
          }}
        />
      ))}
    </Box>
  );
}

// ─── Speech bubble ─────────────────────────────────────────────────────────────

function SpeechBubble({ text, animKey }) {
  return (
    <Box
      key={animKey}
      sx={{
        position: 'relative',
        bgcolor: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.14)',
        borderRadius: '16px 16px 16px 4px',
        px: 2.5, py: 1.5,
        maxWidth: 280,
        backdropFilter: 'blur(8px)',
        '@keyframes bubbleIn': {
          from: { opacity: 0, transform: 'scale(0.85) translateY(6px)' },
          to:   { opacity: 1, transform: 'scale(1) translateY(0)' },
        },
        animation: 'bubbleIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
      }}
    >
      <Typography variant="body2" fontWeight={600} sx={{ color: 'rgba(255,255,255,0.9)', lineHeight: 1.5 }}>
        {text}
      </Typography>
    </Box>
  );
}

// ─── Koala header (used on data steps) ────────────────────────────────────────

function KoalaHeader({ mood, speech, animKey }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, mb: 3 }}>
      <Box
        sx={{
          flexShrink: 0,
          '@keyframes koalaFloat': {
            '0%,100%': { transform: 'translateY(0px)' },
            '50%':     { transform: 'translateY(-5px)' },
          },
          animation: 'koalaFloat 3s ease-in-out infinite',
        }}
      >
        <Koala mood={mood} size={72} />
      </Box>
      <SpeechBubble text={speech} animKey={animKey} />
    </Box>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function OnboardingFlow() {
  const { session, completeOnboarding, setPendingOnboarding, setShowAuthDirectly } = useApp();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [animKey, setAnimKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [data, setData] = useState({
    name: '',
    wakeTime: '07:00',
    morningRating: 3,
    favoriteGame: 'math',
    wakeGoal: '',
  });

  const currentId = STEP_IDS[step];
  const cfg = STEP_CONFIG[currentId] || STEP_CONFIG.welcome;

  function go(delta) {
    setDirection(delta);
    setAnimKey(k => k + 1);
    setStep(s => s + delta);
  }

  async function handleNext() {
    if (currentId === 'summary') {
      if (session) {
        setSaving(true);
        setSaveError('');
        try {
          await completeOnboarding(data);
        } catch {
          setSaveError('Failed to save your profile. Please try again.');
          setSaving(false);
        }
      } else {
        setPendingOnboarding(data);
      }
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

  const isWelcome = currentId === 'welcome';

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <Background />
      <FloatingLeaves />

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
            justifyContent: isWelcome ? 'center' : 'flex-start',
            px: 3,
            pt: isWelcome ? 0 : 3,
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
          {currentId === 'welcome' && <WelcomeStep />}

          {currentId === 'name' && (
            <>
              <KoalaHeader mood={cfg.mood} speech={cfg.speech} animKey={animKey} />
              <NameStep value={data.name} onChange={v => patch({ name: v })} onSubmit={() => canProceed() && handleNext()} />
            </>
          )}

          {currentId === 'wakeTime' && (
            <>
              <KoalaHeader mood={cfg.mood} speech={cfg.speech} animKey={animKey} />
              <WakeTimeStep value={data.wakeTime} onChange={v => patch({ wakeTime: v })} />
            </>
          )}

          {currentId === 'morningType' && (
            <>
              <KoalaHeader mood={cfg.mood} speech={cfg.speech} animKey={animKey} />
              <MorningTypeStep value={data.morningRating} onChange={v => patch({ morningRating: v })} />
            </>
          )}

          {currentId === 'game' && (
            <>
              <KoalaHeader mood={cfg.mood} speech={cfg.speech} animKey={animKey} />
              <GameStep value={data.favoriteGame} onChange={v => patch({ favoriteGame: v })} />
            </>
          )}

          {currentId === 'goal' && (
            <>
              <KoalaHeader mood={cfg.mood} speech={cfg.speech} animKey={animKey} />
              <GoalStep value={data.wakeGoal} onChange={v => patch({ wakeGoal: v })} />
            </>
          )}

          {currentId === 'summary' && <SummaryStep data={data} speech={cfg.speech} />}
        </Box>

        {/* CTA */}
        <Box sx={{ px: 3, pb: 5, pt: 1 }}>
          {saveError && (
            <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>{saveError}</Alert>
          )}
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleNext}
            disabled={!canProceed() || saving}
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
            {saving
              ? <CircularProgress size={22} sx={{ color: '#fff' }} />
              : currentId === 'welcome' ? "Let's go, mate! →"
              : currentId === 'summary' ? 'Create My Account 🚀'
              : 'Continue →'}
          </Button>

          {currentId === 'welcome' && (
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
              sx={{ mt: 2 }}
            >
              Already have an account?{' '}
              <Box
                component="span"
                onClick={() => setShowAuthDirectly(true)}
                sx={{
                  color: 'primary.main',
                  fontWeight: 700,
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' },
                }}
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

// ─── Background ───────────────────────────────────────────────────────────────

function Background() {
  return (
    <Box sx={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #060F08 0%, #0D1A10 45%, #080820 100%)' }} />

      <Box sx={{
        position: 'absolute', width: 480, height: 480, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(90,138,80,0.15) 0%, transparent 70%)',
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
        background: 'radial-gradient(circle, rgba(255,107,53,0.1) 0%, transparent 70%)',
        bottom: -60, left: -120, filter: 'blur(60px)',
        '@keyframes orb2': {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '50%':     { transform: 'translate(38px,-28px) scale(1.07)' },
        },
        animation: 'orb2 17s ease-in-out infinite',
      }} />

      <Box sx={{
        position: 'absolute', width: 260, height: 260, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(61,107,52,0.09) 0%, transparent 70%)',
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
    <Box sx={{ textAlign: 'center', px: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Eucalyptus branch with hanging koala */}
      <Box sx={{
        position: 'relative', mb: 1,
        '@keyframes branchSway': {
          '0%,100%': { transform: 'rotate(-1deg)' },
          '50%':     { transform: 'rotate(1deg)' },
        },
        animation: 'branchSway 4s ease-in-out infinite',
        transformOrigin: 'left center',
      }}>
        <EucalyptusBranch />
        <Box sx={{
          position: 'absolute',
          top: 68,
          left: '50%',
          transform: 'translateX(-50%)',
          '@keyframes koalaHang': {
            '0%,100%': { transform: 'translateX(-50%) rotate(-3deg)' },
            '50%':     { transform: 'translateX(-50%) rotate(3deg)' },
          },
          animation: 'koalaHang 4s ease-in-out infinite',
          transformOrigin: 'top center',
        }}>
          <Koala mood="wave" size={110} />
        </Box>
      </Box>

      <Typography
        variant="h2"
        fontWeight={900}
        letterSpacing="-1px"
        sx={{
          mt: 10,
          mb: 1,
          background: 'linear-gradient(135deg, #ffffff 0%, #c8f0c0 50%, #90d085 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          '@keyframes wFadeUp': { from: { opacity: 0, transform: 'translateY(22px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
          animation: 'wFadeUp 0.65s cubic-bezier(0.16,1,0.3,1) 0.1s both',
        }}
      >
        MorninMate
      </Typography>

      <Typography variant="h5" fontWeight={700} color="primary.main" sx={{
        mb: 2,
        animation: 'wFadeUp 0.65s cubic-bezier(0.16,1,0.3,1) 0.25s both',
      }}>
        Wake up. Level up. No worries.
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
        {[
          { Icon: SportsEsportsIcon, label: 'Mini-games' },
          { Icon: EmojiObjectsIcon,  label: 'XP & Levels' },
          { Icon: FlashOnIcon,       label: 'Streaks' },
        ].map(({ Icon, label }) => (
          <Box key={label} sx={{
            px: 2, py: 0.75, borderRadius: 10,
            bgcolor: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', gap: 0.75,
          }}>
            <Icon sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" fontWeight={600} color="text.secondary">{label}</Typography>
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
      <StepHeader Icon={PersonIcon} title="First things first —" subtitle="What should we call you, mate?" />
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
            G'day,{' '}
            <Box component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>{value.trim()}</Box>! Ripper name 🐨
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
      <StepHeader Icon={AlarmIcon} title="When do you want to wake up?" subtitle="Set your default alarm time." />

      <Box sx={{ mt: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <TimeDrum
          display={String(hour12).padStart(2, '0')}
          onUp={() => setHour(hour12 === 12 ? 1  : hour12 + 1)}
          onDown={() => setHour(hour12 === 1  ? 12 : hour12 - 1)}
        />

        <Typography variant="h3" fontWeight={900} color="primary.main" sx={{ mb: 2, userSelect: 'none' }}>
          :
        </Typography>

        <TimeDrum
          display={String(m).padStart(2, '0')}
          onUp={() => setMin(m >= 55 ? 0  : m + 5)}
          onDown={() => setMin(m <= 0  ? 55 : m - 5)}
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
      <StepHeader Icon={EmojiPeopleIcon} title="What kind of morning person are you?" subtitle="Be honest — this shapes your experience." />
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
              <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: selected ? 'rgba(255,107,53,0.15)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <type.Icon sx={{ fontSize: '1.35rem', color: selected ? 'primary.main' : 'text.secondary' }} />
              </Box>
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
      <StepHeader Icon={SportsEsportsIcon} title="Pick your wake-up game" subtitle="This is how you'll prove you're actually awake." />
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
              }}>
                <game.Icon sx={{ fontSize: '1.9rem', color: game.color }} />
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
        Icon={TrackChangesIcon}
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
              <preset.Icon sx={{ fontSize: '1.05rem', color: selected ? 'primary.main' : 'text.secondary' }} />
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

function SummaryStep({ data, speech }) {
  const morningType = MORNING_TYPES.find(t => t.value === data.morningRating);
  const game = GAMES.find(g => g.value === data.favoriteGame);
  const [h, m] = data.wakeTime.split(':').map(Number);
  const formattedTime = `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;

  const items = [
    { Icon: PersonIcon,          label: 'Name',         value: data.name },
    { Icon: AlarmIcon,           label: 'Wake time',    value: formattedTime },
    { Icon: morningType?.Icon,   label: 'Morning type', value: morningType?.label },
    { Icon: game?.Icon,          label: 'Wake-up game', value: game?.label },
    { Icon: TrackChangesIcon,    label: 'Morning goal', value: data.wakeGoal || '—' },
  ];

  return (
    <Box sx={{ textAlign: 'center' }}>
      {/* Celebrating koala */}
      <Box sx={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 1,
        '@keyframes celebrateBounce': {
          '0%,100%': { transform: 'translateY(0) rotate(-2deg)' },
          '25%':     { transform: 'translateY(-12px) rotate(2deg)' },
          '75%':     { transform: 'translateY(-6px) rotate(-1deg)' },
        },
        animation: 'celebrateBounce 1.2s ease-in-out infinite',
      }}>
        <Koala mood="celebrate" size={100} />
      </Box>

      <SpeechBubble text={speech} animKey="summary" />

      <Typography variant="h5" fontWeight={800} sx={{
        mt: 3, mb: 0.5,
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
            <Box sx={{ width: 28, height: 28, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {item.Icon && <item.Icon sx={{ fontSize: '1rem', color: 'text.secondary' }} />}
            </Box>
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

function StepHeader({ Icon, title, subtitle }) {
  return (
    <Box>
      <Box sx={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 52, height: 52, borderRadius: 3, mb: 2.5,
        background: 'linear-gradient(135deg, rgba(255,107,53,0.18) 0%, rgba(255,107,53,0.08) 100%)',
        border: '1px solid rgba(255,107,53,0.25)',
      }}>
        {Icon && <Icon sx={{ fontSize: '1.75rem', color: 'primary.main' }} />}
      </Box>
      <Typography variant="h5" fontWeight={800} sx={{ mb: 1, lineHeight: 1.25 }}>{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>{subtitle}</Typography>
    </Box>
  );
}
