import { useState, useEffect } from 'react';
import { Box, Typography, Card, Button, LinearProgress, Fade } from '@mui/material';
import { startAlarm, stopAlarm } from '../../lib/sounds';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import { useApp } from '../../context/AppContext';
import MathGame from '../Games/MathGame';
import MemoryGame from '../Games/MemoryGame';
import ReactionGame from '../Games/ReactionGame';

const GAME_MAP = { math: MathGame, memory: MemoryGame, reaction: ReactionGame };
const GAME_LABELS = { math: 'Math Blitz', memory: 'Memory Match', reaction: 'Reaction Rush' };
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
    startAlarm();
    return () => stopAlarm();
  }, []);

  const [gameIndex,  setGameIndex]  = useState(0);
  const [gameKey,    setGameKey]    = useState(0);   // remount to restart
  const [failCount,  setFailCount]  = useState(0);   // fails on current game
  const [totalFails, setTotalFails] = useState(0);   // across all games
  const [results,    setResults]    = useState([]);
  const [phase,      setPhase]      = useState('intro');

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

      <Fade in key={`${gameIndex}-${gameKey}`}>
        <Box sx={{ flex: 1 }}>
          {GameComponent && (
            <GameComponent
              key={`${gameIndex}-${gameKey}`}
              difficulty={difficulty}
              onComplete={handleGameComplete}
              onFail={handleGameFail}
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
      <Typography variant="h4" fontWeight={800} gutterBottom>Rise & Grind!</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>{alarm?.label || 'Alarm'}</Typography>
      <Typography variant="h6" color="primary.main" fontWeight={700} sx={{ mb: 1 }}>
        {intensityEmoji} {intensity.charAt(0).toUpperCase() + intensity.slice(1)} Pulse
      </Typography>
      <Typography variant="caption" color="text.disabled" sx={{ mb: 4 }}>
        You must complete all games to dismiss the alarm.
      </Typography>

      <Card sx={{ p: 3, bgcolor: 'background.paper', width: '100%', maxWidth: 340, mb: 4 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Complete these games to wake up:
        </Typography>
        {games.map((g, i) => (
          <Box key={g} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
            <Box sx={{
              width: 28, height: 28, borderRadius: '50%', bgcolor: 'primary.main',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 800,
            }}>
              {i + 1}
            </Box>
            <Typography fontWeight={600}>{GAME_LABELS[g]}</Typography>
          </Box>
        ))}
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
      <Typography variant="h4" fontWeight={800} gutterBottom>You're Awake! 🎉</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>Morning routine complete</Typography>

      <Card sx={{ px: 4, py: 2, bgcolor: 'rgba(6,214,160,0.1)', border: '1px solid rgba(6,214,160,0.3)', mb: 3 }}>
        <Typography variant="h5" color="success.main" fontWeight={800}>+{xpReward} XP earned!</Typography>
        {totalFails > 0 && (
          <Typography variant="caption" color="text.secondary">
            ({totalFails} restart{totalFails > 1 ? 's' : ''} — keep practising!)
          </Typography>
        )}
      </Card>

      <Card sx={{ p: 3, bgcolor: 'background.paper', width: '100%', maxWidth: 340, mb: 4 }}>
        {results.map((r, i) => (
          <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
            <Typography variant="body2">{GAME_LABELS[r.game]}</Typography>
            <Typography variant="body2" color={r.retries === 0 ? 'success.main' : 'warning.main'} fontWeight={700}>
              {r.retries === 0 ? '✓ First try' : `✓ ${r.retries} restart${r.retries > 1 ? 's' : ''}`}
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
