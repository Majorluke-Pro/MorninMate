import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from '../../lib/motion-lite';
import { Box, Typography, Button, TextField, IconButton, CircularProgress, Alert } from '../../lib/ui-lite';
import ArrowBackIcon     from '@mui/icons-material/ArrowBack';
import WbSunnyIcon       from '@mui/icons-material/WbSunny';
import KeyboardArrowUpIcon   from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CheckIcon         from '@mui/icons-material/Check';
import AlarmIcon         from '@mui/icons-material/Alarm';
import PersonIcon        from '@mui/icons-material/Person';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import EmojiObjectsIcon  from '@mui/icons-material/EmojiObjects';
import EmojiPeopleIcon   from '@mui/icons-material/EmojiPeople';
import CalculateIcon     from '@mui/icons-material/Calculate';
import StyleIcon         from '@mui/icons-material/Style';
import BoltIcon          from '@mui/icons-material/Bolt';
import NightsStayIcon    from '@mui/icons-material/NightsStay';
import SnoozeIcon        from '@mui/icons-material/Snooze';
import DragHandleIcon    from '@mui/icons-material/DragHandle';
import WbTwilightIcon    from '@mui/icons-material/WbTwilight';
import FlashOnIcon       from '@mui/icons-material/FlashOn';
import LightModeIcon     from '@mui/icons-material/LightMode';
import WbCloudyIcon      from '@mui/icons-material/WbCloudy';
import Brightness4Icon   from '@mui/icons-material/Brightness4';
import HotelIcon         from '@mui/icons-material/Hotel';
import FitnessCenterIcon   from '@mui/icons-material/FitnessCenter';
import MenuBookIcon        from '@mui/icons-material/MenuBook';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import LocalCafeIcon       from '@mui/icons-material/LocalCafe';
import DirectionsRunIcon   from '@mui/icons-material/DirectionsRun';
import HistoryEduIcon      from '@mui/icons-material/HistoryEdu';
import TrackChangesIcon    from '@mui/icons-material/TrackChanges';
import EmojiEventsIcon     from '@mui/icons-material/EmojiEvents';
import FaceIcon            from '@mui/icons-material/Face';
import TimePicker from '../common/TimePicker';
import { useApp } from '../../context/AppContext';
import { AVATAR_OPTIONS } from '../../lib/avatars';

// ─── Static data ──────────────────────────────────────────────────────────────

const MORNING_TYPES = [
  { value:1, Icon:NightsStayIcon,  label:'Night Owl',      desc:'Mornings are your nemesis' },
  { value:2, Icon:SnoozeIcon,      label:'Slow Starter',   desc:'Need a few coffees to function' },
  { value:3, Icon:DragHandleIcon,  label:'In Between',     desc:'Neither early nor late' },
  { value:4, Icon:WbTwilightIcon,  label:'Early Bird',     desc:'You enjoy the quiet morning' },
  { value:5, Icon:FlashOnIcon,     label:'Morning Person', desc:'Up at 5am, annoyingly alive' },
];
const GAMES = [
  { value:'math',     Icon:CalculateIcon, label:'Math Blitz',    desc:'Solve quick arithmetic to dismiss', tag:'Brain',  color:'#FF6B35' },
  { value:'memory',   Icon:StyleIcon,     label:'Memory Match',  desc:'Flip and match emoji pairs',        tag:'Visual', color:'#FFD166' },
  { value:'reaction', Icon:BoltIcon,      label:'Reaction Rush', desc:'Tap right on cue — no cheating',   tag:'Reflex', color:'#06D6A0' },
];
const GOAL_PRESETS = [
  { Icon:FitnessCenterIcon,   label:'Gym session' },
  { Icon:MenuBookIcon,        label:'Study time' },
  { Icon:SelfImprovementIcon, label:'Meditate' },
  { Icon:LocalCafeIcon,       label:'Slow morning' },
  { Icon:DirectionsRunIcon,   label:'Morning run' },
  { Icon:HistoryEduIcon,      label:'Journaling' },
];
const STEP_CONFIG = {
  welcome:     { mood:'wave',      speech:"G'day mate! Ready to crush those mornings? 🌿" },
  name:        { mood:'happy',     speech:"Crikey, who are ya? Introduce yourself! 🐨" },
  avatar:      { mood:'excited',   speech:"Pick your vibe, legend! Which one screams YOU?" },
  wakeTime:    { mood:'sleepy',    speech:"When d'ya wanna drag yourself outta the swag?" },
  morningType: { mood:'thinking',  speech:"No worries, be honest! Which one are ya, mate?" },
  game:        { mood:'excited',   speech:"Bonzer! Pick your wake-up weapon, legend!" },
  goal:        { mood:'cool',      speech:"What gets ya outta bed each arvo... I mean morning?" },
  summary:     { mood:'celebrate', speech:"You're a fair dinkum legend! Let's go! 🎉" },
};
const STEP_IDS = ['welcome','name','avatar','wakeTime','morningType','game','goal','summary'];

// ─── Accent palette ───────────────────────────────────────────────────────────
const STEP_ACCENT = {
  welcome:'#00E8A2',
  name:'#FF7A9A',
  avatar:'#C084FC',
  wakeTime:'#FFA94D',
  morningType:'#60C5D8',
  game:'#2EE8B4',
  goal:'#FFB74D',
  summary:'#FFD166',
};

// ─── Global keyframes (injected via <style> in Background) ────────────────────
const GLOBAL_CSS = `
  @keyframes auroraDrift1 {
    0%,100% { transform: translate(0px,0px) scale(1); }
    33%     { transform: translate(55px,-42px) scale(1.2); }
    66%     { transform: translate(-35px,28px) scale(0.85); }
  }
  @keyframes auroraDrift2 {
    0%,100% { transform: translate(0px,0px) scale(1); }
    40%     { transform: translate(-48px,58px) scale(1.15); }
    75%     { transform: translate(40px,-26px) scale(0.88); }
  }
  @keyframes auroraDrift3 {
    0%,100% { transform: translate(0px,0px) scale(1); }
    50%     { transform: translate(28px,42px) scale(1.1); }
  }
  @keyframes shimmerSweep {
    0%   { transform: translateX(-220%) skewX(-18deg); opacity:0; }
    8%   { opacity:1; }
    92%  { opacity:1; }
    100% { transform: translateX(420%) skewX(-18deg); opacity:0; }
  }
  @keyframes twinkleNew {
    0%,100% { opacity:0.04; transform:scale(0.7); }
    50%     { opacity:0.65; transform:scale(1.4); }
  }
  @keyframes haloBreath {
    0%,100% { transform:scale(1);    opacity:0.32; }
    50%     { transform:scale(1.15); opacity:0.58; }
  }
  @keyframes activeNodePulse {
    0%,100% { box-shadow:0 0 0 0px rgba(255,255,255,0.7); }
    60%     { box-shadow:0 0 0 9px  rgba(255,255,255,0); }
  }
  @keyframes floatUpSlow {
    0%   { transform:translateY(0px) rotate(0deg);   opacity:0; }
    8%   { opacity:0.5; }
    92%  { opacity:0.25; }
    100% { transform:translateY(-112vh) rotate(380deg); opacity:0; }
  }
`;

// ─── Page transition variants — cinematic blur + scale ─────────────────────────
const pageVariants = {
  enter: (dir) => ({
    opacity: 0,
    y: dir >= 0 ? 72 : -72,
    scale: 0.91,
    filter: 'blur(10px)',
  }),
  center: {
    opacity: 1, y: 0, scale: 1, filter: 'blur(0px)',
    transition: {
      type: 'spring', stiffness: 340, damping: 28, mass: 0.85,
      opacity:{ duration: 0.22, ease: 'easeOut' },
      filter: { duration: 0.32, ease: 'easeOut' },
    },
  },
  exit: (dir) => ({
    opacity: 0,
    y: dir >= 0 ? -55 : 55,
    scale: 0.86,
    filter: 'blur(12px)',
    transition: { duration: 0.21, ease: [0.4, 0, 1, 1] },
  }),
};

// ─── Stagger variants ─────────────────────────────────────────────────────────
const listContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.14 } },
};
const listItem = {
  hidden: { opacity:0, x:-22, scale:0.96 },
  show:   { opacity:1, x:0,   scale:1,   transition:{ type:'spring', stiffness:400, damping:28 } },
};
const fadeUpItem = {
  hidden: { opacity:0, y:22, scale:0.94 },
  show:   { opacity:1, y:0,  scale:1,  transition:{ type:'spring', stiffness:420, damping:26 } },
};
// Stagger wrapper for step-level sections
const sectionStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.11, delayChildren: 0.05 } },
};
const sectionItem = {
  hidden: { opacity:0, y:26, scale:0.95 },
  show:   { opacity:1, y:0,  scale:1,  transition:{ type:'spring', stiffness:380, damping:26 } },
};

// ─── Walking Koala SVG ────────────────────────────────────────────────────────
const WALK_CSS = `
  .kw-all { animation:kwBob 0.5s ease-in-out infinite; transform-box:fill-box; transform-origin:50% 65%; }
  .kw-ll  { transform-box:fill-box; transform-origin:50% 0%; animation:kwLL 0.5s ease-in-out infinite; }
  .kw-rl  { transform-box:fill-box; transform-origin:50% 0%; animation:kwLL 0.5s ease-in-out infinite reverse; }
  .kw-la  { transform-box:fill-box; transform-origin:50% 0%; animation:kwLA 0.5s ease-in-out infinite; }
  .kw-ra  { transform-box:fill-box; transform-origin:50% 0%; animation:kwLA 0.5s ease-in-out infinite reverse; }
  @keyframes kwBob {
    0%,100% { transform:translateY(0)    rotate(0deg); }
    25%     { transform:translateY(-3px) rotate(-2.5deg); }
    75%     { transform:translateY(-3px) rotate(2.5deg); }
  }
  @keyframes kwLL { 0%,100%{transform:rotate(-28deg)} 50%{transform:rotate(28deg)} }
  @keyframes kwLA { 0%,100%{transform:rotate(20deg)}  50%{transform:rotate(-20deg)} }
`;

function WalkingKoala({ size = 68 }) {
  return (
    <svg viewBox="0 0 100 138" width={size} height={size * 1.38} style={{ display:'block', overflow:'visible' }}>
      <style>{WALK_CSS}</style>
      <g className="kw-all">
        <ellipse cx="21" cy="25" rx="20" ry="21" fill="#7878A8"/>
        <ellipse cx="21" cy="27" rx="12" ry="13" fill="#E8BEDD"/>
        <ellipse cx="79" cy="25" rx="20" ry="21" fill="#7878A8"/>
        <ellipse cx="79" cy="27" rx="12" ry="13" fill="#E8BEDD"/>
        <g className="kw-ll">
          <ellipse cx="37" cy="110" rx="10.5" ry="18" fill="#7878A8"/>
          <ellipse cx="33" cy="126" rx="15"   ry="7"  fill="#6868A0"/>
          <ellipse cx="25" cy="131" rx="2.5"  ry="1.5" fill="#5858A0" transform="rotate(-20,25,131)"/>
          <ellipse cx="31" cy="132" rx="2.5"  ry="1.5" fill="#5858A0"/>
          <ellipse cx="37" cy="132" rx="2.5"  ry="1.5" fill="#5858A0"/>
          <ellipse cx="43" cy="131" rx="2.5"  ry="1.5" fill="#5858A0" transform="rotate(20,43,131)"/>
        </g>
        <g className="kw-rl">
          <ellipse cx="63" cy="110" rx="10.5" ry="18" fill="#7878A8"/>
          <ellipse cx="67" cy="126" rx="15"   ry="7"  fill="#6868A0"/>
          <ellipse cx="57" cy="131" rx="2.5"  ry="1.5" fill="#5858A0" transform="rotate(-20,57,131)"/>
          <ellipse cx="63" cy="132" rx="2.5"  ry="1.5" fill="#5858A0"/>
          <ellipse cx="69" cy="132" rx="2.5"  ry="1.5" fill="#5858A0"/>
          <ellipse cx="75" cy="131" rx="2.5"  ry="1.5" fill="#5858A0" transform="rotate(20,75,131)"/>
        </g>
        <ellipse cx="50" cy="94"  rx="27" ry="25" fill="#8080AA"/>
        <ellipse cx="50" cy="96"  rx="18" ry="16" fill="#CACAD8"/>
        <ellipse cx="46" cy="85"  rx="6"  ry="4"  fill="rgba(255,255,255,0.06)" transform="rotate(-20,46,85)"/>
        <g className="kw-la">
          <ellipse cx="20" cy="90" rx="9" ry="18" fill="#8888A8" transform="rotate(12,20,74)"/>
          <circle cx="14" cy="106" r="10" fill="#7878A8"/>
          <circle cx="10" cy="110" r="2.5" fill="#6060A0" opacity="0.7"/>
          <circle cx="15" cy="112" r="2.5" fill="#6060A0" opacity="0.7"/>
          <circle cx="20" cy="111" r="2.5" fill="#6060A0" opacity="0.7"/>
        </g>
        <g className="kw-ra">
          <ellipse cx="80" cy="90" rx="9" ry="18" fill="#8888A8" transform="rotate(-12,80,74)"/>
          <circle cx="86" cy="106" r="10" fill="#7878A8"/>
          <circle cx="82" cy="110" r="2.5" fill="#6060A0" opacity="0.7"/>
          <circle cx="87" cy="112" r="2.5" fill="#6060A0" opacity="0.7"/>
          <circle cx="92" cy="111" r="2.5" fill="#6060A0" opacity="0.7"/>
        </g>
        <ellipse cx="50" cy="48" rx="33" ry="31" fill="#9090B0"/>
        <ellipse cx="42" cy="34" rx="12" ry="8"  fill="rgba(255,255,255,0.06)" transform="rotate(-20,42,34)"/>
        <ellipse cx="50" cy="57" rx="15" ry="11" fill="#24243C"/>
        <ellipse cx="50" cy="55" rx="9"  ry="5.5" fill="#36365A"/>
        <ellipse cx="45" cy="53" rx="3.5" ry="2.5" fill="rgba(255,255,255,0.16)"/>
        <circle cx="36" cy="42" r="7.5" fill="#fff"/>
        <circle cx="64" cy="42" r="7.5" fill="#fff"/>
        <circle cx="37" cy="43" r="4.5" fill="#1A1A30"/>
        <circle cx="65" cy="43" r="4.5" fill="#1A1A30"/>
        <circle cx="39" cy="41" r="1.8" fill="#fff"/>
        <circle cx="67" cy="41" r="1.8" fill="#fff"/>
        <path d="M 42 65 Q 50 72 58 65" stroke="rgba(255,255,255,0.7)" strokeWidth="2" fill="none" strokeLinecap="round"/>
      </g>
    </svg>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function KoalaProgressTrack({ step, totalSteps, stepId }) {
  const color = STEP_ACCENT[stepId] ?? '#FF6B35';

  return (
    <Box sx={{ px: 2.5, pb: 0.5 }}>
      {/* Step counter */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.25 }}>
        <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)' }}>
          STEP {step + 1} OF {totalSteps}
        </Typography>
        <motion.div
          key={stepId}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.06em', color }}>
            {stepId.toUpperCase()}
          </Typography>
        </motion.div>
      </Box>

      {/* Segmented bar */}
      <Box sx={{ display: 'flex', gap: '3px' }}>
        {Array.from({ length: totalSteps }).map((_, i) => {
          const passed = i < step;
          const active = i === step;
          return (
            <Box key={i} sx={{ flex: 1, height: 3, borderRadius: 99, overflow: 'hidden', bgcolor: 'rgba(255,255,255,0.07)' }}>
              <motion.div
                style={{ height: '100%', borderRadius: 99 }}
                animate={{
                  scaleX: passed || active ? 1 : 0,
                  background: active
                    ? color
                    : `${color}88`,
                  opacity: passed ? 0.55 : active ? 1 : 0,
                }}
                initial={{ scaleX: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28, delay: active ? 0 : 0 }}
                style={{ transformOrigin: 'left', height: '100%', borderRadius: 99 }}
              />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

// ─── Typewriter speech bubble ─────────────────────────────────────────────────
function SpeechBubble({ text, animKey }) {
  const [shown, setShown] = useState('');
  const [done,  setDone]  = useState(false);

  useEffect(() => {
    setShown(''); setDone(false);
    let i = 0;
    const t0 = setTimeout(() => {
      const iv = setInterval(() => {
        i++;
        setShown(text.slice(0, i));
        if (i >= text.length) { setDone(true); clearInterval(iv); }
      }, 17);
      return () => clearInterval(iv);
    }, 140);
    return () => clearTimeout(t0);
  }, [animKey]);

  return (
    <motion.div
      key={animKey}
      initial={{ opacity:0, scale:0.68, y:10 }}
      animate={{ opacity:1, scale:1, y:0 }}
      transition={{ type:'spring', stiffness:480, damping:26 }}
      style={{
        position:'relative',
        background:'rgba(10,10,26,0.82)',
        backdropFilter:'blur(14px)',
        WebkitBackdropFilter:'blur(14px)',
        border:'1px solid rgba(255,255,255,0.11)',
        borderRadius:'18px 18px 18px 4px',
        padding:'11px 18px',
        maxWidth:260,
        willChange:'transform, opacity',
        boxShadow:'0 8px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      <Box sx={{ position:'absolute', top:0, left:16, right:16, height:1,
        background:'linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent)', borderRadius:1 }}/>
      <Typography variant="body2" fontWeight={600}
        sx={{ color:'rgba(255,255,255,0.93)', lineHeight:1.55, minHeight:'2.4em', fontFamily:'"Outfit", sans-serif' }}>
        {shown}
        {!done && (
          <motion.span
            animate={{ opacity:[1,0] }}
            transition={{ duration:0.42, repeat:Infinity, repeatType:'reverse' }}
            style={{ display:'inline-block', width:2, height:'0.9em', background:'rgba(255,255,255,0.7)', marginLeft:2, verticalAlign:'text-bottom' }}
          />
        )}
      </Typography>
      <Box sx={{ position:'absolute', bottom:-7, left:14, width:0, height:0,
        borderLeft:'7px solid transparent', borderRight:'7px solid transparent',
        borderTop:'7px solid rgba(10,10,26,0.82)' }}/>
    </motion.div>
  );
}

// ─── Koala SVG ────────────────────────────────────────────────────────────────
function Koala({ mood='happy', size=120 }) {
  const mouths = {
    happy:     <path d="M 48 88 Q 60 98 72 88" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round"/>,
    sleepy:    <path d="M 50 90 Q 60 86 70 90" stroke="#fff" strokeWidth="2"   fill="none" strokeLinecap="round"/>,
    excited:   <ellipse cx="60" cy="91" rx="10" ry="7" fill="#fff" opacity="0.9"/>,
    thinking:  <path d="M 52 89 Q 60 93 70 87" stroke="#fff" strokeWidth="2"   fill="none" strokeLinecap="round"/>,
    wave:      <path d="M 48 88 Q 60 98 72 88" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round"/>,
    cool:      <path d="M 50 89 Q 60 97 70 89" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round"/>,
    celebrate: <ellipse cx="60" cy="91" rx="12" ry="8" fill="#fff" opacity="0.9"/>,
  };
  const eyes = {
    happy:     <><circle cx="44" cy="62" r="7" fill="#fff"/><circle cx="76" cy="62" r="7" fill="#fff"/><circle cx="45" cy="63" r="3.5" fill="#262638"/><circle cx="77" cy="63" r="3.5" fill="#262638"/><circle cx="46.5" cy="61" r="1.2" fill="#fff"/><circle cx="78.5" cy="61" r="1.2" fill="#fff"/></>,
    sleepy:    <><ellipse cx="44" cy="62" rx="7" ry="4" fill="#fff"/><ellipse cx="76" cy="62" rx="7" ry="4" fill="#fff"/><circle cx="45" cy="63" r="2.5" fill="#262638"/><circle cx="77" cy="63" r="2.5" fill="#262638"/><path d="M 37 59 Q 44 56 51 59" stroke="#7878A0" strokeWidth="1.5" fill="none"/><path d="M 69 59 Q 76 56 83 59" stroke="#7878A0" strokeWidth="1.5" fill="none"/></>,
    excited:   <><circle cx="44" cy="62" r="8" fill="#fff"/><circle cx="76" cy="62" r="8" fill="#fff"/><circle cx="44" cy="62" r="4.5" fill="#262638"/><circle cx="76" cy="62" r="4.5" fill="#262638"/><circle cx="46" cy="60" r="1.5" fill="#fff"/><circle cx="78" cy="60" r="1.5" fill="#fff"/></>,
    thinking:  <><circle cx="44" cy="62" r="7" fill="#fff"/><circle cx="76" cy="62" r="7" fill="#fff"/><circle cx="46" cy="62" r="3.5" fill="#262638"/><circle cx="78" cy="62" r="3.5" fill="#262638"/><circle cx="47.5" cy="60.5" r="1.2" fill="#fff"/><circle cx="79.5" cy="60.5" r="1.2" fill="#fff"/></>,
    wave:      <><circle cx="44" cy="62" r="7" fill="#fff"/><circle cx="76" cy="62" r="7" fill="#fff"/><circle cx="45" cy="63" r="3.5" fill="#262638"/><circle cx="77" cy="63" r="3.5" fill="#262638"/><circle cx="46.5" cy="61" r="1.2" fill="#fff"/><circle cx="78.5" cy="61" r="1.2" fill="#fff"/></>,
    cool:      <><rect x="35" y="58" width="17" height="8" rx="4" fill="#262638"/><rect x="67" y="58" width="17" height="8" rx="4" fill="#262638"/><rect x="51" y="60" width="18" height="4" rx="2" fill="#262638"/></>,
    celebrate: <><circle cx="44" cy="62" r="8" fill="#fff"/><circle cx="76" cy="62" r="8" fill="#fff"/><circle cx="44" cy="62" r="4.5" fill="#262638"/><circle cx="76" cy="62" r="4.5" fill="#262638"/><circle cx="46" cy="60" r="1.5" fill="#fff"/><circle cx="78" cy="60" r="1.5" fill="#fff"/></>,
  };
  const rightArm = mood==='wave'
    ? <ellipse cx="98" cy="96" rx="9" ry="18" fill="#9090AA" transform="rotate(-70,98,96)"/>
    : mood==='celebrate'
    ? <ellipse cx="100" cy="92" rx="9" ry="18" fill="#9090AA" transform="rotate(-80,100,92)"/>
    : <ellipse cx="100" cy="108" rx="9" ry="18" fill="#9090AA" transform="rotate(-20,100,108)"/>;
  const extras = mood==='thinking'
    ? <><circle cx="82" cy="46" r="3" fill="rgba(255,255,255,0.25)"/><circle cx="89" cy="38" r="5" fill="rgba(255,255,255,0.2)"/><circle cx="97" cy="29" r="7" fill="rgba(255,255,255,0.15)"/></>
    : mood==='celebrate'
    ? <><text x="12" y="30" fontSize="12" fill="#FFD166">✦</text><text x="95" y="22" fontSize="10" fill="#06D6A0">✦</text><text x="5" y="55" fontSize="8" fill="#FF6B35">★</text><text x="104" y="48" fontSize="8" fill="#FFD166">★</text></>
    : null;

  return (
    <svg viewBox="0 0 120 150" width={size} height={size * 1.25} style={{ display:'block', overflow:'visible' }}>
      <ellipse cx="23" cy="30" rx="22" ry="24" fill="#7878A0"/>
      <ellipse cx="23" cy="32" rx="14" ry="16" fill="#E0B8D0"/>
      <ellipse cx="97" cy="30" rx="22" ry="24" fill="#7878A0"/>
      <ellipse cx="97" cy="32" rx="14" ry="16" fill="#E0B8D0"/>
      <ellipse cx="60" cy="120" rx="30" ry="28" fill="#7878A0"/>
      <ellipse cx="60" cy="122" rx="20" ry="18" fill="#C8C8D8"/>
      <ellipse cx="60" cy="63"  rx="40" ry="38" fill="#9090AA"/>
      <ellipse cx="60" cy="72"  rx="16" ry="12" fill="#262638"/>
      <ellipse cx="60" cy="70"  rx="9"  ry="5"  fill="#3A3A58"/>
      <ellipse cx="57" cy="68"  rx="4"  ry="2.5" fill="rgba(255,255,255,0.12)"/>
      {eyes[mood] || eyes.happy}
      {mouths[mood] || mouths.happy}
      <ellipse cx="20" cy="108" rx="9" ry="18" fill="#9090AA" transform="rotate(20,20,108)"/>
      {rightArm}
      {extras}
    </svg>
  );
}

const MOOD_IDLE_ANIMATE = {
  happy:    { y:[0,-8,0] },
  sleepy:   { rotate:[0,-5,0] },
  excited:  { y:[0,-12,0], scale:[1,1.06,1] },
  thinking: { rotate:[0,5,-3,0] },
  wave:     { y:[0,-7,0] },
  cool:     { rotate:[0,-5,0] },
  celebrate:{ y:[0,-16,0], rotate:[-7,7,-7] },
};
const MOOD_IDLE_TRANS = {
  happy:    { duration:3,    repeat:Infinity, ease:'easeInOut' },
  sleepy:   { duration:5,    repeat:Infinity, ease:'easeInOut' },
  excited:  { duration:0.52, repeat:Infinity, ease:'easeInOut' },
  thinking: { duration:2.5,  repeat:Infinity, ease:'easeInOut' },
  wave:     { duration:3.2,  repeat:Infinity, ease:'easeInOut' },
  cool:     { duration:4,    repeat:Infinity, ease:'easeInOut' },
  celebrate:{ duration:0.75, repeat:Infinity, ease:'easeInOut' },
};

function KoalaHeader({ mood, speech, animKey, stepId }) {
  const haloColor = STEP_ACCENT[stepId] ?? '#FF6B35';
  return (
    <Box sx={{ display:'flex', alignItems:'flex-start', gap:2, mb:2.5 }}>
      <motion.div
        key={animKey}
        initial={{ opacity:0, scale:0.35, y:36, rotate:-14 }}
        animate={{ opacity:1, scale:1,    y:0,  rotate:0  }}
        transition={{ type:'spring', stiffness:420, damping:22 }}
        style={{ flexShrink:0, willChange:'transform, opacity', position:'relative' }}
      >
        <Box sx={{
          position:'absolute', top:'50%', left:'50%',
          transform:'translate(-50%,-50%)',
          width:116, height:116, borderRadius:'50%',
          background:`radial-gradient(circle, ${haloColor}42 0%, transparent 70%)`,
          filter:'blur(20px)',
          animation:'haloBreath 2.6s ease-in-out infinite',
          pointerEvents:'none',
          transition:'background 0.5s ease',
        }}/>
        <motion.div animate={MOOD_IDLE_ANIMATE[mood]} transition={MOOD_IDLE_TRANS[mood]}
          style={{ willChange:'transform', position:'relative', zIndex:1 }}>
          <Koala mood={mood} size={92} />
        </motion.div>
      </motion.div>
      <Box sx={{ pt:1 }}>
        <SpeechBubble text={speech} animKey={animKey} />
      </Box>
    </Box>
  );
}

// ─── Step flash: radial burst on every step change ────────────────────────────
function StepFlash({ stepId }) {
  const [key, setKey] = useState(0);
  const prevId = useRef(stepId);
  const color  = STEP_ACCENT[stepId] ?? '#00E8A2';

  useEffect(() => {
    if (prevId.current === stepId) return;
    prevId.current = stepId;
    setKey(k => k + 1);
  }, [stepId]);

  return (
    <Box sx={{ position:'fixed', inset:0, zIndex:90, pointerEvents:'none',
      display:'flex', alignItems:'center', justifyContent:'center' }}>
      <AnimatePresence>
        <motion.div
          key={key}
          initial={{ scale:0, opacity:0.75 }}
          animate={{ scale:7, opacity:0 }}
          exit={{}}
          transition={{ duration:0.7, ease:[0, 0, 0.18, 1] }}
          style={{
            width:200, height:200, borderRadius:'50%',
            background:`radial-gradient(circle, ${color}88 0%, ${color}33 45%, transparent 70%)`,
            willChange:'transform, opacity',
          }}
        />
      </AnimatePresence>
    </Box>
  );
}

// ─── Confetti ─────────────────────────────────────────────────────────────────
const CONFETTI = [
  {l:'8%', c:'#FFD166',s:8, r:2, delay:0   },{l:'18%',c:'#06D6A0',s:7, r:7, delay:0.3 },
  {l:'30%',c:'#FF6B35',s:11,r:2, delay:0.6 },{l:'44%',c:'#FFD166',s:7, r:7, delay:0.1 },
  {l:'57%',c:'#EF476F',s:9, r:3, delay:0.45},{l:'68%',c:'#06D6A0',s:6, r:6, delay:0.2 },
  {l:'80%',c:'#FF6B35',s:8, r:2, delay:0.7 },{l:'13%',c:'#EF476F',s:5, r:9, delay:0.55},
  {l:'50%',c:'#FFD166',s:7, r:3, delay:0.35},{l:'88%',c:'#06D6A0',s:6, r:6, delay:0.15},
  {l:'25%',c:'#FF6B35',s:10,r:2, delay:0.8 },{l:'72%',c:'#FFD166',s:5, r:8, delay:0.25},
];
function Confetti() {
  return (
    <Box sx={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', overflow:'hidden' }}>
      {CONFETTI.map((c,i) => (
        <motion.div key={i}
          initial={{ y:-20, opacity:0.9, rotate:0 }}
          animate={{ y:'105vh', opacity:0, rotate:360+i*45 }}
          transition={{ duration:1.8+(i%3)*0.4, delay:c.delay, repeat:Infinity, ease:'easeIn' }}
          style={{ position:'absolute', left:c.l, width:c.s, height:c.r,
            borderRadius:c.s===c.r?'50%':2, background:c.c, willChange:'transform, opacity' }}
        />
      ))}
    </Box>
  );
}

// ─── Floating particles ───────────────────────────────────────────────────────
const PARTICLES = [
  {l:'7%',  w:18,h:10,dur:12,delay:0,   rot:20,  c:'linear-gradient(135deg,#5A8A50,#3D6B34)'},
  {l:'57%', w:12,h:7, dur:15,delay:2.2, rot:-20, c:'linear-gradient(135deg,#4A7A44,#2D5A2A)'},
  {l:'83%', w:16,h:9, dur:13,delay:1.2, rot:15,  c:'linear-gradient(135deg,#6A9A60,#4D7A44)'},
  {l:'31%', w:8, h:8, dur:10,delay:3.5, rot:0,   c:'rgba(255,209,102,0.28)'},
  {l:'70%', w:6, h:6, dur:17,delay:1.8, rot:0,   c:'rgba(0,232,162,0.22)'},
  {l:'45%', w:5, h:5, dur:14,delay:4,   rot:0,   c:'rgba(192,132,252,0.25)'},
];
function FloatingLeaves() {
  return (
    <Box sx={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', overflow:'hidden' }}>
      {PARTICLES.map((p,i) => (
        <motion.div key={i}
          initial={{ y:-40, opacity:0, rotate:p.rot }}
          animate={{ y:'114vh', opacity:[0,0.3,0.24,0], rotate:p.rot+210 }}
          transition={{ duration:p.dur, delay:p.delay, repeat:Infinity, ease:'linear' }}
          style={{ position:'absolute', left:p.l, width:p.w, height:p.h,
            borderRadius:p.h===p.w?'50%':'50% 50% 50% 50% / 30% 30% 70% 70%',
            background:p.c, willChange:'transform, opacity', transform:'translateZ(0)' }}
        />
      ))}
    </Box>
  );
}

// ─── Aurora background — Framer-animated color shifts ─────────────────────────
const STARS = [...Array(16)].map((_,i) => ({
  left:`${(i*37+i*i*3)%100}%`, top:`${(i*53+i*7)%80}%`,
  size: i%3===0?2.8:1.5, dur:`${2+i*0.35}s`, delay:`${(i*0.28)%4}s`,
}));

function Background({ stepId }) {
  const color  = STEP_ACCENT[stepId] ?? '#00E8A2';
  const color2 = stepId === 'summary' ? '#FF9F35' : '#FF6B35';

  return (
    <Box sx={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', overflow:'hidden' }}>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />

      {/* Base */}
      <Box sx={{ position:'absolute', inset:0, background:'linear-gradient(170deg,#020610 0%,#060916 55%,#040414 100%)' }}/>

      {/* Primary accent orb — Framer-animated so color transitions are instant+smooth */}
      <motion.div
        animate={{ background:`radial-gradient(circle, ${color}60 0%, transparent 68%)` }}
        transition={{ duration:0.55, ease:'easeOut' }}
        style={{
          position:'absolute', width:620, height:620, borderRadius:'50%',
          top:-220, right:-190, filter:'blur(88px)',
          animation:'auroraDrift1 18s ease-in-out infinite',
          willChange:'transform',
        }}
      />

      {/* Secondary warm orb */}
      <motion.div
        animate={{ background:`radial-gradient(circle, ${color2}38 0%, transparent 70%)` }}
        transition={{ duration:0.65, ease:'easeOut' }}
        style={{
          position:'absolute', width:460, height:460, borderRadius:'50%',
          bottom:-120, left:-140, filter:'blur(78px)',
          animation:'auroraDrift2 24s ease-in-out infinite',
          willChange:'transform',
        }}
      />

      {/* Mid floating orb */}
      <motion.div
        animate={{ background:`radial-gradient(circle, ${color}22 0%, transparent 65%)` }}
        transition={{ duration:0.7, ease:'easeOut' }}
        style={{
          position:'absolute', width:340, height:340, borderRadius:'50%',
          top:'28%', left:'15%', filter:'blur(65px)',
          animation:'auroraDrift3 28s ease-in-out infinite',
          willChange:'transform',
        }}
      />

      {/* Horizontal aurora band */}
      <motion.div
        animate={{ background:`linear-gradient(0deg, transparent 0%, ${color}10 50%, transparent 100%)` }}
        transition={{ duration:0.5 }}
        style={{ position:'absolute', left:0, right:0, top:'40%', height:130, filter:'blur(22px)' }}
      />

      {/* Stars */}
      {STARS.map((s,i) => (
        <Box key={i} sx={{
          position:'absolute', left:s.left, top:s.top,
          width:s.size, height:s.size, borderRadius:'50%',
          background:'rgba(255,255,255,0.9)',
          animation:`twinkleNew ${s.dur} ease-in-out infinite`,
          animationDelay:s.delay,
          willChange:'opacity, transform',
        }}/>
      ))}

      {/* Vignette */}
      <Box sx={{ position:'absolute', inset:0,
        background:'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.6) 100%)' }}/>
    </Box>
  );
}

// ─── Eucalyptus branch ────────────────────────────────────────────────────────
function EucalyptusBranch() {
  return (
    <svg viewBox="0 0 320 120" width="320" height="120" style={{ display:'block', overflow:'visible' }}>
      <path d="M 0 40 Q 80 35 160 45 Q 240 55 320 42" stroke="#4A6741" strokeWidth="7" fill="none" strokeLinecap="round"/>
      <path d="M 55 38 Q 45 18 35 8"    stroke="#4A6741" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d="M 130 43 Q 120 22 108 12" stroke="#4A6741" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d="M 200 47 Q 212 28 222 16" stroke="#4A6741" strokeWidth="4" fill="none" strokeLinecap="round"/>
      <path d="M 268 43 Q 275 24 282 13" stroke="#4A6741" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
      {[[30,6,-30],[22,12,-50],[40,4,-10],[104,10,-35],[112,8,-15],[96,16,-55],
        [224,14,25],[216,8,10],[232,18,40],[280,11,20],[288,7,35]]
        .map(([cx,cy,rot],i) => (
          <ellipse key={i} cx={cx} cy={cy} rx="10" ry="5.5" fill="#5A8A50"
            transform={`rotate(${rot},${cx},${cy})`} opacity="0.85"/>
        ))}
      <path d="M 160 45 L 160 78" stroke="#6B5A3E" strokeWidth="3" strokeLinecap="round" strokeDasharray="3,3"/>
    </svg>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function OnboardingFlow() {
  const { session, completeOnboarding, setPendingOnboarding, setShowAuthDirectly } = useApp();
  const [step,      setStep]      = useState(0);
  const [direction, setDirection] = useState(1);
  const [animKey,   setAnimKey]   = useState(0);
  const [saving,    setSaving]    = useState(false);
  const [saveError, setSaveError] = useState('');
  const [btnBurst,  setBtnBurst]  = useState(false);
  const [data, setData] = useState({
    name:'', wakeTime:'07:00', morningRating:3, favoriteGame:'math', wakeGoal:'', profileIcon:'bolt',
  });

  const currentId = STEP_IDS[step];
  const cfg       = STEP_CONFIG[currentId] ?? STEP_CONFIG.welcome;
  const isWelcome = currentId === 'welcome';
  const isSummary = currentId === 'summary';
  const accent    = STEP_ACCENT[currentId] ?? '#FF6B35';

  function go(delta) {
    setDirection(delta);
    setStep(s => s + delta);
    setAnimKey(k => k + 1);
  }

  async function handleNext() {
    if (currentId === 'summary') {
      if (session) {
        setSaving(true); setSaveError('');
        try   { await completeOnboarding(data); }
        catch { setSaveError('Failed to save. Please try again.'); setSaving(false); }
      } else {
        setPendingOnboarding(data);
      }
    } else {
      go(1);
    }
  }

  function handleButtonClick() {
    if (!canProceed() || saving) return;
    setBtnBurst(true);
    setTimeout(() => setBtnBurst(false), 700);
    handleNext();
  }

  function canProceed() {
    if (currentId === 'name') return data.name.trim().length >= 2;
    if (currentId === 'goal') return data.wakeGoal.trim().length > 0;
    return true;
  }

  function patch(u) { setData(d => ({ ...d, ...u })); }

  return (
    <Box sx={{ height:'100dvh', minHeight:'-webkit-fill-available', display:'flex', flexDirection:'column', position:'relative', overflow:'hidden' }}>
      <Background stepId={currentId} />
      <FloatingLeaves />
      <StepFlash stepId={currentId} />
      {isSummary && <Confetti />}

      {/* Button burst — fires from CTA on Continue press */}
      <AnimatePresence>
        {btnBurst && (
          <motion.div
            key="btnburst"
            initial={{ scale:0, opacity:0.8 }}
            animate={{ scale:14, opacity:0 }}
            exit={{}}
            transition={{ duration:0.65, ease:[0, 0.5, 0.18, 1] }}
            style={{
              position:'fixed', bottom:80, left:'50%', translateX:'-50%',
              width:70, height:70, borderRadius:'50%',
              background:`radial-gradient(circle, ${accent}BB 0%, transparent 70%)`,
              zIndex:98, pointerEvents:'none', willChange:'transform, opacity',
            }}
          />
        )}
      </AnimatePresence>

      <Box sx={{ position:'relative', zIndex:1, flex:1, display:'flex', flexDirection:'column' }}>
        {/* Top bar */}
        <Box sx={{ px:3, pt:'max(env(safe-area-inset-top), 66px)', pb:1, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <AnimatePresence mode="popLayout">
            {step > 0 && (
              <motion.div key="back"
                initial={{ opacity:0, x:-18, scale:0.75 }}
                animate={{ opacity:1, x:0,   scale:1    }}
                exit={{    opacity:0, x:-18, scale:0.75 }}
                transition={{ type:'spring', stiffness:420, damping:28 }}
              >
                <motion.div whileTap={{ scale:0.84 }}>
                  <IconButton onClick={() => go(-1)} size="small"
                    sx={{
                      color:'rgba(255,255,255,0.6)',
                      bgcolor:'rgba(255,255,255,0.06)',
                      border:'1px solid rgba(255,255,255,0.08)',
                      backdropFilter:'blur(8px)',
                      '&:hover':{ bgcolor:'rgba(255,255,255,0.1)' },
                    }}>
                    <ArrowBackIcon fontSize="small"/>
                  </IconButton>
                </motion.div>
              </motion.div>
            )}
            {step === 0 && <Box key="spacer" sx={{ width:36 }}/>}
          </AnimatePresence>

          <motion.div animate={{ opacity:1 }} initial={{ opacity:0 }} transition={{ delay:0.45 }}
            style={{ display:'flex', alignItems:'center', gap:6 }}>
            <motion.div animate={{ color: accent }} transition={{ duration:0.5 }}>
              <WbSunnyIcon sx={{ fontSize:14 }}/>
            </motion.div>
            <motion.div animate={{ color: accent }} transition={{ duration:0.5 }}>
              <Typography sx={{ fontSize:'0.65rem', fontWeight:800, letterSpacing:2.3, fontFamily:'"Outfit", sans-serif' }}>
                MORNINMATE
              </Typography>
            </motion.div>
          </motion.div>

          <Box sx={{ width:36 }}/>
        </Box>

        {/* Progress track */}
        <motion.div
          animate={{ opacity: isWelcome ? 0 : 1, y: isWelcome ? -16 : 0 }}
          transition={{ type:'spring', stiffness:260, damping:28 }}
          style={{ pointerEvents: isWelcome ? 'none' : 'auto' }}
        >
          <KoalaProgressTrack step={step} totalSteps={STEP_IDS.length} stepId={currentId} />
        </motion.div>

        {/* Page content */}
        <Box sx={{ flex:1, position:'relative', overflow:'hidden', perspective:'1200px' }}>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={animKey}
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              style={{
                position:'absolute', inset:0,
                display:'flex', flexDirection:'column',
                justifyContent: isWelcome ? 'center' : 'flex-start',
                padding: isWelcome ? '0 24px' : '8px 24px 16px',
                overflowY:'auto',
                willChange:'transform, opacity, filter',
              }}
            >
              {currentId === 'welcome'     && <WelcomeStep />}
              {currentId === 'name'        && <><KoalaHeader mood={cfg.mood} speech={cfg.speech} animKey={animKey} stepId={currentId}/><NameStep value={data.name} onChange={v=>patch({name:v})} onSubmit={() => canProceed() && handleButtonClick()}/></>}
              {currentId === 'avatar'      && <><KoalaHeader mood={cfg.mood} speech={cfg.speech} animKey={animKey} stepId={currentId}/><AvatarStep value={data.profileIcon} onChange={v=>patch({profileIcon:v})}/></>}
              {currentId === 'wakeTime'    && <><KoalaHeader mood={cfg.mood} speech={cfg.speech} animKey={animKey} stepId={currentId}/><WakeTimeStep value={data.wakeTime} onChange={v=>patch({wakeTime:v})}/></>}
              {currentId === 'morningType' && <><KoalaHeader mood={cfg.mood} speech={cfg.speech} animKey={animKey} stepId={currentId}/><MorningTypeStep value={data.morningRating} onChange={v=>patch({morningRating:v})}/></>}
              {currentId === 'game'        && <><KoalaHeader mood={cfg.mood} speech={cfg.speech} animKey={animKey} stepId={currentId}/><GameStep value={data.favoriteGame} onChange={v=>patch({favoriteGame:v})}/></>}
              {currentId === 'goal'        && <><KoalaHeader mood={cfg.mood} speech={cfg.speech} animKey={animKey} stepId={currentId}/><GoalStep value={data.wakeGoal} onChange={v=>patch({wakeGoal:v})}/></>}
              {currentId === 'summary'     && <SummaryStep data={data} speech={cfg.speech} animKey={animKey}/>}
            </motion.div>
          </AnimatePresence>
        </Box>

        {/* CTA */}
        <Box sx={{
          px:3, pt:1, pb:'max(24px, env(safe-area-inset-bottom))',
          position:'relative', zIndex:2,
          background:'linear-gradient(0deg, rgba(4,4,16,0.96) 0%, transparent 100%)',
          backdropFilter:'blur(18px)',
          WebkitBackdropFilter:'blur(18px)',
        }}>
          {saveError && <Alert severity="error" sx={{ borderRadius:3, mb:2 }}>{saveError}</Alert>}
          <motion.div
            whileHover={canProceed() ? { scale:1.03 } : {}}
            whileTap={canProceed()   ? { scale:0.95 } : {}}
            transition={{ type:'spring', stiffness:520, damping:26 }}
            style={{ position:'relative', borderRadius:16, willChange:'transform' }}
          >
            {/* Glow halo */}
            {canProceed() && (
              <motion.div
                animate={{ opacity:[0.28, 0.7, 0.28], scale:[1, 1.03, 1] }}
                transition={{ duration:2.6, repeat:Infinity, ease:'easeInOut' }}
                style={{
                  position:'absolute', inset:-6, borderRadius:22,
                  background:`radial-gradient(ellipse at 50% 110%, ${accent}60 0%, transparent 68%)`,
                  willChange:'opacity, transform', pointerEvents:'none',
                }}
              />
            )}
            <Button
              fullWidth variant="contained" size="large"
              onClick={handleButtonClick}
              disabled={!canProceed() || saving}
              sx={{
                py:1.85, fontWeight:800, borderRadius:'16px',
                fontSize:'1rem', letterSpacing:0.4,
                position:'relative', zIndex:1, overflow:'hidden',
                fontFamily:'"Outfit", sans-serif',
                background: canProceed()
                  ? `linear-gradient(130deg, ${accent} 0%, #FF8C5A 55%, ${accent}BB 100%)`
                  : undefined,
                boxShadow: canProceed() ? `0 8px 28px ${accent}50` : 'none',
                transition:'background 0.5s ease, box-shadow 0.35s ease',
              }}
            >
              {/* Shimmer sweep */}
              {canProceed() && !saving && (
                <Box sx={{ position:'absolute', inset:0, overflow:'hidden', borderRadius:'16px', pointerEvents:'none' }}>
                  <Box sx={{
                    position:'absolute', top:0, bottom:0, width:'38%',
                    background:'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)',
                    animation:'shimmerSweep 2.6s ease-in-out infinite',
                    animationDelay:'0.5s',
                  }}/>
                </Box>
              )}
              {saving
                ? <CircularProgress size={22} sx={{ color:'#fff' }}/>
                : currentId==='welcome' ? "Let's go, mate! →"
                : currentId==='summary' ? 'Create My Account 🚀'
                : 'Continue →'}
            </Button>
          </motion.div>

          {currentId === 'welcome' && (
            <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
              transition={{ delay:1.0, type:'spring', stiffness:260, damping:26 }}>
              <Typography variant="body2" color="text.secondary" textAlign="center"
                sx={{ mt:2, fontFamily:'"Outfit", sans-serif' }}>
                Already have an account?{' '}
                <Box component="span" onClick={() => setShowAuthDirectly(true)}
                  sx={{ color:accent, fontWeight:700, cursor:'pointer', transition:'color 0.4s', '&:hover':{ textDecoration:'underline' } }}>
                  Sign in
                </Box>
              </Typography>
            </motion.div>
          )}
        </Box>
      </Box>
    </Box>
  );
}

// ─── Welcome step ─────────────────────────────────────────────────────────────
const TITLE_CHARS = 'MorninMate'.split('');

function WelcomeStep() {
  return (
    <Box sx={{ textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center' }}>
      {/* Branch + koala */}
      <motion.div
        initial={{ opacity:0, y:-30, scale:0.85 }}
        animate={{ opacity:1, y:0,   scale:1    }}
        transition={{ type:'spring', stiffness:220, damping:22, delay:0.05 }}
      >
        <motion.div
          animate={{ rotate:[-1.5, 1.5] }}
          transition={{ duration:4.5, repeat:Infinity, repeatType:'mirror', ease:'easeInOut' }}
          style={{ transformOrigin:'left center' }}
        >
          <div style={{ transform:'scale(0.78)', transformOrigin:'top center', display:'inline-block', position:'relative' }}>
            <EucalyptusBranch />
            <motion.div
              animate={{ rotate:[-4, 4] }}
              transition={{ duration:4.5, repeat:Infinity, repeatType:'mirror', ease:'easeInOut' }}
              style={{ position:'absolute', top:68, left:'50%', translateX:'-50%', transformOrigin:'top center' }}
            >
              <Koala mood="wave" size={96} />
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      {/* Letter-by-letter title */}
      <Box sx={{ display:'flex', justifyContent:'center', mt:1.5, mb:0.5 }}>
        {TITLE_CHARS.map((char, i) => (
          <motion.span
            key={i}
            initial={{ opacity:0, y:52, scale:0.32, rotate: i % 2 === 0 ? -20 : 20 }}
            animate={{ opacity:1, y:0,  scale:1,    rotate:0 }}
            transition={{ type:'spring', stiffness:700, damping:21, delay:0.08 + i * 0.046 }}
            style={{
              display:'inline-block',
              fontFamily:'"Fraunces", serif',
              fontSize:'clamp(2.4rem, 9vw, 3.2rem)',
              fontWeight:900,
              letterSpacing:'-1px',
              lineHeight:1.05,
              background:'linear-gradient(162deg, #ffffff 0%, #c8f5e4 42%, #00E8A2 100%)',
              WebkitBackgroundClip:'text',
              WebkitTextFillColor:'transparent',
              backgroundClip:'text',
              willChange:'transform, opacity',
            }}
          >
            {char}
          </motion.span>
        ))}
      </Box>

      <motion.div
        initial={{ opacity:0, y:18, scale:0.92 }}
        animate={{ opacity:1, y:0,  scale:1    }}
        transition={{ type:'spring', stiffness:300, damping:26, delay:0.62 }}
      >
        <Typography sx={{
          fontWeight:700, mb:2, fontSize:'1rem',
          fontFamily:'"Outfit", sans-serif',
          color:'rgba(255,255,255,0.68)',
          letterSpacing:0.2,
        }}>
          Wake up. Level up. No worries.
        </Typography>
      </motion.div>

      <motion.div
        initial={{ opacity:0, y:16 }}
        animate={{ opacity:1, y:0  }}
        transition={{ type:'spring', stiffness:260, damping:24, delay:0.76 }}
      >
        <Typography sx={{
          maxWidth:285, mx:'auto', lineHeight:1.72,
          fontFamily:'"Outfit", sans-serif',
          color:'rgba(255,255,255,0.4)',
          fontSize:'0.89rem',
        }}>
          Earn XP, build streaks, and actually wake up — one game at a time.
        </Typography>
      </motion.div>

      <motion.div
        initial={{ opacity:0, y:14 }}
        animate={{ opacity:1, y:0  }}
        transition={{ type:'spring', stiffness:240, damping:24, delay:0.92 }}
        style={{ display:'flex', gap:9, justifyContent:'center', flexWrap:'wrap', marginTop:22 }}
      >
        {[
          { Icon:SportsEsportsIcon, label:'Mini-games', c:'#FF6B35' },
          { Icon:EmojiObjectsIcon,  label:'XP & Levels', c:'#FFD166' },
          { Icon:FlashOnIcon,       label:'Streaks', c:'#00E8A2' },
        ].map(({ Icon, label, c }, idx) => (
          <motion.div key={label}
            initial={{ opacity:0, scale:0.7, y:12 }}
            animate={{ opacity:1, scale:1,   y:0  }}
            transition={{ type:'spring', stiffness:420, damping:22, delay:0.96 + idx * 0.09 }}
            whileHover={{ scale:1.07, y:-3 }}
            whileTap={{ scale:0.93 }}
          >
            <Box sx={{
              px:1.8, py:0.85, borderRadius:12,
              background:'rgba(255,255,255,0.05)',
              border:'1px solid rgba(255,255,255,0.09)',
              backdropFilter:'blur(10px)',
              display:'flex', alignItems:'center', gap:0.7,
              boxShadow:'0 4px 18px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}>
              <Icon sx={{ fontSize:13, color:c }}/>
              <Typography sx={{ fontSize:'0.72rem', fontWeight:600, color:'rgba(255,255,255,0.62)', fontFamily:'"Outfit", sans-serif' }}>
                {label}
              </Typography>
            </Box>
          </motion.div>
        ))}
      </motion.div>
    </Box>
  );
}

// ─── Name step ────────────────────────────────────────────────────────────────
function NameStep({ value, onChange, onSubmit }) {
  const [focused, setFocused] = useState(false);

  return (
    <motion.div variants={sectionStagger} initial="hidden" animate="show">
      <motion.div variants={sectionItem}>
        <StepHeader Icon={PersonIcon} title="First things first —" subtitle="What should we call you, mate?" />
      </motion.div>
      <motion.div variants={sectionItem} style={{ marginTop:28 }}>
        <motion.div
          animate={{
            boxShadow: focused
              ? '0 0 0 2px #FF7A9A, 0 8px 36px rgba(255,122,154,0.22)'
              : '0 0 0 1px rgba(255,255,255,0.07), 0 4px 20px rgba(0,0,0,0.28)',
          }}
          transition={{ duration:0.2 }}
          style={{ borderRadius:16 }}
        >
          <Box sx={{
            borderRadius:'16px',
            bgcolor: focused ? 'rgba(255,122,154,0.08)' : 'rgba(255,255,255,0.04)',
            transition:'background 0.2s',
            px:3, py:2.2,
            display:'flex', alignItems:'center', gap:1.5,
          }}>
            <PersonIcon sx={{ color:focused?'#FF7A9A':'rgba(255,255,255,0.22)', fontSize:'1.35rem', transition:'color 0.2s', flexShrink:0 }} />
            <Box component="input" autoFocus autoComplete="off" placeholder="Your name"
              value={value} maxLength={30}
              onChange={e => onChange(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={e => e.key === 'Enter' && onSubmit()}
              sx={{
                flex:1, background:'none', border:'none', outline:'none',
                color:'#fff', caretColor:'#FF7A9A',
                fontSize:'1.5rem', fontWeight:700, fontFamily:'"Fraunces", serif',
                '&::placeholder':{ color:'rgba(255,255,255,0.18)', fontWeight:400, fontFamily:'"Outfit", sans-serif' },
              }}
            />
          </Box>
        </motion.div>
        <AnimatePresence>
          {value.trim().length >= 2 && (
            <motion.div
              initial={{ opacity:0, y:10, scale:0.92 }}
              animate={{ opacity:1, y:0,  scale:1    }}
              exit={{    opacity:0, y:5,  scale:0.92 }}
              transition={{ type:'spring', stiffness:420, damping:24 }}
            >
              <Typography sx={{ textAlign:'center', mt:2.5, fontFamily:'"Outfit", sans-serif', fontSize:'0.88rem', color:'rgba(255,255,255,0.48)' }}>
                G'day, <Box component="span" sx={{ color:'#FF7A9A', fontWeight:700 }}>{value.trim()}</Box>! Ripper name 🐨
              </Typography>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// ─── Wake time step ───────────────────────────────────────────────────────────
function WakeTimeStep({ value, onChange }) {
  const [h] = value.split(':').map(Number);
  const ctx = h<4  ?{l:'Deep night',   c:'#8B5CF6', Icon:NightsStayIcon }
             :h<6  ?{l:'Before dawn',  c:'#EF476F', Icon:WbTwilightIcon }
             :h<8  ?{l:'Early riser',  c:'#FF6B35', Icon:WbTwilightIcon }
             :h<10 ?{l:'Sweet spot',   c:'#FFA94D', Icon:WbSunnyIcon    }
             :h<12 ?{l:'Late morning', c:'#06D6A0', Icon:WbSunnyIcon    }
             :h<14 ?{l:'Midday',       c:'#FFD166', Icon:LightModeIcon  }
             :h<17 ?{l:'Afternoon',    c:'#FF8C5A', Icon:WbCloudyIcon   }
             :h<20 ?{l:'Evening',      c:'#FF6B35', Icon:Brightness4Icon}
             :h<22 ?{l:'Night',        c:'#8B5CF6', Icon:NightsStayIcon }
             :      {l:'Late night',   c:'#A0A0B8', Icon:HotelIcon      };

  return (
    <motion.div variants={sectionStagger} initial="hidden" animate="show">
      <motion.div variants={sectionItem}>
        <StepHeader Icon={AlarmIcon} title="When do you want to wake up?" subtitle="Tap to set your wake-up time."/>
      </motion.div>
      <motion.div variants={sectionItem}>
        <TimePicker value={value} onChange={onChange}/>
      </motion.div>
      <motion.div variants={sectionItem} style={{ display:'flex', justifyContent:'center', marginTop:20 }}>
        <AnimatePresence mode="wait">
          <motion.div key={ctx.l}
            initial={{ opacity:0, y:8, scale:0.88 }}
            animate={{ opacity:1, y:0, scale:1   }}
            exit={{    opacity:0, y:-8, scale:0.88 }}
            transition={{ duration:0.2, ease:'easeOut' }}
            style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'7px 18px',
              borderRadius:100, background:`${ctx.c}18`, border:`1px solid ${ctx.c}40`,
              boxShadow:`0 4px 18px ${ctx.c}20` }}
          >
            <ctx.Icon sx={{ fontSize:'0.95rem', color:ctx.c }}/>
            <Typography sx={{ fontSize:'0.8rem', fontWeight:700, color:ctx.c, letterSpacing:0.4, fontFamily:'"Outfit", sans-serif' }}>
              {ctx.l}
            </Typography>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// ─── Morning type step ────────────────────────────────────────────────────────
function MorningTypeStep({ value, onChange }) {
  const ac = STEP_ACCENT.morningType;
  return (
    <Box>
      <StepHeader Icon={EmojiPeopleIcon} title="What kind of morning person are you?" subtitle="Be honest — this shapes your experience."/>
      <motion.div variants={listContainer} initial="hidden" animate="show"
        style={{ display:'flex', flexDirection:'column', gap:10, marginTop:20 }}>
        {MORNING_TYPES.map(type => {
          const sel = value === type.value;
          return (
            <motion.div key={type.value} variants={listItem}
              whileHover={{ scale:1.016, x:4 }}
              whileTap={{ scale:0.972 }}
              onClick={() => onChange(type.value)}
              transition={{ type:'spring', stiffness:400, damping:24 }}
              style={{ cursor:'pointer' }}
            >
              <motion.div
                animate={{
                  borderColor: sel ? `${ac}65` : 'rgba(255,255,255,0.06)',
                  backgroundColor: sel ? `${ac}14` : 'rgba(12,12,28,0.58)',
                  boxShadow: sel ? `0 6px 28px ${ac}30, inset 0 1px 0 rgba(255,255,255,0.05)` : '0 2px 14px rgba(0,0,0,0.3)',
                }}
                transition={{ type:'spring', stiffness:360, damping:26 }}
                style={{ padding:'14px 16px', borderRadius:14, border:'1px solid rgba(255,255,255,0.06)',
                  display:'flex', alignItems:'center', gap:14, position:'relative', overflow:'hidden' }}
              >
                {/* Selection ripple */}
                <AnimatePresence>
                  {sel && (
                    <motion.div key="ripple"
                      initial={{ scale:0, opacity:0.6 }}
                      animate={{ scale:2.5, opacity:0 }}
                      exit={{}}
                      transition={{ duration:0.5, ease:[0, 0, 0.2, 1] }}
                      style={{ position:'absolute', inset:0, borderRadius:14,
                        border:`2px solid ${ac}`, pointerEvents:'none' }}
                    />
                  )}
                </AnimatePresence>
                {/* Left accent bar */}
                <motion.div
                  animate={{ opacity:sel?1:0, scaleY:sel?1:0 }}
                  transition={{ type:'spring', stiffness:420, damping:24 }}
                  style={{ position:'absolute', left:0, top:8, bottom:8, width:3, borderRadius:4,
                    background:`linear-gradient(180deg, ${ac}, ${ac}66)`,
                    boxShadow:`0 0 10px ${ac}` }}
                />
                <Box sx={{ width:36, height:36, borderRadius:2.5, flexShrink:0, transition:'background 0.2s',
                  bgcolor: sel ? `${ac}20` : 'rgba(255,255,255,0.05)',
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <type.Icon sx={{ fontSize:'1.3rem', color:sel?ac:'rgba(255,255,255,0.4)' }}/>
                </Box>
                <Box sx={{ flex:1 }}>
                  <Typography sx={{ fontWeight:700, fontSize:'0.95rem', fontFamily:'"Outfit", sans-serif', color:sel?'#fff':'rgba(255,255,255,0.88)' }}>{type.label}</Typography>
                  <Typography sx={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.4)', fontFamily:'"Outfit", sans-serif' }}>{type.desc}</Typography>
                </Box>
                <motion.div
                  animate={{ scale:sel?1:0.82, backgroundColor:sel?ac:'transparent', borderColor:sel?ac:'rgba(255,255,255,0.18)' }}
                  transition={{ type:'spring', stiffness:420, damping:22 }}
                  style={{ width:20, height:20, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.18)',
                    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}
                >
                  {sel && <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:'spring', stiffness:700, damping:20 }}>
                    <CheckIcon sx={{ fontSize:10, color:'#fff' }}/>
                  </motion.div>}
                </motion.div>
              </motion.div>
            </motion.div>
          );
        })}
      </motion.div>
    </Box>
  );
}

// ─── Game step ────────────────────────────────────────────────────────────────
function GameStep({ value, onChange }) {
  return (
    <Box>
      <StepHeader Icon={SportsEsportsIcon} title="Pick your wake-up game" subtitle="This is how you'll prove you're actually awake."/>
      <motion.div variants={listContainer} initial="hidden" animate="show"
        style={{ display:'flex', flexDirection:'column', gap:13, marginTop:20 }}>
        {GAMES.map(game => {
          const sel = value === game.value;
          return (
            <motion.div key={game.value} variants={fadeUpItem}
              whileHover={{ scale:1.022, y:-2 }}
              whileTap={{ scale:0.972 }}
              onClick={() => onChange(game.value)}
              transition={{ type:'spring', stiffness:380, damping:24 }}
              style={{ cursor:'pointer' }}
            >
              <motion.div
                animate={{
                  borderColor: sel ? `${game.color}58` : 'rgba(255,255,255,0.06)',
                  backgroundColor: sel ? `${game.color}13` : 'rgba(12,12,28,0.58)',
                  boxShadow: sel
                    ? `0 12px 36px ${game.color}30, 0 0 0 1px ${game.color}32, inset 0 1px 0 rgba(255,255,255,0.06)`
                    : '0 3px 16px rgba(0,0,0,0.32)',
                }}
                transition={{ type:'spring', stiffness:300, damping:24 }}
                style={{ padding:'18px 16px', borderRadius:16, border:'1px solid rgba(255,255,255,0.06)',
                  display:'flex', alignItems:'center', gap:16, position:'relative', overflow:'hidden' }}
              >
                {/* Selection ripple */}
                <AnimatePresence>
                  {sel && (
                    <motion.div key="ripple"
                      initial={{ scale:0, opacity:0.55 }}
                      animate={{ scale:3,   opacity:0   }}
                      exit={{}}
                      transition={{ duration:0.55, ease:[0, 0, 0.18, 1] }}
                      style={{ position:'absolute', inset:0, borderRadius:16,
                        border:`1.5px solid ${game.color}`, pointerEvents:'none' }}
                    />
                  )}
                </AnimatePresence>
                {/* Shimmer on selection */}
                {sel && (
                  <Box sx={{ position:'absolute', inset:0, overflow:'hidden', borderRadius:16, pointerEvents:'none' }}>
                    <Box sx={{ position:'absolute', top:0, bottom:0, width:'36%',
                      background:`linear-gradient(90deg, transparent 0%, ${game.color}18 50%, transparent 100%)`,
                      animation:'shimmerSweep 2.8s ease-in-out infinite', animationDelay:'0.15s' }}/>
                  </Box>
                )}
                <motion.div animate={{ rotate:sel?[0,-8,8,0]:0 }} transition={{ duration:0.42, type:'spring' }}>
                  <Box sx={{ width:52, height:52, borderRadius:3.5, bgcolor:`${game.color}16`,
                    border:`1px solid ${game.color}30`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                    boxShadow:sel?`0 4px 22px ${game.color}38`:'none', transition:'box-shadow 0.3s' }}>
                    <game.Icon sx={{ fontSize:'1.85rem', color:game.color }}/>
                  </Box>
                </motion.div>
                <Box sx={{ flex:1 }}>
                  <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:0.3 }}>
                    <Typography sx={{ fontWeight:700, fontFamily:'"Outfit", sans-serif', fontSize:'0.97rem' }}>{game.label}</Typography>
                    <Box sx={{ px:1, py:0.1, borderRadius:1.5, bgcolor:`${game.color}24`, color:game.color,
                      fontSize:'0.58rem', fontWeight:700, letterSpacing:0.6, fontFamily:'"Outfit", sans-serif' }}>
                      {game.tag}
                    </Box>
                  </Box>
                  <Typography sx={{ fontSize:'0.76rem', color:'rgba(255,255,255,0.4)', fontFamily:'"Outfit", sans-serif' }}>{game.desc}</Typography>
                </Box>
                <motion.div
                  animate={{ scale:sel?1:0.82, backgroundColor:sel?game.color:'transparent', borderColor:sel?game.color:'rgba(255,255,255,0.15)' }}
                  transition={{ type:'spring', stiffness:420, damping:22 }}
                  style={{ width:22, height:22, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.15)',
                    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}
                >
                  {sel && <motion.div initial={{ scale:0, rotate:-90 }} animate={{ scale:1, rotate:0 }} transition={{ type:'spring', stiffness:700, damping:20 }}>
                    <CheckIcon sx={{ fontSize:11, color:'#fff' }}/>
                  </motion.div>}
                </motion.div>
              </motion.div>
            </motion.div>
          );
        })}
      </motion.div>
    </Box>
  );
}

// ─── Goal step ────────────────────────────────────────────────────────────────
function GoalStep({ value, onChange }) {
  const ac = STEP_ACCENT.goal;
  return (
    <motion.div variants={sectionStagger} initial="hidden" animate="show">
      <motion.div variants={sectionItem}>
        <StepHeader Icon={TrackChangesIcon} title="What's your morning goal?" subtitle="What gets you out of bed? It shows on your home screen."/>
      </motion.div>
      <motion.div variants={sectionItem}>
        <motion.div variants={listContainer} initial="hidden" animate="show"
          style={{ display:'flex', flexWrap:'wrap', gap:9, marginTop:20, marginBottom:20 }}>
          {GOAL_PRESETS.map(preset => {
            const sel = value === preset.label;
            return (
              <motion.div key={preset.label} variants={fadeUpItem}
                whileHover={{ scale:1.07, y:-2 }} whileTap={{ scale:0.91 }}
                onClick={() => onChange(sel?'':preset.label)}
                transition={{ type:'spring', stiffness:440, damping:22 }} style={{ cursor:'pointer' }}
              >
                <motion.div
                  animate={{ borderColor:sel?`${ac}68`:'rgba(255,255,255,0.09)', backgroundColor:sel?`${ac}16`:'rgba(12,12,28,0.48)',
                    boxShadow:sel?`0 4px 20px ${ac}30`:'none' }}
                  transition={{ type:'spring', stiffness:360, damping:24 }}
                  style={{ padding:'8px 16px', borderRadius:100, border:'1px solid rgba(255,255,255,0.09)',
                    display:'flex', alignItems:'center', gap:7 }}
                >
                  <preset.Icon sx={{ fontSize:'1rem', color:sel?ac:'rgba(255,255,255,0.38)' }}/>
                  <Typography sx={{ fontSize:'0.85rem', fontWeight:sel?700:500, fontFamily:'"Outfit", sans-serif',
                    color:sel?ac:'rgba(255,255,255,0.72)' }}>{preset.label}</Typography>
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
      <motion.div variants={sectionItem}>
        <TextField fullWidth placeholder="Or describe your own goal..." value={value}
          onChange={e=>onChange(e.target.value)} size="small" inputProps={{ maxLength:60 }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius:3, fontFamily:'"Outfit", sans-serif', background:'rgba(12,12,28,0.58)',
              '& fieldset':{ borderColor:'rgba(255,255,255,0.08)' },
              '&:hover fieldset':{ borderColor:'rgba(255,255,255,0.18)' },
              '&.Mui-focused fieldset':{ borderColor:`${ac}80` },
            },
          }}
        />
        <Typography sx={{ mt:0.75, display:'block', textAlign:'right', fontSize:'0.72rem', color:'rgba(255,255,255,0.25)', fontFamily:'"Outfit", sans-serif' }}>
          {value.length}/60
        </Typography>
      </motion.div>
    </motion.div>
  );
}

// ─── Avatar step ─────────────────────────────────────────────────────────────
function AvatarStep({ value, onChange }) {
  return (
    <motion.div variants={sectionStagger} initial="hidden" animate="show">
      <motion.div variants={sectionItem}>
        <StepHeader Icon={FaceIcon} title="Pick your profile icon" subtitle="This shows up on your home screen." />
      </motion.div>
      <motion.div variants={sectionItem}>
        <motion.div variants={listContainer} initial="hidden" animate="show"
          style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, marginTop:20 }}>
          {AVATAR_OPTIONS.map(opt => {
            const sel = value === opt.value;
            return (
              <motion.div key={opt.value} variants={fadeUpItem} whileTap={{ scale:0.84 }}
                onClick={() => onChange(opt.value)}
                style={{ cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}
              >
                <motion.div
                  animate={{
                    boxShadow: sel ? `0 0 0 2.5px ${opt.color}, 0 6px 24px ${opt.color}60` : '0 0 0 1px rgba(255,255,255,0.07)',
                    backgroundColor: sel ? `${opt.color}24` : 'rgba(12,12,28,0.55)',
                    scale: sel ? 1.14 : 1,
                  }}
                  transition={{ type:'spring', stiffness:440, damping:24 }}
                  style={{ width:60, height:60, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                    willChange:'transform', position:'relative', overflow:'hidden' }}
                >
                  {/* Selection flash */}
                  <AnimatePresence>
                    {sel && (
                      <motion.div key="flash"
                        initial={{ scale:0, opacity:0.7 }} animate={{ scale:2.2, opacity:0 }} exit={{}}
                        transition={{ duration:0.45, ease:[0,0,0.2,1] }}
                        style={{ position:'absolute', inset:0, borderRadius:'50%',
                          background:`radial-gradient(circle, ${opt.color}AA 0%, transparent 70%)`, pointerEvents:'none' }}
                      />
                    )}
                  </AnimatePresence>
                  <opt.Icon sx={{ fontSize:'1.65rem', color:sel?opt.color:'rgba(255,255,255,0.3)', transition:'color 0.15s', position:'relative', zIndex:1 }} />
                </motion.div>
                <Typography sx={{ fontSize:'0.6rem', fontWeight:sel?700:500, fontFamily:'"Outfit", sans-serif',
                  color:sel?opt.color:'rgba(255,255,255,0.3)', letterSpacing:0.3, textAlign:'center', transition:'color 0.15s' }}>
                  {opt.label}
                </Typography>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// ─── Summary step ─────────────────────────────────────────────────────────────
function SummaryStep({ data, speech, animKey }) {
  const morningType = MORNING_TYPES.find(t => t.value === data.morningRating);
  const game        = GAMES.find(g => g.value === data.favoriteGame);
  const avatar      = AVATAR_OPTIONS.find(a => a.value === data.profileIcon);
  const [h,m]       = data.wakeTime.split(':').map(Number);
  const fmtTime     = `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`;
  const items = [
    { Icon:avatar?.Icon,     label:'Profile icon', value:avatar?.label,       iconColor:avatar?.color },
    { Icon:PersonIcon,       label:'Name',         value:data.name },
    { Icon:AlarmIcon,        label:'Wake time',    value:fmtTime },
    { Icon:morningType?.Icon,label:'Morning type', value:morningType?.label },
    { Icon:game?.Icon,       label:'Wake-up game', value:game?.label },
    { Icon:TrackChangesIcon, label:'Morning goal', value:data.wakeGoal||'—' },
  ];

  return (
    <Box sx={{ textAlign:'center' }}>
      <motion.div
        initial={{ opacity:0, scale:0.28, y:45, rotate:-18 }}
        animate={{ opacity:1, scale:1,    y:0,  rotate:0   }}
        transition={{ type:'spring', stiffness:300, damping:18 }}
        style={{ display:'flex', justifyContent:'center', marginBottom:4, position:'relative' }}
      >
        <Box sx={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
          width:155, height:155, borderRadius:'50%',
          background:'radial-gradient(circle, rgba(255,209,102,0.4) 0%, transparent 68%)',
          filter:'blur(22px)', animation:'haloBreath 1.7s ease-in-out infinite' }}/>
        <motion.div animate={{ y:[0,-15,0], rotate:[-5,5,-5] }}
          transition={{ duration:0.82, repeat:Infinity, ease:'easeInOut' }}
          style={{ position:'relative', zIndex:1 }}>
          <Koala mood="celebrate" size={100} />
        </motion.div>
      </motion.div>

      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
        transition={{ type:'spring', stiffness:320, damping:24, delay:0.18 }}
        style={{ display:'flex', justifyContent:'center', marginBottom:14 }}>
        <SpeechBubble text={speech} animKey={animKey} />
      </motion.div>

      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
        transition={{ type:'spring', stiffness:300, damping:24, delay:0.32 }}>
        <Typography sx={{ mb:0.5, fontWeight:900, fontSize:'1.5rem', fontFamily:'"Fraunces", serif',
          background:'linear-gradient(135deg, #fff 0%, #FFD166 100%)',
          WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
          You're all set, {data.name}!
        </Typography>
        <Typography sx={{ mb:2.5, fontSize:'0.84rem', color:'rgba(255,255,255,0.4)', fontFamily:'"Outfit", sans-serif' }}>
          Here's your morning profile
        </Typography>
      </motion.div>

      <motion.div variants={listContainer} initial="hidden" animate="show"
        style={{ textAlign:'left', display:'flex', flexDirection:'column', gap:9 }}>
        {items.map(item => (
          <motion.div key={item.label} variants={fadeUpItem}
            whileHover={{ x:4 }} transition={{ type:'spring', stiffness:420, damping:22 }}>
            <Box sx={{ display:'flex', alignItems:'center', gap:2, p:1.75, borderRadius:3,
              background:'rgba(12,12,28,0.58)', border:'1px solid rgba(255,255,255,0.06)',
              backdropFilter:'blur(6px)', boxShadow:'0 3px 18px rgba(0,0,0,0.3)',
              position:'relative', overflow:'hidden' }}>
              <Box sx={{ position:'absolute', top:0, left:0, right:0, height:1,
                background:'linear-gradient(90deg, transparent 0%, rgba(255,209,102,0.22) 50%, transparent 100%)' }}/>
              <Box sx={{ width:30, height:30, borderRadius:2, flexShrink:0,
                bgcolor:item.iconColor?`${item.iconColor}22`:'rgba(255,255,255,0.05)',
                display:'flex', alignItems:'center', justifyContent:'center' }}>
                {item.Icon && <item.Icon sx={{ fontSize:'0.95rem', color:item.iconColor??'rgba(255,255,255,0.4)' }}/>}
              </Box>
              <Box sx={{ flex:1, display:'flex', justifyContent:'space-between', alignItems:'center', gap:2 }}>
                <Typography sx={{ fontSize:'0.73rem', color:'rgba(255,255,255,0.38)', fontFamily:'"Outfit", sans-serif' }}>{item.label}</Typography>
                <Typography sx={{ fontSize:'0.87rem', fontWeight:700, fontFamily:'"Outfit", sans-serif', color:'rgba(255,255,255,0.9)' }}>{item.value}</Typography>
              </Box>
            </Box>
          </motion.div>
        ))}
      </motion.div>
    </Box>
  );
}

// ─── Shared StepHeader ────────────────────────────────────────────────────────
function StepHeader({ Icon, title, subtitle }) {
  return (
    <Box>
      <motion.div
        initial={{ opacity:0, scale:0.55, rotate:-12 }}
        animate={{ opacity:1, scale:1,    rotate:0   }}
        transition={{ type:'spring', stiffness:500, damping:22, delay:0.02 }}
        whileHover={{ rotate:[0,-9,9,0], scale:1.12 }}
        style={{ display:'inline-flex', alignItems:'center', justifyContent:'center',
          width:48, height:48, borderRadius:13, marginBottom:14,
          background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.09)' }}
      >
        {Icon && <Icon sx={{ fontSize:'1.62rem', color:'rgba(255,255,255,0.78)' }}/>}
      </motion.div>
      <motion.div
        initial={{ opacity:0, x:-16 }}
        animate={{ opacity:1, x:0   }}
        transition={{ type:'spring', stiffness:380, damping:26, delay:0.07 }}
      >
        <Typography sx={{ mb:0.6, lineHeight:1.24, fontSize:'1.22rem', fontWeight:700,
          fontFamily:'"Fraunces", serif', color:'rgba(255,255,255,0.95)' }}>
          {title}
        </Typography>
      </motion.div>
      <motion.div
        initial={{ opacity:0, x:-12 }}
        animate={{ opacity:1, x:0   }}
        transition={{ type:'spring', stiffness:340, damping:26, delay:0.14 }}
      >
        <Typography sx={{ lineHeight:1.65, fontSize:'0.86rem', color:'rgba(255,255,255,0.42)', fontFamily:'"Outfit", sans-serif' }}>
          {subtitle}
        </Typography>
      </motion.div>
    </Box>
  );
}
