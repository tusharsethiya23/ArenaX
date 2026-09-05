const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  industry: {
    type: String,
    default: '',
  },
  website: {
    type: String,
    default: '',
  },
  logo: {
    type: String,
    default: '',
  },
}, { timestamps: true });

module.exports = mongoose.model('Brand', brandSchema);