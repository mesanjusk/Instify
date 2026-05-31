import React, { useState, useEffect, useRef } from 'react';
import { useBranding } from '../context/BrandingContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import BASE_URL from '../config';
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

const Signup = () => {
  const navigate = useNavigate();
  const { branding } = useBranding();
  const isDesktop = !!window.electronAPI;
  const [form, setForm] = useState({
    institute_title: '',
    institute_type: '',
    center_code: '',
    institute_call_number: '',
    center_head_name: '',
    theme_color: '#059669',
    storage_mode: isDesktop ? 'hybrid' : 'cloud_only',
  });

  const STORAGE_MODES = [
    {
      value: 'cloud_only',
      icon: '☁️',
      label: 'Cloud',
      desc: 'Web & Mobile access from anywhere',
      badge: 'Recommended',
    },
    {
      value: 'hybrid',
      icon: '🔄',
      label: 'Hybrid',
      desc: 'Desktop app + cloud sync backup',
      badge: 'Best for Desktop',
    },
    {
      value: 'local_only',
      icon: '💻',
      label: 'Local Only',
      desc: 'Fully offline, data stays on device',
      badge: 'Max Privacy',
    },
  ];

  const themeColor = branding?.theme?.color || form.theme_color || '#059669';
  const darkTheme = '#064e3b';

  const [orgTypes, setOrgTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [serverOtp, setServerOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusField, setFocusField] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    axios.get(`${BASE_URL}/api/org-categories`)
      .then(res => { setOrgTypes(res.data); setLoadingTypes(false); })
      .catch(() => { toast.error('Failed to load institute types'); setLoadingTypes(false); });
  }, []);

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

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
    boxSizing: 'border-box',
  });

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!/^[0-9]{10}$/.test(form.institute_call_number)) {
      toast.error('Enter a valid 10-digit mobile number');
      return;
    }

    // On desktop the local backend has no WhatsApp credentials — skip OTP
    if (isDesktop) {
      return handleSignup(e);
    }

    setLoading(true);
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setServerOtp(generatedOtp);
    try {
      const res = await axios.post(`${BASE_URL}/api/institute/send-message`, {
        mobile: `91${form.institute_call_number}`,
        otp: generatedOtp,
        type: 'signup',
        userName: form.center_head_name,
      });
      if (res.data.success) {
        if (res.data.whatsappSent === false) {
          const errDetail = res.data.whatsappError?.error?.message || res.data.whatsappError || '';
          console.error('WhatsApp error detail:', res.data.whatsappError);
          toast.error(`WhatsApp failed: ${errDetail || 'Check Render logs for details'}`);
        } else {
          setOtpSent(true);
          toast.success('OTP sent to your WhatsApp');
        }
      } else {
        toast.error('Failed to send OTP. Please try again.');
      }
    } catch (err) {
      console.error('OTP Send Error:', err);
      toast.error('Error sending OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    // OTP verification is skipped on desktop (no WhatsApp credentials on local backend)
    if (!isDesktop && (!otp || otp !== serverOtp)) {
      toast.error('Invalid OTP. Please check and try again.');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/institute/signup`, {
        ...form,
        plan_type: 'trial',
        passwordHash: form.center_code,
      });
      const data = res.data;
      if (data.message === 'exist') {
        toast.error('Center code already registered');
      } else if (data.message === 'duplicate_call_number') {
        toast.error('Mobile number already registered');
      } else if (data.message === 'success') {
        toast.success('Registration successful! Welcome to Instify.');
        storeUserData({ id: data.owner_id, name: form.center_head_name, role: 'admin', username: form.center_code });
        storeInstituteData({
          institute_uuid: data.institute_uuid,
          institute_name: form.institute_title,
          institute_id: data.institute_id,
          theme_color: data.theme_color || '#059669',
          storage_mode: data.storage_mode || form.storage_mode || 'cloud_only',
        });
        if (data.trialExpiresAt) localStorage.setItem('trialExpiresAt', data.trialExpiresAt);
        document.documentElement.style.setProperty('--theme-color', data.theme_color || '#059669');
        try {
          const groupRes = await axios.get(`${BASE_URL}/api/accountgroup/GetAccountgroupList`);
          const accountGroup = groupRes.data.result.find(g => g.Account_group === 'ACCOUNT');
          const accountBank = groupRes.data.result.find(g => g.Account_group === 'Bank');
          const accts = [
            accountGroup && { name: form.center_head_name, group: accountGroup.Account_group_uuid },
            accountGroup && { name: 'Fees Receivable', group: accountGroup.Account_group_uuid },
            accountBank && { name: 'Bank', group: accountBank.Account_group_uuid },
            accountBank && { name: 'Cash', group: accountBank.Account_group_uuid },
          ].filter(Boolean);
          for (const acct of accts) {
            await axios.post(`${BASE_URL}/api/account/addAccount`, {
              Account_name: acct.name,
              Mobile_number: form.institute_call_number,
              Account_group: acct.group,
              institute_uuid: data.institute_uuid,
            });
          }
        } catch (acctErr) {
          console.error('Account creation error:', acctErr);
        }
        if (window.updateAppContext) {
          window.updateAppContext({
            user: JSON.parse(localStorage.getItem('user')),
            institute: JSON.parse(localStorage.getItem('institute')),
          });
        }
        setTimeout(() => navigate('/dashboard'), 1000);
      } else {
        toast.error('Unexpected server response');
      }
    } catch (err) {
      console.error('Signup Error:', err);
      toast.error(err.response?.data?.message || 'Server error during registration');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoClick = () => { window.location.href = 'https://app.sanjusk.in'; };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: '"Inter", -apple-system, sans-serif' }}>
      <Toaster position="top-center" toastOptions={{ style: { borderRadius: 12, fontWeight: 600, fontSize: '0.875rem' } }} />

      {/* Left branding panel — desktop only */}
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
      }} className="md:flex">
        <div style={{ position: 'absolute', top: -80, right: -80, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', top: '40%', left: '10%', width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 380 }}>
          <button onClick={handleLogoClick} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'block', margin: '0 auto 28px' }}>
            <div style={{
              width: 88, height: 88, borderRadius: 24,
              background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              animation: 'floatY 4s ease-in-out infinite',
            }}>
              <img src={branding?.logo || '/pwa-512x512.png'} alt="Logo"
                onError={(e) => (e.target.src = '/pwa-512x512.png')}
                style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: 12 }} />
            </div>
          </button>

          <h1 style={{ color: '#ffffff', fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.15, margin: '0 0 12px', animation: 'fadeUp 0.5s ease 0.1s both' }}>
            {branding?.institute || 'Instify'}
          </h1>

          {branding?.tagline && (
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1rem', margin: '0 0 36px', lineHeight: 1.6, animation: 'fadeUp 0.5s ease 0.15s both' }}>
              {branding.tagline}
            </p>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 40 }}>
            <FeaturePill emoji="👩‍🎓" label="Student Management" delay={0.2} />
            <FeaturePill emoji="💳" label="Fee & Finance" delay={0.25} />
            <FeaturePill emoji="💬" label="WhatsApp Bot" delay={0.3} />
            <FeaturePill emoji="📊" label="Live Reports" delay={0.35} />
            <FeaturePill emoji="🪪" label="ID Cards" delay={0.4} />
            <FeaturePill emoji="📋" label="Admissions" delay={0.45} />
          </div>

          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase', animation: 'fadeIn 0.5s ease 0.5s both' }}>
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

      {/* Right form panel */}
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
        overflowY: 'auto',
      }}>

        {/* Mobile logo */}
        <div style={{ textAlign: 'center', marginBottom: 28, display: 'none' }} className="md-hidden-block">
          <button onClick={handleLogoClick} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <img src={branding?.logo || '/pwa-512x512.png'} alt="Logo"
              onError={(e) => (e.target.src = '/pwa-512x512.png')}
              style={{ width: 72, height: 72, objectFit: 'contain', borderRadius: 16 }} />
          </button>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '10px 0 4px', letterSpacing: '-0.03em', color: themeColor }}>
            {branding?.institute || 'Instify'}
          </h2>
          {branding?.tagline && <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>{branding.tagline}</p>}
        </div>

        <div style={{ width: '100%', maxWidth: 360 }}>
          {/* Heading */}
          <div style={{ marginBottom: 28 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: `linear-gradient(135deg, ${darkTheme}, ${themeColor})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20, boxShadow: `0 8px 20px ${themeColor}35`,
            }}>
              <span style={{ fontSize: '1.4rem' }}>🏫</span>
            </div>
            <h2 style={{ fontSize: '1.65rem', fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.04em', color: '#0f172a' }}>
              {otpSent ? 'Verify OTP' : 'Register Institute'}
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0, lineHeight: 1.6 }}>
              {otpSent ? `OTP sent to +91 ${form.institute_call_number}` : 'Start your 14-day free trial'}
            </p>
          </div>

          {/* Hint */}
          {!otpSent && (
            <div style={{
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              borderRadius: 10, padding: '10px 14px', marginBottom: 24,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: '0.85rem' }}>💡</span>
              <span style={{ fontSize: '0.78rem', color: '#065f46', fontWeight: 500 }}>
                Free 14-day trial · No credit card required
              </span>
            </div>
          )}


          <form onSubmit={otpSent ? handleSignup : handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {!otpSent ? (
              <>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: '0.825rem', fontWeight: 600, color: '#374151', letterSpacing: '-0.01em' }}>
                    Institute Name
                  </label>
                  <input ref={inputRef} type="text" value={form.institute_title} onChange={handleChange('institute_title')}
                    placeholder="Enter institute name" required
                    onFocus={() => setFocusField('institute_title')} onBlur={() => setFocusField(null)}
                    style={inputStyle('institute_title')} />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: '0.825rem', fontWeight: 600, color: '#374151', letterSpacing: '-0.01em' }}>
                    Institute Type
                  </label>
                  <select value={form.institute_type} onChange={handleChange('institute_type')} required
                    onFocus={() => setFocusField('institute_type')} onBlur={() => setFocusField(null)}
                    style={{ ...inputStyle('institute_type'), appearance: 'none', cursor: 'pointer' }}>
                    <option value="">Select institute type</option>
                    {loadingTypes ? (
                      <option disabled>Loading...</option>
                    ) : (
                      orgTypes.map(t => <option key={t._id} value={t.category}>{t.category}</option>)
                    )}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: '0.825rem', fontWeight: 600, color: '#374151', letterSpacing: '-0.01em' }}>
                    Center Code
                  </label>
                  <input type="text" value={form.center_code} onChange={handleChange('center_code')}
                    placeholder="Your unique center code" required
                    onFocus={() => setFocusField('center_code')} onBlur={() => setFocusField(null)}
                    style={inputStyle('center_code')} />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: '0.825rem', fontWeight: 600, color: '#374151', letterSpacing: '-0.01em' }}>
                    Mobile Number
                  </label>
                  <input type="tel" value={form.institute_call_number} onChange={handleChange('institute_call_number')}
                    placeholder="10-digit mobile number" maxLength={10} pattern="[0-9]{10}" required
                    onFocus={() => setFocusField('institute_call_number')} onBlur={() => setFocusField(null)}
                    style={inputStyle('institute_call_number')} />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: '0.825rem', fontWeight: 600, color: '#374151', letterSpacing: '-0.01em' }}>
                    Center Head Name
                  </label>
                  <input type="text" value={form.center_head_name} onChange={handleChange('center_head_name')}
                    placeholder="Full name of center head" required
                    onFocus={() => setFocusField('center_head_name')} onBlur={() => setFocusField(null)}
                    style={inputStyle('center_head_name')} />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: '0.825rem', fontWeight: 600, color: '#374151', letterSpacing: '-0.01em' }}>
                    Data Storage Mode
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {STORAGE_MODES.map(mode => (
                      <button
                        key={mode.value}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, storage_mode: mode.value }))}
                        style={{
                          border: `2px solid ${form.storage_mode === mode.value ? themeColor : '#e2e8f0'}`,
                          borderRadius: 10,
                          padding: '10px 6px',
                          cursor: 'pointer',
                          textAlign: 'center',
                          background: form.storage_mode === mode.value ? `${themeColor}12` : '#f8fafc',
                          transition: 'all 0.18s ease',
                          fontFamily: 'inherit',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>{mode.icon}</span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: form.storage_mode === mode.value ? themeColor : '#374151', lineHeight: 1.2 }}>
                          {mode.label}
                        </span>
                        <span style={{ fontSize: '0.6rem', color: '#94a3b8', lineHeight: 1.3 }}>
                          {mode.desc}
                        </span>
                        {form.storage_mode === mode.value && (
                          <span style={{ fontSize: '0.58rem', fontWeight: 700, color: themeColor, background: `${themeColor}18`, borderRadius: 4, padding: '1px 5px' }}>
                            {mode.badge}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  {form.storage_mode === 'local_only' && (
                    <div style={{ marginTop: 8, background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '8px 12px' }}>
                      <span style={{ fontSize: '0.72rem', color: '#92400e', fontWeight: 500 }}>
                        {isDesktop
                          ? '⚠️ Data stays on this device only. No web or mobile access.'
                          : '⚠️ Local Only requires the Instify Desktop app. Web access will be unavailable.'}
                      </span>
                    </div>
                  )}
                  {form.storage_mode === 'hybrid' && (
                    <div style={{ marginTop: 8, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '8px 12px' }}>
                      <span style={{ fontSize: '0.72rem', color: '#1e40af', fontWeight: 500 }}>
                        {isDesktop
                          ? 'ℹ️ Data stored locally and synced to cloud. Access from any device.'
                          : 'ℹ️ Hybrid mode needs the Desktop app. Cloud syncs automatically every 60 seconds.'}
                      </span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: '0.825rem', fontWeight: 600, color: '#374151', letterSpacing: '-0.01em' }}>
                  Enter OTP
                </label>
                <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)}
                  placeholder="• • • • • •" maxLength={6} required autoFocus
                  onFocus={() => setFocusField('otp')} onBlur={() => setFocusField(null)}
                  style={{ ...inputStyle('otp'), textAlign: 'center', fontSize: '1.6rem', letterSpacing: 10, fontWeight: 700 }} />
                <button type="button"
                  onClick={() => { setOtpSent(false); setOtp(''); setServerOtp(''); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: themeColor, fontSize: '0.8rem', fontWeight: 600, padding: '8px 0', fontFamily: 'inherit' }}>
                  ← Change details
                </button>
              </div>
            )}

            {/* Submit button */}
            <button type="submit" disabled={loading}
              style={{
                width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                background: loading ? '#94a3b8' : `linear-gradient(135deg, ${darkTheme} 0%, ${themeColor} 100%)`,
                color: '#ffffff', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '-0.01em',
                fontFamily: 'inherit', boxShadow: loading ? 'none' : `0 6px 20px ${themeColor}40`,
                transition: 'all 0.2s ease', opacity: loading ? 0.8 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4,
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}>
              {loading ? (
                <>
                  <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                  {otpSent ? 'Creating account…' : isDesktop ? 'Creating account…' : 'Sending OTP…'}
                </>
              ) : (
                otpSent ? 'Verify & Create Account →' : isDesktop ? 'Register →' : 'Send OTP →'
              )}
            </button>
          </form>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              Already have an account?{' '}
              <button onClick={() => navigate('/login')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontWeight: 700, color: themeColor, fontFamily: 'inherit',
                  fontSize: '0.85rem', padding: 0,
                  textDecoration: 'underline', textDecorationColor: `${themeColor}50`,
                }}>
                Sign In
              </button>
            </span>
            <button onClick={() => navigate('/forgot-password')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '0.8rem', fontWeight: 600, color: '#64748b',
                fontFamily: 'inherit', padding: 0,
                textDecoration: 'underline', textDecorationColor: '#cbd5e1',
              }}>
              Forgot password?
            </button>
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

export default Signup;
