const express = require('express');
const router = express.Router();
const admissionController = require('../controllers/admissionController');

router.post('/', admissionController.createAdmission);
router.get('/', admissionController.getAdmissions);
router.get('/by-student/:student_uuid', admissionController.getAdmissionByStudentUUID);
router.get('/:uuid', admissionController.getAdmission);
router.put('/:uuid', admissionController.updateAdmission);



module.exports = router;
