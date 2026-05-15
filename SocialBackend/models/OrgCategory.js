const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');

const orgCategorySchema = new mongoose.Schema({
  uuid: {
    type: String,
    default: uuidv4,
    unique: true,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  description: String,
}, { timestamps: true });

module.exports = mongoose.model('OrgCategory', orgCategorySchema);
