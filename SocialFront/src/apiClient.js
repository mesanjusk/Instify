import axios from 'axios';
import BASE_URL from './config';

const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send httpOnly auth_session cookie on every request
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT from localStorage as a fallback Authorization header.
// Once all clients use the httpOnly cookie, this can be removed.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout when the server returns 401 (expired / revoked token)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Import lazily to avoid a circular-dependency at module init time
      const { updateAppContext } = await import('./context/appContextBridge.js');
      const { clearUserAndInstituteData } = await import('./utils/storageUtils.js');
      clearUserAndInstituteData();
      updateAppContext({ user: null, institute: null });
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const whatsappApi = {
  sendText: (payload) => apiClient.post('/api/whatsapp/send-text', payload),
  sendImage: (payload) => apiClient.post('/api/whatsapp/send-image', payload, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getMessages: (params) => apiClient.get('/api/whatsapp/messages', { params }),
};

export default apiClient;
