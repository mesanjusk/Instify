const express = require('express');
const jwt = require('jsonwebtoken');
const whatsappController = require('./whatsapp.controller');
const webhookController = require('./webhook.controller');

const router = express.Router();

function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
    if (!token) return res.status(401).json({ success: false, message: 'Authorization token required' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (_error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

router.get('/webhook', webhookController.verifyWebhook);
router.post('/webhook', webhookController.processWebhook);

router.get('/integrations', requireAuth, whatsappController.getIntegrations);
router.get('/integrations/:centerId', requireAuth, whatsappController.getIntegrations);
router.post('/manual/connect', requireAuth, whatsappController.manualConnect);
router.post('/embedded/exchange', requireAuth, whatsappController.embeddedExchange);
router.delete('/integrations/:id', requireAuth, whatsappController.disconnectIntegration);
router.post('/disconnect', requireAuth, whatsappController.disconnectIntegration);

router.post('/messages/send', requireAuth, whatsappController.sendMessage);
router.post('/messages/text', requireAuth, whatsappController.sendText);
router.post('/messages/template', requireAuth, whatsappController.sendTemplate);
router.post('/messages/media', requireAuth, whatsappController.sendMedia);
router.get('/messages', requireAuth, whatsappController.getMessages);
router.get('/analytics', requireAuth, whatsappController.getAnalytics);

router.get('/templates', requireAuth, whatsappController.getTemplates);
router.get('/templates/:integrationId', requireAuth, whatsappController.getTemplates);
router.post('/templates/sync', requireAuth, whatsappController.syncTemplates);
router.get('/numbers', requireAuth, whatsappController.getConnectedNumbers);

router.get('/auto-reply', requireAuth, whatsappController.getAutoReplyRules);
router.get('/auto-replies', requireAuth, whatsappController.getAutoReplyRules);
router.post('/auto-reply', requireAuth, whatsappController.createAutoReplyRule);
router.put('/auto-reply/:id', requireAuth, whatsappController.updateAutoReplyRule);
router.delete('/auto-reply/:id', requireAuth, whatsappController.deleteAutoReplyRule);
router.patch('/auto-reply/:id/toggle', requireAuth, whatsappController.toggleAutoReplyRule);

module.exports = router;
