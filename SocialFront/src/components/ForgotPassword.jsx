import React, { useState } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import BASE_URL from '../config';
import { useApp } from '../context/AppContext';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { institute } = useApp();
  const themeColor = institute?.theme_color || '#5b5b5b';

  const [centerCode, setCenterCode] = useState('');
  const [mobile, setMobile] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [userId, setUserId] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
            className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none disabled:bg-gray-50"
            style={{ boxShadow: `0 0 0 1.5px ${themeColor}` }}
          />

          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{10}"
            maxLength={10}
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="Registered WhatsApp Number"
            required
            disabled={otpSent}
            className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none disabled:bg-gray-50"
            style={{ boxShadow: `0 0 0 1.5px ${themeColor}` }}
          />

          {otpSent && (
            <>
              <p className="text-sm text-green-600 text-center">OTP sent to your WhatsApp. Please check your messages.</p>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
                maxLength={6}
                className="w-full px-3 py-2 border rounded-md shadow-sm"
                style={{ boxShadow: `0 0 0 1.5px ${themeColor}` }}
                required
              />
            </>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full text-white py-2 rounded-md transition hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: themeColor }}
          >
            {submitting ? 'Please wait...' : otpSent ? 'Verify OTP' : 'Send OTP via WhatsApp'}
          </button>
        </form>

        <div className="text-center mt-4 text-sm text-gray-600">
          Remembered your password?
          <button
            onClick={() => navigate('/')}
            className="ml-1 hover:underline font-medium" style={{ color: '#1a7a4a' }}
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
