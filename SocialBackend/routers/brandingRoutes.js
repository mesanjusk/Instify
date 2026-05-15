const express = require('express');
const router = express.Router();
const Institute = require('../models/institute');

// GET /api/branding?i=insti_id_or_subdomain
router.get('/', async (req, res) => {
  try {
    const instituteId = req.query.i || 'default';

    // Try to find the institute by:
    // 1. institute_uuid
    // 2. access.subdomain
    // 3. center_code (optional fallback)
    const institute = await Institute.findOne({
      $or: [
        { institute_uuid: instituteId },
        { 'access.subdomain': instituteId },
        { center_code: instituteId }
      ]
    });

    if (!institute) {
  return res.status(200).json({
    institute: 'Instify',
    logo: '/logo.png',
    favicon: '/favicon.ico',
    theme: { color: '6fa8dc' }
  });
}


    const branding = {
      institute: institute.institute_title,
      logo: institute.theme?.logo || '/logo.png',
      favicon: institute.theme?.favicon || '/favicon.ico',
      theme: {
        color: institute.theme?.color || '6fa8dc'
      }
    };

    return res.json(branding);
  } catch (err) {
    console.error('❌ Branding fetch error:', err.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
