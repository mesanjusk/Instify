const axios = require('axios');

const GRAPH_BASE_URL = `https://graph.facebook.com/${process.env.META_API_VERSION || process.env.WHATSAPP_API_VERSION || 'v18.0'}/`;

const metaApiClient = axios.create({
  baseURL: GRAPH_BASE_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

function getAuthHeader() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN;
  if (!token) throw new Error('WHATSAPP_ACCESS_TOKEN is not configured');
  return { Authorization: `Bearer ${token}` };
}

async function post(path, data) {
  const response = await metaApiClient.post(path, data, {
    headers: { ...getAuthHeader() },
  });
  return response.data;
}

module.exports = { metaApiClient, GRAPH_BASE_URL, post };
