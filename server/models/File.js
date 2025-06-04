const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['image', 'video'],
    default: 'image'
  },
  brand: {
    type: String,
    trim: true,
    default: ''
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

module.exports = mongoose.model('File', FileSchema); 