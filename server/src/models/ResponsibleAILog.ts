import mongoose, { Schema } from 'mongoose';

export interface IResponsibleAILog {
  caseId: string;
  diagnosisId?: string;
  reviewId?: string;
  action: 'approved' | 'corrected' | 'rejected';
  aiConfidence?: string;
  humanOverride: boolean;
  reviewerName?: string;
  details?: string;
}

const responsibleAILogSchema = new Schema<IResponsibleAILog>({
  caseId: { type: String, required: true },
  diagnosisId: String,
  reviewId: String,
  action: { type: String, enum: ['approved', 'corrected', 'rejected'], required: true },
  aiConfidence: String,
  humanOverride: { type: Boolean, default: false },
  reviewerName: String,
  details: String
}, { timestamps: true });

export default mongoose.models.ResponsibleAILog || mongoose.model<IResponsibleAILog>('ResponsibleAILog', responsibleAILogSchema);
