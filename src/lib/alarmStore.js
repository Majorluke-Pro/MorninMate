const CACHE_KEY = 'mm_alarms_cache';
const OPS_KEY   = 'mm_pending_ops';

export function getCachedAlarms() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) ?? '[]'); }
  catch { return []; }
}

export function setCachedAlarms(alarms) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(alarms)); }
  catch {}
}

export function getPendingOps() {
  try { return JSON.parse(localStorage.getItem(OPS_KEY) ?? '[]'); }
  catch { return []; }
}

export function addPendingOp(op) {
  try {
    const ops = getPendingOps();
    ops.push({ id: crypto.randomUUID(), ...op });
    localStorage.setItem(OPS_KEY, JSON.stringify(ops));
  } catch {}
}

export function clearPendingOps() {
  try { localStorage.removeItem(OPS_KEY); }
  catch {}
}
