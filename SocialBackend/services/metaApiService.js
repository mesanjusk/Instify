const axios = require('axios');

const GRAPH_BASE_URL = 'https://graph.facebook.com/v19.0/';

const metaApiClient = axios.create({
  baseURL: GRAPH_BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

function getAuthHeader() {
  if (!process.env.WHATSAPP_TOKEN) {
    throw new Error('WHATSAPP_TOKEN is not configured');
  }

  return {
    Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
  };
}

async function post(path, data) {
  const response = await metaApiClient.post(path, data, {
    headers: {
      ...getAuthHeader(),
    },
  });

  return response.data;
}

module.exports = {
  metaApiClient,
  GRAPH_BASE_URL,
  post,
};
