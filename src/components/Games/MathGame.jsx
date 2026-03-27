import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, LinearProgress, TextField, Card } from '@mui/material';

function generateQuestion(difficulty) {
  const ops = difficulty === 'hard' ? ['+', '-', '*'] : ['+', '-'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  const max = difficulty === 'easy' ? 10 : difficulty === 'hard' ? 20 : 15;
  const a = Math.floor(Math.random() * max) + 1;
  const b = Math.floor(Math.random() * max) + 1;

  let answer;
  let question;
  if (op === '+') { answer = a + b; question = `${a} + ${b}`; }
  else if (op === '-') { answer = Math.abs(a - b); question = `${Math.max(a,b)} - ${Math.min(a,b)}`; }
  else { const x = Math.floor(Math.random()*5)+1; const y = Math.floor(Math.random()*5)+1; answer = x*y; question = `${x} × ${y}`; }

  return { question, answer };
}

export default function MathGame({ difficulty = 'normal', onComplete, onFail }) {
  const totalQuestions = difficulty === 'easy' ? 3 : difficulty === 'hard' ? 5 : 4;
  const timeLimit = difficulty === 'easy' ? 20 : difficulty === 'hard' ? 10 : 15;

  const [current, setCurrent] = useState(() => generateQuestion(difficulty));
  const [input, setInput] = useState('');
  const [answered, setAnswered] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState(null);

  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(t); onFail(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [current]);

  function handleSubmit() {
    if (!input.trim()) return;
    const val = parseInt(input, 10);
    if (val === current.answer) {
      setFlash('success');
      const next = answered + 1;
      if (next >= totalQuestions) {
        setTimeout(() => onComplete(), 400);
      } else {
        setTimeout(() => {
          setAnswered(next);
          setCurrent(generateQuestion(difficulty));
          setInput('');
          setTimeLeft(timeLimit);
          setFlash(null);
        }, 400);
      }
    } else {
      setShake(true);
      setFlash('error');
      setWrong(w => w + 1);
      setInput('');
      setTimeout(() => { setShake(false); setFlash(null); }, 600);
      if (wrong + 1 >= 3) { setTimeout(() => onFail(), 400); }
    }
  }

  const timerPct = (timeLeft / timeLimit) * 100;
  const timerColor = timerPct > 50 ? 'success' : timerPct > 25 ? 'warning' : 'error';

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 2 }}>
        Math Blitz
      </Typography>

      {/* Timer */}
      <Box sx={{ mt: 1, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            {answered + 1} / {totalQuestions}
          </Typography>
          <Typography variant="caption" color={`${timerColor}.main`} fontWeight={700}>
            {timeLeft}s
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={timerPct}
          color={timerColor}
          sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.08)' }}
        />
      </Box>

      {/* Question */}
      <Card
        sx={{
          p: 4,
          mb: 3,
          bgcolor: flash === 'success' ? 'rgba(6,214,160,0.15)' : flash === 'error' ? 'rgba(239,71,111,0.15)' : 'background.paper',
          border: '1px solid',
          borderColor: flash === 'success' ? 'success.main' : flash === 'error' ? 'error.main' : 'rgba(255,255,255,0.08)',
          transition: 'all 0.2s',
          animation: shake ? 'shake 0.4s ease' : 'none',
          '@keyframes shake': {
            '0%,100%': { transform: 'translateX(0)' },
            '25%': { transform: 'translateX(-8px)' },
            '75%': { transform: 'translateX(8px)' },
          },
        }}
      >
        <Typography variant="h2" fontWeight={800}>
          {current.question} = ?
        </Typography>
      </Card>

      {/* Input */}
      <TextField
        fullWidth
        type="number"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        placeholder="Your answer"
        autoFocus
        sx={{
          mb: 2,
          '& input': { fontSize: '1.5rem', fontWeight: 700, textAlign: 'center' },
        }}
      />

      <Button variant="contained" fullWidth size="large" onClick={handleSubmit} sx={{ py: 1.5 }}>
        Submit
      </Button>

      {wrong > 0 && (
        <Typography variant="caption" color="error.main" sx={{ mt: 1, display: 'block' }}>
          {3 - wrong} mistake{3 - wrong !== 1 ? 's' : ''} left
        </Typography>
      )}
    </Box>
  );
}
