const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const fieldSchema = new mongoose.Schema({
  field_uuid: { type: String, default: uuidv4 },
  label: { type: String, required: true },
  type: {
    type: String,
    enum: ['text', 'email', 'phone', 'number', 'textarea', 'dropdown', 'radio', 'checkbox', 'date'],
    default: 'text',
  },
  options: [String],
  required: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
}, { _id: false });

const formSchema = new mongoose.Schema({
  form_uuid: { type: String, default: uuidv4, unique: true },
  institute_uuid: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  slug: { type: String, required: true },
  fields: [fieldSchema],
  isActive: { type: Boolean, default: true },
  successMessage: { type: String, default: 'Thank you! Your response has been recorded.' },
  createdBy: String,
}, { timestamps: true });

formSchema.index({ institute_uuid: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model('Form', formSchema);
