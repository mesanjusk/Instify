import axios from 'axios';
import BASE_URL from './config';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request: inject auth token + institute_uuid ────────────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const institute_uuid = localStorage.getItem('institute_uuid');
  if (institute_uuid) {
    if (!config.method || config.method.toLowerCase() === 'get') {
      config.params = { institute_uuid, ...config.params };
    }
    config.headers['X-Institute-UUID'] = institute_uuid;
  }

  return config;
});

// ── Response: trigger Electron sync after successful writes ──────────────────
apiClient.interceptors.response.use((res) => {
  const method = res.config?.method?.toLowerCase();
  if (['post', 'put', 'patch', 'delete'].includes(method) && window.electronAPI) {
    window.electronAPI.syncNow().catch(() => {});
  }
  return res;
});

// ── Response: auto-refresh JWT on 401 ────────────────────────────────────────
let _refreshing = false;
let _waitQueue = [];

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // Only attempt refresh on 401 and only once per request
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    // Skip refresh for the refresh endpoint itself to avoid infinite loops
    if (original.url?.includes('/auth/refresh') || original.url?.includes('/auth/user/login')) {
      return Promise.reject(error);
    }

    const storedRefresh = localStorage.getItem('refreshToken');
    if (!storedRefresh) {
      // No refresh token — force logout
      localStorage.clear();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (_refreshing) {
      // Queue the request until the refresh completes
      return new Promise((resolve, reject) => {
        _waitQueue.push({ resolve, reject });
      }).then((newToken) => {
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      });
    }

    original._retry = true;
    _refreshing = true;

    try {
      const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, {
        refreshToken: storedRefresh,
      });

      localStorage.setItem('authToken', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      apiClient.defaults.headers.common.Authorization = `Bearer ${data.token}`;

      _waitQueue.forEach((p) => p.resolve(data.token));
      _waitQueue = [];

      original.headers.Authorization = `Bearer ${data.token}`;
      return apiClient(original);
    } catch (refreshErr) {
      _waitQueue.forEach((p) => p.reject(refreshErr));
      _waitQueue = [];

      // Network error (offline) — don't log out; let the app continue in offline mode
      const isNetworkError = !refreshErr.response;
      if (isNetworkError) {
        console.warn('[apiClient] Token refresh failed (network offline) — staying in offline mode');
        return Promise.reject(refreshErr);
      }

      // Server explicitly rejected the refresh token — session is invalid, force logout
      localStorage.clear();
      window.location.href = '/login';
      return Promise.reject(refreshErr);
    } finally {
      _refreshing = false;
    }
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
