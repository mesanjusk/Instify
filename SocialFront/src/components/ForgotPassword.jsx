import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import BASE_URL from '../config';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const themeColor = '#059669';
  const darkTheme = '#064e3b';

  const [centerCode, setCenterCode] = useState('');
  const [mobile, setMobile] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [focusField, setFocusField] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
    if (!/^[0-9]{10}$/.test(mobile)) {
      toast.error('Enter a valid 10-digit mobile number');
      return;
    }
    if (!centerCode) {
      toast.error('Center Code is required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/auth/institute/forgot-password`, {
        center_code: centerCode,
        mobile,
      });
      if (res.data.message === 'otp_sent') {
        setUserId(res.data.user_id);
        setOtpSent(true);
        toast.success('OTP sent to your WhatsApp number');
      } else {
        toast.error(res.data.message || 'User not found');
      }
    } catch (err) {
      console.error('OTP Send Error:', err);
      toast.error(err.response?.data?.message || 'Error sending OTP. Check your center code and mobile.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) {
      toast.error('Please enter the OTP');
      return;
    }
    setSubmitting(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/auth/institute/verify-forgot-otp`, {
        mobile,
        otp,
      });
      if (res.data.success) {
        toast.success('OTP verified. Redirecting...');
        navigate(`/reset-password/${userId}`);
      } else {
        toast.error(res.data.message || 'Invalid OTP');
      }
    } catch (err) {
      console.error('OTP Verify Error:', err);
      toast.error(err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', fontFamily: '"Inter", -apple-system, sans-serif', padding: '16px' }}>
      <Toaster position="top-center" toastOptions={{ style: { borderRadius: 12, fontWeight: 600, fontSize: '0.875rem' } }} />

      <div style={{ width: '100%', maxWidth: 400, backgroundColor: '#ffffff', borderRadius: 20, padding: '28px 24px', boxShadow: '0 4px 40px rgba(15,23,42,0.1)' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <img src="/pwa-512x512.png" alt="Instify" style={{ width: 52, height: 52, objectFit: 'contain', borderRadius: 14 }} />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '8px 0 2px', letterSpacing: '-0.03em', color: themeColor }}>Instify</h2>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0 }}>Institutions Simplified</p>
        </div>

        {/* Heading */}
        <div style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.04em', color: '#0f172a' }}>
            {otpSent ? 'Verify OTP' : 'Reset Password'}
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
            {otpSent ? `OTP sent to +91 ${mobile}` : 'Enter your center code and registered mobile'}
          </p>
        </div>

        <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: '0.825rem', fontWeight: 600, color: '#374151', letterSpacing: '-0.01em' }}>
              Center Code
            </label>
            <input
              ref={inputRef}
              type="text"
              value={centerCode}
              onChange={(e) => setCenterCode(e.target.value)}
              placeholder="Enter your center code"
              required
              disabled={otpSent}
              onFocus={() => setFocusField('centerCode')}
              onBlur={() => setFocusField(null)}
              style={{ ...inputStyle('centerCode'), opacity: otpSent ? 0.6 : 1 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: '0.825rem', fontWeight: 600, color: '#374151', letterSpacing: '-0.01em' }}>
              Registered WhatsApp Number
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength={10}
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="10-digit mobile number"
              required
              disabled={otpSent}
              onFocus={() => setFocusField('mobile')}
              onBlur={() => setFocusField(null)}
              style={{ ...inputStyle('mobile'), opacity: otpSent ? 0.6 : 1 }}
            />
          </div>

          {otpSent && (
            <>
              <p style={{ fontSize: '0.82rem', color: '#059669', textAlign: 'center', margin: 0, fontWeight: 500 }}>
                OTP sent to your WhatsApp. Please check your messages.
              </p>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: '0.825rem', fontWeight: 600, color: '#374151', letterSpacing: '-0.01em' }}>
                  Enter OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="• • • • • •"
                  maxLength={6}
                  required
                  autoFocus
                  onFocus={() => setFocusField('otp')}
                  onBlur={() => setFocusField(null)}
                  style={{ ...inputStyle('otp'), textAlign: 'center', fontSize: '1.5rem', letterSpacing: 8, fontWeight: 700 }}
                />
              </div>
              <button type="button"
                onClick={() => { setOtpSent(false); setOtp(''); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: themeColor, fontSize: '0.8rem', fontWeight: 600, padding: '4px 0', fontFamily: 'inherit', textAlign: 'left' }}>
                ← Change details
              </button>
            </>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%', padding: '14px', borderRadius: 12, border: 'none',
              cursor: submitting ? 'not-allowed' : 'pointer',
              background: submitting ? '#94a3b8' : `linear-gradient(135deg, ${darkTheme} 0%, ${themeColor} 100%)`,
              color: '#ffffff', fontSize: '0.9rem', fontWeight: 700,
              letterSpacing: '-0.01em', fontFamily: 'inherit',
              boxShadow: submitting ? 'none' : `0 6px 20px ${themeColor}40`,
              transition: 'all 0.2s ease', opacity: submitting ? 0.8 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              marginTop: 4,
            }}
          >
            {submitting ? (
              <>
                <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                Please wait…
              </>
            ) : (
              otpSent ? 'Verify OTP →' : 'Send OTP via WhatsApp →'
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Remembered your password?{' '}
            <button onClick={() => navigate('/login')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, color: themeColor, fontFamily: 'inherit', fontSize: '0.85rem', padding: 0, textDecoration: 'underline', textDecorationColor: `${themeColor}50` }}>
              Sign In
            </button>
          </span>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ForgotPassword;
