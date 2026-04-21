let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, duration, { type = 'sine', volume = 0.25, delay = 0 } = {}) {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.type = type;
    osc.frequency.value = freq;
    const t = c.currentTime + delay;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  } catch {}
}

export function unlockAudio() {
  try { getCtx(); } catch {}
}

export function playSuccess() {
  tone(523, 0.12, { delay: 0.00, volume: 0.22 });
  tone(659, 0.12, { delay: 0.10, volume: 0.22 });
  tone(784, 0.28, { delay: 0.20, volume: 0.22 });
}

export function playError() {
  tone(280, 0.18, { type: 'square', delay: 0.00, volume: 0.18 });
  tone(180, 0.30, { type: 'square', delay: 0.16, volume: 0.18 });
}

export function playTick() {
  tone(900, 0.04, { type: 'square', volume: 0.07 });
}

export function playWarningTick() {
  tone(1100, 0.06, { type: 'square', volume: 0.12 });
}

export function playReactionGo() {
  tone(880, 0.06, { delay: 0.00, volume: 0.28 });
  tone(1100, 0.09, { delay: 0.06, volume: 0.28 });
}

export function playEarlyTap() {
  tone(220, 0.35, { type: 'sawtooth', volume: 0.18 });
}

export function playMiss() {
  tone(260, 0.12, { type: 'square', delay: 0.00, volume: 0.15 });
  tone(200, 0.20, { type: 'square', delay: 0.10, volume: 0.15 });
}

export function playCardFlip() {
  tone(480, 0.06, { volume: 0.09 });
}

export function playMatch() {
  tone(659, 0.10, { delay: 0.00, volume: 0.90 });
  tone(880, 0.16, { delay: 0.09, volume: 0.90 });
}

function patternGentleChime() {
  tone(523, 0.45, { type: 'sine', delay: 0.00, volume: 0.32 });
  tone(659, 0.45, { type: 'sine', delay: 0.45, volume: 0.32 });
  tone(784, 0.45, { type: 'sine', delay: 0.90, volume: 0.32 });
  tone(1047, 0.70, { type: 'sine', delay: 1.35, volume: 0.30 });
}

function patternMorningBirds() {
  tone(1568, 0.10, { delay: 0.00, volume: 0.14 });
  tone(1319, 0.12, { delay: 0.14, volume: 0.12 });
  tone(1760, 0.08, { delay: 0.50, volume: 0.12 });
  tone(1175, 0.15, { delay: 0.66, volume: 0.10 });
}

function patternSoftPiano() {
  const note = (freq, delay) => {
    tone(freq, 0.72, { delay, volume: 0.22 });
    tone(freq * 2, 0.30, { delay, volume: 0.06 });
  };
  note(523, 0.00);
  note(659, 0.80);
}

function patternRisingBell() {
  [300, 420, 560, 720, 920, 1150].forEach((f, i) => {
    tone(f, 0.18, { delay: i * 0.13, volume: 0.35 });
  });
}

function patternClassicBeep() {
  tone(1000, 0.18, { type: 'square', delay: 0.00, volume: 0.55 });
  tone(1250, 0.18, { type: 'square', delay: 0.22, volume: 0.55 });
  tone(1000, 0.18, { type: 'square', delay: 0.44, volume: 0.55 });
  tone(1250, 0.18, { type: 'square', delay: 0.66, volume: 0.55 });
}

function patternDigitalBuzz() {
  for (let i = 0; i < 6; i++) {
    tone(1760, 0.07, { type: 'square', delay: i * 0.13, volume: 0.38 });
  }
}

function patternUrgentRing() {
  for (let i = 0; i < 8; i++) {
    tone(i % 2 === 0 ? 780 : 1020, 0.14, { delay: i * 0.14, volume: 0.38 });
  }
}

function patternRadarPulse() {
  tone(180, 0.40, { delay: 0.00, volume: 0.50 });
  tone(180, 0.40, { delay: 0.55, volume: 0.50 });
  tone(180, 0.40, { delay: 1.10, volume: 0.50 });
}

const ALARM_PATTERNS = {
  gentle_chime: { fn: patternGentleChime, interval: 2400 },
  morning_birds: { fn: patternMorningBirds, interval: 1800 },
  soft_piano: { fn: patternSoftPiano, interval: 2200 },
  rising_bell: { fn: patternRisingBell, interval: 1600 },
  classic_beep: { fn: patternClassicBeep, interval: 1600 },
  digital_buzz: { fn: patternDigitalBuzz, interval: 1200 },
  urgent_ring: { fn: patternUrgentRing, interval: 1600 },
  radar_pulse: { fn: patternRadarPulse, interval: 2000 },
};

export const ALARM_SOUNDS = [
  { id: 'gentle_chime', label: 'Gentle Chime', desc: 'Soft bell loop' },
  { id: 'morning_birds', label: 'Morning Birds', desc: 'Light birdsong ambience' },
  { id: 'soft_piano', label: 'Soft Piano', desc: 'Warm mellow notes' },
  { id: 'rising_bell', label: 'Rising Bell', desc: 'Gradually intensifies' },
  { id: 'classic_beep', label: 'Classic Beep', desc: 'Traditional alarm tone' },
  { id: 'digital_buzz', label: 'Digital Buzz', desc: 'Sharp electronic beeps' },
  { id: 'urgent_ring', label: 'Urgent Ring', desc: 'Fast ringing pattern' },
  { id: 'radar_pulse', label: 'Radar Pulse', desc: 'Repeating low pulse' },
];

export function previewAlarmSound(id) {
  try {
    getCtx();
    const pattern = ALARM_PATTERNS[id] ?? ALARM_PATTERNS.gentle_chime;
    pattern.fn();
  } catch {}
}

let alarmTimer = null;

export function startAlarm(soundId = 'gentle_chime') {
  stopAlarm();
  try {
    getCtx();
    const pattern = ALARM_PATTERNS[soundId] ?? ALARM_PATTERNS.gentle_chime;
    pattern.fn();
    alarmTimer = setInterval(pattern.fn, pattern.interval);
  } catch {}
}

export function stopAlarm() {
  if (alarmTimer) {
    clearInterval(alarmTimer);
    alarmTimer = null;
  }
}
