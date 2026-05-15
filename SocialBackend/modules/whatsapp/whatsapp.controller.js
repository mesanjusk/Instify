const axios = require('axios');
const mongoose = require('mongoose');
const Institute = require('../../models/institute');
const { WhatsAppIntegration, WhatsAppMessageLog, WhatsAppAutoReplyRule } = require('./whatsapp.model');
const whatsappService = require('./whatsapp.service');
const { encryptToken } = require('./token.util');

const GRAPH_BASE_URL = `https://graph.facebook.com/${process.env.META_API_VERSION || 'v18.0'}`;

class HttpError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

function handleControllerError(res, error) {
  const status = error.statusCode || error.response?.status || 500;
  const message = error.response?.data?.error?.message || error.message || 'Unexpected error';
  return res.status(status).json({ success: false, message });
}

async function resolveCenter(centerLike) {
  if (!centerLike) {
    throw new HttpError('centerId is required', 400);
  }

  if (mongoose.Types.ObjectId.isValid(centerLike)) {
    const byId = await Institute.findById(centerLike).lean();
    if (byId) return byId;
  }

  const byUuid = await Institute.findOne({ institute_uuid: centerLike }).lean();
  if (byUuid) return byUuid;

  throw new HttpError('Center not found', 404);
}

async function ensureCenterAccess(centerLike, user) {
  const institute = await resolveCenter(centerLike);
  if (user?.role !== 'superadmin' && user?.institute_uuid !== institute.institute_uuid) {
    throw new HttpError('Forbidden center access', 403);
  }
  return institute;
}

function sanitizeIntegration(doc) {
  if (!doc) return null;
  const raw = doc.toObject ? doc.toObject() : doc;
  const { accessToken, ...rest } = raw;
  return {
    ...rest,
    id: String(rest._id),
    integrationId: String(rest._id),
    connected: rest.status === 'connected',
    phoneNumber: rest.displayName || rest.phoneNumberId || '',
    phone_number: rest.phoneNumberId || '',
  };
}

function ensureMetaEnvForEmbedded() {
  if (!process.env.META_APP_ID || !process.env.META_APP_SECRET) {
    throw new HttpError('META_APP_ID and META_APP_SECRET are required', 500);
  }
}

async function getIntegrations(req, res) {
  try {
    const centerLike = req.params.centerId || req.query.centerId || req.query.institute_uuid;
    const institute = await ensureCenterAccess(centerLike, req.user);
    const integrations = await WhatsAppIntegration.find({ centerId: institute._id }).sort({ updatedAt: -1 });
    return res.status(200).json({ success: true, data: integrations.map(sanitizeIntegration) });
  } catch (error) {
    return handleControllerError(res, error);
  }
}

async function manualConnect(req, res) {
  try {
    const { centerId, institute_uuid, accessToken, phoneNumberId, wabaId, businessId, displayName } = req.body;
    if (!accessToken || !phoneNumberId || !wabaId) {
      return res.status(400).json({ success: false, message: 'centerId, accessToken, phoneNumberId and wabaId are required' });
    }

    const institute = await ensureCenterAccess(centerId || institute_uuid, req.user);
    await whatsappService.verifyToken(accessToken);

    let metaDisplayName = displayName || '';
    try {
      const phoneRes = await axios.get(`${GRAPH_BASE_URL}/${phoneNumberId}`, {
        params: { access_token: accessToken, fields: 'id,display_phone_number,verified_name' },
      });
      metaDisplayName = metaDisplayName || phoneRes.data?.verified_name || phoneRes.data?.display_phone_number || '';
    } catch (_error) {}

    const integration = await WhatsAppIntegration.findOneAndUpdate(
      { centerId: institute._id, phoneNumberId },
      {
        centerId: institute._id,
        connectionType: 'MANUAL',
        accessToken: encryptToken(accessToken),
        phoneNumberId,
        wabaId,
        displayName: metaDisplayName,
        businessId: businessId || '',
        status: 'connected',
        webhookSubscribed: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ success: true, message: 'WhatsApp connected successfully', data: sanitizeIntegration(integration) });
  } catch (error) {
    return handleControllerError(res, error);
  }
}

async function embeddedExchange(req, res) {
  try {
    const { centerId, institute_uuid, code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'centerId and code are required' });
    ensureMetaEnvForEmbedded();
    const institute = await ensureCenterAccess(centerId || institute_uuid, req.user);

    const tokenRes = await axios.get(`${GRAPH_BASE_URL}/oauth/access_token`, {
      params: {
        client_id: process.env.META_APP_ID,
        client_secret: process.env.META_APP_SECRET,
        code,
      },
    });

    const shortToken = tokenRes.data.access_token;
    const longLivedRes = await axios.get(`${GRAPH_BASE_URL}/oauth/access_token`, {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: process.env.META_APP_ID,
        client_secret: process.env.META_APP_SECRET,
        fb_exchange_token: shortToken,
      },
    });

    const accessToken = longLivedRes.data.access_token;
    const businessesRes = await axios.get(`${GRAPH_BASE_URL}/me/businesses`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const business = businessesRes.data?.data?.[0] || {};
    const ownedWabaRes = await axios.get(`${GRAPH_BASE_URL}/${business.id}/owned_whatsapp_business_accounts`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const waba = ownedWabaRes.data?.data?.[0] || {};
    const phoneRes = await axios.get(`${GRAPH_BASE_URL}/${waba.id}/phone_numbers`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const phone = phoneRes.data?.data?.[0] || {};

    if (!business.id || !waba.id || !phone.id) {
      return res.status(400).json({ success: false, message: 'Unable to fetch business/WABA/phone metadata from Meta' });
    }

    const integration = await WhatsAppIntegration.findOneAndUpdate(
      { centerId: institute._id, phoneNumberId: phone.id },
      {
        centerId: institute._id,
        connectionType: 'EMBEDDED',
        accessToken: encryptToken(accessToken),
        phoneNumberId: phone.id,
        wabaId: waba.id,
        businessId: business.id,
        displayName: phone.verified_name || phone.display_phone_number || '',
        status: 'connected',
        webhookSubscribed: true,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ success: true, message: 'Embedded signup connected', data: sanitizeIntegration(integration) });
  } catch (error) {
    return handleControllerError(res, error);
  }
}

async function disconnectIntegration(req, res) {
  try {
    const integrationId = req.params.id || req.body.integrationId;
    if (!mongoose.Types.ObjectId.isValid(integrationId)) {
      return res.status(400).json({ success: false, message: 'Invalid integration id' });
    }

    const integration = await WhatsAppIntegration.findById(integrationId);
    if (!integration) return res.status(404).json({ success: false, message: 'Integration not found' });

    await ensureCenterAccess(String(integration.centerId), req.user);
    integration.status = 'disconnected';
    integration.webhookSubscribed = false;
    await integration.save();

    return res.status(200).json({ success: true, message: 'Integration disconnected' });
  } catch (error) {
    return handleControllerError(res, error);
  }
}

async function sendMessage(req, res) {
  try {
    const { centerId, institute_uuid, to, message, integrationId, type, templateName, params, mediaUrl, mediaType, caption, templateLanguage } = req.body;
    if (!to) return res.status(400).json({ success: false, message: 'Recipient number is required' });
    const institute = await ensureCenterAccess(centerId || institute_uuid, req.user);
    let data;

    if (type === 'template') {
      if (!templateName) return res.status(400).json({ success: false, message: 'templateName is required' });
      data = await whatsappService.sendTemplateMessage(institute._id, to, templateName, params || [], integrationId, templateLanguage || 'en_US');
    } else if (type === 'media' || type === 'image' || type === 'document' || type === 'video') {
      if (!mediaUrl) return res.status(400).json({ success: false, message: 'mediaUrl is required' });
      data = await whatsappService.sendMediaMessage(institute._id, to, mediaUrl, integrationId, mediaType || type || 'image', caption || '');
    } else {
      if (!message) return res.status(400).json({ success: false, message: 'message is required' });
      data = await whatsappService.sendTextMessage(institute._id, to, message, integrationId);
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return handleControllerError(res, error);
  }
}

async function sendText(req, res) {
  req.body.type = 'text';
  return sendMessage(req, res);
}
async function sendTemplate(req, res) {
  req.body.type = 'template';
  return sendMessage(req, res);
}
async function sendMedia(req, res) {
  req.body.type = req.body.mediaType || 'media';
  return sendMessage(req, res);
}

async function getTemplates(req, res) {
  try {
    const integrationId = req.params.integrationId || req.query.integrationId;
    if (!mongoose.Types.ObjectId.isValid(integrationId)) return res.status(400).json({ success: false, message: 'Invalid integration id' });
    const integration = await WhatsAppIntegration.findById(integrationId);
    if (!integration) return res.status(404).json({ success: false, message: 'Integration not found' });
    await ensureCenterAccess(String(integration.centerId), req.user);
    const data = await whatsappService.fetchTemplates(integration.centerId, integrationId);
    return res.status(200).json({ success: true, data: data.data || [] });
  } catch (error) {
    return handleControllerError(res, error);
  }
}

async function syncTemplates(req, res) {
  return getTemplates(req, res);
}

async function getConnectedNumbers(req, res) {
  try {
    const centerLike = req.params.centerId || req.query.centerId || req.query.institute_uuid;
    const institute = await ensureCenterAccess(centerLike, req.user);
    const integrations = await WhatsAppIntegration.find({ centerId: institute._id, status: 'connected' }).sort({ updatedAt: -1 }).lean();
    return res.status(200).json({ success: true, data: integrations.map(sanitizeIntegration) });
  } catch (error) {
    return handleControllerError(res, error);
  }
}

async function getMessages(req, res) {
  try {
    const centerLike = req.query.centerId || req.query.institute_uuid;
    const institute = await ensureCenterAccess(centerLike, req.user);
    const rows = await whatsappService.listMessageLogs(institute._id, req.query.integrationId, Number(req.query.limit) || 100);
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return handleControllerError(res, error);
  }
}

async function getAnalytics(req, res) {
  try {
    const centerLike = req.query.centerId || req.query.institute_uuid;
    const institute = await ensureCenterAccess(centerLike, req.user);
    const analytics = await whatsappService.getAnalytics(institute._id, req.query.integrationId);
    return res.status(200).json({ success: true, data: analytics });
  } catch (error) {
    return handleControllerError(res, error);
  }
}

async function getAutoReplyRules(req, res) {
  try {
    const centerLike = req.query.centerId || req.query.institute_uuid;
    const institute = await ensureCenterAccess(centerLike, req.user);
    const rows = await whatsappService.getAutoReplyRules(institute._id);
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return handleControllerError(res, error);
  }
}

async function createAutoReplyRule(req, res) {
  try {
    const centerLike = req.body.centerId || req.body.institute_uuid;
    const institute = await ensureCenterAccess(centerLike, req.user);
    const rule = await whatsappService.createAutoReplyRule(institute._id, req.body);
    return res.status(201).json({ success: true, data: rule });
  } catch (error) {
    return handleControllerError(res, error);
  }
}

async function updateAutoReplyRule(req, res) {
  try {
    const existing = await WhatsAppAutoReplyRule.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Auto reply rule not found' });
    await ensureCenterAccess(String(existing.centerId), req.user);
    const rule = await whatsappService.updateAutoReplyRule(req.params.id, req.body);
    return res.status(200).json({ success: true, data: rule });
  } catch (error) {
    return handleControllerError(res, error);
  }
}

async function deleteAutoReplyRule(req, res) {
  try {
    const existing = await WhatsAppAutoReplyRule.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Auto reply rule not found' });
    await ensureCenterAccess(String(existing.centerId), req.user);
    await whatsappService.deleteAutoReplyRule(req.params.id);
    return res.status(200).json({ success: true, message: 'Auto reply rule deleted' });
  } catch (error) {
    return handleControllerError(res, error);
  }
}

async function toggleAutoReplyRule(req, res) {
  try {
    const existing = await WhatsAppAutoReplyRule.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Auto reply rule not found' });
    await ensureCenterAccess(String(existing.centerId), req.user);
    const rule = await whatsappService.toggleAutoReplyRule(req.params.id);
    return res.status(200).json({ success: true, data: rule });
  } catch (error) {
    return handleControllerError(res, error);
  }
}

module.exports = {
  getIntegrations,
  manualConnect,
  embeddedExchange,
  disconnectIntegration,
  sendText,
  sendTemplate,
  sendMedia,
  sendMessage,
  getTemplates,
  syncTemplates,
  getConnectedNumbers,
  getMessages,
  getAnalytics,
  getAutoReplyRules,
  createAutoReplyRule,
  updateAutoReplyRule,
  deleteAutoReplyRule,
  toggleAutoReplyRule,
  ensureCenterAccess,
};
