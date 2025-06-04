const mongoose = require('mongoose');

const FileTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['image', 'video'],
    unique: true
  },
  enabled: {
    type: Boolean,
    default: true
  },
  useWeightRules: {
    type: Boolean,
    default: false
  },
  extensions: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FileType', FileTypeSchema); 