import { config } from '../config';
import { engineeringStandards } from '../policies/engineeringStandards';
import { AgentReview, PullRequest } from '../types';
import { OpenRouterClient, validateAgentReview } from '../llm/openRouterClient';

export class BackendQaAgent {
  constructor(private client = new OpenRouterClient(config.openRouterApiKey)) {}

  async review(pr: PullRequest): Promise<AgentReview> {
    const started = Date.now();
    if (config.demoMode) {
      const findings = pr.demoFindings.backend.map(f => ({ ...f, confidence: 0.94 }));
      return { agent: 'backend_qa', prId: pr.id, status: findings.length ? 'issues_found' : 'clean', summary: findings.length ? `Backend QA found ${findings.length} issue(s).` : 'Backend QA found no material issues.', findings, model: 'deterministic-demo', durationMs: Date.now() - started };
    }
    const system = `You are the Backend QA Agent. Review only backend concerns: API design, input validation, auth, security, data integrity, database queries, concurrency, failure handling, backend performance, edge cases, and backend tests.Only create a finding when it is supported by the supplied PR metadata or diff. If something is merely possible but not evidenced, mention it as a verification note in the summary instead of adding a finding. Do not invent frontend findings.\n${engineeringStandards}\nReturn ONLY valid JSON matching: {"agent":"backend_qa","prId":"...","status":"clean|issues_found","summary":"...","findings":[{"category":"...","severity":"low|medium|high|critical","file":"...","line":1,"description":"...","recommendation":"...","confidence":0.0}]}`;
    const { demoFindings: _demoFindings, ...reviewablePr } = pr;
    const result = await this.client.completeJson(config.models.backend, system, JSON.stringify(reviewablePr), validateAgentReview);
    return { ...result, model: config.models.backend, durationMs: Date.now() - started };
  }
}
