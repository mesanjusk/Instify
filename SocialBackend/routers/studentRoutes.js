const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

router.get('/check-mobile', studentController.checkMobileNumber);
router.post('/', studentController.createStudent);
router.get('/', studentController.getStudents);
router.get('/:uuid', studentController.getStudent);
router.put('/:uuid', studentController.updateStudent); 
router.delete('/:uuid', studentController.deleteStudent);


module.exports = router;
