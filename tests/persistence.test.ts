process.env.DATABASE_PATH = ':memory:';
process.env.DEMO_MODE = '1';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { storePullRequest, getStoredReviews } = require('../src/db/database');
const { ReviewPipeline } = require('../src/orchestration/reviewPipeline');

test('real PR records and developer metadata survive the review path', async () => {
  const pr = { id: 'owner/repo#5@sha123', developerId: 'github:author', title: 'Real intake', description: '', domain: 'fullstack', complexity: 2, submittedAt: '2026-10-01T12:00:00Z', approvedAt: '', changedFiles: ['api.ts'], linesChanged: 2, diff: '+fixed', demoFindings: { frontend: [], backend: [] } };
  storePullRequest(pr, { id: pr.developerId, name: 'author', level: 'Unknown', specialty: 'fullstack', managementContext: 'Human context required' });
  await new ReviewPipeline().run(pr);
  const result = getStoredReviews()[0];
  assert.equal(result.pr.id, pr.id);
  assert.equal(result.pr.diff, pr.diff);
  assert.equal(result.developer.name, 'author');
  assert.equal(result.leadReview.prId, pr.id);
  const mismatchedAgent = { review: async () => ({ agent: 'frontend_qa', prId: 'wrong', findings: [] }) };
  await assert.rejects(new ReviewPipeline(mismatchedAgent).run(pr), /identity/);
  assert.equal(getStoredReviews()[0].pr.id, pr.id);
});
