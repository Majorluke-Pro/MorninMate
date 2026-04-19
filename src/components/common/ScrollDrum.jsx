import { useState, useEffect, useRef } from 'react';

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

  useEffect(() => {
    if (drag.current.active) return;
    const idx = idxOf(value);
    if (idx >= 0) setScrollY(idx * ITEM_H);
  }, [value]);

  const containerH = ITEM_H * VISIBLE;
  const clampScroll = s => Math.max(0, Math.min(s, (items.length - 1) * ITEM_H));

  function onPointerDown(e) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { active: true, startY: e.clientY, startScroll: scrollY, lastY: e.clientY, lastT: Date.now(), vel: 0 };
    setSnapping(false);
  }

  function onPointerMove(e) {
    if (!drag.current.active) return;
    const dy = e.clientY - drag.current.startY;
    const now = Date.now();
    drag.current.vel = (e.clientY - drag.current.lastY) / Math.max(1, now - drag.current.lastT);
    drag.current.lastY = e.clientY;
    drag.current.lastT = now;
    setScrollY(clampScroll(drag.current.startScroll - dy));
  }

  function onPointerUp() {
    if (!drag.current.active) return;
    drag.current.active = false;
    setSnapping(true);
    const vel = drag.current.vel;
    let projected = scrollY - vel * 80;
    projected = clampScroll(projected);
    const snapped = Math.round(projected / ITEM_H) * ITEM_H;
    setScrollY(snapped);
    const idx = Math.round(snapped / ITEM_H);
    onChange(items[Math.min(idx, items.length - 1)]);
  }

  const offset = scrollY - (VISIBLE - 1) / 2 * ITEM_H;

  return (
    <div
      style={{ width, height: containerH, overflow: 'hidden', position: 'relative', cursor: 'grab', userSelect: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Highlight band */}
      <div style={{
        position: 'absolute',
        top: (containerH - ITEM_H) / 2,
        left: 0, right: 0,
        height: ITEM_H,
        background: 'rgba(255,107,53,0.12)',
        borderRadius: 8,
        pointerEvents: 'none',
      }} />

      {/* Items */}
      <div style={{
        transform: `translateY(${-offset}px)`,
        transition: snapping ? 'transform 0.2s cubic-bezier(0.25,0.46,0.45,0.94)' : 'none',
      }}>
        {items.map((item, i) => {
          const itemScrollCenter = i * ITEM_H + ITEM_H / 2;
          const viewCenter = scrollY + containerH / 2;
          const dist = Math.abs(itemScrollCenter - viewCenter) / containerH;
          const opacity = Math.max(0.2, 1 - dist * 2.5);
          const isSelected = idxOf(value) === i;
          return (
            <div
              key={item}
              style={{ height: ITEM_H, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity }}
            >
              <span style={{
                fontSize: isSelected ? '1.25rem' : '1rem',
                fontWeight: isSelected ? 700 : 400,
                color: isSelected ? '#FF6B35' : '#F0F0FA',
                transition: 'all 0.15s',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {item}
              </span>
            </div>
          );
        })}
      </div>

      {/* Top/bottom fade masks */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: ITEM_H * 1.5,
        background: 'linear-gradient(to bottom, #0D0D1A, transparent)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: ITEM_H * 1.5,
        background: 'linear-gradient(to top, #0D0D1A, transparent)',
        pointerEvents: 'none',
      }} />
    </div>
  );
}
