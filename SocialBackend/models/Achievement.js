const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const achievementSchema = new mongoose.Schema({
  uuid: { type: String, default: uuidv4, unique: true },
  institute_uuid: { type: String, required: true, index: true },
  student_uuid: { type: String, required: true },

  type: {
    type: String,
    required: true,
    enum: ['birthday', 'star_of_month', 'top_performer', 'best_attendance', 'course_completion', 'exam_topper', 'anniversary', 'custom'],
  },

  title: { type: String },
  description: { type: String },

  month: { type: Number },
  year: { type: Number },
  awardDate: { type: Date, default: Date.now },

  awardedBy: { type: String },
  awardedByRole: { type: String },

  messageSent: { type: Boolean, default: false },
  messageSentAt: { type: Date },
}, { timestamps: true });

achievementSchema.index({ institute_uuid: 1, type: 1, month: 1, year: 1 });
achievementSchema.index({ student_uuid: 1 });

module.exports = mongoose.model('Achievement', achievementSchema);
