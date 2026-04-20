# Offline Alarm Support Design

**Date:** 2026-04-20
**Goal:** Alarms create, toggle, delete, and ring without a network connection.

---

## Problem

All alarm operations currently require Supabase to succeed:
- `addAlarm` inserts to Supabase first — if offline, the alarm is never created and never rings
- `loadUserData` fetches alarms from Supabase on startup — if offline, no alarms are shown
- `toggleAlarm` / `deleteAlarm` / `editAlarm` update Supabase — changes may be lost if connection drops mid-operation

## Approach: localStorage Write-Through Cache

Every write hits localStorage first and schedules the local notification immediately. Supabase is attempted in the background. If it fails, the operation is stored in a pending queue and replayed next time the app starts with a connection.

**No UI changes.** The user never sees "offline mode" — alarms just work.

---

## Data Structures

### `mm_alarms_cache` (localStorage)
Full array of alarm objects mirroring in-memory state. Kept in sync on every create/update/delete.

```json
[
  {
    "id": "uuid",
    "label": "Morning",
    "time": "07:00",
    "active": true,
    "days": [1,2,3,4,5],
    "sound": "classic",
    "pulse": { "intensity": "moderate", "games": ["math", "memory"] }
  }
]
```

### `mm_pending_ops` (localStorage)
Queue of Supabase writes that failed due to no connection. Replayed in order on next online startup.

```json
[
  { "id": "op-uuid", "type": "add",    "payload": { ...fullAlarmObject } },
  { "id": "op-uuid", "type": "toggle", "payload": { "id": "alarm-uuid", "active": false } },
  { "id": "op-uuid", "type": "delete", "payload": { "id": "alarm-uuid" } },
  { "id": "op-uuid", "type": "edit",   "payload": { "id": "alarm-uuid", "updates": { ... } } }
]
```

---

## Files

| File | Action | Responsibility |
|------|--------|---------------|
| `src/lib/alarmStore.js` | Create | localStorage read/write for cache and pending ops |
| `src/context/AppContext.jsx` | Modify | Wire local-first behavior into all alarm operations |

---

## `src/lib/alarmStore.js`

```js
const CACHE_KEY = 'mm_alarms_cache';
const OPS_KEY   = 'mm_pending_ops';

export function getCachedAlarms() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) ?? '[]'); }
  catch { return []; }
}

export function setCachedAlarms(alarms) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(alarms));
}

export function getPendingOps() {
  try { return JSON.parse(localStorage.getItem(OPS_KEY) ?? '[]'); }
  catch { return []; }
}

export function addPendingOp(op) {
  const ops = getPendingOps();
  ops.push({ id: crypto.randomUUID(), ...op });
  localStorage.setItem(OPS_KEY, JSON.stringify(ops));
}

export function clearPendingOps() {
  localStorage.removeItem(OPS_KEY);
}
```

---

## AppContext Changes

### `loadUserData`
```
1. getCachedAlarms() → setAlarms + syncAllAlarms immediately → setLoading(false)
2. Attempt flushPendingOps() (try/catch, silent on failure)
3. Fetch from Supabase
4. On success: setCachedAlarms(mapped) + setAlarms(mapped) + syncAllAlarms(mapped)
5. On failure: keep showing cache (already visible from step 1)
```

### `addAlarm`
```
1. Generate localId = crypto.randomUUID()
2. Build localAlarm = { id: localId, ...normalizedFields, active: true }
3. setCachedAlarms([...current, localAlarm])
4. setAlarms([...current, localAlarm])
5. scheduleAlarm(localAlarm)
6. Try: supabase.insert({ id: localId, ... })
7. On failure: addPendingOp({ type: 'add', payload: localAlarm })
```

Supabase UUID columns accept client-supplied UUIDs, so the local ID and remote ID are identical — no ID swap needed.

### `toggleAlarm`
```
Existing: already updates state before Supabase call.
Add:
1. After state update: setCachedAlarms(updatedAlarms)
2. Wrap supabase.update in try/catch
3. On failure: addPendingOp({ type: 'toggle', payload: { id, active: newActive } })
```

### `deleteAlarm`
```
Existing: deletes from Supabase first, then state.
Change to:
1. setAlarms(filtered) immediately
2. setCachedAlarms(filtered)
3. cancelAlarmNotifications(id)
4. Try: supabase.delete
5. On failure: addPendingOp({ type: 'delete', payload: { id } })
```

### `editAlarm`
```
Existing: updates Supabase first, then state.
Change to:
1. Compute normalizedUpdates
2. setAlarms(updated) immediately
3. setCachedAlarms(updated)
4. scheduleAlarm(updatedAlarm)
5. Try: supabase.update
6. On failure: addPendingOp({ type: 'edit', payload: { id, updates: dbUpdates } })
```

### `flushPendingOps` (new private function)
```
ops = getPendingOps()
for each op (in order):
  if type === 'add':    supabase.insert({ id: op.payload.id, ...fields })
  if type === 'toggle': supabase.update({ active }).eq('id', op.payload.id)
  if type === 'delete': supabase.delete().eq('id', op.payload.id)
  if type === 'edit':   supabase.update(op.payload.updates).eq('id', op.payload.id)
clearPendingOps()
```

If `flushPendingOps` itself fails (still offline), ops remain in localStorage for the next attempt.

---

## Error Detection

An operation is considered failed (offline) when:
- `supabase` call throws (network error / fetch failed)
- `supabase` returns `{ error }` where `error.message` includes "fetch" or status is 0

Use a try/catch around every Supabase call and treat any throw as an offline failure.

---

## Edge Cases

| Scenario | Behaviour |
|----------|-----------|
| Alarm created offline, app reopened offline | Cache shows alarm, notification still scheduled |
| Alarm created offline, app reopened online | `flushPendingOps` inserts to Supabase, then Supabase fetch confirms it |
| Delete offline, reconnect | Pending delete replays; Supabase row removed |
| Same alarm toggled 3× offline | Three toggle ops queued; all replay in order |
| Cache corrupted (bad JSON) | `getCachedAlarms` catches + returns `[]`; Supabase fetch fills it in |

---

## Out of Scope

- Conflict resolution between two devices editing the same alarm offline simultaneously
- Offline auth (login/logout requires network — by design)
- Showing the user a sync status indicator
