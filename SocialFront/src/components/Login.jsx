import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import BASE_URL from '../config';
import { getInstituteId } from '../utils/instituteUtils';
import { fetchBranding } from '../utils/brandingUtils';
import { fetchAndStoreMasters } from '../utils/masterUtils';
import { storeUserData, storeInstituteData } from '../utils/storageUtils';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [branding, setBranding] = useState(JSON.parse(localStorage.getItem('branding')) || null);
  const [loading, setLoading] = useState(false);
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

  // fetch branding on first load so login page shows correct logo/tagline
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
      toast.success(`Welcome, ${data.user_name}`);
      storeUserData({
        id: data.user_id,
        name: data.user_name,
        role: data.user_role,
        username: data.login_username,
      });
      localStorage.setItem("authToken", data.token);
      storeInstituteData({
        institute_uuid: data.institute_uuid,
        institute_name: data.institute_name,
        institute_id: data.institute_id,
        theme_color: data.theme_color,
      });
      if (data.trialExpiresAt) {
        localStorage.setItem('trialExpiresAt', data.trialExpiresAt);
      }
      document.documentElement.style.setProperty('--theme-color', data.theme_color || '#5b5b5b');
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
    // redirect in the same tab and keep login session (localStorage/sessionStorage stays intact)
    window.location.href = 'https://canvas-gray-five.vercel.app';
  };

  const themeColor = branding?.theme?.color || '#45818e';

  return (
    <div className="min-h-screen flex">
      <Toaster position="top-center" />

      {/* Left branding panel — desktop only */}
      <div
        className="hidden md:flex md:flex-1 flex-col items-center justify-center px-12 py-16"
        style={{ background: `linear-gradient(150deg, ${themeColor} 0%, ${themeColor}bb 100%)` }}
      >
        <div className="text-center max-w-sm">
          <button onClick={handleLogoClick} className="focus:outline-none mb-8 block mx-auto">
            <img
              src={branding?.logo || '/pwa-512x512.png'}
              alt="Logo"
              onError={(e) => (e.target.src = '/pwa-512x512.png')}
              className="w-28 h-28 object-contain mx-auto rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.18)', padding: '10px' }}
            />
          </button>
          <h1 className="text-white text-4xl font-extrabold mb-3 leading-tight">
            {branding?.institute || 'Instify'}
          </h1>
          {branding?.tagline && (
            <p className="text-white/80 text-xl mb-8">{branding.tagline}</p>
          )}
          <div className="grid grid-cols-3 gap-3 mt-6">
            {[['Students', '👩‍🎓'], ['Finance', '💳'], ['WhatsApp', '💬']].map(([label, emoji]) => (
              <div key={label} className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.12)' }}>
                <div className="text-2xl mb-1">{emoji}</div>
                <div className="text-white/90 text-xs font-semibold">{label}</div>
              </div>
            ))}
          </div>
          <p className="text-white/40 text-xs mt-10">Powered by Instify · Institute Management System</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full md:w-[460px] md:flex-shrink-0 flex flex-col items-center justify-center bg-white px-6 py-8 min-h-screen">

        {/* Mobile: logo + institute name */}
        <div className="md:hidden flex flex-col items-center mb-5">
          <button onClick={handleLogoClick} className="focus:outline-none">
            <img
              src={branding?.logo || '/pwa-512x512.png'}
              alt="Logo"
              onError={(e) => (e.target.src = '/pwa-512x512.png')}
              className="w-20 h-20 object-contain cursor-pointer"
            />
          </button>
          <h2 className="text-2xl font-bold text-center mt-1" style={{ color: themeColor }}>
            {branding?.institute || 'Login'}
          </h2>
          {branding?.tagline && (
            <p className="text-center text-sm text-gray-500 mt-1">{branding.tagline}</p>
          )}
        </div>

        {/* Desktop: heading above form */}
        <div className="hidden md:block text-center mb-7">
          <h2 className="text-2xl font-bold" style={{ color: themeColor }}>Welcome Back</h2>
          <p className="text-gray-500 text-sm mt-1">Sign in to {branding?.institute || 'your institute'}</p>
        </div>

        <div className="w-full max-w-sm">
          <div className="text-xs text-center mb-4 text-gray-400">
            (Login using your Center Code as both username and password)
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block mb-1 text-sm text-gray-700 font-medium">Center Code</label>
              <input
                ref={inputRef}
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setPassword(e.target.value);
                }}
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': themeColor }}
                placeholder="Enter Center Code"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm text-gray-700 font-medium">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-transparent pr-16"
                  placeholder="Enter Password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-sm text-gray-500 hover:text-gray-800"
                  tabIndex={-1}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 rounded-lg text-white font-semibold text-sm transition-opacity ${loading ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90'}`}
              style={{ backgroundColor: themeColor }}
            >
              {loading ? 'Logging in...' : 'Sign In'}
            </button>
          </form>
          <div className="text-center mt-5 text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <button
              onClick={() => navigate('/signup')}
              className="text-blue-600 hover:underline font-medium"
            >
              Register
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
