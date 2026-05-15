const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const courseCatgeorySchema = new mongoose.Schema({
  couseCategory_uuid: {
    type: String,
    default: uuidv4,
    unique: true
  },

  name: {
    type: String,
    required: true
  },

}, { timestamps: true });


module.exports = mongoose.model('CourseCategory', courseCatgeorySchema);
