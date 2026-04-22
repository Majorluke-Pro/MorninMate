import { useMemo, useState } from 'react';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';

function AuthField({
  type,
  value,
  onChange,
  placeholder,
  icon,
  trailing,
  autoComplete,
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        borderRadius: 14,
        border: `1px solid ${focused ? 'rgba(255,107,53,0.55)' : '#2A3244'}`,
        background: '#111827',
        padding: '0 14px',
        minHeight: 58,
        transition: 'border-color 0.16s ease, box-shadow 0.16s ease',
        boxShadow: focused ? '0 0 0 3px rgba(255,107,53,0.10)' : 'none',
      }}
    >
      <div style={{ color: focused ? '#FF6B35' : '#6B7280', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        {icon}
      </div>

      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          flex: 1,
          border: 0,
          outline: 'none',
          background: 'transparent',
          color: '#F9FAFB',
          fontSize: '0.98rem',
          fontFamily: '"Outfit", sans-serif',
          minWidth: 0,
        }}
      />

      {trailing && (
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          {trailing}
        </div>
      )}
    </div>
  );
}

export default function AuthScreenModern() {
  const {
    pendingOnboarding,
    setShowAuthDirectly,
    canContinueOffline,
    enterOfflineMode,
  } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState(pendingOnboarding ? 'signup' : 'signin');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const firstName = pendingOnboarding?.name?.split(' ')[0];
  const isSignUp = mode === 'signup';

  const canSubmit = useMemo(() => {
    if (!email.trim() || !password) return false;
    if (isSignUp && password !== confirmPassword) return false;
    return true;
  }, [confirmPassword, email, isSignUp, password]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (signUpError) {
          setError(signUpError.message);
          return;
        }

        const existingUser = data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0;
        if (existingUser) {
          setMode('signin');
          setMessage('This email already has an account. Sign in with your password instead.');
          setConfirmPassword('');
          return;
        }

        if (!data.session) {
          setMessage('Account created. If email confirmation is enabled, confirm your email, then sign in with your password.');
          setMode('signin');
          setPassword('');
          setConfirmPassword('');
          return;
        }

        setMessage('Account created successfully.');
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message);
      }
    } finally {
      setLoading(false);
    }
  }

  function toggleMode() {
    setMode(isSignUp ? 'signin' : 'signup');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setError('');
    setMessage('');
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 16px',
        background: `
          radial-gradient(circle at top, rgba(255,107,53,0.10), transparent 28%),
          linear-gradient(180deg, #0C111B 0%, #111827 100%)
        `,
      }}
    >
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div
          style={{
            background: '#171E2B',
            border: '1px solid #262F40',
            borderRadius: 24,
            padding: '28px 20px 22px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: 18,
                margin: '0 auto 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #FF6B35, #FFD166)',
                boxShadow: '0 12px 32px rgba(255,107,53,0.20)',
              }}
            >
              {isSignUp ? <User size={26} color="#fff" /> : <Mail size={24} color="#fff" />}
            </div>

            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#FF6B35',
                fontFamily: '"Outfit", sans-serif',
                marginBottom: 8,
              }}
            >
              {isSignUp ? 'Create account' : 'Sign in'}
            </div>

            <h1
              style={{
                margin: '0 0 8px',
                color: '#F9FAFB',
                fontSize: '2rem',
                lineHeight: 1.05,
                fontWeight: 700,
                fontFamily: '"Fraunces", serif',
                letterSpacing: '-0.03em',
              }}
            >
              {firstName && isSignUp ? `Finish setup, ${firstName}` : isSignUp ? 'Welcome to MorninMate' : 'Welcome back'}
            </h1>

            <p
              style={{
                margin: 0,
                color: '#9CA3AF',
                fontSize: '0.96rem',
                lineHeight: 1.55,
                fontFamily: '"Outfit", sans-serif',
              }}
            >
              {isSignUp
                ? 'Create your account to save alarms, streaks, and your morning profile.'
                : 'Sign in to continue to your alarms, progress, and morning dashboard.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
            {!navigator.onLine && canContinueOffline && (
              <div
                style={{
                  borderRadius: 14,
                  border: '1px solid rgba(255,209,102,0.24)',
                  background: 'rgba(255,209,102,0.08)',
                  color: '#FFD166',
                  padding: '12px 14px',
                  fontSize: '0.9rem',
                }}
              >
                You're offline right now. You can keep using the app with your local data and sync later.
              </div>
            )}

            {error && (
              <div
                style={{
                  borderRadius: 14,
                  border: '1px solid rgba(239,71,111,0.28)',
                  background: 'rgba(239,71,111,0.10)',
                  color: '#EF476F',
                  padding: '12px 14px',
                  fontSize: '0.9rem',
                }}
              >
                {error}
              </div>
            )}

            {message && (
              <div
                style={{
                  borderRadius: 14,
                  border: '1px solid rgba(6,214,160,0.28)',
                  background: 'rgba(6,214,160,0.10)',
                  color: '#06D6A0',
                  padding: '12px 14px',
                  fontSize: '0.9rem',
                }}
              >
                {message}
              </div>
            )}

            <AuthField
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              autoComplete="email"
              icon={<Mail size={18} />}
            />

            <AuthField
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              icon={<Lock size={18} />}
              trailing={(
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  style={{
                    border: 0,
                    background: 'transparent',
                    color: '#6B7280',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 4,
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              )}
            />

            {isSignUp && (
              <AuthField
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                autoComplete="new-password"
                icon={<Lock size={18} />}
              />
            )}

            {!isSignUp && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -2 }}>
                <button
                  type="button"
                  style={{
                    border: 0,
                    padding: 0,
                    background: 'transparent',
                    color: '#FF6B35',
                    cursor: 'pointer',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    fontFamily: '"Outfit", sans-serif',
                  }}
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !canSubmit}
              style={{
                marginTop: 6,
                minHeight: 54,
                borderRadius: 14,
                border: 0,
                background: loading || !canSubmit ? '#374151' : '#FF6B35',
                color: '#fff',
                cursor: loading || !canSubmit ? 'default' : 'pointer',
                fontSize: '1rem',
                fontWeight: 700,
                fontFamily: '"Outfit", sans-serif',
                transition: 'background 0.16s ease',
              }}
            >
              {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>

            {canContinueOffline && (
              <button
                type="button"
                onClick={() => enterOfflineMode()}
                style={{
                  minHeight: 48,
                  borderRadius: 14,
                  border: '1px solid #3B455A',
                  background: '#111827',
                  color: '#F9FAFB',
                  cursor: 'pointer',
                  fontSize: '0.96rem',
                  fontWeight: 700,
                  fontFamily: '"Outfit", sans-serif',
                }}
              >
                Continue Offline
              </button>
            )}
          </form>

          <div
            style={{
              marginTop: 24,
              paddingTop: 20,
              borderTop: '1px solid #262F40',
              textAlign: 'center',
              color: '#9CA3AF',
              fontSize: '0.94rem',
              fontFamily: '"Outfit", sans-serif',
            }}
          >
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={toggleMode}
              style={{
                border: 0,
                padding: 0,
                background: 'transparent',
                color: '#FF6B35',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: 'inherit',
                fontFamily: 'inherit',
              }}
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </div>
        </div>

        {!pendingOnboarding && (
          <div style={{ textAlign: 'center', marginTop: 14 }}>
            <button
              type="button"
              onClick={() => setShowAuthDirectly(false)}
              style={{
                border: 0,
                background: 'transparent',
                color: '#6B7280',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600,
                fontFamily: '"Outfit", sans-serif',
              }}
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
