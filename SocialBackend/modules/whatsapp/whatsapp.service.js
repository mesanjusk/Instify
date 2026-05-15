const axios = require('axios');
const cloudinary = require('cloudinary').v2;
const { WhatsAppIntegration, WhatsAppMessageLog, WhatsAppAutoReplyRule } = require('./whatsapp.model');
const { decryptToken } = require('./token.util');

const GRAPH_BASE_URL = `https://graph.facebook.com/${process.env.META_API_VERSION || 'v18.0'}`;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const normalizePhone = (value) => String(value || '').replace(/\D/g, '');

async function getConnectedIntegration(centerId, integrationId) {
  const query = { centerId, status: 'connected' };
  if (integrationId) query._id = integrationId;

  const integration = await WhatsAppIntegration.findOne(query).sort({ updatedAt: -1 });
  if (!integration) throw new Error('No connected WhatsApp integration found for center');
  return integration;
}

async function verifyToken(accessToken) {
  const response = await axios.get(`${GRAPH_BASE_URL}/me`, {
    params: { access_token: accessToken },
    timeout: 20000,
  });
  return response.data;
}

async function sendGraphMessage(integration, payload) {
  const accessToken = decryptToken(integration.accessToken);
  const response = await axios.post(
    `${GRAPH_BASE_URL}/${integration.phoneNumberId}/messages`,
    { messaging_product: 'whatsapp', ...payload },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  );
  return response.data;
}

async function logMessage({ centerId, integrationId, to, from = '', direction = 'outgoing', messageType = 'text', status = 'sent', metaMessageId = '', message = '', mediaUrl = '', templateName = '', timestamp = new Date(), rawPayload = null }) {
  await WhatsAppMessageLog.create({
    centerId,
    integrationId,
    to,
    from,
    direction,
    messageType,
    status,
    metaMessageId,
    message,
    mediaUrl,
    templateName,
    timestamp,
    rawPayload,
  });
}

async function sendTextMessage(centerId, to, message, integrationId) {
  const integration = await getConnectedIntegration(centerId, integrationId);
  const normalizedTo = normalizePhone(to);
  const response = await sendGraphMessage(integration, {
    to: normalizedTo,
    type: 'text',
    text: { body: message },
  });

  await logMessage({
    centerId,
    integrationId: integration._id,
    to: normalizedTo,
    messageType: 'text',
    status: 'sent',
    metaMessageId: response.data?.messages?.[0]?.id || response.messages?.[0]?.id || '',
    message,
    rawPayload: response,
  });

  return response;
}

async function sendTemplateMessage(centerId, to, templateName, params = [], integrationId, language = 'en_US') {
  const integration = await getConnectedIntegration(centerId, integrationId);
  const normalizedTo = normalizePhone(to);
  const components = params.length
    ? [{ type: 'body', parameters: params.map((value) => ({ type: 'text', text: String(value) })) }]
    : [];

  const response = await sendGraphMessage(integration, {
    to: normalizedTo,
    type: 'template',
    template: {
      name: templateName,
      language: { code: language },
      ...(components.length ? { components } : {}),
    },
  });

  await logMessage({
    centerId,
    integrationId: integration._id,
    to: normalizedTo,
    messageType: 'template',
    status: 'sent',
    metaMessageId: response.data?.messages?.[0]?.id || response.messages?.[0]?.id || '',
    templateName,
    rawPayload: response,
  });

  return response;
}

async function sendMediaMessage(centerId, to, mediaUrl, integrationId, mediaType = 'image', caption = '') {
  const integration = await getConnectedIntegration(centerId, integrationId);
  const normalizedTo = normalizePhone(to);
  const type = ['image', 'document', 'video'].includes(mediaType) ? mediaType : 'image';

  const response = await sendGraphMessage(integration, {
    to: normalizedTo,
    type,
    [type]: {
      link: mediaUrl,
      ...(caption ? { caption } : {}),
    },
  });

  await logMessage({
    centerId,
    integrationId: integration._id,
    to: normalizedTo,
    messageType: type === 'image' ? 'media' : type,
    status: 'sent',
    metaMessageId: response.data?.messages?.[0]?.id || response.messages?.[0]?.id || '',
    message: caption,
    mediaUrl,
    rawPayload: response,
  });

  return response;
}

async function fetchTemplates(centerId, integrationId) {
  const integration = await getConnectedIntegration(centerId, integrationId);
  const accessToken = decryptToken(integration.accessToken);
  const rows = [];
  let nextUrl = `${GRAPH_BASE_URL}/${integration.wabaId}/message_templates`;
  let params = { fields: 'id,name,status,language,category,components', limit: 200 };

  while (nextUrl) {
    const response = await axios.get(nextUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params,
      timeout: 30000,
    });
    rows.push(...(response.data?.data || []));
    nextUrl = response.data?.paging?.next || null;
    params = {};
  }

  integration.lastSyncedAt = new Date();
  await integration.save();

  return { data: rows };
}

async function listMessageLogs(centerId, integrationId, limit = 100) {
  const query = { centerId };
  if (integrationId) query.integrationId = integrationId;
  return WhatsAppMessageLog.find(query).sort({ timestamp: -1 }).limit(limit).lean();
}

async function getAnalytics(centerId, integrationId) {
  const query = { centerId };
  if (integrationId) query.integrationId = integrationId;

  const [totals] = await WhatsAppMessageLog.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalMessages: { $sum: 1 },
        sent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
        delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
        read: { $sum: { $cond: [{ $eq: ['$status', 'read'] }, 1, 0] } },
        failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
        incoming: { $sum: { $cond: [{ $eq: ['$direction', 'incoming'] }, 1, 0] } },
        outgoing: { $sum: { $cond: [{ $eq: ['$direction', 'outgoing'] }, 1, 0] } },
      },
    },
  ]);

  return totals || { totalMessages: 0, sent: 0, delivered: 0, read: 0, failed: 0, incoming: 0, outgoing: 0 };
}

async function uploadMediaFromUrl(sourceUrl, folder = 'whatsapp_media') {
  const result = await cloudinary.uploader.upload(sourceUrl, {
    folder,
    resource_type: 'auto',
  });
  return result.secure_url;
}

async function getAutoReplyRules(centerId) {
  return WhatsAppAutoReplyRule.find({ centerId }).sort({ createdAt: -1 }).lean();
}

async function createAutoReplyRule(centerId, payload) {
  return WhatsAppAutoReplyRule.create({ centerId, ...payload });
}

async function updateAutoReplyRule(ruleId, payload) {
  return WhatsAppAutoReplyRule.findByIdAndUpdate(ruleId, payload, { new: true, runValidators: true });
}

async function deleteAutoReplyRule(ruleId) {
  return WhatsAppAutoReplyRule.findByIdAndDelete(ruleId);
}

async function toggleAutoReplyRule(ruleId) {
  const rule = await WhatsAppAutoReplyRule.findById(ruleId);
  if (!rule) return null;
  rule.active = !rule.active;
  await rule.save();
  return rule;
}

async function resolveAutoReply(centerId, incomingText) {
  const text = String(incomingText || '').trim().toLowerCase();
  if (!text) return null;
  const rules = await WhatsAppAutoReplyRule.find({ centerId, active: true }).sort({ createdAt: 1 }).lean();
  return (
    rules.find((rule) => {
      const keyword = String(rule.keyword || '').trim().toLowerCase();
      if (!keyword) return false;
      if (rule.matchType === 'exact') return text === keyword;
      if (rule.matchType === 'startsWith') return text.startsWith(keyword);
      return text.includes(keyword);
    }) || null
  );
}

module.exports = {
  verifyToken,
  sendTextMessage,
  sendTemplateMessage,
  sendMediaMessage,
  fetchTemplates,
  getConnectedIntegration,
  listMessageLogs,
  getAnalytics,
  uploadMediaFromUrl,
  getAutoReplyRules,
  createAutoReplyRule,
  updateAutoReplyRule,
  deleteAutoReplyRule,
  toggleAutoReplyRule,
  resolveAutoReply,
};
