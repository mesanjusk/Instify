const express = require('express');
const router = express.Router();
const Institute = require('../models/institute');
const { authenticate } = require('../middleware/roleGuard');

// GET /api/license/status
// Desktop app calls this daily to sync license state from cloud
router.get('/status', authenticate, async (req, res) => {
  try {
    const institute = await Institute.findOne({ institute_uuid: req.user.institute_uuid })
      .select('plan_type status modulesEnabled trialExpiresAt institute_uuid');

    if (!institute) return res.status(404).json({ error: 'Institute not found' });

    const now = new Date();
    const trialActive = institute.status === 'trial' && new Date(institute.trialExpiresAt) > now;
    const paidActive = institute.plan_type === 'paid' && institute.status === 'active';

    res.json({
      plan_type: institute.plan_type,
      status: institute.status,
      modulesEnabled: institute.modulesEnabled || [],
      trialExpiresAt: institute.trialExpiresAt,
      trialActive,
      paidActive,
      serverTime: now.toISOString(),
      institute_uuid: institute.institute_uuid,
    });
  } catch (err) {
    console.error('License status error:', err);
    res.status(500).json({ error: 'License check failed' });
  }
});

module.exports = router;
