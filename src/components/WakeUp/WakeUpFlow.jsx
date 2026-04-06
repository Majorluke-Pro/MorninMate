import { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, Card, Button, LinearProgress, Fade } from '@mui/material';
import { startAlarm, stopAlarm } from '../../lib/sounds';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import CalculateIcon from '@mui/icons-material/Calculate';
import StyleIcon from '@mui/icons-material/Style';
import BoltIcon from '@mui/icons-material/Bolt';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AlarmIcon from '@mui/icons-material/Alarm';
import SpaIcon from '@mui/icons-material/Spa';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import CheckIcon from '@mui/icons-material/Check';
import { useApp } from '../../context/AppContext';
import MathGame from '../Games/MathGame';
import MemoryGame from '../Games/MemoryGame';
import ReactionGame from '../Games/ReactionGame';
import { supabase } from '../../lib/supabase';

const GAME_MAP    = { math: MathGame, memory: MemoryGame, reaction: ReactionGame };
const INACTIVITY_LIMIT = 30; // seconds before alarm restarts
const GAME_LABELS = { math: 'Math Blitz', memory: 'Memory Match', reaction: 'Reaction Rush' };
const GAME_ICONS  = { math: CalculateIcon, memory: StyleIcon, reaction: BoltIcon };
const GAME_COLORS = { math: '#FF6B35', memory: '#FFD166', reaction: '#06D6A0' };
const DIFFICULTY_MAP = { gentle: 'easy', moderate: 'normal', intense: 'hard' };
const XP_REWARD = { gentle: 20, moderate: 35, intense: 60 };

export default function WakeUpFlow() {
  const { session, activeAlarm, clearActiveAlarm, awardXP, addDemerit, refreshWakeStats } = useApp();

  const games      = activeAlarm?.pulse?.games || ['math'];
  const intensity  = activeAlarm?.pulse?.intensity || 'moderate';
  const difficulty = DIFFICULTY_MAP[intensity];
  const xpReward   = XP_REWARD[intensity];

  // Start alarm sound immediately; stop when the flow is dismissed
  useEffect(() => {
    startAlarm(activeAlarm?.sound ?? 'classic');
    return () => stopAlarm();
  }, []);

  const [gameIndex,  setGameIndex]  = useState(0);
  const [gameKey,    setGameKey]    = useState(0);   // remount to restart
  const [failCount,  setFailCount]  = useState(0);   // fails on current game
  const [totalFails, setTotalFails] = useState(0);   // across all games
  const [results,    setResults]    = useState([]);
  const [phase,      setPhase]      = useState('intro');
  const [ending,     setEnding]     = useState(false);
  const sessionIdRef = useRef(null);

  // Inactivity tracking
  const lastActivityRef      = useRef(Date.now());
  const [inactivityLeft, setInactivityLeft] = useState(INACTIVITY_LIMIT);

  const resetInactivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Inactivity countdown — only runs during 'playing' phase
  useEffect(() => {
    if (phase !== 'playing') return;
    lastActivityRef.current = Date.now(); // reset when game starts

    const interval = setInterval(() => {
      const elapsed    = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      const remaining  = Math.max(0, INACTIVITY_LIMIT - elapsed);
      setInactivityLeft(remaining);

      if (remaining === 0) {
        // User ignored the game — restart everything
        startAlarm();
        setGameIndex(0);
        setGameKey(k => k + 1);
        setFailCount(0);
        setTotalFails(0);
        setResults([]);
        setPhase('intro');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [phase]);

  const currentGame  = games[gameIndex];
  const GameComponent = GAME_MAP[currentGame];
  const progress = (gameIndex / games.length) * 100;

  function handleGameComplete() {
    const newResults = [...results, { game: currentGame, success: true, retries: failCount }];
    setResults(newResults);
    setFailCount(0);
    if (gameIndex + 1 >= games.length) {
      awardXP(xpReward);
      finalizeWakeSession('success', newResults);
      setPhase('complete');
    } else {
      setGameIndex(i => i + 1);
      setGameKey(k => k + 1);
    }
  }

  function handleGameFail() {
    const newTotal = totalFails + 1;
    setTotalFails(newTotal);
    setFailCount(f => f + 1);
    addDemerit();

    // Restart the current game — you cannot dismiss the alarm by failing
    setGameKey(k => k + 1);
  }

  async function startWakeSession() {
    const userId = session?.user?.id;
    if (!userId || sessionIdRef.current) return;
    const payload = {
      user_id: userId,
      alarm_id: activeAlarm?.id ?? null,
      started_at: new Date().toISOString(),
      status: 'in_progress',
      intensity,
      games,
      total_fails: 0,
    };
    const { data, error } = await supabase.from('wake_sessions').insert(payload).select('id').single();
    if (!error && data?.id) sessionIdRef.current = data.id;
  }

  async function finalizeWakeSession(status, finalResults = results) {
    const userId = session?.user?.id;
    if (!userId) return;
    const id = sessionIdRef.current;
    if (!id) return;

    setEnding(true);
    try {
      await supabase
        .from('wake_sessions')
        .update({
          status,
          completed_at: new Date().toISOString(),
          total_fails: totalFails,
          results: finalResults,
        })
        .eq('id', id)
        .eq('user_id', userId);
    } finally {
      setEnding(false);
      refreshWakeStats?.(userId);
    }
  }

  async function handleEndEarly() {
    if (ending) return;
    await finalizeWakeSession('failed');
    clearActiveAlarm();
  }

  if (phase === 'intro') {
    return (
      <IntroScreen
        alarm={activeAlarm}
        games={games}
        intensity={intensity}
        xpReward={xpReward}
        onStart={async () => {
          await startWakeSession();
          stopAlarm();
          setPhase('playing');
        }}
      />
    );
  }

  if (phase === 'complete') {
    return (
      <ResultScreen
        results={results}
        xpReward={xpReward}
        totalFails={totalFails}
        onDone={clearActiveAlarm}
      />
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', p: 3, pt: 5, display: 'flex', flexDirection: 'column' }}>
      {/* Progress header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, gap: 1.5, alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Game {gameIndex + 1} of {games.length}
          </Typography>
          <Button
            variant="text"
            size="small"
            disabled={ending}
            onClick={handleEndEarly}
            sx={{ color: 'rgba(255,255,255,0.55)', fontWeight: 800, px: 1, minWidth: 0 }}
          >
            End
          </Button>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            {failCount > 0 && (
              <Box sx={{ display:'flex', alignItems:'center', gap:0.5 }}>
                <WarningAmberIcon sx={{ fontSize:'0.9rem', color:'error.main' }}/>
                <Typography variant="caption" color="error.main" fontWeight={700}>
                  {failCount} restart{failCount > 1 ? 's' : ''}
                </Typography>
              </Box>
            )}
            <Typography variant="caption" color="primary.main" fontWeight={600}>
              +{xpReward} XP on finish
            </Typography>
          </Box>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 8, borderRadius: 4,
            bgcolor: 'rgba(255,255,255,0.08)',
            '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #FF6B35, #FFD166)', borderRadius: 4 },
          }}
        />
        <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'center' }}>
          {games.map((g, i) => (
            <Box key={i} sx={{
              flex: 1, height: 4, borderRadius: 2,
              bgcolor: i < gameIndex ? 'success.main' : i === gameIndex ? 'primary.main' : 'rgba(255,255,255,0.1)',
              transition: 'background-color 0.3s',
            }} />
          ))}
        </Box>
      </Box>

      {/* Inactivity warning */}
      {inactivityLeft <= 10 && (
        <Box sx={{
          mb: 2,
          px: 2, py: 1.25,
          borderRadius: 2.5,
          bgcolor: inactivityLeft <= 5 ? 'rgba(239,71,111,0.15)' : 'rgba(255,140,0,0.12)',
          border: `1.5px solid ${inactivityLeft <= 5 ? '#EF476F' : '#FF8C00'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          animation: 'warningPulse 0.8s ease-in-out infinite',
          '@keyframes warningPulse': {
            '0%,100%': { opacity: 1 },
            '50%':     { opacity: 0.7 },
          },
        }}>
          <Box sx={{ display:'flex', alignItems:'center', gap:0.75 }}>
            <WarningAmberIcon sx={{ fontSize:'1rem', color: inactivityLeft <= 5 ? '#EF476F' : '#FF8C00' }}/>
            <Typography variant="body2" fontWeight={700}
              color={inactivityLeft <= 5 ? 'error.main' : '#FF8C00'}>
              Still there? Alarm restarts in…
            </Typography>
          </Box>
          <Typography variant="h6" fontWeight={900}
            color={inactivityLeft <= 5 ? 'error.main' : '#FF8C00'}
            sx={{ fontVariantNumeric: 'tabular-nums', minWidth: 32, textAlign: 'right' }}>
            {inactivityLeft}s
          </Typography>
        </Box>
      )}

      <Fade in key={`${gameIndex}-${gameKey}`}>
        <Box sx={{ flex: 1 }}>
          {GameComponent && (
            <GameComponent
              key={`${gameIndex}-${gameKey}`}
              difficulty={difficulty}
              onComplete={handleGameComplete}
              onFail={handleGameFail}
              onActivity={resetInactivity}
            />
          )}
        </Box>
      </Fade>
    </Box>
  );
}

function IntroScreen({ alarm, games, intensity, xpReward, onStart }) {
  const INTENSITY_ICON  = { gentle: SpaIcon, moderate: WhatshotIcon, intense: FlashOnIcon };
  const INTENSITY_COLOR = { gentle: '#06D6A0', moderate: '#FFD166', intense: '#EF476F' };
  const IntensityIcon   = INTENSITY_ICON[intensity];
  const intensityColor  = INTENSITY_COLOR[intensity];

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(170deg, #160830 0%, #0D0D1A 55%, #080818 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      p: 3, textAlign: 'center', position: 'relative', overflow: 'hidden',
    }}>
      {/* Ambient glow */}
      <Box sx={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: `radial-gradient(circle, ${intensityColor}18 0%, transparent 65%)`,
        top: -100, left: '50%', transform: 'translateX(-50%)',
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      {/* Alarm icon */}
      <Box sx={{
        position: 'relative', mb: 2.5,
        animation: 'introRing 2.5s ease-in-out infinite',
        '@keyframes introRing': {
          '0%,100%': { transform: 'scale(1)' },
          '50%':     { transform: 'scale(1.06)' },
        },
      }}>
        <Box sx={{
          position: 'absolute', inset: -12, borderRadius: '50%',
          border: `2px solid ${intensityColor}30`,
          animation: 'introPulse 2.5s ease-out infinite',
          '@keyframes introPulse': {
            '0%':   { transform: 'scale(0.85)', opacity: 0.8 },
            '100%': { transform: 'scale(1.4)',  opacity: 0 },
          },
        }} />
        <Box sx={{
          width: 88, height: 88, borderRadius: '50%',
          bgcolor: `${intensityColor}14`,
          border: `2px solid ${intensityColor}35`,
          boxShadow: `0 0 40px ${intensityColor}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <AlarmIcon sx={{ fontSize: 44, color: intensityColor, filter: `drop-shadow(0 0 12px ${intensityColor}80)` }} />
        </Box>
      </Box>

      <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: '-0.5px', mb: 0.5 }}>
        Rise & Shine, Legend!
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
        {alarm?.label || 'Alarm'}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
        <IntensityIcon sx={{ fontSize: '1.15rem', color: intensityColor }} />
        <Typography variant="h6" fontWeight={700} sx={{ color: intensityColor }}>
          {intensity.charAt(0).toUpperCase() + intensity.slice(1)} Pulse
        </Typography>
      </Box>
      <Typography variant="caption" color="text.disabled" sx={{ mb: 4 }}>
        No dodging it, mate — finish all games to dismiss.
      </Typography>

      {/* Games card */}
      <Box sx={{
        width: '100%', maxWidth: 340, mb: 4,
        borderRadius: 4,
        bgcolor: 'rgba(20,20,38,0.9)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(16px)',
        overflow: 'hidden',
      }}>
        <Box sx={{ px: 2.5, pt: 2, pb: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.6rem' }}>
            COMPLETE THESE TO DISMISS
          </Typography>
        </Box>

        {games.map((g, i) => {
          const GameIcon = GAME_ICONS[g];
          const color    = GAME_COLORS[g];
          return (
            <Box
              key={g}
              sx={{
                display: 'flex', alignItems: 'center', gap: 2,
                px: 2.5, py: 1.5,
                borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                animation: `gameIn 0.5s ease ${i * 0.1}s both`,
                '@keyframes gameIn': {
                  from: { opacity: 0, transform: 'translateX(-12px)' },
                  to:   { opacity: 1, transform: 'none' },
                },
              }}
            >
              <Box sx={{
                width: 42, height: 42, borderRadius: 2.5, flexShrink: 0,
                bgcolor: `${color}15`, border: `1px solid ${color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 12px ${color}20`,
              }}>
                <GameIcon sx={{ fontSize: '1.3rem', color }} />
              </Box>
              <Box sx={{ flex: 1, textAlign: 'left' }}>
                <Typography fontWeight={700} variant="body2">{GAME_LABELS[g]}</Typography>
              </Box>
              <Box sx={{
                width: 24, height: 24, borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)',
                fontFamily: '"Fraunces", serif',
              }}>
                {i + 1}
              </Box>
            </Box>
          );
        })}

        <Box sx={{
          mx: 2.5, my: 1.5, px: 2, py: 1.25,
          borderRadius: 2.5,
          bgcolor: 'rgba(255,209,102,0.06)',
          border: '1px solid rgba(255,209,102,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
        }}>
          <EmojiEventsIcon sx={{ color: '#FFD166', fontSize: 16 }} />
          <Typography variant="body2" color="secondary.main" fontWeight={700}>
            +{xpReward} XP on success
          </Typography>
        </Box>
      </Box>

      <Button
        variant="contained" size="large" onClick={onStart}
        sx={{ px: 7, py: 1.75, fontSize: '1rem', borderRadius: 3 }}
      >
        Start Wake-Up Routine
      </Button>
    </Box>
  );
}

function ResultScreen({ results, xpReward, totalFails, onDone }) {
  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(170deg, #061C10 0%, #0D0D1A 60%, #080818 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      p: 3, textAlign: 'center', position: 'relative', overflow: 'hidden',
    }}>
      {/* Celebration glow */}
      <Box sx={{
        position: 'absolute', width: 450, height: 450, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6,214,160,0.14) 0%, transparent 65%)',
        top: -100, left: '50%', transform: 'translateX(-50%)',
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      {/* Check icon */}
      <Box sx={{
        position: 'relative', mb: 2.5,
        animation: 'checkBounce 0.6s cubic-bezier(0.34,1.56,0.64,1)',
        '@keyframes checkBounce': {
          from: { transform: 'scale(0.3)', opacity: 0 },
          to:   { transform: 'scale(1)',   opacity: 1 },
        },
      }}>
        <Box sx={{
          position: 'absolute', inset: -12, borderRadius: '50%',
          border: '2px solid rgba(6,214,160,0.25)',
          animation: 'resultPulse 2s ease-out 0.4s infinite',
          '@keyframes resultPulse': {
            '0%':   { transform: 'scale(0.85)', opacity: 0.6 },
            '100%': { transform: 'scale(1.5)',  opacity: 0 },
          },
        }} />
        <Box sx={{
          width: 88, height: 88, borderRadius: '50%',
          bgcolor: 'rgba(6,214,160,0.12)',
          border: '2px solid rgba(6,214,160,0.35)',
          boxShadow: '0 0 40px rgba(6,214,160,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <CheckCircleIcon sx={{
            fontSize: 48, color: '#06D6A0',
            filter: 'drop-shadow(0 0 12px rgba(6,214,160,0.7))',
          }} />
        </Box>
      </Box>

      <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: '-0.5px', mb: 0.5 }}>
        Bonzer, you're up!
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Ripper morning routine, mate
      </Typography>

      {/* XP card */}
      <Box sx={{
        px: 4, py: 2, mb: 3, borderRadius: 3,
        bgcolor: 'rgba(6,214,160,0.08)',
        border: '1px solid rgba(6,214,160,0.22)',
        backdropFilter: 'blur(12px)',
        animation: 'xpIn 0.5s ease 0.3s both',
        '@keyframes xpIn': {
          from: { opacity: 0, transform: 'translateY(12px)' },
          to:   { opacity: 1, transform: 'none' },
        },
      }}>
        <Typography variant="h5" color="success.main" fontWeight={900} sx={{ fontFamily: '"Fraunces", serif', letterSpacing: '-0.5px' }}>
          +{xpReward} XP earned!
        </Typography>
        {totalFails > 0 && (
          <Typography variant="caption" color="text.secondary">
            {totalFails} restart{totalFails > 1 ? 's' : ''} — no worries, keep at it!
          </Typography>
        )}
      </Box>

      {/* Results card */}
      <Box sx={{
        width: '100%', maxWidth: 340, mb: 4,
        borderRadius: 4,
        bgcolor: 'rgba(20,20,38,0.9)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(16px)',
        overflow: 'hidden',
        animation: 'resultsIn 0.5s ease 0.5s both',
        '@keyframes resultsIn': {
          from: { opacity: 0, transform: 'translateY(16px)' },
          to:   { opacity: 1, transform: 'none' },
        },
      }}>
        {results.map((r, i) => (
          <Box key={i} sx={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            px: 2.5, py: 1.5,
            borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
          }}>
            <Typography variant="body2" fontWeight={500}>{GAME_LABELS[r.game]}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CheckIcon sx={{ fontSize: '0.85rem', color: r.retries === 0 ? '#06D6A0' : '#FFD166' }} />
              <Typography variant="body2" fontWeight={700}
                color={r.retries === 0 ? 'success.main' : 'secondary.main'}>
                {r.retries === 0 ? 'First crack!' : `${r.retries} restart${r.retries > 1 ? 's' : ''}`}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      <Button
        variant="contained" size="large" onClick={onDone}
        sx={{ px: 6, py: 1.75, borderRadius: 3, fontSize: '1rem' }}
      >
        <WbSunnyIcon sx={{ mr: 1 }} /> Go to Home
      </Button>
    </Box>
  );
}
