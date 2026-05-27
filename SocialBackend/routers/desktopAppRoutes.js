const express = require('express');
const router = express.Router();
const AppConfig = require('../models/AppConfig');
const { authenticate, roleGuard } = require('../middleware/roleGuard');

const CONFIG_KEY = 'desktop_app';

// GET /api/admin/desktop-app — returns current installer info (any authenticated user)
router.get('/', authenticate, async (req, res) => {
  try {
    const doc = await AppConfig.findOne({ key: CONFIG_KEY });
    if (!doc) return res.json({ available: false });
    res.json({ available: true, ...doc.value });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/admin/desktop-app — super_admin sets/updates the installer info
router.put('/', authenticate, roleGuard('super_admin'), async (req, res) => {
  const { version, url, releaseNotes, platform } = req.body;
  if (!url) return res.status(400).json({ message: 'url is required' });

  try {
    const value = {
      version: version || '',
      url,
      releaseNotes: releaseNotes || '',
      platform: platform || 'windows',
      publishedAt: new Date().toISOString(),
    };
    await AppConfig.findOneAndUpdate(
      { key: CONFIG_KEY },
      { key: CONFIG_KEY, value },
      { upsert: true, new: true }
    );
    res.json({ success: true, ...value });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
