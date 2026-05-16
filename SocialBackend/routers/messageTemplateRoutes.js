const express = require('express');
const router = express.Router();
const MessageTemplate = require('../models/MessageTemplate');

const DEFAULTS = {
  followup: 'Hello {{name}},\nThis is a reminder for your follow-up today ({{date}}) regarding the *{{course}}* enquiry.\nPlease contact us for more details.\n– Instify',
  fees: 'Dear {{name}},\nYour fee instalment of ₹{{amount}} was due on {{date}}.\nOutstanding balance: ₹{{balance}}\nPlease clear the dues at the earliest.\n– Instify',
  birthday: '🎂 Happy Birthday, *{{name}}*!\nWishing you a wonderful day filled with joy.\n– Instify Team',
  magic_link: 'Hello {{name}},\nYour Instify account is ready. Click to access:\n{{link}}\n(Valid for 48 hours)\n– Instify',
};

router.get('/', async (req, res) => {
  try {
    const { institute_uuid } = req.query;
    if (!institute_uuid) return res.status(400).json({ success: false, message: 'institute_uuid required' });
    const saved = await MessageTemplate.find({ institute_uuid });
    const result = Object.entries(DEFAULTS).map(([key, defaultBody]) => {
      const found = saved.find(t => t.key === key);
      return { key, body: found ? found.body : defaultBody, isCustom: !!found };
    });
    res.json({ success: true, result });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/:key', async (req, res) => {
  try {
    const { institute_uuid, body } = req.body;
    if (!institute_uuid || !body) return res.status(400).json({ success: false, message: 'institute_uuid and body required' });
    const tpl = await MessageTemplate.findOneAndUpdate(
      { institute_uuid, key: req.params.key },
      { body },
      { upsert: true, new: true }
    );
    res.json({ success: true, result: tpl });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:key', async (req, res) => {
  try {
    const { institute_uuid } = req.query;
    await MessageTemplate.findOneAndDelete({ institute_uuid, key: req.params.key });
    res.json({ success: true, message: 'Reset to default' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
