const express = require('express');
const router = express.Router();
const Design = require('../models/Design');

router.get('/', async (req, res) => {
  try {
    const { institute_uuid } = req.query;
    if (!institute_uuid) return res.status(400).json({ success: false, message: 'institute_uuid required' });
    const designs = await Design.find({ institute_uuid }).sort({ updatedAt: -1 });
    res.json({ success: true, result: designs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const design = new Design(req.body);
    await design.save();
    res.json({ success: true, result: design });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:uuid', async (req, res) => {
  try {
    const design = await Design.findOneAndUpdate(
      { design_uuid: req.params.uuid },
      req.body,
      { new: true }
    );
    if (!design) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, result: design });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:uuid', async (req, res) => {
  try {
    await Design.findOneAndDelete({ design_uuid: req.params.uuid });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
