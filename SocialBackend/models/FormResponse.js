const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const formResponseSchema = new mongoose.Schema({
  response_uuid: { type: String, default: uuidv4, unique: true },
  form_uuid: { type: String, required: true },
  institute_uuid: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  ip: String,
}, { timestamps: true });

formResponseSchema.index({ form_uuid: 1 });
formResponseSchema.index({ institute_uuid: 1 });

module.exports = mongoose.model('FormResponse', formResponseSchema);
