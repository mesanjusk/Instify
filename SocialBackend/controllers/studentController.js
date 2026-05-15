const Student = require('../models/Student');
const { v4: uuidv4 } = require('uuid');

// Create Student
exports.createStudent = async (req, res) => {
  try {
    const { institute_uuid, firstName, middleName, lastName, ...rest } = req.body;

    const student = new Student({
      uuid: uuidv4(),
      institute_uuid,
      firstName,
      middleName,
      lastName,
      ...rest,
      createdBy: req.user ? req.user.name : 'System'
    });

    await student.save();
    res.status(201).json({ success: true, data: student });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Get All Students
exports.getStudents = async (req, res) => {
  try {
    const { institute_uuid } = req.query;
    const students = await Student.find(institute_uuid ? { institute_uuid } : {});
    res.json({ success: true, data: students });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Get Single Student
exports.getStudent = async (req, res) => {
  try {
    const student = await Student.findOne({ uuid: req.params.uuid });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, data: student });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Update Student
exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findOneAndUpdate(
      { uuid: req.params.uuid },
      {
        ...req.body,
        updatedAt: new Date(),
        updatedBy: req.user ? req.user.name : 'System'
      },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.json({ success: true, data: student });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Check if mobile number exists for given institute
exports.checkMobileNumber = async (req, res) => {
  try {
    const { institute_uuid, mobileSelf } = req.query;

    if (!institute_uuid || !mobileSelf) {
      return res.status(400).json({ success: false, message: 'Missing institute_uuid or mobileSelf' });
    }

    const student = await Student.findOne({ institute_uuid, mobileSelf });

    if (student) {
      return res.status(200).json({ exists: true });
    }

    return res.status(200).json({ exists: false });
  } catch (error) {
    console.error('Error in checkMobileNumber:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// DELETE student
exports.deleteStudent = async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.uuid);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Delete student failed:', err);
    res.status(500).json({ error: 'Delete failed' });
  }
};
