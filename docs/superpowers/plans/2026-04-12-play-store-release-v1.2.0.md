# Play Store Release v1.2.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Commit all outstanding changes in logical groups, bump the version to 1.2.0, and produce a signed AAB ready for Play Store upload.

**Architecture:** Five focused commits group changes by concern (auth, android native, progression, cleanup, version bump), followed by a web build, Capacitor sync, and Gradle release build. No new code is written — this is pure commit + build work.

**Tech Stack:** React + Capacitor (Android), Supabase, Gradle, npm/vite

---

## File Map

| Action | File |
|--------|------|
| COMMIT | `src/components/Auth/AuthScreen.jsx` |
| COMMIT | `src/lib/supabase.js` |
| COMMIT | `android/app/src/main/java/com/morninmate/app/AlarmPlugin.java` |
| COMMIT | `android/app/src/main/java/com/morninmate/app/AlarmReceiver.java` |
| COMMIT | `src/context/AppContext.jsx` |
| COMMIT | `src/components/WakeUp/WakeUpFlow.jsx` |
| COMMIT | `supabase/migrations/20260412000050_create_wake_sessions.sql` |
| COMMIT | `supabase/migrations/20260412000100_secure_wake_progression.sql` |
| COMMIT | `src/lib/nativeAlarms.js` |
| COMMIT | `src/lib/sounds.js` |
| COMMIT | `src/components/Games/MemoryGame.jsx` |
| COMMIT | `eslint.config.js` |
| MODIFY | `android/app/build.gradle` — versionCode 3→4, versionName "1.1.0"→"1.2.0" |
| COMMIT | `android/app/build.gradle` |
| COMMIT | `README.md` |

---

## Task 1: Commit auth fixes

**Files:**
- Commit: `src/components/Auth/AuthScreen.jsx`
- Commit: `src/lib/supabase.js`

- [ ] **Step 1: Stage auth files**

```bash
git add src/components/Auth/AuthScreen.jsx src/lib/supabase.js
```

- [ ] **Step 2: Verify staged diff**

```bash
git diff --staged
```

Expected: `AuthScreen.jsx` — adds platform-aware `emailRedirectTo` (native gets `com.morninmate.app://login-callback`, web gets `window.location.origin`). `supabase.js` — changes `detectSessionInUrl: false` to `detectSessionInUrl: !isNative`.

- [ ] **Step 3: Commit**

```bash
git commit -m "$(cat <<'EOF'
fix(auth): platform-aware redirectTo and detectSessionInUrl

Native uses custom scheme for deep link callback; web uses window.location.origin.
detectSessionInUrl is now false only on native where the appUrlOpen listener handles it.
EOF
)"
```

Expected: `[main <hash>] fix(auth): platform-aware redirectTo and detectSessionInUrl`

---

## Task 2: Commit Android alarm fixes

**Files:**
- Commit: `android/app/src/main/java/com/morninmate/app/AlarmPlugin.java`
- Commit: `android/app/src/main/java/com/morninmate/app/AlarmReceiver.java`

- [ ] **Step 1: Stage Android files**

```bash
git add android/app/src/main/java/com/morninmate/app/AlarmPlugin.java
git add android/app/src/main/java/com/morninmate/app/AlarmReceiver.java
```

- [ ] **Step 2: Verify staged diff**

```bash
git diff --staged
```

Expected: `AlarmPlugin.java` — `doSchedule` returns `boolean`, rejects the Capacitor call if `canScheduleExactAlarms` is false and removes the prefs entry. `AlarmReceiver.java` — uses `startForegroundService` only on Android O+, falls back to `startService` on older versions.

- [ ] **Step 3: Commit**

```bash
git commit -m "$(cat <<'EOF'
fix(android): alarm permission rejection and pre-O service compat

doSchedule now returns boolean and rejects the call when exact alarm
permission is denied, preventing silent scheduling failures.
AlarmReceiver falls back to startService on pre-Android O devices.
EOF
)"
```

Expected: `[main <hash>] fix(android): alarm permission rejection and pre-O service compat`

---

## Task 3: Commit server-side progression

**Files:**
- Commit: `src/context/AppContext.jsx`
- Commit: `src/components/WakeUp/WakeUpFlow.jsx`
- Commit: `supabase/migrations/20260412000050_create_wake_sessions.sql`
- Commit: `supabase/migrations/20260412000100_secure_wake_progression.sql`

- [ ] **Step 1: Stage progression files**

```bash
git add src/context/AppContext.jsx src/components/WakeUp/WakeUpFlow.jsx
git add supabase/migrations/20260412000050_create_wake_sessions.sql
git add supabase/migrations/20260412000100_secure_wake_progression.sql
```

- [ ] **Step 2: Verify staged diff**

```bash
git diff --staged
```

Expected: `AppContext.jsx` — removes `awardXP` and `addDemerit`, adds `applyProgressionUpdate` that accepts server-returned XP/level/demerits/streak; `updateUser` no longer accepts progression fields from the client. `WakeUpFlow.jsx` — `handleGameComplete` calls `complete_wake_session` RPC; `handleGameFail` calls `record_wake_game_fail` RPC. Both migrations present.

- [ ] **Step 3: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(progression): server-side XP/level/streak via Supabase RPCs

XP, level, demerits, and streak are now computed by complete_wake_session
and record_wake_game_fail RPCs. Client receives updates and applies them
via applyProgressionUpdate — cannot write progression fields directly.
EOF
)"
```

Expected: `[main <hash>] feat(progression): server-side XP/level/streak via Supabase RPCs`

---

## Task 4: Commit code cleanup

**Files:**
- Commit: `src/lib/nativeAlarms.js`
- Commit: `src/lib/sounds.js`
- Commit: `src/components/Games/MemoryGame.jsx`
- Commit: `eslint.config.js`

- [ ] **Step 1: Stage cleanup files**

```bash
git add src/lib/nativeAlarms.js src/lib/sounds.js src/components/Games/MemoryGame.jsx eslint.config.js
```

- [ ] **Step 2: Verify staged diff**

```bash
git diff --staged
```

Expected: All `catch (_) {}` replaced with `catch {}` across `nativeAlarms.js` and `sounds.js`. Unused `useRef` import removed from `MemoryGame.jsx`. `eslint.config.js` — extended ignore list, `no-empty` rule allows empty catch, expanded `no-unused-vars` pattern, several react-hooks rules turned off.

- [ ] **Step 3: Commit**

```bash
git commit -m "$(cat <<'EOF'
chore: catch block cleanup and unused import removal

Replace catch (_) with catch {} throughout (ES2019 optional catch binding).
Remove unused useRef import from MemoryGame. Expand eslint ignores and rules
to match current codebase patterns.
EOF
)"
```

Expected: `[main <hash>] chore: catch block cleanup and unused import removal`

---

## Task 5: Bump version and commit

**Files:**
- Modify: `android/app/build.gradle`
- Commit: `android/app/build.gradle`
- Commit: `README.md`

- [ ] **Step 1: Update versionCode and versionName in build.gradle**

In `android/app/build.gradle`, find and update these two lines inside `defaultConfig`:

```
versionCode 3
versionName "1.1.0"
```

Change to:

```
versionCode 4
versionName "1.2.0"
```

- [ ] **Step 2: Stage and verify**

```bash
git add android/app/build.gradle README.md
git diff --staged
```

Expected: `versionCode 3` → `versionCode 4`, `versionName "1.1.0"` → `versionName "1.2.0"`. README column name corrections (`morning_rating`, `favorite_game`, `wake_goal`, `streak`, `updated_at`, `level`).

- [ ] **Step 3: Commit**

```bash
git commit -m "$(cat <<'EOF'
release: bump to v1.2.0 (versionCode 4) — Lock & Rise

Includes: background alarms, hardcore mode, magic link auth, RLS on all
tables, server-side progression, alarm permission hardening, auth fixes.
EOF
)"
```

Expected: `[main <hash>] release: bump to v1.2.0 (versionCode 4) — Lock & Rise`

- [ ] **Step 4: Verify clean working tree**

```bash
git status
```

Expected: `nothing to commit, working tree clean`

---

## Task 6: Build and produce signed AAB

- [ ] **Step 1: Build the web bundle**

```bash
npm run build
```

Expected: Build completes with no errors. Output in `dist/`. Warnings are okay.

- [ ] **Step 2: Sync to Android**

```bash
npx cap sync android
```

Expected: `✔ Copying web assets` and `✔ Updating Android plugins` with no errors.

- [ ] **Step 3: Build signed release AAB**

```bash
cd android && ./gradlew bundleRelease
```

Expected: `BUILD SUCCESSFUL` — output file at:
`android/app/build/outputs/bundle/release/app-release.aab`

If you see `Signing config 'release' is missing required keystoreFile property` — check that `keystore.properties` exists in the `android/` directory with `storeFile`, `storePassword`, `keyAlias`, `keyPassword` set, OR that the four env vars are set: `MM_UPLOAD_STORE_FILE`, `MM_UPLOAD_STORE_PASSWORD`, `MM_UPLOAD_KEY_ALIAS`, `MM_UPLOAD_KEY_PASSWORD`.

- [ ] **Step 4: Confirm the AAB exists**

```bash
ls -lh android/app/build/outputs/bundle/release/app-release.aab
```

Expected: File exists, size is typically 10–40 MB.

- [ ] **Step 5: Return to project root**

```bash
cd ..
```
