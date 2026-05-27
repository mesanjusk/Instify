/**
 * Bulk Import Routes — supports CSV, Excel (.xlsx/.xls), and JSON
 *
 * POST /api/csv-import/students
 * POST /api/csv-import/leads
 * POST /api/csv-import/courses
 * POST /api/csv-import/batches
 * POST /api/csv-import/admissions
 *
 * Request: multipart/form-data  { file, institute_uuid, createdBy }
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const { Readable } = require('stream');
const Student = require('../models/Student');
const Lead = require('../models/Lead');
const Admission = require('../models/Admission');
const Course = require('../models/Course');
const Batch = require('../models/Batch');
const { v4: uuidv4 } = require('uuid');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(csv|xlsx|xls|json)$/i)) {
      return cb(new Error('Only CSV, Excel (.xlsx/.xls), or JSON files are allowed'));
    }
    cb(null, true);
  },
});

function normalizeKey(key) {
  return String(key).trim().toLowerCase().replace(/\s+/g, '_');
}

function parseCSV(buffer) {
  return new Promise((resolve, reject) => {
    const rows = [];
    Readable.from(buffer.toString('utf-8'))
      .pipe(csv({ mapHeaders: ({ header }) => normalizeKey(header) }))
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

function parseExcel(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  return rawRows.map(row => {
    const out = {};
    for (const k of Object.keys(row)) out[normalizeKey(k)] = String(row[k] ?? '').trim();
    return out;
  });
}

function parseJSON(buffer) {
  const data = JSON.parse(buffer.toString('utf-8'));
  const arr = Array.isArray(data) ? data : (data.data || data.rows || [data]);
  return arr.map(row => {
    const out = {};
    for (const k of Object.keys(row)) out[normalizeKey(k)] = String(row[k] ?? '').trim();
    return out;
  });
}

async function parseFile(file) {
  const ext = file.originalname.split('.').pop().toLowerCase();
  if (ext === 'json') return parseJSON(file.buffer);
  if (ext === 'xlsx' || ext === 'xls') return parseExcel(file.buffer);
  return parseCSV(file.buffer);
}

// ── Students ──────────────────────────────────────────────────────────────
router.post('/students', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'File is required' });
    const institute_uuid = req.institute_uuid || req.body.institute_uuid;
    if (!institute_uuid) return res.status(400).json({ success: false, message: 'institute_uuid is required' });

    const rows = await parseFile(req.file);
    if (!rows.length) return res.status(400).json({ success: false, message: 'File is empty or has no valid rows' });

    const createdBy = req.body.createdBy || 'bulk_import';
    const results = { inserted: 0, skipped: 0, errors: [] };

    for (const row of rows) {
      try {
        const firstName = (row.firstname || row.first_name || '').trim();
        if (!firstName) { results.errors.push({ row, reason: 'firstName missing' }); continue; }

        const mobile = (row.mobileself || row.mobile || row.phone || '').trim();
        if (mobile) {
          const exists = await Student.findOne({ institute_uuid, mobileSelf: mobile });
          if (exists) { results.skipped++; continue; }
        }

        await Student.create({
          uuid: uuidv4(),
          institute_uuid,
          firstName,
          middleName: (row.middlename || row.middle_name || '').trim(),
          lastName: (row.lastname || row.last_name || '').trim(),
          mobileSelf: mobile,
          mobileParent: (row.mobileparent || row.parent_mobile || '').trim(),
          dob: row.dob ? new Date(row.dob) : undefined,
          gender: row.gender?.trim() || undefined,
          address: (row.address || '').trim(),
          education: (row.education || '').trim(),
          createdBy,
        });
        results.inserted++;
      } catch (err) {
        results.errors.push({ row, reason: err.message });
      }
    }

    res.json({ success: true, message: 'Import complete', ...results, total: rows.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Leads ────────────────────────────────────────────────────────────────
router.post('/leads', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'File is required' });
    const institute_uuid = req.institute_uuid || req.body.institute_uuid;
    if (!institute_uuid) return res.status(400).json({ success: false, message: 'institute_uuid is required' });

    const rows = await parseFile(req.file);
    if (!rows.length) return res.status(400).json({ success: false, message: 'File is empty' });

    const createdBy = req.body.createdBy || 'bulk_import';
    const results = { inserted: 0, skipped: 0, errors: [] };

    for (const row of rows) {
      try {
        const firstName = (row.firstname || row.first_name || row.name || '').trim();
        if (!firstName) { results.errors.push({ row, reason: 'firstName missing' }); continue; }

        const mobile = (row.mobileself || row.mobile || row.phone || '').trim();
        let student = mobile ? await Student.findOne({ institute_uuid, mobileSelf: mobile }) : null;

        if (!student) {
          student = await Student.create({
            uuid: uuidv4(),
            institute_uuid,
            firstName,
            lastName: (row.lastname || row.last_name || '').trim(),
            mobileSelf: mobile,
            createdBy,
          });
        }

        await Lead.create({
          Lead_uuid: uuidv4(),
          institute_uuid,
          student_uuid: student.uuid,
          course: (row.course || '').trim(),
          enquiryDate: row.enquirydate ? new Date(row.enquirydate) : new Date(),
          followupDate: row.followupdate ? new Date(row.followupdate) : undefined,
          referredBy: (row.referredby || row.referred_by || '').trim(),
          createdBy,
        });
        results.inserted++;
      } catch (err) {
        results.errors.push({ row, reason: err.message });
      }
    }

    res.json({ success: true, message: 'Import complete', ...results, total: rows.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Courses ───────────────────────────────────────────────────────────────
router.post('/courses', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'File is required' });
    const institute_uuid = req.institute_uuid || req.body.institute_uuid;
    if (!institute_uuid) return res.status(400).json({ success: false, message: 'institute_uuid is required' });

    const rows = await parseFile(req.file);
    if (!rows.length) return res.status(400).json({ success: false, message: 'File is empty' });

    const createdBy = req.body.createdBy || 'bulk_import';
    const results = { inserted: 0, skipped: 0, errors: [] };

    for (const row of rows) {
      try {
        const name = (row.name || row.course || row.course_name || '').trim();
        if (!name) { results.errors.push({ row, reason: 'name missing' }); continue; }

        const exists = await Course.findOne({ institute_uuid, name });
        if (exists) { results.skipped++; continue; }

        await Course.create({
          Course_uuid: uuidv4(),
          institute_uuid,
          name,
          description: (row.description || '').trim(),
          courseFees: (row.coursefees || row.course_fees || row.fees || '').trim(),
          examFees: (row.examfees || row.exam_fees || '').trim(),
          duration: (row.duration || '').trim(),
        });
        results.inserted++;
      } catch (err) {
        results.errors.push({ row, reason: err.message });
      }
    }

    res.json({ success: true, message: 'Import complete', ...results, total: rows.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Batches ───────────────────────────────────────────────────────────────
router.post('/batches', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'File is required' });
    const institute_uuid = req.institute_uuid || req.body.institute_uuid;
    if (!institute_uuid) return res.status(400).json({ success: false, message: 'institute_uuid is required' });

    const rows = await parseFile(req.file);
    if (!rows.length) return res.status(400).json({ success: false, message: 'File is empty' });

    const createdBy = req.body.createdBy || 'bulk_import';
    const results = { inserted: 0, skipped: 0, errors: [] };

    for (const row of rows) {
      try {
        const name = (row.name || row.batch || row.batch_name || '').trim();
        if (!name) { results.errors.push({ row, reason: 'name missing' }); continue; }

        const exists = await Batch.findOne({ institute_uuid, name });
        if (exists) { results.skipped++; continue; }

        await Batch.create({
          Batch_uuid: uuidv4(),
          institute_uuid,
          name,
          timing: (row.timing || row.time || row.batch_time || '').trim(),
        });
        results.inserted++;
      } catch (err) {
        results.errors.push({ row, reason: err.message });
      }
    }

    res.json({ success: true, message: 'Import complete', ...results, total: rows.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Admissions ────────────────────────────────────────────────────────────
router.post('/admissions', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'File is required' });
    const institute_uuid = req.institute_uuid || req.body.institute_uuid;
    if (!institute_uuid) return res.status(400).json({ success: false, message: 'institute_uuid is required' });

    const rows = await parseFile(req.file);
    if (!rows.length) return res.status(400).json({ success: false, message: 'File is empty' });

    const createdBy = req.body.createdBy || 'bulk_import';
    const results = { inserted: 0, skipped: 0, errors: [] };

    for (const row of rows) {
      try {
        const course = (row.course || row.course_name || '').trim();
        if (!course) { results.errors.push({ row, reason: 'course missing' }); continue; }

        const mobile = (row.mobileself || row.mobile || row.phone || '').trim();
        const firstName = (row.firstname || row.first_name || row.name || '').trim();

        if (!mobile && !firstName) {
          results.errors.push({ row, reason: 'student mobile or firstName required' });
          continue;
        }

        let student = mobile ? await Student.findOne({ institute_uuid, mobileSelf: mobile }) : null;

        if (!student && firstName) {
          student = await Student.create({
            uuid: uuidv4(),
            institute_uuid,
            firstName,
            lastName: (row.lastname || row.last_name || '').trim(),
            mobileSelf: mobile,
            createdBy,
          });
        }

        if (!student) {
          results.errors.push({ row, reason: 'Could not find or create student' });
          continue;
        }

        await Admission.create({
          uuid: uuidv4(),
          institute_uuid,
          student_uuid: student.uuid,
          course,
          batchTime: (row.batchtime || row.batch_time || row.batch || '').trim(),
          examEvent: (row.examevent || row.exam_event || row.exam || '').trim(),
          admissionDate: row.admissiondate ? new Date(row.admissiondate) : new Date(),
          confirmationStatus: row.confirmationstatus || '',
          createdBy,
        });
        results.inserted++;
      } catch (err) {
        results.errors.push({ row, reason: err.message });
      }
    }

    res.json({ success: true, message: 'Import complete', ...results, total: rows.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
