import { useState, useEffect } from 'react';
import { Box, Typography, Card, LinearProgress } from '@mui/material';

const EMOJIS = ['🌟', '🔥', '⚡', '🎯', '🚀', '💎', '🌊', '🎵', '🦋', '🍀'];

function buildGrid(difficulty) {
  const count = difficulty === 'easy' ? 4 : difficulty === 'hard' ? 8 : 6;
  const selected = EMOJIS.slice(0, count);
  const pairs = [...selected, ...selected]
    .sort(() => Math.random() - 0.5)
    .map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }));
  return pairs;
}

export default function MemoryGame({ difficulty = 'normal', onComplete, onFail }) {
  const [cards, setCards] = useState(() => buildGrid(difficulty));
  const [selected, setSelected] = useState([]);
  const [locked, setLocked] = useState(false);
  const [moves, setMoves] = useState(0);
  const maxMoves = difficulty === 'easy' ? 16 : difficulty === 'hard' ? 40 : 28;

  const matched = cards.filter(c => c.matched).length;
  const total = cards.length;

  useEffect(() => {
    if (matched === total) {
      setTimeout(() => onComplete(), 500);
    }
  }, [matched]);

  useEffect(() => {
    if (moves >= maxMoves && matched < total) {
      onFail();
    }
  }, [moves]);

  function handleFlip(card) {
    if (locked || card.flipped || card.matched || selected.length === 2) return;

    const next = [...selected, card];
    setCards(prev => prev.map(c => c.id === card.id ? { ...c, flipped: true } : c));
    setSelected(next);

    if (next.length === 2) {
      setMoves(m => m + 1);
      setLocked(true);
      const [a, b] = next;
      if (a.emoji === b.emoji) {
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === a.id || c.id === b.id ? { ...c, matched: true } : c
          ));
          setSelected([]);
          setLocked(false);
        }, 500);
      } else {
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

  const cols = difficulty === 'easy' ? 2 : difficulty === 'hard' ? 4 : 3;
  const progressPct = (matched / total) * 100;
  const movePct = Math.min((moves / maxMoves) * 100, 100);

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 2 }}>
        Memory Match
      </Typography>

      <Box sx={{ mt: 1, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            {matched / 2} / {total / 2} pairs
          </Typography>
          <Typography variant="caption" color={movePct > 75 ? 'error.main' : 'text.secondary'} fontWeight={700}>
            {moves}/{maxMoves} moves
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progressPct}
          color="success"
          sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.08)' }}
        />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 1.5,
          maxWidth: 360,
          mx: 'auto',
        }}
      >
        {cards.map(card => (
          <Card
            key={card.id}
            onClick={() => handleFlip(card)}
            sx={{
              aspectRatio: '1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: card.matched ? 'default' : 'pointer',
              bgcolor: card.matched
                ? 'rgba(6,214,160,0.15)'
                : card.flipped
                ? 'background.paper'
                : 'rgba(255,255,255,0.05)',
              border: '2px solid',
              borderColor: card.matched
                ? 'success.main'
                : card.flipped
                ? 'rgba(255,107,53,0.4)'
                : 'rgba(255,255,255,0.08)',
              transition: 'all 0.2s',
              fontSize: card.flipped || card.matched ? '2rem' : '1.5rem',
              transform: card.flipped && !card.matched ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            {card.flipped || card.matched ? card.emoji : '?'}
          </Card>
        ))}
      </Box>
    </Box>
  );
}
