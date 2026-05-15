const express = require('express');
const whatsappController = require('../controllers/whatsappController');
const whatsapp24hGuard = require('../middleware/whatsapp24hGuard');
const autoReply = require('../middleware/autoReply');

const router = express.Router();

router.post('/send-text', whatsapp24hGuard, whatsappController.sendTextMessage);
router.post('/send-image', whatsapp24hGuard, whatsappController.sendImageMessage);
router.get('/webhook', whatsappController.webhookVerify);
router.post('/webhook', autoReply, whatsappController.webhookReceive);

module.exports = router;
