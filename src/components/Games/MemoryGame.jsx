import { useState, useEffect, useRef } from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PublicIcon from '@mui/icons-material/Public';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import PsychologyIcon from '@mui/icons-material/Psychology';
import ParkIcon from '@mui/icons-material/Park';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import AlarmIcon from '@mui/icons-material/Alarm';
import { playCardFlip, playMatch, playError, playWarningTick } from '../../lib/sounds';

const ICONS = [
  { key: 'sparkle', Icon: AutoAwesomeIcon },
  { key: 'globe',   Icon: PublicIcon },
  { key: 'camera',  Icon: PhotoCameraIcon },
  { key: 'coffee',  Icon: LocalCafeIcon },
  { key: 'trophy',  Icon: EmojiEventsIcon },
  { key: 'soccer',  Icon: SportsSoccerIcon },
  { key: 'brain',   Icon: PsychologyIcon },
  { key: 'tree',    Icon: ParkIcon },
  { key: 'flight',  Icon: FlightTakeoffIcon },
  { key: 'alarm',   Icon: AlarmIcon },
];

function buildGrid(difficulty) {
  const count    = difficulty === 'easy' ? 4 : difficulty === 'hard' ? 8 : 6;
  const selected = ICONS.slice(0, count);
  return [...selected, ...selected]
    .sort(() => Math.random() - 0.5)
    .map((item, i) => ({
      id: i,
      key: item.key,
      Icon: item.Icon,
      flipped: false,
      matched: false,
      mismatch: false,
    }));
}

function FlipCard({ card, onClick, previewing, selected }) {
  const isFlipped  = card.flipped || card.matched || previewing;
  const FaceIcon = card.Icon;

  return (
    <Box
      onPointerDown={(e) => { e.preventDefault(); onClick(); }}
      sx={{
        aspectRatio: '1',
        perspective: '800px',
        cursor: card.matched ? 'default' : 'pointer',
        touchAction: 'manipulation',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
    >
      <Box sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        transformStyle: 'preserve-3d',
        transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isFlipped ? 'rotateY(0deg)' : 'rotateY(180deg)',
      }}>

        {/* Front face */}
        <Box sx={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          borderRadius: 3,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          bgcolor: card.matched
            ? 'rgba(6,214,160,0.13)'
            : card.mismatch
            ? 'rgba(239,71,111,0.12)'
            : 'rgba(255,107,53,0.06)',
          border: '2px solid',
          borderColor: card.matched
            ? '#06D6A0'
            : card.mismatch
            ? '#EF476F'
            : selected
            ? '#FF6B35'
            : 'rgba(255,107,53,0.25)',
          boxShadow: card.matched
            ? '0 0 22px rgba(6,214,160,0.4)'
            : card.mismatch
            ? '0 0 16px rgba(239,71,111,0.35)'
            : selected
            ? '0 0 14px rgba(255,107,53,0.3)'
            : 'none',
          transition: 'box-shadow 0.2s, border-color 0.2s, background-color 0.2s',
          animation: card.matched
            ? 'matchBurst 0.5s cubic-bezier(0.34,1.56,0.64,1)'
            : card.mismatch
            ? 'mismatchShake 0.35s ease'
            : 'none',
          '@keyframes matchBurst': {
            '0%':   { transform: 'scale(1)' },
            '35%':  { transform: 'scale(1.2)' },
            '65%':  { transform: 'scale(0.96)' },
            '100%': { transform: 'scale(1)' },
          },
          '@keyframes mismatchShake': {
            '0%,100%': { transform: 'translateX(0)' },
            '20%':     { transform: 'translateX(-6px)' },
            '40%':     { transform: 'translateX(6px)' },
            '60%':     { transform: 'translateX(-4px)' },
            '80%':     { transform: 'translateX(4px)' },
          },
        }}>
          <FaceIcon sx={{
            fontSize: '2.5rem',
            color: card.matched ? '#06D6A0' : card.mismatch ? '#EF476F' : '#FF6B35',
            transition: 'color 0.2s',
          }} />
        </Box>

        {/* Back face */}
        <Box sx={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          borderRadius: 3,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(145deg, rgba(255,107,53,0.1) 0%, rgba(255,209,102,0.05) 50%, rgba(255,107,53,0.08) 100%)',
          border: '2px solid rgba(255,255,255,0.07)',
        }}>
          <Typography sx={{ fontSize: '1.4rem', color: 'rgba(255,255,255,0.18)', fontWeight: 800, lineHeight: 1 }}>?</Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default function MemoryGame({ difficulty = 'normal', onComplete, onFail, onActivity }) {
  const totalTime = difficulty === 'easy' ? 90 : difficulty === 'hard' ? 70 : 80;
  const maxMoves  = difficulty === 'easy' ? 14 : difficulty === 'hard' ? 28 : 20;
  const previewMs = difficulty === 'easy' ? 2000 : difficulty === 'hard' ? 1000 : 1500;
  const cols      = difficulty === 'easy' ? 2 : difficulty === 'hard' ? 4 : 3;

  const [cards,        setCards]        = useState(() => buildGrid(difficulty));
  const [selected,     setSelected]     = useState([]);
  const [locked,       setLocked]       = useState(true);
  const [moves,        setMoves]        = useState(0);
  const [timeLeft,     setTimeLeft]     = useState(totalTime);
  const [previewing,   setPreviewing]   = useState(true);
  const [previewLeft,  setPreviewLeft]  = useState(Math.ceil(previewMs / 1000));

  const matched = cards.filter(c => c.matched).length;
  const total   = cards.length;
  const pairs   = total / 2;

  // Preview countdown
  useEffect(() => {
    if (!previewing) return;
    if (previewLeft <= 0) return;
    const t = setTimeout(() => setPreviewLeft(p => p - 1), 1000);
    return () => clearTimeout(t);
  }, [previewing, previewLeft]);

  // Flip back after preview
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

    onActivity?.();
    playCardFlip();
    const next = [...selected, card];
    setCards(prev => prev.map(c => c.id === card.id ? { ...c, flipped: true } : c));
    setSelected(next);

    if (next.length === 2) {
      setMoves(m => m + 1);
      setLocked(true);
      const [a, b] = next;
      if (a.key === b.key) {
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
        // Flash mismatch state first, then flip back
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === a.id || c.id === b.id ? { ...c, mismatch: true } : c
          ));
        }, 200);
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === a.id || c.id === b.id ? { ...c, flipped: false, mismatch: false } : c
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
    <Box sx={{ textAlign: 'center', touchAction: 'manipulation' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 2 }}>
          Memory Match
        </Typography>
        {previewing && (
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1,
            px: 1.5, py: 0.4, borderRadius: 2,
            bgcolor: 'rgba(255,209,102,0.1)',
            border: '1px solid rgba(255,209,102,0.22)',
          }}>
            <Box sx={{
              width: 7, height: 7, borderRadius: '50%',
              bgcolor: '#FFD166',
              animation: 'dot 1s ease-in-out infinite',
              '@keyframes dot': {
                '0%,100%': { opacity: 1, transform: 'scale(1)' },
                '50%':     { opacity: 0.4, transform: 'scale(0.7)' },
              },
            }} />
            <Typography variant="caption" color="secondary.main" fontWeight={800} sx={{ letterSpacing: 1 }}>
              MEMORISE — {previewLeft}s
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

        <LinearProgress
          variant="determinate"
          value={progressPct}
          color="success"
          sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.06)', mb: 0.75 }}
        />
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
        gap: 1.25,
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
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 2, letterSpacing: 0.5 }}>
          Remember their positions — cards flip in {previewLeft}s
        </Typography>
      )}
    </Box>
  );
}
