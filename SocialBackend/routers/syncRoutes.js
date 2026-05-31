'use strict';
const express = require('express');
const mongoose = require('mongoose');
const { authenticate } = require('../middleware/roleGuard');

const router = express.Router();

// Collections that participate in bi-directional sync.
// Mirrors electron/sync/modelRegistry.js — keep the two in sync.
const SYNC_COLLECTIONS = [
  { collection: 'students',        uuidField: 'uuid' },
  { collection: 'leads',           uuidField: 'Lead_uuid' },
  { collection: 'admissions',      uuidField: 'uuid' },
  { collection: 'fees',            uuidField: 'uuid' },
  { collection: 'transactions',    uuidField: 'Transaction_uuid' },
  { collection: 'attendances',     uuidField: 'Attendance_uuid' },
  { collection: 'batches',         uuidField: 'Batch_uuid' },
  { collection: 'courses',         uuidField: 'Course_uuid' },
  { collection: 'employees',       uuidField: 'employee_uuid' },
  { collection: 'accounts',        uuidField: 'uuid' },
  { collection: 'accountgroups',   uuidField: 'Account_group_uuid' },
  { collection: 'paymentmodes',    uuidField: 'uuid' },
  { collection: 'upiconfigs',      uuidField: 'uuid' },
  { collection: 'payrollruns',     uuidField: 'run_uuid' },
  { collection: 'exams',           uuidField: 'uuid' },
  { collection: 'forms',           uuidField: 'form_uuid' },
  { collection: 'formresponses',   uuidField: 'response_uuid' },
  { collection: 'enquiries',       uuidField: 'uuid' },
  { collection: 'records',         uuidField: 'uuid' },
  { collection: 'idcardprojects',  uuidField: 'project_uuid' },
  { collection: 'idcardstudents',  uuidField: 'idcard_uuid' },
  { collection: 'designs',         uuidField: 'design_uuid' },
  { collection: 'customtemplates', uuidField: 'template_uuid' },
  { collection: 'messagetemplates',uuidField: 'uuid' },
  { collection: 'institutes',      uuidField: 'institute_uuid' },
  { collection: 'users',           uuidField: 'user_uuid' },
];

// GET /api/sync/pull?since=<ISO>
// Returns all records changed since `since` for the authenticated institute.
router.get('/pull', authenticate, async (req, res) => {
  try {
    const since = req.query.since ? new Date(req.query.since) : new Date(0);
    if (isNaN(since.getTime())) return res.status(400).json({ error: 'Invalid since timestamp' });

    const instituteUuid = req.user.institute_uuid;
    const db = mongoose.connection.db;

    const models = {};
    for (const { collection } of SYNC_COLLECTIONS) {
      const docs = await db.collection(collection).find({
        institute_uuid: instituteUuid,
        updatedAt: { $gt: since },
      }).toArray();
      if (docs.length) models[collection] = docs;
    }

    res.json({ models, serverTime: new Date().toISOString() });
  } catch (err) {
    console.error('[sync/pull] error:', err);
    res.status(500).json({ error: 'Sync pull failed' });
  }
});

// POST /api/sync/push
// Body: { models: { <collection>: [...docs] } }
// Upserts each document; forces institute_uuid from auth token (cross-tenant guard).
router.post('/push', authenticate, async (req, res) => {
  try {
    const { models = {} } = req.body;
    const instituteUuid = req.user.institute_uuid;
    const db = mongoose.connection.db;
    const counts = {};

    for (const { collection, uuidField } of SYNC_COLLECTIONS) {
      const docs = models[collection];
      if (!Array.isArray(docs) || !docs.length) continue;

      let n = 0;
      for (const rawDoc of docs) {
        const uuidValue = rawDoc[uuidField];
        if (!uuidValue) continue;

        // Strip MongoDB _id (let the DB manage it) and force institute_uuid
        const { _id, ...rest } = rawDoc;
        const safeDoc = { ...rest, institute_uuid: instituteUuid };

        await db.collection(collection).findOneAndUpdate(
          { [uuidField]: uuidValue },
          { $set: safeDoc },
          { upsert: true },
        );
        n++;
      }
      if (n > 0) counts[collection] = n;
    }

    res.json({ ok: true, counts });
  } catch (err) {
    console.error('[sync/push] error:', err);
    res.status(500).json({ error: 'Sync push failed' });
  }
});

module.exports = router;
