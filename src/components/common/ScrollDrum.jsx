import { useRef, useState, useLayoutEffect, useEffect } from 'react';

export const HOURS   = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
export const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
export const PERIODS = ['AM', 'PM'];

const ITEM_H  = 56;
const VISIBLE = 5;

// CSS scroll-snap based wheel drum. All scroll physics run natively in the
// browser's compositor thread — no JS during scrolling, zero reflow on move.
export default function ScrollDrum({ items, value, onChange, width = 80 }) {
  const containerRef  = useRef(null);
  const commitRef     = useRef(null);
  const programmatic  = useRef(false);
  const containerH    = ITEM_H * VISIBLE;
  const padding       = ITEM_H * Math.floor(VISIBLE / 2); // lets first/last item center

  const [liveIdx, setLiveIdx] = useState(() => {
    const i = items.indexOf(value);
    return i >= 0 ? i : 0;
  });

  // Set initial scroll position before browser paint to avoid flash.
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const i = items.indexOf(value);
    if (i >= 0) el.scrollTop = i * ITEM_H;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount only

  // Sync when parent changes value (e.g. AM/PM toggle).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const i = items.indexOf(value);
    if (i < 0) return;
    const target = i * ITEM_H;
    if (Math.abs(el.scrollTop - target) < 2) return;
    programmatic.current = true;
    el.scrollTop = target;
    setLiveIdx(i);
    setTimeout(() => { programmatic.current = false; }, 200);
  }, [value, items]);

  function onScroll() {
    const el = containerRef.current;
    if (!el) return;
    const i = Math.max(0, Math.min(Math.round(el.scrollTop / ITEM_H), items.length - 1));
    setLiveIdx(i);
    if (programmatic.current) return;
    clearTimeout(commitRef.current);
    commitRef.current = setTimeout(() => { onChange(items[i]); }, 120);
  }

  return (
    <div style={{ width, height: containerH, position: 'relative', flexShrink: 0 }}>
      {/* Selected-item highlight band */}
      <div style={{
        position: 'absolute',
        top: (containerH - ITEM_H) / 2,
        left: 0, right: 0,
        height: ITEM_H,
        background: 'rgba(255,107,53,0.12)',
        borderRadius: 8,
        pointerEvents: 'none',
        zIndex: 1,
      }} />

      <div
        ref={containerRef}
        className="scroll-drum"
        onScroll={onScroll}
        style={{
          width: '100%',
          height: '100%',
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          scrollbarWidth: 'none',      // Firefox
          msOverflowStyle: 'none',     // IE/Edge legacy
          touchAction: 'pan-y',        // immediate panning, no tap-delay
          overscrollBehavior: 'contain',
          position: 'relative',
        }}
      >
        <div style={{ height: padding, flexShrink: 0 }} />

        {items.map((item, i) => {
          const dist     = Math.abs(i - liveIdx);
          const opacity  = Math.max(0.2, 1 - dist * 0.35);
          const selected = i === liveIdx;
          return (
            <div
              key={item}
              style={{
                height: ITEM_H,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                scrollSnapAlign: 'center',
                flexShrink: 0,
              }}
            >
              <span style={{
                fontSize: selected ? '1.25rem' : '1rem',
                fontWeight: selected ? 700 : 400,
                color: selected ? '#FF6B35' : '#F0F0FA',
                opacity,
                fontVariantNumeric: 'tabular-nums',
                userSelect: 'none',
                pointerEvents: 'none',
                transition: 'font-size 0.1s, opacity 0.08s',
              }}>
                {item}
              </span>
            </div>
          );
        })}

        <div style={{ height: padding, flexShrink: 0 }} />
      </div>

      {/* Fade masks */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: ITEM_H * 1.5,
        background: 'linear-gradient(to bottom, #0D0D1A, transparent)',
        pointerEvents: 'none',
        zIndex: 2,
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: ITEM_H * 1.5,
        background: 'linear-gradient(to top, #0D0D1A, transparent)',
        pointerEvents: 'none',
        zIndex: 2,
      }} />
    </div>
  );
}
