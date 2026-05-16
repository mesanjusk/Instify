const mongoose = require('mongoose');

// Stores Baileys auth-state files in MongoDB so sessions survive server restarts/deploys.
// `files` is a plain object: { filename: fileContentString }
const waSessionSchema = new mongoose.Schema({
  institute_uuid: { type: String, required: true, unique: true, index: true },
  files: { type: mongoose.Schema.Types.Mixed, default: {} },
  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('WASession', waSessionSchema);
