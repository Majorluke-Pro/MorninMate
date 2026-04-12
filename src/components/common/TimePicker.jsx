import { useEffect, useRef, useState } from 'react';
import { Box, InputBase, Typography } from '@mui/material';

const SIZE    = 256;
const CENTER  = SIZE / 2;
const RADIUS  = 92;
const HOURS   = [12,1,2,3,4,5,6,7,8,9,10,11];
const MINUTES = [0,5,10,15,20,25,30,35,40,45,50,55];
const STEP_DEG = 30; // 12 ticks around circle

function itemPos(index) {
  const angle = (index * 30 - 90) * (Math.PI / 180);
  return { x: CENTER + RADIUS * Math.cos(angle), y: CENTER + RADIUS * Math.sin(angle) };
}

function normAngle(angle) {
  return (angle + 90 + 360) % 360;
}

function angleToTickFloat(angle) {
  return normAngle(angle) / STEP_DEG; // 0..12
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
  const [editingPart, setEditingPart] = useState(null);
  const [draftValue, setDraftValue] = useState('');
  const [dragAngle, setDragAngle] = useState(null); // degrees, null when not dragging
  const dragAngleRef = useRef(null);
  const draggingRef = useRef(false);
  const rafRef = useRef(0);
  const inputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    if (editingPart && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingPart]);

  // selected index on the clock face
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
    // Smooth drag: move hand continuously, snap once on release.
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

  function startManualEdit(part) {
    setMode(part);
    setEditingPart(part);
    setDraftValue(
      part === 'hour'
        ? hour12 == null ? '' : String(hour12).padStart(2, '0')
        : m == null ? '' : String(m).padStart(2, '0')
    );
  }

  function commitManualEdit() {
    if (!editingPart) return;

    const trimmed = draftValue.trim();
    if (trimmed === '') {
      setEditingPart(null);
      return;
    }

    if (editingPart === 'hour') {
      const parsedHour = Number(trimmed);
      if (!Number.isInteger(parsedHour) || parsedHour < 1 || parsedHour > 12) return;
      const nextHour24 = isPM ? (parsedHour % 12) + 12 : parsedHour % 12;
      const nextMinute = Number.isInteger(m) ? m : 0;
      onChange(`${String(nextHour24).padStart(2, '0')}:${String(nextMinute).padStart(2, '0')}`);
    } else {
      const parsedMinute = Number(trimmed);
      if (!Number.isInteger(parsedMinute) || parsedMinute < 0 || parsedMinute > 59) return;
      const nextHour24 = Number.isInteger(h24) ? h24 : 0;
      onChange(`${String(nextHour24).padStart(2, '0')}:${String(parsedMinute).padStart(2, '0')}`);
    }

    setEditingPart(null);
  }

  function cancelManualEdit() {
    setEditingPart(null);
    setDraftValue('');
  }

  function handleManualKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitManualEdit();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      cancelManualEdit();
    }
  }

  return (
    <Box sx={{ py: 2, px: 1.5 }}>

      {/* ── Time display ── */}
      <Box sx={{ display:'flex', alignItems:'center', justifyContent:'center', gap:0.5, mb:2.5 }}>
        <Box
          onClick={() => startManualEdit('hour')}
          sx={{
            px:1.5, py:0.5, borderRadius:2, cursor:'pointer', lineHeight:1,
            bgcolor: mode==='hour' ? 'rgba(255,107,53,0.18)' : 'transparent',
            color: !hasValue ? 'rgba(255,255,255,0.28)' : mode==='hour' ? '#FF6B35' : 'rgba(255,255,255,0.45)',
            fontWeight:900, fontSize:'3rem', fontVariantNumeric:'tabular-nums',
            transition:'all 0.15s',
            minWidth: 78,
            textAlign: 'center',
          }}
        >
          {editingPart === 'hour' ? (
            <InputBase
              inputRef={inputRef}
              value={draftValue}
              onChange={e => setDraftValue(e.target.value.replace(/\D/g, '').slice(0, 2))}
              onBlur={commitManualEdit}
              onKeyDown={handleManualKeyDown}
              inputProps={{ inputMode: 'numeric', maxLength: 2, style: { textAlign: 'center' } }}
              sx={{
                width: 48,
                color: '#FF6B35',
                fontWeight: 900,
                fontSize: '3rem',
                '& input': { p: 0 },
              }}
            />
          ) : (
            hour12 == null ? '--' : String(hour12).padStart(2,'0')
          )}
        </Box>
        <Typography sx={{ fontWeight:900, fontSize:'3rem', lineHeight:1, color:'rgba(255,255,255,0.25)', mb:0.5 }}>:</Typography>
        <Box
          onClick={() => startManualEdit('minute')}
          sx={{
            px:1.5, py:0.5, borderRadius:2, cursor:'pointer', lineHeight:1,
            bgcolor: mode==='minute' ? 'rgba(255,107,53,0.18)' : 'transparent',
            color: !hasValue ? 'rgba(255,255,255,0.28)' : mode==='minute' ? '#FF6B35' : 'rgba(255,255,255,0.45)',
            fontWeight:900, fontSize:'3rem', fontVariantNumeric:'tabular-nums',
            transition:'all 0.15s',
            minWidth: 78,
            textAlign: 'center',
          }}
        >
          {editingPart === 'minute' ? (
            <InputBase
              inputRef={inputRef}
              value={draftValue}
              onChange={e => setDraftValue(e.target.value.replace(/\D/g, '').slice(0, 2))}
              onBlur={commitManualEdit}
              onKeyDown={handleManualKeyDown}
              inputProps={{ inputMode: 'numeric', maxLength: 2, style: { textAlign: 'center' } }}
              sx={{
                width: 48,
                color: '#FF6B35',
                fontWeight: 900,
                fontSize: '3rem',
                '& input': { p: 0 },
              }}
            />
          ) : (
            m == null ? '--' : String(m).padStart(2,'0')
          )}
        </Box>

        {/* AM / PM */}
        <Box sx={{ display:'flex', flexDirection:'column', gap:0.6, ml:1 }}>
          {['AM','PM'].map(p => {
            const active = (p==='PM') === isPM;
            return (
              <Box key={p} onClick={() => !active && togglePeriod()} sx={{
                px:1.5, py:0.45, borderRadius:99, userSelect:'none',
                cursor: !hasValue || active ? 'default' : 'pointer',
                bgcolor: !hasValue ? 'rgba(255,255,255,0.05)' : active ? '#FF6B35' : 'rgba(255,255,255,0.08)',
                color: !hasValue ? 'rgba(255,255,255,0.28)' : active ? '#fff' : 'rgba(255,255,255,0.35)',
                fontWeight:700, fontSize:'0.78rem', transition:'all 0.15s',
              }}>
                {p}
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* ── Clock face ── */}
      <Box sx={{ display:'flex', justifyContent:'center' }}>
        <Box
          component="svg"
          width={SIZE} height={SIZE}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          sx={{ touchAction:'none', userSelect:'none', cursor:'pointer', display:'block' }}
        >
          {/* Background circle */}
          <circle cx={CENTER} cy={CENTER} r={CENTER - 2} fill="rgba(255,255,255,0.05)" />

          {/* Hand */}
          {hasValue && (
            <line
              x1={CENTER} y1={CENTER}
              x2={handPos.x} y2={handPos.y}
              stroke="#FF6B35" strokeWidth={2} strokeLinecap="round" opacity={0.6}
            />
          )}

          {/* Center dot */}
          <circle cx={CENTER} cy={CENTER} r={5} fill={hasValue ? '#FF6B35' : 'rgba(255,255,255,0.28)'} />

          {/* Hand knob */}
          {hasValue && <circle cx={handPos.x} cy={handPos.y} r={8} fill="#FF6B35" opacity={0.95} />}

          {/* Number bubbles */}
          {(mode === 'hour' ? HOURS : MINUTES).map((item, i) => {
            const { x, y } = itemPos(i);
            const sel = hasValue && i === liveIdx;
            return (
              <g key={item}>
                <circle cx={x} cy={y} r={20}
                  fill={sel ? '#FF6B35' : 'rgba(255,255,255,0.0)'}
                  style={{ transition:'fill 0.15s' }}
                />
                <text
                  x={x} y={y}
                  textAnchor="middle" dominantBaseline="central"
                  fill={sel ? '#fff' : 'rgba(255,255,255,0.6)'}
                  fontWeight={sel ? 800 : 500}
                  fontSize={mode === 'hour' ? 15 : 13}
                  style={{ userSelect:'none', pointerEvents:'none', transition:'fill 0.15s' }}
                >
                  {mode === 'minute' ? String(item).padStart(2,'0') : item}
                </text>
              </g>
            );
          })}
        </Box>
      </Box>

      {/* ── Mode hint ── */}
      <Typography variant="caption" display="block" textAlign="center"
        sx={{ mt:1.5, color:'rgba(255,255,255,0.25)', letterSpacing:1.5, fontSize:'0.6rem' }}>
        {mode === 'hour' ? 'TAP TO SET HOUR' : 'TAP TO SET MINUTE'}
      </Typography>

    </Box>
  );
}
