const express = require('express');
const courseCategory = require('../models/courseCategory');
const router = express.Router();

// ✅ GET courseCategory (optionally filter by institute_id)
router.get('/', async (req, res) => {
  try {
    const { courseCategory_uuid } = req.query;
    const query = courseCategory_uuid ? { courseCategory_uuid } : {};
    const courses = await courseCategory.find(query);
    res.json(courses);
  } catch (err) {
    console.error('Failed to fetch courseCategory:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ POST new courseCategory
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'name are required' });
    }

    const newCourse = new courseCategory(req.body);
    await newCourse.save();
    res.status(201).json(newCourse);
  } catch (err) {
    console.error('Failed to create courseCategory:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ PUT update courseCategory
router.put('/:id', async (req, res) => {
  try {
    const updated = await courseCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    console.error('Failed to update course:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ DELETE course
router.delete('/:id', async (req, res) => {
  try {
    await courseCategory.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to delete course:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
