// ─── Sound Engine — Web Audio API (no audio files needed) ──────────────────
// All sounds are synthesized. Call unlockAudio() on the first user tap
// to satisfy iOS/Safari's "user gesture required" rule.

let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, duration, { type = 'sine', volume = 0.25, delay = 0 } = {}) {
  try {
    const c = getCtx();
    const osc  = c.createOscillator();
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
  } catch (_) { /* audio not available */ }
}

// ── Unlock audio context on first user interaction (required by iOS) ─────────
export function unlockAudio() {
  try { getCtx(); } catch (_) {}
}

// ── Game sounds ───────────────────────────────────────────────────────────────

export function playSuccess() {
  tone(523, 0.12, { delay: 0.00, volume: 0.22 }); // C5
  tone(659, 0.12, { delay: 0.10, volume: 0.22 }); // E5
  tone(784, 0.28, { delay: 0.20, volume: 0.22 }); // G5
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

// Reaction game — plays when screen turns green
export function playReactionGo() {
  tone(880,  0.06, { delay: 0.00, volume: 0.28 });
  tone(1100, 0.09, { delay: 0.06, volume: 0.28 });
}

// Reaction game — tapped during red phase
export function playEarlyTap() {
  tone(220, 0.35, { type: 'sawtooth', volume: 0.18 });
}

// Reaction game — missed the window
export function playMiss() {
  tone(260, 0.12, { type: 'square', delay: 0.00, volume: 0.15 });
  tone(200, 0.20, { type: 'square', delay: 0.10, volume: 0.15 });
}

// Memory game — card flip
export function playCardFlip() {
  tone(480, 0.06, { volume: 0.09 });
}

// Memory game — matched pair
export function playMatch() {
  tone(659, 0.10, { delay: 0.00, volume: 0.90 });
  tone(880, 0.16, { delay: 0.09, volume: 0.90 });
}

// ── Alarm sound patterns ──────────────────────────────────────────────────────

// 1. Classic — urgent square-wave two-tone
function patternClassic() {
  tone(1000, 0.18, { type: 'square', delay: 0.00, volume: 0.55 });
  tone(1250, 0.18, { type: 'square', delay: 0.22, volume: 0.55 });
  tone(1000, 0.18, { type: 'square', delay: 0.44, volume: 0.55 });
  tone(1250, 0.18, { type: 'square', delay: 0.66, volume: 0.55 });
}

// 2. Chime — soft ascending sine bells
function patternChime() {
  tone(523,  0.45, { type: 'sine', delay: 0.00, volume: 0.32 }); // C5
  tone(659,  0.45, { type: 'sine', delay: 0.45, volume: 0.32 }); // E5
  tone(784,  0.45, { type: 'sine', delay: 0.90, volume: 0.32 }); // G5
  tone(1047, 0.70, { type: 'sine', delay: 1.35, volume: 0.30 }); // C6
}

// 3. Digital — rapid electronic beeps
function patternDigital() {
  for (let i = 0; i < 6; i++) {
    tone(1760, 0.07, { type: 'square', delay: i * 0.13, volume: 0.38 });
  }
}

// 4. Pulse — deep rhythmic bass throb
function patternPulse() {
  tone(180, 0.40, { type: 'sine', delay: 0.00, volume: 0.50 });
  tone(180, 0.40, { type: 'sine', delay: 0.55, volume: 0.50 });
  tone(180, 0.40, { type: 'sine', delay: 1.10, volume: 0.50 });
}

// 5. Rise — ascending frequency sweep
function patternRise() {
  [300, 420, 560, 720, 920, 1150].forEach((f, i) => {
    tone(f, 0.18, { type: 'sine', delay: i * 0.13, volume: 0.35 });
  });
}

// 6. Ping — clean crisp single tones
function patternPing() {
  tone(1047, 0.55, { type: 'sine', delay: 0.00, volume: 0.42 }); // C6
  tone(1047, 0.55, { type: 'sine', delay: 0.80, volume: 0.42 });
}

// 7. Arcade — retro game blips
function patternArcade() {
  tone(660,  0.08, { type: 'square', delay: 0.00, volume: 0.32 });
  tone(880,  0.08, { type: 'square', delay: 0.12, volume: 0.32 });
  tone(660,  0.08, { type: 'square', delay: 0.24, volume: 0.32 });
  tone(880,  0.08, { type: 'square', delay: 0.36, volume: 0.32 });
  tone(1100, 0.16, { type: 'square', delay: 0.52, volume: 0.36 });
}

// 8. Bell — warm marimba-style bell with harmonics
function patternBell() {
  const bell = (freq, delay) => {
    tone(freq,     0.70, { type: 'sine', delay, volume: 0.30 });
    tone(freq * 2, 0.35, { type: 'sine', delay, volume: 0.10 });
    tone(freq * 3, 0.20, { type: 'sine', delay, volume: 0.05 });
  };
  bell(523, 0.00); // C5
  bell(659, 0.80); // E5
}

// 9. Warble — oscillating FM-style waves
function patternWarble() {
  for (let i = 0; i < 8; i++) {
    tone(i % 2 === 0 ? 780 : 1020, 0.14, { type: 'sine', delay: i * 0.14, volume: 0.38 });
  }
}

// 10. Buzz — sharp sawtooth bursts
function patternBuzz() {
  tone(140, 0.24, { type: 'sawtooth', delay: 0.00, volume: 0.48 });
  tone(140, 0.24, { type: 'sawtooth', delay: 0.32, volume: 0.48 });
  tone(140, 0.24, { type: 'sawtooth', delay: 0.64, volume: 0.48 });
}

// ── Pattern registry ──────────────────────────────────────────────────────────

const ALARM_PATTERNS = {
  classic: { fn: patternClassic, interval: 1600 },
  chime:   { fn: patternChime,   interval: 2400 },
  digital: { fn: patternDigital, interval: 1200 },
  pulse:   { fn: patternPulse,   interval: 2000 },
  rise:    { fn: patternRise,    interval: 1600 },
  ping:    { fn: patternPing,    interval: 1800 },
  arcade:  { fn: patternArcade,  interval: 1400 },
  bell:    { fn: patternBell,    interval: 2200 },
  warble:  { fn: patternWarble,  interval: 1600 },
  buzz:    { fn: patternBuzz,    interval: 1400 },
};

// Exported metadata for the UI (no React deps)
export const ALARM_SOUNDS = [
  { id: 'classic', label: 'Classic',  desc: 'Urgent two-tone'       },
  { id: 'chime',   label: 'Chime',    desc: 'Soft ascending bells'  },
  { id: 'digital', label: 'Digital',  desc: 'Fast electronic beeps' },
  { id: 'pulse',   label: 'Pulse',    desc: 'Deep bass throb'       },
  { id: 'rise',    label: 'Rise',     desc: 'Ascending sweep'       },
  { id: 'ping',    label: 'Ping',     desc: 'Clean crisp tone'      },
  { id: 'arcade',  label: 'Arcade',   desc: 'Retro game blips'      },
  { id: 'bell',    label: 'Bell',     desc: 'Warm marimba bell'     },
  { id: 'warble',  label: 'Warble',   desc: 'Oscillating wave'      },
  { id: 'buzz',    label: 'Buzz',     desc: 'Sharp buzzer'          },
];

// Preview a sound once (no loop)
export function previewAlarmSound(id) {
  try {
    getCtx();
    const p = ALARM_PATTERNS[id] ?? ALARM_PATTERNS.classic;
    p.fn();
  } catch (_) {}
}

// ── Alarm looping ─────────────────────────────────────────────────────────────
let alarmTimer = null;

export function startAlarm(soundId = 'classic') {
  stopAlarm();
  try {
    getCtx();
    const p = ALARM_PATTERNS[soundId] ?? ALARM_PATTERNS.classic;
    p.fn();
    alarmTimer = setInterval(p.fn, p.interval);
  } catch (_) {}
}

export function stopAlarm() {
  if (alarmTimer) {
    clearInterval(alarmTimer);
    alarmTimer = null;
  }
}
