import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AppContext = createContext(null);

const INITIAL_USER = {
  name: '',
  wakeTime: '07:00',
  morningRating: 3,
  favoriteGame: 'math',
  wakeGoal: '',
  onboardingComplete: false,
  level: 1,
  xp: 0,
  demerits: 0,
  streak: 0,
};

const XP_PER_LEVEL = 100;

function newProfilePayload(userId, data) {
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
  return {
    name: row.name || '',
    wakeTime: row.wake_time || '07:00',
    morningRating: row.morning_rating ?? 3,
    favoriteGame: row.favorite_game || 'math',
    wakeGoal: row.wake_goal || '',
    onboardingComplete: row.onboarding_complete ?? false,
    level: row.level ?? 1,
    xp: row.xp ?? 0,
    demerits: row.demerits ?? 0,
    streak: row.streak ?? 0,
  };
}

export function AppProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(INITIAL_USER);
  const [alarms, setAlarms] = useState([]);
  const [activeAlarm, setActiveAlarm] = useState(null);
  const [loading, setLoading] = useState(true);

  // Onboarding data collected before auth — survives OAuth redirects via sessionStorage
  const [pendingOnboarding, setPendingOnboardingState] = useState(() => {
    const saved = sessionStorage.getItem('mm_pending_onboarding');
    return saved ? JSON.parse(saved) : null;
  });

  // Lets a returning user skip onboarding and go straight to the auth screen
  const [showAuthDirectly, setShowAuthDirectly] = useState(false);
  const loadingData  = useRef(false);
  const lastFiredRef = useRef(null); // "alarmId-HH:MM" — prevents double-fire
  const alarmsRef    = useRef(alarms);
  const activeRef    = useRef(activeAlarm);
  alarmsRef.current  = alarms;
  activeRef.current  = activeAlarm;

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
        loadUserData(session.user.id);
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

        // Browser notification (works when tab is in background)
        if (Notification.permission === 'granted') {
          try {
            new Notification('MorninMate ⏰', {
              body: alarm.label ? `${alarm.label} — Time to wake up!` : 'Time to wake up!',
              icon: '/icon-192.png',
              tag: 'morninmate-alarm',
              requireInteraction: true,
            });
          } catch (_) {}
        }
        break;
      }
    }

    const interval = setInterval(checkAlarms, 15000);
    checkAlarms(); // immediate check on mount / login
    return () => clearInterval(interval);
  }, [session]);

  // ─── Notification permission ─────────────────────────────────────────────────
  // Ask once, 4 s after the user logs in, so it doesn't feel intrusive.

  useEffect(() => {
    if (!session) return;
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'default') return;
    const t = setTimeout(() => Notification.requestPermission(), 4000);
    return () => clearTimeout(t);
  }, [session]);

  // ─── Data loading ───────────────────────────────────────────────────────────

  async function loadUserData(userId) {
    if (loadingData.current) return;
    loadingData.current = true;
    setLoading(true);

    const [profileResult, alarmsResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('alarms').select('*').eq('user_id', userId).order('created_at'),
    ]);

    if (profileResult.error) console.error('Profile fetch error:', profileResult.error);
    if (alarmsResult.error) console.error('Alarms fetch error:', alarmsResult.error);

    if (profileResult.data) setUser(rowToUser(profileResult.data));

    if (alarmsResult.data) {
      setAlarms(alarmsResult.data.map(a => ({
        id: a.id, label: a.label, time: a.time,
        pulse: a.pulse, active: a.active, days: a.days || [],
      })));
    }

    loadingData.current = false;
    setLoading(false);
  }

  // Called by AuthScreen after signup/signin — saves pending profile then fetches data.
  // lockAuth() must be called before the supabase auth call to ensure loadUserData
  // from onAuthStateChange cannot race with this function.
  async function handlePostAuth(session) {
    setSession(session);

    const userId = session.user.id;

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
      setAlarms(alarmsResult.data.map(a => ({
        id: a.id, label: a.label, time: a.time,
        pulse: a.pulse, active: a.active, days: a.days || [],
      })));
    }

    loadingData.current = false;
    setLoading(false);
  }

  // ─── Pending onboarding ─────────────────────────────────────────────────────

  function setPendingOnboarding(data) {
    sessionStorage.setItem('mm_pending_onboarding', JSON.stringify(data));
    setPendingOnboardingState(data);
  }

  // ─── Auth helpers ───────────────────────────────────────────────────────────

  // Call this BEFORE supabase.auth.signUp/signInWithPassword to prevent
  // onAuthStateChange from triggering loadUserData before handlePostAuth runs.
  function lockAuth() { loadingData.current = true; setLoading(true); }
  function unlockAuth() { loadingData.current = false; setLoading(false); }

  async function signOut() {
    await supabase.auth.signOut();
    setShowAuthDirectly(false);
  }

  // ─── Onboarding (edge case: logged-in user with incomplete profile) ──────────

  async function completeOnboarding(data) {
    const userId = session.user.id;
    const { error } = await supabase.from('profiles').upsert(newProfilePayload(userId, data));
    if (error) {
      console.error('Failed to save profile:', error);
      throw error;
    }
    setUser(prev => ({ ...prev, ...data, onboardingComplete: true }));
  }

  // ─── Alarm actions ──────────────────────────────────────────────────────────

  async function addAlarm(alarm) {
    const { data, error } = await supabase
      .from('alarms')
      .insert({
        user_id: session.user.id,
        label: alarm.label || 'Alarm',
        time: alarm.time,
        pulse: alarm.pulse ?? null,
        active: true,
        days: alarm.days || [],
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to save alarm:', error);
      return;
    }
    setAlarms(prev => [...prev, {
      id: data.id,
      label: data.label,
      time: data.time,
      pulse: data.pulse,
      active: data.active,
      days: data.days || [],
    }]);
  }

  async function toggleAlarm(id) {
    const alarm = alarms.find(a => a.id === id);
    if (!alarm) return;
    await supabase.from('alarms').update({ active: !alarm.active }).eq('id', id);
    setAlarms(prev => prev.map(a => a.id === id ? { ...a, active: !a.active } : a));
  }

  async function deleteAlarm(id) {
    await supabase.from('alarms').delete().eq('id', id);
    setAlarms(prev => prev.filter(a => a.id !== id));
  }

  async function editAlarm(id, updates) {
    const dbUpdates = {};
    if (updates.label  !== undefined) dbUpdates.label  = updates.label;
    if (updates.time   !== undefined) dbUpdates.time   = updates.time;
    if (updates.pulse  !== undefined) dbUpdates.pulse  = updates.pulse;
    if (updates.active !== undefined) dbUpdates.active = updates.active;
    if (updates.days   !== undefined) dbUpdates.days   = updates.days;

    await supabase.from('alarms').update(dbUpdates).eq('id', id);
    setAlarms(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  }

  // ─── User / profile actions ─────────────────────────────────────────────────

  async function updateUser(updates) {
    const dbUpdates = { updated_at: new Date().toISOString() };
    if (updates.name               !== undefined) dbUpdates.name              = updates.name;
    if (updates.wakeTime           !== undefined) dbUpdates.wake_time         = updates.wakeTime;
    if (updates.morningRating      !== undefined) dbUpdates.morning_rating    = updates.morningRating;
    if (updates.favoriteGame       !== undefined) dbUpdates.favorite_game     = updates.favoriteGame;
    if (updates.wakeGoal           !== undefined) dbUpdates.wake_goal         = updates.wakeGoal;
    if (updates.level              !== undefined) dbUpdates.level             = updates.level;
    if (updates.xp                 !== undefined) dbUpdates.xp                = updates.xp;
    if (updates.demerits           !== undefined) dbUpdates.demerits          = updates.demerits;
    if (updates.streak             !== undefined) dbUpdates.streak            = updates.streak;
    if (updates.onboardingComplete !== undefined) dbUpdates.onboarding_complete = updates.onboardingComplete;

    await supabase.from('profiles').update(dbUpdates).eq('id', session.user.id);
    setUser(prev => ({ ...prev, ...updates }));
  }

  async function resetAll() {
    const userId = session.user.id;
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
    setUser(INITIAL_USER);
    setAlarms([]);
    setActiveAlarm(null);
  }

  async function awardXP(amount) {
    let updates;
    setUser(prev => {
      const xp = prev.xp + amount;
      updates = { xp, level: Math.floor(xp / XP_PER_LEVEL) + 1, streak: prev.streak + 1 };
      return { ...prev, ...updates };
    });
    await supabase.from('profiles').update({
      ...updates, updated_at: new Date().toISOString(),
    }).eq('id', session.user.id);
  }

  async function addDemerit() {
    let updates;
    setUser(prev => {
      const xp = Math.max(0, prev.xp - 20);
      updates = { demerits: prev.demerits + 1, xp, level: Math.max(1, Math.floor(xp / XP_PER_LEVEL) + 1), streak: 0 };
      return { ...prev, ...updates };
    });
    await supabase.from('profiles').update({
      ...updates, updated_at: new Date().toISOString(),
    }).eq('id', session.user.id);
  }

  function triggerAlarm(alarm)  { setActiveAlarm(alarm); }
  function clearActiveAlarm()   { setActiveAlarm(null); }

  const xpProgress = (user.xp % XP_PER_LEVEL) / XP_PER_LEVEL;

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
        pendingOnboarding,
        setPendingOnboarding,
        handlePostAuth,
        lockAuth,
        unlockAuth,
        showAuthDirectly,
        setShowAuthDirectly,
        completeOnboarding,
        addAlarm,
        toggleAlarm,
        deleteAlarm,
        editAlarm,
        updateUser,
        resetAll,
        awardXP,
        addDemerit,
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
