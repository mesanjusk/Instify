const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const studentController = require('../controllers/studentController');

router.get('/check-mobile', studentController.checkMobileNumber);

router.post('/',
  [
    body('firstName').notEmpty().withMessage('firstName is required'),
    body('institute_uuid').notEmpty().withMessage('institute_uuid is required'),
  ],
  validate,
  studentController.createStudent
);

router.get('/', studentController.getStudents);
router.post('/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(400).json({ error: 'ids array required' });
    const Student = require('../models/Student');
    const result = await Student.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, deleted: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: 'Bulk delete failed' });
  }
});
router.get('/:uuid', studentController.getStudent);
router.put('/:uuid', studentController.updateStudent);
router.delete('/:uuid', studentController.deleteStudent);

module.exports = router;
