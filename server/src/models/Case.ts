import mongoose, { Schema } from 'mongoose';

export interface ICase {
  caseId: string;
  symptom: string;
  topology: string;
  showOutput: string;
  expectedFault: string;
  osiLayer: string;
  concept: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
}

const caseSchema = new Schema<ICase>({
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

export default mongoose.models.Case || mongoose.model<ICase>('Case', caseSchema);
