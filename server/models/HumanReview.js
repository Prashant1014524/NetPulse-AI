const mongoose = require('mongoose');

const humanReviewSchema = new mongoose.Schema({
  caseId: { type: String, required: true },
  diagnosisId: String,
  decision: { type: String, enum: ['approved', 'corrected', 'rejected'], required: true },
  reviewerNotes: String,
  correctedDiagnosis: String,
  reviewerName: { type: String, default: 'Anonymous Reviewer' }
}, { timestamps: true });

module.exports = mongoose.model('HumanReview', humanReviewSchema);
