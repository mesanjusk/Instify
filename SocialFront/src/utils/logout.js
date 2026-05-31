// src/utils/logoutUser.js

import { clearUserAndInstituteData } from './storageUtils';
import { purgeAllData } from '../db/dbService';
import toast from 'react-hot-toast';

/**
 * Logs out the user safely by clearing all user/institute data,
 * resetting AppContext if available, and redirecting to login.
 */
const logoutUser = () => {
  clearUserAndInstituteData();
  purgeAllData().catch(console.error);

  localStorage.removeItem('remember_me');
  localStorage.removeItem('last_password_change');
  sessionStorage.removeItem('remember_me');
  sessionStorage.removeItem('last_password_change');

  // Clear React state — avoids the flicker caused by AppContext still
  // holding the old user after localStorage is cleared
  if (window.logoutHandler) window.logoutHandler();

  toast.success('Logged out successfully');

  // Use the router's navigate if available (set in main.jsx), else hard redirect
  if (window._navigateTo) {
    window._navigateTo('/');
  } else if (import.meta.env.VITE_IS_DESKTOP === 'true') {
    window.location.hash = '#/';
  } else {
    window.location.replace('/');
  }
};

export default logoutUser;
