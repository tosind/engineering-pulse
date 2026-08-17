process.env.DEMO_MODE = "1";
const { test } = require('node:test');
const assert = require('node:assert/strict');
import { getPullRequest } from '../src/data/mockTeam';
import { FrontendQaAgent } from '../src/agents/frontendQaAgent';
import { BackendQaAgent } from '../src/agents/backendQaAgent';
import { LeadReviewerAgent } from '../src/agents/leadReviewerAgent';

test('PR-105 is blocked by critical/high backend findings', async () => {
  const pr = getPullRequest('PR-105')!;
  const [frontendReview, backendReview] = await Promise.all([new FrontendQaAgent().review(pr), new BackendQaAgent().review(pr)]);
  const result = await new LeadReviewerAgent().review({ pr, frontendReview, backendReview, startedAt:new Date().toISOString() });
  assert.equal(result.decision, 'REQUEST_CHANGES');
  assert.ok(result.blockingFindings.some(f => f.severity === 'critical'));
});

test('PR-106 is approved when specialists find no blocking issue', async () => {
  const pr = getPullRequest('PR-106')!;
  const [frontendReview, backendReview] = await Promise.all([new FrontendQaAgent().review(pr), new BackendQaAgent().review(pr)]);
  const result = await new LeadReviewerAgent().review({ pr, frontendReview, backendReview, startedAt:new Date().toISOString() });
  assert.equal(result.decision, 'APPROVE');
});
