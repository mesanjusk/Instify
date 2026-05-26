import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import BASE_URL from '../config';
import { getInstituteId } from '../utils/instituteUtils';
import { fetchBranding } from '../utils/brandingUtils';
import { fetchAndStoreMasters } from '../utils/masterUtils';
import { storeUserData, storeInstituteData } from '../utils/storageUtils';

const FeaturePill = ({ emoji, label, delay = 0 }) => (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: 8,
    background: 'rgba(255,255,255,0.14)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 99,
    padding: '8px 16px',
    animation: `fadeUp 0.5s ease ${delay}s both`,
  }}>
    <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{emoji}</span>
    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.02em' }}>{label}</span>
  </div>
);

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [branding, setBranding] = useState(JSON.parse(localStorage.getItem('branding')) || null);
  const [loading, setLoading] = useState(false);
  const [focusField, setFocusField] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    if (branding?.theme?.color) {
      document.documentElement.style.setProperty('--theme-color', branding.theme.color);
    }
    const user = localStorage.getItem('user');
    const insti = localStorage.getItem('institute');
    if (user && insti) {
      navigate('/dashboard');
    }
  }, [navigate, branding]);

  useEffect(() => {
    if (!branding) {
      const insti = getInstituteId(searchParams);
      fetchBranding(insti, setBranding);
    }
  }, [searchParams, branding]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const insti = getInstituteId(searchParams);
    try {
      const { data } = await axios.post(`${BASE_URL}/api/auth/user/login`, { username, password });
      if (data.message !== 'success') {
        toast.error(data.message || 'Invalid credentials');
        setLoading(false);
        return;
      }
      toast.success(`Welcome back, ${data.user_name}!`);
      storeUserData({
        id: data.user_id,
        name: data.user_name,
        role: data.user_role,
        username: data.login_username,
      });
      localStorage.setItem('authToken', data.token);
      storeInstituteData({
        institute_uuid: data.institute_uuid,
        institute_name: data.institute_name,
        institute_id: data.institute_id,
        theme_color: data.theme_color,
        plan_type: data.plan_type,
        status: data.status,
        modulesEnabled: data.modulesEnabled,
        trialExpiresAt: data.trialExpiresAt,
      });
      if (data.trialExpiresAt) {
        localStorage.setItem('trialExpiresAt', data.trialExpiresAt);
      }
      document.documentElement.style.setProperty('--theme-color', data.theme_color || '#059669');
      if (window.updateAppContext) {
        window.updateAppContext({
          user: JSON.parse(localStorage.getItem('user')),
          institute: JSON.parse(localStorage.getItem('institute')),
        });
      }
      await fetchBranding(insti, setBranding);
      await fetchAndStoreMasters();
      setTimeout(() => navigate(`/${data.login_username}`), 600);
    } catch (err) {
      console.error('Login error:', err);
      toast.error(err.response?.data?.message || 'Server error during login');
    } finally {
      setPassword('');
      setLoading(false);
    }
  };

  const handleLogoClick = () => {
    window.location.href = 'https://app.sanjusk.in';
  };

  const themeColor = branding?.theme?.color || '#059669';
  const darkTheme = `#064e3b`;

  const inputStyle = (field) => ({
    width: '100%',
    padding: '13px 16px',
    border: `1.5px solid ${focusField === field ? themeColor : '#e2e8f0'}`,
    borderRadius: 12,
    fontSize: '0.9rem',
    fontFamily: 'inherit',
    color: '#0f172a',
    backgroundColor: focusField === field ? '#ffffff' : '#f8fafc',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxShadow: focusField === field ? `0 0 0 3px ${themeColor}20` : 'none',
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: '"Inter", -apple-system, sans-serif' }}>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { borderRadius: 12, fontWeight: 600, fontSize: '0.875rem' },
        }}
      />

      {/* ── Left branding panel — desktop ── */}
      <div style={{
        display: 'none',
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 48px',
        background: `linear-gradient(150deg, ${darkTheme} 0%, ${themeColor} 50%, #34d399 100%)`,
        position: 'relative',
        overflow: 'hidden',
      }}
        className="md:flex"
      >
        {/* Decorative blobs */}
        <div style={{
          position: 'absolute', top: -80, right: -80,
          width: 280, height: 280, borderRadius: '50%',
          background: 'rgba(255,255,255,0.07)',
        }} />
        <div style={{
          position: 'absolute', bottom: -60, left: -60,
          width: 200, height: 200, borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
        }} />
        <div style={{
          position: 'absolute', top: '40%', left: '10%',
          width: 120, height: 120, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
        }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 380 }}>
          {/* Logo */}
          <button onClick={handleLogoClick} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'block', margin: '0 auto 28px' }}>
            <div style={{
              width: 88, height: 88,
              borderRadius: 24,
              background: 'rgba(255,255,255,0.18)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              animation: 'floatY 4s ease-in-out infinite',
            }}>
              <img
                src={branding?.logo || '/pwa-512x512.png'}
                alt="Logo"
                onError={(e) => (e.target.src = '/pwa-512x512.png')}
                style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: 12 }}
              />
            </div>
          </button>

          {/* Institute name */}
          <h1 style={{
            color: '#ffffff',
            fontSize: '2.25rem',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            lineHeight: 1.15,
            margin: '0 0 12px',
            animation: 'fadeUp 0.5s ease 0.1s both',
          }}>
            {branding?.institute || 'Instify'}
          </h1>

          {branding?.tagline && (
            <p style={{
              color: 'rgba(255,255,255,0.75)',
              fontSize: '1rem',
              margin: '0 0 36px',
              lineHeight: 1.6,
              animation: 'fadeUp 0.5s ease 0.15s both',
            }}>
              {branding.tagline}
            </p>
          )}

          {/* Feature pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 40 }}>
            <FeaturePill emoji="👩‍🎓" label="Student Management" delay={0.2} />
            <FeaturePill emoji="💳" label="Fee & Finance" delay={0.25} />
            <FeaturePill emoji="💬" label="WhatsApp Bot" delay={0.3} />
            <FeaturePill emoji="📊" label="Live Reports" delay={0.35} />
            <FeaturePill emoji="🪪" label="ID Cards" delay={0.4} />
            <FeaturePill emoji="📋" label="Admissions" delay={0.45} />
          </div>

          <p style={{
            color: 'rgba(255,255,255,0.35)',
            fontSize: '0.72rem',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            animation: 'fadeIn 0.5s ease 0.5s both',
          }}>
            Powered by Instify · Institute Management System
          </p>
        </div>

        <style>{`
          @keyframes floatY { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
          @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
          @keyframes fadeIn { from{opacity:0} to{opacity:1} }
          @media(min-width:768px){ .md\\:flex{ display:flex !important } }
        `}</style>
      </div>

      {/* ── Right form panel ── */}
      <div style={{
        width: '100%',
        maxWidth: 480,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        padding: '40px 32px',
        minHeight: '100vh',
        boxShadow: '-4px 0 40px rgba(15,23,42,0.06)',
      }}>

        {/* Mobile: logo */}
        <div style={{ textAlign: 'center', marginBottom: 28, display: 'none' }} className="md-hidden-block">
          <button onClick={handleLogoClick} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <img
              src={branding?.logo || '/pwa-512x512.png'}
              alt="Logo"
              onError={(e) => (e.target.src = '/pwa-512x512.png')}
              style={{ width: 72, height: 72, objectFit: 'contain', borderRadius: 16 }}
            />
          </button>
          <h2 style={{
            fontSize: '1.4rem', fontWeight: 800, margin: '10px 0 4px',
            letterSpacing: '-0.03em', color: themeColor,
          }}>
            {branding?.institute || 'Instify'}
          </h2>
          {branding?.tagline && (
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>{branding.tagline}</p>
          )}
        </div>

        <div style={{ width: '100%', maxWidth: 360 }}>
          {/* Heading */}
          <div style={{ marginBottom: 32 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: `linear-gradient(135deg, ${darkTheme}, ${themeColor})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20,
              boxShadow: `0 8px 20px ${themeColor}35`,
            }}>
              <span style={{ fontSize: '1.4rem' }}>⚡</span>
            </div>
            <h2 style={{
              fontSize: '1.65rem', fontWeight: 800, margin: '0 0 6px',
              letterSpacing: '-0.04em', color: '#0f172a',
            }}>
              Welcome back
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0, lineHeight: 1.6 }}>
              Sign in to {branding?.institute || 'your institute'}
            </p>
          </div>

          {/* Hint */}
          <div style={{
            background: '#f0fdf4', border: '1px solid #bbf7d0',
            borderRadius: 10, padding: '10px 14px',
            marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: '0.85rem' }}>💡</span>
            <span style={{ fontSize: '0.78rem', color: '#065f46', fontWeight: 500 }}>
              Use your Center Code as both username and password
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{
                display: 'block', marginBottom: 6,
                fontSize: '0.825rem', fontWeight: 600, color: '#374151',
                letterSpacing: '-0.01em',
              }}>
                Center Code
              </label>
              <input
                ref={inputRef}
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setPassword(e.target.value); }}
                onFocus={() => setFocusField('username')}
                onBlur={() => setFocusField(null)}
                required
                style={inputStyle('username')}
                placeholder="Enter your center code"
                autoComplete="username"
              />
            </div>

            <div>
              <label style={{
                display: 'block', marginBottom: 6,
                fontSize: '0.825rem', fontWeight: 600, color: '#374151',
                letterSpacing: '-0.01em',
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusField('password')}
                  onBlur={() => setFocusField(null)}
                  required
                  style={{ ...inputStyle('password'), paddingRight: 64 }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  style={{
                    position: 'absolute', insetY: 0, right: 14,
                    top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '0.78rem', fontWeight: 600,
                    color: '#64748b', padding: '4px 6px', borderRadius: 6,
                  }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div style={{ textAlign: 'right', marginTop: -8 }}>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '0.8rem', fontWeight: 600, color: themeColor,
                  fontFamily: 'inherit', padding: 0,
                  textDecoration: 'underline', textDecorationColor: `${themeColor}50`,
                }}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 12,
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                background: loading
                  ? '#94a3b8'
                  : `linear-gradient(135deg, ${darkTheme} 0%, ${themeColor} 100%)`,
                color: '#ffffff',
                fontSize: '0.9rem',
                fontWeight: 700,
                letterSpacing: '-0.01em',
                fontFamily: 'inherit',
                boxShadow: loading ? 'none' : `0 6px 20px ${themeColor}40`,
                transition: 'all 0.2s ease',
                opacity: loading ? 0.8 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginTop: 4,
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
              }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: 16, height: 16, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    display: 'inline-block',
                    animation: 'spin 0.7s linear infinite',
                  }} />
                  Signing in…
                </>
              ) : (
                'Sign In →'
              )}
            </button>
          </form>

          {/* Footer links */}
          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              Don&apos;t have an account?{' '}
              <button
                onClick={() => navigate('/signup')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontWeight: 700, color: themeColor, fontFamily: 'inherit',
                  fontSize: '0.85rem', padding: 0,
                  textDecoration: 'underline', textDecorationColor: `${themeColor}50`,
                }}
              >
                Register
              </button>
            </span>
          </div>
        </div>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
          @keyframes fadeIn { from{opacity:0} to{opacity:1} }
          .md-hidden-block { display:block !important }
          @media(min-width:768px){ .md-hidden-block { display:none !important } }
          @media(min-width:768px){ .md\\:flex{ display:flex !important } }
        `}</style>
      </div>
    </div>
  );
};

export default Login;
