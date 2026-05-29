const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const admissionController = require('../controllers/admissionController');

router.post('/',
  [
    body('student_uuid').notEmpty().withMessage('student_uuid is required'),
    body('institute_uuid').notEmpty().withMessage('institute_uuid is required'),
    body('course').notEmpty().withMessage('course is required'),
  ],
  validate,
  admissionController.createAdmission
);

router.get('/', admissionController.getAdmissions);
router.post('/bulk-delete', admissionController.bulkDeleteAdmissions);
router.get('/by-student/:student_uuid', admissionController.getAdmissionByStudentUUID);
router.get('/:uuid', admissionController.getAdmission);
router.put('/:uuid', admissionController.updateAdmission);
router.delete('/:uuid', admissionController.deleteAdmission);

module.exports = router;
