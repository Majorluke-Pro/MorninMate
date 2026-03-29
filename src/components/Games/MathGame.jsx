import { useState, useEffect, useRef } from 'react';
import { Box, Typography, Button, LinearProgress, TextField, Card } from '@mui/material';
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

  // Hard: occasionally 3-operand
  if (difficulty === 'hard' && Math.random() < 0.4) {
    const c = Math.floor(Math.random() * 20) + 2;
    const subOp = Math.random() < 0.5 ? '+' : '-';
    if (subOp === '+') return { question: `${a} + ${b} + ${c}`, answer: a + b + c };
    const sum = a + b;
    if (c <= sum) return { question: `${a} + ${b} − ${c}`, answer: sum - c };
  }

  return { question: `${a} + ${b}`, answer: a + b };
}

export default function MathGame({ difficulty = 'normal', onComplete, onFail }) {
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
  const inputRef = useRef(null);

  // Single countdown timer for all questions
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
          inputRef.current?.focus();
        }
      }, 350);
    } else {
      playError();
      setShake(true);
      setFlash('error');
      setInput('');
      const newWrong = wrong + 1;
      setWrong(newWrong);
      // Wrong answer penalty: lose 8 seconds
      setTimeLeft(t => Math.max(t - 8, 1));
      setTimeout(() => { setShake(false); setFlash(null); }, 600);
      if (newWrong >= maxWrong) {
        setTimeout(() => onFail(), 500);
      }
    }
  }

  const timerPct   = (timeLeft / totalTime) * 100;
  const timerColor = timerPct > 50 ? 'success' : timerPct > 25 ? 'warning' : 'error';
  const q = questions[current];

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 2 }}>
        Math Blitz
      </Typography>

      {/* Timer bar — spans the whole game */}
      <Box sx={{ mt: 1, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            {current + 1} / {totalQuestions}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            {wrong > 0 && (
              <Typography variant="caption" color="error.main" fontWeight={700}>
                {'💔'.repeat(wrong)} {maxWrong - wrong} left
              </Typography>
            )}
            <Typography variant="caption" fontWeight={700} color={`${timerColor}.main`}>
              {timeLeft}s
            </Typography>
          </Box>
        </Box>
        <LinearProgress
          variant="determinate"
          value={timerPct}
          color={timerColor}
          sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.08)' }}
        />
        {flash === 'error' && (
          <Typography variant="caption" color="error.main" sx={{ display: 'block', mt: 0.5 }} fontWeight={700}>
            Wrong! −8 seconds
          </Typography>
        )}
      </Box>

      {/* Question card */}
      <Card sx={{
        p: 4, mb: 3,
        bgcolor: flash === 'success'
          ? 'rgba(6,214,160,0.12)'
          : flash === 'error'
          ? 'rgba(239,71,111,0.12)'
          : 'background.paper',
        border: '1px solid',
        borderColor: flash === 'success' ? '#06D6A0' : flash === 'error' ? '#EF476F' : 'rgba(255,255,255,0.08)',
        transition: 'all 0.18s',
        animation: shake ? 'shake 0.4s ease' : 'none',
        '@keyframes shake': {
          '0%,100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-10px)' },
          '40%': { transform: 'translateX(10px)' },
          '60%': { transform: 'translateX(-7px)' },
          '80%': { transform: 'translateX(7px)' },
        },
      }}>
        <Typography variant="h2" fontWeight={800} sx={{ fontVariantNumeric: 'tabular-nums' }}>
          {q.question} = ?
        </Typography>

        {/* Mini question dots */}
        <Box sx={{ display: 'flex', gap: 0.75, justifyContent: 'center', mt: 2 }}>
          {questions.map((_, i) => (
            <Box key={i} sx={{
              width: 8, height: 8, borderRadius: '50%',
              bgcolor: i < current ? '#06D6A0' : i === current ? '#FF6B35' : 'rgba(255,255,255,0.12)',
              transition: 'background-color 0.2s',
            }} />
          ))}
        </Box>
      </Card>

      {/* Input */}
      <TextField
        inputRef={inputRef}
        fullWidth
        type="number"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        placeholder="Your answer"
        autoFocus
        sx={{
          mb: 2,
          '& input': { fontSize: '1.6rem', fontWeight: 700, textAlign: 'center' },
          '& input::-webkit-inner-spin-button, & input::-webkit-outer-spin-button': { display: 'none' },
        }}
      />

      <Button
        variant="contained"
        fullWidth
        size="large"
        onClick={handleSubmit}
        disabled={!input.trim() || flash === 'success'}
        sx={{ py: 1.5, fontWeight: 800 }}
      >
        Submit
      </Button>
    </Box>
  );
}
