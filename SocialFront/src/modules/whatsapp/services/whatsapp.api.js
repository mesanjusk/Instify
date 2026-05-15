import axios from 'axios';
import BASE_URL from '../../../config';

const authHeaders = () => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const authConfig = () => ({ headers: authHeaders() });
const buildCenterParams = (centerId) => ({ centerId, institute_uuid: centerId });
const unwrap = (response) => response?.data ?? response;

export const getIntegrations = async (centerId) => {
  const response = await axios.get(`${BASE_URL}/api/whatsapp/integrations`, {
    ...authConfig(),
    params: buildCenterParams(centerId),
  });
  return unwrap(response.data);
};

export const connectManual = async ({ centerId, ...payload }) => {
  const response = await axios.post(
    `${BASE_URL}/api/whatsapp/manual/connect`,
    { ...payload, ...buildCenterParams(centerId) },
    authConfig(),
  );
  return unwrap(response.data);
};

export const connectEmbedded = async ({ code, centerId }) => {
  const response = await axios.post(
    `${BASE_URL}/api/whatsapp/embedded/exchange`,
    { code, ...buildCenterParams(centerId) },
    authConfig(),
  );
  return unwrap(response.data);
};

export const disconnectIntegration = async (centerId, integrationId) => {
  const response = await axios.post(
    `${BASE_URL}/api/whatsapp/disconnect`,
    { integrationId, ...buildCenterParams(centerId) },
    authConfig(),
  );
  return unwrap(response.data);
};

export const syncTemplates = async (centerId, integrationId) => {
  const response = await axios.post(
    `${BASE_URL}/api/whatsapp/templates/sync`,
    { integrationId, ...buildCenterParams(centerId) },
    authConfig(),
  );
  return unwrap(response.data);
};

export const getTemplates = async (centerId, integrationId) => {
  const response = await axios.get(`${BASE_URL}/api/whatsapp/templates`, {
    ...authConfig(),
    params: { ...buildCenterParams(centerId), integrationId },
  });
  return unwrap(response.data);
};

export const getConnectedNumbers = async (centerId) => {
  const response = await axios.get(`${BASE_URL}/api/whatsapp/numbers`, {
    ...authConfig(),
    params: buildCenterParams(centerId),
  });
  return unwrap(response.data);
};

export const sendWhatsAppMessage = async (payload) => {
  const response = await axios.post(`${BASE_URL}/api/whatsapp/messages/send`, payload, authConfig());
  return unwrap(response.data);
};

export const getMessages = async (centerId, integrationId = '', limit = 50) => {
  const response = await axios.get(`${BASE_URL}/api/whatsapp/messages`, {
    ...authConfig(),
    params: { ...buildCenterParams(centerId), integrationId, limit },
  });
  return unwrap(response.data);
};

export const getAnalytics = async (centerId, integrationId = '') => {
  const response = await axios.get(`${BASE_URL}/api/whatsapp/analytics`, {
    ...authConfig(),
    params: { ...buildCenterParams(centerId), integrationId },
  });
  return unwrap(response.data);
};

export const getAutoReplies = async (centerId) => {
  const response = await axios.get(`${BASE_URL}/api/whatsapp/auto-reply`, {
    ...authConfig(),
    params: buildCenterParams(centerId),
  });
  return unwrap(response.data);
};

export const createAutoReply = async (payload) => {
  const response = await axios.post(`${BASE_URL}/api/whatsapp/auto-reply`, payload, authConfig());
  return unwrap(response.data);
};

export const updateAutoReply = async (id, payload) => {
  const response = await axios.put(`${BASE_URL}/api/whatsapp/auto-reply/${id}`, payload, authConfig());
  return unwrap(response.data);
};

export const deleteAutoReply = async (id) => {
  const response = await axios.delete(`${BASE_URL}/api/whatsapp/auto-reply/${id}`, authConfig());
  return unwrap(response.data);
};

export const toggleAutoReply = async (id) => {
  const response = await axios.patch(`${BASE_URL}/api/whatsapp/auto-reply/${id}/toggle`, {}, authConfig());
  return unwrap(response.data);
};
