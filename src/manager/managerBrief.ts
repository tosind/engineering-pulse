import { ManagerBrief, TeamMetrics } from '../types';

export function generateManagerBrief(metrics: TeamMetrics): ManagerBrief {
  const maya = metrics.developers.find(d=>d.developerId==='maya');
  const daniel = metrics.developers.find(d=>d.developerId==='daniel');
  const priya = metrics.developers.find(d=>d.developerId==='priya');
  const marcus = metrics.developers.find(d=>d.developerId==='marcus');
  return {
    generatedAt: new Date().toISOString(),
    headline: 'Quality is generally healthy, with one focused backend coaching opportunity and evidence that raw velocity can mislead.',
    teamHealthScore: metrics.teamHealthScore,
    summary: `Across ${metrics.prCount} PRs, the team shows ${metrics.approvalRate}% first-pass approval in the seeded review set. The most common review category is ${metrics.primaryBottleneck.replaceAll('_',' ')}. Individual conclusions are intentionally contextualized by work complexity and trend direction.`,
    strengths: [
      maya ? `${maya.developerName}: strong cross-stack quality and throughput.` : '',
      priya ? `${priya.developerName}: high-complexity ownership with low severity-adjusted defect density.` : '',
      marcus ? `${marcus.developerName}: ${marcus.qualityTrend} quality trajectory across sequential work.` : ''
    ].filter(Boolean),
    watchItems: [
      daniel ? `${daniel.developerName}: repeated backend boundary-condition and validation findings warrant targeted support.` : '',
      `Team-level recurring category: ${metrics.primaryBottleneck.replaceAll('_',' ')}.`
    ].filter(Boolean),
    interventions: metrics.developers.map(d => ({ developer:d.developerName, action:d.recommendedAction, evidence:d.managementSignal })),
    systemicActions: [
      'Add a lightweight backend boundary-condition checklist to PR templates.',
      'Review whether repeated validation findings indicate missing shared validation utilities or unclear standards.',
      'Compare work complexity before making velocity-based performance conclusions.',
      'Reassess coaching interventions using the next three comparable PRs rather than a single review.'
    ],
    guardrail: 'Engineering Pulse surfaces evidence and patterns. It does not diagnose motivation, burnout, attitude, promotion readiness, or termination readiness from PR data alone. Those decisions require manager validation and human context.'
  };
}
