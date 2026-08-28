const mongoose = require('mongoose');

const responsibleAILogSchema = new mongoose.Schema({
  caseId: { type: String, required: true },
  diagnosisId: String,
  reviewId: String,
  action: { type: String, enum: ['approved', 'corrected', 'rejected'], required: true },
  aiConfidence: String,
  humanOverride: { type: Boolean, default: false },
  reviewerName: String,
  details: String
}, { timestamps: true });

module.exports = mongoose.model('ResponsibleAILog', responsibleAILogSchema);
