import { useEffect, useMemo, useState } from 'react';
import { Box } from '../../lib/ui-lite';
import ScrollDrum from '../common/ScrollDrum';

const HOURS_LIST = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const MINUTES_LIST = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

const TIME_LABELS = [
  { maxH: 4, label: 'Deep night', color: '#8B5CF6' },
  { maxH: 6, label: 'Before dawn', color: '#EF476F' },
  { maxH: 8, label: 'Early riser', color: '#FF6B35' },
  { maxH: 10, label: 'Sweet spot', color: '#FFA94D' },
  { maxH: 12, label: 'Late morning', color: '#06D6A0' },
  { maxH: 14, label: 'Midday', color: '#FFD166' },
  { maxH: 17, label: 'Afternoon', color: '#FF8C5A' },
  { maxH: 20, label: 'Evening', color: '#FF6B35' },
  { maxH: 22, label: 'Night', color: '#8B5CF6' },
  { maxH: 24, label: 'Late night', color: '#A0A0B8' },
];

function getCtx(h24) {
  return TIME_LABELS.find((t) => h24 < t.maxH) ?? TIME_LABELS[TIME_LABELS.length - 1];
}

function parseValue(val) {
  const [h, m] = (val || '07:00').split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  const roundedMinute = Math.round(m / 5) * 5;
  return {
    hour: String(hour12).padStart(2, '0'),
    minute: String(roundedMinute % 60).padStart(2, '0'),
    ampm,
  };
}

function buildValue(hour, minute, ampm) {
  const hour12 = Number(hour);
  const h24 = ampm === 'AM'
    ? (hour12 === 12 ? 0 : hour12)
    : (hour12 === 12 ? 12 : hour12 + 12);
  return `${String(h24).padStart(2, '0')}:${String(Number(minute)).padStart(2, '0')}`;
}

export default function DrumPicker({ value, onChange }) {
  const parsed = useMemo(() => parseValue(value), [value]);
  const [hour, setHour] = useState(parsed.hour);
  const [minute, setMinute] = useState(parsed.minute);
  const [ampm, setAmpm] = useState(parsed.ampm);

  useEffect(() => {
    setHour(parsed.hour);
    setMinute(parsed.minute);
    setAmpm(parsed.ampm);
  }, [parsed]);

  function updateTime(nextHour, nextMinute, nextAmPm) {
    onChange(buildValue(nextHour, nextMinute, nextAmPm));
  }

  function handleHourChange(nextHour) {
    setHour(nextHour);
    updateTime(nextHour, minute, ampm);
  }

  function handleMinuteChange(nextMinute) {
    setMinute(nextMinute);
    updateTime(hour, nextMinute, ampm);
  }

  function handleAmPmChange(nextAmPm) {
    setAmpm(nextAmPm);
    updateTime(hour, minute, nextAmPm);
  }

  const [h24] = buildValue(hour, minute, ampm).split(':').map(Number);
  const ctx = getCtx(h24);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          px: 1,
          py: 1,
          borderRadius: '18px',
          background: '#111827',
          border: '1px solid #2d3748',
        }}
      >
        <ScrollDrum items={HOURS_LIST} value={hour} onChange={handleHourChange} width={84} />
        <Box sx={{ fontSize: '28px', fontWeight: 700, color: '#FF6B35', lineHeight: 1, pb: '2px', flexShrink: 0 }}>
          :
        </Box>
        <ScrollDrum items={MINUTES_LIST} value={minute} onChange={handleMinuteChange} width={84} />
      </Box>

      <Box sx={{ display: 'flex', gap: 1 }}>
        {['AM', 'PM'].map((option) => {
          const selected = ampm === option;
          return (
            <Box
              key={option}
              onClick={() => handleAmPmChange(option)}
              sx={{
                flex: 1,
                py: 1.2,
                borderRadius: '12px',
                textAlign: 'center',
                cursor: 'pointer',
                fontFamily: '"Outfit", sans-serif',
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.5px',
                background: selected ? '#FF6B35' : '#111827',
                border: `1px solid ${selected ? '#FF6B35' : '#2d3748'}`,
                color: selected ? 'white' : '#6b7280',
                transition: 'background 0.15s, color 0.15s, border-color 0.15s',
              }}
            >
              {option}
            </Box>
          );
        })}
      </Box>

      <Box
        sx={{
          textAlign: 'center',
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.3px',
          fontFamily: '"Outfit", sans-serif',
          color: ctx.color,
          minHeight: '16px',
        }}
      >
        {ctx.label}
      </Box>
    </Box>
  );
}
