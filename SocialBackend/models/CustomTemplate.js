const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const customTemplateSchema = new mongoose.Schema({
  template_uuid: { type: String, default: uuidv4, unique: true },
  institute_uuid: { type: String, required: true, index: true },
  name: { type: String, required: true },
  docType: { type: String, enum: ['id_card', 'certificate', 'result', 'admit_card', 'other'], default: 'other' },
  imageUrl: { type: String, required: true },
  thumbUrl: { type: String },
  created_by: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('CustomTemplate', customTemplateSchema);
