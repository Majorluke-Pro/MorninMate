import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { supabase } from '../lib/supabase';
import {
  isNative,
  requestNotificationPermission,
  scheduleAlarm,
  cancelAlarmNotifications,
  syncAllAlarms,
  vibrateAlarm,
  onNotificationTap,
  getPendingAlarm,
  dismissAlarm,
  checkAndRequestAlarmPermissions,
  getAlarmPermissionStatus,
  requestAlarmPermissions,
} from '../lib/nativeAlarms';
import {
  addPendingOp,
  clearCachedAuthUser,
  clearCachedUser,
  clearCachedWakeStats,
  clearPendingOps,
  clearPendingProfileSync,
  clearPendingWakeSessions,
  getCachedAlarms,
  getCachedAuthUser,
  getCachedUser,
  getCachedWakeStats,
  getPendingOps,
  getPendingProfileSync,
  getPendingWakeSessions,
  removePendingWakeSession,
  replacePendingOps,
  setCachedAlarms,
  setCachedAuthUser,
  setCachedUser,
  setCachedWakeStats,
  setPendingProfileSync,
  upsertPendingWakeSession,
} from '../lib/alarmStore';

const AppContext = createContext(null);

function getStoredProfileIcon() {
  try {
    return localStorage.getItem('mm_profile_icon') || 'bolt';
  } catch {
    return 'bolt';
  }
}

const INITIAL_USER = {
  name: '',
  age: '',
  country: '',
  wakeTime: '07:00',
  morningRating: 3,
  favoriteGame: 'math',
  wakeGoal: '',
  profileIcon: getStoredProfileIcon(),
  onboardingComplete: false,
  level: 1,
  xp: 0,
  demerits: 0,
  streak: 0,
};

const INITIAL_WAKE_STATS = { success: 0, failed: 0, loading: false };
const INITIAL_NATIVE_ALARM_STATUS = {
  isNative,
  loading: isNative,
  exactAlarm: !isNative,
  postNotifications: !isNative,
  fullScreenIntent: !isNative,
  batteryOptimization: !isNative,
};
const XP_PER_LEVEL = 100;
const WAKE_REWARD = { gentle: 20, moderate: 35, intense: 60, hardcore: 100 };
const AUTH_BOOT_TIMEOUT_MS = 4000;
const PROFILE_SYNC_COMPAT_COLUMNS = [
  'age',
  'country',
  'wake_time',
  'morning_rating',
  'favorite_game',
  'wake_goal',
  'profile_icon',
  'onboarding_complete',
  'level',
  'xp',
  'demerits',
  'streak',
  'updated_at',
];
const UNSUPPORTED_PROFILE_COLUMNS_KEY = 'mm_unsupported_profile_columns';

function getStoredUnsupportedProfileColumns() {
  try {
    const raw = localStorage.getItem(UNSUPPORTED_PROFILE_COLUMNS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((column) => PROFILE_SYNC_COMPAT_COLUMNS.includes(column))
      : [];
  } catch {
    return [];
  }
}

const unsupportedProfileColumns = new Set(getStoredUnsupportedProfileColumns());

function persistUnsupportedProfileColumns() {
  try {
    if (unsupportedProfileColumns.size === 0) {
      localStorage.removeItem(UNSUPPORTED_PROFILE_COLUMNS_KEY);
      return;
    }
    localStorage.setItem(UNSUPPORTED_PROFILE_COLUMNS_KEY, JSON.stringify([...unsupportedProfileColumns]));
  } catch {}
}

function normalizeAge(value) {
  if (value === null || value === undefined || value === '') return '';
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return '';
  return String(parsed);
}

function ageToDbValue(value) {
  const normalized = normalizeAge(value);
  return normalized ? Number(normalized) : null;
}

function normalizeCountry(value) {
  return value?.trim?.() || '';
}

function stripUnsupportedProfileExtras(payload) {
  if (unsupportedProfileColumns.size === 0) return payload;
  const nextPayload = { ...payload };
  unsupportedProfileColumns.forEach((column) => {
    delete nextPayload[column];
  });
  return nextPayload;
}

function findMissingOptionalProfileColumn(error) {
  const errorText = JSON.stringify(error ?? '');
  const lowerErrorText = errorText.toLowerCase();
  if (!lowerErrorText.includes('profiles') && !lowerErrorText.includes('column') && !lowerErrorText.includes('schema cache')) return null;

  const quotedColumnMatch = errorText.match(/'([^']+)' column of 'profiles'/i);
  if (quotedColumnMatch?.[1] && PROFILE_SYNC_COMPAT_COLUMNS.includes(quotedColumnMatch[1])) {
    return quotedColumnMatch[1];
  }

  return PROFILE_SYNC_COMPAT_COLUMNS.find((column) => lowerErrorText.includes(column.toLowerCase())) || null;
}

function markProfileExtrasUnsupported(error) {
  const missingColumn = findMissingOptionalProfileColumn(error);
  if (!missingColumn || unsupportedProfileColumns.has(missingColumn)) return false;
  unsupportedProfileColumns.add(missingColumn);
  persistUnsupportedProfileColumns();
  return true;
}

function newProfilePayload(userId, data) {
  if (data.profileIcon) {
    try {
      localStorage.setItem('mm_profile_icon', data.profileIcon);
    } catch {}
  }

  return stripUnsupportedProfileExtras({
    id: userId,
    name: data.name,
    age: ageToDbValue(data.age),
    country: normalizeCountry(data.country),
    wake_time: data.wakeTime,
    morning_rating: data.morningRating,
    favorite_game: data.favoriteGame,
    wake_goal: data.wakeGoal,
    profile_icon: data.profileIcon || getStoredProfileIcon(),
    onboarding_complete: true,
    level: 1,
    xp: 0,
    demerits: 0,
    streak: 0,
    updated_at: new Date().toISOString(),
  });
}

function rowToUser(row) {
  const profileIcon = row.profile_icon || getStoredProfileIcon();
  return {
    name: row.name || '',
    age: normalizeAge(row.age),
    country: normalizeCountry(row.country),
    wakeTime: row.wake_time || '07:00',
    morningRating: row.morning_rating ?? 3,
    favoriteGame: row.favorite_game || 'math',
    wakeGoal: row.wake_goal || '',
    profileIcon,
    onboardingComplete: row.onboarding_complete ?? false,
    level: row.level ?? 1,
    xp: row.xp ?? 0,
    demerits: row.demerits ?? 0,
    streak: row.streak ?? 0,
  };
}

function userToProfileSync(user) {
  return stripUnsupportedProfileExtras({
    name: user.name || '',
    age: ageToDbValue(user.age),
    country: normalizeCountry(user.country),
    wake_time: user.wakeTime || '07:00',
    morning_rating: user.morningRating ?? 3,
    favorite_game: user.favoriteGame || 'math',
    wake_goal: user.wakeGoal || '',
    profile_icon: user.profileIcon || getStoredProfileIcon(),
    onboarding_complete: user.onboardingComplete ?? false,
    updated_at: new Date().toISOString(),
  });
}

async function upsertProfileRecord(userId, payload) {
  let result;

  for (let attempt = 0; attempt <= PROFILE_SYNC_COMPAT_COLUMNS.length; attempt += 1) {
    result = await supabase.from('profiles').upsert({
      id: userId,
      ...stripUnsupportedProfileExtras(payload),
    });

    if (!result.error) return result;
    if (!markProfileExtrasUnsupported(result.error)) return result;
  }

  return result;
}

async function updateProfileRecord(userId, payload) {
  let result;

  for (let attempt = 0; attempt <= PROFILE_SYNC_COMPAT_COLUMNS.length; attempt += 1) {
    result = await supabase
      .from('profiles')
      .update(stripUnsupportedProfileExtras(payload))
      .eq('id', userId);

    if (!result.error) return result;
    if (!markProfileExtrasUnsupported(result.error)) return result;
  }

  return result;
}

function normalizeAlarmDays(days) {
  return (days || [])
    .map(Number)
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);
}

function rowToAlarm(row) {
  return {
    id: row.id,
    label: row.label,
    time: row.time,
    sound: row.pulse?.sound || 'gentle_chime',
    pulse: row.pulse,
    active: row.active,
    days: normalizeAlarmDays(row.days),
  };
}

function progressionToUser(updates) {
  return {
    xp: updates.xp,
    level: updates.level,
    demerits: updates.demerits,
    streak: updates.streak,
  };
}

function applyWakeFailToUser(user) {
  const nextXp = Math.max((user.xp ?? 0) - 20, 0);
  return {
    ...user,
    xp: nextXp,
    level: Math.max(Math.floor(nextXp / XP_PER_LEVEL) + 1, 1),
    demerits: (user.demerits ?? 0) + 1,
    streak: 0,
  };
}

function applyWakeCompletionToUser(user, status, intensity) {
  if (status !== 'success') return user;

  const reward = WAKE_REWARD[intensity] ?? 0;
  const nextXp = (user.xp ?? 0) + reward;

  return {
    ...user,
    xp: nextXp,
    level: Math.floor(nextXp / XP_PER_LEVEL) + 1,
    streak: (user.streak ?? 0) + 1,
  };
}

function stripAuthParamsFromUrl(urlString) {
  const url = new URL(urlString);
  const paramsToRemove = ['code', 'error', 'error_code', 'error_description'];
  let changed = false;

  paramsToRemove.forEach((key) => {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  });

  if (!changed) return;

  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState({}, document.title, nextUrl || '/');
}

function buildOfflineUser(data) {
  return {
    ...INITIAL_USER,
    ...data,
    age: normalizeAge(data.age),
    country: normalizeCountry(data.country),
    profileIcon: data.profileIcon || getStoredProfileIcon(),
    onboardingComplete: true,
  };
}

function hasLocalAccess(userSnapshot, alarmSnapshot) {
  return Boolean(userSnapshot?.onboardingComplete || (alarmSnapshot?.length ?? 0) > 0);
}

async function getSessionWithTimeout() {
  return Promise.race([
    supabase.auth.getSession(),
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error('Auth bootstrap timed out')), AUTH_BOOT_TIMEOUT_MS);
    }),
  ]);
}

export function AppProvider({ children }) {
  const initialCachedUser = getCachedUser();
  const initialCachedAlarms = getCachedAlarms();

  const [session, setSession] = useState(null);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [user, setUser] = useState(() => initialCachedUser ?? INITIAL_USER);
  const [alarms, setAlarms] = useState(() => initialCachedAlarms);
  const [activeAlarm, setActiveAlarm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wakeStats, setWakeStats] = useState(() => ({
    ...INITIAL_WAKE_STATS,
    ...getCachedWakeStats(),
    loading: false,
  }));
  const [offlineAccess, setOfflineAccess] = useState(() => hasLocalAccess(initialCachedUser, initialCachedAlarms));
  const [cloudReachable, setCloudReachable] = useState(() => navigator.onLine);
  const [nativeAlarmStatus, setNativeAlarmStatus] = useState(INITIAL_NATIVE_ALARM_STATUS);

  const [pendingOnboarding, setPendingOnboardingState] = useState(() => {
    const saved = sessionStorage.getItem('mm_pending_onboarding');
    return saved ? JSON.parse(saved) : null;
  });

  const [showAuthDirectly, setShowAuthDirectly] = useState(false);

  const loadingData = useRef(false);
  const appUrlListenerRef = useRef(null);
  const appStateListenerRef = useRef(null);
  const lastFiredRef = useRef(null);
  const alarmsRef = useRef(alarms);
  const activeRef = useRef(activeAlarm);
  const sessionRef = useRef(session);
  const userRef = useRef(user);
  const wakeSessionRef = useRef(null);

  alarmsRef.current = alarms;
  activeRef.current = activeAlarm;
  sessionRef.current = session;
  userRef.current = user;

  const applyUserSnapshot = useCallback((nextValue) => {
    let resolved;
    setUser((prev) => {
      resolved = typeof nextValue === 'function' ? nextValue(prev) : nextValue;
      setCachedUser(resolved);
      if (resolved?.profileIcon) {
        try {
          localStorage.setItem('mm_profile_icon', resolved.profileIcon);
        } catch {}
      }
      return resolved;
    });
    return resolved;
  }, []);

  const applyWakeStatsSnapshot = useCallback((nextValue) => {
    let resolved;
    setWakeStats((prev) => {
      const candidate = typeof nextValue === 'function' ? nextValue(prev) : nextValue;
      resolved = {
        success: candidate?.success ?? 0,
        failed: candidate?.failed ?? 0,
        loading: candidate?.loading ?? false,
      };
      setCachedWakeStats(resolved);
      return resolved;
    });
    return resolved;
  }, []);

  const queueProfileSync = useCallback((userSnapshot) => {
    setPendingProfileSync(userToProfileSync(userSnapshot));
  }, []);

  const applyLocalWakeFail = useCallback(() => {
    let nextUser;
    applyUserSnapshot((prev) => {
      nextUser = applyWakeFailToUser(prev);
      return nextUser;
    });
    return nextUser;
  }, [applyUserSnapshot]);

  const applyLocalWakeCompletion = useCallback((status, intensity) => {
    let nextUser;
    applyUserSnapshot((prev) => {
      nextUser = applyWakeCompletionToUser(prev, status, intensity);
      return nextUser;
    });
    return nextUser;
  }, [applyUserSnapshot]);

  const markWakeOutcomeLocally = useCallback((status, intensity) => {
    if (status === 'success') {
      applyLocalWakeCompletion(status, intensity);
    }

    applyWakeStatsSnapshot((prev) => ({
      ...prev,
      [status]: (prev?.[status] ?? 0) + 1,
      loading: false,
    }));
  }, [applyLocalWakeCompletion, applyWakeStatsSnapshot]);

  function getResolvedUserId() {
    return sessionRef.current?.user?.id ?? getCachedAuthUser()?.id ?? null;
  }

  async function refreshNativeAlarmStatus() {
    if (!isNative) return INITIAL_NATIVE_ALARM_STATUS;

    setNativeAlarmStatus((prev) => ({ ...prev, loading: true }));
    try {
      const status = await getAlarmPermissionStatus();
      const nextStatus = {
        ...INITIAL_NATIVE_ALARM_STATUS,
        ...status,
        isNative: true,
        loading: false,
      };
      setNativeAlarmStatus(nextStatus);
      return nextStatus;
    } catch (error) {
      console.warn('Failed to read native alarm status:', error);
      setNativeAlarmStatus((prev) => ({ ...prev, loading: false }));
      return null;
    }
  }

  async function requestNativeAlarmPermissions() {
    if (!isNative) return INITIAL_NATIVE_ALARM_STATUS;

    setNativeAlarmStatus((prev) => ({ ...prev, loading: true }));
    try {
      const status = await requestAlarmPermissions();
      const nextStatus = {
        ...INITIAL_NATIVE_ALARM_STATUS,
        ...status,
        isNative: true,
        loading: false,
      };
      setNativeAlarmStatus(nextStatus);
      return nextStatus;
    } catch (error) {
      console.warn('Failed to request native alarm permissions:', error);
      setNativeAlarmStatus((prev) => ({ ...prev, loading: false }));
      return null;
    }
  }

  function loadCachedState() {
    const cachedUser = getCachedUser();
    const cachedAlarms = getCachedAlarms();
    const cachedStats = getCachedWakeStats();

    if (cachedUser) applyUserSnapshot(cachedUser);
    if (cachedAlarms.length > 0) {
      setAlarms(cachedAlarms);
      void syncAllAlarms(cachedAlarms);
    }
    applyWakeStatsSnapshot({
      ...INITIAL_WAKE_STATS,
      ...cachedStats,
      loading: false,
    });

    const canUseOffline = hasLocalAccess(cachedUser, cachedAlarms);
    setOfflineAccess(canUseOffline);
    return canUseOffline;
  }

  function clearLocalState({ preservePendingOps = false, preserveAuthUser = false } = {}) {
    setCachedAlarms([]);
    if (!preservePendingOps) clearPendingOps();
    clearPendingProfileSync();
    clearPendingWakeSessions();
    clearCachedUser();
    clearCachedWakeStats();
    if (!preserveAuthUser) clearCachedAuthUser();
    sessionStorage.removeItem('mm_pending_onboarding');
    setPendingOnboardingState(null);
    setShowAuthDirectly(false);
    setOfflineAccess(false);
    setUser(INITIAL_USER);
    setAlarms([]);
    setActiveAlarm(null);
    applyWakeStatsSnapshot(INITIAL_WAKE_STATS);
    wakeSessionRef.current = null;
  }

  function applyAlarmSnapshot(nextAlarms) {
    const nextIds = new Set(nextAlarms.map((alarm) => String(alarm.id)));

    for (const alarm of alarmsRef.current) {
      if (!nextIds.has(String(alarm.id))) {
        void cancelAlarmNotifications(alarm.id);
      }
    }

    if (activeRef.current && !nextIds.has(String(activeRef.current.id))) {
      setActiveAlarm(null);
    }

    setCachedAlarms(nextAlarms);
    setAlarms(nextAlarms);
    void syncAllAlarms(nextAlarms);
  }

  function alarmFromPendingAdd(op, fallbackUserId) {
    if (op.type !== 'add' || !op.payload?.id || !op.payload?.time) return null;
    if (op.payload.userId && fallbackUserId && op.payload.userId !== fallbackUserId) return null;

    const pulse = op.payload.pulse ?? {};
    return {
      id: op.payload.id,
      label: op.payload.label || 'Alarm',
      time: op.payload.time,
      sound: pulse.sound || 'gentle_chime',
      pulse,
      active: op.payload.active ?? true,
      days: normalizeAlarmDays(op.payload.days),
    };
  }

  function mergePendingAddAlarms(baseAlarms, userId) {
    const next = [...baseAlarms];
    const seen = new Set(next.map((alarm) => String(alarm.id)));

    for (const op of getPendingOps()) {
      const alarm = alarmFromPendingAdd(op, userId);
      if (!alarm || seen.has(String(alarm.id))) continue;
      seen.add(String(alarm.id));
      next.push(alarm);
    }

    return next;
  }

  async function flushPendingAlarmOps(userId) {
    const ops = getPendingOps();
    if (ops.length === 0) return true;

    for (const op of ops) {
      try {
        if (op.type === 'add') {
          const resolvedUserId = op.payload.userId ?? userId;
          if (!resolvedUserId) return false;

          const { error } = await supabase.from('alarms').upsert({
            id: op.payload.id,
            user_id: resolvedUserId,
            label: op.payload.label,
            time: op.payload.time,
            pulse: op.payload.pulse,
            active: op.payload.active,
            days: op.payload.days,
          });
          if (error) return false;
        } else if (op.type === 'toggle') {
          const { error } = await supabase
            .from('alarms')
            .update({ active: op.payload.active })
            .eq('id', op.payload.id);
          if (error) return false;
        } else if (op.type === 'delete') {
          const { error } = await supabase.from('alarms').delete().eq('id', op.payload.id);
          if (error) return false;
        } else if (op.type === 'edit') {
          const { error } = await supabase
            .from('alarms')
            .update(op.payload.updates)
            .eq('id', op.payload.id);
          if (error) return false;
        }

        replacePendingOps(getPendingOps().filter((entry) => entry.id !== op.id));
      } catch {
        setCloudReachable(false);
        return false;
      }
    }

    return true;
  }

  async function flushPendingProfile(userId) {
    const pendingProfile = getPendingProfileSync();
    if (!pendingProfile) return true;
    if (!userId) return false;

    try {
      const { error } = await upsertProfileRecord(userId, pendingProfile);

      if (error) return false;

      clearPendingProfileSync();
      return true;
    } catch {
      setCloudReachable(false);
      return false;
    }
  }

  async function flushPendingWakeSessions(userId) {
    const pendingWakeSessions = getPendingWakeSessions();
    if (pendingWakeSessions.length === 0) return true;
    if (!userId) return false;

    for (const pendingWakeSession of pendingWakeSessions) {
      let remoteSessionId = pendingWakeSession.remoteSessionId ?? null;
      let syncedFails = pendingWakeSession.syncedFails ?? 0;

      try {
        if (!remoteSessionId) {
          const { data, error } = await supabase
            .from('wake_sessions')
            .insert({
              user_id: pendingWakeSession.userId ?? userId,
              alarm_id: pendingWakeSession.alarmId ?? null,
              started_at: pendingWakeSession.startedAt,
              status: 'in_progress',
              intensity: pendingWakeSession.intensity,
              games: pendingWakeSession.games,
              total_fails: 0,
            })
            .select('id')
            .single();

          if (error || !data?.id) {
            upsertPendingWakeSession({
              ...pendingWakeSession,
              remoteSessionId,
              syncedFails,
            });
            return false;
          }

          remoteSessionId = data.id;
        }

        while (syncedFails < pendingWakeSession.totalFails) {
          const { error } = await supabase.rpc('record_wake_game_fail', {
            p_session_id: remoteSessionId,
          });

          if (error) {
            upsertPendingWakeSession({
              ...pendingWakeSession,
              remoteSessionId,
              syncedFails,
            });
            return false;
          }

          syncedFails += 1;
        }

        const { error } = await supabase.rpc('complete_wake_session', {
          p_session_id: remoteSessionId,
          p_status: pendingWakeSession.status,
          p_results: pendingWakeSession.results,
        });

        if (error) {
          upsertPendingWakeSession({
            ...pendingWakeSession,
            remoteSessionId,
            syncedFails,
          });
          return false;
        }

        removePendingWakeSession(pendingWakeSession.localId);
      } catch {
        setCloudReachable(false);
        upsertPendingWakeSession({
          ...pendingWakeSession,
          remoteSessionId,
          syncedFails,
        });
        return false;
      }
    }

    return true;
  }

  async function refreshRemoteAlarms(
    userId,
    { preserveCachedWhilePending = false, syncPermissions = false, checkPendingAlarm = false } = {}
  ) {
    if (!userId || !navigator.onLine) return false;

    let pendingOpsFlushed = false;
    try {
      pendingOpsFlushed = await flushPendingAlarmOps(userId);
    } catch {
      pendingOpsFlushed = false;
    }

    try {
      const { data, error } = await supabase
        .from('alarms')
        .select('*')
        .eq('user_id', userId)
        .order('created_at');

      if (error) {
        console.error('Alarms fetch error:', error);
        setCloudReachable(false);
        return false;
      }

      setCloudReachable(true);

      const cached = mergePendingAddAlarms(getCachedAlarms(), userId);
      const mapped = (data ?? []).map(rowToAlarm);
      const shouldPreserveCached =
        preserveCachedWhilePending &&
        !pendingOpsFlushed &&
        getPendingOps().length > 0 &&
        cached.length > 0;
      const nextAlarms = shouldPreserveCached ? cached : mergePendingAddAlarms(mapped, userId);

      applyAlarmSnapshot(nextAlarms);
      if (syncPermissions) {
        checkAndRequestAlarmPermissions()
          .then((status) => {
            if (status && isNative) {
              setNativeAlarmStatus({
                ...INITIAL_NATIVE_ALARM_STATUS,
                ...status,
                isNative: true,
                loading: false,
              });
            }
          })
          .catch(() => {});
      }

      if (checkPendingAlarm) {
        const pendingAlarmId = await getPendingAlarm();
        if (pendingAlarmId) {
          const alarm = nextAlarms.find((entry) => String(entry.id) === pendingAlarmId);
          if (alarm) {
            vibrateAlarm();
            setActiveAlarm(alarm);
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Alarms fetch error:', error);
      setCloudReachable(false);
      return false;
    }
  }

  const refreshWakeStats = useCallback(async (userId) => {
    const resolvedUserId = userId ?? sessionRef.current?.user?.id;
    if (!resolvedUserId) {
      applyWakeStatsSnapshot((prev) => ({ ...prev, loading: false }));
      return;
    }

    if (!navigator.onLine) {
      applyWakeStatsSnapshot((prev) => ({ ...prev, loading: false }));
      return;
    }

    applyWakeStatsSnapshot((prev) => ({ ...prev, loading: true }));

    try {
      const wakeSessionsFlushed = await flushPendingWakeSessions(resolvedUserId);
      if (!wakeSessionsFlushed && getPendingWakeSessions().length > 0) {
        applyWakeStatsSnapshot((prev) => ({ ...prev, loading: false }));
        return;
      }

      const [successRes, failedRes] = await Promise.all([
        supabase
          .from('wake_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', resolvedUserId)
          .eq('status', 'success'),
        supabase
          .from('wake_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', resolvedUserId)
          .eq('status', 'failed'),
      ]);

      if (successRes.error || failedRes.error) {
        applyWakeStatsSnapshot((prev) => ({ ...prev, loading: false }));
        setCloudReachable(false);
        return;
      }

      setCloudReachable(true);
      applyWakeStatsSnapshot({
        success: successRes.count ?? 0,
        failed: failedRes.count ?? 0,
        loading: false,
      });
    } catch {
      applyWakeStatsSnapshot((prev) => ({ ...prev, loading: false }));
      setCloudReachable(false);
    }
  }, [applyWakeStatsSnapshot]);

  async function loadUserData(userId, { force = false } = {}) {
    if (loadingData.current && !force) return;
    loadingData.current = true;

    const cachedUser = getCachedUser();
    const cachedAlarms = mergePendingAddAlarms(getCachedAlarms(), userId);
    const cachedStats = getCachedWakeStats();
    const canBootFromCache =
      hasLocalAccess(cachedUser, cachedAlarms) ||
      (cachedStats.success ?? 0) > 0 ||
      (cachedStats.failed ?? 0) > 0;

    if (cachedUser) applyUserSnapshot(cachedUser);
    if (cachedAlarms.length > 0) {
      setAlarms(cachedAlarms);
      void syncAllAlarms(cachedAlarms);
    }
    applyWakeStatsSnapshot({
      ...INITIAL_WAKE_STATS,
      ...cachedStats,
      loading: false,
    });

    if (canBootFromCache) {
      setOfflineAccess(true);
      setLoading(false);
    } else {
      setLoading(true);
    }

    if (!navigator.onLine) {
      loadingData.current = false;
      setLoading(false);
      return;
    }

    try {
      await flushPendingProfile(userId);

      const profileResult = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();

      if (profileResult.error) {
        console.error('Profile fetch error:', profileResult.error);
        setCloudReachable(false);
      } else if (profileResult.data) {
        applyUserSnapshot(rowToUser(profileResult.data));
        setOfflineAccess(true);
        setCloudReachable(true);
      }

      await refreshRemoteAlarms(userId, {
        preserveCachedWhilePending: true,
        syncPermissions: true,
        checkPendingAlarm: true,
      });

      await refreshWakeStats(userId);
    } finally {
      loadingData.current = false;
      setLoading(false);
    }
  }

  async function handlePostAuth(nextSession) {
    if (loadingData.current) return;
    loadingData.current = true;
    setLoading(true);

    const userId = nextSession.user.id;

    try {
      const { data: existing } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('id', userId)
        .maybeSingle();

      if (existing?.onboarding_complete && !sessionStorage.getItem('mm_pending_onboarding') && !getPendingProfileSync()) {
        loadingData.current = false;
        await loadUserData(userId);
        return;
      }

      const pendingRaw = sessionStorage.getItem('mm_pending_onboarding');
      const pendingProfile = getPendingProfileSync();

      if (pendingRaw) {
        const pending = JSON.parse(pendingRaw);
        const { error } = await upsertProfileRecord(userId, newProfilePayload(userId, pending));
        if (!error) {
          sessionStorage.removeItem('mm_pending_onboarding');
          setPendingOnboardingState(null);
          clearPendingProfileSync();
        }
      } else if (pendingProfile) {
        const { error } = await upsertProfileRecord(userId, pendingProfile);

        if (!error) {
          clearPendingProfileSync();
        }
      }

      await loadUserData(userId, { force: true });
    } finally {
      loadingData.current = false;
      setLoading(false);
    }
  }

  function setPendingOnboarding(data) {
    sessionStorage.setItem('mm_pending_onboarding', JSON.stringify(data));
    setPendingOnboardingState(data);
  }

  function enterOfflineMode(seedData = pendingOnboarding) {
    const cachedUser = getCachedUser();
    const cachedAlarms = getCachedAlarms();
    const canUseExistingLocalData = hasLocalAccess(cachedUser, cachedAlarms);

    if (seedData) {
      const offlineUser = buildOfflineUser(seedData);
      applyUserSnapshot(offlineUser);
      queueProfileSync(offlineUser);
      sessionStorage.removeItem('mm_pending_onboarding');
      setPendingOnboardingState(null);
      setOfflineAccess(true);
    } else if (canUseExistingLocalData) {
      loadCachedState();
    } else {
      return false;
    }

    setShowAuthDirectly(false);
    setLoading(false);
    return true;
  }

  useEffect(() => {
    let active = true;
    let subscription;

    async function hydrateAndSubscribe() {
      const canBootFromCache = loadCachedState();
      if (canBootFromCache) {
        setLoading(false);
        setAuthInitialized(true);
      }

      try {
        const {
          data: { session: initialSession },
          error,
        } = await getSessionWithTimeout();

        if (!active) return;
        if (error) throw error;

        setSession(initialSession);

        if (initialSession?.user) {
          setCachedAuthUser({
            id: initialSession.user.id,
            email: initialSession.user.email ?? '',
          });
          setOfflineAccess(true);
          await loadUserData(initialSession.user.id);
        } else if (!hasLocalAccess(getCachedUser(), getCachedAlarms())) {
          setUser(INITIAL_USER);
          setAlarms([]);
          setActiveAlarm(null);
          applyWakeStatsSnapshot(INITIAL_WAKE_STATS);
          setLoading(false);
          setOfflineAccess(false);
        }
      } catch (error) {
        console.warn('Falling back to local cache:', error);
        setCloudReachable(false);
        setLoading(false);
      } finally {
        if (active) setAuthInitialized(true);
      }

      if (!active) return;

      const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
        if (event === 'INITIAL_SESSION') return;

        if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          setSession(nextSession);
          if (nextSession?.user) {
            setCachedAuthUser({
              id: nextSession.user.id,
              email: nextSession.user.email ?? '',
            });
            setOfflineAccess(true);
            setCloudReachable(true);
          }
          return;
        }

        setSession(nextSession);

        if (nextSession?.user) {
          setCachedAuthUser({
            id: nextSession.user.id,
            email: nextSession.user.email ?? '',
          });
          setOfflineAccess(true);
          setCloudReachable(true);
          const _cu = getCachedUser();
          const _ca = getCachedAlarms();
          const _cs = getCachedWakeStats();
          const _hasCache = hasLocalAccess(_cu, _ca) || (_cs.success ?? 0) > 0 || (_cs.failed ?? 0) > 0;
          if (!_hasCache) setLoading(true);

          if (event === 'SIGNED_IN' && (sessionStorage.getItem('mm_pending_onboarding') || getPendingProfileSync())) {
            void handlePostAuth(nextSession);
          } else {
            void loadUserData(nextSession.user.id);
          }

          return;
        }

        loadingData.current = false;

        if (hasLocalAccess(getCachedUser(), getCachedAlarms())) {
          loadCachedState();
          setLoading(false);
        } else {
          setUser(INITIAL_USER);
          setAlarms([]);
          setActiveAlarm(null);
          applyWakeStatsSnapshot(INITIAL_WAKE_STATS);
          setLoading(false);
          setOfflineAccess(false);
        }
      });

      subscription = data.subscription;
    }

    void hydrateAndSubscribe();

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, [applyUserSnapshot, applyWakeStatsSnapshot, queueProfileSync, refreshWakeStats]);

  useEffect(() => {
    if (!isNative) return;

    void refreshNativeAlarmStatus();

    let handle;
    CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) void refreshNativeAlarmStatus();
    }).then((h) => { handle = h; });

    return () => { handle?.remove(); };
  }, []);

  useEffect(() => {
    CapacitorApp.addListener('appUrlOpen', async ({ url }) => {
      if (url && url.includes('login-callback')) {
        try {
          const urlObj = new URL(url);
          const code = urlObj.searchParams.get('code');
          if (code) {
            await supabase.auth.exchangeCodeForSession(code);
          }
        } catch (error) {
          console.error('Magic link session error:', error);
        }
      }
    }).then((handle) => {
      appUrlListenerRef.current = handle;
    });

    return () => {
      appUrlListenerRef.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (isNative) return;

    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    const hasAuthParams = ['code', 'error', 'error_code', 'error_description']
      .some((key) => url.searchParams.has(key));

    if (!hasAuthParams) return;

    let active = true;

    async function handleWebMagicLink() {
      try {
        const {
          data: { session: existingSession },
        } = await supabase.auth.getSession();

        if (!existingSession && code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('Magic link session error:', error);
            return;
          }
        }

        if (active) stripAuthParamsFromUrl(window.location.href);
      } catch (error) {
        console.error('Magic link session error:', error);
      }
    }

    void handleWebMagicLink();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const canUseAlarmFlow = !isNative && (session || offlineAccess || user.onboardingComplete);
    if (!canUseAlarmFlow) return;

    function checkAlarms() {
      if (activeRef.current) return;

      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const time = `${hh}:${mm}`;
      const day = now.getDay();

      for (const alarm of alarmsRef.current) {
        if (!alarm.active) continue;
        if (alarm.time !== time) continue;
        if (alarm.days?.length > 0 && !alarm.days.includes(day)) continue;

        const key = `${alarm.id}-${time}`;
        if (lastFiredRef.current === key) continue;

        lastFiredRef.current = key;
        setActiveAlarm(alarm);
        vibrateAlarm();

        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          try {
            new Notification('MorninMate', {
              body: alarm.label ? `${alarm.label} - Rise & Shine, Legend!` : 'Rise & Shine, Legend!',
              icon: '/icon-192.png',
              tag: 'morninmate-alarm',
              requireInteraction: true,
            });
          } catch {}
        }
        break;
      }
    }

    const interval = setInterval(checkAlarms, 5000);
    checkAlarms();
    return () => clearInterval(interval);
  }, [session, offlineAccess, user.onboardingComplete]);

  useEffect(() => {
    function handleAlarmFired(event) {
      let alarmId;
      try {
        alarmId = JSON.parse(event.detail).alarmId;
      } catch {
        alarmId = event.detail?.alarmId;
      }

      if (!alarmId || activeRef.current) return;

      const alarm = alarmsRef.current.find((entry) => String(entry.id) === alarmId);
      if (alarm) {
        vibrateAlarm();
        setActiveAlarm(alarm);
      }
    }

    document.addEventListener('alarmFired', handleAlarmFired);
    return () => document.removeEventListener('alarmFired', handleAlarmFired);
  }, []);

  useEffect(() => {
    if (!(session || offlineAccess)) return;
    const timeout = setTimeout(() => void requestNotificationPermission(), 4000);
    return () => clearTimeout(timeout);
  }, [session, offlineAccess]);

  useEffect(() => {
    if (!(session || offlineAccess)) return;
    const unsubscribe = onNotificationTap((alarmId) => {
      const alarm = alarmsRef.current.find((entry) => String(entry.id) === alarmId);
      if (alarm && !activeRef.current) {
        vibrateAlarm();
        setActiveAlarm(alarm);
      }
    });
    return unsubscribe;
  }, [session, offlineAccess]);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;

    const syncRemoteState = () => {
      void loadUserData(userId);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') syncRemoteState();
    };

    window.addEventListener('focus', syncRemoteState);
    window.addEventListener('online', syncRemoteState);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) syncRemoteState();
    }).then((handle) => {
      appStateListenerRef.current = handle;
    });

    return () => {
      window.removeEventListener('focus', syncRemoteState);
      window.removeEventListener('online', syncRemoteState);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      appStateListenerRef.current?.remove();
      appStateListenerRef.current = null;
    };
  }, [session?.user?.id]);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;

    const channel = supabase
      .channel(`alarms-sync-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alarms',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void refreshRemoteAlarms(userId);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  async function completeOnboarding(data) {
    const offlineUser = buildOfflineUser(data);
    applyUserSnapshot(offlineUser);
    queueProfileSync(offlineUser);
    setOfflineAccess(true);

    if (!sessionRef.current?.user?.id) {
      sessionStorage.removeItem('mm_pending_onboarding');
      setPendingOnboardingState(null);
      return;
    }

    const userId = sessionRef.current.user.id;
    const { error } = await upsertProfileRecord(userId, newProfilePayload(userId, data));

    if (error) {
      console.error('Failed to save profile:', error);
      if (error.code === '23503') {
        await supabase.auth.signOut();
        window.location.reload();
        return;
      }
      setCloudReachable(false);
      return;
    }

    clearPendingProfileSync();
    setCloudReachable(true);
  }

  async function addAlarm(alarm) {
    const localId = crypto.randomUUID();
    const payload = {
      id: localId,
      userId: getResolvedUserId(),
      label: alarm.label || 'Alarm',
      time: alarm.time,
      pulse: { ...(alarm.pulse ?? {}), sound: alarm.sound || 'gentle_chime' },
      active: true,
      days: alarm.days || [],
    };

    const localAlarm = {
      id: localId,
      label: payload.label,
      time: payload.time,
      sound: payload.pulse.sound,
      pulse: payload.pulse,
      active: true,
      days: payload.days,
    };

    const next = [...alarmsRef.current, localAlarm];
    setCachedAlarms(next);
    setAlarms(next);
    void scheduleAlarm(localAlarm);
    setOfflineAccess(true);

    const pendingOp = addPendingOp({ type: 'add', payload });

    if (!sessionRef.current?.user?.id || !navigator.onLine) {
      return;
    }

    try {
      const { error } = await supabase.from('alarms').upsert({
        id: localId,
        user_id: payload.userId,
        label: payload.label,
        time: payload.time,
        pulse: payload.pulse,
        active: payload.active,
        days: payload.days,
      });

      if (error) throw error;

      replacePendingOps(getPendingOps().filter((entry) => entry.id !== pendingOp.id));
      setCloudReachable(true);
    } catch {
      setCloudReachable(false);
    }
  }

  async function toggleAlarm(id) {
    const alarm = alarmsRef.current.find((entry) => entry.id === id);
    if (!alarm) return;

    const newActive = !alarm.active;
    const next = alarmsRef.current.map((entry) => (
      entry.id === id ? { ...entry, active: newActive } : entry
    ));

    setCachedAlarms(next);
    setAlarms(next);

    if (newActive) void scheduleAlarm({ ...alarm, active: newActive });
    else void cancelAlarmNotifications(id);

    if (!sessionRef.current?.user?.id || !navigator.onLine) {
      addPendingOp({ type: 'toggle', payload: { id, active: newActive } });
      return;
    }

    try {
      const { error } = await supabase.from('alarms').update({ active: newActive }).eq('id', id);
      if (error) throw error;
      setCloudReachable(true);
    } catch {
      setCloudReachable(false);
      addPendingOp({ type: 'toggle', payload: { id, active: newActive } });
    }
  }

  async function deleteAlarm(id) {
    const next = alarmsRef.current.filter((entry) => entry.id !== id);
    setCachedAlarms(next);
    setAlarms(next);
    void cancelAlarmNotifications(id);

    // Clear any pending add/toggle/edit ops for this alarm so they can't
    // resurrect it when flushed on next login
    replacePendingOps(getPendingOps().filter((op) => op.payload?.id !== id));

    if (!sessionRef.current?.user?.id || !navigator.onLine) {
      addPendingOp({ type: 'delete', payload: { id } });
      return;
    }

    try {
      const { error } = await supabase.from('alarms').delete().eq('id', id);
      if (error) throw error;
      setCloudReachable(true);
    } catch {
      setCloudReachable(false);
      addPendingOp({ type: 'delete', payload: { id } });
    }
  }

  async function editAlarm(id, updates) {
    const dbUpdates = {};
    if (updates.label !== undefined) dbUpdates.label = updates.label;
    if (updates.time !== undefined) dbUpdates.time = updates.time;
    if (updates.active !== undefined) dbUpdates.active = updates.active;
    if (updates.days !== undefined) dbUpdates.days = normalizeAlarmDays(updates.days);
    if (updates.pulse !== undefined || updates.sound !== undefined) {
      const existing = alarmsRef.current.find((entry) => entry.id === id);
      const basePulse = updates.pulse ?? existing?.pulse ?? {};
      dbUpdates.pulse = {
        ...basePulse,
        sound: updates.sound ?? existing?.sound ?? 'gentle_chime',
      };
    }

    const existing = alarmsRef.current.find((entry) => entry.id === id);
    const normalizedUpdates = {
      ...updates,
      ...(updates.days !== undefined ? { days: normalizeAlarmDays(updates.days) } : {}),
      ...(updates.pulse !== undefined || updates.sound !== undefined
        ? {
            sound: updates.sound ?? existing?.sound ?? 'gentle_chime',
            pulse: {
              ...(updates.pulse ?? existing?.pulse ?? {}),
              sound: updates.sound ?? existing?.sound ?? 'gentle_chime',
            },
          }
        : {}),
    };

    const next = alarmsRef.current.map((entry) => (
      entry.id === id ? { ...entry, ...normalizedUpdates } : entry
    ));
    const updatedAlarm = next.find((entry) => entry.id === id);

    setCachedAlarms(next);
    setAlarms(next);
    if (updatedAlarm) void scheduleAlarm(updatedAlarm);

    if (!sessionRef.current?.user?.id || !navigator.onLine) {
      addPendingOp({ type: 'edit', payload: { id, updates: dbUpdates } });
      return;
    }

    try {
      const { error } = await supabase.from('alarms').update(dbUpdates).eq('id', id);
      if (error) throw error;
      setCloudReachable(true);
    } catch {
      setCloudReachable(false);
      addPendingOp({ type: 'edit', payload: { id, updates: dbUpdates } });
    }
  }

  async function updateUser(updates) {
    const safeUpdates = {};
    if (updates.name !== undefined) safeUpdates.name = updates.name;
    if (updates.age !== undefined) safeUpdates.age = normalizeAge(updates.age);
    if (updates.country !== undefined) safeUpdates.country = normalizeCountry(updates.country);
    if (updates.wakeTime !== undefined) safeUpdates.wakeTime = updates.wakeTime;
    if (updates.morningRating !== undefined) safeUpdates.morningRating = updates.morningRating;
    if (updates.favoriteGame !== undefined) safeUpdates.favoriteGame = updates.favoriteGame;
    if (updates.wakeGoal !== undefined) safeUpdates.wakeGoal = updates.wakeGoal;
    if (updates.profileIcon !== undefined) safeUpdates.profileIcon = updates.profileIcon;
    if (updates.onboardingComplete !== undefined) safeUpdates.onboardingComplete = updates.onboardingComplete;

    let nextUser;
    applyUserSnapshot((prev) => {
      nextUser = { ...prev, ...safeUpdates };
      return nextUser;
    });

    queueProfileSync(nextUser);

    const userId = sessionRef.current?.user?.id;
    if (!userId || !navigator.onLine) return;

    try {
      const { error } = await updateProfileRecord(userId, userToProfileSync(nextUser));

      if (error) throw error;

      clearPendingProfileSync();
      setCloudReachable(true);
    } catch {
      setCloudReachable(false);
    }
  }

  async function resetAll() {
    const userId = sessionRef.current?.user?.id;

    try {
      localStorage.removeItem('mm_profile_icon');
    } catch {}

    clearLocalState({ preserveAuthUser: true });

    if (!userId || !navigator.onLine) {
      return;
    }

    try {
      await Promise.all([
        updateProfileRecord(userId, {
          name: '',
          age: null,
          country: null,
          wake_time: '07:00',
          morning_rating: 3,
          favorite_game: 'math',
          wake_goal: '',
          profile_icon: 'bolt',
          onboarding_complete: false,
          level: 1,
          xp: 0,
          demerits: 0,
          streak: 0,
          updated_at: new Date().toISOString(),
        }),
        supabase.from('alarms').delete().eq('user_id', userId),
      ]);

      try {
        await supabase.from('wake_sessions').delete().eq('user_id', userId);
      } catch {}

      setCloudReachable(true);
    } catch {
      setCloudReachable(false);
    }
  }

  function applyProgressionUpdate(updates) {
    if (!updates) return;
    applyUserSnapshot((prev) => ({ ...prev, ...progressionToUser(updates) }));
  }

  function triggerAlarm(alarm) {
    setActiveAlarm(alarm);
  }

  function clearActiveAlarm() {
    if (activeRef.current) void dismissAlarm(activeRef.current.id);
    setActiveAlarm(null);
  }

  async function startWakeSession({ alarmId, intensity, games }) {
    const baseSession = {
      localId: crypto.randomUUID(),
      remoteSessionId: null,
      userId: getResolvedUserId(),
      alarmId: alarmId ?? null,
      intensity,
      games,
      startedAt: new Date().toISOString(),
      totalFails: 0,
      syncedFails: 0,
    };

    if (sessionRef.current?.user?.id && navigator.onLine) {
      try {
        const { data, error } = await supabase
          .from('wake_sessions')
          .insert({
            user_id: sessionRef.current.user.id,
            alarm_id: alarmId ?? null,
            started_at: baseSession.startedAt,
            status: 'in_progress',
            intensity,
            games,
            total_fails: 0,
          })
          .select('id')
          .single();

        if (!error && data?.id) {
          wakeSessionRef.current = {
            ...baseSession,
            localId: data.id,
            remoteSessionId: data.id,
            mode: 'remote',
          };
          setCloudReachable(true);
          return wakeSessionRef.current;
        }
      } catch {}
    }

    setCloudReachable(false);
    wakeSessionRef.current = {
      ...baseSession,
      mode: 'local',
    };
    return wakeSessionRef.current;
  }

  async function recordWakeGameFail() {
    const currentWakeSession = wakeSessionRef.current;
    if (!currentWakeSession) return null;

    const nextTotalFails = currentWakeSession.totalFails + 1;

    if (currentWakeSession.mode === 'remote' && currentWakeSession.remoteSessionId && navigator.onLine) {
      try {
        const { data, error } = await supabase.rpc('record_wake_game_fail', {
          p_session_id: currentWakeSession.remoteSessionId,
        });

        if (!error) {
          wakeSessionRef.current = {
            ...currentWakeSession,
            totalFails: nextTotalFails,
            syncedFails: nextTotalFails,
          };

          if (data) applyProgressionUpdate(data);
          setCloudReachable(true);
          return data;
        }
      } catch {}
    }

    setCloudReachable(false);

    if (currentWakeSession.mode === 'remote') {
      currentWakeSession.mode = 'hybrid';
    }

    wakeSessionRef.current = {
      ...currentWakeSession,
      totalFails: nextTotalFails,
    };

    const nextUser = applyLocalWakeFail();
    return {
      ...progressionToUser(nextUser),
      totalFails: nextTotalFails,
    };
  }

  async function finalizeWakeSession(status, results = []) {
    const currentWakeSession = wakeSessionRef.current;
    if (!currentWakeSession) {
      markWakeOutcomeLocally(status, 'moderate');
      return null;
    }

    const finalizedWakeSession = {
      ...currentWakeSession,
      status,
      results,
      completedAt: new Date().toISOString(),
    };

    if (finalizedWakeSession.remoteSessionId && navigator.onLine) {
      try {
        let syncedFails = finalizedWakeSession.syncedFails ?? 0;

        while (syncedFails < finalizedWakeSession.totalFails) {
          const { error } = await supabase.rpc('record_wake_game_fail', {
            p_session_id: finalizedWakeSession.remoteSessionId,
          });

          if (error) throw error;
          syncedFails += 1;
        }

        const { data, error } = await supabase.rpc('complete_wake_session', {
          p_session_id: finalizedWakeSession.remoteSessionId,
          p_status: status,
          p_results: results,
        });

        if (error) throw error;

        if (data) applyProgressionUpdate(data);
        applyWakeStatsSnapshot((prev) => ({
          ...prev,
          [status]: (prev?.[status] ?? 0) + 1,
          loading: false,
        }));
        wakeSessionRef.current = null;
        setCloudReachable(true);
        if (sessionRef.current?.user?.id) void refreshWakeStats(sessionRef.current.user.id);
        return data;
      } catch {
        finalizedWakeSession.syncedFails = finalizedWakeSession.syncedFails ?? 0;
        setCloudReachable(false);
      }
    }

    upsertPendingWakeSession(finalizedWakeSession);
    markWakeOutcomeLocally(status, finalizedWakeSession.intensity);
    wakeSessionRef.current = null;
    return null;
  }

  function resetWakeSessionTracking() {
    wakeSessionRef.current = null;
  }

  async function signOut() {
    const userId = sessionRef.current?.user?.id;
    let alarmOpsFlushed = true;

    if (userId && navigator.onLine) {
      try {
        alarmOpsFlushed = await flushPendingAlarmOps(userId);
        await flushPendingProfile(userId);
        await flushPendingWakeSessions(userId);
      } catch {
        alarmOpsFlushed = false;
      }
    }

    clearLocalState({ preservePendingOps: !alarmOpsFlushed });

    if (userId) {
      try {
        await supabase.auth.signOut();
      } catch {}
    } else {
      setSession(null);
    }
  }

  const xpProgress = (user.xp % XP_PER_LEVEL) / XP_PER_LEVEL;
  const canContinueOffline = Boolean(
    pendingOnboarding || hasLocalAccess(getCachedUser(), getCachedAlarms())
  );

  return (
    <AppContext.Provider
      value={{
        session,
        authInitialized,
        user,
        alarms,
        activeAlarm,
        loading,
        offlineAccess,
        cloudReachable,
        nativeAlarmStatus,
        canContinueOffline,
        xpProgress,
        XP_PER_LEVEL,
        wakeStats,
        refreshWakeStats,
        pendingOnboarding,
        setPendingOnboarding,
        showAuthDirectly,
        setShowAuthDirectly,
        enterOfflineMode,
        refreshNativeAlarmStatus,
        requestNativeAlarmPermissions,
        completeOnboarding,
        addAlarm,
        toggleAlarm,
        deleteAlarm,
        editAlarm,
        updateUser,
        resetAll,
        applyProgressionUpdate,
        triggerAlarm,
        clearActiveAlarm,
        signOut,
        startWakeSession,
        recordWakeGameFail,
        finalizeWakeSession,
        resetWakeSessionTracking,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
