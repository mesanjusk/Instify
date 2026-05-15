const express = require('express');
const router = express.Router();
const Record = require('../models/Record');

// ✅ GET records (enquiry/admission/followup) for a specific institute with pagination
router.get('/org/:institute_id', async (req, res) => {
  try {
    const { institute_id } = req.params;
    const { type, page = 0, limit = 20 } = req.query;

    const filter = { institute_uuid: institute_id };
    if (type) filter.type = type;

    const safeLimit = Math.min(parseInt(limit), 100); // cap max limit to 100

    const data = await Record.find(filter)
      .sort({ createdAt: -1 })
      .skip(parseInt(page) * safeLimit)
      .limit(safeLimit)
      .lean(); // optimize memory

    const total = await Record.countDocuments(filter);

    res.json({ data, total, page: parseInt(page), limit: safeLimit });
  } catch (err) {
    console.error('Fetch records failed:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ GET follow-ups for today in IST timezone
router.get('/followup/:institute_id', async (req, res) => {
  try {
    const { institute_id } = req.params;
    const { page = 0, limit = 20 } = req.query;

    const now = new Date();
    const todayIST = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const yyyy = todayIST.getFullYear();
    const mm = String(todayIST.getMonth() + 1).padStart(2, '0');
    const dd = String(todayIST.getDate()).padStart(2, '0');

    const startIST = new Date(`${yyyy}-${mm}-${dd}T00:00:00+05:30`);
    const endIST = new Date(`${yyyy}-${mm}-${dd}T23:59:59+05:30`);

    const startUTC = new Date(startIST.toISOString());
    const endUTC = new Date(endIST.toISOString());

    const filter = {
      institute_uuid: institute_id,
      type: 'followup',
      followUpDate: { $gte: startUTC, $lte: endUTC }
    };

    const safeLimit = Math.min(parseInt(limit), 100);

    const data = await Record.find(filter)
      .sort({ createdAt: -1 })
      .skip(parseInt(page) * safeLimit)
      .limit(safeLimit)
      .lean();

    const total = await Record.countDocuments(filter);

    res.json({ data, total, page: parseInt(page), limit: safeLimit });
  } catch (err) {
    console.error('Fetch follow-ups failed:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ Create a new record
router.post('/', async (req, res) => {
  try {
    const { institute_uuid, type } = req.body;
    if (!institute_uuid || !['enquiry', 'admission', 'followup'].includes(type)) {
      return res.status(400).json({ error: 'Invalid or missing type' });
    }

    const newRecord = new Record(req.body);
    await newRecord.save();
    res.json(newRecord);
  } catch (err) {
    console.error('Create record failed:', err);
    res.status(500).json({ error: 'Failed to save record' });
  }
});

// ✅ Convert enquiry to admission
router.post('/convert/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;
    const { institute_uuid, admissionData } = req.body;

    if (!institute_uuid || !admissionData) {
      return res.status(400).json({ error: 'institute_uuid and admissionData are required' });
    }

    const record = await Record.findOne({ uuid, institute_uuid });

    if (!record) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    if (record.type !== 'enquiry') {
      return res.status(400).json({ error: 'Record is not an enquiry and cannot be converted' });
    }

    if (record.convertedToAdmission) {
      return res.status(400).json({ error: 'This enquiry has already been converted to admission' });
    }

    // Perform conversion
    record.type = 'admission';
    record.convertedToAdmission = true;
    record.admissionDetails = record.admissionDetails || [];
    record.admissionDetails.push(admissionData);

    await record.save();

    res.json({ success: true, message: 'Successfully converted to admission', record });
  } catch (err) {
    console.error('Conversion failed:', err);
    res.status(500).json({ error: 'Failed to convert to admission' });
  }
});

// ✅ Update record
router.put('/:id', async (req, res) => {
  try {
    const updated = await Record.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    console.error('Update record failed:', err);
    res.status(500).json({ error: 'Update failed' });
  }
});

// ✅ Delete record
router.delete('/:id', async (req, res) => {
  try {
    await Record.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Delete record failed:', err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;
