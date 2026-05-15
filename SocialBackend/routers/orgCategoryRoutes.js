const express = require('express');
const router = express.Router();
const OrgCategory = require('../models/OrgCategory');

// GET all categories
router.get('/', async (req, res) => {
  try {
    const data = await OrgCategory.find().lean();
    res.status(200).json(data);
  } catch (err) {
    console.error('❌ Failed to fetch categories:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST new category
router.post('/', async (req, res) => {
  try {
    const { category, description } = req.body;
    if (!category) return res.status(400).json({ error: 'Category is required' });

    const newEntry = new OrgCategory({ category, description });
    await newEntry.save();
    res.status(201).json(newEntry);
  } catch (err) {
    console.error('❌ Failed to create category:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update category
router.put('/:id', async (req, res) => {
  try {
    const updated = await OrgCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Category not found' });
    res.status(200).json(updated);
  } catch (err) {
    console.error('❌ Failed to update category:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE category
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await OrgCategory.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Category not found' });
    res.status(200).json({ success: true, message: 'Category deleted' });
  } catch (err) {
    console.error('❌ Failed to delete category:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
