import { useState, useEffect, useRef } from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import BoltIcon from '@mui/icons-material/Bolt';
import { playReactionGo, playEarlyTap, playMiss, playSuccess } from '../../lib/sounds';

function getTimeRating(ms) {
  if (ms < 200) return { label: 'INSANE', color: '#06D6A0' };
  if (ms < 300) return { label: 'AMAZING', color: '#06D6A0' };
  if (ms < 450) return { label: 'GOOD', color: '#FFD166' };
  if (ms < 600) return { label: 'OK', color: '#FF8C5A' };
  return { label: 'SLOW', color: '#EF476F' };
}

export default function ReactionGame({ difficulty = 'normal', onComplete, onFail, onActivity }) {
  const totalRounds = difficulty === 'easy' ? 4 : difficulty === 'hard' ? 7 : 5;
  const baseWindow  = difficulty === 'easy' ? 1100 : difficulty === 'hard' ? 650 : 850;
  const maxLives    = 3;

  const [phase,      setPhase]     = useState('countdown');
  const [countdown,  setCountdown] = useState(3);
  const [round,      setRound]     = useState(0);
  const [lives,      setLives]     = useState(maxLives);
  const [times,      setTimes]     = useState([]);
  const [window_ms,  setWindowMs]  = useState(baseWindow);
  const [lastTime,   setLastTime]  = useState(null);
  const [ripple,     setRipple]    = useState(false);
  const [countKey,   setCountKey]  = useState(0);

  const goRef    = useRef(null);
  const startRef = useRef(null);

  // Countdown
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown > 0) {
      const t = setTimeout(() => {
        setCountdown(c => c - 1);
        setCountKey(k => k + 1);
      }, 1000);
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
    setRipple(true);
    setTimeout(() => setRipple(false), 600);
    playSuccess();
    setWindowMs(w => Math.max(w - 40, 350));

    const nextRound = round + 1;
    if (nextRound >= totalRounds) {
      setTimeout(() => onComplete(), 700);
    } else {
      setRound(nextRound);
      setTimeout(() => scheduleRound(), 900);
    }
  }

  const avgTime = times.length > 0
    ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
    : null;

  const lastRating = lastTime ? getTimeRating(lastTime) : null;

  const phaseConfig = {
    countdown: {
      bg: 'radial-gradient(ellipse at 50% 60%, rgba(30,20,60,0.9) 0%, #0D0D1A 70%)',
      border: 'rgba(255,255,255,0.1)',
      glow: 'none',
      label: countdown > 0 ? String(countdown) : '⚡',
      labelColor: countdown > 0 ? '#FFD166' : '#FF6B35',
      sub: 'Tap when it turns green',
    },
    red: {
      bg: 'radial-gradient(ellipse at 50% 55%, rgba(80,8,8,0.95) 0%, #120303 70%)',
      border: '#EF476F',
      glow: '0 0 50px rgba(239,71,111,0.22), inset 0 0 40px rgba(239,71,111,0.06)',
      label: 'WAIT',
      labelColor: '#EF476F',
      sub: "Don't tap yet!",
    },
    green: {
      bg: 'radial-gradient(ellipse at 50% 55%, rgba(4,60,38,0.98) 0%, #011510 70%)',
      border: '#06D6A0',
      glow: '0 0 80px rgba(6,214,160,0.45), inset 0 0 50px rgba(6,214,160,0.08)',
      label: 'TAP!',
      labelColor: '#06D6A0',
      sub: '',
    },
    tapped: {
      bg: 'radial-gradient(ellipse at 50% 55%, rgba(8,22,50,0.95) 0%, #060e1f 70%)',
      border: '#118AB2',
      glow: '0 0 40px rgba(17,138,178,0.3)',
      label: lastTime ? `${lastTime}ms` : '⚡',
      labelColor: lastRating?.color ?? '#118AB2',
      sub: lastRating?.label ?? '',
    },
    missed: {
      bg: 'radial-gradient(ellipse at 50% 55%, rgba(50,5,5,0.95) 0%, #0e0303 70%)',
      border: '#EF476F',
      glow: '0 0 40px rgba(239,71,111,0.2)',
      label: 'MISSED',
      labelColor: '#EF476F',
      sub: 'Too slow!',
    },
    early: {
      bg: 'radial-gradient(ellipse at 50% 55%, rgba(50,22,0,0.95) 0%, #100800 70%)',
      border: '#FF8C5A',
      glow: '0 0 40px rgba(255,140,90,0.2)',
      label: 'EARLY!',
      labelColor: '#FF8C5A',
      sub: 'Wait for green',
    },
  };

  const cfg = phaseConfig[phase] || phaseConfig.countdown;

  return (
    <Box sx={{ textAlign: 'center', touchAction: 'manipulation' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 2 }}>
          Reaction Rush
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.75 }}>
          {Array.from({ length: maxLives }).map((_, i) =>
            i < lives
              ? <FavoriteIcon key={i} sx={{
                  fontSize: 20, color: '#EF476F',
                  filter: 'drop-shadow(0 0 5px rgba(239,71,111,0.7))',
                  animation: i === lives - 1 && phase === 'missed' ? 'heartLose 0.4s ease' : 'none',
                  '@keyframes heartLose': {
                    '0%':   { transform: 'scale(1.3)', opacity: 1 },
                    '100%': { transform: 'scale(0.6)', opacity: 0 },
                  },
                }} />
              : <FavoriteBorderIcon key={i} sx={{ fontSize: 20, color: 'rgba(255,255,255,0.15)' }} />
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
            <Typography variant="caption" fontWeight={700}
              sx={{ color: getTimeRating(avgTime).color }}>
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
        onTouchStart={(e) => { e.preventDefault(); handleTap(); }}
        onClick={handleTap}
        sx={{
          height: 290,
          borderRadius: '50%',
          mx: 'auto',
          maxWidth: 290,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'manipulation',
          background: cfg.bg,
          border: `3px solid ${cfg.border}`,
          boxShadow: cfg.glow,
          transition: 'background 0.12s, border-color 0.12s, box-shadow 0.18s',
          gap: 0.75,
          position: 'relative',
          overflow: 'hidden',
          animation: phase === 'green'
            ? 'greenPulse 0.45s ease-in-out infinite'
            : phase === 'red'
            ? 'redIdle 2s ease-in-out infinite'
            : 'none',
          '@keyframes greenPulse': {
            '0%,100%': { transform: 'scale(1)',    boxShadow: cfg.glow },
            '50%':     { transform: 'scale(1.05)', boxShadow: '0 0 120px rgba(6,214,160,0.65), inset 0 0 60px rgba(6,214,160,0.12)' },
          },
          '@keyframes redIdle': {
            '0%,100%': { opacity: 1 },
            '50%':     { opacity: 0.88 },
          },
        }}
      >
        {/* Ripple on tap */}
        {ripple && (
          <Box sx={{
            position: 'absolute',
            width: '100%', height: '100%',
            borderRadius: '50%',
            border: '3px solid rgba(6,214,160,0.7)',
            animation: 'rippleOut 0.6s ease-out forwards',
            '@keyframes rippleOut': {
              '0%':   { transform: 'scale(0.85)', opacity: 0.9 },
              '100%': { transform: 'scale(1.3)',  opacity: 0 },
            },
            pointerEvents: 'none',
          }} />
        )}

        {/* Countdown number or phase label */}
        {phase === 'countdown' ? (
          <Typography
            key={countKey}
            variant="h2"
            fontWeight={900}
            sx={{
              color: countdown > 0 ? '#FFD166' : '#FF6B35',
              lineHeight: 1,
              animation: 'countPop 0.5s cubic-bezier(0.34,1.56,0.64,1)',
              '@keyframes countPop': {
                from: { transform: 'scale(1.6)', opacity: 0 },
                to:   { transform: 'scale(1)',   opacity: 1 },
              },
            }}
          >
            {countdown > 0 ? countdown : '⚡'}
          </Typography>
        ) : (
          <Typography
            key={phase}
            variant="h3"
            fontWeight={900}
            sx={{
              color: cfg.labelColor,
              letterSpacing: phase === 'tapped' ? 0 : 3,
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
              animation: 'labelPop 0.28s cubic-bezier(0.34,1.56,0.64,1)',
              '@keyframes labelPop': {
                from: { transform: 'scale(0.65)', opacity: 0 },
                to:   { transform: 'scale(1)',    opacity: 1 },
              },
            }}
          >
            {cfg.label}
          </Typography>
        )}

        {/* Rating label under time */}
        {phase === 'tapped' && lastRating && (
          <Typography
            variant="caption"
            fontWeight={800}
            sx={{
              color: lastRating.color,
              letterSpacing: 2,
              opacity: 0.9,
              animation: 'labelPop 0.3s cubic-bezier(0.34,1.56,0.64,1) 0.1s both',
            }}
          >
            {lastRating.label}
          </Typography>
        )}

        {phase === 'countdown' && countdown > 0 && (
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.35)', mt: 0.5 }}>
            {cfg.sub}
          </Typography>
        )}

        {(phase === 'red' || phase === 'missed' || phase === 'early') && cfg.sub && (
          <Typography variant="body2" sx={{ color: cfg.labelColor, opacity: 0.55, mt: 0.25 }}>
            {cfg.sub}
          </Typography>
        )}

        {phase === 'green' && (
          <BoltIcon sx={{
            fontSize: 30, color: '#06D6A0', mt: 0.5,
            filter: 'drop-shadow(0 0 10px rgba(6,214,160,0.9))',
            animation: 'boltPulse 0.45s ease-in-out infinite',
            '@keyframes boltPulse': {
              '0%,100%': { transform: 'scale(1)',    opacity: 1 },
              '50%':     { transform: 'scale(1.25)', opacity: 0.8 },
            },
          }} />
        )}
      </Box>

      {/* Reaction time history */}
      {times.length > 0 && (
        <Box sx={{ display: 'flex', gap: 0.75, mt: 2.5, flexWrap: 'wrap', justifyContent: 'center' }}>
          {times.map((t, i) => {
            const rating = getTimeRating(t);
            return (
              <Box key={i} sx={{
                px: 1.5, py: 0.5, borderRadius: 10,
                bgcolor: `${rating.color}12`,
                border: `1.5px solid ${rating.color}30`,
                animation: i === times.length - 1 ? 'chipIn 0.3s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
                '@keyframes chipIn': {
                  from: { opacity: 0, transform: 'scale(0.75)' },
                  to:   { opacity: 1, transform: 'scale(1)' },
                },
              }}>
                <Typography variant="caption" fontWeight={800} sx={{ color: rating.color }}>
                  {t}ms
                </Typography>
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
