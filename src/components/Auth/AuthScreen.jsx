import { useState } from 'react';
import { Box, Typography, Button, TextField, CircularProgress, Alert } from '@mui/material';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';


export default function AuthScreen() {
  const { pendingOnboarding, setShowAuthDirectly, handlePostAuth, lockAuth, unlockAuth } = useApp();
  const [mode, setMode] = useState('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const firstName = pendingOnboarding?.name?.split(' ')[0];

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'signup') {
      // Lock before signUp so onAuthStateChange can't race handlePostAuth
      lockAuth();
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        unlockAuth();
        setError(error.message);
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
        // Explicitly handle post-auth in case onAuthStateChange doesn't fire
        // (can happen in regular browser when Supabase already has a cached session)
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

      <Box sx={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 360 }}>

        {/* Logo */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{
            display: 'inline-block', mb: 2,
            '@keyframes sunGlow': {
              '0%,100%': { filter: 'drop-shadow(0 0 18px rgba(255,107,53,0.35))' },
              '50%':     { filter: 'drop-shadow(0 0 40px rgba(255,107,53,0.7))' },
            },
            animation: 'sunGlow 3s ease-in-out infinite',
          }}>
            <WbSunnyIcon sx={{ fontSize: 48, color: 'primary.main' }} />
          </Box>

          {firstName ? (
            <>
              <Typography variant="h5" fontWeight={900} letterSpacing="-0.5px">
                Almost there, {firstName}!
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Create an account to save your morning profile.
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="h5" fontWeight={900} letterSpacing="-0.5px">
                {mode === 'signin' ? 'Welcome back' : 'Create account'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {mode === 'signin' ? "Let's get you up." : 'Start your morning ritual.'}
              </Typography>
            </>
          )}
        </Box>

        {/* Form */}
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

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
            variant="contained"
            size="large"
            disabled={loading || !email || !password}
            sx={{
              mt: 0.5,
              py: 1.75,
              fontWeight: 700,
              borderRadius: 3,
              fontSize: '1rem',
              background: 'linear-gradient(135deg, #FF6B35 0%, #FF8C5A 100%)',
              boxShadow: '0 8px 32px rgba(255,107,53,0.3)',
              '&:disabled': { opacity: 0.5 },
            }}
          >
            {loading
              ? <CircularProgress size={22} sx={{ color: '#fff' }} />
              : mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </Button>
        </Box>

        {/* Toggle sign in / sign up */}
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

        {/* Back to onboarding — only when arriving from "Sign in" on welcome step */}
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
    '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
    '&.Mui-focused fieldset': { borderColor: '#FF6B35' },
  },
  '& .MuiInputLabel-root.Mui-focused': { color: '#FF6B35' },
};

function Background() {
  return (
    <Box sx={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #08081A 0%, #14082A 55%, #0D0D1A 100%)' }} />
      <Box sx={{
        position: 'absolute', width: 480, height: 480, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,107,53,0.1) 0%, transparent 70%)',
        top: -140, right: -140, filter: 'blur(60px)',
      }} />
      <Box sx={{
        position: 'absolute', width: 380, height: 380, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(120,40,220,0.08) 0%, transparent 70%)',
        bottom: -60, left: -120, filter: 'blur(60px)',
      }} />
    </Box>
  );
}
