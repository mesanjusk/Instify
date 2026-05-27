const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Admission = require('../models/Admission');
const Achievement = require('../models/Achievement');
const MessageTemplate = require('../models/MessageTemplate');
const baileysService = require('../services/baileysService');

// ── helpers ──────────────────────────────────────────────────────────
function toJid(mobile) {
  const d = (mobile || '').replace(/\D/g, '');
  if (d.length < 10) return null;
  return d.length === 10 ? `91${d}` : d;
}

function waLink(mobile, message) {
  const jid = toJid(mobile);
  if (!jid) return null;
  return `https://wa.me/${jid}?text=${encodeURIComponent(message)}`;
}

function fillTemplate(tpl, vars) {
  return tpl.replace(/{{(\w+)}}/g, (_, k) => vars[k] || '');
}

const DEFAULT_GREETING_TEMPLATES = {
  birthday: '🎂 Happy Birthday, *{{name}}*!\nWishing you a wonderful day filled with joy and success.\n– {{institute}} Team',
  star_of_month: '🌟 Congratulations, *{{name}}*!\nYou have been selected as the *Star of the Month* for {{month}} {{year}}.\nKeep up the fantastic work!\n– {{institute}} Team',
  top_performer: '🏆 Well done, *{{name}}*!\nYou are recognised as a *Top Performer* this month.\nYour hard work and dedication are truly inspiring!\n– {{institute}} Team',
  best_attendance: '✅ Congratulations, *{{name}}*!\nYou have achieved *Best Attendance* this month.\nYour commitment to learning is commendable!\n– {{institute}}',
  course_completion: '🎓 Congratulations, *{{name}}*!\nYou have successfully completed the *{{course}}* course.\nWe wish you all the best in your future endeavours!\n– {{institute}} Team',
  exam_topper: '🥇 Excellent, *{{name}}*!\nYou have topped the *{{exam}}* examination.\nKeep shining and making us proud!\n– {{institute}} Team',
  anniversary: '🎊 Happy Learning Anniversary, *{{name}}*!\nIt has been {{years}} year(s) since you joined {{institute}}.\nThank you for being a part of our family!\n– {{institute}} Team',
  custom: '👏 Congratulations, *{{name}}*!\n{{description}}\n– {{institute}} Team',
};

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

async function getTemplate(institute_uuid, type) {
  try {
    const tpl = await MessageTemplate.findOne({ institute_uuid, key: `greeting_${type}` });
    return tpl ? tpl.body : DEFAULT_GREETING_TEMPLATES[type] || DEFAULT_GREETING_TEMPLATES.custom;
  } catch {
    return DEFAULT_GREETING_TEMPLATES[type] || DEFAULT_GREETING_TEMPLATES.custom;
  }
}

// ── GET /api/greetings/birthdays ─────────────────────────────────────
// Query: institute_uuid, date (YYYY-MM-DD, default today), course, school, batch
router.get('/birthdays', async (req, res) => {
  try {
    const { institute_uuid, date, course, school, batch } = req.query;
    if (!institute_uuid) return res.status(400).json({ success: false, message: 'institute_uuid required' });

    const targetDate = date ? new Date(date) : new Date();
    const month = targetDate.getMonth() + 1;
    const day = targetDate.getDate();

    // Build student filter
    const studentFilter = { institute_uuid };
    if (school) studentFilter.schoolName = { $regex: school, $options: 'i' };

    const students = await Student.find(studentFilter).lean();

    // Filter by birthday month+day
    let birthdayStudents = students.filter(s => {
      if (!s.dob) return false;
      const d = new Date(s.dob);
      return d.getMonth() + 1 === month && d.getDate() === day;
    });

    // If course or batch filter requested, cross-reference with admissions
    if (course || batch) {
      const admFilter = { institute_uuid };
      if (course) admFilter.course = { $regex: course, $options: 'i' };
      if (batch) admFilter.batchTime = { $regex: batch, $options: 'i' };
      const admissions = await Admission.find(admFilter, { student_uuid: 1, course: 1, batchTime: 1 }).lean();
      const admMap = {};
      admissions.forEach(a => { admMap[a.student_uuid] = a; });
      birthdayStudents = birthdayStudents.filter(s => admMap[s.uuid]);
      birthdayStudents = birthdayStudents.map(s => ({ ...s, admission: admMap[s.uuid] }));
    } else {
      // Attach latest admission info
      const uuids = birthdayStudents.map(s => s.uuid);
      const admissions = await Admission.find({ institute_uuid, student_uuid: { $in: uuids } }).lean();
      const admMap = {};
      admissions.forEach(a => { if (!admMap[a.student_uuid]) admMap[a.student_uuid] = a; });
      birthdayStudents = birthdayStudents.map(s => ({ ...s, admission: admMap[s.uuid] || null }));
    }

    // Build wa links preview
    const tplBody = await getTemplate(institute_uuid, 'birthday');
    const instituteName = 'Instify';

    const result = birthdayStudents.map(s => {
      const mobile = s.mobileSelf || s.mobileParent;
      const msg = fillTemplate(tplBody, {
        name: `${s.firstName} ${s.lastName || ''}`.trim(),
        institute: instituteName,
        course: s.admission?.course || '',
      });
      return {
        uuid: s.uuid,
        name: `${s.firstName} ${s.middleName || ''} ${s.lastName || ''}`.trim(),
        mobile,
        mobileSelf: s.mobileSelf,
        mobileParent: s.mobileParent,
        dob: s.dob,
        schoolName: s.schoolName,
        course: s.admission?.course || '',
        batch: s.admission?.batchTime || '',
        message: msg,
        waLink: mobile ? waLink(mobile, msg) : null,
      };
    });

    res.json({ success: true, count: result.length, result });
  } catch (err) {
    console.error('[Greetings] birthday error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/greetings/achievements ──────────────────────────────────
// Query: institute_uuid, type, month, year, course, school
router.get('/achievements', async (req, res) => {
  try {
    const { institute_uuid, type, month, year, course, school } = req.query;
    if (!institute_uuid) return res.status(400).json({ success: false, message: 'institute_uuid required' });

    const filter = { institute_uuid };
    if (type) filter.type = type;
    if (month) filter.month = Number(month);
    if (year) filter.year = Number(year);

    const achievements = await Achievement.find(filter).sort({ awardDate: -1 }).lean();

    // Enrich with student info
    const uuids = [...new Set(achievements.map(a => a.student_uuid))];
    const students = await Student.find({ uuid: { $in: uuids } }, {
      uuid: 1, firstName: 1, middleName: 1, lastName: 1, mobileSelf: 1, mobileParent: 1, schoolName: 1,
    }).lean();
    const studentMap = {};
    students.forEach(s => { studentMap[s.uuid] = s; });

    // Admissions for course/school filter
    let admMap = {};
    if (uuids.length) {
      const adms = await Admission.find({ institute_uuid, student_uuid: { $in: uuids } }).lean();
      adms.forEach(a => { if (!admMap[a.student_uuid]) admMap[a.student_uuid] = a; });
    }

    let result = achievements.map(a => {
      const s = studentMap[a.student_uuid] || {};
      const adm = admMap[a.student_uuid] || {};
      const mobile = s.mobileSelf || s.mobileParent;
      return {
        ...a,
        studentName: `${s.firstName || ''} ${s.middleName || ''} ${s.lastName || ''}`.trim(),
        mobile,
        mobileSelf: s.mobileSelf,
        mobileParent: s.mobileParent,
        schoolName: s.schoolName,
        course: adm.course || '',
        batch: adm.batchTime || '',
      };
    });

    // Apply course / school filter post-enrichment
    if (course) result = result.filter(r => r.course.toLowerCase().includes(course.toLowerCase()));
    if (school) result = result.filter(r => (r.schoolName || '').toLowerCase().includes(school.toLowerCase()));

    res.json({ success: true, count: result.length, result });
  } catch (err) {
    console.error('[Greetings] achievements error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/greetings/achievements ─────────────────────────────────
// Body: institute_uuid, student_uuid, type, title, description, month, year, awardedBy, awardedByRole
router.post('/achievements', async (req, res) => {
  try {
    const { institute_uuid, student_uuid, type, title, description, month, year, awardedBy, awardedByRole } = req.body;
    if (!institute_uuid || !student_uuid || !type)
      return res.status(400).json({ success: false, message: 'institute_uuid, student_uuid, type required' });

    const ach = await Achievement.create({
      institute_uuid, student_uuid, type,
      title: title || '',
      description: description || '',
      month: month || new Date().getMonth() + 1,
      year: year || new Date().getFullYear(),
      awardedBy, awardedByRole,
    });

    res.json({ success: true, result: ach });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/greetings/achievements/:id ────────────────────────────
router.delete('/achievements/:id', async (req, res) => {
  try {
    await Achievement.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/greetings/send-baileys ─────────────────────────────────
// Body: institute_uuid, student_uuid, type, achievementId (optional), mobile, message
router.post('/send-baileys', async (req, res) => {
  try {
    const { institute_uuid, student_uuid, type, achievementId, mobile, message } = req.body;
    if (!institute_uuid || !mobile || !message)
      return res.status(400).json({ success: false, message: 'institute_uuid, mobile, message required' });

    if (baileysService.getStatus(institute_uuid) !== 'connected')
      return res.status(400).json({ success: false, message: 'WhatsApp not connected. Connect WhatsApp first.' });

    const jid = toJid(mobile);
    if (!jid) return res.status(400).json({ success: false, message: 'Invalid mobile number' });

    await baileysService.sendText(institute_uuid, jid, message);

    // Mark achievement as sent if provided
    if (achievementId) {
      await Achievement.findByIdAndUpdate(achievementId, { messageSent: true, messageSentAt: new Date() });
    }

    res.json({ success: true, message: 'Message sent!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/greetings/send-bulk-baileys ─────────────────────────────
// Body: institute_uuid, recipients: [{mobile, message}]
router.post('/send-bulk-baileys', async (req, res) => {
  try {
    const { institute_uuid, recipients } = req.body;
    if (!institute_uuid || !Array.isArray(recipients) || recipients.length === 0)
      return res.status(400).json({ success: false, message: 'institute_uuid and recipients[] required' });

    if (baileysService.getStatus(institute_uuid) !== 'connected')
      return res.status(400).json({ success: false, message: 'WhatsApp not connected. Connect WhatsApp first.' });

    const results = [];
    for (const r of recipients) {
      const jid = toJid(r.mobile);
      if (!jid) { results.push({ mobile: r.mobile, success: false, error: 'Invalid number' }); continue; }
      try {
        await baileysService.sendText(institute_uuid, jid, r.message);
        results.push({ mobile: r.mobile, success: true });
        // Small delay between messages
        await new Promise(resolve => setTimeout(resolve, 1500));
      } catch (e) {
        results.push({ mobile: r.mobile, success: false, error: e.message });
      }
    }

    const sent = results.filter(r => r.success).length;
    res.json({ success: true, sent, failed: results.length - sent, results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/greetings/wa-link ────────────────────────────────────────
// Query: mobile, message
router.get('/wa-link', (req, res) => {
  const { mobile, message } = req.query;
  if (!mobile || !message) return res.status(400).json({ success: false, message: 'mobile and message required' });
  const link = waLink(mobile, message);
  if (!link) return res.status(400).json({ success: false, message: 'Invalid mobile number' });
  res.json({ success: true, link });
});

// ── GET /api/greetings/templates ─────────────────────────────────────
router.get('/templates', async (req, res) => {
  try {
    const { institute_uuid } = req.query;
    if (!institute_uuid) return res.status(400).json({ success: false, message: 'institute_uuid required' });

    const keys = Object.keys(DEFAULT_GREETING_TEMPLATES).map(k => `greeting_${k}`);
    const saved = await MessageTemplate.find({ institute_uuid, key: { $in: keys } }).lean();
    const savedMap = {};
    saved.forEach(t => { savedMap[t.key] = t.body; });

    const result = Object.entries(DEFAULT_GREETING_TEMPLATES).map(([type, defaultBody]) => ({
      type,
      key: `greeting_${type}`,
      body: savedMap[`greeting_${type}`] || defaultBody,
      isCustom: !!savedMap[`greeting_${type}`],
    }));

    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/greetings/templates/:type ───────────────────────────────
router.put('/templates/:type', async (req, res) => {
  try {
    const { institute_uuid, body } = req.body;
    const { type } = req.params;
    if (!institute_uuid || !body) return res.status(400).json({ success: false, message: 'institute_uuid and body required' });

    await MessageTemplate.findOneAndUpdate(
      { institute_uuid, key: `greeting_${type}` },
      { institute_uuid, key: `greeting_${type}`, body },
      { upsert: true, new: true }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/greetings/students-for-award ─────────────────────────────
// Get students list for awarding achievements (with course+school filter)
router.get('/students-for-award', async (req, res) => {
  try {
    const { institute_uuid, course, school, batch, search } = req.query;
    if (!institute_uuid) return res.status(400).json({ success: false, message: 'institute_uuid required' });

    const studentFilter = { institute_uuid };
    if (school) studentFilter.schoolName = { $regex: school, $options: 'i' };
    if (search) {
      studentFilter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { mobileSelf: { $regex: search, $options: 'i' } },
      ];
    }

    let students = await Student.find(studentFilter).limit(200).lean();

    // Cross-filter with admissions if course/batch specified
    if (course || batch) {
      const admFilter = { institute_uuid };
      if (course) admFilter.course = { $regex: course, $options: 'i' };
      if (batch) admFilter.batchTime = { $regex: batch, $options: 'i' };
      const adms = await Admission.find(admFilter, { student_uuid: 1, course: 1, batchTime: 1 }).lean();
      const admMap = {};
      adms.forEach(a => { admMap[a.student_uuid] = a; });
      students = students.filter(s => admMap[s.uuid]).map(s => ({ ...s, admission: admMap[s.uuid] }));
    } else {
      const uuids = students.map(s => s.uuid);
      const adms = await Admission.find({ institute_uuid, student_uuid: { $in: uuids } }).lean();
      const admMap = {};
      adms.forEach(a => { if (!admMap[a.student_uuid]) admMap[a.student_uuid] = a; });
      students = students.map(s => ({ ...s, admission: admMap[s.uuid] || null }));
    }

    const result = students.map(s => ({
      uuid: s.uuid,
      name: `${s.firstName} ${s.middleName || ''} ${s.lastName || ''}`.trim(),
      mobile: s.mobileSelf || s.mobileParent,
      mobileSelf: s.mobileSelf,
      mobileParent: s.mobileParent,
      schoolName: s.schoolName,
      dob: s.dob,
      course: s.admission?.course || '',
      batch: s.admission?.batchTime || '',
    }));

    res.json({ success: true, count: result.length, result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
