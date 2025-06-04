const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  path: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['未上传', '已上传'],
    default: '未上传'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Image', ImageSchema); 