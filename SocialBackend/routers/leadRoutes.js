const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');

router.post('/', leadController.createLead);


router.get('/', leadController.getLeads);
router.get('/:uuid', leadController.getLead);
router.put('/:uuid', leadController.updateLeadStatus);
router.put('/:uuid/edit', leadController.editLead); 

module.exports = router;
