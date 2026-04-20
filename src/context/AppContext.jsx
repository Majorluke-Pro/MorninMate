import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
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
} from '../lib/nativeAlarms';
import {
  getCachedAlarms,
  setCachedAlarms,
  getPendingOps,
  addPendingOp,
  clearPendingOps,
} from '../lib/alarmStore';

const AppContext = createContext(null);

const INITIAL_USER = {
  name: '',
  wakeTime: '07:00',
  morningRating: 3,
  favoriteGame: 'math',
  wakeGoal: '',
  profileIcon: localStorage.getItem('mm_profile_icon') || 'bolt',
  onboardingComplete: false,
  level: 1,
  xp: 0,
  demerits: 0,
  streak: 0,
};

const XP_PER_LEVEL = 100;

function newProfilePayload(userId, data) {
  if (data.profileIcon) localStorage.setItem('mm_profile_icon', data.profileIcon);
  return {
    id: userId,
    name: data.name,
    wake_time: data.wakeTime,
    morning_rating: data.morningRating,
    favorite_game: data.favoriteGame,
    wake_goal: data.wakeGoal,
    onboarding_complete: true,
    level: 1,
    xp: 0,
    demerits: 0,
    streak: 0,
    updated_at: new Date().toISOString(),
  };
}

function rowToUser(row) {
  const profileIcon = row.profile_icon || localStorage.getItem('mm_profile_icon') || 'bolt';
  return {
    name: row.name || '',
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

function normalizeAlarmDays(days) {
  return (days || [])
    .map(Number)
    .filter(day => Number.isInteger(day) && day >= 0 && day <= 6);
}

function rowToAlarm(row) {
  return {
    id: row.id,
    label: row.label,
    time: row.time,
    sound: row.pulse?.sound || 'classic',
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

export function AppProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(INITIAL_USER);
  const [alarms, setAlarms] = useState([]);
  const [activeAlarm, setActiveAlarm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wakeStats, setWakeStats] = useState({ success: 0, failed: 0, loading: false });

  // Onboarding data collected before auth — survives OAuth redirects via sessionStorage
  const [pendingOnboarding, setPendingOnboardingState] = useState(() => {
    const saved = sessionStorage.getItem('mm_pending_onboarding');
    return saved ? JSON.parse(saved) : null;
  });

  // Lets a returning user skip onboarding and go straight to the auth screen
  const [showAuthDirectly, setShowAuthDirectly] = useState(false);
  const loadingData      = useRef(false);
  const appUrlListenerRef = useRef(null);
  const lastFiredRef     = useRef(null); // "alarmId-HH:MM" — prevents double-fire
  const alarmsRef    = useRef(alarms);
  const activeRef    = useRef(activeAlarm);
  const sessionRef   = useRef(session);
  alarmsRef.current  = alarms;
  activeRef.current  = activeAlarm;
  sessionRef.current = session;

  // ─── Auth listener ──────────────────────────────────────────────────────────

  useEffect(() => {
    // Use onAuthStateChange exclusively — it fires immediately with INITIAL_SESSION
    // on mount, so getSession() is not needed and avoids double-loading.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Token refresh & user updates don't need a full data reload
      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        setSession(session);
        return;
      }

      setSession(session);
      if (session) {
        setLoading(true); // prevent flash of OnboardingFlow before data loads
        // For new magic-link users: if pending onboarding data exists, write it
        // to the profiles table before loading user data (handlePostAuth handles both).
        if (event === 'SIGNED_IN' && sessionStorage.getItem('mm_pending_onboarding')) {
          handlePostAuth(session);
        } else {
          loadUserData(session.user.id);
        }
      } else {
        loadingData.current = false;
        setUser(INITIAL_USER);
        setAlarms([]);
        setActiveAlarm(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ─── Magic link deep-link handler ────────────────────────────────────────────
  // Listens for the app being opened via the com.morninmate.app://login-callback
  // deep link after the user taps their magic link email.

  useEffect(() => {
    CapacitorApp.addListener('appUrlOpen', async ({ url }) => {
      if (url && url.includes('login-callback')) {
        try {
          const urlObj = new URL(url);
          const code = urlObj.searchParams.get('code');
          if (code) {
            await supabase.auth.exchangeCodeForSession(code);
            // onAuthStateChange fires automatically with the new session
          }
        } catch (err) {
          console.error('Magic link session error:', err);
        }
      }
    }).then(h => { appUrlListenerRef.current = h; });

    return () => { appUrlListenerRef.current?.remove(); };
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
        const { data: { session: existingSession } } = await supabase.auth.getSession();

        if (!existingSession && code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('Magic link session error:', error);
            return;
          }
        }

        if (active) stripAuthParamsFromUrl(window.location.href);
      } catch (err) {
        console.error('Magic link session error:', err);
      }
    }

    handleWebMagicLink();

    return () => {
      active = false;
    };
  }, []);

  // ─── Alarm scheduler ────────────────────────────────────────────────────────
  // Checks every 15 s whether any active alarm matches the current time.
  // Uses refs so the interval never needs to be recreated when alarms change.

  useEffect(() => {
    if (!session) return;

    function checkAlarms() {
      if (activeRef.current) return; // already in wake-up flow

      const now  = new Date();
      const hh   = String(now.getHours()).padStart(2, '0');
      const mm   = String(now.getMinutes()).padStart(2, '0');
      const time = `${hh}:${mm}`;
      const day  = now.getDay();

      for (const alarm of alarmsRef.current) {
        if (!alarm.active) continue;
        if (alarm.time !== time) continue;
        if (alarm.days?.length > 0 && !alarm.days.includes(day)) continue;

        const key = `${alarm.id}-${time}`;
        if (lastFiredRef.current === key) continue; // already fired this minute

        lastFiredRef.current = key;
        setActiveAlarm(alarm);
        vibrateAlarm();

        // Web fallback notification (browser only)
        if (!isNative && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          try {
            new Notification('MorninMate 🐨', {
              body: alarm.label ? `${alarm.label} — Rise & Shine, Legend!` : 'Rise & Shine, Legend!',
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
    checkAlarms(); // immediate check on mount / login
    return () => clearInterval(interval);
  }, [session]);

  // ─── alarmFired event (backgrounded-app case) ────────────────────────────────
  // MainActivity.onNewIntent() fires this when an alarm launches the app
  // while it is already running in the background.

  useEffect(() => {
    function handleAlarmFired(e) {
      let alarmId;
      try { alarmId = JSON.parse(e.detail).alarmId; } catch { alarmId = e.detail?.alarmId; }
      if (!alarmId || activeRef.current) return;
      const alarm = alarmsRef.current.find(a => String(a.id) === alarmId);
      if (alarm) { vibrateAlarm(); setActiveAlarm(alarm); }
    }
    document.addEventListener('alarmFired', handleAlarmFired);
    return () => document.removeEventListener('alarmFired', handleAlarmFired);
  }, []); // Uses refs — safe to register once on mount

  // ─── Notification permission ─────────────────────────────────────────────────
  // Ask once, 4 s after the user logs in, so it doesn't feel intrusive.

  useEffect(() => {
    if (!session) return;
    const t = setTimeout(() => requestNotificationPermission(), 4000);
    return () => clearTimeout(t);
  }, [session]);

  // ─── Notification tap → trigger alarm (native only) ─────────────────────────

  useEffect(() => {
    if (!session) return;
    const unsub = onNotificationTap(alarmId => {
      const alarm = alarmsRef.current.find(a => String(a.id) === alarmId);
      if (alarm && !activeRef.current) {
        vibrateAlarm();
        setActiveAlarm(alarm);
      }
    });
    return unsub;
  }, [session]);

  // ─── Data loading ───────────────────────────────────────────────────────────

  async function flushPendingOps() {
    const ops = getPendingOps();
    if (ops.length === 0) return;
    for (const op of ops) {
      try {
        if (op.type === 'add') {
          await supabase.from('alarms').upsert({
            id:       op.payload.id,
            user_id:  op.payload.userId,
            label:    op.payload.label,
            time:     op.payload.time,
            pulse:    op.payload.pulse,
            active:   op.payload.active,
            days:     op.payload.days,
          });
        } else if (op.type === 'toggle') {
          await supabase.from('alarms').update({ active: op.payload.active }).eq('id', op.payload.id);
        } else if (op.type === 'delete') {
          await supabase.from('alarms').delete().eq('id', op.payload.id);
        } else if (op.type === 'edit') {
          await supabase.from('alarms').update(op.payload.updates).eq('id', op.payload.id);
        }
      } catch {
        // Still offline — leave ops in queue, abort flush
        return;
      }
    }
    clearPendingOps();
  }

  async function loadUserData(userId) {
    if (loadingData.current) return;
    loadingData.current = true;
    setLoading(true);

    // 1. Show cached alarms immediately — no network needed
    const cached = getCachedAlarms();
    if (cached.length > 0) {
      setAlarms(cached);
      syncAllAlarms(cached);
    }

    // 2. Flush any offline writes before fetching (best-effort)
    try { await flushPendingOps(); } catch {}

    // 3. Fetch from Supabase — source of truth when online
    const [profileResult, alarmsResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('alarms').select('*').eq('user_id', userId).order('created_at'),
    ]);

    if (profileResult.error) console.error('Profile fetch error:', profileResult.error);
    if (alarmsResult.error)  console.error('Alarms fetch error:', alarmsResult.error);

    if (profileResult.data) setUser(rowToUser(profileResult.data));

    if (alarmsResult.data) {
      const mapped = alarmsResult.data.map(rowToAlarm);
      setCachedAlarms(mapped);
      setAlarms(mapped);
      syncAllAlarms(mapped);
      checkAndRequestAlarmPermissions();

      // Cold-start: check if an alarm fired while the app was closed
      const pendingAlarmId = await getPendingAlarm();
      if (pendingAlarmId) {
        const alarm = mapped.find(a => String(a.id) === pendingAlarmId);
        if (alarm) { vibrateAlarm(); setActiveAlarm(alarm); }
      }
    }

    refreshWakeStats(userId);
    loadingData.current = false;
    setLoading(false);
  }

  // Saves pending onboarding profile (if present) then fetches user data.
  // Called internally from onAuthStateChange when mm_pending_onboarding exists.
  async function handlePostAuth(session) {
    if (loadingData.current) return;
    loadingData.current = true;

    const userId = session.user.id;

    try {
      // Guard: if the user already has a completed profile, don't overwrite it
      const { data: existing } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('id', userId)
        .maybeSingle();

      if (existing?.onboarding_complete) {
        sessionStorage.removeItem('mm_pending_onboarding');
        setPendingOnboardingState(null);
        // loadUserData has its own in-flight guard; clear ours before delegating.
        loadingData.current = false;
        await loadUserData(userId);
        return;
      }

      // Save pending onboarding profile if present
      const pendingRaw = sessionStorage.getItem('mm_pending_onboarding');
      if (pendingRaw) {
        const pending = JSON.parse(pendingRaw);
        const { error } = await supabase.from('profiles').upsert(newProfilePayload(userId, pending));
        if (error) {
          console.error('Failed to save profile:', error);
        } else {
          sessionStorage.removeItem('mm_pending_onboarding');
          setPendingOnboardingState(null);
        }
      }

      // Now fetch — profile is guaranteed to be in DB
      const [profileResult, alarmsResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('alarms').select('*').eq('user_id', userId).order('created_at'),
      ]);

      if (profileResult.data) setUser(rowToUser(profileResult.data));
      if (alarmsResult.data) {
        const mapped = alarmsResult.data.map(rowToAlarm);
        setAlarms(mapped);
        syncAllAlarms(mapped);
      }

      refreshWakeStats(userId);
    } finally {
      loadingData.current = false;
      setLoading(false);
    }
  }

  // ─── Pending onboarding ─────────────────────────────────────────────────────

  function setPendingOnboarding(data) {
    sessionStorage.setItem('mm_pending_onboarding', JSON.stringify(data));
    setPendingOnboardingState(data);
  }

  async function signOut() {
    setCachedAlarms([]);
    clearPendingOps();
    await supabase.auth.signOut();
    setShowAuthDirectly(false);
  }

  // ─── Onboarding (edge case: logged-in user with incomplete profile) ──────────

  async function completeOnboarding(data) {
    const userId = session.user.id;
    const { error } = await supabase.from('profiles').upsert(newProfilePayload(userId, data));
    if (error) {
      console.error('Failed to save profile:', error);
      // Stale session — user no longer exists in auth. Sign out and reload.
      if (error.code === '23503') {
        await supabase.auth.signOut();
        window.location.reload();
        return;
      }
      throw error;
    }
    setUser(prev => ({ ...prev, ...data, onboardingComplete: true }));
  }

  // ─── Alarm actions ──────────────────────────────────────────────────────────

  async function addAlarm(alarm) {
    const localId = crypto.randomUUID();
    const payload = {
      id:     localId,
      userId: session.user.id,
      label:  alarm.label || 'Alarm',
      time:   alarm.time,
      pulse:  { ...(alarm.pulse ?? {}), sound: alarm.sound || 'classic' },
      active: true,
      days:   alarm.days || [],
    };
    const localAlarm = {
      id:     localId,
      label:  payload.label,
      time:   payload.time,
      sound:  payload.pulse.sound,
      pulse:  payload.pulse,
      active: true,
      days:   payload.days,
    };

    // 1. Write locally + schedule notification immediately
    setAlarms(prev => {
      const next = [...prev, localAlarm];
      setCachedAlarms(next);
      return next;
    });
    scheduleAlarm(localAlarm);

    // 2. Sync to Supabase
    try {
      const { error } = await supabase.from('alarms').insert({
        id:      localId,
        user_id: payload.userId,
        label:   payload.label,
        time:    payload.time,
        pulse:   payload.pulse,
        active:  payload.active,
        days:    payload.days,
      });
      if (error) throw error;
    } catch {
      addPendingOp({ type: 'add', payload });
    }
  }

  async function toggleAlarm(id) {
    const alarm = alarmsRef.current.find(a => a.id === id);
    if (!alarm) return;
    const newActive = !alarm.active;

    // 1. Update state + cache immediately
    setAlarms(prev => {
      const next = prev.map(a => a.id === id ? { ...a, active: newActive } : a);
      setCachedAlarms(next);
      return next;
    });
    if (newActive) scheduleAlarm({ ...alarm, active: newActive });
    else cancelAlarmNotifications(id);

    // 2. Sync to Supabase
    try {
      const { error } = await supabase.from('alarms').update({ active: newActive }).eq('id', id);
      if (error) throw error;
    } catch {
      addPendingOp({ type: 'toggle', payload: { id, active: newActive } });
    }
  }

  async function deleteAlarm(id) {
    // 1. Remove from state + cache immediately
    setAlarms(prev => {
      const next = prev.filter(a => a.id !== id);
      setCachedAlarms(next);
      return next;
    });
    cancelAlarmNotifications(id);

    // 2. Sync to Supabase
    try {
      const { error } = await supabase.from('alarms').delete().eq('id', id);
      if (error) throw error;
    } catch {
      addPendingOp({ type: 'delete', payload: { id } });
    }
  }

  async function editAlarm(id, updates) {
    const dbUpdates = {};
    if (updates.label  !== undefined) dbUpdates.label  = updates.label;
    if (updates.time   !== undefined) dbUpdates.time   = updates.time;
    if (updates.active !== undefined) dbUpdates.active = updates.active;
    if (updates.days   !== undefined) dbUpdates.days   = normalizeAlarmDays(updates.days);
    if (updates.pulse  !== undefined || updates.sound !== undefined) {
      const existing = alarmsRef.current.find(a => a.id === id);
      const basePulse = updates.pulse ?? existing?.pulse ?? {};
      dbUpdates.pulse = { ...basePulse, sound: updates.sound ?? existing?.sound ?? 'classic' };
    }

    // 1. Update state + cache immediately
    setAlarms(prev => {
      const normalizedUpdates = {
        ...updates,
        ...(updates.days !== undefined ? { days: normalizeAlarmDays(updates.days) } : {}),
      };
      const next = prev.map(a => a.id === id ? { ...a, ...normalizedUpdates } : a);
      setCachedAlarms(next);
      const alarm = next.find(a => a.id === id);
      if (alarm) scheduleAlarm(alarm);
      return next;
    });

    // 2. Sync to Supabase
    try {
      const { error } = await supabase.from('alarms').update(dbUpdates).eq('id', id);
      if (error) throw error;
    } catch {
      addPendingOp({ type: 'edit', payload: { id, updates: dbUpdates } });
    }
  }

  // ─── User / profile actions ─────────────────────────────────────────────────

  async function updateUser(updates) {
    const dbUpdates = { updated_at: new Date().toISOString() };
    const safeUpdates = {};
    if (updates.name               !== undefined) dbUpdates.name              = updates.name;
    if (updates.name               !== undefined) safeUpdates.name            = updates.name;
    if (updates.wakeTime           !== undefined) dbUpdates.wake_time         = updates.wakeTime;
    if (updates.wakeTime           !== undefined) safeUpdates.wakeTime        = updates.wakeTime;
    if (updates.morningRating      !== undefined) dbUpdates.morning_rating    = updates.morningRating;
    if (updates.morningRating      !== undefined) safeUpdates.morningRating   = updates.morningRating;
    if (updates.favoriteGame       !== undefined) dbUpdates.favorite_game     = updates.favoriteGame;
    if (updates.favoriteGame       !== undefined) safeUpdates.favoriteGame    = updates.favoriteGame;
    if (updates.wakeGoal           !== undefined) dbUpdates.wake_goal         = updates.wakeGoal;
    if (updates.wakeGoal           !== undefined) safeUpdates.wakeGoal        = updates.wakeGoal;
    if (updates.profileIcon        !== undefined) {
      localStorage.setItem('mm_profile_icon', updates.profileIcon);
      safeUpdates.profileIcon = updates.profileIcon;
    }
    if (updates.onboardingComplete !== undefined) dbUpdates.onboarding_complete = updates.onboardingComplete;
    if (updates.onboardingComplete !== undefined) safeUpdates.onboardingComplete = updates.onboardingComplete;

    await supabase.from('profiles').update(dbUpdates).eq('id', session.user.id);
    setUser(prev => ({ ...prev, ...safeUpdates }));
  }

  async function resetAll() {
    const userId = session.user.id;
    localStorage.removeItem('mm_profile_icon');
    setCachedAlarms([]);
    clearPendingOps();
    await Promise.all([
      supabase.from('profiles').update({
        name: '',
        wake_time: '07:00',
        morning_rating: 3,
        favorite_game: 'math',
        wake_goal: '',
        onboarding_complete: false,
        level: 1,
        xp: 0,
        demerits: 0,
        streak: 0,
        updated_at: new Date().toISOString(),
      }).eq('id', userId),
      supabase.from('alarms').delete().eq('user_id', userId),
    ]);
    try { await supabase.from('wake_sessions').delete().eq('user_id', userId); } catch {}
    setUser(INITIAL_USER);
    setAlarms([]);
    setActiveAlarm(null);
    setWakeStats({ success: 0, failed: 0, loading: false });
  }

  function applyProgressionUpdate(updates) {
    if (!updates) return;
    setUser(prev => ({ ...prev, ...progressionToUser(updates) }));
  }

  function triggerAlarm(alarm)  { setActiveAlarm(alarm); }
  function clearActiveAlarm() {
    if (activeRef.current) dismissAlarm(activeRef.current.id);
    setActiveAlarm(null);
  }

  const xpProgress = (user.xp % XP_PER_LEVEL) / XP_PER_LEVEL;

  const refreshWakeStats = useCallback(async function refreshWakeStats(userId) {
    const uid = userId ?? sessionRef.current?.user?.id;
    if (!uid) return;
    setWakeStats(s => ({ ...s, loading: true }));
    const [successRes, failedRes] = await Promise.all([
      supabase.from('wake_sessions').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('status', 'success'),
      supabase.from('wake_sessions').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('status', 'failed'),
    ]);
    if (successRes.error || failedRes.error) {
      setWakeStats(s => ({ ...s, loading: false }));
      return;
    }
    setWakeStats({
      success: successRes.count ?? 0,
      failed: failedRes.count ?? 0,
      loading: false,
    });
  }, []);

  return (
    <AppContext.Provider
      value={{
        session,
        user,
        alarms,
        activeAlarm,
        loading,
        xpProgress,
        XP_PER_LEVEL,
        wakeStats,
        refreshWakeStats,
        pendingOnboarding,
        setPendingOnboarding,
        showAuthDirectly,
        setShowAuthDirectly,
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

