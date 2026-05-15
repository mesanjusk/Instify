/**
 * CSV Import Routes
 * POST /api/csv-import/students  — bulk import students from CSV
 * POST /api/csv-import/leads     — bulk import leads from CSV
 *
 * Request: multipart/form-data  { file: <csv>, institute_uuid, createdBy }
 * Expected CSV columns for students:
 *   firstName, lastName, middleName, mobileSelf, mobileParent, dob, gender, address, education
 * Expected CSV columns for leads:
 *   firstName, lastName, mobileSelf, course, enquiryDate, followupDate, referredBy
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const { Readable } = require('stream');
const Student = require('../models/Student');
const Lead = require('../models/Lead');
const { v4: uuidv4 } = require('uuid');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.csv$/i)) {
      return cb(new Error('Only CSV files are allowed'));
    }
    cb(null, true);
  },
});

/** Parse a CSV buffer into an array of row objects */
function parseCSV(buffer) {
  return new Promise((resolve, reject) => {
    const rows = [];
    const stream = Readable.from(buffer.toString('utf-8'));
    stream
      .pipe(csv({ mapHeaders: ({ header }) => header.trim().toLowerCase().replace(/\s+/g, '_') }))
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

/** POST /api/csv-import/students */
router.post('/students', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'CSV file is required' });
    const { institute_uuid, createdBy } = req.body;
    if (!institute_uuid) return res.status(400).json({ success: false, message: 'institute_uuid is required' });

    const rows = await parseCSV(req.file.buffer);
    if (!rows.length) return res.status(400).json({ success: false, message: 'CSV is empty' });

    const results = { inserted: 0, skipped: 0, errors: [] };

    for (const row of rows) {
      try {
        const firstName = (row.firstname || row.first_name || '').trim();
        if (!firstName) { results.errors.push({ row, reason: 'firstName missing' }); continue; }

        const mobile = (row.mobileself || row.mobile || row.phone || '').trim();

        // Skip duplicate mobile within same institute
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
          createdBy: createdBy || 'csv_import',
        });
        results.inserted++;
      } catch (err) {
        results.errors.push({ row, reason: err.message });
      }
    }

    res.json({ success: true, message: `Import complete`, ...results, total: rows.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/** POST /api/csv-import/leads */
router.post('/leads', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'CSV file is required' });
    const { institute_uuid, createdBy } = req.body;
    if (!institute_uuid) return res.status(400).json({ success: false, message: 'institute_uuid is required' });

    const rows = await parseCSV(req.file.buffer);
    if (!rows.length) return res.status(400).json({ success: false, message: 'CSV is empty' });

    const results = { inserted: 0, skipped: 0, errors: [] };

    for (const row of rows) {
      try {
        const firstName = (row.firstname || row.first_name || row.name || '').trim();
        if (!firstName) { results.errors.push({ row, reason: 'firstName missing' }); continue; }

        const mobile = (row.mobileself || row.mobile || row.phone || '').trim();

        // Create student first
        let student = mobile
          ? await Student.findOne({ institute_uuid, mobileSelf: mobile })
          : null;

        if (!student) {
          student = await Student.create({
            uuid: uuidv4(),
            institute_uuid,
            firstName,
            lastName: (row.lastname || row.last_name || '').trim(),
            mobileSelf: mobile,
            createdBy: createdBy || 'csv_import',
          });
        }

        // Create lead
        await Lead.create({
          Lead_uuid: uuidv4(),
          institute_uuid,
          student_uuid: student.uuid,
          course: (row.course || '').trim(),
          enquiryDate: row.enquirydate ? new Date(row.enquirydate) : new Date(),
          followupDate: row.followupdate ? new Date(row.followupdate) : undefined,
          referredBy: (row.referredby || row.referred_by || '').trim(),
          createdBy: createdBy || 'csv_import',
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
