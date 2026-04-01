import { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, Card, Button, LinearProgress, Fade } from '@mui/material';
import { startAlarm, stopAlarm } from '../../lib/sounds';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import CalculateIcon from '@mui/icons-material/Calculate';
import StyleIcon from '@mui/icons-material/Style';
import BoltIcon from '@mui/icons-material/Bolt';
import { useApp } from '../../context/AppContext';
import MathGame from '../Games/MathGame';
import MemoryGame from '../Games/MemoryGame';
import ReactionGame from '../Games/ReactionGame';

const GAME_MAP    = { math: MathGame, memory: MemoryGame, reaction: ReactionGame };
const INACTIVITY_LIMIT = 30; // seconds before alarm restarts
const GAME_LABELS = { math: 'Math Blitz', memory: 'Memory Match', reaction: 'Reaction Rush' };
const GAME_ICONS  = { math: CalculateIcon, memory: StyleIcon, reaction: BoltIcon };
const GAME_COLORS = { math: '#FF6B35', memory: '#FFD166', reaction: '#06D6A0' };
const DIFFICULTY_MAP = { gentle: 'easy', moderate: 'normal', intense: 'hard' };
const XP_REWARD = { gentle: 20, moderate: 35, intense: 60 };

export default function WakeUpFlow() {
  const { activeAlarm, clearActiveAlarm, awardXP, addDemerit } = useApp();

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

  if (phase === 'intro') {
    return (
      <IntroScreen
        alarm={activeAlarm}
        games={games}
        intensity={intensity}
        xpReward={xpReward}
        onStart={() => { stopAlarm(); setPhase('playing'); }}
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Game {gameIndex + 1} of {games.length}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            {failCount > 0 && (
              <Typography variant="caption" color="error.main" fontWeight={700}>
                ⚠️ {failCount} restart{failCount > 1 ? 's' : ''}
              </Typography>
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
          <Typography variant="body2" fontWeight={700}
            color={inactivityLeft <= 5 ? 'error.main' : '#FF8C00'}>
            ⚠️ Still there? Alarm restarts in…
          </Typography>
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
  const intensityEmoji = { gentle: '🌱', moderate: '🔥', intense: '⚡' }[intensity];

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1A0A2E 0%, #0D0D1A 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      p: 3, textAlign: 'center',
    }}>
      <Typography variant="h1" sx={{ mb: 2 }}>⏰</Typography>
      <Typography variant="h4" fontWeight={800} gutterBottom>Rise & Shine, Legend! 🐨</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>{alarm?.label || 'Alarm'}</Typography>
      <Typography variant="h6" color="primary.main" fontWeight={700} sx={{ mb: 1 }}>
        {intensityEmoji} {intensity.charAt(0).toUpperCase() + intensity.slice(1)} Pulse
      </Typography>
      <Typography variant="caption" color="text.disabled" sx={{ mb: 4 }}>
        No dodging it, mate — finish all games to dismiss.
      </Typography>

      <Card sx={{ p: 3, bgcolor: 'background.paper', width: '100%', maxWidth: 340, mb: 4 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Complete these games to wake up:
        </Typography>
        {games.map((g, i) => {
          const GameIcon = GAME_ICONS[g];
          const color = GAME_COLORS[g];
          return (
            <Box key={g} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
              <Box sx={{
                width: 36, height: 36, borderRadius: 2, flexShrink: 0,
                bgcolor: `${color}18`, border: `1px solid ${color}35`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <GameIcon sx={{ fontSize: '1.2rem', color }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography fontWeight={700} variant="body2">{GAME_LABELS[g]}</Typography>
              </Box>
              <Box sx={{
                width: 22, height: 22, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.65rem', fontWeight: 800, color: 'text.disabled',
              }}>
                {i + 1}
              </Box>
            </Box>
          );
        })}
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <EmojiEventsIcon sx={{ color: 'secondary.main', fontSize: 18 }} />
          <Typography variant="body2" color="secondary.main" fontWeight={700}>+{xpReward} XP on success</Typography>
        </Box>
      </Card>

      <Button variant="contained" size="large" onClick={onStart} sx={{ px: 6, py: 1.5 }}>
        Start Wake-Up Routine
      </Button>
    </Box>
  );
}

function ResultScreen({ results, xpReward, totalFails, onDone }) {
  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a2e1a 0%, #0D0D1A 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      p: 3, textAlign: 'center',
    }}>
      <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
      <Typography variant="h4" fontWeight={800} gutterBottom>Bonzer, you're up! 🎉</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>Ripper morning routine, mate</Typography>

      <Card sx={{ px: 4, py: 2, bgcolor: 'rgba(6,214,160,0.1)', border: '1px solid rgba(6,214,160,0.3)', mb: 3 }}>
        <Typography variant="h5" color="success.main" fontWeight={800}>+{xpReward} XP earned!</Typography>
        {totalFails > 0 && (
          <Typography variant="caption" color="text.secondary">
            ({totalFails} restart{totalFails > 1 ? 's' : ''} — no worries, keep at it!)
          </Typography>
        )}
      </Card>

      <Card sx={{ p: 3, bgcolor: 'background.paper', width: '100%', maxWidth: 340, mb: 4 }}>
        {results.map((r, i) => (
          <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
            <Typography variant="body2">{GAME_LABELS[r.game]}</Typography>
            <Typography variant="body2" color={r.retries === 0 ? 'success.main' : 'warning.main'} fontWeight={700}>
              {r.retries === 0 ? '✓ First crack!' : `✓ ${r.retries} restart${r.retries > 1 ? 's' : ''}`}
            </Typography>
          </Box>
        ))}
      </Card>

      <Button variant="contained" size="large" onClick={onDone} sx={{ px: 6, py: 1.5 }}>
        <WbSunnyIcon sx={{ mr: 1 }} /> Go to Home
      </Button>
    </Box>
  );
}
