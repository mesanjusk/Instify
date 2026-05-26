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

  const institute_uuid = localStorage.getItem('institute_uuid');
  if (institute_uuid) {
    // Inject into GET query params automatically
    if (!config.method || config.method.toLowerCase() === 'get') {
      config.params = { institute_uuid, ...config.params };
    }
    // Also set as header so backend middleware can trust it via JWT
    config.headers['X-Institute-UUID'] = institute_uuid;
  }

  return config;
});

export const whatsappApi = {
  sendText: (payload) => apiClient.post('/api/whatsapp/send-text', payload),
  sendImage: (payload) => apiClient.post('/api/whatsapp/send-image', payload, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getMessages: (params) => apiClient.get('/api/whatsapp/messages', { params }),
};

export default apiClient;
