const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  Batch_uuid: { type: String },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  timing: {
    type: String,
    trim: true
  },
}, { timestamps: true });

module.exports = mongoose.model('Batch', batchSchema);
