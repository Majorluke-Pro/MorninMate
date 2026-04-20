import { useEffect, useRef, useState } from 'react';

const SIZE    = 256;
const CENTER  = SIZE / 2;
const RADIUS  = 92;
const HOURS   = [12,1,2,3,4,5,6,7,8,9,10,11];
const MINUTES = [0,5,10,15,20,25,30,35,40,45,50,55];
const STEP_DEG = 30;

function itemPos(index) {
  const angle = (index * 30 - 90) * (Math.PI / 180);
  return { x: CENTER + RADIUS * Math.cos(angle), y: CENTER + RADIUS * Math.sin(angle) };
}

function normAngle(angle) { return (angle + 90 + 360) % 360; }
function angleToTickFloat(angle) { return normAngle(angle) / STEP_DEG; }
function angleToHandPos(angleDeg) {
  const rad = angleDeg * (Math.PI / 180);
  return { x: CENTER + RADIUS * Math.cos(rad), y: CENTER + RADIUS * Math.sin(rad) };
}
function getAngleFromCenter(clientX, clientY, rect) {
  const x = clientX - rect.left - CENTER;
  const y = clientY - rect.top  - CENTER;
  return Math.atan2(y, x) * (180 / Math.PI);
}

export default function TimePicker({ value, onChange }) {
  const hasValue = Boolean(value);
  const [h24, m] = hasValue ? value.split(':').map(Number) : [null, null];
  const isPM   = h24 != null ? h24 >= 12 : false;
  const hour12 = h24 != null ? (h24 % 12 || 12) : null;
  const minuteTick = Number.isInteger(m) ? Math.round(m / 5) * 5 : null;
  const minuteDisplayTick = minuteTick === 60 ? 0 : minuteTick;

  const [mode, setMode] = useState('hour');
  const [editingPart, setEditingPart] = useState(null);
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);
  const [dragAngle, setDragAngle] = useState(null);
  const dragAngleRef = useRef(null);
  const draggingRef = useRef(false);
  const rafRef = useRef(0);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  useEffect(() => {
    if (editingPart && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingPart]);

  const selIdx = !hasValue ? 0
    : mode === 'hour' ? HOURS.indexOf(hour12)
    : MINUTES.indexOf(minuteDisplayTick) >= 0 ? MINUTES.indexOf(minuteDisplayTick) : 0;
  const snappedHandPos = itemPos(selIdx);
  const handPos = dragAngle == null ? snappedHandPos : angleToHandPos(dragAngle);
  const liveIdx = dragAngle == null ? selIdx : (Math.round(angleToTickFloat(dragAngle)) + 12) % 12;

  function commitTick(tickIdx) {
    if (mode === 'hour') {
      const h = HOURS[tickIdx];
      const h24new = isPM ? (h % 12) + 12 : h % 12;
      onChange(`${String(h24new).padStart(2,'0')}:${String(Number.isInteger(m) ? m : 0).padStart(2,'0')}`);
    } else {
      const min = MINUTES[tickIdx];
      onChange(`${String(Number.isInteger(h24) ? h24 : 0).padStart(2,'00')}:${String(min).padStart(2,'0')}`);
    }
  }

  function handlePointerDown(e) {
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    draggingRef.current = true;
    dragAngleRef.current = getAngleFromCenter(e.clientX, e.clientY, rect);
    setDragAngle(dragAngleRef.current);
  }

  function handlePointerMove(e) {
    if (!draggingRef.current) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    dragAngleRef.current = getAngleFromCenter(e.clientX, e.clientY, rect);
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      setDragAngle(dragAngleRef.current);
    });
  }

  function endDrag() {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const finalAngle = dragAngleRef.current ?? dragAngle;
    setDragAngle(null);
    const tick = (Math.round(angleToTickFloat(finalAngle)) + 12) % 12;
    commitTick(tick);
    if (mode === 'hour') setMode('minute');
  }

  function togglePeriod() {
    if (h24 == null || m == null) return;
    const nh = isPM ? h24 - 12 : h24 + 12;
    onChange(`${String(nh).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
  }

  function openEdit(part) {
    setMode(part);
    setEditingPart(part);
    setDraft(part === 'hour'
      ? (hour12 == null ? '' : String(hour12).padStart(2, '0'))
      : (m == null ? '' : String(m).padStart(2, '0'))
    );
  }

  function commitEdit() {
    const n = Number(draft.trim());
    if (editingPart === 'hour') {
      if (Number.isInteger(n) && n >= 1 && n <= 12) {
        const h24new = isPM ? (n % 12) + 12 : n % 12;
        onChange(`${String(h24new).padStart(2,'0')}:${String(Number.isInteger(m) ? m : 0).padStart(2,'0')}`);
      }
    } else {
      if (Number.isInteger(n) && n >= 0 && n <= 59) {
        onChange(`${String(Number.isInteger(h24) ? h24 : 0).padStart(2,'0')}:${String(n).padStart(2,'0')}`);
      }
    }
    setEditingPart(null);
  }

  const boxStyle = (active) => ({
    minWidth: 78, padding: '4px 8px',
    background: active ? 'rgba(255,107,53,0.15)' : 'transparent',
    border: active ? '2px solid rgba(255,107,53,0.35)' : '2px solid transparent',
    borderRadius: 12,
    fontWeight: 900, fontSize: '3rem', fontVariantNumeric: 'tabular-nums',
    textAlign: 'center', lineHeight: 1.1,
    transition: 'background 0.15s, border-color 0.15s',
  });

  return (
    <div className="py-4 px-3">

      {/* Time display */}
      <div className="flex items-center justify-center gap-1 mb-5">

        {/* Hour */}
        <div style={{ ...boxStyle(mode === 'hour'), color: !hasValue ? 'rgba(255,255,255,0.28)' : mode === 'hour' ? '#FF6B35' : 'rgba(255,255,255,0.6)' }}>
          {editingPart === 'hour' ? (
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              maxLength={2}
              value={draft}
              onChange={e => setDraft(e.target.value.replace(/\D/g, '').slice(0, 2))}
              onBlur={commitEdit}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commitEdit(); } if (e.key === 'Escape') setEditingPart(null); }}
              style={{
                width: '100%', background: 'transparent', border: 'none', outline: 'none',
                color: '#FF6B35', fontWeight: 900, fontSize: '3rem',
                fontVariantNumeric: 'tabular-nums', textAlign: 'center',
                padding: 0, caretColor: '#FF6B35',
              }}
            />
          ) : (
            <button
              onClick={() => openEdit('hour')}
              style={{ background: 'none', border: 'none', color: 'inherit', fontWeight: 'inherit', fontSize: 'inherit', fontVariantNumeric: 'inherit', cursor: 'pointer', width: '100%', textAlign: 'center', padding: 0 }}
            >
              {hour12 == null ? '--' : String(hour12).padStart(2, '0')}
            </button>
          )}
        </div>

        <span style={{ fontWeight: 900, fontSize: '3rem', lineHeight: 1, color: 'rgba(255,255,255,0.25)', marginBottom: 4 }}>:</span>

        {/* Minute */}
        <div style={{ ...boxStyle(mode === 'minute'), color: !hasValue ? 'rgba(255,255,255,0.28)' : mode === 'minute' ? '#FF6B35' : 'rgba(255,255,255,0.6)' }}>
          {editingPart === 'minute' ? (
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              maxLength={2}
              value={draft}
              onChange={e => setDraft(e.target.value.replace(/\D/g, '').slice(0, 2))}
              onBlur={commitEdit}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commitEdit(); } if (e.key === 'Escape') setEditingPart(null); }}
              style={{
                width: '100%', background: 'transparent', border: 'none', outline: 'none',
                color: '#FF6B35', fontWeight: 900, fontSize: '3rem',
                fontVariantNumeric: 'tabular-nums', textAlign: 'center',
                padding: 0, caretColor: '#FF6B35',
              }}
            />
          ) : (
            <button
              onClick={() => openEdit('minute')}
              style={{ background: 'none', border: 'none', color: 'inherit', fontWeight: 'inherit', fontSize: 'inherit', fontVariantNumeric: 'inherit', cursor: 'pointer', width: '100%', textAlign: 'center', padding: 0 }}
            >
              {m == null ? '--' : String(m).padStart(2, '0')}
            </button>
          )}
        </div>

        {/* AM / PM */}
        <div className="flex flex-col ml-1" style={{ gap: 6 }}>
          {['AM', 'PM'].map(p => {
            const active = (p === 'PM') === isPM && hasValue;
            return (
              <button
                key={p}
                onClick={() => hasValue && togglePeriod()}
                style={{
                  width: 46, padding: '7px 0', borderRadius: 10,
                  fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.05em',
                  border: active ? '2px solid rgba(255,107,53,0.5)' : '2px solid rgba(255,255,255,0.1)',
                  background: active ? 'rgba(255,107,53,0.18)' : 'rgba(255,255,255,0.05)',
                  color: active ? '#FF6B35' : 'rgba(255,255,255,0.3)',
                  cursor: !hasValue || active ? 'default' : 'pointer',
                  transition: 'all 0.18s', textAlign: 'center',
                }}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      {/* Clock face */}
      <div className="flex justify-center">
        <svg
          width={SIZE} height={SIZE}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          style={{ touchAction: 'none', userSelect: 'none', cursor: 'pointer', display: 'block' }}
        >
          <circle cx={CENTER} cy={CENTER} r={CENTER - 2} fill="rgba(255,255,255,0.05)" />
          {hasValue && (
            <line x1={CENTER} y1={CENTER} x2={handPos.x} y2={handPos.y}
              stroke="#FF6B35" strokeWidth={2} strokeLinecap="round" opacity={0.6} />
          )}
          <circle cx={CENTER} cy={CENTER} r={5} fill={hasValue ? '#FF6B35' : 'rgba(255,255,255,0.28)'} />
          {hasValue && <circle cx={handPos.x} cy={handPos.y} r={8} fill="#FF6B35" opacity={0.95} />}
          {(mode === 'hour' ? HOURS : MINUTES).map((item, i) => {
            const { x, y } = itemPos(i);
            const sel = hasValue && i === liveIdx;
            return (
              <g key={item}>
                <circle cx={x} cy={y} r={20} fill={sel ? '#FF6B35' : 'rgba(255,255,255,0.0)'} style={{ transition: 'fill 0.15s' }} />
                <text x={x} y={y} textAnchor="middle" dominantBaseline="central"
                  fill={sel ? '#fff' : 'rgba(255,255,255,0.6)'}
                  fontWeight={sel ? 800 : 500}
                  fontSize={mode === 'hour' ? 15 : 13}
                  style={{ userSelect: 'none', pointerEvents: 'none', transition: 'fill 0.15s' }}
                >
                  {mode === 'minute' ? String(item).padStart(2, '0') : item}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <p className="text-center" style={{ color: 'rgba(255,255,255,0.25)', letterSpacing: '1.5px', fontSize: '0.6rem', margin: '0.75rem 0 0' }}>
        {mode === 'hour' ? 'TAP TO SET HOUR' : 'TAP TO SET MINUTE'}
      </p>

    </div>
  );
}
