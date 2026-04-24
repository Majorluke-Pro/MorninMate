# Create Alarm Smoothness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the loading screen that flashes when returning from the native create-alarm screen, and make the time picker card obviously tappable.

**Architecture:** Two independent file changes — one in the React context layer that controls when the loading spinner shows, and one in the Kotlin Compose UI that adds a visual edit affordance to the time card. No shared state between them.

**Tech Stack:** React (AppContext.jsx), Kotlin + Jetpack Compose (CreateAlarmActivity.kt), Gradle

**Note:** This project has no automated test suite. Each task uses manual on-device verification instead of TDD steps.

---

### Task 1: Silent background refresh when cache exists

**Files:**
- Modify: `src/context/AppContext.jsx:837-864`

**Context:**  
`loadUserData` is called every time the app comes to the foreground (`appStateChange: { isActive: true }`). It currently calls `setLoading(true)` unconditionally at line 840, before it checks whether cached data is available. This makes the app flash a loading spinner every time you return from the native alarm-creation screen (or any other foreground resume). The fix: only show the spinner when there is truly no cache to boot from.

- [ ] **Step 1: Edit `loadUserData` in `AppContext.jsx`**

  Remove the unconditional `setLoading(true)` on line 840 and move it into the `else` branch of the `canBootFromCache` check at line 861.

  **Before (lines 837–864):**
  ```javascript
  async function loadUserData(userId) {
    if (loadingData.current) return;
    loadingData.current = true;
    setLoading(true);

    const cachedUser = getCachedUser();
    const cachedAlarms = getCachedAlarms();
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
    }
  ```

  **After:**
  ```javascript
  async function loadUserData(userId) {
    if (loadingData.current) return;
    loadingData.current = true;

    const cachedUser = getCachedUser();
    const cachedAlarms = getCachedAlarms();
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
  ```

  Everything after this block (the `!navigator.onLine` check, the `try/finally`, etc.) is unchanged.

- [ ] **Step 2: Verify manually**

  Build and run the app on device. Create a new alarm via the native screen. After tapping "Set alarm", confirm the app returns directly to the home screen with **no** loading spinner. The alarm should appear in the list immediately.

  Also confirm first cold launch still shows a loading screen: clear app data in Android settings → reopen app → loading screen should appear as before.

- [ ] **Step 3: Commit**

  ```bash
  git add src/context/AppContext.jsx
  git commit -m "fix: suppress loading spinner on foreground resume when cache exists"
  ```

---

### Task 2: Make the time picker card obviously tappable

**Files:**
- Modify: `android/app/build.gradle`
- Modify: `android/app/src/main/java/com/morninmate/app/CreateAlarmActivity.kt:444-491`

**Context:**  
The `TimeCard` composable is tappable (the whole card opens a `TimePickerDialog`) but the only hint is a small, muted-color text line at the bottom. Users miss it. The fix: add a prominent edit icon badge in the top-right corner of the card, and change the hint text color to `Dawn` (orange) so it reads as an action.

- [ ] **Step 1: Add `material-icons-core` to `app/build.gradle`**

  The `Icons.Default.Edit` vector is in `material-icons-core`, which is not pulled in transitively by `material3`. Add it inside the `dependencies` block, after the existing `material3` line:

  **In `android/app/build.gradle`, find:**
  ```groovy
  implementation 'androidx.compose.material3:material3'
  ```

  **Add immediately after:**
  ```groovy
  implementation 'androidx.compose.material:material-icons-core'
  ```

- [ ] **Step 2: Add icon imports to `CreateAlarmActivity.kt`**

  At the top of the file, add these three imports alongside the existing `androidx.compose.*` imports (they can go after the last `androidx.compose.material3.*` import):

  ```kotlin
  import androidx.compose.material.icons.Icons
  import androidx.compose.material.icons.filled.Edit
  import androidx.compose.material3.Icon
  ```

- [ ] **Step 3: Update `TimeCard` — add edit badge and fix hint color**

  The `TimeCard` composable lives at lines 444–491. The outer `Box` (lines 461–489) contains a single `Column` child. Add a second child to that `Box` — an edit icon circle positioned at `Alignment.TopEnd` — and change the hint text color from `TextMuted` to `Dawn`.

  **Replace the entire `Box` block (lines 461–489):**

  ```kotlin
  Box(
      modifier = Modifier
          .fillMaxWidth()
          .background(
              Brush.radialGradient(
                  colors = listOf(Color(0x33FF6B35), Color.Transparent),
                  radius = 800f,
              ),
          )
          .padding(24.dp),
  ) {
      Column {
          Text("Wake-up time", color = TextMuted, fontSize = 13.sp, fontWeight = FontWeight.Bold)
          Spacer(Modifier.height(8.dp))
          Row(verticalAlignment = Alignment.Bottom) {
              Text(
                  "%d:%02d".format(displayHour, minute),
                  color = TextPrimary,
                  fontSize = 56.sp,
                  fontWeight = FontWeight.Black,
              )
              Spacer(Modifier.width(10.dp))
              Text(period, color = Sunrise, fontSize = 18.sp, fontWeight = FontWeight.Black)
          }
          Spacer(Modifier.height(12.dp))
          Text(contextLabel, color = Dawn, fontWeight = FontWeight.Bold)
          Text("Tap to change time", color = Dawn)
      }
      Box(
          modifier = Modifier
              .align(Alignment.TopEnd)
              .size(32.dp)
              .background(Dawn.copy(alpha = 0.15f), CircleShape),
          contentAlignment = Alignment.Center,
      ) {
          Icon(
              imageVector = Icons.Default.Edit,
              contentDescription = "Edit time",
              tint = Dawn,
              modifier = Modifier.size(16.dp),
          )
      }
  }
  ```

  Note the two changes inside `Column`:
  - Line that was `Text("Tap to change using Android's native time picker", color = TextMuted)` → `Text("Tap to change time", color = Dawn)`
  - The new `Box` with the edit icon is a sibling of `Column`, not inside it

- [ ] **Step 4: Build and verify on device**

  ```bash
  cd android && ./gradlew assembleDebug
  ```

  Install and open the app. Tap "+" to create a new alarm. Confirm:
  - The time card shows a small orange edit icon circle in the top-right corner
  - The hint text at the bottom of the card reads "Tap to change time" in orange
  - Tapping anywhere on the card still opens the system time picker dialog

- [ ] **Step 5: Commit**

  ```bash
  git add android/app/build.gradle
  git add android/app/src/main/java/com/morninmate/app/CreateAlarmActivity.kt
  git commit -m "feat: add edit icon and improve hint text on time picker card"
  ```
