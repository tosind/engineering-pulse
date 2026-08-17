import { config } from '../config';
import { engineeringStandards } from '../policies/engineeringStandards';
import { AgentReview, PullRequest } from '../types';
import { OpenRouterClient, validateAgentReview } from '../llm/openRouterClient';

export class FrontendQaAgent {
  constructor(private client = new OpenRouterClient(config.openRouterApiKey)) {}

  async review(pr: PullRequest): Promise<AgentReview> {
    const started = Date.now();
    if (config.demoMode) {
      const findings = pr.demoFindings.frontend.map(f => ({ ...f, confidence: 0.92 }));
      return { agent: 'frontend_qa', prId: pr.id, status: findings.length ? 'issues_found' : 'clean', summary: findings.length ? `Frontend QA found ${findings.length} issue(s).` : 'Frontend QA found no material issues.', findings, model: 'deterministic-demo', durationMs: Date.now() - started };
    }
    const system = `You are the Frontend QA Agent. Only create a finding when it is supported by the supplied PR metadata or diff. If something is merely possible but not evidenced, mention it as a verification note in the summary instead of adding a finding. Review only frontend concerns: UI components, accessibility, styling, client state, browser behavior, frontend performance, and frontend tests. Do not invent backend findings.\n${engineeringStandards}\nReturn ONLY valid JSON matching: {"agent":"frontend_qa","prId":"...","status":"clean|issues_found","summary":"...","findings":[{"category":"...","severity":"low|medium|high|critical","file":"...","line":1,"description":"...","recommendation":"...","confidence":0.0}]}` ;
    const { demoFindings: _demoFindings, ...reviewablePr } = pr;
    const result = await this.client.completeJson(
      config.models.frontend,
      system,
      JSON.stringify(reviewablePr),
      validateAgentReview
    );

    const hasFrontendSurface = pr.changedFiles.some(file =>
      /\.(tsx|jsx|css|scss|sass|less|vue|svelte)$/i.test(file) ||
      /(^|\/)(frontend|client|ui|components|pages)(\/|$)/i.test(file)
    );

    if (!hasFrontendSurface) {
      return {
        ...result,
        status: 'clean',
        findings: [],
        summary: result.summary,
        model: config.models.frontend,
        durationMs: Date.now() - started
      };
    }

    return {
      ...result,
      model: config.models.frontend,
      durationMs: Date.now() - started
    };
  }
}
