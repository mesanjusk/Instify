const mongoose = require('mongoose');

const LidMappingSchema = new mongoose.Schema(
  {
    institute_uuid: { type: String, required: true, index: true },
    lid: { type: String, required: true },   // LID digits only e.g. "369585299480"
    phone: { type: String, required: true }, // actual phone digits e.g. "919399140933"
  },
  { timestamps: true }
);

LidMappingSchema.index({ institute_uuid: 1, lid: 1 }, { unique: true });

module.exports = mongoose.models.LidMapping || mongoose.model('LidMapping', LidMappingSchema);
