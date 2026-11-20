import mongoose, { Schema } from 'mongoose';

export interface IHumanReview {
  caseId: string;
  diagnosisId?: string;
  decision: 'approved' | 'corrected' | 'rejected';
  reviewerNotes?: string;
  correctedDiagnosis?: string;
  reviewerName: string;
}

const humanReviewSchema = new Schema<IHumanReview>({
  caseId: { type: String, required: true },
  diagnosisId: String,
  decision: { type: String, enum: ['approved', 'corrected', 'rejected'], required: true },
  reviewerNotes: String,
  correctedDiagnosis: String,
  reviewerName: { type: String, default: 'Anonymous Reviewer' }
}, { timestamps: true });

export default mongoose.models.HumanReview || mongoose.model<IHumanReview>('HumanReview', humanReviewSchema);
