const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/roleGuard');
const ctrl = require('../controllers/idCardController');

// ─── Project routes ───────────────────────────────────────────────────────────

router.post('/projects', authenticate, ctrl.createProject);
router.get('/projects', authenticate, ctrl.getProjects);
router.get('/projects/:uuid', authenticate, ctrl.getProject);
router.put('/projects/:uuid', authenticate, ctrl.updateProject);
router.post('/projects/:uuid/students', authenticate, ctrl.importStudents);
router.get('/projects/:uuid/students', authenticate, ctrl.getStudents);
router.post('/projects/:uuid/photos', authenticate, ctrl.multerBulkUpload, ctrl.bulkUploadPhotos);
router.get('/projects/:uuid/print', authenticate, ctrl.getPrintData);

// ─── Student routes ───────────────────────────────────────────────────────────

router.post('/students/:uuid/photo', authenticate, ctrl.uploadStudentPhoto);
router.post('/students/:uuid/remove-bg', authenticate, ctrl.removeBackground);
router.put('/students/:uuid/status', authenticate, ctrl.updateStudentStatus);
router.post('/students/:uuid/magic-link', authenticate, ctrl.generateMagicLink);
router.put('/students/:uuid/approve', authenticate, ctrl.approveStudent);
router.put('/students/:uuid/reject', authenticate, ctrl.rejectStudent);

// ─── Public routes (no auth) ──────────────────────────────────────────────────

router.get('/public/:token', ctrl.getStudentPublic);
router.post('/public/:token/submit', ctrl.studentSubmit);

module.exports = router;
