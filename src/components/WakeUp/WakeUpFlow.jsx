import { useState, useEffect, useRef, useCallback } from 'react';
import { startAlarm, stopAlarm } from '../../lib/sounds';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import CalculateIcon from '@mui/icons-material/Calculate';
import StyleIcon from '@mui/icons-material/Style';
import BoltIcon from '@mui/icons-material/Bolt';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AlarmIcon from '@mui/icons-material/Alarm';
import SpaIcon from '@mui/icons-material/Spa';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import CheckIcon from '@mui/icons-material/Check';
import { useApp } from '../../context/AppContext';
import MathGame from '../Games/MathGame';
import MemoryGame from '../Games/MemoryGame';
import ReactionGame from '../Games/ReactionGame';
import { supabase } from '../../lib/supabase';
import {
  isNative,
  setHardcoreVolume,
  enableHardcoreLock,
  disableHardcoreLock,
  startAlarmPlayback,
  stopAlarmPlayback,
} from '../../lib/nativeAlarms';

const GAME_MAP    = { math: MathGame, memory: MemoryGame, reaction: ReactionGame };
const GAME_LABELS = { math: 'Math Blitz', memory: 'Memory Match', reaction: 'Reaction Rush' };
const GAME_ICONS  = { math: CalculateIcon, memory: StyleIcon, reaction: BoltIcon };
const GAME_COLORS = { math: '#FF6B35', memory: '#FFD166', reaction: '#06D6A0' };
const DIFFICULTY_MAP = { gentle: 'easy', moderate: 'normal', intense: 'hard', hardcore: 'hard' };
const XP_REWARD      = { gentle: 20, moderate: 35, intense: 60, hardcore: 100 };
const INACTIVITY_BY_INTENSITY = { gentle: 30, moderate: 30, intense: 30, hardcore: 10 };

export default function WakeUpFlow() {
  const { session, activeAlarm, clearActiveAlarm, applyProgressionUpdate, refreshWakeStats } = useApp();

  const games            = activeAlarm?.pulse?.games || ['math'];
  const intensity        = activeAlarm?.pulse?.intensity || 'moderate';
  const difficulty       = DIFFICULTY_MAP[intensity];
  const xpReward         = XP_REWARD[intensity];
  const isHardcore       = intensity === 'hardcore';
  const INACTIVITY_LIMIT = INACTIVITY_BY_INTENSITY[intensity] ?? 30;

  // Start alarm sound immediately; stop when the flow is dismissed
  useEffect(() => {
    if (!isNative) {
      startAlarm(activeAlarm?.sound ?? 'gentle_chime');
    }
    if (isHardcore) {
      setHardcoreVolume();
      enableHardcoreLock();
    }
    return () => {
      if (isNative) stopAlarmPlayback();
      else stopAlarm();
      if (isHardcore) disableHardcoreLock();
    };
  }, []);

  const [gameIndex,  setGameIndex]  = useState(0);
  const [gameKey,    setGameKey]    = useState(0);   // remount to restart
  const [failCount,  setFailCount]  = useState(0);   // fails on current game
  const [totalFails, setTotalFails] = useState(0);   // across all games
  const [results,    setResults]    = useState([]);
  const [phase,      setPhase]      = useState('intro');
  const [ending,     setEnding]     = useState(false);
  const sessionIdRef = useRef(null);

  // Inactivity tracking
  const lastActivityRef      = useRef(Date.now());
  const [inactivityLeft, setInactivityLeft] = useState(INACTIVITY_LIMIT);

  const resetInactivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Inactivity countdown — only runs during 'playing' phase
  useEffect(() => {
    if (phase !== 'playing') return;
    lastActivityRef.current = Date.now(); // reset when game starts

    const interval = setInterval(() => {
      const elapsed    = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      const remaining  = Math.max(0, INACTIVITY_LIMIT - elapsed);
      setInactivityLeft(remaining);

      if (remaining === 0) {
        // User ignored the game — restart everything
        if (isNative) {
          startAlarmPlayback(activeAlarm?.sound ?? 'gentle_chime', activeAlarm?.id, activeAlarm?.label || 'Alarm');
        } else {
          startAlarm(activeAlarm?.sound ?? 'gentle_chime');
        }
        sessionIdRef.current = null;
        setGameIndex(0);
        setGameKey(k => k + 1);
        setFailCount(0);
        setTotalFails(0);
        setResults([]);
        setPhase('intro');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [phase]);

  const currentGame  = games[gameIndex];
  const GameComponent = GAME_MAP[currentGame];
  const progress = (gameIndex / games.length) * 100;

  async function handleGameComplete() {
    const newResults = [...results, { game: currentGame, success: true, retries: failCount }];
    setResults(newResults);
    setFailCount(0);
    if (gameIndex + 1 >= games.length) {
      try {
        await finalizeWakeSession('success', newResults);
      } catch {
        // DB error — alarm must still be dismissable
      }
      if (isNative) await stopAlarmPlayback();
      else stopAlarm();
      setPhase('complete');
    } else {
      setGameIndex(i => i + 1);
      setGameKey(k => k + 1);
    }
  }

  async function handleGameFail() {
    const newTotal = totalFails + 1;
    setTotalFails(newTotal);
    setFailCount(f => f + 1);
    if (sessionIdRef.current) {
      const { data, error } = await supabase.rpc('record_wake_game_fail', {
        p_session_id: sessionIdRef.current,
      });
      if (!error && data) applyProgressionUpdate(data);
    }

    // Restart the current game — you cannot dismiss the alarm by failing
    setGameKey(k => k + 1);
  }

  async function startWakeSession() {
    const userId = session?.user?.id;
    if (!userId || sessionIdRef.current) return;
    const payload = {
      user_id: userId,
      alarm_id: activeAlarm?.id ?? null,
      started_at: new Date().toISOString(),
      status: 'in_progress',
      intensity,
      games,
      total_fails: 0,
    };
    const { data, error } = await supabase.from('wake_sessions').insert(payload).select('id').single();
    if (!error && data?.id) sessionIdRef.current = data.id;
  }

  async function finalizeWakeSession(status, finalResults = results) {
    const userId = session?.user?.id;
    if (!userId) return;
    const id = sessionIdRef.current;
    if (!id) return;

    setEnding(true);
    try {
      const { data, error } = await supabase.rpc('complete_wake_session', {
        p_session_id: id,
        p_status: status,
        p_results: finalResults,
      });
      if (error) throw error;
      if (data) applyProgressionUpdate(data);
    } finally {
      setEnding(false);
      refreshWakeStats?.(userId);
    }
  }

  async function handleEndEarly() {
    if (ending) return;
    if (isNative) await stopAlarmPlayback();
    else stopAlarm();
    await finalizeWakeSession('failed');
    clearActiveAlarm();
  }

  if (phase === 'intro') {
    return (
      <IntroScreen
        alarm={activeAlarm}
        games={games}
        intensity={intensity}
        xpReward={xpReward}
        isHardcore={isHardcore}
        onStart={async () => {
          await startWakeSession();
          if (isNative) await stopAlarmPlayback();
          else stopAlarm();
          setPhase('playing');
        }}
      />
    );
  }

  if (phase === 'complete') {
    return (
      <ResultScreen
        results={results}
        xpReward={xpReward}
        totalFails={totalFails}
        isHardcore={isHardcore}
        onDone={clearActiveAlarm}
      />
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg, #0D0D1A)', padding: '40px 24px 24px', display: 'flex', flexDirection: 'column' }}>
      {/* Progress header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', gap: '12px', alignItems: 'center' }}>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Game {gameIndex + 1} of {games.length}
          </span>
          {!isHardcore && (
            <button
              disabled={ending}
              onClick={handleEndEarly}
              style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 800, padding: '2px 8px', minWidth: 0, background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
            >
              End
            </button>
          )}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {failCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <WarningAmberIcon style={{ fontSize: '0.9rem', color: '#EF476F' }} />
                <span className="text-xs" style={{ color: '#EF476F', fontWeight: 700 }}>
                  {failCount} restart{failCount > 1 ? 's' : ''}
                </span>
              </div>
            )}
            <span className="text-xs" style={{ color: 'var(--color-primary, #FF6B35)', fontWeight: 600 }}>
              +{xpReward} XP on finish
            </span>
          </div>
        </div>
        <div style={{ height: '8px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg, #FF6B35, #FFD166)', borderRadius: '4px', width: `${progress}%`, transition: 'width 0.3s' }} />
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'center' }}>
          {games.map((g, i) => (
            <div key={i} style={{
              flex: 1, height: '4px', borderRadius: '2px',
              backgroundColor: i < gameIndex ? '#06D6A0' : i === gameIndex ? '#FF6B35' : 'rgba(255,255,255,0.1)',
              transition: 'background-color 0.3s',
            }} />
          ))}
        </div>
      </div>

      {/* Inactivity warning */}
      {inactivityLeft <= 10 && (
        <div style={{
          marginBottom: '16px',
          padding: '10px 16px',
          borderRadius: '10px',
          backgroundColor: inactivityLeft <= 5 ? 'rgba(239,71,111,0.15)' : 'rgba(255,140,0,0.12)',
          border: `1.5px solid ${inactivityLeft <= 5 ? '#EF476F' : '#FF8C00'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          animation: 'warningPulse 0.8s ease-in-out infinite',
        }}>
          <style>{`@keyframes warningPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.7; } }`}</style>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <WarningAmberIcon style={{ fontSize: '1rem', color: inactivityLeft <= 5 ? '#EF476F' : '#FF8C00' }} />
            <p className="text-sm" style={{ fontWeight: 700, color: inactivityLeft <= 5 ? '#EF476F' : '#FF8C00', margin: 0 }}>
              Still there? Alarm restarts in…
            </p>
          </div>
          <h6 className="text-lg font-semibold" style={{ fontWeight: 900, color: inactivityLeft <= 5 ? '#EF476F' : '#FF8C00', fontVariantNumeric: 'tabular-nums', minWidth: '32px', textAlign: 'right', margin: 0 }}>
            {inactivityLeft}s
          </h6>
        </div>
      )}

      <div style={{ opacity: 1, transition: 'opacity 0.3s', flex: 1 }} key={`${gameIndex}-${gameKey}`}>
        {GameComponent && (
          <GameComponent
            key={`${gameIndex}-${gameKey}`}
            difficulty={difficulty}
            onComplete={handleGameComplete}
            onFail={handleGameFail}
            onActivity={resetInactivity}
          />
        )}
      </div>
    </div>
  );
}

function IntroScreen({ alarm, games, intensity, xpReward, isHardcore, onStart }) {
  const INTENSITY_ICON  = { gentle: SpaIcon, moderate: WhatshotIcon, intense: FlashOnIcon, hardcore: LocalFireDepartmentIcon };
  const INTENSITY_COLOR = { gentle: '#06D6A0', moderate: '#FFD166', intense: '#EF476F', hardcore: '#EF1C1C' };
  const IntensityIcon   = INTENSITY_ICON[intensity];
  const intensityColor  = INTENSITY_COLOR[intensity];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(170deg, #160830 0%, #0D0D1A 55%, #080818 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px', textAlign: 'center', position: 'relative', overflow: 'hidden',
    }}>
      <style>{`
        @keyframes introRing { 0%,100% { transform: scale(1); } 50% { transform: scale(1.06); } }
        @keyframes introPulse { 0% { transform: scale(0.85); opacity: 0.8; } 100% { transform: scale(1.4); opacity: 0; } }
        @keyframes gameIn { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: none; } }
      `}</style>

      {/* Ambient glow */}
      <div style={{
        position: 'absolute', width: '400px', height: '400px', borderRadius: '50%',
        background: `radial-gradient(circle, ${intensityColor}18 0%, transparent 65%)`,
        top: '-100px', left: '50%', transform: 'translateX(-50%)',
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      {/* Alarm icon */}
      <div style={{ position: 'relative', marginBottom: '20px', animation: 'introRing 2.5s ease-in-out infinite' }}>
        <div style={{
          position: 'absolute', inset: '-12px', borderRadius: '50%',
          border: `2px solid ${intensityColor}30`,
          animation: 'introPulse 2.5s ease-out infinite',
        }} />
        <div style={{
          width: '88px', height: '88px', borderRadius: '50%',
          backgroundColor: `${intensityColor}14`,
          border: `2px solid ${intensityColor}35`,
          boxShadow: `0 0 40px ${intensityColor}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <AlarmIcon style={{ fontSize: 44, color: intensityColor, filter: `drop-shadow(0 0 12px ${intensityColor}80)` }} />
        </div>
      </div>

      <h4 className="text-2xl font-bold" style={{ letterSpacing: '-0.5px', marginBottom: '4px', fontWeight: 900 }}>
        Rise & Shine, Legend!
      </h4>
      <p className="text-base" style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
        {alarm?.label || 'Alarm'}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
        <IntensityIcon style={{ fontSize: '1.15rem', color: intensityColor }} />
        <h6 className="text-lg font-semibold" style={{ fontWeight: 700, color: intensityColor, margin: 0 }}>
          {intensity.charAt(0).toUpperCase() + intensity.slice(1)} Pulse
        </h6>
      </div>
      {isHardcore && (
        <div style={{
          marginBottom: '16px', padding: '10px 20px', borderRadius: '10px',
          backgroundColor: 'rgba(239,28,28,0.12)', border: '1.5px solid rgba(239,28,28,0.4)',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <p className="text-sm" style={{ fontWeight: 800, color: '#EF1C1C', margin: 0 }}>
            Hardcore Mode — Full volume. No escape. Finish or suffer.
          </p>
        </div>
      )}
      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)', marginBottom: '32px', display: 'block' }}>
        No dodging it, mate — finish all games to dismiss.
      </span>

      {/* Games card */}
      <div style={{
        width: '100%', maxWidth: '340px', marginBottom: '32px',
        borderRadius: '16px',
        backgroundColor: 'rgba(20,20,38,0.9)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(16px)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '16px 20px 8px' }}>
          <span className="text-xs" style={{ fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)' }}>
            COMPLETE THESE TO DISMISS
          </span>
        </div>

        {games.map((g, i) => {
          const GameIcon = GAME_ICONS[g];
          const color    = GAME_COLORS[g];
          return (
            <div
              key={g}
              style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                padding: '12px 20px',
                borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                animation: `gameIn 0.5s ease ${i * 0.1}s both`,
              }}
            >
              <div style={{
                width: '42px', height: '42px', borderRadius: '10px', flexShrink: 0,
                backgroundColor: `${color}15`, border: `1px solid ${color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 12px ${color}20`,
              }}>
                <GameIcon style={{ fontSize: '1.3rem', color }} />
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <p className="text-sm" style={{ fontWeight: 700, margin: 0 }}>{GAME_LABELS[g]}</p>
              </div>
              <div style={{
                width: '24px', height: '24px', borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)',
                fontFamily: '"Fraunces", serif',
              }}>
                {i + 1}
              </div>
            </div>
          );
        })}

        <div style={{
          margin: '12px 20px', padding: '10px 16px',
          borderRadius: '10px',
          backgroundColor: 'rgba(255,209,102,0.06)',
          border: '1px solid rgba(255,209,102,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}>
          <EmojiEventsIcon style={{ color: '#FFD166', fontSize: 16 }} />
          <p className="text-sm" style={{ color: '#FFD166', fontWeight: 700, margin: 0 }}>
            +{xpReward} XP on success
          </p>
        </div>
      </div>

      <button
        className="btn-primary"
        onClick={onStart}
        style={{ padding: '14px 56px', fontSize: '1rem', borderRadius: '12px' }}
      >
        {isHardcore ? 'Begin (No Going Back)' : 'Start Wake-Up Routine'}
      </button>
    </div>
  );
}

function ResultScreen({ results, xpReward, totalFails, isHardcore, onDone }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(170deg, #061C10 0%, #0D0D1A 60%, #080818 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px', textAlign: 'center', position: 'relative', overflow: 'hidden',
    }}>
      <style>{`
        @keyframes checkBounce { from { transform: scale(0.3); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes resultPulse { 0% { transform: scale(0.85); opacity: 0.6; } 100% { transform: scale(1.5); opacity: 0; } }
        @keyframes xpIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        @keyframes resultsIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
      `}</style>

      {/* Celebration glow */}
      <div style={{
        position: 'absolute', width: '450px', height: '450px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6,214,160,0.14) 0%, transparent 65%)',
        top: '-100px', left: '50%', transform: 'translateX(-50%)',
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      {/* Check icon */}
      <div style={{ position: 'relative', marginBottom: '20px', animation: 'checkBounce 0.6s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <div style={{
          position: 'absolute', inset: '-12px', borderRadius: '50%',
          border: '2px solid rgba(6,214,160,0.25)',
          animation: 'resultPulse 2s ease-out 0.4s infinite',
        }} />
        <div style={{
          width: '88px', height: '88px', borderRadius: '50%',
          backgroundColor: 'rgba(6,214,160,0.12)',
          border: '2px solid rgba(6,214,160,0.35)',
          boxShadow: '0 0 40px rgba(6,214,160,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <CheckCircleIcon style={{
            fontSize: 48, color: '#06D6A0',
            filter: 'drop-shadow(0 0 12px rgba(6,214,160,0.7))',
          }} />
        </div>
      </div>

      <h4 className="text-2xl font-bold" style={{ letterSpacing: '-0.5px', marginBottom: '4px', fontWeight: 900 }}>
        {isHardcore ? 'You survived.' : "Bonzer, you're up!"}
      </h4>
      <p className="text-base" style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '24px' }}>
        {isHardcore ? 'That was brutal. Respect.' : 'Ripper morning routine, mate'}
      </p>

      {/* XP card */}
      <div style={{
        padding: '16px 32px', marginBottom: '24px', borderRadius: '12px',
        backgroundColor: 'rgba(6,214,160,0.08)',
        border: '1px solid rgba(6,214,160,0.22)',
        backdropFilter: 'blur(12px)',
        animation: 'xpIn 0.5s ease 0.3s both',
      }}>
        <h5 className="text-xl font-bold" style={{ color: '#06D6A0', fontWeight: 900, fontFamily: '"Fraunces", serif', letterSpacing: '-0.5px', margin: 0 }}>
          +{xpReward} XP earned!
        </h5>
        {totalFails > 0 && (
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)', display: 'block', marginTop: '4px' }}>
            {totalFails} restart{totalFails > 1 ? 's' : ''} — no worries, keep at it!
          </span>
        )}
      </div>

      {/* Results card */}
      <div style={{
        width: '100%', maxWidth: '340px', marginBottom: '32px',
        borderRadius: '16px',
        backgroundColor: 'rgba(20,20,38,0.9)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(16px)',
        overflow: 'hidden',
        animation: 'resultsIn 0.5s ease 0.5s both',
      }}>
        {results.map((r, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 20px',
            borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
          }}>
            <p className="text-sm" style={{ fontWeight: 500, margin: 0 }}>{GAME_LABELS[r.game]}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckIcon style={{ fontSize: '0.85rem', color: r.retries === 0 ? '#06D6A0' : '#FFD166' }} />
              <p className="text-sm" style={{ fontWeight: 700, color: r.retries === 0 ? '#06D6A0' : '#FFD166', margin: 0 }}>
                {r.retries === 0 ? 'First crack!' : `${r.retries} restart${r.retries > 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
        ))}
      </div>

      <button
        className="btn-primary"
        onClick={onDone}
        style={{ padding: '14px 48px', borderRadius: '12px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        <WbSunnyIcon style={{ fontSize: '1.25rem' }} /> Go to Home
      </button>
    </div>
  );
}
