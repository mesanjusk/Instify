// ========== controllers/admissionController.js ==========

const Admission = require('../models/Admission');
const { v4: uuidv4 } = require('uuid');

// Create Admission
exports.createAdmission = async (req, res) => {
  try {
    const { student_uuid, institute_uuid, course } = req.body;

    if (!student_uuid || !institute_uuid || !course) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const admission = new Admission({
      uuid: uuidv4(),
      ...req.body,
      createdBy: req.user ? req.user.name : 'System'
    });
    await admission.save();
    res.status(201).json({ success: true, data: admission });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Get Admission by student_uuid
exports.getAdmissionByStudentUUID = async (req, res) => {
  try {
    const admission = await Admission.findOne({ student_uuid: req.params.student_uuid });
    if (!admission) {
      return res.status(404).json({ success: false, message: 'Admission not found' });
    }

    res.json({ success: true, admission });
  } catch (error) {
    console.error("Error fetching admission:", error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Get All Admissions (with optional filters)
exports.getAdmissions = async (req, res) => {
  try {
    const { institute_uuid, course, batch } = req.query;

    const match = {};
    if (institute_uuid) match.institute_uuid = institute_uuid;
    if (course) match.course = course;
    if (batch) match.batch = batch;

    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: "students",
          localField: "student_uuid",
          foreignField: "uuid",
          as: "student"
        }
      },
      {
        $lookup: {
          from: "fees",
          localField: "uuid", 
          foreignField: "admission_uuid",
          as: "fees"
        }
      },
      { $unwind: "$student" },
      { $unwind: { path: "$fees", preserveNullAndEmptyArrays: true } }
    ];

    const admissions = await Admission.aggregate(pipeline);
    res.json({ success: true, data: admissions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


// Get Single Admission
exports.getAdmission = async (req, res) => {
  try {
    const admission = await Admission.findOne({ uuid: req.params.uuid });
    if (!admission) return res.status(404).json({ success: false, message: 'Admission not found' });
    res.json({ success: true, data: admission });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Update Admission
exports.updateAdmission = async (req, res) => {
  try {
    const admission = await Admission.findOneAndUpdate(
      { uuid: req.params.uuid },
      {
        ...req.body,
        updatedAt: new Date(),
        updatedBy: req.user ? req.user.name : 'System'
      },
      { new: true }
    );

    if (!admission) return res.status(404).json({ success: false, message: 'Admission not found' });

    res.json({ success: true, data: admission });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};