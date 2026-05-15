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
router.get('/:uuid', studentController.getStudent);
router.put('/:uuid', studentController.updateStudent);
router.delete('/:uuid', studentController.deleteStudent);

module.exports = router;
