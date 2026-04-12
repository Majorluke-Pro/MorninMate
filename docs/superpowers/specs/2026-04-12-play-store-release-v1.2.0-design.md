# Play Store Release v1.2.0 — "Lock & Rise" Design Spec

**Date:** 2026-04-12
**App:** MorninMate (`com.morninmate.app`)
**Version:** 1.2.0 (versionCode 4)

---

## Overview

Prepare the current working tree for Play Store release. All feature work is complete and stable. This spec covers committing the outstanding changes in logical groups, bumping the version, and producing a signed AAB.

No new features. No refactoring beyond what is already done.

---

## What's In This Release

### Already committed
- Native background alarms (AlarmManager, foreground service, fires when app is closed)
- Hardcore mode (volume lock, back button disabled, HardcoreGuardService)
- Passwordless magic link auth (PKCE, deep link callback)
- Row-level security on all 3 database tables (profiles, alarms, wake_sessions)

### Uncommitted changes being committed now
- **Auth fix:** Platform-aware `redirectTo` and `detectSessionInUrl` (native vs web)
- **Alarm reliability:** `doSchedule` returns boolean, rejects if exact alarm permission denied; `AlarmReceiver` handles pre-Android O
- **Server-side progression:** XP, level, demerits, streak computed via Supabase RPCs (`complete_wake_session`, `record_wake_game_fail`) — client can no longer write these values
- **Security hardening:** `updateUser` stripped of ability to overwrite progression fields from client
- **Code cleanup:** `catch (_)` → `catch {}` throughout, unused `useRef` import removed from MemoryGame
- **New migrations:** `20260412000050_create_wake_sessions.sql`, `20260412000100_secure_wake_progression.sql`

---

## Commit Plan

Five commits in order:

| # | Message | Files |
|---|---------|-------|
| 1 | `fix(auth): platform-aware redirectTo and detectSessionInUrl` | `src/components/Auth/AuthScreen.jsx`, `src/lib/supabase.js` |
| 2 | `fix(android): alarm permission rejection and pre-O service compat` | `android/app/src/main/java/com/morninmate/app/AlarmPlugin.java`, `android/app/src/main/java/com/morninmate/app/AlarmReceiver.java` |
| 3 | `feat(progression): server-side XP/level/streak via Supabase RPCs` | `src/context/AppContext.jsx`, `src/components/WakeUp/WakeUpFlow.jsx`, `supabase/migrations/20260412000050_create_wake_sessions.sql`, `supabase/migrations/20260412000100_secure_wake_progression.sql` |
| 4 | `chore: catch block cleanup and unused import removal` | `src/lib/nativeAlarms.js`, `src/lib/sounds.js`, `src/components/Games/MemoryGame.jsx`, `eslint.config.js` |
| 5 | `release: bump to v1.2.0 (versionCode 4) — Lock & Rise` | `android/app/build.gradle`, `README.md` |

---

## Version Bump

| Field | Before | After |
|-------|--------|-------|
| `versionCode` | 3 | 4 |
| `versionName` | "1.1.0" | "1.2.0" |

File: `android/app/build.gradle`

---

## Build Steps

```bash
# 1. Build the web bundle
npm run build

# 2. Sync to Android
npx cap sync android

# 3. Build signed AAB
cd android && ./gradlew bundleRelease
```

**Output:** `android/app/build/outputs/bundle/release/app-release.aab`

Signing is automatic — `build.gradle` reads from `keystore.properties` or env vars (`MM_UPLOAD_STORE_FILE`, `MM_UPLOAD_STORE_PASSWORD`, `MM_UPLOAD_KEY_ALIAS`, `MM_UPLOAD_KEY_PASSWORD`).

---

## Success Criteria

- [ ] All 5 commits land cleanly on `main`
- [ ] `versionCode 4` and `versionName "1.2.0"` in `build.gradle`
- [ ] `npm run build` completes with no errors
- [ ] `npx cap sync android` completes with no errors
- [ ] `./gradlew bundleRelease` completes and produces `app-release.aab`
- [ ] AAB is signed (verify: `bundletool validate --bundle=app-release.aab` or check Play Console upload)
