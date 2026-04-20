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

function normAngle(angle) {
  return (angle + 90 + 360) % 360;
}

function angleToTickFloat(angle) {
  return normAngle(angle) / STEP_DEG;
}

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
  const [dragAngle, setDragAngle] = useState(null);
  const dragAngleRef = useRef(null);
  const draggingRef = useRef(false);
  const rafRef = useRef(0);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const selIdx = !hasValue
    ? 0
    : mode === 'hour'
    ? HOURS.indexOf(hour12)
    : MINUTES.indexOf(minuteDisplayTick) >= 0 ? MINUTES.indexOf(minuteDisplayTick) : 0;
  const snappedHandPos = itemPos(selIdx);
  const handPos = dragAngle == null ? snappedHandPos : angleToHandPos(dragAngle);
  const liveIdx = dragAngle == null ? selIdx : (Math.round(angleToTickFloat(dragAngle)) + 12) % 12;

  function commitTick(tickIdx) {
    if (mode === 'hour') {
      const h = HOURS[tickIdx];
      const h24new = isPM ? (h % 12) + 12 : h % 12;
      const nextMinute = Number.isInteger(m) ? m : 0;
      onChange(`${String(h24new).padStart(2,'0')}:${String(nextMinute).padStart(2,'0')}`);
    } else {
      const min = MINUTES[tickIdx];
      const nextHour = Number.isInteger(h24) ? h24 : 0;
      onChange(`${String(nextHour).padStart(2,'0')}:${String(min).padStart(2,'0')}`);
    }
  }

  function handlePointerDown(e) {
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    const angle = getAngleFromCenter(e.clientX, e.clientY, rect);
    draggingRef.current = true;
    dragAngleRef.current = angle;
    setDragAngle(angle);
  }

  function handlePointerMove(e) {
    if (!draggingRef.current) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const angle = getAngleFromCenter(e.clientX, e.clientY, rect);
    dragAngleRef.current = angle;
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

  return (
    <div className="py-4 px-3">

      {/* Time display */}
      <div className="flex items-center justify-center gap-1 mb-5">

        {/* Hour */}
        <button
          onClick={() => setMode('hour')}
          className="rounded-xl transition-all touch-manipulation leading-none"
          style={{
            minWidth: 78,
            padding: '4px 8px',
            background: mode === 'hour' ? 'rgba(255,107,53,0.15)' : 'transparent',
            color: !hasValue ? 'rgba(255,255,255,0.28)' : mode === 'hour' ? '#FF6B35' : 'rgba(255,255,255,0.6)',
            fontWeight: 900,
            fontSize: '3rem',
            fontVariantNumeric: 'tabular-nums',
            border: mode === 'hour' ? '2px solid rgba(255,107,53,0.3)' : '2px solid transparent',
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          {hour12 == null ? '--' : String(hour12).padStart(2, '0')}
        </button>

        <span style={{ fontWeight: 900, fontSize: '3rem', lineHeight: 1, color: 'rgba(255,255,255,0.25)', marginBottom: 4 }}>:</span>

        {/* Minute */}
        <button
          onClick={() => setMode('minute')}
          className="rounded-xl transition-all touch-manipulation leading-none"
          style={{
            minWidth: 78,
            padding: '4px 8px',
            background: mode === 'minute' ? 'rgba(255,107,53,0.15)' : 'transparent',
            color: !hasValue ? 'rgba(255,255,255,0.28)' : mode === 'minute' ? '#FF6B35' : 'rgba(255,255,255,0.6)',
            fontWeight: 900,
            fontSize: '3rem',
            fontVariantNumeric: 'tabular-nums',
            border: mode === 'minute' ? '2px solid rgba(255,107,53,0.3)' : '2px solid transparent',
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          {m == null ? '--' : String(m).padStart(2, '0')}
        </button>

        {/* AM / PM */}
        <div className="flex flex-col ml-1" style={{ gap: 6 }}>
          {['AM', 'PM'].map(p => {
            const active = (p === 'PM') === isPM && hasValue;
            return (
              <button
                key={p}
                onClick={() => hasValue && togglePeriod()}
                style={{
                  width: 46,
                  padding: '7px 0',
                  borderRadius: 10,
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  letterSpacing: '0.05em',
                  border: active
                    ? '2px solid rgba(255,107,53,0.5)'
                    : '2px solid rgba(255,255,255,0.1)',
                  background: active
                    ? 'rgba(255,107,53,0.18)'
                    : 'rgba(255,255,255,0.05)',
                  color: active ? '#FF6B35' : 'rgba(255,255,255,0.3)',
                  cursor: !hasValue || active ? 'default' : 'pointer',
                  transition: 'all 0.18s',
                  textAlign: 'center',
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
          width={SIZE}
          height={SIZE}
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
                <circle cx={x} cy={y} r={20}
                  fill={sel ? '#FF6B35' : 'rgba(255,255,255,0.0)'}
                  style={{ transition: 'fill 0.15s' }}
                />
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

      {/* Mode hint */}
      <p className="text-center mt-3" style={{ color: 'rgba(255,255,255,0.25)', letterSpacing: '1.5px', fontSize: '0.6rem', margin: '0.75rem 0 0' }}>
        {mode === 'hour' ? 'TAP TO SET HOUR' : 'TAP TO SET MINUTE'}
      </p>

    </div>
  );
}
