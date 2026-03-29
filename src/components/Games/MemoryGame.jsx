import { useState, useEffect } from 'react';
import { Box, Typography, Card, LinearProgress } from '@mui/material';
import { playCardFlip, playMatch, playError, playWarningTick } from '../../lib/sounds';

const EMOJIS = ['🌟', '🔥', '⚡', '🎯', '🚀', '💎', '🌊', '🎵', '🦋', '🍀'];

function buildGrid(difficulty) {
  const count    = difficulty === 'easy' ? 4 : difficulty === 'hard' ? 8 : 6;
  const selected = EMOJIS.slice(0, count);
  return [...selected, ...selected]
    .sort(() => Math.random() - 0.5)
    .map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }));
}

export default function MemoryGame({ difficulty = 'normal', onComplete, onFail }) {
  const totalTime = difficulty === 'easy' ? 90 : difficulty === 'hard' ? 70 : 80;
  const maxMoves  = difficulty === 'easy' ? 14 : difficulty === 'hard' ? 28 : 20;
  const previewMs = difficulty === 'easy' ? 2000 : difficulty === 'hard' ? 1000 : 1500;
  const cols      = difficulty === 'easy' ? 2 : difficulty === 'hard' ? 4 : 3;

  const [cards,    setCards]    = useState(() => buildGrid(difficulty));
  const [selected, setSelected] = useState([]);
  const [locked,   setLocked]   = useState(true);   // locked during preview
  const [moves,    setMoves]    = useState(0);
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const [previewing, setPreviewing] = useState(true);

  const matched  = cards.filter(c => c.matched).length;
  const total    = cards.length;
  const pairs    = total / 2;

  // Brief preview: show all cards, then flip them back
  useEffect(() => {
    const t = setTimeout(() => {
      setCards(prev => prev.map(c => ({ ...c, flipped: false })));
      setPreviewing(false);
      setLocked(false);
    }, previewMs);
    return () => clearTimeout(t);
  }, []);

  // Countdown timer (starts after preview)
  useEffect(() => {
    if (previewing) return;
    if (timeLeft <= 0) { onFail(); return; }
    if (timeLeft <= 10) playWarningTick();
    const t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, previewing]);

  // Win check
  useEffect(() => {
    if (matched === total && !previewing) {
      setTimeout(() => onComplete(), 500);
    }
  }, [matched]);

  // Move limit
  useEffect(() => {
    if (moves >= maxMoves && matched < total) onFail();
  }, [moves]);

  function handleFlip(card) {
    if (locked || card.flipped || card.matched || selected.length === 2) return;

    playCardFlip();
    const next = [...selected, card];
    setCards(prev => prev.map(c => c.id === card.id ? { ...c, flipped: true } : c));
    setSelected(next);

    if (next.length === 2) {
      setMoves(m => m + 1);
      setLocked(true);
      const [a, b] = next;
      if (a.emoji === b.emoji) {
        playMatch();
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === a.id || c.id === b.id ? { ...c, matched: true } : c
          ));
          setSelected([]);
          setLocked(false);
        }, 400);
      } else {
        playError();
        // Wrong match — 1s lockout, no penalty but uses a move
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === a.id || c.id === b.id ? { ...c, flipped: false } : c
          ));
          setSelected([]);
          setLocked(false);
        }, 900);
      }
    }
  }

  const progressPct = (matched / total) * 100;
  const movePct     = Math.min((moves / maxMoves) * 100, 100);
  const timePct     = (timeLeft / totalTime) * 100;
  const timerColor  = timePct > 50 ? 'success' : timePct > 25 ? 'warning' : 'error';
  const movesLeft   = maxMoves - moves;

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 2 }}>
          Memory Match
        </Typography>
        {previewing && (
          <Box sx={{
            px: 1.5, py: 0.3, borderRadius: 1.5,
            bgcolor: 'rgba(255,209,102,0.15)',
            border: '1px solid rgba(255,209,102,0.3)',
          }}>
            <Typography variant="caption" color="secondary.main" fontWeight={800}>
              MEMORISE!
            </Typography>
          </Box>
        )}
      </Box>

      {/* Stats row */}
      <Box sx={{ mt: 0.5, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            {matched / 2} / {pairs} pairs
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Typography variant="caption" fontWeight={700} color={movePct > 75 ? 'error.main' : 'text.secondary'}>
              {movesLeft} moves left
            </Typography>
            <Typography variant="caption" fontWeight={700} color={`${timerColor}.main`}>
              {timeLeft}s
            </Typography>
          </Box>
        </Box>

        {/* Match progress */}
        <LinearProgress
          variant="determinate"
          value={progressPct}
          color="success"
          sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.08)', mb: 0.75 }}
        />
        {/* Move meter */}
        <LinearProgress
          variant="determinate"
          value={movePct}
          color={movePct > 75 ? 'error' : 'warning'}
          sx={{ height: 3, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.05)' }}
        />
      </Box>

      {/* Card grid */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 1.25,
        maxWidth: 360,
        mx: 'auto',
      }}>
        {cards.map(card => {
          const isFlipped  = card.flipped || card.matched || previewing;
          const isSelected = selected.some(s => s.id === card.id);

          return (
            <Card
              key={card.id}
              onClick={() => handleFlip(card)}
              sx={{
                aspectRatio: '1',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: card.matched || locked ? 'default' : 'pointer',
                bgcolor: card.matched
                  ? 'rgba(6,214,160,0.15)'
                  : isFlipped
                  ? 'rgba(255,107,53,0.07)'
                  : 'rgba(255,255,255,0.05)',
                border: '2px solid',
                borderColor: card.matched
                  ? '#06D6A0'
                  : isSelected
                  ? '#FF6B35'
                  : isFlipped
                  ? 'rgba(255,107,53,0.25)'
                  : 'rgba(255,255,255,0.08)',
                transition: 'all 0.18s',
                transform: isFlipped && !card.matched ? 'scale(1.04)' : 'scale(1)',
                boxShadow: card.matched ? '0 0 12px rgba(6,214,160,0.25)' : 'none',
                fontSize: isFlipped ? '1.8rem' : '1.2rem',
              }}
            >
              {isFlipped ? card.emoji : '?'}
            </Card>
          );
        })}
      </Box>

      {previewing && (
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 2 }}>
          Cards will flip in a moment — remember their positions!
        </Typography>
      )}
    </Box>
  );
}
