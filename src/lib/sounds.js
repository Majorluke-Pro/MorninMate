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
  tone(659, 0.10, { delay: 0.00, volume: 0.20 });
  tone(880, 0.16, { delay: 0.09, volume: 0.20 });
}

// ── Alarm sound (looping) ─────────────────────────────────────────────────────
let alarmTimer = null;

function alarmPattern() {
  // Urgent two-tone alarm pattern
  tone(1000, 0.18, { type: 'square', delay: 0.00, volume: 0.55 });
  tone(1250, 0.18, { type: 'square', delay: 0.22, volume: 0.55 });
  tone(1000, 0.18, { type: 'square', delay: 0.44, volume: 0.55 });
  tone(1250, 0.18, { type: 'square', delay: 0.66, volume: 0.55 });
}

export function startAlarm() {
  try { getCtx(); } catch (_) { return; }
  alarmPattern();
  alarmTimer = setInterval(alarmPattern, 1600);
}

export function stopAlarm() {
  if (alarmTimer) {
    clearInterval(alarmTimer);
    alarmTimer = null;
  }
}
