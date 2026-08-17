const { test } = require('node:test');
const assert = require('node:assert/strict');
import { seedDatabase, getStoredReviews } from '../src/db/database';
import { ReviewPipeline } from '../src/orchestration/reviewPipeline';
import { computeTeamMetrics } from '../src/analytics/metrics';

test('analytics preserves complexity context and detects Daniel risk', async () => {
  seedDatabase(true);
  await new ReviewPipeline().runAll();
  const metrics = computeTeamMetrics(getStoredReviews());
  const priya = metrics.developers.find(d=>d.developerId==='priya')!;
  const daniel = metrics.developers.find(d=>d.developerId==='daniel')!;
  assert.equal(priya.averageComplexity, 5);
  assert.ok(priya.weightedDefectsPerComplexityPoint < daniel.weightedDefectsPerComplexityPoint);
  assert.ok(daniel.highRiskFindings >= 2);
});
