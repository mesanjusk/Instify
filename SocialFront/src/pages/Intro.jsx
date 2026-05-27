import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;

const isInStandaloneMode = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  window.navigator.standalone === true;

export default function Intro() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall]       = useState(false);
  const [installed, setInstalled]           = useState(false);
  const [borderHue, setBorderHue]           = useState(0); // 0=green 1=blue 2=indigo

  /* Auto-redirect if already logged in */
  useEffect(() => {
    const token    = localStorage.getItem('authToken');
    const username = localStorage.getItem('login_username');
    if (token && username) {
      navigate(`/${username}`, { replace: true });
    }
  }, [navigate]);

  /* Animated gradient border cycle */
  useEffect(() => {
    const id = setInterval(() => setBorderHue(h => (h + 1) % 3), 1800);
    return () => clearInterval(id);
  }, []);

  /* PWA install prompt */
  useEffect(() => {
    if (isInStandaloneMode()) { setInstalled(true); return; }
    const handler = e => { e.preventDefault(); setDeferredPrompt(e); setShowInstall(true); };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => { setShowInstall(false); setInstalled(true); });
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setDeferredPrompt(null);
    setShowInstall(false);
  };

  const borderColors = [
    'linear-gradient(135deg, #1a7a4a, #34c97e, #1a7a4a)',
    'linear-gradient(135deg, #1d4ed8, #60a5fa, #1d4ed8)',
    'linear-gradient(135deg, #4f46e5, #a78bfa, #4f46e5)',
  ];

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #0f2d1e 0%, #1a4a2e 40%, #0a1a0f 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px', fontFamily: "'Poppins', 'Inter', sans-serif",
    }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; } 50% { opacity: 0.6; }
        }
        @keyframes borderSpin {
          from { background-position: 0% 50%; }
          to   { background-position: 100% 50%; }
        }
      `}</style>

      {/* Gradient-border card wrapper */}
      <div style={{
        padding: 3, borderRadius: 24,
        background: borderColors[borderHue],
        transition: 'background 1.2s ease',
        boxShadow: '0 8px 40px rgba(0,0,0,0.45)',
        width: '100%', maxWidth: 360,
        animation: 'fadeUp 0.5s ease both',
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 22,
          padding: '36px 28px 32px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0,
        }}>

          {/* App icon */}
          <div style={{
            width: 72, height: 72, borderRadius: 18,
            background: 'linear-gradient(135deg, #1a7a4a, #34c97e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16, boxShadow: '0 4px 16px rgba(26,122,74,0.35)',
            animation: 'fadeUp 0.5s ease 0.1s both',
          }}>
            <span style={{ fontSize: '2rem', lineHeight: 1 }}>🏫</span>
          </div>

          {/* Title */}
          <div style={{ animation: 'fadeUp 0.5s ease 0.15s both', textAlign: 'center', marginBottom: 6 }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f2d1e', letterSpacing: '-0.02em', lineHeight: 1 }}>
              Instify
            </div>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#1a7a4a', letterSpacing: '0.12em', marginTop: 4, textTransform: 'uppercase' }}>
              Smart Institute Management
            </div>
          </div>

          {/* Feature pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, margin: '20px 0', animation: 'fadeUp 0.5s ease 0.2s both' }}>
            {[
              { emoji: '👥', label: 'Students' },
              { emoji: '📋', label: 'Admissions' },
              { emoji: '💰', label: 'Fees' },
              { emoji: '📊', label: 'Reports' },
              { emoji: '🎓', label: 'Certificates' },
              { emoji: '💬', label: 'WhatsApp' },
            ].map(({ emoji, label }) => (
              <div key={label} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: '#f0fdf4', border: '1px solid #bbf7d0',
                borderRadius: 99, padding: '5px 12px',
              }}>
                <span style={{ fontSize: '0.85rem' }}>{emoji}</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#1a7a4a' }}>{label}</span>
              </div>
            ))}
          </div>

          {/* PWA Install button */}
          {showInstall && !installed && (
            <button
              onClick={handleInstall}
              style={{
                width: '100%', padding: '12px 0', marginBottom: 12,
                background: 'linear-gradient(135deg, #1a7a4a, #34c97e)',
                color: '#fff', border: 'none', borderRadius: 12,
                fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                animation: 'fadeUp 0.5s ease 0.25s both',
                boxShadow: '0 4px 14px rgba(26,122,74,0.35)',
              }}
            >
              <span>📲</span> Add to Home Screen
            </button>
          )}

          {/* iOS install hint */}
          {isIOS() && !isInStandaloneMode() && (
            <div style={{
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              borderRadius: 10, padding: '10px 14px', marginBottom: 12,
              fontSize: '0.75rem', color: '#166534', lineHeight: 1.5,
              animation: 'fadeUp 0.5s ease 0.25s both', textAlign: 'center',
            }}>
              <strong>iPhone / iPad:</strong> open in Safari → tap Share ⬆️ → <em>Add to Home Screen</em>
            </div>
          )}

          {/* Login button */}
          <button
            onClick={() => navigate('/login')}
            style={{
              width: '100%', padding: '13px 0',
              background: 'linear-gradient(135deg, #1a7a4a, #25a066)',
              color: '#fff', border: 'none', borderRadius: 12,
              fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(26,122,74,0.3)',
              animation: 'fadeUp 0.5s ease 0.3s both',
              marginBottom: 10,
            }}
          >
            Login
          </button>

          {/* Sign up link */}
          <button
            onClick={() => navigate('/signup')}
            style={{
              width: '100%', padding: '11px 0',
              background: 'transparent', color: '#1a7a4a',
              border: '1.5px solid #1a7a4a', borderRadius: 12,
              fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
              animation: 'fadeUp 0.5s ease 0.35s both',
              marginBottom: 16,
            }}
          >
            Create Account
          </button>

          <p style={{ fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center', margin: 0, animation: 'fadeUp 0.5s ease 0.4s both' }}>
            After login, your institute data is available across all devices
          </p>
        </div>
      </div>

      {/* Footer */}
      <p style={{ marginTop: 20, fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', textAlign: 'center', animation: 'fadeUp 0.5s ease 0.45s both' }}>
        © {new Date().getFullYear()} Instify · All rights reserved
      </p>
    </div>
  );
}
