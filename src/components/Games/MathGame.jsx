import { useState, useEffect, useCallback } from 'react';
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
  const timerColorHex = timerPct > 50 ? '#06D6A0' : timerPct > 25 ? '#FFB703' : '#EF476F';
  const q = questions[current];

  return (
    <div style={{ textAlign: 'center', touchAction: 'manipulation' }}>
      {/* Keyframe animations */}
      <style>{`
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-18px) scale(0.95); } to { opacity: 1; transform: none; } }
        @keyframes shake { 0%,100% { transform: translateX(0); } 15% { transform: translateX(-12px); } 30% { transform: translateX(12px); } 45% { transform: translateX(-8px); } 60% { transform: translateX(8px); } 75% { transform: translateX(-4px); } 90% { transform: translateX(4px); } }
        @keyframes successPop { 0% { transform: scale(1); } 40% { transform: scale(1.04); } 100% { transform: scale(1); } }
        @keyframes fillGlow { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted" style={{ letterSpacing: 2, textTransform: 'uppercase' }}>
          Math Blitz
        </span>
        <div className="flex gap-2 items-center">
          {Array.from({ length: maxWrong }).map((_, i) => (
            <div key={i} style={{
              width: 11, height: 11, borderRadius: '50%',
              backgroundColor: i < (maxWrong - wrong) ? '#EF476F' : 'rgba(255,255,255,0.1)',
              transition: 'background-color 0.3s, transform 0.2s',
              transform: i < (maxWrong - wrong) ? 'scale(1)' : 'scale(0.7)',
              boxShadow: i < (maxWrong - wrong) ? '0 0 8px rgba(239,71,111,0.7)' : 'none',
            }} />
          ))}
        </div>
      </div>

      {/* Timer bar */}
      <div className="mb-5">
        <div className="flex justify-between mb-1">
          <span className="text-xs text-muted">
            {current + 1} / {totalQuestions}
          </span>
          <div className="flex items-center" style={{ gap: 12 }}>
            {flash === 'error' && (
              <span className="text-xs font-extrabold" style={{ color: '#EF476F', animation: 'fadeSlideIn 0.2s ease' }}>
                −8s
              </span>
            )}
            <span className="text-xs font-extrabold" style={{ color: timerColorHex, fontVariantNumeric: 'tabular-nums', minWidth: 28 }}>
              {timeLeft}s
            </span>
          </div>
        </div>
        {/* LinearProgress replacement */}
        <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${timerPct}%`, backgroundColor: timerColorHex }}
          />
        </div>
      </div>

      {/* Question card */}
      <div key={animKey} style={{ animation: 'slideDown 0.35s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <div style={{
          padding: '24px',
          marginBottom: '16px',
          borderRadius: '16px',
          backgroundColor: flash === 'success'
            ? 'rgba(6,214,160,0.1)'
            : flash === 'error'
            ? 'rgba(239,71,111,0.08)'
            : 'rgba(255,255,255,0.04)',
          border: '1.5px solid',
          borderColor: flash === 'success' ? '#06D6A0' : flash === 'error' ? '#EF476F' : 'rgba(255,255,255,0.07)',
          transition: 'background-color 0.15s, border-color 0.15s',
          animation: shake ? 'shake 0.42s ease' : flash === 'success' ? 'successPop 0.35s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
        }}>
          {/* Question */}
          <div style={{
            fontSize: '3rem',
            fontWeight: 800,
            fontVariantNumeric: 'tabular-nums',
            marginBottom: '20px',
            color: flash === 'success' ? '#06D6A0' : flash === 'error' ? '#EF476F' : 'inherit',
            transition: 'color 0.15s',
          }}>
            {q.question} = ?
          </div>

          {/* Answer display */}
          <div style={{
            margin: '0 auto',
            width: '72%',
            padding: '12px 0',
            borderRadius: '12px',
            backgroundColor: 'rgba(0,0,0,0.2)',
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
              <div style={{
                position: 'absolute', inset: 0,
                backgroundColor: 'rgba(6,214,160,0.12)',
                animation: 'fillGlow 0.35s ease',
              }} />
            )}
            <h4 className="text-2xl font-bold" style={{
              fontVariantNumeric: 'tabular-nums',
              color: flash === 'success' ? '#06D6A0' : flash === 'error' ? '#EF476F' : input ? 'inherit' : 'rgba(255,255,255,0.4)',
              letterSpacing: 4,
              position: 'relative',
            }}>
              {flash === 'success' ? '✓' : flash === 'error' ? '✗' : input || '—'}
            </h4>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center" style={{ gap: 8, marginTop: 20 }}>
            {questions.map((_, i) => (
              <div key={i} style={{
                width: i === current ? 22 : 8,
                height: 8, borderRadius: 4,
                backgroundColor: i < current ? '#06D6A0' : i === current ? '#FF6B35' : 'rgba(255,255,255,0.1)',
                boxShadow: i === current ? '0 0 10px rgba(255,107,53,0.7)' : 'none',
                transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* Numpad */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 10,
        touchAction: 'manipulation',
      }}>
        {PAD_KEYS.map(key => {
          const isSubmit    = key === '✓';
          const isBackspace = key === '⌫';
          const disabled    = (isSubmit && (!input || flash === 'success')) || flash === 'success';
          const isPressed   = pressedKey === key;

          return (
            <div
              key={key}
              onPointerDown={(e) => { e.preventDefault(); if (!disabled) triggerKey(key); }}
              style={{
                padding: '16.8px 0',
                borderRadius: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: disabled ? 'default' : 'pointer',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                touchAction: 'manipulation',
                backgroundColor: isSubmit
                  ? disabled ? 'rgba(255,107,53,0.06)' : 'rgba(255,107,53,0.18)'
                  : isBackspace
                  ? 'rgba(255,255,255,0.05)'
                  : 'rgba(255,255,255,0.07)',
                border: '1.5px solid',
                borderColor: isSubmit
                  ? disabled ? 'rgba(255,107,53,0.12)' : 'rgba(255,107,53,0.4)'
                  : 'rgba(255,255,255,0.08)',
                opacity: disabled ? 0.35 : 1,
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
                : <span style={{ fontSize: '1.25rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                    {key}
                  </span>
              }
            </div>
          );
        })}
      </div>
    </div>
  );
}
