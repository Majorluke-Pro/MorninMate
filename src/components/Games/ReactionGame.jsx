import { useState, useEffect, useRef } from 'react';
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
  const roundPct = (round / totalRounds) * 100;

  return (
    <div style={{ textAlign: 'center', touchAction: 'manipulation' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: '0.75rem', letterSpacing: 2, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
          Reaction Rush
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          {Array.from({ length: maxLives }).map((_, i) =>
            i < lives
              ? <FavoriteIcon key={i} style={{ fontSize: 20, color: '#EF476F', filter: 'drop-shadow(0 0 5px rgba(239,71,111,0.7))' }} />
              : <FavoriteBorderIcon key={i} style={{ fontSize: 20, color: 'rgba(255,255,255,0.15)' }} />
          )}
        </div>
      </div>

      {/* Round progress */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span className="text-xs text-muted">
            Round {Math.min(round + 1, totalRounds)} / {totalRounds}
          </span>
          {avgTime && (
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: getTimeRating(avgTime).color }}>
              avg {avgTime}ms
            </span>
          )}
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${roundPct}%`, background: '#A78BFA' }} />
        </div>
      </div>

      {/* Main tap area */}
      <div
        onTouchStart={(e) => { e.preventDefault(); handleTap(); }}
        onClick={handleTap}
        style={{
          height: 290,
          borderRadius: '50%',
          margin: '0 auto',
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
          gap: 6,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ripple on tap */}
        {ripple && (
          <div style={{
            position: 'absolute',
            width: '100%', height: '100%',
            borderRadius: '50%',
            border: '3px solid rgba(6,214,160,0.7)',
            animation: 'rippleOut 0.6s ease-out forwards',
            pointerEvents: 'none',
          }} />
        )}

        {/* Countdown number or phase label */}
        {phase === 'countdown' ? (
          <span
            key={countKey}
            style={{
              color: countdown > 0 ? '#FFD166' : '#FF6B35',
              lineHeight: 1,
              fontSize: '3.75rem',
              fontWeight: 900,
              animation: 'countPop 0.5s cubic-bezier(0.34,1.56,0.64,1)',
            }}
          >
            {countdown > 0 ? countdown : '⚡'}
          </span>
        ) : (
          <span
            key={phase}
            style={{
              color: cfg.labelColor,
              letterSpacing: phase === 'tapped' ? 0 : 3,
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
              fontSize: '3rem',
              fontWeight: 900,
              animation: 'labelPop 0.28s cubic-bezier(0.34,1.56,0.64,1)',
            }}
          >
            {cfg.label}
          </span>
        )}

        {/* Rating label under time */}
        {phase === 'tapped' && lastRating && (
          <span
            style={{
              color: lastRating.color,
              letterSpacing: 2,
              opacity: 0.9,
              fontSize: '0.75rem',
              fontWeight: 800,
              animation: 'labelPop 0.3s cubic-bezier(0.34,1.56,0.64,1) 0.1s both',
            }}
          >
            {lastRating.label}
          </span>
        )}

        {phase === 'countdown' && countdown > 0 && (
          <p style={{ color: 'rgba(255,255,255,0.35)', marginTop: 4, fontSize: '0.875rem' }}>
            {cfg.sub}
          </p>
        )}

        {(phase === 'red' || phase === 'missed' || phase === 'early') && cfg.sub && (
          <p style={{ color: cfg.labelColor, opacity: 0.55, marginTop: 2, fontSize: '0.875rem' }}>
            {cfg.sub}
          </p>
        )}

        {phase === 'green' && (
          <BoltIcon style={{
            fontSize: 30, color: '#06D6A0', marginTop: 4,
            filter: 'drop-shadow(0 0 10px rgba(6,214,160,0.9))',
          }} />
        )}
      </div>

      {/* Reaction time history */}
      {times.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginTop: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
          {times.map((t, i) => {
            const rating = getTimeRating(t);
            return (
              <div key={i} style={{
                padding: '4px 12px', borderRadius: 40,
                background: `${rating.color}12`,
                border: `1.5px solid ${rating.color}30`,
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: rating.color }}>
                  {t}ms
                </span>
              </div>
            );
          })}
        </div>
      )}

      {round > 0 && phase !== 'green' && (
        <span style={{ display: 'block', marginTop: 12, fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
          window: {window_ms}ms
        </span>
      )}

      <style>{`
        @keyframes rippleOut {
          0%   { transform: scale(0.85); opacity: 0.9; }
          100% { transform: scale(1.3);  opacity: 0; }
        }
        @keyframes countPop {
          from { transform: scale(1.6); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
        @keyframes labelPop {
          from { transform: scale(0.65); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
