const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema({
  education: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Education', educationSchema);
