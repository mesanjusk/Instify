const Lead = require('../models/Lead');
const Student = require('../models/Student');
const { v4: uuidv4 } = require('uuid');

exports.createLead = async (req, res) => {
  try {
    const {
      institute_uuid,
      student_uuid,
      studentData,
      admission_uuid,
      enquiryDate,
      followupDate,
      course,
      referredBy,
      createdBy,
      followups
    } = req.body;

    if (!institute_uuid || !studentData?.mobileSelf) {
      return res.status(400).json({
        success: false,
        message: 'Missing required data: institute_uuid or mobileSelf',
      });
    }

    const existingStudent = await Student.findOne({
      institute_uuid,
      mobileSelf: studentData.mobileSelf,
    });

    if (existingStudent) {
      const existingLead = await Lead.findOne({
        student_uuid: existingStudent.uuid,
        institute_uuid,
      });

      if (existingLead) {
        return res.status(409).json({
          success: false,
          message: 'Lead with this mobile number already exists in this institute.',
        });
      }
    }

    let student = existingStudent;

    if (!student) {
      student = new Student({
        uuid: uuidv4(),
        institute_uuid,
        ...studentData,
        course: studentData.course,
        createdBy: req.user ? req.user.name : 'System',
      });
      await student.save();
    }

    const lead = new Lead({
      Lead_uuid: uuidv4(),
      institute_uuid,
      student_uuid: student.uuid,
      course: course || studentData?.course || student?.course,
      admission_uuid: admission_uuid || null,
      enquiryDate: enquiryDate || new Date(),
      followupDate: followupDate || new Date(),
      referredBy: referredBy || '',
      followups: Array.isArray(followups) ? followups : [],
      createdBy: createdBy || (req.user ? req.user.name : 'System'),
    });

    await lead.save();

    res.status(201).json({ success: true, data: { lead, student } });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getLeads = async (req, res) => {
  try {
    const { institute_uuid, filterBy, page = 1, limit = 50 } = req.query;

    const match = { $or: [{ admission_uuid: { $exists: false } }, { admission_uuid: null }, { admission_uuid: '' }] };
    if (institute_uuid) match.institute_uuid = institute_uuid;

    if (filterBy === 'today') {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      match.followupDate = { $gte: start, $lte: end };
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSize = Math.min(200, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * pageSize;

    const [leads, total] = await Promise.all([
      Lead.aggregate([
        { $match: match },
        {
          $lookup: {
            from: 'students',
            localField: 'student_uuid',
            foreignField: 'uuid',
            as: 'studentData',
          },
        },
        { $unwind: '$studentData' },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: pageSize },
      ]),
      Lead.countDocuments(match),
    ]);

    res.json({
      success: true,
      data: leads,
      pagination: { page: pageNum, limit: pageSize, total, pages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


// Get Single Lead
exports.getLead = async (req, res) => {
  try {
    const lead = await Lead.findOne({ Lead_uuid: req.params.uuid });

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    res.json({ success: true, data: lead });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


// Update Lead Status and add followup entry
exports.updateLeadStatus = async (req, res) => {
  try {
    const { uuid: Lead_uuid } = req.params;
    const { leadStatus, remark, createdBy = 'System' } = req.body;

    const validStatuses = ['open', 'follow-up', 'converted', 'lost'];
    if (!validStatuses.includes(leadStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid lead status' });
    }

    const lead = await Lead.findOne({ Lead_uuid });
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    lead.leadStatus = leadStatus;

    lead.followups.push({
      date: new Date(),
      status: leadStatus,
      remark: remark || '',
      createdBy,
      createdAt: new Date()
    });

    await lead.save();

    res.json({ success: true, message: 'Lead status and followup updated' });
  } catch (error) {
    console.error('Error updating lead status:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.editLead = async (req, res) => {
  try {
    const { uuid } = req.params;
    const { studentData, course } = req.body;

    const lead = await Lead.findOne({ Lead_uuid: uuid });
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    lead.course = course;

    if (lead.student_uuid && studentData) {
      await Student.findOneAndUpdate(
        { uuid: lead.student_uuid },
        { ...studentData },
        { new: true }
      );
    }

    await lead.save();
    res.json({ success: true, message: 'Lead updated successfully' });
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findOneAndDelete({ Lead_uuid: req.params.uuid });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, message: 'Lead deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.bulkDeleteLeads = async (req, res) => {
  try {
    const { uuids } = req.body;
    if (!Array.isArray(uuids) || uuids.length === 0) {
      return res.status(400).json({ success: false, message: 'uuids array required' });
    }
    const result = await Lead.deleteMany({ Lead_uuid: { $in: uuids } });
    res.json({ success: true, deleted: result.deletedCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

