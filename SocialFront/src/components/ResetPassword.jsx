import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { getThemeColor } from '../utils/storageUtils';
import apiClient from '../apiClient';

/**
 * Handles two flows:
 *  1. Forgot-password (OTP-verified): location.state.resetToken is present.
 *     Only new + confirm password are required — identity was already proved by OTP.
 *  2. Change-password (logged in): no resetToken — user must supply old password.
 */
const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const themeColor = getThemeColor();

  const resetToken = location.state?.resetToken || null;
  const isForgotFlow = Boolean(resetToken);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      if (isForgotFlow) {
        // OTP-verified path — no old password needed
        const { data } = await apiClient.post('/api/auth/forgot-reset-password', {
          resetToken,
          new_password: newPassword,
        });
        if (data.message === 'reset_success') {
          toast.success('Password reset successful. Please login.');
          navigate('/');
        } else {
          toast.error(data.message || 'Reset failed');
        }
      } else {
        // Change-password path — must supply old password
        const userId = location.state?.userId;
        if (!userId) { navigate('/'); return; }
        const { data } = await apiClient.post(`/api/auth/institute/reset-password/${userId}`, {
          old_password: oldPassword,
          new_password: newPassword,
        });
        if (data.message === 'reset_success') {
          toast.success('Password changed successfully. Please login.');
          navigate('/');
        } else {
          toast.error(data.message || 'Reset failed');
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: themeColor }}>
      <Toaster position="top-center" />
      <div className="bg-white w-full max-w-md rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-center text-theme mb-6">
          {isForgotFlow ? 'Set New Password' : 'Change Password'}
        </h2>
        <form onSubmit={handleReset} className="space-y-4">
          {!isForgotFlow && (
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Current Password"
              required
              className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none"
              style={{ boxShadow: `0 0 0 1.5px ${themeColor}` }}
            />
          )}
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New Password (min. 6 characters)"
            required
            minLength={6}
            className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none"
            style={{ boxShadow: `0 0 0 1.5px ${themeColor}` }}
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm New Password"
            required
            className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none"
            style={{ boxShadow: `0 0 0 1.5px ${themeColor}` }}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-theme text-white py-2 rounded-md transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? 'Saving...' : isForgotFlow ? 'Set New Password' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
