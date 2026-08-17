export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type ReviewAgent = 'frontend_qa' | 'backend_qa';
export type ReviewStatus = 'clean' | 'issues_found';
export type Decision = 'APPROVE' | 'REQUEST_CHANGES';
export type Trend = 'improving' | 'stable' | 'declining' | 'insufficient_data';

export interface Developer {
  id: string;
  name: string;
  level: string;
  specialty: 'frontend' | 'backend' | 'fullstack';
  managementContext: string;
}

export interface DemoFindingSeed {
  category: string;
  severity: Severity;
  file: string;
  line?: number;
  description: string;
  recommendation: string;
}

export interface PullRequest {
  id: string;
  developerId: string;
  title: string;
  description: string;
  domain: 'frontend' | 'backend' | 'fullstack';
  complexity: 1 | 2 | 3 | 4 | 5;
  submittedAt: string;
  approvedAt: string;
  changedFiles: string[];
  linesChanged: number;
  diff: string;
  demoFindings: {
    frontend: DemoFindingSeed[];
    backend: DemoFindingSeed[];
  };
}

export interface ReviewFinding {
  category: string;
  severity: Severity;
  file: string;
  line?: number;
  description: string;
  recommendation: string;
  confidence: number;
}

export interface AgentReview {
  agent: ReviewAgent;
  prId: string;
  status: ReviewStatus;
  summary: string;
  findings: ReviewFinding[];
  model: string;
  durationMs: number;
}

export interface LeadReviewDecision {
  prId: string;
  decision: Decision;
  riskScore: number;
  summary: string;
  blockingFindings: ReviewFinding[];
  nonBlockingFindings: ReviewFinding[];
  conflictResolution: string[];
  model: string;
  durationMs: number;
}

export interface SharedReviewState {
  pr: PullRequest;
  frontendReview: AgentReview;
  backendReview: AgentReview;
  startedAt: string;
}

export interface StoredReview {
  pr: PullRequest;
  developer: Developer;
  frontendReview: AgentReview;
  backendReview: AgentReview;
  leadReview: LeadReviewDecision;
}

export interface DeveloperMetrics {
  developerId: string;
  developerName: string;
  prCount: number;
  averageComplexity: number;
  complexityPoints: number;
  firstPassApprovalRate: number;
  totalFindings: number;
  weightedDefectScore: number;
  weightedDefectsPerComplexityPoint: number;
  highRiskFindings: number;
  medianApprovalHours: number;
  recurringIssues: Array<{ category: string; count: number }>;
  qualityTrend: Trend;
  managementSignal: string;
  recommendedAction: string;
  managerValidationRequired: boolean;
}

export interface TeamMetrics {
  prCount: number;
  approvalRate: number;
  averageComplexity: number;
  totalFindings: number;
  highRiskFindings: number;
  topBottlenecks: Array<{ category: string; count: number; percentage: number }>;
  developers: DeveloperMetrics[];
  teamHealthScore: number;
  primaryBottleneck: string;
}

export interface ManagerBrief {
  generatedAt: string;
  headline: string;
  teamHealthScore: number;
  summary: string;
  strengths: string[];
  watchItems: string[];
  interventions: Array<{ developer: string; action: string; evidence: string }>;
  systemicActions: string[];
  guardrail: string;
}
