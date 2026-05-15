const express = require('express');
const router = express.Router();
const feesController = require('../controllers/feesController');

// Optional: Middleware for authentication if needed
// const { protect } = require('../middleware/authMiddleware');

// ======= Fees Routes =======

// Create Fees Record
router.post('/', /* protect, */ feesController.createFees);

// Get All Fees Records (with optional institute_uuid filtering)
router.get('/', /* protect, */ feesController.getFees);

// Get Single Fees Record by UUID
router.get('/:uuid', /* protect, */ feesController.getFee);

// Update Fees Record by UUID
router.put('/:uuid', /* protect, */ feesController.updateFees);

// Get Fees by Admission UUID
router.get('/admission/:admission_uuid', feesController.getFeesByAdmissionUuid);

module.exports = router;
