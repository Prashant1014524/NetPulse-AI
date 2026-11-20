import mongoose, { Schema } from 'mongoose';

export interface IDiagnosis {
  caseId: string;
  root_cause: string;
  confidence: 'high' | 'medium' | 'low';
  evidence: string[];
  osi_layer?: string;
  concept?: string;
  next_command?: string;
  fix_steps: string[];
  verification_steps?: string;
  checkerFindings: Record<string, unknown>[];
  mode: 'ai' | 'demo';
  model?: string;
}

const diagnosisSchema = new Schema<IDiagnosis>({
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

export default mongoose.models.Diagnosis || mongoose.model<IDiagnosis>('Diagnosis', diagnosisSchema);
