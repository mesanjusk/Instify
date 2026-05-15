const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const courseSchema = new mongoose.Schema({
  Course_uuid: {
    type: String,
    default: uuidv4,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  courseFees: String,
  examFees: String,
  duration: String,
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
