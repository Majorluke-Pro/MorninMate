import { useState, useEffect } from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { playCardFlip, playMatch, playError, playWarningTick } from '../../lib/sounds';

const EMOJIS = ['🌟', '🔥', '⚡', '🎯', '🚀', '💎', '🌊', '🎵', '🦋', '🍀'];

function buildGrid(difficulty) {
  const count    = difficulty === 'easy' ? 4 : difficulty === 'hard' ? 8 : 6;
  const selected = EMOJIS.slice(0, count);
  return [...selected, ...selected]
    .sort(() => Math.random() - 0.5)
    .map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }));
}

function FlipCard({ card, onClick, previewing, selected }) {
  const isFlipped  = card.flipped || card.matched || previewing;
  const isSelected = selected;

  return (
    <Box
      onClick={onClick}
      sx={{
        aspectRatio: '1',
        perspective: '700px',
        cursor: card.matched ? 'default' : 'pointer',
      }}
    >
      {/* Flipper */}
      <Box sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        transformStyle: 'preserve-3d',
        transition: 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isFlipped ? 'rotateY(0deg)' : 'rotateY(180deg)',
      }}>

        {/* Front face — emoji */}
        <Box sx={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          borderRadius: 3,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.75rem',
          bgcolor: card.matched
            ? 'rgba(6,214,160,0.15)'
            : 'rgba(255,107,53,0.07)',
          border: '2px solid',
          borderColor: card.matched
            ? '#06D6A0'
            : isSelected
            ? '#FF6B35'
            : 'rgba(255,107,53,0.3)',
          boxShadow: card.matched
            ? '0 0 18px rgba(6,214,160,0.35)'
            : isSelected
            ? '0 0 12px rgba(255,107,53,0.35)'
            : 'none',
          transition: 'box-shadow 0.2s, border-color 0.2s',
          animation: card.matched ? 'matchPop 0.35s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
          '@keyframes matchPop': {
            '0%':   { transform: 'scale(1)' },
            '50%':  { transform: 'scale(1.15)' },
            '100%': { transform: 'scale(1)' },
          },
        }}>
          {card.emoji}
        </Box>

        {/* Back face — hidden */}
        <Box sx={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          borderRadius: 3,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, rgba(255,107,53,0.12) 0%, rgba(255,209,102,0.06) 100%)',
          border: '2px solid rgba(255,255,255,0.08)',
          fontSize: '1.3rem',
          color: 'rgba(255,255,255,0.25)',
          fontWeight: 700,
        }}>
          ?
        </Box>
      </Box>
    </Box>
  );
}

export default function MemoryGame({ difficulty = 'normal', onComplete, onFail }) {
  const totalTime = difficulty === 'easy' ? 90 : difficulty === 'hard' ? 70 : 80;
  const maxMoves  = difficulty === 'easy' ? 14 : difficulty === 'hard' ? 28 : 20;
  const previewMs = difficulty === 'easy' ? 2000 : difficulty === 'hard' ? 1000 : 1500;
  const cols      = difficulty === 'easy' ? 2 : difficulty === 'hard' ? 4 : 3;

  const [cards,      setCards]      = useState(() => buildGrid(difficulty));
  const [selected,   setSelected]   = useState([]);
  const [locked,     setLocked]     = useState(true);
  const [moves,      setMoves]      = useState(0);
  const [timeLeft,   setTimeLeft]   = useState(totalTime);
  const [previewing, setPreviewing] = useState(true);

  const matched = cards.filter(c => c.matched).length;
  const total   = cards.length;
  const pairs   = total / 2;

  // Brief preview — show all cards, then flip back
  useEffect(() => {
    const t = setTimeout(() => {
      setCards(prev => prev.map(c => ({ ...c, flipped: false })));
      setPreviewing(false);
      setLocked(false);
    }, previewMs);
    return () => clearTimeout(t);
  }, []);

  // Countdown
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
      setTimeout(() => onComplete(), 600);
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
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 2 }}>
          Memory Match
        </Typography>
        {previewing && (
          <Box sx={{
            px: 1.5, py: 0.3, borderRadius: 1.5,
            bgcolor: 'rgba(255,209,102,0.12)',
            border: '1px solid rgba(255,209,102,0.25)',
            animation: 'pulse 1s ease-in-out infinite',
            '@keyframes pulse': {
              '0%,100%': { opacity: 1 },
              '50%':     { opacity: 0.6 },
            },
          }}>
            <Typography variant="caption" color="secondary.main" fontWeight={800} sx={{ letterSpacing: 1 }}>
              MEMORISE!
            </Typography>
          </Box>
        )}
      </Box>

      {/* Stats row */}
      <Box sx={{ mt: 0.5, mb: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            {matched / 2} / {pairs} pairs
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Typography variant="caption" fontWeight={700}
              color={movePct > 75 ? 'error.main' : 'text.secondary'}>
              {movesLeft} moves left
            </Typography>
            <Typography variant="caption" fontWeight={800}
              color={`${timerColor}.main`}
              sx={{ fontVariantNumeric: 'tabular-nums', minWidth: 28 }}>
              {timeLeft}s
            </Typography>
          </Box>
        </Box>

        {/* Match progress */}
        <LinearProgress
          variant="determinate"
          value={progressPct}
          color="success"
          sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.06)', mb: 0.75 }}
        />
        {/* Move meter */}
        <LinearProgress
          variant="determinate"
          value={movePct}
          color={movePct > 75 ? 'error' : 'warning'}
          sx={{ height: 3, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.04)' }}
        />
      </Box>

      {/* Card grid */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 1.5,
        maxWidth: 360,
        mx: 'auto',
      }}>
        {cards.map(card => (
          <FlipCard
            key={card.id}
            card={card}
            onClick={() => handleFlip(card)}
            previewing={previewing}
            selected={selected.some(s => s.id === card.id)}
          />
        ))}
      </Box>

      {previewing && (
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 2 }}>
          Cards flip back soon — remember their positions!
        </Typography>
      )}
    </Box>
  );
}
