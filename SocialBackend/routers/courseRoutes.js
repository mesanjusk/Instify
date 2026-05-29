const express = require('express');
const Course = require('../models/Course');
const router = express.Router();
const { v4: uuid } = require("uuid");

// ✅ GET courses filtered by institute
router.get('/', async (req, res) => {
  try {
    const { institute_uuid } = req.query;
    if (!institute_uuid) return res.status(400).json({ error: 'institute_uuid is required' });
    const data = await Course.find({ institute_uuid }).lean();
    res.status(200).json(data);
  } catch (err) {
    console.error('❌ Failed to fetch courses:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ POST new course
router.post('/', async (req, res) => {
  try {
    const { name, description, courseFees, examFees, duration } = req.body;
    const institute_uuid = req.institute_uuid || req.body.institute_uuid;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }
    if (!institute_uuid) {
      return res.status(400).json({ error: 'institute_uuid is required' });
    }

    const newCourse = new Course({
      Course_uuid: uuid(),
      institute_uuid,
      name,
      description,
      courseFees,
      examFees,
      duration,
    });

    await newCourse.save();
    res.status(201).json(newCourse);
  } catch (err) {
    console.error('❌ Failed to create course:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


// Bulk delete courses
router.post('/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ error: 'ids array required' });
    const result = await Course.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, deleted: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: 'Bulk delete failed' });
  }
});

// ✅ PUT update course
router.put('/:id', async (req, res) => {
  try {
    const updated = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    console.error('Failed to update course:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ DELETE course
router.delete('/:id', async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to delete course:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
