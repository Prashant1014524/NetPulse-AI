const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
  caseId: { type: String, required: true, unique: true },
  symptom: { type: String, required: true },
  topology: { type: String, required: true },
  showOutput: { type: String, required: true },
  expectedFault: { type: String, required: true },
  osiLayer: { type: String, required: true },
  concept: { type: String, required: true },
  severity: { type: String, enum: ['critical', 'high', 'medium', 'low'], required: true },
  category: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Case', caseSchema);
