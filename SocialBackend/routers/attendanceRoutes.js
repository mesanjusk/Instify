// File: routes/attendance.js
const express = require("express");
const router = express.Router();
const Attendance = require("../models/Attendance");
const User = require("../models/User");
const { v4: uuid } = require("uuid");

router.post('/addAttendance/:institute_uuid', async (req, res) => {
  const { User_name, Type, Status, Time } = req.body;
  const { institute_uuid } = req.params;

  if (!User_name || !Type || !Status || !Time || !institute_uuid) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  const currentDate = new Date().toISOString().split('T')[0];

  try {
    const user = await User.findOne({ name: User_name.trim() });
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    let todayAttendance = await Attendance.findOne({
      User_uuid: user.user_uuid,
      Date: currentDate
    });

    if (todayAttendance) {
      const existingFlow = todayAttendance.User.map(u => u.Type);
      if (existingFlow.includes(Type)) {
        return res.status(409).json({ success: false, message: `${Type} already marked for today.` });
      }
      todayAttendance.User.push({ Type, Time, CreatedAt: new Date().toISOString() });
      await todayAttendance.save();
      return res.json({ success: true, message: "Attendance updated for today." });
    }

    const lastRecord = await Attendance.findOne().sort({ Attendance_Record_ID: -1 });
    const newId = lastRecord ? lastRecord.Attendance_Record_ID + 1 : 1;

    const newAttendance = new Attendance({
      Attendance_uuid: uuid(),
      Attendance_Record_ID: newId,
      User_uuid: user.user_uuid,
      User_name: user.name,
      Date: currentDate,
      institute_uuid,  // from params
      Status,
      User: [{ Type, Time, CreatedAt: new Date().toISOString() }]
    });

    await newAttendance.save();
    res.json({ success: true, message: "New attendance recorded successfully." });

  } catch (error) {
    console.error("Error saving attendance:", error);
    res.status(500).json({ success: false, message: "Error saving attendance: " + error.message });
  }
});

// ✅ GET /attendance/GetAttendanceList
router.get("/GetAttendanceList", async (req, res) => {
  try {
    const data = await Attendance.find({});
    res.json(data.length ? { success: true, result: data } : { success: false, message: "No records found" });
  } catch (err) {
    console.error("Error fetching attendance:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✅ GET /attendance/getTodayAttendance/:userName
router.get("/getTodayAttendance/:userName", async (req, res) => {
  try {
    const { userName } = req.params;
    const today = new Date().toISOString().split('T')[0];
    const user = await User.findOne({ name: userName.trim() });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const todayAttendance = await Attendance.findOne({
      User_uuid: user.user_uuid,
      Date: today
    });

    if (!todayAttendance) return res.json({ success: true, flow: [] });

    const flow = todayAttendance.User.map(entry => entry.Type);
    res.json({ success: true, flow });
  } catch (err) {
    console.error("Error fetching today's attendance:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
