import { clearUserAndInstituteData } from './storageUtils';
import { purgeAllData } from '../db/dbService';
import { updateAppContext } from '../context/appContextBridge';
import apiClient from '../apiClient';
import toast from 'react-hot-toast';

const logoutUser = async () => {
  // Clear httpOnly cookie server-side
  try { await apiClient.post('/api/auth/logout'); } catch (_) {}

  // Clear all local session data
  clearUserAndInstituteData();
  purgeAllData().catch(() => {});

  ['remember_me', 'last_password_change'].forEach(k => {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  });

  // Reset React context via module bridge (no window global needed)
  updateAppContext({ user: null, institute: null });

  toast.success('Logged out successfully');
  setTimeout(() => { window.location.href = '/'; }, 500);
};

export default logoutUser;
