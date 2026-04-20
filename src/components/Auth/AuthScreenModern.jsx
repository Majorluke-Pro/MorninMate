import { useEffect, useMemo, useRef, useState } from 'react';
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
    <div style={{ position: 'relative' }}>
      <div
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 10,
          border: '1px solid',
          borderColor: focused ? 'rgba(255,107,53,0.55)' : 'rgba(255,255,255,0.10)',
          background: 'rgba(10,12,24,0.78)',
          transition: 'border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
          boxShadow: focused ? '0 0 0 1px rgba(255,107,53,0.18), 0 18px 40px rgba(0,0,0,0.28)' : 'none',
        }}
      >
        <div
          style={{
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
        </div>

        <input
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={{
            width: '100%',
            background: 'transparent',
            color: 'inherit',
            border: 0,
            outline: 'none',
            padding: trailing ? '17px 48px 17px 48px' : '17px 16px 17px 48px',
            fontSize: '0.98rem',
            fontFamily: '"Outfit", sans-serif',
            boxSizing: 'border-box',
          }}
        />

        <span
          style={{
            position: 'absolute',
            left: 48,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '0.92rem',
            fontWeight: 500,
            color: focused ? '#FF6B35' : 'rgba(255,255,255,0.6)',
            pointerEvents: 'none',
            opacity: value ? 0 : 1,
            transition: 'opacity 0.18s ease, color 0.18s ease',
            zIndex: 2,
          }}
        >
          {placeholder}
        </span>

        {trailing && (
          <div
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 2,
            }}
          >
            {trailing}
          </div>
        )}

        {hovering && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background: `radial-gradient(200px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,107,53,0.12) 0%, transparent 70%)`,
            }}
          />
        )}
      </div>
    </div>
  );
}

function PeekKoala({ isSignUp }) {
  const sideStyles = isSignUp
    ? {
        anchor: { right: 24 },
        bubbleJustify: 'flex-end',
        tail: { right: 28 },
        pawNear: { right: 20, transform: 'rotate(-10deg)' },
        pawFar: { right: 78, transform: 'rotate(8deg)' },
      }
    : {
        anchor: { left: 24 },
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
    <div
      style={{
        position: 'absolute',
        top: 26,
        ...sideStyles.anchor,
        width: 144,
        pointerEvents: 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: sideStyles.bubbleJustify, marginBottom: 0, marginTop: 17.6 }}>
        <div
          style={{
            position: 'relative',
            maxWidth: 132,
            padding: '6px 9.2px',
            borderRadius: 18,
            background: 'rgba(255,248,235,0.96)',
            color: '#3B2C25',
            fontSize: '0.72rem',
            fontWeight: 700,
            lineHeight: 1.2,
            boxShadow: '0 18px 44px rgba(0,0,0,0.18)',
            zIndex: 5,
            animation: 'koalaBubbleIn 680ms cubic-bezier(0.22, 1, 0.36, 1) 180ms both',
            transformOrigin: isSignUp ? '85% 100%' : '15% 100%',
          }}
        >
          {speech}
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          height: 80,
          zIndex: 1,
          animation: `${peekAnimation}, ${bobAnimation}`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            bottom: 2,
            ...sideStyles.pawNear,
            width: 34,
            height: 20,
            borderRadius: '18px 18px 12px 12px',
            background: '#8C8FB5',
            border: '1px solid rgba(29,31,54,0.22)',
            boxShadow: '0 10px 18px rgba(0,0,0,0.22)',
            zIndex: 4,
            animation: isSignUp ? 'koalaPawWave 1.9s ease-in-out 1s infinite' : 'koalaPawGrip 3.6s ease-in-out 1s infinite',
            transformOrigin: isSignUp ? '85% 15%' : '50% 50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            ...sideStyles.pawFar,
            width: 36,
            height: 22,
            borderRadius: '18px 18px 12px 12px',
            background: '#7D81A9',
            border: '1px solid rgba(29,31,54,0.22)',
            boxShadow: '0 10px 18px rgba(0,0,0,0.22)',
            zIndex: 4,
            animation: 'koalaPawPress 3.9s ease-in-out 1.1s infinite',
          }}
        />

        <div
          style={{
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
        </div>
      </div>
    </div>
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
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
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

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(circle at 20% 20%, rgba(255,255,255,0.03), transparent 18%),
            radial-gradient(circle at 80% 70%, rgba(255,107,53,0.05), transparent 22%)
          `,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: 420,
        }}
      >
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            background: 'rgba(17, 20, 34, 0.74)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 20,
            padding: '96px 32px 32px',
            boxShadow: '0 30px 90px rgba(0,0,0,0.45)',
            overflow: 'hidden',
          }}
        >
          <PeekKoala key={mode} isSignUp={isSignUp} />

          <div style={{ textAlign: 'center', marginBottom: 32, position: 'relative', zIndex: 4 }}>
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                margin: '0 auto 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, rgba(255,107,53,0.20), rgba(255,209,102,0.14))',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 0 40px rgba(255,107,53,0.14)',
              }}
            >
              <User size={30} color="#FF6B35" />
            </div>

            <h4 style={{ fontWeight: 800, margin: '0 0 8px', fontSize: '1.5rem', color: 'inherit' }}>
              {firstName && isSignUp ? `Finish setup, ${firstName}` : isSignUp ? 'Create Account' : 'Welcome Back'}
            </h4>
            <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: 280, margin: '0 auto', fontSize: '1rem' }}>
              {isSignUp ? 'Sign up to save your alarms and morning profile.' : 'Sign in to continue to your morning dashboard.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
            {error && (
              <div className="bg-error/15 border border-error/30 text-error text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}
            {message && (
              <div className="bg-success/15 border border-success/30 text-success text-sm px-4 py-3 rounded-xl">
                {message}
              </div>
            )}

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
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="p-2 text-muted active:scale-90 transition-transform touch-manipulation"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
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

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 4 }}>
              <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
                Remember me
              </label>

              {!isSignUp && (
                <button type="button" className="btn-ghost" style={{ minWidth: 0, color: '#FF6B35', padding: '4px' }}>
                  Forgot password?
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="btn-primary"
              style={{ marginTop: 8 }}
            >
              {loading
                ? <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" style={{ width: 22, height: 22, margin: '0 auto' }} />
                : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: 32, textAlign: 'center' }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.92rem', margin: 0 }}>
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
                }}
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </div>
        </div>

        {!pendingOnboarding && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button type="button" className="btn-ghost" onClick={() => setShowAuthDirectly(false)}>
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
