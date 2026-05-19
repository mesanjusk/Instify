const { cloudinary } = require('../utils/cloudinary');
const { v4: uuidv4 } = require('uuid');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

const IDCardProject = require('../models/IDCardProject');
const IDCardStudent = require('../models/IDCardStudent');

// ─── Multer / Cloudinary storage setup ───────────────────────────────────────

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'idcards/photos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  },
});

const multerUpload = multer({ storage });
const multerBulkUpload = multerUpload.array('photos', 200);

// ─── Helper: pick the first truthy value from an object by a list of keys ────

function pickField(obj, keys) {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
      return String(obj[key]);
    }
  }
  return '';
}

// ─── 1. createProject ─────────────────────────────────────────────────────────

exports.createProject = async (req, res) => {
  try {
    const {
      institute_uuid,
      title,
      academic_year,
      template_design_uuid,
      principal_signature_url,
      createdBy,
    } = req.body;

    if (!institute_uuid || !title) {
      return res.status(400).json({ success: false, message: 'institute_uuid and title are required' });
    }

    const project = new IDCardProject({
      institute_uuid,
      title,
      academic_year,
      template_design_uuid,
      principal_signature_url,
      createdBy,
    });

    await project.save();
    res.status(201).json({ success: true, result: project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── 2. getProjects ───────────────────────────────────────────────────────────

exports.getProjects = async (req, res) => {
  try {
    const { institute_uuid } = req.query;
    const filter = {};
    if (institute_uuid) filter.institute_uuid = institute_uuid;

    const projects = await IDCardProject.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, result: projects });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── 3. getProject ────────────────────────────────────────────────────────────

exports.getProject = async (req, res) => {
  try {
    const project = await IDCardProject.findOne({ project_uuid: req.params.uuid });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, result: project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── 4. updateProject ─────────────────────────────────────────────────────────

exports.updateProject = async (req, res) => {
  try {
    const project = await IDCardProject.findOneAndUpdate(
      { project_uuid: req.params.uuid },
      { $set: req.body },
      { new: true }
    );
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, result: project });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── 5. importStudents ────────────────────────────────────────────────────────

exports.importStudents = async (req, res) => {
  try {
    const project = await IDCardProject.findOne({ project_uuid: req.params.uuid });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const { students } = req.body;
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ success: false, message: 'students array is required' });
    }

    const docs = students.map((s) => {
      const student_name = pickField(s, ['student_name', 'name', 'Name', 'Student Name']);
      const roll_number = pickField(s, ['roll_number', 'roll', 'Roll', 'Roll No', 'Roll Number']);
      const class_name = pickField(s, ['class_name', 'class', 'Class', 'Class Name']);
      const section = pickField(s, ['section', 'Section']);

      return {
        project_uuid: project.project_uuid,
        institute_uuid: project.institute_uuid,
        student_name: student_name || 'Unknown',
        roll_number,
        class_name,
        section,
        extra_fields: s,
      };
    });

    const inserted = await IDCardStudent.insertMany(docs, { ordered: false });
    res.status(201).json({ success: true, count: inserted.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── 6. getStudents ───────────────────────────────────────────────────────────

exports.getStudents = async (req, res) => {
  try {
    const filter = { project_uuid: req.params.uuid };
    if (req.query.class_name) filter.class_name = req.query.class_name;
    if (req.query.card_status) filter.card_status = req.query.card_status;

    const students = await IDCardStudent.find(filter).sort({ class_name: 1, roll_number: 1 });
    res.json({ success: true, result: students });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── 7. uploadStudentPhoto ────────────────────────────────────────────────────

exports.uploadStudentPhoto = [
  multerUpload.single('photo'),
  async (req, res) => {
    try {
      const student = await IDCardStudent.findOne({ idcard_uuid: req.params.uuid });
      if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

      student.photo_url = req.file.path;
      student.photo_public_id = req.file.filename;
      student.photo_source = req.body.source || 'teacher';
      student.bg_removed_url = '';
      student.use_bg_removed = false;

      await student.save();
      res.json({ success: true, result: student });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: err.message });
    }
  },
];

// ─── 8. bulkUploadPhotos ──────────────────────────────────────────────────────

exports.bulkUploadPhotos = async (req, res) => {
  try {
    const filter = { project_uuid: req.params.uuid };
    if (req.body.class_name) filter.class_name = req.body.class_name;

    const allStudents = await IDCardStudent.find(filter);

    const normalize = (str) => String(str || '').toLowerCase().replace(/[\s\W]+/g, '');

    const matched = [];
    const unmatched = [];
    const results = [];

    for (const file of req.files || []) {
      const originalName = file.originalname || '';
      const nameWithoutExt = originalName.replace(/\.[^.]+$/, '').trim();
      const normalizedFileName = normalize(nameWithoutExt);

      // Try roll_number match first (normalize leading zeros)
      let foundStudent = allStudents.find((s) => {
        const fileRoll = nameWithoutExt.replace(/^0+/, '') || nameWithoutExt;
        const studentRoll = (s.roll_number || '').replace(/^0+/, '') || s.roll_number;
        return studentRoll && fileRoll && studentRoll === fileRoll;
      });

      // Fallback: fuzzy name match
      if (!foundStudent) {
        foundStudent = allStudents.find((s) => {
          return normalize(s.student_name) === normalizedFileName;
        });
      }

      if (foundStudent) {
        foundStudent.photo_url = file.path;
        foundStudent.photo_public_id = file.filename;
        foundStudent.photo_source = 'bulk_upload';
        await foundStudent.save();
        matched.push(originalName);
        results.push({ file: originalName, status: 'matched', student: foundStudent.student_name, idcard_uuid: foundStudent.idcard_uuid });
      } else {
        unmatched.push(originalName);
        results.push({ file: originalName, status: 'unmatched' });
      }
    }

    res.json({ success: true, matched: matched.length, unmatched: unmatched.length, results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── 9. removeBackground ─────────────────────────────────────────────────────

exports.removeBackground = async (req, res) => {
  try {
    const student = await IDCardStudent.findOne({ idcard_uuid: req.params.uuid });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    if (!student.photo_url) return res.status(400).json({ success: false, message: 'Student has no photo' });

    let bgRemovedUrl = '';

    try {
      const result = await cloudinary.uploader.upload(student.photo_url, {
        folder: 'idcards/bgremoved',
        background_removal: 'cloudinary_ai',
      });
      bgRemovedUrl = result.secure_url;
    } catch (primaryErr) {
      console.error('Primary bg removal failed, trying URL transform:', primaryErr.message);
      try {
        bgRemovedUrl = cloudinary.url(student.photo_public_id, {
          transformation: [{ effect: 'e_background_removal' }],
          secure: true,
        });
      } catch (fallbackErr) {
        console.error('Fallback bg removal also failed:', fallbackErr.message);
        return res.status(500).json({
          success: false,
          message: 'Background removal failed. Enable Cloudinary AI Background Removal add-on in your account.',
        });
      }
    }

    student.bg_removed_url = bgRemovedUrl;
    student.use_bg_removed = true;
    await student.save();

    res.json({ success: true, result: student, bg_removed_url: bgRemovedUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── 10. updateStudentStatus ──────────────────────────────────────────────────

exports.updateStudentStatus = async (req, res) => {
  try {
    const updates = {};
    if (req.body.card_status !== undefined) updates.card_status = req.body.card_status;
    if (req.body.student_name !== undefined) updates.student_name = req.body.student_name;
    if (req.body.use_bg_removed !== undefined) updates.use_bg_removed = req.body.use_bg_removed;

    const student = await IDCardStudent.findOneAndUpdate(
      { idcard_uuid: req.params.uuid },
      { $set: updates },
      { new: true }
    );
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, result: student });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── 11. generateMagicLink ────────────────────────────────────────────────────

exports.generateMagicLink = async (req, res) => {
  try {
    const student = await IDCardStudent.findOne({ idcard_uuid: req.params.uuid });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const token = uuidv4();
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    student.magic_token = token;
    student.magic_token_expires = expires;
    await student.save();

    const baseUrl = process.env.FRONTEND_URL || 'https://app.sanjusk.in';
    const link = `${baseUrl}/idcard-preview/${token}`;

    res.json({ success: true, link, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── 12. getStudentPublic (NO auth) ──────────────────────────────────────────

exports.getStudentPublic = async (req, res) => {
  try {
    const student = await IDCardStudent.findOne({ magic_token: req.params.token });
    if (!student) return res.status(404).json({ success: false, message: 'Invalid or expired link' });

    if (!student.magic_token_expires || student.magic_token_expires < new Date()) {
      return res.status(410).json({ success: false, message: 'This magic link has expired' });
    }

    const project = await IDCardProject.findOne({ project_uuid: student.project_uuid });

    const active_photo_url = student.use_bg_removed ? student.bg_removed_url : student.photo_url;

    res.json({
      success: true,
      result: {
        student: {
          idcard_uuid: student.idcard_uuid,
          display_name: student.student_name_override || student.student_name,
          original_name: student.student_name,
          class_name: student.class_name,
          section: student.section,
          roll_number: student.roll_number,
          active_photo_url,
          card_status: student.card_status,
          extra_fields: student.extra_fields,
        },
        project: project
          ? {
              title: project.title,
              academic_year: project.academic_year,
              principal_signature_url: project.principal_signature_url,
              template_design_uuid: project.template_design_uuid,
            }
          : null,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── 13. studentSubmit (NO auth) ─────────────────────────────────────────────

exports.studentSubmit = [
  multerUpload.single('photo'),
  async (req, res) => {
    try {
      const student = await IDCardStudent.findOne({ magic_token: req.params.token });
      if (!student) return res.status(404).json({ success: false, message: 'Invalid or expired link' });

      if (!student.magic_token_expires || student.magic_token_expires < new Date()) {
        return res.status(410).json({ success: false, message: 'This magic link has expired' });
      }

      student.card_status = 'student_submitted';
      student.submitted_at = new Date();

      if (req.body.student_name_override) {
        student.student_name_override = req.body.student_name_override;
      }

      if (req.file) {
        student.student_photo_url = req.file.path;
        student.photo_url = req.file.path;
        student.photo_source = 'student';
      }

      await student.save();
      res.json({ success: true, message: 'Submitted successfully. Your card is under review.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: err.message });
    }
  },
];

// ─── 14. approveStudent ───────────────────────────────────────────────────────

exports.approveStudent = async (req, res) => {
  try {
    const { approved_by } = req.body;
    const student = await IDCardStudent.findOneAndUpdate(
      { idcard_uuid: req.params.uuid },
      { $set: { card_status: 'approved', approved_by, approved_at: new Date() } },
      { new: true }
    );
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, result: student });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── 15. rejectStudent ────────────────────────────────────────────────────────

exports.rejectStudent = async (req, res) => {
  try {
    const student = await IDCardStudent.findOneAndUpdate(
      { idcard_uuid: req.params.uuid },
      {
        $set: {
          card_status: 'pending',
          student_name_override: '',
          student_photo_url: '',
        },
      },
      { new: true }
    );
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, result: student });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── 16. getPrintData ─────────────────────────────────────────────────────────

exports.getPrintData = async (req, res) => {
  try {
    const status = req.query.status || 'approved';
    const project = await IDCardProject.findOne({ project_uuid: req.params.uuid });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const students = await IDCardStudent.find({
      project_uuid: req.params.uuid,
      card_status: status,
    }).sort({ class_name: 1, roll_number: 1 });

    res.json({ success: true, result: { project, students } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Expose multer middlewares ────────────────────────────────────────────────

exports.multerUpload = multerUpload;
exports.multerBulkUpload = multerBulkUpload;
