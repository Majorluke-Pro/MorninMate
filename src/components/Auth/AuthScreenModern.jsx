import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  Typography,
} from '@mui/material';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';

function FloatingParticles() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 1,
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: (Math.random() - 0.5) * 0.5,
      opacity: Math.random() * 0.3,
    }));

    let frameId;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        if (particle.x > canvas.width) particle.x = 0;
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.y > canvas.height) particle.y = 0;
        if (particle.y < 0) particle.y = canvas.height;

        ctx.fillStyle = `rgba(255, 107, 53, ${particle.opacity})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      frameId = window.requestAnimationFrame(render);
    };

    render();

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
}

function AnimatedFormField({
  type,
  placeholder,
  value,
  onChange,
  icon,
  trailing,
}) {
  const [focused, setFocused] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  function handleMouseMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  }

  return (
    <Box sx={{ position: 'relative' }}>
      <Box
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 2.5,
          border: '1px solid',
          borderColor: focused ? 'rgba(255,107,53,0.55)' : 'rgba(255,255,255,0.10)',
          bgcolor: 'rgba(10,12,24,0.78)',
          transition: 'border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
          boxShadow: focused ? '0 0 0 1px rgba(255,107,53,0.18), 0 18px 40px rgba(0,0,0,0.28)' : 'none',
          '&:hover': {
            borderColor: 'rgba(255,255,255,0.18)',
            transform: 'translateY(-1px)',
          },
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            color: focused ? '#FF6B35' : 'rgba(255,255,255,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s ease',
            zIndex: 2,
          }}
        >
          {icon}
        </Box>

        <Box
          component="input"
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          sx={{
            width: '100%',
            bgcolor: 'transparent',
            color: 'text.primary',
            border: 0,
            outline: 'none',
            py: 2.1,
            pl: 6,
            pr: trailing ? 6 : 2,
            fontSize: '0.98rem',
            fontFamily: '"Outfit", sans-serif',
            '&::placeholder': { color: 'transparent' },
          }}
          placeholder={placeholder}
        />

        <Typography
          sx={{
            position: 'absolute',
            left: 48,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '0.92rem',
            fontWeight: 500,
            color: focused ? '#FF6B35' : 'text.secondary',
            pointerEvents: 'none',
            opacity: value ? 0 : 1,
            transition: 'opacity 0.18s ease, color 0.18s ease',
            zIndex: 2,
          }}
        >
          {placeholder}
        </Typography>

        {trailing && (
          <Box
            sx={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 2,
            }}
          >
            {trailing}
          </Box>
        )}

        {hovering && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background: `radial-gradient(200px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,107,53,0.12) 0%, transparent 70%)`,
            }}
          />
        )}
      </Box>
    </Box>
  );
}

function PeekKoala({ isSignUp }) {
  const sideStyles = isSignUp
    ? {
        anchor: { right: { xs: 14, sm: 24 } },
        bubbleJustify: 'flex-end',
        tail: { right: 28 },
        pawNear: { right: 20, transform: 'rotate(-10deg)' },
        pawFar: { right: 78, transform: 'rotate(8deg)' },
      }
    : {
        anchor: { left: { xs: 14, sm: 24 } },
        bubbleJustify: 'flex-start',
        tail: { left: 28 },
        pawNear: { left: 20, transform: 'rotate(10deg)' },
        pawFar: { left: 78, transform: 'rotate(-8deg)' },
      };

  const speech = isSignUp ? "G'day, fresh face!" : 'Welcome back, mate!';
  const peekAnimation = isSignUp ? 'koalaPeekInRight 980ms cubic-bezier(0.16, 0.9, 0.24, 1) both' : 'koalaPeekInLeft 980ms cubic-bezier(0.16, 0.9, 0.24, 1) both';
  const bobAnimation = isSignUp ? 'koalaHeadFloatRight 4.2s ease-in-out 1s infinite' : 'koalaHeadFloatLeft 4.4s ease-in-out 1s infinite';
  const noseAnimation = isSignUp ? 'koalaNoseHappy 2.1s ease-in-out 1.2s infinite' : 'koalaNoseIdle 3.1s ease-in-out 1.2s infinite';

  return (
    <Box
      sx={{
        position: 'absolute',
        top: { xs: 24, sm: 26 },
        ...sideStyles.anchor,
        width: 144,
        pointerEvents: 'none',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: sideStyles.bubbleJustify, mb: 0, mt: 2.2 }}>
        <Box
          sx={{
            position: 'relative',
            maxWidth: 132,
            px: 1.15,
            py: 0.75,
            borderRadius: '18px',
            bgcolor: 'rgba(255,248,235,0.96)',
            color: '#3B2C25',
            fontSize: '0.72rem',
            fontWeight: 700,
            lineHeight: 1.2,
            boxShadow: '0 18px 44px rgba(0,0,0,0.18)',
            zIndex: 5,
            animation: 'koalaBubbleIn 680ms cubic-bezier(0.22, 1, 0.36, 1) 180ms both',
            transformOrigin: isSignUp ? '85% 100%' : '15% 100%',
            '@keyframes koalaBubbleIn': {
              '0%': { opacity: 0, transform: 'translateY(14px) scale(0.84)' },
              '70%': { opacity: 1, transform: 'translateY(-2px) scale(1.03)' },
              '100%': { opacity: 1, transform: 'translateY(0) scale(1)' },
            },
          }}
        >
          {speech}
        </Box>
      </Box>

      <Box
        sx={{
          position: 'relative',
          height: 80,
          zIndex: 1,
          animation: `${peekAnimation}, ${bobAnimation}`,
          '@keyframes koalaPeekInLeft': {
            '0%': { transform: 'translateY(34px) rotate(-10deg) scale(0.92)' },
            '42%': { transform: 'translateY(-6px) rotate(3deg) scale(1.01)' },
            '63%': { transform: 'translateY(3px) rotate(-2deg) scale(0.995)' },
            '82%': { transform: 'translateY(-1px) rotate(0.8deg) scale(1)' },
            '100%': { transform: 'translateY(0) rotate(0deg) scale(1)' },
          },
          '@keyframes koalaPeekInRight': {
            '0%': { transform: 'translateY(34px) rotate(10deg) scale(0.92)' },
            '42%': { transform: 'translateY(-6px) rotate(-3deg) scale(1.01)' },
            '63%': { transform: 'translateY(3px) rotate(2deg) scale(0.995)' },
            '82%': { transform: 'translateY(-1px) rotate(-0.8deg) scale(1)' },
            '100%': { transform: 'translateY(0) rotate(0deg) scale(1)' },
          },
          '@keyframes koalaHeadFloatLeft': {
            '0%,100%': { transform: 'translateY(0px) rotate(0deg)' },
            '25%': { transform: 'translateY(-1px) rotate(0.8deg)' },
            '55%': { transform: 'translateY(3px) rotate(-1.4deg)' },
            '78%': { transform: 'translateY(1px) rotate(0.5deg)' },
          },
          '@keyframes koalaHeadFloatRight': {
            '0%,100%': { transform: 'translateY(0px) rotate(0deg)' },
            '25%': { transform: 'translateY(-1px) rotate(-0.8deg)' },
            '55%': { transform: 'translateY(3px) rotate(1.4deg)' },
            '78%': { transform: 'translateY(1px) rotate(-0.5deg)' },
          },
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            bottom: 2,
            ...sideStyles.pawNear,
            width: 34,
            height: 20,
            borderRadius: '18px 18px 12px 12px',
            bgcolor: '#8C8FB5',
            border: '1px solid rgba(29,31,54,0.22)',
            boxShadow: '0 10px 18px rgba(0,0,0,0.22)',
            zIndex: 4,
            animation: isSignUp ? 'koalaPawWave 1.9s ease-in-out 1s infinite' : 'koalaPawGrip 3.6s ease-in-out 1s infinite',
            transformOrigin: isSignUp ? '85% 15%' : '50% 50%',
            '@keyframes koalaPawWave': {
              '0%,100%': { transform: 'rotate(-10deg) translateY(0px)' },
              '50%': { transform: 'rotate(12deg) translateY(-4px)' },
            },
            '@keyframes koalaPawGrip': {
              '0%,100%': { transform: 'rotate(10deg) translateY(0px) scaleX(1)' },
              '35%': { transform: 'rotate(8deg) translateY(1px) scaleX(0.97)' },
              '60%': { transform: 'rotate(12deg) translateY(-1px) scaleX(1.02)' },
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              left: 5,
              right: 5,
              top: 7,
              height: 8,
              borderRadius: 99,
              bgcolor: '#9B9FC2',
            },
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            ...sideStyles.pawFar,
            width: 36,
            height: 22,
            borderRadius: '18px 18px 12px 12px',
            bgcolor: '#7D81A9',
            border: '1px solid rgba(29,31,54,0.22)',
            boxShadow: '0 10px 18px rgba(0,0,0,0.22)',
            zIndex: 4,
            animation: 'koalaPawPress 3.9s ease-in-out 1.1s infinite',
            '@keyframes koalaPawPress': {
              '0%,100%': { transform: sideStyles.pawFar.transform },
              '45%': { transform: `${sideStyles.pawFar.transform} translateY(1px)` },
              '65%': { transform: `${sideStyles.pawFar.transform} translateY(-1px)` },
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              left: 6,
              right: 6,
              top: 8,
              height: 8,
              borderRadius: 99,
              bgcolor: '#8B90B8',
            },
          }}
        />

        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            bottom: -18,
            transform: 'translateX(-50%)',
            width: 112,
            height: 88,
            zIndex: 1,
            overflow: 'visible',
          }}
        >
          <svg viewBox="0 0 180 140" width="100%" height="100%" style={{ overflow: 'visible', display: 'block' }}>
            <defs>
              <filter id="koalaShadow" x="-40%" y="-40%" width="180%" height="200%">
                <feDropShadow dx="0" dy="16" stdDeviation="12" floodColor="rgba(0,0,0,0.28)" />
              </filter>
            </defs>
            <g filter="url(#koalaShadow)">
              <g transform="translate(26 10)">
                <g
                  transform="rotate(-18 18 24)"
                  style={{
                    transformOrigin: '18px 24px',
                    animation: isSignUp ? 'koalaEarLeftHappy 2.4s ease-in-out 1s infinite' : 'koalaEarLeftIdle 3.3s ease-in-out 1s infinite',
                  }}
                >
                  <ellipse cx="18" cy="24" rx="20" ry="24" fill="#7E81AA" />
                  <ellipse cx="18" cy="28" rx="12" ry="14" fill="#D7B8CA" />
                </g>
                <g
                  transform="translate(90 0) rotate(18 18 24)"
                  style={{
                    transformOrigin: '108px 24px',
                    animation: isSignUp ? 'koalaEarRightHappy 2.4s ease-in-out 1.08s infinite' : 'koalaEarRightIdle 3.3s ease-in-out 1.08s infinite',
                  }}
                >
                  <ellipse cx="18" cy="24" rx="20" ry="24" fill="#7E81AA" />
                  <ellipse cx="18" cy="28" rx="12" ry="14" fill="#D7B8CA" />
                </g>
                <ellipse cx="72" cy="62" rx="58" ry="48" fill="#9AA0C7" />
                <ellipse cx="72" cy="70" rx="46" ry="36" fill="#A8ADD1" />
                <ellipse cx="47" cy="34" rx="12" ry="8" fill="rgba(255,255,255,0.10)" transform="rotate(-24 47 34)" />
                <ellipse cx="72" cy="72" rx="23" ry="17" fill="#25304A" />
                <ellipse cx="50" cy="52" rx="9" ry="11" fill="#141929" />
                <ellipse cx="94" cy="52" rx="9" ry="11" fill="#141929" />
                <ellipse cx="53" cy="49" rx="3" ry="3.5" fill="#fff" opacity="0.85">
                  <animate attributeName="ry" values="3.5;3.5;0.4;3.5;3.5" keyTimes="0;0.42;0.46;0.5;1" dur={isSignUp ? '4.2s' : '4.8s'} repeatCount="indefinite" />
                </ellipse>
                <ellipse cx="97" cy="49" rx="3" ry="3.5" fill="#fff" opacity="0.85">
                  <animate attributeName="ry" values="3.5;3.5;0.4;3.5;3.5" keyTimes="0;0.42;0.46;0.5;1" dur={isSignUp ? '4.2s' : '4.8s'} repeatCount="indefinite" />
                </ellipse>
                <ellipse
                  cx="72"
                  cy="67"
                  rx="7"
                  ry="5.5"
                  fill="#4A5168"
                  style={{ transformOrigin: '72px 67px', animation: noseAnimation }}
                />
                <path d="M 64 73 Q 72 78 80 73" stroke="rgba(0,0,0,0.10)" strokeWidth="2" fill="none" strokeLinecap="round" />
                <path
                  d={isSignUp ? 'M 60 79 Q 72 90 84 79' : 'M 62 80 Q 72 87 82 80'}
                  stroke="rgba(255,255,255,0.86)"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
                {isSignUp && (
                  <path
                    d="M 52 42 Q 59 37 66 42 M 78 42 Q 85 37 92 42"
                    stroke="rgba(37,48,74,0.35)"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                  />
                )}
              </g>
            </g>
          </svg>
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              '@keyframes koalaEarIdle': {
                '0%,100%': { transform: 'rotate(0deg)' },
                '50%': { transform: 'rotate(-2deg)' },
              },
              '@keyframes koalaEarLeftIdle': {
                '0%,100%': { transform: 'rotate(-18deg)' },
                '30%': { transform: 'rotate(-23deg) translateY(-1px)' },
                '55%': { transform: 'rotate(-14deg) translateY(0px)' },
                '78%': { transform: 'rotate(-20deg) translateY(-0.5px)' },
              },
              '@keyframes koalaEarRightIdle': {
                '0%,100%': { transform: 'translate(90px, 0px) rotate(18deg)' },
                '30%': { transform: 'translate(90px, -1px) rotate(23deg)' },
                '55%': { transform: 'translate(90px, 0px) rotate(14deg)' },
                '78%': { transform: 'translate(90px, -0.5px) rotate(20deg)' },
              },
              '@keyframes koalaEarHappy': {
                '0%,100%': { transform: 'rotate(0deg)' },
                '35%': { transform: 'rotate(-4deg)' },
                '70%': { transform: 'rotate(3deg)' },
              },
              '@keyframes koalaEarLeftHappy': {
                '0%,100%': { transform: 'rotate(-18deg)' },
                '20%': { transform: 'rotate(-28deg) translateY(-2px)' },
                '42%': { transform: 'rotate(-10deg) translateY(0px)' },
                '63%': { transform: 'rotate(-25deg) translateY(-1px)' },
                '82%': { transform: 'rotate(-14deg) translateY(0px)' },
              },
              '@keyframes koalaEarRightHappy': {
                '0%,100%': { transform: 'translate(90px, 0px) rotate(18deg)' },
                '20%': { transform: 'translate(90px, -2px) rotate(28deg)' },
                '42%': { transform: 'translate(90px, 0px) rotate(10deg)' },
                '63%': { transform: 'translate(90px, -1px) rotate(25deg)' },
                '82%': { transform: 'translate(90px, 0px) rotate(14deg)' },
              },
              '@keyframes koalaNoseIdle': {
                '0%,100%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.04)' },
              },
              '@keyframes koalaNoseHappy': {
                '0%,100%': { transform: 'scale(1)' },
                '30%': { transform: 'scale(1.08)' },
                '60%': { transform: 'scale(0.98)' },
              },
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}

export default function AuthScreenModern() {
  const { pendingOnboarding, setShowAuthDirectly } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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
    setShowPassword(false);
    setError('');
    setMessage('');
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        position: 'relative',
        overflow: 'hidden',
        background: `
          radial-gradient(circle at top right, rgba(255,107,53,0.16), transparent 28%),
          radial-gradient(circle at bottom left, rgba(255,209,102,0.10), transparent 30%),
          linear-gradient(180deg, #090B14 0%, #121021 48%, #0E0E19 100%)
        `,
      }}
    >
      <FloatingParticles />

      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(circle at 20% 20%, rgba(255,255,255,0.03), transparent 18%),
            radial-gradient(circle at 80% 70%, rgba(255,107,53,0.05), transparent 22%)
          `,
          pointerEvents: 'none',
        }}
      />

      <Box
        sx={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: 420,
        }}
      >
        <Box
          sx={{
            position: 'relative',
            zIndex: 2,
            bgcolor: 'rgba(17, 20, 34, 0.74)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 5,
            px: { xs: 3, sm: 4 },
            pb: { xs: 3, sm: 4 },
            pt: { xs: 12, sm: 12.5 },
            boxShadow: '0 30px 90px rgba(0,0,0,0.45)',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 10,
              borderRadius: '20px 20px 0 0',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.01))',
              zIndex: 3,
              animation: 'cardLipPulse 4.2s ease-in-out infinite',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: -1,
              left: 0,
              right: 0,
              height: 18,
              borderRadius: '20px 20px 0 0',
              boxShadow: 'inset 0 12px 18px rgba(255,255,255,0.04), inset 0 -8px 12px rgba(0,0,0,0.28)',
              pointerEvents: 'none',
              zIndex: 3,
            },
            '@keyframes cardLipPulse': {
              '0%,100%': { opacity: 0.72 },
              '50%': { opacity: 1 },
            },
          }}
        >
          <PeekKoala key={mode} isSignUp={isSignUp} />

          <Box sx={{ textAlign: 'center', mb: 4, position: 'relative', zIndex: 4 }}>
            <Box
              sx={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                mx: 'auto',
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, rgba(255,107,53,0.20), rgba(255,209,102,0.14))',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 0 40px rgba(255,107,53,0.14)',
              }}
            >
              <User size={30} color="#FF6B35" />
            </Box>

            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
              {firstName && isSignUp ? `Finish setup, ${firstName}` : isSignUp ? 'Create Account' : 'Welcome Back'}
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 280, mx: 'auto' }}>
              {isSignUp ? 'Sign up to save your alarms and morning profile.' : 'Sign in to continue to your morning dashboard.'}
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2 }}>
            {error && <Alert severity="error">{error}</Alert>}
            {message && <Alert severity="success">{message}</Alert>}

            <AnimatedFormField
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail size={18} />}
            />

            <AnimatedFormField
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock size={18} />}
              trailing={(
                <IconButton
                  size="small"
                  onClick={() => setShowPassword((value) => !value)}
                  sx={{ color: 'text.secondary' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </IconButton>
              )}
            />

            {isSignUp && (
              <AnimatedFormField
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                icon={<Lock size={18} />}
              />
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mt: 0.5 }}>
              <FormControlLabel
                control={(
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    sx={{
                      color: 'rgba(255,255,255,0.28)',
                      '&.Mui-checked': { color: '#FF6B35' },
                    }}
                  />
                )}
                label={<Typography sx={{ fontSize: '0.88rem', color: 'text.secondary' }}>Remember me</Typography>}
                sx={{ ml: -0.5 }}
              />

              {!isSignUp && (
                <Button variant="text" sx={{ minWidth: 0, color: '#FF6B35', px: 0.5 }}>
                  Forgot password?
                </Button>
              )}
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading || !canSubmit}
              sx={{
                mt: 1,
                py: 1.7,
                borderRadius: 2.5,
                fontSize: '1rem',
                position: 'relative',
                overflow: 'hidden',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.20), transparent)',
                  transform: 'translateX(-140%)',
                  transition: 'transform 0.9s ease',
                },
                '&:hover::after': {
                  transform: 'translateX(140%)',
                },
              }}
            >
              {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </Box>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography sx={{ color: 'text.secondary', fontSize: '0.92rem' }}>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <Box
                component="button"
                type="button"
                onClick={toggleMode}
                sx={{
                  border: 0,
                  p: 0,
                  bgcolor: 'transparent',
                  color: '#FF6B35',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: 'inherit',
                }}
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </Box>
            </Typography>
          </Box>
        </Box>

        {!pendingOnboarding && (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Button variant="text" onClick={() => setShowAuthDirectly(false)} sx={{ color: 'text.secondary' }}>
              Back
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}
