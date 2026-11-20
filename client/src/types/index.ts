export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type Confidence = 'high' | 'medium' | 'low';
export type ReviewDecision = 'approved' | 'corrected' | 'rejected';

export interface NetworkCase {
  caseId: string;
  symptom: string;
  topology: string;
  showOutput: string;
  category: string;
  severity: Severity;
  osiLayer: string;
  concept: string;
  expectedFault: string;
}

export interface CheckerFinding {
  rule: string;
  severity: string;
  message: string;
  evidence: string;
  recommendation: string;
}

export interface Diagnosis {
  _id?: string;
  caseId: string;
  root_cause: string;
  confidence: Confidence;
  evidence: string[];
  osi_layer: string;
  concept: string;
  next_command?: string;
  fix_steps: string[];
  verification_steps?: string;
  checkerFindings: CheckerFinding[];
  mode: 'ai' | 'demo';
  model?: string;
  cached?: boolean;
}

export interface HumanReview {
  _id?: string;
  caseId: string;
  diagnosisId?: string;
  decision: ReviewDecision;
  reviewerNotes?: string;
  correctedDiagnosis?: string;
  aiConfidence?: Confidence;
  createdAt?: string;
}

export interface DashboardStats {
  totalCases: number;
  diagnosedCases: number;
  approvedCount: number;
  rejectedCount: number;
  correctedCount: number;
  avgConfidence: string;
  categoryBreakdown: Record<string, number>;
  severityBreakdown: Record<string, number>;
}

export interface AuditLog {
  _id?: string;
  caseId: string;
  decision: ReviewDecision;
  reviewerNotes?: string;
  correctedDiagnosis?: string;
  aiConfidence?: Confidence;
  createdAt?: string;
}

export interface EvaluationData {
  totalDiagnosed: number;
  humanAgreementRate: number;
  categoryBreakdown: Record<string, number>;
  severityBreakdown: Record<string, number>;
}
