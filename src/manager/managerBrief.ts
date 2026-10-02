import { ManagerBrief, TeamMetrics } from '../types';

export function generateManagerBrief(metrics: TeamMetrics): ManagerBrief {
  const amara = metrics.developers.find(d => d.developerId === 'amara');
  const luka = metrics.developers.find(d => d.developerId === 'luka');
  const nadine = metrics.developers.find(d => d.developerId === 'nadine');
  const theo = metrics.developers.find(d => d.developerId === 'theo');
  const recurringIssue = metrics.primaryBottleneck.replaceAll('_', ' ');

  return {
    generatedAt: new Date().toISOString(),
    headline: metrics.prCount ? `Review history: ${metrics.highRiskFindings} high-risk findings across ${metrics.prCount} PRs.` : 'No completed reviews yet.',
    teamHealthScore: metrics.teamHealthScore,
    summary: `Across ${metrics.prCount} reviewed PRs, ${metrics.approvalRate}% currently have an approval decision. The most common issue was ${recurringIssue}. Read individual results alongside assignment difficulty and direct context from the engineer.`,
    strengths: [
      amara ? `${amara.developerName}: strong reviews across frontend and backend work, with little rework.` : '',
      nadine ? `${nadine.developerName}: owns the hardest work in the sample and still keeps review defects low.` : '',
      theo ? `${theo.developerName}: review quality is ${theo.qualityTrend} across his two assignments.` : ''
    ].filter(Boolean),
    watchItems: [
      luka ? `${luka.developerName}: repeated validation and failure-path misses are worth a focused coaching conversation.` : '',
      `The most repeated review issue across the sample is ${recurringIssue}.`
    ].filter(Boolean),
    interventions: metrics.developers.map(developer => ({
      developer: developer.developerName,
      action: developer.recommendedAction,
      evidence: developer.managementSignal
    })),
    systemicActions: [
      'Add a short backend edge-case checklist to the PR template.',
      'Check whether the repeated validation misses are partly caused by missing shared helpers or unclear team standards.',
      'Compare assignment difficulty before treating PR count as a performance signal.',
      'Judge the coaching on the next three comparable PRs, not on one follow-up review.'
    ],
    guardrail: 'PR review history can point to a pattern worth discussing. It cannot tell me whether someone is burned out, disengaged, ready for promotion, or should be managed out. I would need direct context from the engineer, the team, and the work itself.'
  };
}
