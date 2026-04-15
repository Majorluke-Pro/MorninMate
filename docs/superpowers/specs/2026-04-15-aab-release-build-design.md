# AAB Release Build — Design Spec

**Date:** 2026-04-15  
**Goal:** Produce a signed `.aab` locally for upload to Google Play Store internal test track.

## Context

MorninMate is a Capacitor + React/Vite app. The Android signing config is already wired up in `build.gradle` via `keystore.properties` and the upload keystore at `android/morninmate-upload.jks` (recently reset). The current `android:bundle` npm script is missing the `cap sync` step, and `versionCode` in `build.gradle` is out of sync.

## Changes

### 1. Fix versionCode — `android/app/build.gradle`
- Change `versionCode 1` → `versionCode 4`
- Matches the last release commit (`v1.2.0, versionCode 4`)

### 2. Add `cap sync` to build script — `package.json`
- Current: `npm run build && cd android && gradlew bundleRelease`
- Updated: `npm run build && npx cap sync android && cd android && gradlew bundleRelease`
- Ensures web assets are synced into the Android project before bundling

## Build & Output

Run: `npm run android:bundle`

Output: `android/app/build/outputs/bundle/release/app-release.aab`

Upload this file to Play Store → Internal testing track.

## Signing

No signing changes needed. `build.gradle` already reads from `android/keystore.properties`:
- `storeFile=../morninmate-upload.jks`
- `keyAlias=morninmate`

## Out of Scope

- CI/GitHub Actions update (future work)
- Securing `keystore.properties` credentials (pre-production concern)
