const mongoose = require('mongoose');

const BrandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  weight: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 50
  },
  path: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Brand', BrandSchema); 