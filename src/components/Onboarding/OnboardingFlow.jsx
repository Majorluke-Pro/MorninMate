import { useState, useEffect, useRef } from 'react';
import {
  motion, AnimatePresence,
  useAnimate, useMotionValue, useSpring, useTransform,
} from 'framer-motion';
import { Box, Typography, Button, TextField, IconButton, CircularProgress, Alert } from '@mui/material';
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
import FitnessCenterIcon   from '@mui/icons-material/FitnessCenter';
import MenuBookIcon        from '@mui/icons-material/MenuBook';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import LocalCafeIcon       from '@mui/icons-material/LocalCafe';
import DirectionsRunIcon   from '@mui/icons-material/DirectionsRun';
import HistoryEduIcon      from '@mui/icons-material/HistoryEdu';
import TrackChangesIcon    from '@mui/icons-material/TrackChanges';
import { useApp } from '../../context/AppContext';

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
  wakeTime:    { mood:'sleepy',    speech:"When d'ya wanna drag yourself outta the swag?" },
  morningType: { mood:'thinking',  speech:"No worries, be honest! Which one are ya, mate?" },
  game:        { mood:'excited',   speech:"Bonzer! Pick your wake-up weapon, legend!" },
  goal:        { mood:'cool',      speech:"What gets ya outta bed each arvo... I mean morning?" },
  summary:     { mood:'celebrate', speech:"You're a fair dinkum legend! Let's go! 🎉" },
};
const STEP_IDS = ['welcome','name','wakeTime','morningType','game','goal','summary'];

const STEP_ACCENT = {
  welcome:'#5A8A50', name:'#FF6B35', wakeTime:'#6B8FD4',
  morningType:'#C97BE8', game:'#06D6A0', goal:'#FFD166', summary:'#FF9F35',
};

// ─── Framer Motion variants ───────────────────────────────────────────────────

const pageVariants = {
  enter: (dir) => ({
    x: dir >= 0 ? 56 : -56,
    opacity: 0,
    filter: 'blur(8px)',
    scale: 0.97,
  }),
  center: {
    x: 0, opacity: 1, filter: 'blur(0px)', scale: 1,
    transition: { type:'spring', stiffness:300, damping:30, mass:0.8 },
  },
  exit: (dir) => ({
    x: dir >= 0 ? -56 : 56,
    opacity: 0,
    filter: 'blur(8px)',
    scale: 0.97,
    transition: { type:'spring', stiffness:300, damping:30, mass:0.8 },
  }),
};

const listContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const listItem = {
  hidden: { opacity:0, x:-22, filter:'blur(4px)' },
  show:   { opacity:1, x:0, filter:'blur(0px)', transition:{ type:'spring', stiffness:320, damping:26 } },
};
const fadeUpItem = {
  hidden: { opacity:0, y:18, filter:'blur(4px)' },
  show:   { opacity:1, y:0, filter:'blur(0px)', transition:{ type:'spring', stiffness:300, damping:26 } },
};

// ─── Walking Koala SVG (CSS walk cycle + Framer hop) ─────────────────────────

const WALK_CSS = `
  .kw-all { animation:kwBob 0.5s ease-in-out infinite; transform-box:fill-box; transform-origin:50% 65%; }
  .kw-ll  { transform-box:fill-box; transform-origin:50% 0%; animation:kwLL 0.5s ease-in-out infinite; }
  .kw-rl  { transform-box:fill-box; transform-origin:50% 0%; animation:kwLL 0.5s ease-in-out infinite reverse; }
  .kw-la  { transform-box:fill-box; transform-origin:50% 0%; animation:kwLA 0.5s ease-in-out infinite; }
  .kw-ra  { transform-box:fill-box; transform-origin:50% 0%; animation:kwLA 0.5s ease-in-out infinite reverse; }
  @keyframes kwBob {
    0%,100% { transform:translateY(0)  rotate(0deg); }
    25%     { transform:translateY(-3px) rotate(-2.5deg); }
    75%     { transform:translateY(-3px) rotate(2.5deg); }
  }
  @keyframes kwLL { 0%,100%{transform:rotate(-28deg)} 50%{transform:rotate(28deg)} }
  @keyframes kwLA { 0%,100%{transform:rotate(20deg)}  50%{transform:rotate(-20deg)} }
`;

function WalkingKoala({ size = 68 }) {
  return (
    <svg viewBox="0 0 100 138" width={size} height={size * 1.38}
      style={{ display:'block', overflow:'visible' }}>
      <style>{WALK_CSS}</style>
      <g className="kw-all">
        {/* Ears */}
        <ellipse cx="21" cy="25" rx="20" ry="21" fill="#7878A8"/>
        <ellipse cx="21" cy="27" rx="12" ry="13" fill="#E8BEDD"/>
        <ellipse cx="79" cy="25" rx="20" ry="21" fill="#7878A8"/>
        <ellipse cx="79" cy="27" rx="12" ry="13" fill="#E8BEDD"/>
        {/* Left leg */}
        <g className="kw-ll">
          <ellipse cx="37" cy="110" rx="10.5" ry="18" fill="#7878A8"/>
          <ellipse cx="33" cy="126" rx="15" ry="7" fill="#6868A0"/>
          <ellipse cx="25" cy="131" rx="2.5" ry="1.5" fill="#5858A0" transform="rotate(-20,25,131)"/>
          <ellipse cx="31" cy="132" rx="2.5" ry="1.5" fill="#5858A0"/>
          <ellipse cx="37" cy="132" rx="2.5" ry="1.5" fill="#5858A0"/>
          <ellipse cx="43" cy="131" rx="2.5" ry="1.5" fill="#5858A0" transform="rotate(20,43,131)"/>
        </g>
        {/* Right leg */}
        <g className="kw-rl">
          <ellipse cx="63" cy="110" rx="10.5" ry="18" fill="#7878A8"/>
          <ellipse cx="67" cy="126" rx="15" ry="7" fill="#6868A0"/>
          <ellipse cx="57" cy="131" rx="2.5" ry="1.5" fill="#5858A0" transform="rotate(-20,57,131)"/>
          <ellipse cx="63" cy="132" rx="2.5" ry="1.5" fill="#5858A0"/>
          <ellipse cx="69" cy="132" rx="2.5" ry="1.5" fill="#5858A0"/>
          <ellipse cx="75" cy="131" rx="2.5" ry="1.5" fill="#5858A0" transform="rotate(20,75,131)"/>
        </g>
        {/* Body + belly */}
        <ellipse cx="50" cy="94" rx="27" ry="25" fill="#8080AA"/>
        <ellipse cx="50" cy="96" rx="18" ry="16" fill="#CACAD8"/>
        <ellipse cx="46" cy="85" rx="6" ry="4" fill="rgba(255,255,255,0.06)" transform="rotate(-20,46,85)"/>
        {/* Left arm */}
        <g className="kw-la">
          <ellipse cx="20" cy="90" rx="9" ry="18" fill="#8888A8" transform="rotate(12,20,74)"/>
          <circle cx="14" cy="106" r="10" fill="#7878A8"/>
          <circle cx="10" cy="110" r="2.5" fill="#6060A0" opacity="0.7"/>
          <circle cx="15" cy="112" r="2.5" fill="#6060A0" opacity="0.7"/>
          <circle cx="20" cy="111" r="2.5" fill="#6060A0" opacity="0.7"/>
        </g>
        {/* Right arm */}
        <g className="kw-ra">
          <ellipse cx="80" cy="90" rx="9" ry="18" fill="#8888A8" transform="rotate(-12,80,74)"/>
          <circle cx="86" cy="106" r="10" fill="#7878A8"/>
          <circle cx="82" cy="110" r="2.5" fill="#6060A0" opacity="0.7"/>
          <circle cx="87" cy="112" r="2.5" fill="#6060A0" opacity="0.7"/>
          <circle cx="92" cy="111" r="2.5" fill="#6060A0" opacity="0.7"/>
        </g>
        {/* Head */}
        <ellipse cx="50" cy="48" rx="33" ry="31" fill="#9090B0"/>
        <ellipse cx="42" cy="34" rx="12" ry="8" fill="rgba(255,255,255,0.06)" transform="rotate(-20,42,34)"/>
        {/* Nose */}
        <ellipse cx="50" cy="57" rx="15" ry="11" fill="#24243C"/>
        <ellipse cx="50" cy="55" rx="9" ry="5.5" fill="#36365A"/>
        <ellipse cx="45" cy="53" rx="3.5" ry="2.5" fill="rgba(255,255,255,0.16)"/>
        {/* Eyes */}
        <circle cx="36" cy="42" r="7.5" fill="#fff"/>
        <circle cx="64" cy="42" r="7.5" fill="#fff"/>
        <circle cx="37" cy="43" r="4.5" fill="#1A1A30"/>
        <circle cx="65" cy="43" r="4.5" fill="#1A1A30"/>
        <circle cx="39" cy="41" r="1.8" fill="#fff"/>
        <circle cx="67" cy="41" r="1.8" fill="#fff"/>
        {/* Mouth */}
        <path d="M 42 65 Q 50 72 58 65" stroke="rgba(255,255,255,0.7)" strokeWidth="2" fill="none" strokeLinecap="round"/>
      </g>
    </svg>
  );
}

// ─── Koala progress track ─────────────────────────────────────────────────────

const TRACK_ICONS = ['🌅','👤','⏰','🌙','🎮','🎯','🏆'];
const KW = 58; // koala container width px

function KoalaProgressTrack({ step, totalSteps, stepId }) {
  const [koalaScope, animateKoala] = useAnimate();
  const prevStep = useRef(step);
  const color    = STEP_ACCENT[stepId] ?? '#FF6B35';

  // Spring-based koala position (0 → 1)
  const rawPct   = useMotionValue(step / (totalSteps - 1));
  const springPct = useSpring(rawPct, { stiffness:160, damping:22, mass:0.6 });
  const koalaLeft = useTransform(springPct, p => `calc(${p * 100}% - ${p * KW}px)`);

  useEffect(() => {
    rawPct.set(step / (totalSteps - 1));

    if (prevStep.current === step) return;
    prevStep.current = step;

    // Squash-and-stretch hop
    if (!koalaScope.current) return;
    animateKoala(koalaScope.current, {
      scaleX: [1,   1.28, 0.80, 0.84, 1.20, 0.96, 1],
      scaleY: [1,   0.66, 1.30, 1.22, 0.76, 1.06, 1],
      y:      [0,   0,   -30,  -22,   0,    0,    0],
    }, {
      duration: 0.56,
      times:    [0,  0.14, 0.40, 0.60, 0.78, 0.90, 1],
      ease:     'easeInOut',
    });
  }, [step]);

  const pct = step / (totalSteps - 1);

  return (
    <Box sx={{ position:'relative', mx:2.5, mb:1 }}>
      {/* Track rail */}
      <Box sx={{ position:'relative', height:4, mx:`${KW/2}px`, borderRadius:2, overflow:'visible' }}>
        {/* Background */}
        <Box sx={{ position:'absolute', inset:0, bgcolor:'rgba(255,255,255,0.07)', borderRadius:2 }}/>
        {/* Animated fill */}
        <motion.div
          style={{
            position:'absolute', top:0, left:0, bottom:0, borderRadius:8,
            background:`linear-gradient(90deg, rgba(255,255,255,0.08), ${color})`,
            boxShadow:`0 0 12px ${color}88`,
            transformOrigin:'left',
          }}
          animate={{ width:`${pct * 100}%` }}
          transition={{ type:'spring', stiffness:180, damping:22 }}
        />

        {/* Step nodes */}
        {Array.from({ length:totalSteps }).map((_,i) => {
          const nodePct = i / (totalSteps - 1);
          const passed  = i < step;
          const active  = i === step;
          return (
            <motion.div
              key={i}
              style={{
                position:'absolute',
                left:`${nodePct * 100}%`,
                top:'50%',
                translateY:'-50%',
                translateX:'-50%',
                borderRadius:'50%',
                display:'flex', alignItems:'center', justifyContent:'center',
                overflow:'hidden',
              }}
              animate={{
                width:  active ? 22 : 12,
                height: active ? 22 : 12,
                backgroundColor: active ? color : passed ? `${color}99` : 'rgba(255,255,255,0.12)',
                boxShadow: active ? `0 0 18px ${color}CC, 0 0 40px ${color}55` : 'none',
              }}
              transition={{ type:'spring', stiffness:400, damping:28 }}
            >
              {passed && (
                <motion.div
                  initial={{ scale:0 }}
                  animate={{ scale:1 }}
                  transition={{ type:'spring', stiffness:500, damping:22 }}
                >
                  <CheckIcon sx={{ fontSize:8, color:'#fff' }}/>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </Box>

      {/* Koala */}
      <motion.div
        style={{
          position:'absolute',
          bottom: 6,
          left: koalaLeft,
          width: KW,
          zIndex: 3,
        }}
      >
        {/* Shadow */}
        <motion.div
          style={{
            position:'absolute', bottom:-2, left:'50%', translateX:'-50%',
            width:KW * 0.55, height:5, borderRadius:'50%',
            background:'rgba(0,0,0,0.35)', filter:'blur(3px)',
          }}
          animate={{ scaleX:[1, 0.65, 1], opacity:[0.35, 0.15, 0.35] }}
          transition={{ duration:0.5, repeat:Infinity, ease:'easeInOut' }}
        />
        <motion.div ref={koalaScope} style={{ transformOrigin:'50% 90%' }}>
          <WalkingKoala size={KW} />
        </motion.div>
      </motion.div>

      {/* Step emoji labels */}
      <Box sx={{ display:'flex', justifyContent:'space-between', px:`${KW/2 - 8}px`, mt:0.5 }}>
        {Array.from({ length:totalSteps }).map((_,i) => (
          <motion.span key={i} animate={{ opacity: i <= step ? 0.85 : 0.2 }}
            transition={{ duration:0.3 }}
            style={{ fontSize:9, lineHeight:1 }}>
            {TRACK_ICONS[i]}
          </motion.span>
        ))}
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
      }, 22);
      return () => clearInterval(iv);
    }, 220);
    return () => clearTimeout(t0);
  }, [animKey]);

  return (
    <motion.div
      key={animKey}
      initial={{ opacity:0, scale:0.72, y:8 }}
      animate={{ opacity:1, scale:1, y:0 }}
      transition={{ type:'spring', stiffness:440, damping:24 }}
      style={{
        position:'relative',
        background:'rgba(255,255,255,0.09)',
        border:'1px solid rgba(255,255,255,0.16)',
        borderRadius:'16px 16px 16px 4px',
        padding:'12px 20px',
        maxWidth:260,
        backdropFilter:'blur(14px)',
      }}
    >
      <Typography variant="body2" fontWeight={600}
        sx={{ color:'rgba(255,255,255,0.92)', lineHeight:1.55, minHeight:'2.4em' }}>
        {shown}
        {!done && (
          <motion.span
            animate={{ opacity:[1,0] }}
            transition={{ duration:0.5, repeat:Infinity, repeatType:'reverse' }}
            style={{ display:'inline-block', width:2, height:'0.9em', background:'rgba(255,255,255,0.7)', marginLeft:2, verticalAlign:'text-bottom' }}
          />
        )}
      </Typography>
      {/* Tail */}
      <Box sx={{ position:'absolute', bottom:-7, left:16, width:0, height:0,
        borderLeft:'7px solid transparent', borderRight:'7px solid transparent',
        borderTop:'7px solid rgba(255,255,255,0.09)' }}
      />
    </motion.div>
  );
}

// ─── Mood-based header koala ──────────────────────────────────────────────────

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
      <ellipse cx="60" cy="63" rx="40" ry="38" fill="#9090AA"/>
      <ellipse cx="60" cy="72" rx="16" ry="12" fill="#262638"/>
      <ellipse cx="60" cy="70" rx="9" ry="5" fill="#3A3A58"/>
      <ellipse cx="57" cy="68" rx="4" ry="2.5" fill="rgba(255,255,255,0.12)"/>
      {eyes[mood] || eyes.happy}
      {mouths[mood] || mouths.happy}
      <ellipse cx="20" cy="108" rx="9" ry="18" fill="#9090AA" transform="rotate(20,20,108)"/>
      {rightArm}
      {extras}
    </svg>
  );
}

// Idle animations per mood
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

function KoalaHeader({ mood, speech, animKey }) {
  return (
    <Box sx={{ display:'flex', alignItems:'flex-start', gap:2, mb:3 }}>
      <motion.div
        key={animKey}
        initial={{ opacity:0, scale:0.4, y:32, rotate:-12 }}
        animate={{ opacity:1, scale:1,   y:0,  rotate:0 }}
        transition={{ type:'spring', stiffness:380, damping:22 }}
        style={{ flexShrink:0 }}
      >
        <motion.div
          animate={MOOD_IDLE_ANIMATE[mood]}
          transition={MOOD_IDLE_TRANS[mood]}
        >
          <Koala mood={mood} size={92} />
        </motion.div>
      </motion.div>
      <Box sx={{ pt:1 }}>
        <SpeechBubble text={speech} animKey={animKey} />
      </Box>
    </Box>
  );
}

// ─── Confetti ─────────────────────────────────────────────────────────────────

const CONFETTI = [
  {l:'8%', c:'#FFD166',s:8,  r:2, delay:0   },
  {l:'18%',c:'#06D6A0',s:7,  r:7, delay:0.3 },
  {l:'30%',c:'#FF6B35',s:11, r:2, delay:0.6 },
  {l:'44%',c:'#FFD166',s:7,  r:7, delay:0.1 },
  {l:'57%',c:'#EF476F',s:9,  r:3, delay:0.45},
  {l:'68%',c:'#06D6A0',s:6,  r:6, delay:0.2 },
  {l:'80%',c:'#FF6B35',s:8,  r:2, delay:0.7 },
  {l:'13%',c:'#EF476F',s:5,  r:9, delay:0.55},
  {l:'50%',c:'#FFD166',s:7,  r:3, delay:0.35},
  {l:'88%',c:'#06D6A0',s:6,  r:6, delay:0.15},
  {l:'25%',c:'#FF6B35',s:10, r:2, delay:0.8 },
  {l:'72%',c:'#FFD166',s:5,  r:8, delay:0.25},
];

function Confetti() {
  return (
    <Box sx={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', overflow:'hidden' }}>
      {CONFETTI.map((c,i) => (
        <motion.div
          key={i}
          initial={{ y:-20, opacity:0.9, rotate:0 }}
          animate={{ y:'105vh', opacity:0, rotate: 360 + i*45 }}
          transition={{
            duration: 1.8 + (i%3)*0.4,
            delay: c.delay,
            repeat: Infinity,
            ease: 'easeIn',
          }}
          style={{
            position:'absolute', left:c.l,
            width:c.s, height:c.r,
            borderRadius: c.s === c.r ? '50%' : 2,
            background: c.c,
          }}
        />
      ))}
    </Box>
  );
}

// ─── Floating eucalyptus leaves ───────────────────────────────────────────────

const LEAVES = [
  {l:'7%', d:9, s:22,r:20},{l:'21%',d:11,s:16,r:-35},{l:'38%',d:9, s:20,r:55},
  {l:'57%',d:13,s:14,r:-20},{l:'71%',d:10,s:18,r:40},{l:'84%',d:8, s:12,r:-60},
  {l:'91%',d:12,s:16,r:15},{l:'14%',d:14,s:13,r:-45},{l:'49%',d:9, s:19,r:30},
  {l:'67%',d:11,s:15,r:-10},
];
function FloatingLeaves() {
  return (
    <Box sx={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', overflow:'hidden' }}>
      {LEAVES.map((l,i) => (
        <motion.div
          key={i}
          initial={{ y:-40, opacity:0, rotate:l.r }}
          animate={{ y:'110vh', opacity:[0, 0.25, 0.2, 0], rotate:l.r + 180 }}
          transition={{ duration:l.d, delay:(i*0.6)%4, repeat:Infinity, ease:'linear' }}
          style={{
            position:'absolute', left:l.l,
            width:l.s, height:l.s * 0.55,
            borderRadius:'50% 50% 50% 50% / 30% 30% 70% 70%',
            background:'linear-gradient(135deg,#5A8A50,#3D6B34)',
          }}
        />
      ))}
    </Box>
  );
}

// ─── Dynamic background ───────────────────────────────────────────────────────

function Background({ stepId }) {
  const color = STEP_ACCENT[stepId] ?? '#5A8A50';
  return (
    <Box sx={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', overflow:'hidden' }}>
      <Box sx={{ position:'absolute', inset:0, background:'linear-gradient(165deg,#050C07 0%,#0A1510 50%,#070718 100%)' }}/>

      {/* Primary orb — shifts color per step */}
      <motion.div
        animate={{
          background:[
            `radial-gradient(circle, ${color}26 0%, transparent 68%)`,
            `radial-gradient(circle, ${color}32 0%, transparent 68%)`,
            `radial-gradient(circle, ${color}26 0%, transparent 68%)`,
          ],
          x:[-30, 30, -30], y:[20, -20, 20], scale:[1, 1.07, 1],
        }}
        transition={{ duration:16, repeat:Infinity, ease:'easeInOut' }}
        style={{
          position:'absolute', width:580, height:580, borderRadius:'50%',
          top:-210, right:-210, filter:'blur(80px)',
        }}
      />
      {/* Secondary warm orb */}
      <motion.div
        animate={{ x:[0,48,0], y:[0,-32,0], scale:[1,1.1,1] }}
        transition={{ duration:20, repeat:Infinity, ease:'easeInOut' }}
        style={{
          position:'absolute', width:420, height:420, borderRadius:'50%',
          background:'radial-gradient(circle,rgba(255,107,53,0.1) 0%,transparent 70%)',
          bottom:-90, left:-130, filter:'blur(72px)',
        }}
      />
      {/* Twinkling stars */}
      {[...Array(24)].map((_,i) => (
        <motion.div
          key={i}
          animate={{ opacity:[ 0.04 + (i%4)*0.1, 0.55, 0.04 + (i%4)*0.1 ] }}
          transition={{ duration: 2.5 + (i%5)*0.7, delay:(i*0.28)%3.5, repeat:Infinity, ease:'easeInOut' }}
          style={{
            position:'absolute',
            left:`${(i*37+i*i*3)%100}%`,
            top:`${(i*53+i*7)%80}%`,
            width: i%3===0 ? 2.5 : 1.8,
            height: i%3===0 ? 2.5 : 1.8,
            borderRadius:'50%',
            background:'rgba(255,255,255,0.8)',
          }}
        />
      ))}
    </Box>
  );
}

// ─── Eucalyptus branch (welcome) ──────────────────────────────────────────────

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
  const [data, setData] = useState({
    name:'', wakeTime:'07:00', morningRating:3, favoriteGame:'math', wakeGoal:'',
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

  function canProceed() {
    if (currentId === 'name') return data.name.trim().length >= 2;
    if (currentId === 'goal') return data.wakeGoal.trim().length > 0;
    return true;
  }

  function patch(u) { setData(d => ({ ...d, ...u })); }

  return (
    <Box sx={{ minHeight:'100vh', display:'flex', flexDirection:'column', position:'relative', overflow:'hidden' }}>
      <Background stepId={currentId} />
      <FloatingLeaves />
      {isSummary && <Confetti />}

      <Box sx={{ position:'relative', zIndex:1, flex:1, display:'flex', flexDirection:'column' }}>
        {/* Top bar */}
        <Box sx={{ px:3, pt:5, pb:1, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <AnimatePresence mode="popLayout">
            {step > 0 && (
              <motion.div
                key="back"
                initial={{ opacity:0, x:-16, scale:0.8 }}
                animate={{ opacity:1, x:0,   scale:1   }}
                exit={{    opacity:0, x:-16, scale:0.8 }}
                transition={{ type:'spring', stiffness:400, damping:28 }}
              >
                <motion.div whileTap={{ scale:0.88 }}>
                  <IconButton onClick={() => go(-1)} size="small"
                    sx={{ color:'rgba(255,255,255,0.55)', bgcolor:'rgba(255,255,255,0.07)', '&:hover':{ bgcolor:'rgba(255,255,255,0.12)' } }}>
                    <ArrowBackIcon fontSize="small"/>
                  </IconButton>
                </motion.div>
              </motion.div>
            )}
            {step === 0 && <Box key="spacer" sx={{ width:36 }}/>}
          </AnimatePresence>

          <motion.div
            animate={{ opacity:1 }}
            initial={{ opacity:0 }}
            transition={{ delay:0.4 }}
            style={{ display:'flex', alignItems:'center', gap:6 }}
          >
            <WbSunnyIcon sx={{ color:'primary.main', fontSize:15 }}/>
            <Typography variant="caption" fontWeight={800} color="primary.main" letterSpacing={1.5}>
              MORNINMATE
            </Typography>
          </motion.div>

          <Box sx={{ width:36 }}/>
        </Box>

        {/* Koala progress track */}
        <motion.div
          animate={{ opacity: isWelcome ? 0 : 1, y: isWelcome ? -14 : 0 }}
          transition={{ type:'spring', stiffness:260, damping:28 }}
          style={{ pointerEvents: isWelcome ? 'none' : 'auto' }}
        >
          <KoalaProgressTrack step={step} totalSteps={STEP_IDS.length} stepId={currentId} />
        </motion.div>

        {/* Page content with AnimatePresence */}
        <Box sx={{ flex:1, position:'relative', overflow:'hidden' }}>
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
              }}
            >
              {currentId === 'welcome'     && <WelcomeStep />}
              {currentId === 'name'        && <><KoalaHeader mood={cfg.mood} speech={cfg.speech} animKey={animKey}/><NameStep value={data.name} onChange={v=>patch({name:v})} onSubmit={() => canProceed() && handleNext()}/></>}
              {currentId === 'wakeTime'    && <><KoalaHeader mood={cfg.mood} speech={cfg.speech} animKey={animKey}/><WakeTimeStep value={data.wakeTime} onChange={v=>patch({wakeTime:v})}/></>}
              {currentId === 'morningType' && <><KoalaHeader mood={cfg.mood} speech={cfg.speech} animKey={animKey}/><MorningTypeStep value={data.morningRating} onChange={v=>patch({morningRating:v})}/></>}
              {currentId === 'game'        && <><KoalaHeader mood={cfg.mood} speech={cfg.speech} animKey={animKey}/><GameStep value={data.favoriteGame} onChange={v=>patch({favoriteGame:v})}/></>}
              {currentId === 'goal'        && <><KoalaHeader mood={cfg.mood} speech={cfg.speech} animKey={animKey}/><GoalStep value={data.wakeGoal} onChange={v=>patch({wakeGoal:v})}/></>}
              {currentId === 'summary'     && <SummaryStep data={data} speech={cfg.speech} animKey={animKey}/>}
            </motion.div>
          </AnimatePresence>
        </Box>

        {/* CTA */}
        <Box sx={{ px:3, pb:5, pt:1, position:'relative', zIndex:2 }}>
          {saveError && <Alert severity="error" sx={{ borderRadius:2, mb:2 }}>{saveError}</Alert>}
          <motion.div
            whileHover={canProceed() ? { scale:1.02 } : {}}
            whileTap={canProceed()   ? { scale:0.96 } : {}}
            transition={{ type:'spring', stiffness:500, damping:28 }}
          >
            <motion.div
              animate={canProceed() ? {
                boxShadow:[
                  `0 10px 36px ${accent}44`,
                  `0 14px 48px ${accent}70`,
                  `0 10px 36px ${accent}44`,
                ],
              } : { boxShadow:'none' }}
              transition={{ duration:2.2, repeat:Infinity, ease:'easeInOut' }}
              style={{ borderRadius:14 }}
            >
              <Button
                fullWidth variant="contained" size="large"
                onClick={handleNext}
                disabled={!canProceed() || saving}
                sx={{
                  py:1.75, fontWeight:800, borderRadius:'14px', fontSize:'1rem', letterSpacing:0.3,
                  background: canProceed()
                    ? `linear-gradient(135deg, ${accent} 0%, #FF8C5A 100%)`
                    : undefined,
                  boxShadow:'none',
                  transition:'background 0.4s ease',
                }}
              >
                {saving
                  ? <CircularProgress size={22} sx={{ color:'#fff' }}/>
                  : currentId==='welcome' ? "Let's go, mate! →"
                  : currentId==='summary' ? 'Create My Account 🚀'
                  : 'Continue →'}
              </Button>
            </motion.div>
          </motion.div>

          {currentId === 'welcome' && (
            <motion.div
              initial={{ opacity:0, y:8 }}
              animate={{ opacity:1, y:0 }}
              transition={{ delay:0.8, type:'spring', stiffness:260, damping:26 }}
            >
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt:2 }}>
                Already have an account?{' '}
                <Box component="span" onClick={() => setShowAuthDirectly(true)}
                  sx={{ color:'primary.main', fontWeight:700, cursor:'pointer', '&:hover':{ textDecoration:'underline' } }}>
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

function WelcomeStep() {
  return (
    <Box sx={{ textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center' }}>
      {/* Branch sways, koala hangs */}
      <motion.div
        animate={{ rotate:[-1.5, 1.5] }}
        transition={{ duration:4.5, repeat:Infinity, repeatType:'mirror', ease:'easeInOut' }}
        style={{ transformOrigin:'left center', position:'relative', marginBottom:4 }}
      >
        <EucalyptusBranch />
        <motion.div
          animate={{ rotate:[-4, 4] }}
          transition={{ duration:4.5, repeat:Infinity, repeatType:'mirror', ease:'easeInOut' }}
          style={{ position:'absolute', top:68, left:'50%', translateX:'-50%', transformOrigin:'top center' }}
        >
          <Koala mood="wave" size={128} />
        </motion.div>
      </motion.div>

      {/* Title */}
      <motion.div
        initial={{ opacity:0, y:26, filter:'blur(6px)' }}
        animate={{ opacity:1, y:0, filter:'blur(0px)' }}
        transition={{ type:'spring', stiffness:260, damping:24, delay:0.1 }}
      >
        <Typography variant="h2" fontWeight={900} letterSpacing="-1px" sx={{
          mt:14, mb:0.5,
          background:'linear-gradient(135deg,#ffffff 0%,#c8f5b8 50%,#90d080 100%)',
          WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
        }}>
          MorninMate
        </Typography>
      </motion.div>

      <motion.div
        initial={{ opacity:0, y:22, filter:'blur(5px)' }}
        animate={{ opacity:1, y:0, filter:'blur(0px)' }}
        transition={{ type:'spring', stiffness:260, damping:24, delay:0.22 }}
      >
        <Typography variant="h5" fontWeight={700} color="primary.main" sx={{ mb:2 }}>
          Wake up. Level up. No worries.
        </Typography>
      </motion.div>

      <motion.div
        initial={{ opacity:0, y:18 }}
        animate={{ opacity:1, y:0 }}
        transition={{ type:'spring', stiffness:240, damping:24, delay:0.36 }}
      >
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth:290, mx:'auto', lineHeight:1.7 }}>
          Earn XP, build streaks, and actually wake up — one game at a time.
        </Typography>
      </motion.div>

      <motion.div
        initial={{ opacity:0, y:14 }}
        animate={{ opacity:1, y:0 }}
        transition={{ type:'spring', stiffness:220, damping:24, delay:0.52 }}
        style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap', marginTop:24 }}
      >
        {[{Icon:SportsEsportsIcon,label:'Mini-games'},{Icon:EmojiObjectsIcon,label:'XP & Levels'},{Icon:FlashOnIcon,label:'Streaks'}].map(({Icon,label}) => (
          <motion.div key={label} whileHover={{ scale:1.06, y:-2 }} whileTap={{ scale:0.95 }}
            transition={{ type:'spring', stiffness:400, damping:20 }}>
            <Box sx={{ px:2, py:0.75, borderRadius:10, bgcolor:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', display:'flex', alignItems:'center', gap:0.75 }}>
              <Icon sx={{ fontSize:14, color:'text.secondary' }}/>
              <Typography variant="caption" fontWeight={600} color="text.secondary">{label}</Typography>
            </Box>
          </motion.div>
        ))}
      </motion.div>
    </Box>
  );
}

// ─── Name step ────────────────────────────────────────────────────────────────

function NameStep({ value, onChange, onSubmit }) {
  return (
    <Box>
      <StepHeader Icon={PersonIcon} title="First things first —" subtitle="What should we call you, mate?" />
      <Box sx={{ mt:5 }}>
        <TextField fullWidth autoFocus autoComplete="off"
          placeholder="Your name" value={value}
          onChange={e => onChange(e.target.value)}
          inputProps={{ maxLength:30 }}
          onKeyDown={e => e.key==='Enter' && onSubmit()}
          variant="standard"
          sx={{
            '& .MuiInput-input':{ fontSize:'2rem', fontWeight:700, textAlign:'center', py:1 },
            '& .MuiInput-underline:before':{ borderBottomColor:'rgba(255,255,255,0.1)' },
            '& .MuiInput-underline:after' :{ borderBottomColor:'#FF6B35' },
          }}
        />
        <AnimatePresence>
          {value.trim().length >= 2 && (
            <motion.div
              initial={{ opacity:0, y:8, scale:0.95 }}
              animate={{ opacity:1, y:0, scale:1   }}
              exit={{    opacity:0, y:4, scale:0.95 }}
              transition={{ type:'spring', stiffness:400, damping:24 }}
            >
              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt:2 }}>
                G'day, <Box component="span" sx={{ color:'primary.main', fontWeight:700 }}>{value.trim()}</Box>! Ripper name 🐨
              </Typography>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </Box>
  );
}

// ─── Wake time step ───────────────────────────────────────────────────────────

function WakeTimeStep({ value, onChange }) {
  const [h,m] = value.split(':').map(Number);
  const isPM   = h >= 12;
  const hour12 = h % 12 || 12;
  const setH  = (h12) => { const h24=isPM?(h12%12)+12:h12%12; onChange(`${String(h24).padStart(2,'0')}:${String(m).padStart(2,'0')}`); };
  const setM  = (nm)  => onChange(`${String(h).padStart(2,'0')}:${String(nm).padStart(2,'0')}`);
  const toggle= () => { const nh=isPM?h-12:h+12; onChange(`${String(nh).padStart(2,'0')}:${String(m).padStart(2,'0')}`); };
  const ctx   = h<4?{l:'Deep night 🌙',c:'#8B5CF6'}:h<6?{l:'Before dawn 💪',c:'#EF476F'}:h<8?{l:'Early riser 🌅',c:'#FF6B35'}:h<10?{l:'Morning sweet spot ☀️',c:'#FFD166'}:h<12?{l:'Late morning 🌤️',c:'#06D6A0'}:h<14?{l:'Midday 🌞',c:'#FFD166'}:h<17?{l:'Afternoon ⛅',c:'#FF8C5A'}:h<20?{l:'Evening 🌆',c:'#FF6B35'}:h<22?{l:'Night 🌙',c:'#8B5CF6'}:{l:'Late night 🦉',c:'#A0A0B8'};

  return (
    <Box>
      <StepHeader Icon={AlarmIcon} title="When do you want to wake up?" subtitle="Set your default alarm time."/>
      <Box sx={{ mt:5, display:'flex', alignItems:'center', justifyContent:'center', gap:2 }}>
        <TimeDrum display={String(hour12).padStart(2,'0')} onUp={() => setH(hour12===12?1:hour12+1)} onDown={() => setH(hour12===1?12:hour12-1)}/>
        <Typography variant="h3" fontWeight={900} color="primary.main" sx={{ mb:2, userSelect:'none' }}>:</Typography>
        <TimeDrum display={String(m).padStart(2,'0')} onUp={() => setM(m>=55?0:m+5)} onDown={() => setM(m<=0?55:m-5)}/>
        <Box sx={{ display:'flex', flexDirection:'column', gap:1, mb:2 }}>
          {['AM','PM'].map(p => { const active=(p==='PM')===isPM; return (
            <motion.div key={p} whileTap={{ scale:0.9 }} transition={{ type:'spring', stiffness:400, damping:20 }}>
              <Box onClick={() => !active && toggle()} sx={{ px:1.75, py:0.75, borderRadius:2, userSelect:'none', cursor:active?'default':'pointer', bgcolor:active?'primary.main':'rgba(255,255,255,0.07)', fontWeight:700, fontSize:'0.8rem', transition:'background 0.2s' }}>
                {p}
              </Box>
            </motion.div>
          );})}
        </Box>
      </Box>
      <motion.p
        animate={{ color:ctx.c }}
        transition={{ duration:0.4 }}
        style={{ textAlign:'center', fontWeight:600, fontSize:'0.875rem', margin:'4px 0 0' }}
      >
        {ctx.l}
      </motion.p>
    </Box>
  );
}

function TimeDrum({ display, onUp, onDown }) {
  return (
    <Box sx={{ display:'flex', flexDirection:'column', alignItems:'center', gap:0.5 }}>
      <motion.div whileTap={{ scale:0.85 }} transition={{ type:'spring', stiffness:500, damping:20 }}>
        <IconButton onClick={onUp} sx={{ color:'primary.main', bgcolor:'rgba(255,107,53,0.08)', '&:hover':{ bgcolor:'rgba(255,107,53,0.16)' } }}><KeyboardArrowUpIcon/></IconButton>
      </motion.div>
      <Box sx={{ width:76, height:76, borderRadius:3, bgcolor:'rgba(255,107,53,0.07)', border:'1px solid rgba(255,107,53,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <AnimatePresence mode="wait">
          <motion.span
            key={display}
            initial={{ y:-12, opacity:0 }}
            animate={{ y:0,   opacity:1 }}
            exit={{    y:12,  opacity:0 }}
            transition={{ type:'spring', stiffness:400, damping:28 }}
            style={{ fontSize:'2rem', fontWeight:800, fontVariantNumeric:'tabular-nums' }}
          >
            {display}
          </motion.span>
        </AnimatePresence>
      </Box>
      <motion.div whileTap={{ scale:0.85 }} transition={{ type:'spring', stiffness:500, damping:20 }}>
        <IconButton onClick={onDown} sx={{ color:'primary.main', bgcolor:'rgba(255,107,53,0.08)', '&:hover':{ bgcolor:'rgba(255,107,53,0.16)' } }}><KeyboardArrowDownIcon/></IconButton>
      </motion.div>
    </Box>
  );
}

// ─── Morning type step ────────────────────────────────────────────────────────

function MorningTypeStep({ value, onChange }) {
  return (
    <Box>
      <StepHeader Icon={EmojiPeopleIcon} title="What kind of morning person are you?" subtitle="Be honest — this shapes your experience."/>
      <motion.div variants={listContainer} initial="hidden" animate="show"
        style={{ display:'flex', flexDirection:'column', gap:12, marginTop:24 }}>
        {MORNING_TYPES.map(type => {
          const sel = value === type.value;
          return (
            <motion.div key={type.value} variants={listItem}
              whileHover={{ scale:1.015, x:3 }}
              whileTap={{ scale:0.975 }}
              onClick={() => onChange(type.value)}
              transition={{ type:'spring', stiffness:380, damping:24 }}
              style={{ cursor:'pointer' }}
            >
              <motion.div
                animate={{
                  borderColor: sel ? 'rgba(255,107,53,0.55)' : 'rgba(255,255,255,0.07)',
                  backgroundColor: sel ? 'rgba(255,107,53,0.09)' : 'rgba(255,255,255,0.03)',
                  scale: sel ? 1.015 : 1,
                }}
                transition={{ type:'spring', stiffness:360, damping:26 }}
                style={{ padding:16, borderRadius:12, border:'1.5px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:16 }}
              >
                <Box sx={{ width:36, height:36, borderRadius:2, bgcolor:sel?'rgba(255,107,53,0.15)':'rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <type.Icon sx={{ fontSize:'1.35rem', color:sel?'primary.main':'text.secondary' }}/>
                </Box>
                <Box sx={{ flex:1 }}>
                  <Typography fontWeight={700} variant="body1">{type.label}</Typography>
                  <Typography variant="caption" color="text.secondary">{type.desc}</Typography>
                </Box>
                <motion.div
                  animate={{ scale: sel ? 1 : 0.85, backgroundColor: sel ? '#FF6B35' : 'transparent', borderColor: sel ? '#FF6B35' : 'rgba(255,255,255,0.15)' }}
                  transition={{ type:'spring', stiffness:400, damping:22 }}
                  style={{ width:20, height:20, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}
                >
                  {sel && <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:'spring', stiffness:600, damping:20 }}>
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

// ─── Game step ────────────────────────────────────────────────────────────────

function GameStep({ value, onChange }) {
  return (
    <Box>
      <StepHeader Icon={SportsEsportsIcon} title="Pick your wake-up game" subtitle="This is how you'll prove you're actually awake."/>
      <motion.div variants={listContainer} initial="hidden" animate="show"
        style={{ display:'flex', flexDirection:'column', gap:16, marginTop:24 }}>
        {GAMES.map(game => {
          const sel = value === game.value;
          return (
            <motion.div key={game.value} variants={fadeUpItem}
              whileHover={{ scale:1.02, y:-2 }}
              whileTap={{ scale:0.975 }}
              onClick={() => onChange(game.value)}
              transition={{ type:'spring', stiffness:360, damping:24 }}
              style={{ cursor:'pointer' }}
            >
              <motion.div
                animate={{
                  borderColor: sel ? `${game.color}55` : 'rgba(255,255,255,0.07)',
                  backgroundColor: sel ? `${game.color}10` : 'rgba(255,255,255,0.03)',
                  boxShadow: sel ? `0 8px 28px ${game.color}22` : '0 0 0 transparent',
                }}
                transition={{ type:'spring', stiffness:300, damping:24 }}
                style={{ padding:'20px', borderRadius:12, border:'1.5px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:20 }}
              >
                <motion.div
                  animate={{ rotate: sel ? [0, -8, 8, 0] : 0 }}
                  transition={{ duration:0.4, type:'spring' }}
                >
                  <Box sx={{ width:54, height:54, borderRadius:3, bgcolor:`${game.color}18`, border:`1px solid ${game.color}30`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <game.Icon sx={{ fontSize:'1.9rem', color:game.color }}/>
                  </Box>
                </motion.div>
                <Box sx={{ flex:1 }}>
                  <Box sx={{ display:'flex', alignItems:'center', gap:1, mb:0.25 }}>
                    <Typography fontWeight={700}>{game.label}</Typography>
                    <Box sx={{ px:1, py:0.1, borderRadius:1, bgcolor:`${game.color}20`, color:game.color, fontSize:'0.6rem', fontWeight:700, letterSpacing:0.5 }}>{game.tag}</Box>
                  </Box>
                  <Typography variant="caption" color="text.secondary">{game.desc}</Typography>
                </Box>
                <motion.div
                  animate={{ scale:sel?1:0.85, backgroundColor:sel?game.color:'transparent', borderColor:sel?game.color:'rgba(255,255,255,0.15)' }}
                  transition={{ type:'spring', stiffness:400, damping:22 }}
                  style={{ width:22, height:22, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}
                >
                  {sel && <motion.div initial={{ scale:0, rotate:-90 }} animate={{ scale:1, rotate:0 }} transition={{ type:'spring', stiffness:600, damping:20 }}>
                    <CheckIcon sx={{ fontSize:12, color:'#fff' }}/>
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
  return (
    <Box>
      <StepHeader Icon={TrackChangesIcon} title="What's your morning goal?" subtitle="What gets you out of bed? It shows on your home screen."/>
      <motion.div
        variants={listContainer} initial="hidden" animate="show"
        style={{ display:'flex', flexWrap:'wrap', gap:10, marginTop:24, marginBottom:24 }}
      >
        {GOAL_PRESETS.map(preset => {
          const sel = value === preset.label;
          return (
            <motion.div key={preset.label} variants={fadeUpItem}
              whileHover={{ scale:1.05, y:-2 }}
              whileTap={{ scale:0.93 }}
              onClick={() => onChange(sel?'':preset.label)}
              transition={{ type:'spring', stiffness:420, damping:22 }}
              style={{ cursor:'pointer' }}
            >
              <motion.div
                animate={{
                  borderColor: sel ? 'rgba(255,107,53,0.55)' : 'rgba(255,255,255,0.1)',
                  backgroundColor: sel ? 'rgba(255,107,53,0.12)' : 'rgba(255,255,255,0.04)',
                }}
                transition={{ type:'spring', stiffness:360, damping:24 }}
                style={{ padding:'8px 16px', borderRadius:100, border:'1.5px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', gap:6 }}
              >
                <preset.Icon sx={{ fontSize:'1.05rem', color:sel?'primary.main':'text.secondary' }}/>
                <Typography variant="body2" fontWeight={sel?700:500} sx={{ color:sel?'primary.main':'text.primary' }}>
                  {preset.label}
                </Typography>
              </motion.div>
            </motion.div>
          );
        })}
      </motion.div>
      <TextField fullWidth placeholder="Or describe your own goal..." value={value} onChange={e=>onChange(e.target.value)} size="small" inputProps={{ maxLength:60 }} sx={{ '& .MuiOutlinedInput-root':{ borderRadius:2.5 } }}/>
      <Typography variant="caption" color="text.disabled" sx={{ mt:0.75, display:'block', textAlign:'right' }}>{value.length}/60</Typography>
    </Box>
  );
}

// ─── Summary step ─────────────────────────────────────────────────────────────

function SummaryStep({ data, speech, animKey }) {
  const morningType = MORNING_TYPES.find(t => t.value === data.morningRating);
  const game        = GAMES.find(g => g.value === data.favoriteGame);
  const [h,m]       = data.wakeTime.split(':').map(Number);
  const fmtTime     = `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`;
  const items = [
    { Icon:PersonIcon,       label:'Name',         value:data.name },
    { Icon:AlarmIcon,        label:'Wake time',    value:fmtTime },
    { Icon:morningType?.Icon,label:'Morning type', value:morningType?.label },
    { Icon:game?.Icon,       label:'Wake-up game', value:game?.label },
    { Icon:TrackChangesIcon, label:'Morning goal', value:data.wakeGoal||'—' },
  ];

  return (
    <Box sx={{ textAlign:'center' }}>
      {/* Big celebrating koala */}
      <motion.div
        initial={{ opacity:0, scale:0.3, y:40, rotate:-15 }}
        animate={{ opacity:1, scale:1,   y:0,  rotate:0  }}
        transition={{ type:'spring', stiffness:280, damping:18 }}
        style={{ display:'flex', justifyContent:'center', marginBottom:8 }}
      >
        <motion.div
          animate={{ y:[0,-18,0], rotate:[-7,7,-7] }}
          transition={{ duration:0.85, repeat:Infinity, ease:'easeInOut' }}
        >
          <Koala mood="celebrate" size={120} />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity:0, y:10 }}
        animate={{ opacity:1, y:0 }}
        transition={{ type:'spring', stiffness:300, damping:24, delay:0.15 }}
        style={{ display:'flex', justifyContent:'center', marginBottom:12 }}
      >
        <SpeechBubble text={speech} animKey={animKey} />
      </motion.div>

      <motion.div
        initial={{ opacity:0, y:14 }}
        animate={{ opacity:1, y:0 }}
        transition={{ type:'spring', stiffness:280, damping:24, delay:0.28 }}
      >
        <Typography variant="h5" fontWeight={800} sx={{ mb:0.5 }}>
          You're all set, {data.name}!
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb:3 }}>
          Here's your morning profile
        </Typography>
      </motion.div>

      <motion.div
        variants={listContainer} initial="hidden" animate="show"
        style={{ textAlign:'left', display:'flex', flexDirection:'column', gap:10 }}
      >
        {items.map(item => (
          <motion.div key={item.label} variants={fadeUpItem}
            whileHover={{ x:4 }} transition={{ type:'spring', stiffness:400, damping:22 }}>
            <Box sx={{ display:'flex', alignItems:'center', gap:2, p:1.75, borderRadius:2.5, bgcolor:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
              <Box sx={{ width:28, height:28, borderRadius:1.5, bgcolor:'rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                {item.Icon && <item.Icon sx={{ fontSize:'1rem', color:'text.secondary' }}/>}
              </Box>
              <Box sx={{ flex:1, display:'flex', justifyContent:'space-between', alignItems:'center', gap:2 }}>
                <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                <Typography variant="body2" fontWeight={600}>{item.value}</Typography>
              </Box>
            </Box>
          </motion.div>
        ))}
      </motion.div>
    </Box>
  );
}

// ─── Shared ───────────────────────────────────────────────────────────────────

function StepHeader({ Icon, title, subtitle }) {
  return (
    <motion.div
      initial={{ opacity:0, y:16 }}
      animate={{ opacity:1, y:0 }}
      transition={{ type:'spring', stiffness:300, damping:26, delay:0.05 }}
    >
      <Box>
        <motion.div
          whileHover={{ rotate:[0,-8,8,0], scale:1.08 }}
          transition={{ duration:0.4, type:'spring' }}
          style={{ display:'inline-flex', alignItems:'center', justifyContent:'center',
            width:52, height:52, borderRadius:12, marginBottom:20,
            background:'linear-gradient(135deg,rgba(255,107,53,0.18),rgba(255,107,53,0.08))',
            border:'1px solid rgba(255,107,53,0.25)' }}
        >
          {Icon && <Icon sx={{ fontSize:'1.75rem', color:'primary.main' }}/>}
        </motion.div>
        <Typography variant="h5" fontWeight={800} sx={{ mb:1, lineHeight:1.25 }}>{title}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight:1.65 }}>{subtitle}</Typography>
      </Box>
    </motion.div>
  );
}
