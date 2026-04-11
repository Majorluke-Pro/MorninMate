# Security Upgrade & Google Auth — Design Spec

**Date:** 2026-04-11  
**App:** MorninMate (`com.morninmate.app`)  
**Supabase project:** MM8_Project (`elqiorueadjnepydtctd`, Central EU Frankfurt)

---

## Overview

Three workstreams executed together:

1. **RLS policies** — enforce row-level security on all three database tables via SQL migrations pushed directly to remote
2. **Auth hardening** — tighten Supabase auth settings in the Dashboard
3. **Google OAuth** — add Google Sign-In as the primary auth method in the UI, with email/password as secondary

---

## 1. RLS Policies

### Approach
Write SQL migration files locally in `supabase/migrations/`, push to remote via `npx supabase db push`. No Docker required.

### Tables & Policies

**`profiles`** — primary key `id` matches `auth.uid()`

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"   ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can delete own profile" ON profiles FOR DELETE USING (auth.uid() = id);
```

**`alarms`** — foreign key `user_id` references `auth.uid()`

```sql
ALTER TABLE alarms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alarms"   ON alarms FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own alarms" ON alarms FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own alarms" ON alarms FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own alarms" ON alarms FOR DELETE USING (auth.uid() = user_id);
```

**`wake_sessions`** — foreign key `user_id` references `auth.uid()`

```sql
ALTER TABLE wake_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wake_sessions"   ON wake_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wake_sessions" ON wake_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own wake_sessions" ON wake_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own wake_sessions" ON wake_sessions FOR DELETE USING (auth.uid() = user_id);
```

### Files
- `supabase/migrations/<timestamp>_rls_profiles.sql`
- `supabase/migrations/<timestamp>_rls_alarms.sql`
- `supabase/migrations/<timestamp>_rls_wake_sessions.sql`

### Push command
```bash
npx supabase db push
```

---

## 2. Auth Hardening (Supabase Dashboard)

Navigate to: **Dashboard → Authentication → Settings**

| Setting | Value | Path |
|---|---|---|
| Email confirmations | Enabled | Auth → Email |
| Minimum password length | 8 characters | Auth → Password |
| Leaked password protection | Enabled | Auth → Password |
| Rate limiting | Verify enabled (default on) | Auth → Rate Limits |

No code changes required. The existing `AuthScreen.jsx` already handles the "check your email" confirmation case gracefully.

---

## 3. Google OAuth

### Google Cloud Console Setup
1. Go to [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID → Application type: **Android**
3. Package name: `com.morninmate.app`
4. SHA-1 fingerprint: run `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android` to get debug SHA-1
5. Also create a **Web** client ID (needed by Supabase for the OAuth flow)
6. Add Supabase callback URL to authorized redirect URIs: `https://elqiorueadjnepydtctd.supabase.co/auth/v1/callback`

### Supabase Dashboard Setup
Navigate to: **Dashboard → Authentication → Providers → Google**
- Enable Google provider
- Paste Web Client ID and Client Secret
- Authorized redirect URL is pre-filled: `https://elqiorueadjnepydtctd.supabase.co/auth/v1/callback`

### Deep Link Configuration

**`capacitor.config.json`** — add server config:
```json
"server": {
  "androidScheme": "com.morninmate.app"
}
```

**`android/app/src/main/AndroidManifest.xml`** — add intent filter to the main activity:
```xml
<intent-filter android:autoVerify="true">
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="com.morninmate.app" />
</intent-filter>
```

### OAuth Redirect URL
`com.morninmate.app://` — passed as `redirectTo` in the Supabase OAuth call.

### `AuthScreen.jsx` Changes

- Add a "Continue with Google" button above the form card (prominent, full-width, Google brand colors)
- Add an "or" divider between Google button and the form card
- Google button calls:
  ```js
  supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: 'com.morninmate.app://' }
  })
  ```
- Opens in device browser; Supabase redirects back to the app after auth
- `onAuthStateChange` in `AppContext` picks up the session automatically — no extra handling required
- Email/password form remains below the divider as secondary option
- No changes needed to `AppContext.jsx` — existing `handlePostAuth` and `onAuthStateChange` handle Google sessions identically to email sessions

---

## Data Flow

```
User taps "Continue with Google"
  → supabase.auth.signInWithOAuth({ provider: 'google', redirectTo: 'com.morninmate.app://' })
  → Device browser opens Google consent screen
  → User approves
  → Google redirects to Supabase callback URL
  → Supabase exchanges code for session, redirects to com.morninmate.app://
  → Android deep link opens the app
  → Capacitor fires URL open event
  → supabase-js detects session from URL fragment
  → onAuthStateChange fires with new session
  → AppContext.loadUserData() runs as normal
```

---

## What Is NOT Changing

- `AppContext.jsx` — no changes needed
- `src/lib/supabase.js` — no changes needed
- Existing email/password flow — unchanged, just repositioned in the UI

---

## Success Criteria

- [ ] All three tables have RLS enabled and policies applied
- [ ] `npx supabase db push` completes without errors
- [ ] Email confirmation enforced, min password 8 chars, leaked password check enabled
- [ ] Google Sign-In button appears in AuthScreen, Google is visually primary
- [ ] Tapping Google button opens browser OAuth flow
- [ ] After Google auth, app receives deep link and session loads correctly
- [ ] Existing email/password sign-in still works
