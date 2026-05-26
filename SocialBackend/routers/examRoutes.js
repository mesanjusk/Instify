const express = require('express');
const router = express.Router();
const Exam = require('../models/Exam');

// GET exam entries filtered by institute
router.get('/', async (req, res) => {
  try {
    const { institute_uuid } = req.query;
    if (!institute_uuid) return res.status(400).json({ error: 'institute_uuid is required' });
    const data = await Exam.find({ institute_uuid }).lean();
    res.status(200).json(data);
  } catch (err) {
    console.error('❌ Failed to fetch exams:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST new exam
router.post('/', async (req, res) => {
  try {
    const { exam, description } = req.body;
    const institute_uuid = req.institute_uuid || req.body.institute_uuid;
    if (!exam) return res.status(400).json({ error: 'Exam is required' });
    if (!institute_uuid) return res.status(400).json({ error: 'institute_uuid is required' });

    const newExam = new Exam({ exam, description, institute_uuid });
    await newExam.save();
    res.status(201).json(newExam);
  } catch (err) {
    console.error('❌ Failed to create exam:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update
router.put('/:id', async (req, res) => {
  try {
    const updated = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Exam not found' });
    res.status(200).json(updated);
  } catch (err) {
    console.error('❌ Failed to update exam:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE exam
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Exam.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Exam not found' });
    res.status(200).json({ success: true, message: 'Deleted' });
  } catch (err) {
    console.error('❌ Failed to delete exam:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
