process.env.DEMO_MODE = "1";
const { test } = require('node:test');
const assert = require('node:assert/strict');
import { seedDatabase, getStoredReviews } from '../src/db/database';
import { ReviewPipeline } from '../src/orchestration/reviewPipeline';
import { computeTeamMetrics } from '../src/analytics/metrics';

test("analytics keeps assignment complexity in context and catches Luka's repeated backend risk", async () => {
  seedDatabase(true);
  await new ReviewPipeline().runAll();
  const metrics = computeTeamMetrics(getStoredReviews());
  const nadine = metrics.developers.find(d => d.developerId === 'nadine')!;
  const luka = metrics.developers.find(d => d.developerId === 'luka')!;
  assert.equal(nadine.averageComplexity, 5);
  assert.ok(nadine.weightedDefectsPerComplexityPoint < luka.weightedDefectsPerComplexityPoint);
  assert.ok(luka.highRiskFindings >= 2);
});
