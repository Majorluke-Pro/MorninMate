import { useState } from 'react';
import { Box, Typography, Button, TextField, CircularProgress, Alert } from '@mui/material';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';

export default function AuthScreen() {
  const { pendingOnboarding, setShowAuthDirectly } = useApp();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const firstName = pendingOnboarding?.name?.split(' ')[0];

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: 'com.morninmate.app://login-callback' },
    });

    if (otpError) {
      setError(otpError.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
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
                {sent ? 'Check your inbox' : 'Welcome'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {sent ? 'Your magic link is on its way.' : "Sign in or sign up — no password needed."}
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
          {sent ? (
            <Box sx={{ textAlign: 'center', py: 1 }}>
              <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.7 }}>
                We sent a link to
              </Typography>
              <Typography variant="body1" fontWeight={700} sx={{ color: '#FF6B35', wordBreak: 'break-all' }}>
                {email}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                Tap the link in the email to sign in. You can close this screen.
              </Typography>
              <Button
                fullWidth
                variant="outlined"
                size="large"
                onClick={() => { setSent(false); setEmail(''); }}
                sx={{ mt: 3, py: 1.5, borderColor: 'rgba(255,255,255,0.15)', color: 'text.secondary' }}
              >
                Use a different email
              </Button>
            </Box>
          ) : (
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

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading || !email}
                sx={{ mt: 0.5, py: 1.75, fontSize: '1rem' }}
              >
                {loading
                  ? <CircularProgress size={22} sx={{ color: '#fff' }} />
                  : 'Send Magic Link'}
              </Button>
            </Box>
          )}
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
