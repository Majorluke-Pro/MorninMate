# MorninMate Play Store Release Guide

This checklist gets the app from local code to a Play Console upload-ready AAB.

## 1) One-time setup

1. Create your Play signing/upload keystore:
   - `keytool -genkey -v -keystore upload-keystore.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000`
2. Place the keystore in `android/app/upload-keystore.jks` (or another safe local path).
3. Create `android/keystore.properties`:

```properties
storeFile=app/upload-keystore.jks
storePassword=YOUR_STORE_PASSWORD
keyAlias=upload
keyPassword=YOUR_KEY_PASSWORD
```

4. Keep `keystore.properties` and keystore files private. They are already ignored by `.gitignore`.

## 2) Before every release

1. Bump Android version in `android/app/build.gradle`:
   - `versionCode` must always increase.
   - `versionName` should match your release version string.
2. Use Java 21 for Android builds (Capacitor 8 requirement):
   - Example (PowerShell): `$env:JAVA_HOME='C:\Program Files\Android\Android Studio\jbr'`
3. Build and sync web assets:
   - `npm run cap:sync`
4. Build release AAB:
   - `npm run android:bundle`
5. Output file:
   - `android/app/build/outputs/bundle/release/app-release.aab`

## 3) Play Console requirements

1. Privacy Policy URL (required if you use account data/auth).
2. Data Safety form (Supabase auth/profile/session data).
3. App Access instructions if parts require login.
4. Content rating questionnaire.
5. Store listing assets:
   - App icon (512x512)
   - Feature graphic (1024x500)
   - Phone screenshots

## 4) Alarm app compliance notes

1. Confirm notifications are shown and reliable on Android 13+.
2. If exact alarms are core functionality, complete the exact alarm declaration in Play Console when prompted.
3. Test alarm behavior under Doze/battery optimization on at least one physical Android device.

## 5) Final smoke test (release build)

1. Install release APK for a quick device sanity check:
   - `npm run android:assemble`
   - APK path: `android/app/build/outputs/apk/release/app-release.apk`
2. Validate:
   - Sign in/up works
   - Alarm create/edit/delete works
   - Alarm triggers at scheduled time
   - Wake-up game flow clears alarm
   - XP/streak updates persist
