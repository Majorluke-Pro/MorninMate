# Hardcore Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 4th "Hardcore" intensity level that locks the alarm at max volume, removes all escape routes, and forces the user to complete all 3 games at hard difficulty before dismissal.

**Architecture:** Hardcore is a new `pulse.intensity` value (`'hardcore'`) that flows through the existing alarm data model. JS side branches on this value to hide the End button, tighten the inactivity timer, and call 3 new native methods. Android side adds volume forcing, a back-button block in `MainActivity`, and a `HardcoreGuardService` foreground service that re-launches the app if the user backgrounds it.

**Tech Stack:** React + MUI (JS), Capacitor (bridge), Java / Android SDK (native)

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/components/Alarm/CreateAlarm.jsx` | Modify | Add Hardcore intensity card, warning dialog, hide game toggles when hardcore |
| `src/components/WakeUp/WakeUpFlow.jsx` | Modify | No End button, 10s inactivity, volume/lock calls, themed intro + result |
| `src/lib/nativeAlarms.js` | Modify | Expose `setHardcoreVolume`, `enableHardcoreLock`, `disableHardcoreLock` |
| `android/app/src/main/java/com/morninmate/app/AlarmPlugin.java` | Modify | Add the 3 new `@PluginMethod`s |
| `android/app/src/main/java/com/morninmate/app/MainActivity.java` | Modify | `isHardcoreLocked` static flag + `onBackPressed` no-op |
| `android/app/src/main/java/com/morninmate/app/HardcoreGuardService.java` | Create | Foreground service that re-launches app when backgrounded |
| `android/app/src/main/AndroidManifest.xml` | Modify | Register `HardcoreGuardService`, add `MODIFY_AUDIO_SETTINGS` permission |

---

## Task 1: Hardcore constants in WakeUpFlow.jsx

**Files:**
- Modify: `src/components/WakeUp/WakeUpFlow.jsx`

- [ ] **Step 1: Extend DIFFICULTY_MAP and XP_REWARD**

  In `WakeUpFlow.jsx`, find lines 27-28:
  ```js
  const DIFFICULTY_MAP = { gentle: 'easy', moderate: 'normal', intense: 'hard' };
  const XP_REWARD = { gentle: 20, moderate: 35, intense: 60 };
  ```
  Replace with:
  ```js
  const DIFFICULTY_MAP = { gentle: 'easy', moderate: 'normal', intense: 'hard', hardcore: 'hard' };
  const XP_REWARD      = { gentle: 20, moderate: 35, intense: 60, hardcore: 100 };
  const INACTIVITY_BY_INTENSITY = { gentle: 30, moderate: 30, intense: 30, hardcore: 10 };
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add src/components/WakeUp/WakeUpFlow.jsx
  git commit -m "feat(hardcore): add hardcore constants to WakeUpFlow"
  ```

---

## Task 2: Hardcore card in CreateAlarm.jsx

**Files:**
- Modify: `src/components/Alarm/CreateAlarm.jsx`

- [ ] **Step 1: Add LocalFireDepartmentIcon import**

  In `CreateAlarm.jsx`, find the block of MUI icon imports (around line 10-28). Add to the list:
  ```js
  import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
  ```

- [ ] **Step 2: Add hardcore to the INTENSITY array**

  Find the `INTENSITY` array (lines 35-39):
  ```js
  const INTENSITY = [
    { value: 'gentle',   Icon: SpaIcon,      label: 'Gentle',   desc: '1 game · Easy mode',   xp: 20, color: '#06D6A0' },
    { value: 'moderate', Icon: WhatshotIcon,  label: 'Moderate', desc: '2 games · Normal mode', xp: 35, color: '#FFD166' },
    { value: 'intense',  Icon: FlashOnIcon,   label: 'Intense',  desc: '3 games · Hard mode',  xp: 60, color: '#EF476F' },
  ];
  ```
  Replace with:
  ```js
  const INTENSITY = [
    { value: 'gentle',   Icon: SpaIcon,                   label: 'Gentle',   desc: '1 game · Easy mode',            xp: 20,  color: '#06D6A0' },
    { value: 'moderate', Icon: WhatshotIcon,               label: 'Moderate', desc: '2 games · Normal mode',          xp: 35,  color: '#FFD166' },
    { value: 'intense',  Icon: FlashOnIcon,                label: 'Intense',  desc: '3 games · Hard mode',            xp: 60,  color: '#EF476F' },
    { value: 'hardcore', Icon: LocalFireDepartmentIcon,    label: 'Hardcore', desc: '3 games · Hard · No escape',     xp: 100, color: '#EF1C1C' },
  ];
  ```

- [ ] **Step 3: Lock hardcore games in setIntensity**

  Find `setIntensity` (lines 104-107):
  ```js
  function setIntensity(intensity) {
    const map = { gentle: ['math'], moderate: ['math', 'memory'], intense: ['math', 'memory', 'reaction'] };
    setForm(f => ({ ...f, pulse: { intensity, games: map[intensity] } }));
  }
  ```
  Replace with:
  ```js
  function setIntensity(intensity) {
    const map = {
      gentle:   ['math'],
      moderate: ['math', 'memory'],
      intense:  ['math', 'memory', 'reaction'],
      hardcore: ['math', 'memory', 'reaction'],
    };
    setForm(f => ({ ...f, pulse: { intensity, games: map[intensity] } }));
  }
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add src/components/Alarm/CreateAlarm.jsx
  git commit -m "feat(hardcore): add hardcore intensity card and lock games"
  ```

---

## Task 3: Hardcore warning dialog in CreateAlarm.jsx

**Files:**
- Modify: `src/components/Alarm/CreateAlarm.jsx`

- [ ] **Step 1: Add dialog state**

  In `CreateAlarm`, find the `useState` block at the top of the component (around line 74):
  ```js
  const [form, setForm] = useState({
  ```
  Just above it, add:
  ```js
  const [hardcoreWarningOpen, setHardcoreWarningOpen] = useState(false);
  ```

- [ ] **Step 2: Add Dialog import**

  Find the MUI import at line 2:
  ```js
  import { Box, Typography, Button, TextField, IconButton, ToggleButton, ToggleButtonGroup } from '@mui/material';
  ```
  Replace with:
  ```js
  import { Box, Typography, Button, TextField, IconButton, ToggleButton, ToggleButtonGroup, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
  ```

- [ ] **Step 3: Intercept hardcore selection**

  Find the intensity card `onClick` in the JSX (around line 408):
  ```js
  onClick={() => setIntensity(opt.value)}
  ```
  Replace with:
  ```js
  onClick={() => {
    if (opt.value === 'hardcore') {
      setHardcoreWarningOpen(true);
    } else {
      setIntensity(opt.value);
    }
  }}
  ```

- [ ] **Step 4: Add the warning dialog JSX**

  Just before the closing `</Box>` of the return (before the fixed save button `Box`, around line 517), add:
  ```jsx
  <Dialog
    open={hardcoreWarningOpen}
    onClose={() => setHardcoreWarningOpen(false)}
    PaperProps={{
      sx: {
        bgcolor: '#1A0808',
        border: '1.5px solid rgba(239,28,28,0.4)',
        borderRadius: 4,
        mx: 2,
      },
    }}
  >
    <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
      <LocalFireDepartmentIcon sx={{ color: '#EF1C1C', fontSize: '1.8rem' }} />
      <Typography fontWeight={900} fontSize="1.15rem">Are you sure?</Typography>
    </DialogTitle>
    <DialogContent>
      <Typography variant="body2" color="text.secondary" lineHeight={1.7}>
        <strong style={{ color: '#EF1C1C' }}>Hardcore Mode</strong> forces{' '}
        <strong>maximum volume</strong> and locks your phone to this app until all 3 games
        are completed. There is <strong>no way out</strong>.
      </Typography>
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
      <Button
        variant="outlined"
        onClick={() => setHardcoreWarningOpen(false)}
        sx={{ borderColor: 'rgba(255,255,255,0.15)', color: 'text.secondary', borderRadius: 2 }}
      >
        Cancel
      </Button>
      <Button
        variant="contained"
        onClick={() => { setIntensity('hardcore'); setHardcoreWarningOpen(false); }}
        sx={{ bgcolor: '#EF1C1C', '&:hover': { bgcolor: '#CC1818' }, borderRadius: 2, fontWeight: 800 }}
      >
        Lock It In
      </Button>
    </DialogActions>
  </Dialog>
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add src/components/Alarm/CreateAlarm.jsx
  git commit -m "feat(hardcore): add warning dialog before committing hardcore mode"
  ```

---

## Task 4: Hide game toggles in hardcore mode (CreateAlarm.jsx)

**Files:**
- Modify: `src/components/Alarm/CreateAlarm.jsx`

- [ ] **Step 1: Wrap the Games section in a conditional**

  Find the `{/* ── Games ──` section (around line 456). The section starts with:
  ```jsx
  <Separator />

  {/* ── Games ────────────────────────────────────────────────────────── */}
  <Section delay={0.26}>
  ```
  Replace with:
  ```jsx
  <Separator />

  {/* ── Games ────────────────────────────────────────────────────────── */}
  {form.pulse.intensity !== 'hardcore' && (
  <Section delay={0.26}>
  ```
  And close the conditional after the `</Section>` that ends the games block:
  ```jsx
  </Section>
  )}
  ```

- [ ] **Step 2: Verify the app builds**

  ```bash
  npm run build
  ```
  Expected: build succeeds with no errors.

- [ ] **Step 3: Commit**

  ```bash
  git add src/components/Alarm/CreateAlarm.jsx
  git commit -m "feat(hardcore): hide game toggles when hardcore intensity is selected"
  ```

---

## Task 5: WakeUpFlow — no End button + 10s inactivity

**Files:**
- Modify: `src/components/WakeUp/WakeUpFlow.jsx`

- [ ] **Step 1: Derive isHardcore and inactivity limit**

  In `WakeUpFlow`, find the block that derives `games`, `intensity`, `difficulty`, `xpReward` (around lines 33-35):
  ```js
  const games      = activeAlarm?.pulse?.games || ['math'];
  const intensity  = activeAlarm?.pulse?.intensity || 'moderate';
  const difficulty = DIFFICULTY_MAP[intensity];
  const xpReward   = XP_REWARD[intensity];
  ```
  Replace with:
  ```js
  const games           = activeAlarm?.pulse?.games || ['math'];
  const intensity       = activeAlarm?.pulse?.intensity || 'moderate';
  const difficulty      = DIFFICULTY_MAP[intensity];
  const xpReward        = XP_REWARD[intensity];
  const isHardcore      = intensity === 'hardcore';
  const INACTIVITY_LIMIT = INACTIVITY_BY_INTENSITY[intensity] ?? 30;
  ```

- [ ] **Step 2: Remove the End button when hardcore**

  Find the End button in the JSX (around line 196):
  ```jsx
  <Button
    variant="text"
    size="small"
    disabled={ending}
    onClick={handleEndEarly}
    sx={{ color: 'rgba(255,255,255,0.55)', fontWeight: 800, px: 1, minWidth: 0 }}
  >
    End
  </Button>
  ```
  Replace with:
  ```jsx
  {!isHardcore && (
    <Button
      variant="text"
      size="small"
      disabled={ending}
      onClick={handleEndEarly}
      sx={{ color: 'rgba(255,255,255,0.55)', fontWeight: 800, px: 1, minWidth: 0 }}
    >
      End
    </Button>
  )}
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add src/components/WakeUp/WakeUpFlow.jsx
  git commit -m "feat(hardcore): remove End button and tighten inactivity to 10s in hardcore mode"
  ```

---

## Task 6: WakeUpFlow — themed Intro + Result screens for hardcore

**Files:**
- Modify: `src/components/WakeUp/WakeUpFlow.jsx`

- [ ] **Step 1: Pass isHardcore to IntroScreen**

  Find the `<IntroScreen` render (around line 163):
  ```jsx
  <IntroScreen
    alarm={activeAlarm}
    games={games}
    intensity={intensity}
    xpReward={xpReward}
    onStart={async () => {
  ```
  Replace with:
  ```jsx
  <IntroScreen
    alarm={activeAlarm}
    games={games}
    intensity={intensity}
    xpReward={xpReward}
    isHardcore={isHardcore}
    onStart={async () => {
  ```

- [ ] **Step 2: Pass isHardcore to ResultScreen**

  Find the `<ResultScreen` render (around line 178):
  ```jsx
  <ResultScreen
    results={results}
    xpReward={xpReward}
    totalFails={totalFails}
    onDone={clearActiveAlarm}
  />
  ```
  Replace with:
  ```jsx
  <ResultScreen
    results={results}
    xpReward={xpReward}
    totalFails={totalFails}
    isHardcore={isHardcore}
    onDone={clearActiveAlarm}
  />
  ```

- [ ] **Step 3: Update IntroScreen to accept and use isHardcore**

  Find the `IntroScreen` function signature (around line 285):
  ```js
  function IntroScreen({ alarm, games, intensity, xpReward, onStart }) {
  ```
  Replace with:
  ```js
  function IntroScreen({ alarm, games, intensity, xpReward, isHardcore, onStart }) {
  ```

  Find the intensity color/icon lookup at the top of `IntroScreen`:
  ```js
  const INTENSITY_ICON  = { gentle: SpaIcon, moderate: WhatshotIcon, intense: FlashOnIcon };
  const INTENSITY_COLOR = { gentle: '#06D6A0', moderate: '#FFD166', intense: '#EF476F' };
  const IntensityIcon   = INTENSITY_ICON[intensity];
  const intensityColor  = INTENSITY_COLOR[intensity];
  ```
  Replace with:
  ```js
  const INTENSITY_ICON  = { gentle: SpaIcon, moderate: WhatshotIcon, intense: FlashOnIcon, hardcore: LocalFireDepartmentIcon };
  const INTENSITY_COLOR = { gentle: '#06D6A0', moderate: '#FFD166', intense: '#EF476F', hardcore: '#EF1C1C' };
  const IntensityIcon   = INTENSITY_ICON[intensity];
  const intensityColor  = INTENSITY_COLOR[intensity];
  ```

  Find the intro subtitle (around line 347):
  ```jsx
  <Typography variant="caption" color="text.disabled" sx={{ mb: 4 }}>
    No dodging it, mate — finish all games to dismiss.
  </Typography>
  ```
  Replace with:
  ```jsx
  {isHardcore && (
    <Box sx={{
      mb: 2, px: 2.5, py: 1.25, borderRadius: 2.5,
      bgcolor: 'rgba(239,28,28,0.12)', border: '1.5px solid rgba(239,28,28,0.4)',
      display: 'flex', alignItems: 'center', gap: 1,
    }}>
      <Typography variant="body2" fontWeight={800} color="#EF1C1C">
        Hardcore Mode — Full volume. No escape. Finish or suffer.
      </Typography>
    </Box>
  )}
  <Typography variant="caption" color="text.disabled" sx={{ mb: 4 }}>
    No dodging it, mate — finish all games to dismiss.
  </Typography>
  ```

  Find the Start button label (around line 421):
  ```jsx
  Start Wake-Up Routine
  ```
  Replace with:
  ```jsx
  {isHardcore ? 'Begin (No Going Back)' : 'Start Wake-Up Routine'}
  ```

- [ ] **Step 4: Add LocalFireDepartmentIcon import to WakeUpFlow.jsx**

  Find the existing icon imports at the top of `WakeUpFlow.jsx` (around lines 6-15). Add to the list:
  ```js
  import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
  ```

- [ ] **Step 5: Update ResultScreen to accept and use isHardcore**

  Find the `ResultScreen` function signature (around line 431):
  ```js
  function ResultScreen({ results, xpReward, totalFails, onDone }) {
  ```
  Replace with:
  ```js
  function ResultScreen({ results, xpReward, totalFails, isHardcore, onDone }) {
  ```

  Find the ResultScreen headline (around line 479):
  ```jsx
  <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: '-0.5px', mb: 0.5 }}>
    Bonzer, you're up!
  </Typography>
  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
    Ripper morning routine, mate
  </Typography>
  ```
  Replace with:
  ```jsx
  <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: '-0.5px', mb: 0.5 }}>
    {isHardcore ? 'You survived.' : 'Bonzer, you\'re up!'}
  </Typography>
  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
    {isHardcore ? 'That was brutal. Respect.' : 'Ripper morning routine, mate'}
  </Typography>
  ```

- [ ] **Step 6: Verify build**

  ```bash
  npm run build
  ```
  Expected: build succeeds with no errors.

- [ ] **Step 7: Commit**

  ```bash
  git add src/components/WakeUp/WakeUpFlow.jsx
  git commit -m "feat(hardcore): themed intro and result screens for hardcore mode"
  ```

---

## Task 7: Expose hardcore native calls in nativeAlarms.js

**Files:**
- Modify: `src/lib/nativeAlarms.js`

- [ ] **Step 1: Add the three exported functions**

  At the end of `src/lib/nativeAlarms.js`, after `onNotificationTap`, add:
  ```js
  // ─── Hardcore Mode ────────────────────────────────────────────────────────────

  export async function setHardcoreVolume() {
    if (!isNative) return;
    try { await AlarmPlugin.setHardcoreVolume(); } catch (_) {}
  }

  export async function enableHardcoreLock() {
    if (!isNative) return;
    try { await AlarmPlugin.enableHardcoreLock(); } catch (_) {}
  }

  export async function disableHardcoreLock() {
    if (!isNative) return;
    try { await AlarmPlugin.disableHardcoreLock(); } catch (_) {}
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add src/lib/nativeAlarms.js
  git commit -m "feat(hardcore): expose setHardcoreVolume, enableHardcoreLock, disableHardcoreLock in nativeAlarms"
  ```

---

## Task 8: Wire hardcore native calls into WakeUpFlow.jsx

**Files:**
- Modify: `src/components/WakeUp/WakeUpFlow.jsx`

- [ ] **Step 1: Import the new native functions**

  Find the existing import from `nativeAlarms` (if any). If there is none, add at the top of `WakeUpFlow.jsx` (after other imports):
  ```js
  import { setHardcoreVolume, enableHardcoreLock, disableHardcoreLock } from '../../lib/nativeAlarms';
  ```

- [ ] **Step 2: Call native methods in the alarm sound useEffect**

  Find the `useEffect` that calls `startAlarm` on mount (around lines 39-42):
  ```js
  useEffect(() => {
    startAlarm(activeAlarm?.sound ?? 'classic');
    return () => stopAlarm();
  }, []);
  ```
  Replace with:
  ```js
  useEffect(() => {
    startAlarm(activeAlarm?.sound ?? 'classic');
    if (isHardcore) {
      setHardcoreVolume();
      enableHardcoreLock();
    }
    return () => {
      stopAlarm();
      if (isHardcore) disableHardcoreLock();
    };
  }, []);
  ```

  Note: `isHardcore` is derived before this effect and doesn't change — the empty dependency array is intentional and correct here.

- [ ] **Step 3: Verify build**

  ```bash
  npm run build
  ```
  Expected: build succeeds with no errors.

- [ ] **Step 4: Commit**

  ```bash
  git add src/components/WakeUp/WakeUpFlow.jsx
  git commit -m "feat(hardcore): call volume lock and guard service from WakeUpFlow"
  ```

---

## Task 9: AlarmPlugin.java — add setHardcoreVolume, enableHardcoreLock, disableHardcoreLock

**Files:**
- Modify: `android/app/src/main/java/com/morninmate/app/AlarmPlugin.java`

- [ ] **Step 1: Add AudioManager import**

  Find the existing imports in `AlarmPlugin.java`. Add:
  ```java
  import android.media.AudioManager;
  ```

- [ ] **Step 2: Add savedAlarmVolume field**

  Find the class body opening, just after:
  ```java
  public class AlarmPlugin extends Plugin {

      private static final String PREFS_NAME = "MorninMateAlarms";
  ```
  Add after `PREFS_NAME`:
  ```java
      private int savedAlarmVolume = -1;
  ```

- [ ] **Step 3: Add setHardcoreVolume method**

  At the end of `AlarmPlugin.java`, just before the closing `}` of the class, add:
  ```java
      @PluginMethod
      public void setHardcoreVolume(PluginCall call) {
          AudioManager audio = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
          savedAlarmVolume = audio.getStreamVolume(AudioManager.STREAM_ALARM);
          int maxVolume = audio.getStreamMaxVolume(AudioManager.STREAM_ALARM);
          audio.setStreamVolume(AudioManager.STREAM_ALARM, maxVolume, 0);
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
              audio.adjustStreamVolume(AudioManager.STREAM_ALARM, AudioManager.ADJUST_UNMUTE, 0);
          }
          call.resolve();
      }
  ```

- [ ] **Step 4: Add enableHardcoreLock method**

  After `setHardcoreVolume`, add:
  ```java
      @PluginMethod
      public void enableHardcoreLock(PluginCall call) {
          MainActivity.isHardcoreLocked = true;
          Intent guardIntent = new Intent(getContext(), HardcoreGuardService.class);
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
              getContext().startForegroundService(guardIntent);
          } else {
              getContext().startService(guardIntent);
          }
          call.resolve();
      }
  ```

- [ ] **Step 5: Add disableHardcoreLock method**

  After `enableHardcoreLock`, add:
  ```java
      @PluginMethod
      public void disableHardcoreLock(PluginCall call) {
          MainActivity.isHardcoreLocked = false;
          getContext().stopService(new Intent(getContext(), HardcoreGuardService.class));
          if (savedAlarmVolume >= 0) {
              AudioManager audio = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
              audio.setStreamVolume(AudioManager.STREAM_ALARM, savedAlarmVolume, 0);
              savedAlarmVolume = -1;
          }
          call.resolve();
      }
  ```

- [ ] **Step 6: Commit**

  ```bash
  git add android/app/src/main/java/com/morninmate/app/AlarmPlugin.java
  git commit -m "feat(hardcore): add setHardcoreVolume, enableHardcoreLock, disableHardcoreLock to AlarmPlugin"
  ```

---

## Task 10: MainActivity.java — back button block

**Files:**
- Modify: `android/app/src/main/java/com/morninmate/app/MainActivity.java`

- [ ] **Step 1: Add the static flag and onBackPressed override**

  In `MainActivity.java`, find the class body opening:
  ```java
  public class MainActivity extends BridgeActivity {
  ```
  Add immediately after it:
  ```java
      public static boolean isHardcoreLocked = false;
  ```

  Then find `onCreate` (line 13). After `applyAlarmWindowFlags(getIntent());`, add:

  Actually, add `onBackPressed` as a new method. Find the closing `}` of `applyAlarmWindowFlags` and add after it:
  ```java
      @Override
      public void onBackPressed() {
          if (isHardcoreLocked) return;
          super.onBackPressed();
      }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add android/app/src/main/java/com/morninmate/app/MainActivity.java
  git commit -m "feat(hardcore): block back button in MainActivity when isHardcoreLocked"
  ```

---

## Task 11: Create HardcoreGuardService.java

**Files:**
- Create: `android/app/src/main/java/com/morninmate/app/HardcoreGuardService.java`

- [ ] **Step 1: Create the file**

  Create `android/app/src/main/java/com/morninmate/app/HardcoreGuardService.java` with:
  ```java
  package com.morninmate.app;

  import android.app.Application;
  import android.app.Notification;
  import android.app.NotificationChannel;
  import android.app.NotificationManager;
  import android.app.Service;
  import android.content.Intent;
  import android.os.Build;
  import android.os.IBinder;

  import androidx.core.app.NotificationCompat;

  import java.util.concurrent.atomic.AtomicInteger;

  public class HardcoreGuardService extends Service {

      private static final String CHANNEL_ID = "morninmate_hardcore_guard";
      private static final int    NOTIF_ID   = 7655;

      private final AtomicInteger activitiesStarted = new AtomicInteger(0);
      private Application.ActivityLifecycleCallbacks lifecycleCallbacks;

      @Override
      public int onStartCommand(Intent intent, int flags, int startId) {
          createNotificationChannel();
          startForeground(NOTIF_ID, buildNotification());

          lifecycleCallbacks = new Application.ActivityLifecycleCallbacks() {
              @Override public void onActivityCreated(android.app.Activity a, android.os.Bundle b) {}
              @Override public void onActivityResumed(android.app.Activity a) {}
              @Override public void onActivityPaused(android.app.Activity a) {}
              @Override public void onActivitySaveInstanceState(android.app.Activity a, android.os.Bundle b) {}
              @Override public void onActivityDestroyed(android.app.Activity a) {}

              @Override
              public void onActivityStarted(android.app.Activity activity) {
                  activitiesStarted.incrementAndGet();
              }

              @Override
              public void onActivityStopped(android.app.Activity activity) {
                  if (activitiesStarted.decrementAndGet() <= 0 && MainActivity.isHardcoreLocked) {
                      relaunchApp();
                  }
              }
          };

          ((Application) getApplicationContext()).registerActivityLifecycleCallbacks(lifecycleCallbacks);
          return START_STICKY;
      }

      private void relaunchApp() {
          Intent launch = new Intent(this, MainActivity.class);
          launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
          startActivity(launch);
      }

      @Override
      public void onDestroy() {
          if (lifecycleCallbacks != null) {
              ((Application) getApplicationContext())
                  .unregisterActivityLifecycleCallbacks(lifecycleCallbacks);
          }
          super.onDestroy();
      }

      @Override
      public IBinder onBind(Intent intent) { return null; }

      private Notification buildNotification() {
          int iconResId = getResources().getIdentifier(
              "ic_launcher_foreground", "drawable", getPackageName());
          if (iconResId == 0) iconResId = android.R.drawable.ic_dialog_alert;

          return new NotificationCompat.Builder(this, CHANNEL_ID)
              .setSmallIcon(iconResId)
              .setContentTitle("MorninMate Hardcore")
              .setContentText("Finish your games to dismiss the alarm.")
              .setPriority(NotificationCompat.PRIORITY_LOW)
              .setOngoing(true)
              .build();
      }

      private void createNotificationChannel() {
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
              NotificationChannel ch = new NotificationChannel(
                  CHANNEL_ID, "Hardcore Guard", NotificationManager.IMPORTANCE_LOW);
              ch.setDescription("Keeps hardcore alarm active if app is backgrounded");
              getSystemService(NotificationManager.class).createNotificationChannel(ch);
          }
      }
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add android/app/src/main/java/com/morninmate/app/HardcoreGuardService.java
  git commit -m "feat(hardcore): add HardcoreGuardService to re-launch app when backgrounded"
  ```

---

## Task 12: AndroidManifest.xml — register service + add permission

**Files:**
- Modify: `android/app/src/main/AndroidManifest.xml`

- [ ] **Step 1: Add MODIFY_AUDIO_SETTINGS permission**

  Find the permissions block. After:
  ```xml
  <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />
  ```
  Add:
  ```xml
  <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
  ```

- [ ] **Step 2: Register HardcoreGuardService**

  Find the `AlarmService` service declaration:
  ```xml
  <service
      android:name=".AlarmService"
      android:foregroundServiceType="mediaPlayback"
      android:exported="false" />
  ```
  After it, add:
  ```xml
  <!-- Hardcore guard — re-launches app if user backgrounds during hardcore alarm -->
  <service
      android:name=".HardcoreGuardService"
      android:foregroundServiceType="mediaPlayback"
      android:exported="false" />
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add android/app/src/main/AndroidManifest.xml
  git commit -m "feat(hardcore): register HardcoreGuardService and add MODIFY_AUDIO_SETTINGS permission"
  ```

---

## Task 13: Build and verify on device

- [ ] **Step 1: Build the Android APK**

  ```bash
  npm run build && npx cap sync android
  ```
  Expected: sync completes, no errors.

- [ ] **Step 2: Open in Android Studio and run on device**

  ```bash
  npx cap open android
  ```
  Then run on a physical Android device (emulators don't play alarm audio reliably).

- [ ] **Step 3: Manual test — alarm creation**

  1. Open app → Create Alarm
  2. Select "Hardcore" intensity → confirm warning dialog appears
  3. Tap "Cancel" → confirm selection reverts to previous intensity
  4. Select "Hardcore" again → tap "Lock It In"
  5. Confirm: game toggles section is hidden, all 3 game chips are saved in alarm data

- [ ] **Step 4: Manual test — alarm firing**

  1. Set a hardcore alarm 1-2 minutes from now
  2. Lock phone or background app
  3. When alarm fires: confirm full volume (overrides phone volume) and app appears over lock screen
  4. Press back button → confirm nothing happens
  5. Press home → confirm app re-surfaces within ~1 second
  6. Fail a game → confirm alarm restarts; no End button visible
  7. Complete all 3 games → confirm "You survived." result screen appears and alarm stops
  8. Confirm volume restores to pre-alarm level after dismissal

- [ ] **Step 5: Final commit**

  ```bash
  git add -A
  git commit -m "feat(hardcore): complete hardcore mode implementation"
  ```
