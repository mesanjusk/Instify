const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const feesController = require('../controllers/feesController');

router.post('/',
  [
    body('institute_uuid').notEmpty().withMessage('institute_uuid is required'),
    body('student_uuid').notEmpty().withMessage('student_uuid is required'),
    body('fees').isNumeric().withMessage('fees must be a number'),
    body('total').isNumeric().withMessage('total must be a number'),
  ],
  validate,
  feesController.createFees
);

router.get('/', feesController.getFees);
router.get('/admission/:admission_uuid', feesController.getFeesByAdmissionUuid);
router.get('/:uuid', feesController.getFee);
router.put('/:uuid', feesController.updateFees);

module.exports = router;
