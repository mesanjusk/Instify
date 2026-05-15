/**
 * UPI Payment Routes
 * POST   /api/upi/config              — save/update UPI config for an institute
 * GET    /api/upi/config/:instituteId — get UPI config
 * GET    /api/upi/qr/:instituteId     — generate payment QR as base64 image
 *   query: ?amount=500&note=Fee
 */

const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const UpiConfig = require('../models/UpiConfig');
const { body, validationResult } = require('express-validator');

/** Save or update UPI config */
router.post(
  '/config',
  [
    body('institute_uuid').notEmpty().withMessage('institute_uuid required'),
    body('upi_id').notEmpty().withMessage('upi_id required'),
    body('merchant_name').notEmpty().withMessage('merchant_name required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }
    try {
      const { institute_uuid, upi_id, merchant_name, description } = req.body;
      const config = await UpiConfig.findOneAndUpdate(
        { institute_uuid },
        { upi_id, merchant_name, description, is_active: true },
        { upsert: true, new: true }
      );
      res.json({ success: true, message: 'UPI config saved', data: config });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

/** Get UPI config for an institute */
router.get('/config/:instituteId', async (req, res) => {
  try {
    const config = await UpiConfig.findOne({ institute_uuid: req.params.instituteId });
    if (!config) return res.json({ success: false, message: 'UPI not configured' });
    res.json({ success: true, data: config });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Generate a UPI payment QR code.
 * Returns PNG base64 data URL.
 * Standard UPI deep-link: upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&cu=INR&tn=NOTE
 */
router.get('/qr/:instituteId', async (req, res) => {
  try {
    const { amount, note } = req.query;
    const config = await UpiConfig.findOne({ institute_uuid: req.params.instituteId, is_active: true });
    if (!config) return res.status(404).json({ success: false, message: 'UPI not configured' });

    const params = new URLSearchParams({
      pa: config.upi_id,
      pn: config.merchant_name,
      cu: 'INR',
    });
    if (amount) params.set('am', amount);
    if (note) params.set('tn', note);
    else if (config.description) params.set('tn', config.description);

    const upiUrl = `upi://pay?${params.toString()}`;
    const qrDataUrl = await QRCode.toDataURL(upiUrl, { width: 300, margin: 2 });

    res.json({ success: true, qr: qrDataUrl, upi_id: config.upi_id, merchant_name: config.merchant_name, upi_url: upiUrl });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
