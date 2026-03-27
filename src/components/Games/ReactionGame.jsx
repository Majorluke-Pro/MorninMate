import { useState, useEffect, useRef } from 'react';
import { Box, Typography, Card, LinearProgress } from '@mui/material';

export default function ReactionGame({ difficulty = 'normal', onComplete, onFail }) {
  const rounds = difficulty === 'easy' ? 3 : difficulty === 'hard' ? 6 : 4;
  const windowMs = difficulty === 'easy' ? 1200 : difficulty === 'hard' ? 600 : 900;

  const [phase, setPhase] = useState('waiting'); // waiting | go | hit | miss
  const [round, setRound] = useState(0);
  const [avgTime, setAvgTime] = useState(0);
  const [times, setTimes] = useState([]);
  const [countdown, setCountdown] = useState(3);
  const goRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    } else {
      scheduleGo();
    }
  }, [countdown]);

  function scheduleGo() {
    const delay = 1000 + Math.random() * 2500;
    goRef.current = setTimeout(() => {
      setPhase('go');
      startRef.current = Date.now();

      goRef.current = setTimeout(() => {
        setPhase('miss');
        handleMiss();
      }, windowMs);
    }, delay);
  }

  function handleTap() {
    if (phase === 'waiting' || countdown > 0) {
      // Early tap — penalty
      setPhase('miss');
      clearTimeout(goRef.current);
      setTimeout(() => handleMiss(), 600);
      return;
    }
    if (phase !== 'go') return;

    clearTimeout(goRef.current);
    const elapsed = Date.now() - startRef.current;
    const newTimes = [...times, elapsed];
    setTimes(newTimes);
    setAvgTime(Math.round(newTimes.reduce((a, b) => a + b, 0) / newTimes.length));
    setPhase('hit');

    const nextRound = round + 1;
    if (nextRound >= rounds) {
      setTimeout(() => onComplete(), 600);
    } else {
      setTimeout(() => {
        setRound(nextRound);
        setPhase('waiting');
        scheduleGo();
      }, 700);
    }
  }

  function handleMiss() {
    onFail();
  }

  const bgColor = {
    waiting: '#16162A',
    go: '#06D6A0',
    hit: '#118AB2',
    miss: '#EF476F',
  }[phase] || '#16162A';

  const message = {
    waiting: countdown > 0 ? `Get ready... ${countdown}` : 'Wait for it...',
    go: 'TAP NOW!',
    hit: 'Nice!',
    miss: 'Too slow!',
  }[phase];

  const emoji = {
    waiting: countdown > 0 ? '⏳' : '👀',
    go: '⚡',
    hit: '✅',
    miss: '❌',
  }[phase];

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 2 }}>
        Reaction Rush
      </Typography>

      <Box sx={{ mt: 1, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            Round {round + 1} / {rounds}
          </Typography>
          {avgTime > 0 && (
            <Typography variant="caption" color="secondary.main" fontWeight={700}>
              Avg: {avgTime}ms
            </Typography>
          )}
        </Box>
        <LinearProgress
          variant="determinate"
          value={(round / rounds) * 100}
          color="secondary"
          sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.08)' }}
        />
      </Box>

      <Card
        onClick={handleTap}
        sx={{
          height: 260,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          bgcolor: bgColor,
          border: '2px solid',
          borderColor: phase === 'go' ? '#06D6A0' : 'rgba(255,255,255,0.08)',
          transition: 'background-color 0.1s',
          userSelect: 'none',
          gap: 2,
        }}
      >
        <Typography variant="h1">{emoji}</Typography>
        <Typography variant="h4" fontWeight={800} color={phase === 'go' ? '#0D0D1A' : 'text.primary'}>
          {message}
        </Typography>
        {phase === 'waiting' && countdown === 0 && (
          <Typography variant="caption" color="text.secondary">
            Tap when it turns green
          </Typography>
        )}
      </Card>

      {times.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          {times.map((t, i) => (
            <Box
              key={i}
              sx={{
                px: 1.5,
                py: 0.5,
                borderRadius: 10,
                bgcolor: 'rgba(255,209,102,0.1)',
                border: '1px solid rgba(255,209,102,0.2)',
              }}
            >
              <Typography variant="caption" color="secondary.main" fontWeight={700}>
                {t}ms
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
