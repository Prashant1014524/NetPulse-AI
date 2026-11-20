export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type Confidence = 'high' | 'medium' | 'low';
export type ReviewDecision = 'approved' | 'corrected' | 'rejected';
export type Category = 'Interface' | 'VLAN' | 'Trunk' | 'Routing' | 'OSPF' | 'BGP' | 'DHCP' | 'DNS' | 'ACL' | 'NAT' | 'Wireless' | 'Voice' | 'Security';

export interface NetworkCase {
  caseId: string;
  symptom: string;
  topology: string;
  showOutput: string;
  category: Category;
  severity: Severity;
  osiLayer: string;
  concept: string;
  expectedFault: string;
}

export interface CheckerFinding {
  rule: string;
  severity: Severity;
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
  createdAt?: Date;
}

export interface HumanReview {
  caseId: string;
  diagnosisId?: string;
  decision: ReviewDecision;
  reviewerNotes?: string;
  correctedDiagnosis?: string;
  aiConfidence?: Confidence;
  createdAt?: Date;
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
