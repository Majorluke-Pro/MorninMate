import { createContext, useContext, useState, useEffect } from 'react';

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

export function AppProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('mm_user');
    return saved ? JSON.parse(saved) : INITIAL_USER;
  });

  const [alarms, setAlarms] = useState(() => {
    const saved = localStorage.getItem('mm_alarms');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeAlarm, setActiveAlarm] = useState(null);

  useEffect(() => {
    localStorage.setItem('mm_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('mm_alarms', JSON.stringify(alarms));
  }, [alarms]);

  function completeOnboarding(data) {
    setUser(prev => ({ ...prev, ...data, onboardingComplete: true }));
  }

  function addAlarm(alarm) {
    const newAlarm = {
      id: Date.now(),
      label: alarm.label || 'Alarm',
      time: alarm.time,
      pulse: alarm.pulse,
      active: true,
      days: alarm.days || [],
    };
    setAlarms(prev => [...prev, newAlarm]);
  }

  function toggleAlarm(id) {
    setAlarms(prev =>
      prev.map(a => (a.id === id ? { ...a, active: !a.active } : a))
    );
  }

  function deleteAlarm(id) {
    setAlarms(prev => prev.filter(a => a.id !== id));
  }

  function editAlarm(id, updates) {
    setAlarms(prev => prev.map(a => (a.id === id ? { ...a, ...updates } : a)));
  }

  function updateUser(updates) {
    setUser(prev => ({ ...prev, ...updates }));
  }

  function resetAll() {
    setUser(INITIAL_USER);
    setAlarms([]);
    setActiveAlarm(null);
    localStorage.removeItem('mm_user');
    localStorage.removeItem('mm_alarms');
  }

  function awardXP(amount) {
    setUser(prev => {
      const newXP = prev.xp + amount;
      const newLevel = Math.floor(newXP / XP_PER_LEVEL) + 1;
      return {
        ...prev,
        xp: newXP,
        level: newLevel,
        streak: prev.streak + 1,
      };
    });
  }

  function addDemerit() {
    setUser(prev => {
      const newDemerits = prev.demerits + 1;
      const xpPenalty = 20;
      const newXP = Math.max(0, prev.xp - xpPenalty);
      const newLevel = Math.max(1, Math.floor(newXP / XP_PER_LEVEL) + 1);
      return {
        ...prev,
        demerits: newDemerits,
        xp: newXP,
        level: newLevel,
        streak: 0,
      };
    });
  }

  function triggerAlarm(alarm) {
    setActiveAlarm(alarm);
  }

  function clearActiveAlarm() {
    setActiveAlarm(null);
  }

  const xpProgress = (user.xp % XP_PER_LEVEL) / XP_PER_LEVEL;

  return (
    <AppContext.Provider
      value={{
        user,
        alarms,
        activeAlarm,
        xpProgress,
        XP_PER_LEVEL,
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
