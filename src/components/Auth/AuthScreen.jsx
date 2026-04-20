import { useMemo, useState } from 'react';
import { Box, Typography, Button, TextField, CircularProgress, Alert } from '../../lib/ui-lite';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';

export default function AuthScreen() {
  const { pendingOnboarding, setShowAuthDirectly } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
    setError('');
    setMessage('');
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
            {/* Outer ring */}
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
                {isSignUp ? 'Create your account' : 'Welcome back'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isSignUp ? 'Use your email and password to get started.' : 'Sign in with your email and password.'}
              </Typography>
            </>
          )}
        </Box>

        {/* Form card */}
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
            {error && (
              <Alert severity="error" sx={{ borderRadius: 2, fontSize: '0.82rem' }}>
                {error}
              </Alert>
            )}

            {message && (
              <Alert severity="success" sx={{ borderRadius: 2, fontSize: '0.82rem' }}>
                {message}
              </Alert>
            )}

            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              fullWidth
              sx={inputSx}
            />

            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              fullWidth
              sx={inputSx}
            />

            {isSignUp && (
              <TextField
                label="Confirm password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                fullWidth
                sx={inputSx}
              />
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || !canSubmit}
              sx={{ mt: 0.5, py: 1.75, fontSize: '1rem' }}
            >
              {loading
                ? <CircularProgress size={22} sx={{ color: '#fff' }} />
                : isSignUp ? 'Create Account' : 'Sign In'}
            </Button>

            <Button
              fullWidth
              variant="text"
              onClick={toggleMode}
              sx={{ color: 'text.secondary', textTransform: 'none' }}
            >
              {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Create one'}
            </Button>
          </Box>
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
      {/* Large warm orb top-right */}
      <Box sx={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,107,53,0.1) 0%, transparent 65%)',
        top: -180, right: -160, filter: 'blur(70px)',
        animation: 'bgOrb1 14s ease-in-out infinite',
        '@keyframes bgOrb1': { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.08)' } },
      }} />
      {/* Cool orb bottom-left */}
      <Box sx={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(90,30,200,0.1) 0%, transparent 65%)',
        bottom: -100, left: -140, filter: 'blur(70px)',
        animation: 'bgOrb2 18s ease-in-out infinite',
        '@keyframes bgOrb2': { '0%,100%': { transform: 'translate(0,0)' }, '50%': { transform: 'translate(20px,-20px)' } },
      }} />
      {/* Subtle center glow */}
      <Box sx={{
        position: 'absolute', width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,107,53,0.04) 0%, transparent 70%)',
        top: '30%', left: '50%', transform: 'translateX(-50%)', filter: 'blur(50px)',
      }} />
    </Box>
  );
}
