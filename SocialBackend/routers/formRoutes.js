const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/roleGuard');
const ctrl = require('../controllers/formController');

// ── Public (no auth) ──────────────────────────────────────────────────────────
router.get('/public/:slug', ctrl.getPublicForm);
router.post('/public/:slug/submit', ctrl.submitResponse);

// ── Admin (authenticated) ─────────────────────────────────────────────────────
router.post('/', authenticate, ctrl.createForm);
router.get('/', authenticate, ctrl.getForms);
router.get('/:uuid', authenticate, ctrl.getForm);
router.put('/:uuid', authenticate, ctrl.updateForm);
router.delete('/:uuid', authenticate, ctrl.deleteForm);
router.get('/:uuid/responses', authenticate, ctrl.getResponses);

module.exports = router;
