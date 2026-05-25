import axios from 'axios';
import BASE_URL from './config';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on expired/invalid token
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear session data and redirect to login
      ['authToken', 'token', 'user', 'institute', 'institute_uuid'].forEach(k => localStorage.removeItem(k));
      if (window.updateAppContext) window.updateAppContext({ user: null, institute: null });
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
