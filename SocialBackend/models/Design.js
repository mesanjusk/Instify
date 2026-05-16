const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const designSchema = new mongoose.Schema({
  design_uuid: { type: String, default: uuidv4, unique: true },
  institute_uuid: { type: String, required: true, index: true },
  name: { type: String, default: 'Untitled Design' },
  docType: { type: String, enum: ['id_card', 'certificate', 'result', 'admit_card'], required: true },
  templateId: { type: String },
  canvasJSON: { type: String },
  thumbnail: { type: String },
  created_by: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Design', designSchema);
