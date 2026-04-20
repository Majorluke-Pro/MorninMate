import { useState, useEffect } from 'react';
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

  const frontBg = card.matched
    ? 'rgba(6,214,160,0.13)'
    : card.mismatch
    ? 'rgba(239,71,111,0.12)'
    : 'rgba(255,107,53,0.06)';

  const frontBorder = card.matched
    ? '#06D6A0'
    : card.mismatch
    ? '#EF476F'
    : selected
    ? '#FF6B35'
    : 'rgba(255,107,53,0.25)';

  const frontShadow = card.matched
    ? '0 0 22px rgba(6,214,160,0.4)'
    : card.mismatch
    ? '0 0 16px rgba(239,71,111,0.35)'
    : selected
    ? '0 0 14px rgba(255,107,53,0.3)'
    : 'none';

  const iconColor = card.matched ? '#06D6A0' : card.mismatch ? '#EF476F' : '#FF6B35';

  return (
    <div
      onPointerDown={(e) => { e.preventDefault(); onClick(); }}
      style={{
        aspectRatio: '1',
        perspective: '800px',
        cursor: card.matched ? 'default' : 'pointer',
        touchAction: 'manipulation',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
    >
      <div style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        transformStyle: 'preserve-3d',
        transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isFlipped ? 'rotateY(0deg)' : 'rotateY(180deg)',
      }}>

        {/* Front face */}
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: frontBg,
          border: `2px solid ${frontBorder}`,
          boxShadow: frontShadow,
          transition: 'box-shadow 0.2s, border-color 0.2s, background-color 0.2s',
        }}>
          <FaceIcon style={{
            fontSize: '2.5rem',
            color: iconColor,
            transition: 'color 0.2s',
          }} />
        </div>

        {/* Back face */}
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(145deg, rgba(255,107,53,0.1) 0%, rgba(255,209,102,0.05) 50%, rgba(255,107,53,0.08) 100%)',
          border: '2px solid rgba(255,255,255,0.07)',
        }}>
          <span style={{ fontSize: '1.4rem', color: 'rgba(255,255,255,0.18)', fontWeight: 800, lineHeight: 1 }}>?</span>
        </div>
      </div>
    </div>
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
  const timerColor  = timePct > 50 ? '#06D6A0' : timePct > 25 ? '#FFD166' : '#EF476F';
  const movesLeft   = maxMoves - moves;
  const movesColor  = movePct > 75 ? '#EF476F' : 'rgba(255,255,255,0.5)';

  const progressBarColor = '#06D6A0';
  const moveBarColor = movePct > 75 ? '#EF476F' : '#FFD166';

  return (
    <div style={{ textAlign: 'center', touchAction: 'manipulation' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: '0.75rem', letterSpacing: 2, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
          Memory Match
        </span>
        {previewing && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '3px 12px', borderRadius: 8,
            background: 'rgba(255,209,102,0.1)',
            border: '1px solid rgba(255,209,102,0.22)',
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: '#FFD166',
            }} />
            <span style={{ fontSize: '0.75rem', color: '#FFD166', fontWeight: 800, letterSpacing: 1 }}>
              MEMORISE — {previewLeft}s
            </span>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div style={{ marginTop: 4, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span className="text-xs text-muted">
            {matched / 2} / {pairs} pairs
          </span>
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: movesColor }}>
              {movesLeft} moves left
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: timerColor, fontVariantNumeric: 'tabular-nums', minWidth: 28 }}>
              {timeLeft}s
            </span>
          </div>
        </div>

        {/* Progress bar (pairs) */}
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden" style={{ marginBottom: 6 }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${progressPct}%`, background: progressBarColor }} />
        </div>
        {/* Move bar */}
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${movePct}%`, background: moveBarColor }} />
        </div>
      </div>

      {/* Card grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 10,
        maxWidth: 360,
        margin: '0 auto',
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
      </div>

      {previewing && (
        <span style={{ display: 'block', marginTop: 16, fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', letterSpacing: 0.5 }}>
          Remember their positions — cards flip in {previewLeft}s
        </span>
      )}
    </div>
  );
}
