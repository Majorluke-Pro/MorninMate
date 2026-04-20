# Offline Alarm Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Alarms create, toggle, delete, edit, and ring without a network connection, syncing silently to Supabase when connectivity returns.

**Architecture:** A new `alarmStore.js` module owns two localStorage keys — `mm_alarms_cache` (full alarm array) and `mm_pending_ops` (queue of failed Supabase writes). `AppContext.jsx` is updated to write to the cache first on every alarm operation, attempt Supabase in the background, and flush the pending queue on startup before fetching from Supabase.

**Tech Stack:** React 19, Supabase JS v2, Capacitor local notifications, localStorage

---

## File Structure

| File | Action |
|------|--------|
| `src/lib/alarmStore.js` | **Create** — localStorage cache + pending ops queue |
| `src/context/AppContext.jsx` | **Modify** — wire local-first into all alarm operations |

---

### Task 1: Create `src/lib/alarmStore.js`

**Files:**
- Create: `src/lib/alarmStore.js`

- [ ] **Step 1: Create the file with the full implementation**

```js
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
  localStorage.removeItem(OPS_KEY);
}
```

- [ ] **Step 2: Verify the file exists**

```bash
ls src/lib/alarmStore.js
```

Expected: file listed with no error.

- [ ] **Step 3: Commit**

```bash
git add src/lib/alarmStore.js
git commit -m "feat: add localStorage alarm cache and pending ops queue"
```

---

### Task 2: Wire local-first into `AppContext.jsx`

**Files:**
- Modify: `src/context/AppContext.jsx`

The plan below shows the complete replacement for each modified section. Do not change anything else in the file.

---

- [ ] **Step 1: Add the import for `alarmStore` at the top of the file**

After the existing import block (after line 15), add:

```js
import {
  getCachedAlarms,
  setCachedAlarms,
  getPendingOps,
  addPendingOp,
  clearPendingOps,
} from '../lib/alarmStore';
```

---

- [ ] **Step 2: Add `flushPendingOps` helper function**

Add this new private function directly above `loadUserData` (before line 324). It replays every queued Supabase write in order, then clears the queue.

```js
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
```

---

- [ ] **Step 3: Replace `loadUserData` (lines 324–357)**

Replace the entire `loadUserData` function with:

```js
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
```

---

- [ ] **Step 4: Replace `addAlarm` (lines 449–470)**

Replace the entire `addAlarm` function with:

```js
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
```

---

- [ ] **Step 5: Replace `toggleAlarm` (lines 472–481)**

Replace the entire `toggleAlarm` function with:

```js
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
```

---

- [ ] **Step 6: Replace `deleteAlarm` (lines 483–487)**

Replace the entire `deleteAlarm` function with:

```js
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
```

---

- [ ] **Step 7: Replace `editAlarm` (lines 489–512)**

Replace the entire `editAlarm` function with:

```js
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
```

---

- [ ] **Step 8: Clear the alarm cache on sign-out**

In the `signOut` function (line 424), add a cache clear before signing out:

Replace:
```js
async function signOut() {
  await supabase.auth.signOut();
  setShowAuthDirectly(false);
}
```

With:
```js
async function signOut() {
  setCachedAlarms([]);
  clearPendingOps();
  await supabase.auth.signOut();
  setShowAuthDirectly(false);
}
```

---

- [ ] **Step 9: Also clear cache in `resetAll` (line 540)**

In `resetAll`, after `localStorage.removeItem('mm_profile_icon')`, add:

```js
setCachedAlarms([]);
clearPendingOps();
```

So the block reads:
```js
async function resetAll() {
  const userId = session.user.id;
  localStorage.removeItem('mm_profile_icon');
  setCachedAlarms([]);
  clearPendingOps();
  await Promise.all([
    // ... rest unchanged
  ]);
```

---

- [ ] **Step 10: Verify the build compiles**

```bash
cd C:/dev/MorninMate
npm run build
```

Expected: `✓ built in` with no errors. The chunk sizes should be nearly identical to before.

- [ ] **Step 11: Manual smoke test — online flow**

```
1. Open http://localhost:5173 (npm run dev)
2. Log in
3. Create a new alarm → confirm it appears in the list
4. Open DevTools → Application → Local Storage → check mm_alarms_cache contains the new alarm
5. Toggle the alarm off → confirm mm_alarms_cache reflects active: false
6. Delete the alarm → confirm mm_alarms_cache no longer contains it
```

- [ ] **Step 12: Manual smoke test — offline flow**

```
1. Open http://localhost:5173, log in, note existing alarms
2. DevTools → Network tab → set throttling to "Offline"
3. Reload the page
4. Confirm existing alarms still appear (loaded from cache)
5. Create a new alarm → confirm it appears in the list immediately
6. Check mm_pending_ops in Local Storage — should contain one 'add' op
7. Set network back to "No throttling"
8. Reload the page
9. Confirm mm_pending_ops is now empty (flushed on startup)
10. Confirm the alarm exists in Supabase (check via Supabase dashboard or network tab)
```

- [ ] **Step 13: Commit**

```bash
git add src/context/AppContext.jsx
git commit -m "feat: local-first alarm operations with offline pending queue"
```

- [ ] **Step 14: Push**

```bash
git push origin main
```
