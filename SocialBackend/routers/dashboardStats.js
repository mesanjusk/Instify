const express = require('express');
const router = express.Router();

const Student = require('../models/Student');
const Admission = require('../models/Admission');
const Course = require('../models/Course');
const Lead = require('../models/Lead');
const Fees = require('../models/Fees');
const Followup = require('../models/Lead');
const Attendance = require('../models/Attendance');

// Get today's start and end date
function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

router.get('/', async (req, res) => {
  try {
    const { institute_uuid } = req.query;
    const { start, end } = getTodayRange();

    if (!institute_uuid) {
      return res.status(400).json({ error: 'Missing institute_uuid' });
    }

const feesRecords = await Fees.find({ institute_uuid });

let todayCollection = 0;

const istNow = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
const todayStr = new Date(istNow).toISOString().split('T')[0];


feesRecords.forEach(fee => {
  (fee.installmentPlan || []).forEach(plan => {
    const dueDate = (plan.dueDate || '').slice(0, 10);
    if (dueDate === todayStr) {
      todayCollection += Number(plan.amount || 0);
    }
  });
});


    const [
      students,
      admissionsCount,
      enquiries,
      attendanceList
    ] = await Promise.all([
      Student.countDocuments({ institute_uuid }),
      Admission.countDocuments({ institute_uuid }),
      Lead.countDocuments({ institute_uuid }),
      Attendance.find({ institute_uuid, date: { $gte: start, $lte: end } })
        .select('name status -_id')
        .limit(8)
    ]);

 const followupToday = await Followup.countDocuments({
  institute_uuid,
  followupDate: { $gte: start, $lte: end }
});

    res.json({
      students,
      admissions: admissionsCount,
      courses: await Course.countDocuments(), 
      enquiries,
      feesToday: todayCollection,
      followupToday,
      attendance: attendanceList
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Dashboard stats error' });
  }
});


module.exports = router;
