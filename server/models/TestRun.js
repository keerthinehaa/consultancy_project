const mongoose = require('mongoose');

const TestRunSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  documentName: String,
  summary: {
    passed: Number,
    failed: Number,
    total: Number
  },
  details: [{
    title: String,
    status: String,
    duration: Number,
    error: String
  }]
});

module.exports = mongoose.model('TestRun', TestRunSchema);