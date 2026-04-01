import { useState, useEffect, useRef } from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import BoltIcon from '@mui/icons-material/Bolt';
import { playReactionGo, playEarlyTap, playMiss, playSuccess } from '../../lib/sounds';

export default function ReactionGame({ difficulty = 'normal', onComplete, onFail, onActivity }) {
  const totalRounds = difficulty === 'easy' ? 4 : difficulty === 'hard' ? 7 : 5;
  const baseWindow  = difficulty === 'easy' ? 1100 : difficulty === 'hard' ? 650 : 850;
  const maxLives    = 3;

  const [phase,     setPhase]     = useState('countdown');
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
    const redDuration = 1000 + Math.random() * 1800;
    goRef.current = setTimeout(() => {
      setPhase('green');
      playReactionGo();
      startRef.current = Date.now();
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
    onActivity?.();
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

  // Phase-specific styles
  const phaseConfig = {
    countdown: {
      bg: 'radial-gradient(ellipse at center, #1a1a3a 0%, #0D0D1A 70%)',
      border: 'rgba(255,255,255,0.08)',
      glow: 'none',
      label: countdown > 0 ? String(countdown) : '⚡',
      labelColor: countdown > 0 ? '#FFD166' : '#FF6B35',
      sub: 'Wait for green — tap on red = penalty',
    },
    red: {
      bg: 'radial-gradient(ellipse at center, #3D0A0A 0%, #1a0505 70%)',
      border: '#EF476F',
      glow: '0 0 60px rgba(239,71,111,0.25)',
      label: 'WAIT',
      labelColor: '#EF476F',
      sub: "Don't tap yet!",
    },
    green: {
      bg: 'radial-gradient(ellipse at center, #063d2a 0%, #021a12 70%)',
      border: '#06D6A0',
      glow: '0 0 80px rgba(6,214,160,0.4)',
      label: 'TAP!',
      labelColor: '#06D6A0',
      sub: '',
    },
    tapped: {
      bg: 'radial-gradient(ellipse at center, #0A1E3D 0%, #060e1f 70%)',
      border: '#118AB2',
      glow: '0 0 40px rgba(17,138,178,0.3)',
      label: lastTime ? `${lastTime}ms` : '⚡',
      labelColor: '#118AB2',
      sub: avgTime ? `avg ${avgTime}ms` : '',
    },
    missed: {
      bg: 'radial-gradient(ellipse at center, #2a0a0a 0%, #130505 70%)',
      border: '#EF476F',
      glow: '0 0 40px rgba(239,71,111,0.2)',
      label: 'SLOW!',
      labelColor: '#EF476F',
      sub: 'Missed the window',
    },
    early: {
      bg: 'radial-gradient(ellipse at center, #2a1500 0%, #120a00 70%)',
      border: '#FF8C5A',
      glow: '0 0 40px rgba(255,140,90,0.2)',
      label: 'EARLY',
      labelColor: '#FF8C5A',
      sub: 'Wait for green!',
    },
  };

  const cfg = phaseConfig[phase] || phaseConfig.countdown;

  return (
    <Box sx={{ textAlign: 'center' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 2 }}>
          Reaction Rush
        </Typography>
        {/* Lives */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {Array.from({ length: maxLives }).map((_, i) =>
            i < lives
              ? <FavoriteIcon    key={i} sx={{ fontSize: 20, color: '#EF476F', filter: 'drop-shadow(0 0 4px rgba(239,71,111,0.6))' }} />
              : <FavoriteBorderIcon key={i} sx={{ fontSize: 20, color: 'rgba(255,255,255,0.18)' }} />
          )}
        </Box>
      </Box>

      {/* Round progress */}
      <Box sx={{ mb: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            Round {Math.min(round + 1, totalRounds)} / {totalRounds}
          </Typography>
          {avgTime && (
            <Typography variant="caption" color="secondary.main" fontWeight={700}>
              avg {avgTime}ms
            </Typography>
          )}
        </Box>
        <LinearProgress
          variant="determinate"
          value={(round / totalRounds) * 100}
          color="secondary"
          sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.06)' }}
        />
      </Box>

      {/* Main tap area */}
      <Box
        onClick={handleTap}
        sx={{
          height: 300,
          borderRadius: '50%',
          mx: 'auto',
          maxWidth: 300,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', userSelect: 'none',
          background: cfg.bg,
          border: `3px solid ${cfg.border}`,
          boxShadow: cfg.glow,
          transition: 'background 0.1s, border-color 0.1s, box-shadow 0.15s',
          gap: 1,
          animation: phase === 'green'
            ? 'greenPulse 0.5s ease-in-out infinite'
            : phase === 'countdown' && countdown > 0
            ? 'countdownPop 0.5s cubic-bezier(0.34,1.56,0.64,1)'
            : 'none',
          '@keyframes greenPulse': {
            '0%,100%': { transform: 'scale(1)' },
            '50%':     { transform: 'scale(1.03)' },
          },
          '@keyframes countdownPop': {
            from: { transform: 'scale(1.2)', opacity: 0.5 },
            to:   { transform: 'scale(1)',   opacity: 1 },
          },
        }}
      >
        {/* Big label */}
        <Typography
          key={`${phase}-${countdown}`}
          variant="h3"
          fontWeight={900}
          sx={{
            color: cfg.labelColor,
            letterSpacing: phase === 'tapped' ? 0 : 3,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
            animation: 'labelPop 0.25s cubic-bezier(0.34,1.56,0.64,1)',
            '@keyframes labelPop': {
              from: { transform: 'scale(0.7)', opacity: 0 },
              to:   { transform: 'scale(1)',   opacity: 1 },
            },
          }}
        >
          {cfg.label}
        </Typography>

        {cfg.sub && (
          <Typography variant="body2" sx={{
            color: cfg.labelColor,
            opacity: 0.65,
            mt: 0.5,
          }}>
            {cfg.sub}
          </Typography>
        )}

        {phase === 'green' && (
          <BoltIcon sx={{ fontSize: 28, color: '#06D6A0', mt: 0.5, filter: 'drop-shadow(0 0 8px rgba(6,214,160,0.8))' }} />
        )}
      </Box>

      {/* Reaction time history */}
      {times.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, mt: 2.5, flexWrap: 'wrap', justifyContent: 'center' }}>
          {times.map((t, i) => {
            const color = t < 300 ? '#06D6A0' : t < 600 ? '#FFD166' : '#FF6B35';
            return (
              <Box key={i} sx={{
                px: 1.5, py: 0.4, borderRadius: 10,
                bgcolor: `${color}15`,
                border: `1px solid ${color}35`,
                animation: i === times.length - 1 ? 'fadeIn 0.3s ease' : 'none',
                '@keyframes fadeIn': {
                  from: { opacity: 0, transform: 'scale(0.8)' },
                  to:   { opacity: 1, transform: 'scale(1)' },
                },
              }}>
                <Typography variant="caption" fontWeight={700} sx={{ color }}>{t}ms</Typography>
              </Box>
            );
          })}
        </Box>
      )}

      {round > 0 && phase !== 'green' && (
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1.5 }}>
          window: {window_ms}ms
        </Typography>
      )}
    </Box>
  );
}
