import { useState } from 'react';
import { Box, Typography } from '@mui/material';

const SIZE    = 256;
const CENTER  = SIZE / 2;
const RADIUS  = 92;
const HOURS   = [12,1,2,3,4,5,6,7,8,9,10,11];
const MINUTES = [0,5,10,15,20,25,30,35,40,45,50,55];

function itemPos(index) {
  const angle = (index * 30 - 90) * (Math.PI / 180);
  return { x: CENTER + RADIUS * Math.cos(angle), y: CENTER + RADIUS * Math.sin(angle) };
}

function angleToHour(angle) {
  const norm = ((angle + 90 + 360) % 360);
  return Math.round(norm / 30) % 12 || 12;
}

function angleToMinute(angle) {
  const norm = ((angle + 90 + 360) % 360);
  return (Math.round(norm / 30) * 5) % 60;
}

function getAngleFromCenter(clientX, clientY, rect) {
  const x = clientX - rect.left - CENTER;
  const y = clientY - rect.top  - CENTER;
  return Math.atan2(y, x) * (180 / Math.PI);
}

export default function TimePicker({ value, onChange }) {
  const [h24, m] = value.split(':').map(Number);
  const isPM   = h24 >= 12;
  const hour12 = h24 % 12 || 12;
  const [mode, setMode] = useState('hour');

  // selected index on the clock face
  const selIdx = mode === 'hour'
    ? HOURS.indexOf(hour12)
    : MINUTES.indexOf(m) >= 0 ? MINUTES.indexOf(m) : 0;
  const handPos = itemPos(selIdx);

  function pickFromPoint(clientX, clientY, rect) {
    const angle = getAngleFromCenter(clientX, clientY, rect);
    if (mode === 'hour') {
      const h = angleToHour(angle);
      const h24new = isPM ? (h % 12) + 12 : h % 12;
      onChange(`${String(h24new).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
    } else {
      const min = angleToMinute(angle);
      onChange(`${String(h24).padStart(2,'0')}:${String(min).padStart(2,'0')}`);
    }
  }

  function handleClick(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    pickFromPoint(e.clientX, e.clientY, rect);
    if (mode === 'hour') setMode('minute');
  }

  function handleTouchMove(e) {
    e.preventDefault();
    const t = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    pickFromPoint(t.clientX, t.clientY, rect);
  }

  function handleTouchEnd() {
    if (mode === 'hour') setMode('minute');
  }

  function togglePeriod() {
    const nh = isPM ? h24 - 12 : h24 + 12;
    onChange(`${String(nh).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
  }

  return (
    <Box sx={{ py: 2, px: 1.5 }}>

      {/* ── Time display ── */}
      <Box sx={{ display:'flex', alignItems:'center', justifyContent:'center', gap:0.5, mb:2.5 }}>
        <Box
          onClick={() => setMode('hour')}
          sx={{
            px:1.5, py:0.5, borderRadius:2, cursor:'pointer', lineHeight:1,
            bgcolor: mode==='hour' ? 'rgba(255,107,53,0.18)' : 'transparent',
            color: mode==='hour' ? '#FF6B35' : 'rgba(255,255,255,0.45)',
            fontWeight:900, fontSize:'3rem', fontVariantNumeric:'tabular-nums',
            transition:'all 0.15s',
          }}
        >
          {String(hour12).padStart(2,'0')}
        </Box>
        <Typography sx={{ fontWeight:900, fontSize:'3rem', lineHeight:1, color:'rgba(255,255,255,0.25)', mb:0.5 }}>:</Typography>
        <Box
          onClick={() => setMode('minute')}
          sx={{
            px:1.5, py:0.5, borderRadius:2, cursor:'pointer', lineHeight:1,
            bgcolor: mode==='minute' ? 'rgba(255,107,53,0.18)' : 'transparent',
            color: mode==='minute' ? '#FF6B35' : 'rgba(255,255,255,0.45)',
            fontWeight:900, fontSize:'3rem', fontVariantNumeric:'tabular-nums',
            transition:'all 0.15s',
          }}
        >
          {String(m).padStart(2,'0')}
        </Box>

        {/* AM / PM */}
        <Box sx={{ display:'flex', flexDirection:'column', gap:0.6, ml:1 }}>
          {['AM','PM'].map(p => {
            const active = (p==='PM') === isPM;
            return (
              <Box key={p} onClick={() => !active && togglePeriod()} sx={{
                px:1.5, py:0.45, borderRadius:99, userSelect:'none',
                cursor: active ? 'default' : 'pointer',
                bgcolor: active ? '#FF6B35' : 'rgba(255,255,255,0.08)',
                color: active ? '#fff' : 'rgba(255,255,255,0.35)',
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
          onClick={handleClick}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          sx={{ touchAction:'none', userSelect:'none', cursor:'pointer', display:'block' }}
        >
          {/* Background circle */}
          <circle cx={CENTER} cy={CENTER} r={CENTER - 2} fill="rgba(255,255,255,0.05)" />

          {/* Hand */}
          <line
            x1={CENTER} y1={CENTER}
            x2={handPos.x} y2={handPos.y}
            stroke="#FF6B35" strokeWidth={2} strokeLinecap="round" opacity={0.6}
          />

          {/* Center dot */}
          <circle cx={CENTER} cy={CENTER} r={5} fill="#FF6B35" />

          {/* Number bubbles */}
          {(mode === 'hour' ? HOURS : MINUTES).map((item, i) => {
            const { x, y } = itemPos(i);
            const sel = item === (mode === 'hour' ? hour12 : m);
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
