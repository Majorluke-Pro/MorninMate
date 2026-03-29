import { useState, useEffect, useRef } from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { playReactionGo, playEarlyTap, playMiss, playSuccess } from '../../lib/sounds';

// Red-light / green-light mechanic:
// - Screen turns RED first (random 1–2.5s) — tapping during red = lose a life
// - Then turns GREEN — must tap within the window
// - Missing the green = lose a life
// - Window shrinks 40ms per successful hit (adaptive)
// - 3 lives — if lives reach 0, onFail (which restarts the game in WakeUpFlow)

export default function ReactionGame({ difficulty = 'normal', onComplete, onFail }) {
  const totalRounds  = difficulty === 'easy' ? 4 : difficulty === 'hard' ? 7 : 5;
  const baseWindow   = difficulty === 'easy' ? 1100 : difficulty === 'hard' ? 650 : 850;
  const maxLives     = 3;

  const [phase,     setPhase]     = useState('countdown');  // countdown|red|green|tapped|missed|early
  const [countdown, setCountdown] = useState(3);
  const [round,     setRound]     = useState(0);
  const [lives,     setLives]     = useState(maxLives);
  const [times,     setTimes]     = useState([]);
  const [window_ms, setWindowMs]  = useState(baseWindow);
  const [lastTime,  setLastTime]  = useState(null);

  const goRef    = useRef(null);
  const startRef = useRef(null);

  // Countdown
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
    scheduleRound();
  }, [phase, countdown]);

  function scheduleRound() {
    setPhase('red');
    // Red phase: random 1000–2800ms
    const redDuration = 1000 + Math.random() * 1800;
    goRef.current = setTimeout(() => {
      setPhase('green');
      playReactionGo();
      startRef.current = Date.now();
      // Green window — tap within this time
      goRef.current = setTimeout(() => {
        loseLife('missed');
      }, window_ms);
    }, redDuration);
  }

  function loseLife(newPhase) {
    clearTimeout(goRef.current);
    if (newPhase === 'missed') playMiss();
    setPhase(newPhase);
    setLives(prev => {
      const next = prev - 1;
      if (next <= 0) {
        setTimeout(() => onFail(), 900);
      } else {
        setTimeout(() => scheduleRound(), 1100);
      }
      return next;
    });
  }

  function handleTap() {
    if (phase === 'countdown') return;

    if (phase === 'red') {
      playEarlyTap();
      loseLife('early');
      return;
    }

    if (phase !== 'green') return;

    clearTimeout(goRef.current);
    const elapsed = Date.now() - startRef.current;
    setLastTime(elapsed);
    const newTimes = [...times, elapsed];
    setTimes(newTimes);
    setPhase('tapped');
    playSuccess();

    // Shrink window slightly each success (gets harder)
    setWindowMs(w => Math.max(w - 40, 350));

    const nextRound = round + 1;
    if (nextRound >= totalRounds) {
      setTimeout(() => onComplete(), 700);
    } else {
      setRound(nextRound);
      setTimeout(() => scheduleRound(), 800);
    }
  }

  const avgTime = times.length > 0
    ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
    : null;

  const bgColor = {
    countdown: '#16162A',
    red:       '#3D0A0A',
    green:     '#06D6A0',
    tapped:    '#0A2A3D',
    missed:    '#3D0A0A',
    early:     '#3D1F0A',
  }[phase] || '#16162A';

  const borderColor = {
    red:    '#EF476F',
    green:  '#06D6A0',
    tapped: '#118AB2',
    missed: '#EF476F',
    early:  '#FF8C5A',
  }[phase] || 'rgba(255,255,255,0.08)';

  const mainEmoji = {
    countdown: '⏳',
    red:       '🔴',
    green:     '🟢',
    tapped:    '⚡',
    missed:    '💨',
    early:     '⛔',
  }[phase];

  const mainText = {
    countdown: `Get ready... ${countdown > 0 ? countdown : ''}`,
    red:       'WAIT...',
    green:     'TAP NOW!',
    tapped:    lastTime ? `${lastTime}ms` : 'Hit!',
    missed:    'Too slow!',
    early:     'Too early!',
  }[phase];

  const subText = {
    red:    'Don\'t tap yet!',
    green:  '',
    tapped: avgTime ? `Avg: ${avgTime}ms` : '',
    missed: 'Missed the window',
    early:  'Penalty — wait for green',
  }[phase] || '';

  const textColor = phase === 'green' ? '#0D0D1A' : 'text.primary';

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 2 }}>
          Reaction Rush
        </Typography>
        {/* Lives */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {Array.from({ length: maxLives }).map((_, i) => (
            i < lives
              ? <FavoriteIcon key={i} sx={{ fontSize: 18, color: '#EF476F' }} />
              : <FavoriteBorderIcon key={i} sx={{ fontSize: 18, color: 'rgba(255,255,255,0.2)' }} />
          ))}
        </Box>
      </Box>

      {/* Round progress */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            Round {Math.min(round + 1, totalRounds)} / {totalRounds}
          </Typography>
          {avgTime && (
            <Typography variant="caption" color="secondary.main" fontWeight={700}>
              Best avg: {avgTime}ms
            </Typography>
          )}
        </Box>
        <LinearProgress
          variant="determinate"
          value={(round / totalRounds) * 100}
          color="secondary"
          sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.08)' }}
        />
      </Box>

      {/* Tap area */}
      <Box
        onClick={handleTap}
        sx={{
          height: 280,
          borderRadius: 4,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', userSelect: 'none',
          bgcolor: bgColor,
          border: `2.5px solid ${borderColor}`,
          transition: 'background-color 0.08s, border-color 0.1s',
          gap: 1.5,
          boxShadow: phase === 'green'
            ? '0 0 40px rgba(6,214,160,0.35)'
            : phase === 'red'
            ? '0 0 20px rgba(239,71,111,0.2)'
            : 'none',
          '@keyframes pulse': {
            '0%,100%': { transform: 'scale(1)' },
            '50%': { transform: 'scale(1.015)' },
          },
          animation: phase === 'green' ? 'pulse 0.4s ease-in-out infinite' : 'none',
        }}
      >
        <Typography variant="h1" sx={{ lineHeight: 1 }}>{mainEmoji}</Typography>
        <Typography variant="h4" fontWeight={900} sx={{ color: textColor }}>{mainText}</Typography>
        {subText && (
          <Typography variant="body2" sx={{ color: textColor, opacity: 0.75 }}>{subText}</Typography>
        )}

        {phase === 'red' && (
          <Box sx={{
            mt: 1, px: 2, py: 0.75, borderRadius: 2,
            bgcolor: 'rgba(239,71,111,0.15)',
            border: '1px solid rgba(239,71,111,0.3)',
          }}>
            <Typography variant="caption" color="#EF476F" fontWeight={700}>
              Tapping now costs a life
            </Typography>
          </Box>
        )}

        {phase === 'countdown' && countdown === 0 && (
          <Typography variant="caption" color="text.secondary">
            Wait for green, tap on red = penalty
          </Typography>
        )}
      </Box>

      {/* Reaction time dots */}
      {times.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, mt: 2.5, flexWrap: 'wrap', justifyContent: 'center' }}>
          {times.map((t, i) => {
            const speed = t < 300 ? '#06D6A0' : t < 600 ? '#FFD166' : '#FF6B35';
            return (
              <Box key={i} sx={{
                px: 1.5, py: 0.4, borderRadius: 10,
                bgcolor: `${speed}18`, border: `1px solid ${speed}40`,
              }}>
                <Typography variant="caption" fontWeight={700} sx={{ color: speed }}>{t}ms</Typography>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Window shrink indicator */}
      {round > 0 && (
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1.5 }}>
          Tap window: {window_ms}ms — gets shorter each round
        </Typography>
      )}
    </Box>
  );
}
