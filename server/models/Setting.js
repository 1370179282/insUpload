const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
  outputPath: {
    type: String,
    required: true,
    default: ''
  },
  materialRootPath: {
    type: String,
    required: true,
    default: ''
  },
  videoRootPath: {
    type: String,
    default: ''
  },
  queueSize: {
    type: Number,
    default: 100
  },
  defaultFileType: {
    type: String,
    enum: ['image', 'video', 'both'],
    default: 'image'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Setting', SettingSchema); 