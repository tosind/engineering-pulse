import { FrontendQaAgent } from '../agents/frontendQaAgent';
import { BackendQaAgent } from '../agents/backendQaAgent';
import { LeadReviewerAgent } from '../agents/leadReviewerAgent';
import { appendEvent, replaceReview } from '../db/database';
import { PullRequest, SharedReviewState, StoredReview } from '../types';
import { getDeveloper, pullRequests } from '../data/mockTeam';

export class ReviewPipeline {
  constructor(
    private frontend = new FrontendQaAgent(),
    private backend = new BackendQaAgent(),
    private lead = new LeadReviewerAgent()
  ) {}

  async run(pr: PullRequest): Promise<StoredReview> {
    appendEvent(pr.id, 'pr.review_started', { developerId: pr.developerId, complexity: pr.complexity });
    const startedAt = new Date().toISOString();
    const [frontendReview, backendReview] = await Promise.all([
      this.frontend.review(pr),
      this.backend.review(pr)
    ]);
    appendEvent(pr.id, 'agent.frontend_completed', frontendReview);
    appendEvent(pr.id, 'agent.backend_completed', backendReview);

    const shared: SharedReviewState = { pr, frontendReview, backendReview, startedAt };
    appendEvent(pr.id, 'review.shared_state_ready', { frontendFindingCount: frontendReview.findings.length, backendFindingCount: backendReview.findings.length });
    const leadReview = await this.lead.review(shared);
    appendEvent(pr.id, 'lead_review.completed', leadReview);
    replaceReview(pr.id, frontendReview, backendReview, leadReview);

    const developer = getDeveloper(pr.developerId);
    if (!developer) throw new Error(`Developer not found: ${pr.developerId}`);
    const { demoFindings: _demoFindings, ...publicPr } = pr;
    return { pr: publicPr as PullRequest, developer, frontendReview, backendReview, leadReview };
  }

  async runAll(): Promise<StoredReview[]> {
    const results: StoredReview[] = [];
    for (const pr of pullRequests) results.push(await this.run(pr));
    return results;
  }
}
