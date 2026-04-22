const CACHE_KEY = 'mm_alarms_cache';
const OPS_KEY = 'mm_pending_ops';
const USER_KEY = 'mm_user_cache';
const WAKE_STATS_KEY = 'mm_wake_stats_cache';
const AUTH_KEY = 'mm_last_auth_user';
const PROFILE_SYNC_KEY = 'mm_pending_profile_sync';
const WAKE_SESSIONS_KEY = 'mm_pending_wake_sessions';

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function removeKey(key) {
  try {
    localStorage.removeItem(key);
  } catch {}
}

export function getCachedAlarms() {
  return readJson(CACHE_KEY, []);
}

export function setCachedAlarms(alarms) {
  writeJson(CACHE_KEY, alarms);
}

export function getCachedUser() {
  return readJson(USER_KEY, null);
}

export function setCachedUser(user) {
  writeJson(USER_KEY, user);
}

export function clearCachedUser() {
  removeKey(USER_KEY);
}

export function getCachedWakeStats() {
  return readJson(WAKE_STATS_KEY, { success: 0, failed: 0, loading: false });
}

export function setCachedWakeStats(stats) {
  writeJson(WAKE_STATS_KEY, stats);
}

export function clearCachedWakeStats() {
  removeKey(WAKE_STATS_KEY);
}

export function getCachedAuthUser() {
  return readJson(AUTH_KEY, null);
}

export function setCachedAuthUser(authUser) {
  writeJson(AUTH_KEY, authUser);
}

export function clearCachedAuthUser() {
  removeKey(AUTH_KEY);
}

export function getPendingOps() {
  return readJson(OPS_KEY, []);
}

export function addPendingOp(op) {
  const ops = getPendingOps();
  ops.push({ id: crypto.randomUUID(), ...op });
  writeJson(OPS_KEY, ops);
}

export function replacePendingOps(ops) {
  writeJson(OPS_KEY, ops);
}

export function clearPendingOps() {
  removeKey(OPS_KEY);
}

export function getPendingProfileSync() {
  return readJson(PROFILE_SYNC_KEY, null);
}

export function setPendingProfileSync(profileSync) {
  writeJson(PROFILE_SYNC_KEY, profileSync);
}

export function clearPendingProfileSync() {
  removeKey(PROFILE_SYNC_KEY);
}

export function getPendingWakeSessions() {
  return readJson(WAKE_SESSIONS_KEY, []);
}

export function setPendingWakeSessions(wakeSessions) {
  writeJson(WAKE_SESSIONS_KEY, wakeSessions);
}

export function upsertPendingWakeSession(wakeSession) {
  const sessions = getPendingWakeSessions();
  const next = sessions.some((entry) => entry.localId === wakeSession.localId)
    ? sessions.map((entry) => (entry.localId === wakeSession.localId ? wakeSession : entry))
    : [...sessions, wakeSession];
  writeJson(WAKE_SESSIONS_KEY, next);
}

export function removePendingWakeSession(localId) {
  const sessions = getPendingWakeSessions();
  writeJson(
    WAKE_SESSIONS_KEY,
    sessions.filter((entry) => entry.localId !== localId)
  );
}

export function clearPendingWakeSessions() {
  removeKey(WAKE_SESSIONS_KEY);
}
