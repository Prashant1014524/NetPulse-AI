const mongoose = require('mongoose');

const diagnosisSchema = new mongoose.Schema({
  caseId: { type: String, required: true },
  root_cause: { type: String, required: true },
  confidence: { type: String, enum: ['high', 'medium', 'low'], required: true },
  evidence: [String],
  osi_layer: String,
  concept: String,
  next_command: String,
  fix_steps: [String],
  verification_steps: String,
  checkerFindings: [Object],
  mode: { type: String, enum: ['ai', 'demo'], default: 'demo' },
  model: String
}, { timestamps: true });

module.exports = mongoose.model('Diagnosis', diagnosisSchema);
