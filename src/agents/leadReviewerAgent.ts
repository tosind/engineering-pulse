import { config } from '../config';
import { engineeringStandards, severityPolicy } from '../policies/engineeringStandards';
import { LeadReviewDecision, ReviewFinding, SharedReviewState } from '../types';
import { OpenRouterClient, validateLeadReview } from '../llm/openRouterClient';

const weights: Record<string, number> = { low: 4, medium: 12, high: 28, critical: 50 };

function deterministicDecision(state: SharedReviewState): LeadReviewDecision {
  const findings = [...state.frontendReview.findings, ...state.backendReview.findings];
  const blocking = findings.filter(f => f.severity === 'critical' || f.severity === 'high');
  const nonBlocking = findings.filter(f => !blocking.includes(f));
  const riskScore = Math.min(100, findings.reduce((sum, f) => sum + weights[f.severity], 0));
  return {
    prId: state.pr.id,
    decision: blocking.length ? 'REQUEST_CHANGES' : 'APPROVE',
    riskScore,
    summary: blocking.length ? `${blocking.length} blocking finding(s) require changes before approval.` : findings.length ? 'No blocking issues. Non-blocking improvements may be addressed separately.' : 'Both specialist reviewers found no material issues.',
    blockingFindings: blocking,
    nonBlockingFindings: nonBlocking,
    conflictResolution: findings.length ? ['Severity outranks vote count.', 'Critical/high correctness, security, or data-integrity findings block regardless of the other agent result.'] : [],
    model: 'deterministic-policy', durationMs: 0
  };
}

export class LeadReviewerAgent {
  constructor(private client = new OpenRouterClient(config.openRouterApiKey)) {}

  async review(state: SharedReviewState): Promise<LeadReviewDecision> {
    const started = Date.now();
    if (config.demoMode) return { ...deterministicDecision(state), durationMs: Date.now() - started };
    const system = `You are the Lead PR Reviewer. Consolidate FE and BE reviews against shared engineering standards. Resolve conflicts using the severity policy. A critical finding always blocks. A high finding normally blocks. Do not treat multiple low findings as more important than a critical security/correctness issue.\n${engineeringStandards}\n${severityPolicy}\nReturn ONLY JSON matching: {"prId":"...","decision":"APPROVE|REQUEST_CHANGES","riskScore":0,"summary":"...","blockingFindings":[],"nonBlockingFindings":[],"conflictResolution":["..."]}. Preserve finding objects exactly.`;
    const result = await this.client.completeJson(config.models.lead, system, JSON.stringify(state), validateLeadReview);
    const all = [...state.frontendReview.findings, ...state.backendReview.findings];
    const policyBlocking: ReviewFinding[] = all.filter(f => f.severity === 'critical' || f.severity === 'high');
    if (policyBlocking.length && result.decision === 'APPROVE') {
      result.decision = 'REQUEST_CHANGES';
      result.blockingFindings = policyBlocking;
      result.nonBlockingFindings = all.filter(f => !policyBlocking.includes(f));
      result.conflictResolution.push('Runtime policy override: critical/high finding cannot be approved by model output.');
    }
    return { ...result, model: config.models.lead, durationMs: Date.now() - started };
  }
}
