const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Education = require('../models/Education');
const Exam = require('../models/Exam');
const Batch = require('../models/Batch');
const PaymentMode = require('../models/PaymentMode');

router.get('/', async (req, res) => {
  try {
    const { institute_uuid } = req.query;
    if (!institute_uuid) {
      return res.status(400).json({ error: 'institute_uuid is required' });
    }

    const [courses, educations, exams, batches, paymentModes] = await Promise.all([
      Course.find({ institute_uuid }),
      Education.find({ institute_uuid }),
      Exam.find({ institute_uuid }),
      Batch.find({ institute_uuid }),
      PaymentMode.find({ institute_uuid }),
    ]);

    res.json({
      success: true,
      data: {
        courses,
        educations,
        exams,
        batches,
        paymentModes,
      },
    });
  } catch (error) {
    console.error('Metadata fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch metadata' });
  }
});

module.exports = router;
