import { useState, useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';

export const HOURS   = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
export const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
export const PERIODS = ['AM', 'PM'];

const ITEM_H  = 56;
const VISIBLE = 5;

export default function ScrollDrum({ items, value, onChange, width = 80 }) {
  const idxOf  = v => items.indexOf(v);
  const [scrollY,  setScrollY]  = useState(() => idxOf(value) * ITEM_H);
  const [snapping, setSnapping] = useState(false);
  const drag = useRef({ active: false, startY: 0, startScroll: 0, lastY: 0, lastT: 0, vel: 0 });

  // Sync when parent changes value programmatically
  useEffect(() => {
    if (drag.current.active) return;
    const idx = idxOf(value);
    if (idx !== -1 && Math.abs(idx * ITEM_H - scrollY) > 1) {
      setSnapping(true);
      setScrollY(idx * ITEM_H);
    }
  }, [value]);

  function snapTo(raw) {
    const idx = Math.max(0, Math.min(items.length - 1, Math.round(raw / ITEM_H)));
    setSnapping(true);
    setScrollY(idx * ITEM_H);
    onChange(items[idx]);
  }

  function onPointerDown(e) {
    e.currentTarget.setPointerCapture(e.pointerId);
    setSnapping(false);
    drag.current = { active: true, startY: e.clientY, startScroll: scrollY, lastY: e.clientY, lastT: Date.now(), vel: 0 };
  }

  function onPointerMove(e) {
    const d = drag.current;
    if (!d.active) return;
    const now = Date.now();
    const dt  = now - d.lastT || 1;
    d.vel     = (d.lastY - e.clientY) / dt;
    d.lastY   = e.clientY;
    d.lastT   = now;
    const raw = d.startScroll + (d.startY - e.clientY);
    setScrollY(Math.max(-ITEM_H, Math.min((items.length) * ITEM_H, raw)));
  }

  function onPointerUp() {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    snapTo(scrollY + d.vel * 60);
  }

  const centerIdx = scrollY / ITEM_H;

  return (
    <Box
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      sx={{ width, height: ITEM_H * VISIBLE, overflow: 'hidden', position: 'relative',
            cursor: 'ns-resize', userSelect: 'none', touchAction: 'none' }}
    >
      {/* Selected-value highlight band */}
      <Box sx={{
        position: 'absolute', top: ITEM_H * 2, height: ITEM_H,
        left: 4, right: 4, borderRadius: 2, zIndex: 1, pointerEvents: 'none',
        bgcolor: 'rgba(255,107,53,0.1)',
        border: '1px solid rgba(255,107,53,0.22)',
      }} />

      {/* Top fade */}
      <Box sx={{
        position: 'absolute', top: 0, left: 0, right: 0, height: ITEM_H * 2.2,
        background: 'linear-gradient(to bottom, #0D0D1A 20%, transparent)',
        pointerEvents: 'none', zIndex: 2,
      }} />
      {/* Bottom fade */}
      <Box sx={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: ITEM_H * 2.2,
        background: 'linear-gradient(to top, #0D0D1A 20%, transparent)',
        pointerEvents: 'none', zIndex: 2,
      }} />

      {/* Scrolling list */}
      <Box sx={{
        transform: `translateY(${-scrollY + ITEM_H * 2}px)`,
        transition: snapping ? 'transform 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
        willChange: 'transform',
      }}>
        {items.map((item, idx) => {
          const dist   = Math.abs(idx - centerIdx);
          const active = dist < 0.5;
          return (
            <Box key={item} sx={{ height: ITEM_H, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography sx={{
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1,
                fontSize:   active ? '2.4rem' : dist < 1.5 ? '1.8rem' : '1.3rem',
                fontWeight: active ? 800 : 500,
                opacity:    active ? 1    : dist < 1.5 ? 0.45 : 0.15,
                color:      active ? '#FF6B35' : 'white',
              }}>
                {item}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
