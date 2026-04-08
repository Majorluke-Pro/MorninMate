import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import BackspaceIcon from '@mui/icons-material/Backspace';
import CheckIcon from '@mui/icons-material/Check';
import { playSuccess, playError, playWarningTick } from '../../lib/sounds';

function generateQuestion(difficulty) {
  const ops   = difficulty === 'hard' ? ['+', '-', '*'] : ['+', '-'];
  const op    = ops[Math.floor(Math.random() * ops.length)];
  const max   = difficulty === 'easy' ? 15 : difficulty === 'hard' ? 50 : 30;
  const maxMul = difficulty === 'hard' ? 12 : 9;

  if (op === '*') {
    const a = Math.floor(Math.random() * maxMul) + 2;
    const b = Math.floor(Math.random() * maxMul) + 2;
    return { question: `${a} × ${b}`, answer: a * b };
  }

  const a = Math.floor(Math.random() * max) + 5;
  const b = Math.floor(Math.random() * max) + 5;

  if (op === '-') {
    const big = Math.max(a, b), small = Math.min(a, b);
    return { question: `${big} − ${small}`, answer: big - small };
  }

  if (difficulty === 'hard' && Math.random() < 0.4) {
    const c = Math.floor(Math.random() * 20) + 2;
    const subOp = Math.random() < 0.5 ? '+' : '-';
    if (subOp === '+') return { question: `${a} + ${b} + ${c}`, answer: a + b + c };
    const sum = a + b;
    if (c <= sum) return { question: `${a} + ${b} − ${c}`, answer: sum - c };
  }

  return { question: `${a} + ${b}`, answer: a + b };
}

const PAD_KEYS = ['7','8','9','4','5','6','1','2','3','⌫','0','✓'];

export default function MathGame({ difficulty = 'normal', onComplete, onFail, onActivity }) {
  const totalQuestions = difficulty === 'easy' ? 3 : difficulty === 'hard' ? 6 : 4;
  const totalTime      = difficulty === 'easy' ? 75 : difficulty === 'hard' ? 60 : 70;
  const maxWrong       = difficulty === 'hard' ? 1 : 2;

  const [questions] = useState(() =>
    Array.from({ length: totalQuestions }, () => generateQuestion(difficulty))
  );
  const [current,  setCurrent]  = useState(0);
  const [input,    setInput]    = useState('');
  const [wrong,    setWrong]    = useState(0);
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const [flash,    setFlash]    = useState(null); // 'success' | 'error'
  const [shake,    setShake]    = useState(false);
  const [animKey,  setAnimKey]  = useState(0);
  const [pressedKey, setPressedKey] = useState(null);

  useEffect(() => {
    if (timeLeft <= 0) { onFail(); return; }
    if (timeLeft <= 10) playWarningTick();
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft]);

  function handleSubmit() {
    const val = parseInt(input.trim(), 10);
    if (isNaN(val)) return;

    const q = questions[current];
    if (val === q.answer) {
      playSuccess();
      setFlash('success');
      setTimeout(() => {
        const next = current + 1;
        if (next >= totalQuestions) {
          onComplete();
        } else {
          setCurrent(next);
          setInput('');
          setFlash(null);
          setAnimKey(k => k + 1);
        }
      }, 350);
    } else {
      playError();
      setShake(true);
      setFlash('error');
      setInput('');
      const newWrong = wrong + 1;
      setWrong(newWrong);
      setTimeLeft(t => Math.max(t - 8, 1));
      setTimeout(() => { setShake(false); setFlash(null); }, 600);
      if (newWrong >= maxWrong) {
        setTimeout(() => onFail(), 500);
      }
    }
  }

  const handlePad = useCallback((key) => {
    if (flash === 'success') return;
    onActivity?.();
    if (key === '⌫') {
      setInput(p => p.slice(0, -1));
    } else if (key === '✓') {
      handleSubmit();
    } else {
      if (input.length >= 5) return;
      setInput(p => p + key);
    }
  }, [flash, input, onActivity, handleSubmit]);

  function triggerKey(key) {
    if (flash === 'success') return;
    setPressedKey(key);
    setTimeout(() => setPressedKey(null), 120);
    handlePad(key);
  }

  const timerPct   = (timeLeft / totalTime) * 100;
  const timerColor = timerPct > 50 ? 'success' : timerPct > 25 ? 'warning' : 'error';
  const q = questions[current];

  return (
    <Box sx={{ textAlign: 'center', touchAction: 'manipulation' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 2 }}>
          Math Blitz
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {Array.from({ length: maxWrong }).map((_, i) => (
            <Box key={i} sx={{
              width: 11, height: 11, borderRadius: '50%',
              bgcolor: i < (maxWrong - wrong) ? '#EF476F' : 'rgba(255,255,255,0.1)',
              transition: 'background-color 0.3s, transform 0.2s',
              transform: i < (maxWrong - wrong) ? 'scale(1)' : 'scale(0.7)',
              boxShadow: i < (maxWrong - wrong) ? '0 0 8px rgba(239,71,111,0.7)' : 'none',
            }} />
          ))}
        </Box>
      </Box>

      {/* Timer bar */}
      <Box sx={{ mb: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            {current + 1} / {totalQuestions}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            {flash === 'error' && (
              <Typography variant="caption" color="error.main" fontWeight={800}
                sx={{ animation: 'fadeSlideIn 0.2s ease', '@keyframes fadeSlideIn': { from: { opacity: 0, transform: 'translateY(-4px)' }, to: { opacity: 1, transform: 'none' } } }}>
                −8s
              </Typography>
            )}
            <Typography variant="caption" fontWeight={800} color={`${timerColor}.main`}
              sx={{ fontVariantNumeric: 'tabular-nums', minWidth: 28 }}>
              {timeLeft}s
            </Typography>
          </Box>
        </Box>
        <LinearProgress
          variant="determinate"
          value={timerPct}
          color={timerColor}
          sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.06)' }}
        />
      </Box>

      {/* Question card */}
      <Box
        key={animKey}
        sx={{
          animation: 'slideDown 0.35s cubic-bezier(0.34,1.56,0.64,1)',
          '@keyframes slideDown': {
            from: { opacity: 0, transform: 'translateY(-18px) scale(0.95)' },
            to:   { opacity: 1, transform: 'none' },
          },
        }}
      >
        <Box sx={{
          p: 3, mb: 2,
          borderRadius: 4,
          bgcolor: flash === 'success'
            ? 'rgba(6,214,160,0.1)'
            : flash === 'error'
            ? 'rgba(239,71,111,0.08)'
            : 'rgba(255,255,255,0.04)',
          border: '1.5px solid',
          borderColor: flash === 'success' ? '#06D6A0' : flash === 'error' ? '#EF476F' : 'rgba(255,255,255,0.07)',
          transition: 'background-color 0.15s, border-color 0.15s',
          animation: shake ? 'shake 0.42s ease' : flash === 'success' ? 'successPop 0.35s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
          '@keyframes shake': {
            '0%,100%': { transform: 'translateX(0)' },
            '15%':     { transform: 'translateX(-12px)' },
            '30%':     { transform: 'translateX(12px)' },
            '45%':     { transform: 'translateX(-8px)' },
            '60%':     { transform: 'translateX(8px)' },
            '75%':     { transform: 'translateX(-4px)' },
            '90%':     { transform: 'translateX(4px)' },
          },
          '@keyframes successPop': {
            '0%':   { transform: 'scale(1)' },
            '40%':  { transform: 'scale(1.04)' },
            '100%': { transform: 'scale(1)' },
          },
        }}>
          {/* Question */}
          <Typography variant="h2" fontWeight={800} sx={{
            fontVariantNumeric: 'tabular-nums', mb: 2.5,
            color: flash === 'success' ? '#06D6A0' : flash === 'error' ? '#EF476F' : 'text.primary',
            transition: 'color 0.15s',
          }}>
            {q.question} = ?
          </Typography>

          {/* Answer display */}
          <Box sx={{
            mx: 'auto',
            width: '72%',
            py: 1.5,
            borderRadius: 3,
            bgcolor: 'rgba(0,0,0,0.2)',
            border: '2px solid',
            borderColor: flash === 'success'
              ? '#06D6A0'
              : flash === 'error'
              ? '#EF476F'
              : input
              ? 'rgba(255,107,53,0.6)'
              : 'rgba(255,255,255,0.08)',
            transition: 'border-color 0.18s',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Glow fill on success */}
            {flash === 'success' && (
              <Box sx={{
                position: 'absolute', inset: 0,
                bgcolor: 'rgba(6,214,160,0.12)',
                animation: 'fillGlow 0.35s ease',
                '@keyframes fillGlow': { from: { opacity: 0 }, to: { opacity: 1 } },
              }} />
            )}
            <Typography variant="h4" fontWeight={800} sx={{
              fontVariantNumeric: 'tabular-nums',
              color: flash === 'success' ? '#06D6A0' : flash === 'error' ? '#EF476F' : input ? 'text.primary' : 'text.disabled',
              letterSpacing: 4,
              position: 'relative',
            }}>
              {flash === 'success' ? '✓' : flash === 'error' ? '✗' : input || '—'}
            </Typography>
          </Box>

          {/* Progress dots */}
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 2.5 }}>
            {questions.map((_, i) => (
              <Box key={i} sx={{
                width: i === current ? 22 : 8,
                height: 8, borderRadius: 4,
                bgcolor: i < current ? '#06D6A0' : i === current ? '#FF6B35' : 'rgba(255,255,255,0.1)',
                boxShadow: i === current ? '0 0 10px rgba(255,107,53,0.7)' : 'none',
                transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
              }} />
            ))}
          </Box>
        </Box>
      </Box>

      {/* Numpad */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 1.25,
        touchAction: 'manipulation',
      }}>
        {PAD_KEYS.map(key => {
          const isSubmit    = key === '✓';
          const isBackspace = key === '⌫';
          const disabled    = (isSubmit && (!input || flash === 'success')) || flash === 'success';
          const isPressed   = pressedKey === key;

          return (
            <Box
              key={key}
              onPointerDown={(e) => { e.preventDefault(); if (!disabled) triggerKey(key); }}
              sx={{
                py: 2.1,
                borderRadius: 3.5,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: disabled ? 'default' : 'pointer',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                touchAction: 'manipulation',
                bgcolor: isSubmit
                  ? disabled ? 'rgba(255,107,53,0.06)' : 'rgba(255,107,53,0.18)'
                  : isBackspace
                  ? 'rgba(255,255,255,0.05)'
                  : 'rgba(255,255,255,0.07)',
                border: '1.5px solid',
                borderColor: isSubmit
                  ? disabled ? 'rgba(255,107,53,0.12)' : 'rgba(255,107,53,0.4)'
                  : 'rgba(255,255,255,0.08)',
                opacity: disabled ? 0.35 : 1,
                transition: 'background-color 0.1s, opacity 0.18s',
                transform: isPressed ? 'scale(0.91)' : 'scale(1)',
                transitionProperty: 'transform, background-color, opacity',
                transitionDuration: isPressed ? '0.06s' : '0.15s',
                boxShadow: isSubmit && !disabled ? '0 4px 24px rgba(255,107,53,0.22)' : 'none',
              }}
            >
              {isBackspace
                ? <BackspaceIcon sx={{ fontSize: 21, color: 'text.secondary' }} />
                : isSubmit
                ? <CheckIcon sx={{ fontSize: 24, color: disabled ? 'rgba(255,107,53,0.3)' : '#FF6B35', fontWeight: 900 }} />
                : <Typography variant="h6" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                    {key}
                  </Typography>
              }
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
