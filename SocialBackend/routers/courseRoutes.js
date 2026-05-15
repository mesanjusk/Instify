const express = require('express');
const Course = require('../models/Course');
const router = express.Router();
const { v4: uuid } = require("uuid");

// ✅ GET courses (optionally filter by institute_id)
router.get('/', async (req, res) => {
  try {
    const data = await Course.find().lean();
    res.status(200).json(data);
  } catch (err) {
    console.error('❌ Failed to fetch exams:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ POST new course
router.post('/', async (req, res) => {
  try {
    const { name, description, courseFees, examFees, duration } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const newCourse = new Course({
      Course_uuid: uuid(),
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
