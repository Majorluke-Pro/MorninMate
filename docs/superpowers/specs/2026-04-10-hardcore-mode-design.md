# Hardcore Mode — Design Spec
**Date:** 2026-04-10
**Status:** Approved

---

## Overview

Hardcore Mode is a 4th wake-up intensity level (alongside Gentle, Moderate, Intense) that makes it genuinely impossible to snooze or escape the alarm. When active:

- All 3 games run at hard difficulty — locked, no customisation
- The alarm plays at **forced maximum volume** regardless of system settings
- There is **no "End" / bail-out button**
- The app **cannot be backgrounded** — if the user leaves, the alarm restarts and the app snaps back within ~1 second
- The only way to dismiss is to complete all 3 games

---

## 1. Data Model

`pulse.intensity` gains a 4th enum value: `'hardcore'`.

```js
// Existing values
'gentle'   → 1 game, easy,   +20 XP
'moderate' → 2 games, normal, +35 XP
'intense'  → 3 games, hard,   +60 XP

// New
'hardcore' → 3 games, hard,   +100 XP  (all games locked, no escape)
```

New entries in `WakeUpFlow` constants:

```js
const DIFFICULTY_MAP = { gentle: 'easy', moderate: 'normal', intense: 'hard', hardcore: 'hard' };
const XP_REWARD      = { gentle: 20, moderate: 35, intense: 60, hardcore: 100 };
const INACTIVITY_LIMIT_BY_INTENSITY = { gentle: 30, moderate: 30, intense: 30, hardcore: 10 };
```

---

## 2. Alarm Setup — `CreateAlarm.jsx`

### Intensity card

A 4th card is added to the `INTENSITY` array:

```js
{ value: 'hardcore', Icon: LocalFireDepartmentIcon, label: 'Hardcore', desc: '3 games · Hard mode · No escape', xp: 100, color: '#EF1C1C' }
```

Visual treatment: crimson (`#EF1C1C`) with a skull/fire icon — clearly distinct from the orange/yellow/red of existing levels.

### Warning dialog

Triggered immediately when the user taps the Hardcore card, **before** the selection is committed.

- Modal overlay, red-tinted background
- Icon: skull or fire (MUI `LocalFireDepartmentIcon` or similar)
- Title: **"Are you sure?"**
- Body: *"Hardcore Mode forces maximum volume and locks your phone to this app until all 3 games are completed. There is no way out."*
- Two buttons: **"Cancel"** (dismisses, selection reverts) and **"Lock It In"** (confirms, commits hardcore)

### Game toggles

When `intensity === 'hardcore'`, the game selector section is hidden entirely. All 3 games are force-set in `setIntensity`:

```js
function setIntensity(intensity) {
  const map = {
    gentle: ['math'],
    moderate: ['math', 'memory'],
    intense: ['math', 'memory', 'reaction'],
    hardcore: ['math', 'memory', 'reaction'],  // locked
  };
  setForm(f => ({ ...f, pulse: { intensity, games: map[intensity] } }));
}
```

---

## 3. Wake-Up Flow — `WakeUpFlow.jsx`

### Hardcore flag

```js
const isHardcore = intensity === 'hardcore';
```

### Volume + lock — on mount

```js
useEffect(() => {
  startAlarm(activeAlarm?.sound ?? 'classic');
  if (isHardcore) {
    AlarmPlugin.setHardcoreVolume();      // force STREAM_ALARM to max
    AlarmPlugin.enableHardcoreLock();    // back button + guard service
  }
  return () => {
    stopAlarm();
    if (isHardcore) AlarmPlugin.disableHardcoreLock();  // restore volume + unlock
  };
}, []);
```

### Inactivity limit

```js
const INACTIVITY_LIMIT = isHardcore ? 10 : 30;
```

### End button

Conditionally rendered — not shown at all in hardcore:

```js
{!isHardcore && (
  <Button onClick={handleEndEarly}>End</Button>
)}
```

### Intro screen

Pass `isHardcore` to `IntroScreen`. When hardcore:
- Theme color: `#EF1C1C` (crimson)
- Warning banner below title: *"Hardcore Mode — Full volume. No escape. Finish or suffer."*
- Start button label: **"Begin (No Going Back)"**

### Result screen

Pass `isHardcore` to `ResultScreen`. When hardcore:
- Headline: **"You survived."**
- Subtext: *"That was brutal. Respect."*
- XP badge: `+100 XP` with crimson glow

---

## 4. Android Native Layer

### `AlarmPlugin.java` — two new methods

#### `setHardcoreVolume()`

```java
@PluginMethod
public void setHardcoreVolume(PluginCall call) {
    AudioManager audio = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
    savedAlarmVolume = audio.getStreamVolume(AudioManager.STREAM_ALARM);
    int maxVolume = audio.getStreamMaxVolume(AudioManager.STREAM_ALARM);
    audio.setStreamVolume(AudioManager.STREAM_ALARM, maxVolume, 0);
    audio.adjustStreamVolume(AudioManager.STREAM_ALARM, AudioManager.ADJUST_UNMUTE, 0);
    call.resolve();
}
```

#### `enableHardcoreLock()`

- Sets a static `isHardcoreLocked = true` flag on `MainActivity`
- `MainActivity.onBackPressed()` (or `OnBackPressedCallback`) checks flag and no-ops when true
- Starts `HardcoreGuardService` — a foreground service that:
  - Registers `ActivityLifecycleCallbacks`
  - When all activities are stopped (app backgrounded), calls `startActivity(launchIntent)` to re-surface the app
  - Shows persistent notification: *"MorninMate Hardcore — finish your games to dismiss"*

#### `disableHardcoreLock()`

- Sets `isHardcoreLocked = false`
- Stops `HardcoreGuardService`
- Restores saved alarm volume via `AudioManager`

### Note on home button

Android OS does not permit apps to fully block the home button (system security restriction). The `HardcoreGuardService` approach is the closest legal alternative — the app re-surfaces within ~1 second of being backgrounded. The `AlarmService` foreground service (already implemented) ensures alarm audio continues playing during that gap.

---

## 5. Files to Change / Create

| File | Change |
|------|--------|
| `src/components/Alarm/CreateAlarm.jsx` | Add hardcore intensity card, warning dialog, hide game toggles when hardcore |
| `src/components/WakeUp/WakeUpFlow.jsx` | Add hardcore branches: volume lock, no End button, 10s inactivity, themed intro/result screens |
| `android/app/src/main/java/.../AlarmPlugin.java` | Add `setHardcoreVolume`, `enableHardcoreLock`, `disableHardcoreLock` |
| `android/app/src/main/java/.../MainActivity.java` | Add `isHardcoreLocked` flag, override back button handler |
| `android/app/src/main/java/.../HardcoreGuardService.java` | New: foreground service that re-launches app when backgrounded |
| `android/app/src/main/AndroidManifest.xml` | Register `HardcoreGuardService` |
| `src/lib/nativeAlarms.js` | Expose `setHardcoreVolume`, `enableHardcoreLock`, `disableHardcoreLock` |

---

## 6. Out of Scope

- Blocking volume hardware buttons (not possible without device-owner mode)
- Completely blocking home button (OS restriction)
- Per-game difficulty customisation within hardcore (always hard, always all 3)
- Disabling Do Not Disturb / notification silencing (requires separate permission, not worth the complexity)
