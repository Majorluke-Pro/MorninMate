# Security Upgrade & Google Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable RLS on all three database tables, harden Supabase auth settings, and add Google Sign-In as the primary auth method in the Android app.

**Architecture:** SQL migrations pushed directly to remote Supabase (no Docker). Google OAuth uses Supabase's built-in provider with a custom Android deep link scheme (`com.morninmate.app://`) to redirect back into the app after browser-based consent. Auth screen updated to show Google as primary, email/password as secondary.

**Tech Stack:** Supabase (RLS, Auth, OAuth), SQL migrations via `npx supabase db push`, Capacitor Android deep links, React + MUI for the auth UI.

---

## File Map

| Action | File |
|--------|------|
| CREATE | `supabase/migrations/20260411000001_rls_profiles.sql` |
| CREATE | `supabase/migrations/20260411000002_rls_alarms.sql` |
| CREATE | `supabase/migrations/20260411000003_rls_wake_sessions.sql` |
| MODIFY | `capacitor.config.json` |
| MODIFY | `android/app/src/main/AndroidManifest.xml` |
| MODIFY | `src/components/Auth/AuthScreen.jsx` |

---

## Task 1: RLS — profiles table

**Files:**
- Create: `supabase/migrations/20260411000001_rls_profiles.sql`

- [ ] **Step 1: Create the migration file**

Create `supabase/migrations/20260411000001_rls_profiles.sql` with this exact content:

```sql
-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can only read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can only insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can only delete their own profile
CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE
  USING (auth.uid() = id);
```

- [ ] **Step 2: Push to remote**

```bash
npx supabase db push
```

Expected output: `Applying migration 20260411000001_rls_profiles.sql... done`

If you see `already applied`, the migration was already run — that's fine.

- [ ] **Step 3: Verify in Dashboard**

Open Supabase Dashboard → Table Editor → `profiles` → RLS. Confirm:
- RLS is enabled (toggle is on)
- 4 policies are listed (SELECT, INSERT, UPDATE, DELETE)

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260411000001_rls_profiles.sql
git commit -m "feat(security): enable RLS on profiles table"
```

---

## Task 2: RLS — alarms table

**Files:**
- Create: `supabase/migrations/20260411000002_rls_alarms.sql`

- [ ] **Step 1: Create the migration file**

Create `supabase/migrations/20260411000002_rls_alarms.sql`:

```sql
-- Enable RLS on alarms table
ALTER TABLE alarms ENABLE ROW LEVEL SECURITY;

-- Users can only read their own alarms
CREATE POLICY "Users can view own alarms"
  ON alarms FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own alarms
CREATE POLICY "Users can insert own alarms"
  ON alarms FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own alarms
CREATE POLICY "Users can update own alarms"
  ON alarms FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only delete their own alarms
CREATE POLICY "Users can delete own alarms"
  ON alarms FOR DELETE
  USING (auth.uid() = user_id);
```

- [ ] **Step 2: Push to remote**

```bash
npx supabase db push
```

Expected output: `Applying migration 20260411000002_rls_alarms.sql... done`

- [ ] **Step 3: Verify in Dashboard**

Open Supabase Dashboard → Table Editor → `alarms` → RLS. Confirm:
- RLS is enabled
- 4 policies are listed

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260411000002_rls_alarms.sql
git commit -m "feat(security): enable RLS on alarms table"
```

---

## Task 3: RLS — wake_sessions table

**Files:**
- Create: `supabase/migrations/20260411000003_rls_wake_sessions.sql`

- [ ] **Step 1: Create the migration file**

Create `supabase/migrations/20260411000003_rls_wake_sessions.sql`:

```sql
-- Enable RLS on wake_sessions table
ALTER TABLE wake_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only read their own wake sessions
CREATE POLICY "Users can view own wake_sessions"
  ON wake_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own wake sessions
CREATE POLICY "Users can insert own wake_sessions"
  ON wake_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own wake sessions
CREATE POLICY "Users can update own wake_sessions"
  ON wake_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only delete their own wake sessions
CREATE POLICY "Users can delete own wake_sessions"
  ON wake_sessions FOR DELETE
  USING (auth.uid() = user_id);
```

- [ ] **Step 2: Push to remote**

```bash
npx supabase db push
```

Expected output: `Applying migration 20260411000003_rls_wake_sessions.sql... done`

- [ ] **Step 3: Verify in Dashboard**

Open Supabase Dashboard → Table Editor → `wake_sessions` → RLS. Confirm:
- RLS is enabled
- 4 policies are listed

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260411000003_rls_wake_sessions.sql
git commit -m "feat(security): enable RLS on wake_sessions table"
```

---

## Task 4: Auth Hardening (Dashboard — manual steps)

**No code changes. These are Supabase Dashboard configuration steps.**

- [ ] **Step 1: Require email confirmation**

Dashboard → Authentication → Email → Enable "Confirm email"  
Toggle: ON

- [ ] **Step 2: Set minimum password length to 8**

Dashboard → Authentication → Providers → Email → Password minimum length  
Set to: `8`

- [ ] **Step 3: Enable leaked password protection**

Dashboard → Authentication → Providers → Email → "Enable leaked password protection"  
Toggle: ON (uses HaveIBeenPwned to block known-compromised passwords)

- [ ] **Step 4: Verify rate limiting is active**

Dashboard → Authentication → Rate Limits  
Confirm these are non-zero (Supabase enables them by default):
- "OTPs and Magic Links per hour" — default 60
- "Token refreshes per hour" — default 360

No changes needed unless values are 0.

- [ ] **Step 5: Commit a note**

```bash
git commit --allow-empty -m "chore(security): apply auth hardening settings in Supabase Dashboard"
```

---

## Task 5: Google OAuth — Google Cloud Console setup

**No code changes. Manual setup in Google Cloud Console.**

- [ ] **Step 1: Open Google Cloud Console**

Go to https://console.cloud.google.com → Select or create a project for MorninMate.

- [ ] **Step 2: Enable Google Sign-In API**

APIs & Services → Library → Search "Google Identity" → Enable "Google Identity Toolkit API" (if not already enabled).

- [ ] **Step 3: Create a Web OAuth client (required by Supabase)**

APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID  
- Application type: **Web application**  
- Name: `MorninMate Supabase`  
- Authorized redirect URIs — add:  
  `https://elqiorueadjnepydtctd.supabase.co/auth/v1/callback`  
- Click Create. **Copy the Client ID and Client Secret** — you'll need them in Task 6.

- [ ] **Step 4: Create an Android OAuth client**

APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID  
- Application type: **Android**  
- Name: `MorninMate Android`  
- Package name: `com.morninmate.app`  
- SHA-1 certificate fingerprint — run this in your terminal to get it:  
  ```bash
  keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android 2>&1 | grep SHA1
  ```
  Paste the SHA-1 value into the field.  
- Click Create.

---

## Task 6: Google OAuth — Supabase Dashboard setup

**No code changes. Manual setup in Supabase Dashboard.**

- [ ] **Step 1: Enable Google provider**

Dashboard → Authentication → Providers → Google  
Toggle: ON

- [ ] **Step 2: Paste credentials**

- Client ID (OAuth 2.0): paste the **Web** client ID from Task 5 Step 3  
- Client Secret: paste the **Web** client secret from Task 5 Step 3  
- Click Save

- [ ] **Step 3: Verify callback URL**

The "Callback URL (for OAuth)" field should show:  
`https://elqiorueadjnepydtctd.supabase.co/auth/v1/callback`  

Confirm this matches exactly what you entered in Google Cloud Console.

---

## Task 7: Deep link — Capacitor + Android config

**Files:**
- Modify: `capacitor.config.json`
- Modify: `android/app/src/main/AndroidManifest.xml`

- [ ] **Step 1: Add Android scheme to capacitor.config.json**

In `capacitor.config.json`, add the `server` block so it reads:

```json
{
  "appId": "com.morninmate.app",
  "appName": "MorninMate",
  "webDir": "dist",
  "bundledWebRuntime": false,
  "server": {
    "androidScheme": "https"
  },
  "plugins": {
    "LocalNotifications": {
      "smallIcon": "ic_launcher_foreground",
      "iconColor": "#FF6B35",
      "sound": "beep.wav"
    },
    "SplashScreen": {
      "launchShowDuration": 0
    }
  }
}
```

Note: `"androidScheme": "https"` tells Capacitor to use HTTPS for the WebView. The custom scheme `com.morninmate.app://` is handled by the AndroidManifest intent filter below — they serve different purposes.

- [ ] **Step 2: Add deep link intent filter to AndroidManifest.xml**

In `android/app/src/main/AndroidManifest.xml`, add a second `<intent-filter>` inside the `<activity>` block, directly after the existing MAIN/LAUNCHER intent filter:

```xml
        <intent-filter>
            <action android:name="android.intent.action.MAIN" />
            <category android:name="android.intent.category.LAUNCHER" />
        </intent-filter>

        <intent-filter>
            <action android:name="android.intent.action.VIEW" />
            <category android:name="android.intent.category.DEFAULT" />
            <category android:name="android.intent.category.BROWSABLE" />
            <data android:scheme="com.morninmate.app" />
        </intent-filter>
```

- [ ] **Step 3: Commit**

```bash
git add capacitor.config.json android/app/src/main/AndroidManifest.xml
git commit -m "feat(auth): add deep link intent filter for Google OAuth callback"
```

---

## Task 8: AuthScreen — Add Google Sign-In button

**Files:**
- Modify: `src/components/Auth/AuthScreen.jsx`

- [ ] **Step 1: Replace AuthScreen.jsx with the updated version**

Replace the entire contents of `src/components/Auth/AuthScreen.jsx` with:

```jsx
import { useState } from 'react';
import { Box, Typography, Button, TextField, CircularProgress, Alert, Divider } from '@mui/material';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';

export default function AuthScreen() {
  const { pendingOnboarding, setShowAuthDirectly, handlePostAuth, lockAuth, unlockAuth } = useApp();
  const [mode, setMode] = useState(pendingOnboarding ? 'signup' : 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const firstName = pendingOnboarding?.name?.split(' ')[0];

  async function handleGoogleSignIn() {
    setError('');
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'com.morninmate.app://' },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
    // On success the browser opens — no further action needed here.
    // onAuthStateChange in AppContext picks up the session when the deep link returns.
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'signup') {
      lockAuth();
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        unlockAuth();
        setError(error.message);
        setLoading(false);
      } else if (!data.session) {
        unlockAuth();
        setError('Check your email to confirm your account, then sign in here.');
        setLoading(false);
      } else {
        await handlePostAuth(data.session);
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
      } else if (data.session) {
        await handlePostAuth(data.session);
      }
    }
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      px: 3,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <Background />

      <Box sx={{
        position: 'relative', zIndex: 1, width: '100%', maxWidth: 360,
        animation: 'authIn 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)',
        '@keyframes authIn': {
          from: { opacity: 0, transform: 'translateY(24px) scale(0.97)' },
          to:   { opacity: 1, transform: 'none' },
        },
      }}>

        {/* Logo */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            mb: 2.5, position: 'relative',
          }}>
            <Box sx={{
              position: 'absolute',
              width: 90, height: 90, borderRadius: '50%',
              border: '1.5px solid rgba(255,107,53,0.2)',
              animation: 'logoRingPulse 3s ease-in-out infinite',
              '@keyframes logoRingPulse': {
                '0%,100%': { transform: 'scale(1)', opacity: 0.6 },
                '50%':     { transform: 'scale(1.1)', opacity: 0.2 },
              },
            }} />
            <Box sx={{
              width: 72, height: 72, borderRadius: '50%',
              bgcolor: 'rgba(255,107,53,0.1)',
              border: '1.5px solid rgba(255,107,53,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 40px rgba(255,107,53,0.2)',
            }}>
              <WbSunnyIcon sx={{
                fontSize: 36, color: '#FF6B35',
                filter: 'drop-shadow(0 0 16px rgba(255,107,53,0.6))',
                animation: 'sunSpin 12s linear infinite',
                '@keyframes sunSpin': { to: { transform: 'rotate(360deg)' } },
              }} />
            </Box>
          </Box>

          {firstName ? (
            <>
              <Typography variant="h5" fontWeight={900} sx={{ letterSpacing: '-0.5px', mb: 0.5 }}>
                Almost there, {firstName}!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create an account to save your morning profile.
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="h5" fontWeight={900} sx={{ letterSpacing: '-0.5px', mb: 0.5 }}>
                {mode === 'signin' ? 'Welcome back' : 'Create account'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {mode === 'signin' ? "Let's get you up." : 'Start your morning ritual.'}
              </Typography>
            </>
          )}
        </Box>

        {/* Error (shown above Google button so it's always visible) */}
        {error && (
          <Alert severity="error" sx={{ borderRadius: 2, fontSize: '0.82rem', mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Google Sign-In — primary */}
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          sx={{
            py: 1.75,
            mb: 2,
            fontSize: '1rem',
            fontWeight: 600,
            bgcolor: '#fff',
            color: '#1F1F1F',
            border: '1px solid rgba(0,0,0,0.12)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            '&:hover': { bgcolor: '#f5f5f5' },
            '&:disabled': { bgcolor: 'rgba(255,255,255,0.5)' },
          }}
          startIcon={
            googleLoading ? null : (
              <GoogleIcon />
            )
          }
        >
          {googleLoading
            ? <CircularProgress size={22} sx={{ color: '#1F1F1F' }} />
            : 'Continue with Google'}
        </Button>

        {/* Divider */}
        <Divider sx={{ mb: 2, '&::before, &::after': { borderColor: 'rgba(255,255,255,0.08)' } }}>
          <Typography variant="caption" color="text.disabled" sx={{ px: 1 }}>
            or
          </Typography>
        </Divider>

        {/* Email / Password — secondary */}
        <Box sx={{
          p: 3, borderRadius: 4,
          bgcolor: 'rgba(20,20,38,0.85)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              fullWidth
              sx={inputSx}
            />

            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              inputProps={{ minLength: 6 }}
              fullWidth
              sx={inputSx}
            />

            <Button
              type="submit"
              fullWidth
              variant="outlined"
              size="large"
              disabled={loading || !email || !password}
              sx={{
                mt: 0.5, py: 1.75, fontSize: '1rem',
                borderColor: 'rgba(255,107,53,0.4)',
                color: '#FF6B35',
                '&:hover': { borderColor: '#FF6B35', bgcolor: 'rgba(255,107,53,0.06)' },
              }}
            >
              {loading
                ? <CircularProgress size={22} sx={{ color: '#FF6B35' }} />
                : mode === 'signin' ? 'Sign In with Email' : 'Sign Up with Email'}
            </Button>
          </Box>
        </Box>

        {/* Toggle signin/signup */}
        <Box sx={{ textAlign: 'center', mt: 2.5 }}>
          <Typography variant="body2" color="text.secondary">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <Box
              component="span"
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
              sx={{ color: 'primary.main', fontWeight: 700, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </Box>
          </Typography>
        </Box>

        {!pendingOnboarding && (
          <Box sx={{ textAlign: 'center', mt: 1.5 }}>
            <Box
              component="span"
              onClick={() => setShowAuthDirectly(false)}
              sx={{ color: 'text.disabled', fontSize: '0.8rem', cursor: 'pointer', '&:hover': { color: 'text.secondary' } }}
            >
              ← Back
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}

// Google's official 'G' logo as an inline SVG
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      <path fill="none" d="M0 0h48v48H0z"/>
    </svg>
  );
}

const inputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2.5,
    '& fieldset': { borderColor: 'rgba(255,255,255,0.09)' },
    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
    '&.Mui-focused fieldset': { borderColor: '#FF6B35', borderWidth: '1.5px' },
  },
  '& .MuiInputLabel-root.Mui-focused': { color: '#FF6B35' },
};

function Background() {
  return (
    <Box sx={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #09071C 0%, #160830 45%, #0D0D1A 100%)' }} />
      <Box sx={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,107,53,0.1) 0%, transparent 65%)',
        top: -180, right: -160, filter: 'blur(70px)',
        animation: 'bgOrb1 14s ease-in-out infinite',
        '@keyframes bgOrb1': { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.08)' } },
      }} />
      <Box sx={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(90,30,200,0.1) 0%, transparent 65%)',
        bottom: -100, left: -140, filter: 'blur(70px)',
        animation: 'bgOrb2 18s ease-in-out infinite',
        '@keyframes bgOrb2': { '0%,100%': { transform: 'translate(0,0)' }, '50%': { transform: 'translate(20px,-20px)' } },
      }} />
      <Box sx={{
        position: 'absolute', width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,107,53,0.04) 0%, transparent 70%)',
        top: '30%', left: '50%', transform: 'translateX(-50%)', filter: 'blur(50px)',
      }} />
    </Box>
  );
}
```

- [ ] **Step 2: Verify the app builds**

```bash
npm run build
```

Expected: build completes with no errors. Warnings are okay.

- [ ] **Step 3: Commit**

```bash
git add src/components/Auth/AuthScreen.jsx
git commit -m "feat(auth): add Google Sign-In as primary auth option"
```

---

## Task 9: End-to-end verification

- [ ] **Step 1: Build and sync to Android**

```bash
npm run build && npx cap sync android
```

Expected: sync completes, no errors.

- [ ] **Step 2: Test RLS is working**

In Supabase Dashboard → SQL Editor, run:
```sql
-- This should return 0 rows (RLS blocks unauthenticated access)
SELECT * FROM profiles;
SELECT * FROM alarms;
SELECT * FROM wake_sessions;
```
Expected: 0 rows returned (not an error — just empty, because `auth.uid()` is null for the service role query without a JWT).

Actually for service role the SQL editor bypasses RLS. To truly verify, sign into the app with a test account and confirm you can load your own data. Then try a different account and confirm you cannot see the first account's data.

- [ ] **Step 3: Test email/password still works**

Run the app on device/emulator. Sign in with an existing email/password account. Confirm the app loads normally.

- [ ] **Step 4: Test Google Sign-In flow**

Run the app on device/emulator. Tap "Continue with Google". Confirm:
1. Browser opens to Google consent screen
2. After approving, browser redirects back to the app
3. App loads the home screen (session is active)

- [ ] **Step 5: Final commit if any fixes were needed**

```bash
git add -p
git commit -m "fix(auth): <describe any fixes made during verification>"
```
