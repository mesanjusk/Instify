import React, { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import apiClient from '../apiClient';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { institute } = useApp();
  const themeColor = institute?.theme_color || '#5b5b5b';

  const [centerCode, setCenterCode] = useState('');
  const [mobile, setMobile] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();

    if (!/^[0-9]{10}$/.test(mobile)) {
      toast.error('Enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      // OTP is generated and sent server-side; never exposed to the client
      const { data } = await apiClient.post('/api/auth/institute/forgot-password', {
        center_code: centerCode,
        mobile,
      });

      if (data.message === 'otp_sent') {
        setOtpSent(true);
        toast.success('OTP sent to your registered mobile number');
      } else {
        toast.error('Could not send OTP. Check your center code and mobile.');
      }
    } catch (err) {
      const msg = err.response?.data?.message;
      toast.error(msg === 'No matching user found' ? 'Center code or mobile not found.' : 'Error sending OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim()) { toast.error('Enter the OTP'); return; }

    setLoading(true);
    try {
      const { data } = await apiClient.post('/api/auth/otp/verify', { mobile, otp });
      if (data.success) {
        toast.success('OTP verified. Redirecting...');
        // Pass the server-issued resetToken via router state — never expose raw userId in URL
        navigate('/reset-password', { state: { resetToken: data.resetToken } });
      } else {
        toast.error(data.message || 'Invalid OTP');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: themeColor }}>
      <Toaster position="top-center" />
      <div className="bg-white w-full max-w-md rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-center mb-6" style={{ color: themeColor }}>
          Forgot Password
        </h2>

        <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-4">
          <input
            type="text"
            value={centerCode}
            onChange={(e) => setCenterCode(e.target.value)}
            placeholder="Center Code"
            required
            disabled={otpSent}
            className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none"
            style={{ boxShadow: `0 0 0 1.5px ${themeColor}` }}
          />

          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{10}"
            maxLength={10}
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="Registered Mobile Number"
            required
            disabled={otpSent}
            className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none"
            style={{ boxShadow: `0 0 0 1.5px ${themeColor}` }}
          />

          {otpSent && (
            <input
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
              maxLength={6}
              autoFocus
              className="w-full px-3 py-2 border rounded-md shadow-sm"
              style={{ boxShadow: `0 0 0 1.5px ${themeColor}` }}
              required
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white py-2 rounded-md transition hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: themeColor }}
          >
            {loading ? 'Please wait...' : otpSent ? 'Verify OTP' : 'Send OTP'}
          </button>

          {otpSent && (
            <button
              type="button"
              onClick={() => { setOtpSent(false); setOtp(''); setUserId(''); }}
              className="w-full text-sm underline text-gray-500 mt-1"
            >
              Change number / resend OTP
            </button>
          )}
        </form>

        <div className="text-center mt-4 text-sm text-gray-600">
          Remembered your password?
          <button onClick={() => navigate('/')} className="ml-1 text-blue-600 hover:underline font-medium">
            Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
