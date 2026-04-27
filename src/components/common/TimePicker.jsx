import { useMemo } from 'react';
import ScrollDrum from './ScrollDrum';

const HOURS   = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

export default function TimePicker({ value, onChange }) {
  const { hour, minute, period } = useMemo(() => {
    const [h24, m] = (value || '07:00').split(':').map(Number);
    return {
      hour:   String((h24 % 12) || 12).padStart(2, '0'),
      minute: String(m ?? 0).padStart(2, '0'),
      period: h24 >= 12 ? 'PM' : 'AM',
    };
  }, [value]);

  function commit(nextHour, nextMinute, nextPeriod) {
    const h   = Number(nextHour);
    const m   = Number(nextMinute);
    const h24 = nextPeriod === 'AM' ? (h === 12 ? 0 : h) : (h === 12 ? 12 : h + 12);
    onChange(`${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }

  return (
    <div className="py-4 px-3">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '8px 12px',
        borderRadius: 18,
        background: '#111827',
        border: '1px solid #2d3748',
      }}>
        <ScrollDrum
          items={HOURS}
          value={hour}
          onChange={h => commit(h, minute, period)}
          width={84}
          infinite
        />

        <span style={{
          fontSize: 28, fontWeight: 700, color: '#FF6B35',
          lineHeight: 1, paddingBottom: 2, flexShrink: 0,
        }}>:</span>

        <ScrollDrum
          items={MINUTES}
          value={minute}
          onChange={m => commit(hour, m, period)}
          width={84}
          infinite
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginLeft: 8 }}>
          {['AM', 'PM'].map(p => {
            const active = period === p;
            return (
              <button
                key={p}
                onClick={() => commit(hour, minute, p)}
                style={{
                  width: 46, padding: '7px 0', borderRadius: 10,
                  fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.05em',
                  border: active
                    ? '2px solid rgba(255,107,53,0.5)'
                    : '2px solid rgba(255,255,255,0.1)',
                  background: active
                    ? 'rgba(255,107,53,0.18)'
                    : 'rgba(255,255,255,0.05)',
                  color: active ? '#FF6B35' : 'rgba(255,255,255,0.3)',
                  cursor: active ? 'default' : 'pointer',
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
    </div>
  );
}
