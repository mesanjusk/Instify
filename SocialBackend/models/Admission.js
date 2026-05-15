const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const admissionSchema = new mongoose.Schema({
  uuid: { type: String, default: uuidv4, unique: true },
  institute_uuid: { type: String, required: true },
  student_uuid: { type: String, required: true },

  admissionDate: { type: Date, default: Date.now },
  course: { type: String, required: true },
  batchTime: String,
  examEvent: String,

    confirmationStatus: {
    type: String,
    enum: ['Confirmed', 'DropOut', ''], 
    default: '',
  },
  dropoutReason: {
    type: String,
    default: '',
  },

  createdBy: String,
}, { timestamps: true });

// Indexes for fast report queries
admissionSchema.index({ uuid: 1 }, { unique: true });
admissionSchema.index({ institute_uuid: 1 });
admissionSchema.index({ student_uuid: 1 });
admissionSchema.index({ course: 1 });

module.exports = mongoose.model('Admission', admissionSchema);
