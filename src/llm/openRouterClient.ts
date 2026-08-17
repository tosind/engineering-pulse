import { AgentReview, LeadReviewDecision, ReviewFinding, Severity } from '../types';

function stripJsonFences(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('```')) {
    return trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }
  const first = trimmed.indexOf('{');
  const last = trimmed.lastIndexOf('}');
  return first >= 0 && last > first ? trimmed.slice(first, last + 1) : trimmed;
}

function isSeverity(value: unknown): value is Severity {
  return value === 'low' || value === 'medium' || value === 'high' || value === 'critical';
}

export function validateFinding(value: any): ReviewFinding {
  if (!value || typeof value !== 'object') throw new Error('Finding must be an object');
  if (typeof value.category !== 'string' || !isSeverity(value.severity) || typeof value.file !== 'string') throw new Error('Invalid finding identity fields');
  if (typeof value.description !== 'string' || typeof value.recommendation !== 'string') throw new Error('Invalid finding text');
  let confidence = Number(value.confidence);
  if (Number.isFinite(confidence) && confidence > 1 && confidence <= 100) {
    confidence /= 100;
  }
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    throw new Error('Invalid finding confidence');
  }
  return { category: value.category, severity: value.severity, file: value.file, line: value.line == null ? undefined : Number(value.line), description: value.description, recommendation: value.recommendation, confidence };
}

export function validateAgentReview(value: any): Omit<AgentReview, 'model' | 'durationMs'> {
  if (!value || (value.agent !== 'frontend_qa' && value.agent !== 'backend_qa')) throw new Error('Invalid agent');
  if (typeof value.prId !== 'string' || (value.status !== 'clean' && value.status !== 'issues_found')) throw new Error('Invalid agent review status');
  if (typeof value.summary !== 'string' || !Array.isArray(value.findings)) throw new Error('Invalid agent review body');
  return { agent: value.agent, prId: value.prId, status: value.status, summary: value.summary, findings: value.findings.map(validateFinding) };
}

export function validateLeadReview(value: any): Omit<LeadReviewDecision, 'model' | 'durationMs'> {
  if (!value || typeof value.prId !== 'string') throw new Error('Invalid lead review');
  if (value.decision !== 'APPROVE' && value.decision !== 'REQUEST_CHANGES') throw new Error('Invalid decision');
  const riskScore = Number(value.riskScore);
  if (!Number.isFinite(riskScore) || riskScore < 0 || riskScore > 100) throw new Error('Invalid risk score');
  if (typeof value.summary !== 'string' || !Array.isArray(value.blockingFindings) || !Array.isArray(value.nonBlockingFindings)) throw new Error('Invalid lead review fields');
  return {
    prId: value.prId,
    decision: value.decision,
    riskScore,
    summary: value.summary,
    blockingFindings: value.blockingFindings.map(validateFinding),
    nonBlockingFindings: value.nonBlockingFindings.map(validateFinding),
    conflictResolution: Array.isArray(value.conflictResolution) ? value.conflictResolution.map(String) : []
  };
}

export class OpenRouterClient {
  constructor(private apiKey: string) {}

  async completeJson<T>(model: string, system: string, user: string, validator: (value: any) => T): Promise<T> {
    if (!this.apiKey) throw new Error('OPENROUTER_API_KEY is not configured');
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/tosind/engineering-pulse',
        'X-Title': 'Engineering Pulse'
      },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ]
      })
    });
    if (!response.ok) throw new Error(`OpenRouter ${response.status}: ${await response.text()}`);
    const payload: any = await response.json();
    const text = payload?.choices?.[0]?.message?.content;
    if (typeof text !== 'string') throw new Error('OpenRouter response did not contain message content');
    return validator(JSON.parse(stripJsonFences(text)));
  }
}
