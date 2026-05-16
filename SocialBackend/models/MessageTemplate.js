const mongoose = require('mongoose');

const messageTemplateSchema = new mongoose.Schema({
  institute_uuid: { type: String, required: true, index: true },
  key: { type: String, required: true }, // 'followup' | 'fees' | 'birthday' | 'magic_link'
  body: { type: String, required: true },
}, { timestamps: true });

messageTemplateSchema.index({ institute_uuid: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('MessageTemplate', messageTemplateSchema);
