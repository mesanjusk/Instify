const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const leadController = require('../controllers/leadController');
const Lead = require('../models/Lead');
const Admission = require('../models/Admission');
const Record = require('../models/Record');

router.post('/',
  [
    body('institute_uuid').notEmpty().withMessage('institute_uuid is required'),
    body('student_uuid').notEmpty().withMessage('student_uuid is required'),
  ],
  validate,
  leadController.createLead
);

router.get('/', leadController.getLeads);
router.get('/:uuid', leadController.getLead);
router.put('/:uuid', leadController.updateLeadStatus);
router.put('/:uuid/edit', leadController.editLead);

// Follow-up history for a lead
router.get('/:uuid/followups', async (req, res) => {
  try {
    const lead = await Lead.findOne({ Lead_uuid: req.params.uuid });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, result: lead.followups || [] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Append follow-up note
router.post('/:uuid/followups', async (req, res) => {
  try {
    const { note, status, date } = req.body;
    const lead = await Lead.findOneAndUpdate(
      { Lead_uuid: req.params.uuid },
      { $push: { followups: { note, status: status || 'follow-up', date: date ? new Date(date) : new Date() } } },
      { new: true }
    );
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, result: lead.followups });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Funnel report
router.get('/reports/funnel', async (req, res) => {
  try {
    const { institute_uuid } = req.query;
    if (!institute_uuid) return res.status(400).json({ success: false, message: 'institute_uuid required' });

    const [enquiries, leads, admissions] = await Promise.all([
      Record.countDocuments({ institute_uuid, type: 'enquiry' }).catch(() => 0),
      Lead.countDocuments({ institute_uuid }),
      Admission.countDocuments({ institute_uuid }),
    ]);

    const hotLeads  = await Lead.countDocuments({ institute_uuid, score: 'hot' });
    const warmLeads = await Lead.countDocuments({ institute_uuid, score: 'warm' });
    const coldLeads = await Lead.countDocuments({ institute_uuid, score: 'cold' });

    const bySource = await Lead.aggregate([
      { $match: { institute_uuid } },
      { $group: { _id: '$source', count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      result: {
        enquiries, leads, admissions,
        conversionRate: leads > 0 ? Math.round((admissions / leads) * 100) : 0,
        scores: { hot: hotLeads, warm: warmLeads, cold: coldLeads },
        bySource,
      },
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
