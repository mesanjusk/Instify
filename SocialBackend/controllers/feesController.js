const Fees = require('../models/Fees');
const { v4: uuidv4 } = require('uuid');

// Utility: Validate payload
const validateFeesPayload = (body) => {
  const requiredFields = ['institute_uuid', 'student_uuid', 'fees', 'total'];
  for (const field of requiredFields) {
    if (!body[field]) return `${field} is required`;
  }
  if (isNaN(body.fees) || isNaN(body.total)) return 'Fees and total must be numbers';
  return null;
};

// Create Fees Record
exports.createFees = async (req, res) => {
  try {
    const validationError = validateFeesPayload(req.body);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const fees = new Fees({
      uuid: uuidv4(),
      ...req.body,
      createdBy: req.user ? req.user.name : 'System'
    });
    await fees.save();
    res.status(201).json({ success: true, data: fees });
  } catch (error) {
    console.error('❌ createFees error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Get All Fees Records (optionally filter by date)
exports.getFees = async (req, res) => {
  try {
    const { institute_uuid, date } = req.query;

    const match = {};
    if (institute_uuid) match.institute_uuid = institute_uuid;

    const feesWithStudent = await Fees.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "students",
          localField: "student_uuid",
          foreignField: "uuid",
          as: "student"
        }
      },
      { $unwind: { path: "$student", preserveNullAndEmptyArrays: true } }
    ]);

    const result = [];

    for (const fee of feesWithStudent) {
     const todayPlans = (fee.installmentPlan || []).filter(plan => {
  if (!plan.dueDate || !date) return false;
  const planDateObj = new Date(plan.dueDate);
  const reqDateObj = new Date(date);
  if (isNaN(planDateObj.getTime()) || isNaN(reqDateObj.getTime())) return false;
  const planDate = planDateObj.toISOString().split('T')[0];
  const reqDateStr = reqDateObj.toISOString().split('T')[0];
  return planDate === reqDateStr;
});


      if (todayPlans.length > 0) {
        const fullName = `${fee.student?.firstName || ''} ${fee.student?.middleName || ''} ${fee.student?.lastName || ''}`.trim() || 'Unknown Student';
        result.push({
          studentName: fullName,
          admissionId: fee.admission_uuid || 'N/A',
          installmentPlan: todayPlans
        });
      }
    }

    res.json(result);
  } catch (error) {
    console.error("❌ getFees error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


// Get Single Fees Record
exports.getFee = async (req, res) => {
  try {
    const fee = await Fees.findOne({ uuid: req.params.uuid });
    if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found' });
    res.json({ success: true, data: fee });
  } catch (error) {
    console.error('❌ getFee error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Get Due-Date Wise Receivables
exports.getFeesReceivablesByDueDate = async (req, res) => {
  try {
    const { institute_uuid } = req.query;
    if (!institute_uuid) {
      return res.status(400).json({ success: false, message: 'institute_uuid is required' });
    }

    const feesRecords = await Fees.find({ institute_uuid })
      .sort({ dueDate: 1 });

    const formatted = feesRecords.map(fee => ({
      student_uuid: fee.student_uuid,
      dueDate: fee.dueDate,
      total: fee.total,
      feesPaid: fee.fees,
      balance: fee.total - fee.fees
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('❌ getFeesReceivablesByDueDate error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


// Update Fees Record
exports.updateFees = async (req, res) => {
  try {
    const updatedData = {
      ...req.body,
      updatedAt: new Date(),
      updatedBy: req.user ? req.user.name : 'System'
    };

    const fee = await Fees.findOneAndUpdate(
      { uuid: req.params.uuid },
      updatedData,
      { new: true }
    );

    if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found' });

    res.json({ success: true, data: fee });
  } catch (error) {
    console.error('❌ updateFees error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


// Get Fees Record by Admission UUID
exports.getFeesByAdmissionUuid = async (req, res) => {
  try {
    const { admission_uuid } = req.params;

    const fee = await Fees.findOne({ admission_uuid });

    if (!fee) {
      return res.status(404).json({ success: false, message: 'Fee record not found for this admission' });
    }

    res.json({ success: true, data: fee });
  } catch (error) {
    console.error('❌ getFeesByAdmissionUuid error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
