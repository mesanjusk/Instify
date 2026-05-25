import { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import BASE_URL from '../config';

function getSubdomain() {
  const parts = window.location.hostname.split('.');
  return parts.length > 2 ? parts[0] : null;
}

const AppLoader = ({ children }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const subdomain = getSubdomain();
    const isDevDomain = window.location.hostname.includes('vercel.app') ||
                        window.location.hostname.includes('localhost');

    if (!subdomain || isDevDomain) {
      setLoading(false);
      return;
    }

    axios.get(`${BASE_URL}/api/resolve-org?subdomain=${subdomain}`)
      .then((res) => {
        const org = res.data.institute;
        localStorage.setItem('institute_id', org._id);
        localStorage.setItem('institute_uuid', org.institute_uuid);
        localStorage.setItem('institute_title', org.institute_title);
        localStorage.setItem('theme_color', org.theme_color || '#059669');
        document.documentElement.style.setProperty('--theme-color', org.theme_color || '#059669');
        setLoading(false);
      })
      .catch(() => {
        toast.error('Invalid subdomain.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #064e3b 0%, #059669 50%, #34d399 100%)',
        gap: 20,
      }}>
        {/* Animated logo */}
        <div style={{
          width: 72, height: 72,
          borderRadius: 20,
          background: 'rgba(255,255,255,0.2)',
          backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2.25rem',
          animation: 'floatY 2s ease-in-out infinite',
          boxShadow: '0 0 40px rgba(255,255,255,0.2)',
        }}>
          ⚡
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '-0.04em',
            lineHeight: 1.2,
          }}>
            Instify
          </div>
          <div style={{
            fontSize: '0.8rem',
            color: 'rgba(255,255,255,0.65)',
            marginTop: 4,
            letterSpacing: '0.04em',
          }}>
            Loading your workspace…
          </div>
        </div>

        {/* Spinner dots */}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%',
              background: 'rgba(255,255,255,0.7)',
              animation: `livePulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>

        <style>{`
          @keyframes floatY {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          @keyframes livePulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.4; transform: scale(0.75); }
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
};

export default AppLoader;
