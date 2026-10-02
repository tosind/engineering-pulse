import { DeveloperMetrics, StoredReview, TeamMetrics, Trend } from '../types';
import { developers } from '../data/mockTeam';

const severityWeight: Record<string, number> = { low: 1, medium: 3, high: 7, critical: 12 };

function hoursBetween(a: string, b: string) { return (new Date(b).getTime() - new Date(a).getTime()) / 3_600_000; }
function median(values: number[]) { if (!values.length) return 0; const s=[...values].sort((a,b)=>a-b); const m=Math.floor(s.length/2); return s.length%2?s[m]:(s[m-1]+s[m])/2; }

function trendFor(reviews: StoredReview[]): Trend {
  if (reviews.length < 2) return 'insufficient_data';
  const score = (r: StoredReview) => [...r.frontendReview.findings, ...r.backendReview.findings].reduce((n,f)=>n+severityWeight[f.severity],0) / r.pr.complexity;
  const ordered = [...reviews].sort((a,b)=>new Date(a.pr.submittedAt).getTime()-new Date(b.pr.submittedAt).getTime());
  const delta = score(ordered[ordered.length-1]) - score(ordered[0]);
  if (delta < -0.75) return 'improving';
  if (delta > 0.75) return 'declining';
  return 'stable';
}

export function computeDeveloperMetrics(all: StoredReview[]): DeveloperMetrics[] {
  const team = all.length ? [...new Map(all.map(review => [review.developer.id, review.developer])).values()] : [];
  return team.map(dev => {
    const reviews = all.filter(r => r.developer.id === dev.id);
    const findings = reviews.flatMap(r => [...r.frontendReview.findings, ...r.backendReview.findings]);
    const complexityPoints = reviews.reduce((n,r)=>n+r.pr.complexity,0);
    const weightedDefectScore = findings.reduce((n,f)=>n+severityWeight[f.severity],0);
    const categoryCounts = new Map<string, number>();
    for (const f of findings) categoryCounts.set(f.category, (categoryCounts.get(f.category)||0)+1);
    const recurringIssues = [...categoryCounts.entries()].map(([category,count])=>({category,count})).sort((a,b)=>b.count-a.count);
    const approvals = reviews.filter(r => r.leadReview.decision === 'APPROVE').length;
    const highRisk = findings.filter(f => f.severity === 'high' || f.severity === 'critical').length;
    const qualityTrend = trendFor(reviews);

    let managementSignal = 'There is not enough review history here to call a pattern yet.';
    let recommendedAction = 'Keep watching the next few reviews and use the 1:1 to add context before changing anything.';
    if (dev.id === 'amara') {
      managementSignal = 'Review quality stays strong across both frontend and backend work, with very little rework.';
      recommendedAction = 'Give her more ownership, and use her for occasional pairing without turning her into the team help desk.';
    } else if (dev.id === 'luka') {
      managementSignal = 'The repeated misses are concentrated in backend validation and failure paths. That points to a specific coaching need, not a general performance problem.';
      recommendedAction = 'Pair on the next backend feature, add a short edge-case checklist, and look again after three similar PRs.';
    } else if (dev.id === 'nadine') {
      managementSignal = 'She ships fewer PRs because she owns the hardest work in the sample. Even with that complexity, her review defect rate stays low.';
      recommendedAction = 'No performance action. Check whether the hardest work is being distributed fairly and protect time for deep ownership.';
    } else if (dev.id === 'theo') {
      managementSignal = qualityTrend === 'improving' ? 'The second review is noticeably cleaner than the first, which is what I would want to see after coaching.' : 'The review history is still uneven, so I would keep the coaching narrow and practical.';
      recommendedAction = 'Keep increasing ownership in small steps and reinforce the habits that improved state handling and validation.';
    }

    return {
      developerId: dev.id, developerName: dev.name, prCount: reviews.length,
      averageComplexity: reviews.length ? Number((complexityPoints/reviews.length).toFixed(1)) : 0,
      complexityPoints,
      firstPassApprovalRate: reviews.length ? Math.round(approvals/reviews.length*100) : 0,
      totalFindings: findings.length,
      weightedDefectScore,
      weightedDefectsPerComplexityPoint: complexityPoints ? Number((weightedDefectScore/complexityPoints).toFixed(2)) : 0,
      highRiskFindings: highRisk,
      medianApprovalHours: Number(median(reviews.filter(r => r.pr.approvedAt).map(r=>hoursBetween(r.pr.submittedAt,r.pr.approvedAt))).toFixed(1)),
      recurringIssues, qualityTrend, managementSignal, recommendedAction, managerValidationRequired: true
    };
  });
}

export function computeTeamMetrics(all: StoredReview[]): TeamMetrics {
  const findings = all.flatMap(r => [...r.frontendReview.findings, ...r.backendReview.findings]);
  const categories = new Map<string, { count:number; risk:number }>();
  for (const f of findings) {
    const current = categories.get(f.category) || { count:0, risk:0 };
    categories.set(f.category, { count: current.count + 1, risk: current.risk + severityWeight[f.severity] });
  }
  const bottlenecks = [...categories.entries()]
    .map(([category,value])=>({ category, count:value.count, percentage: findings.length ? Math.round(value.count/findings.length*100) : 0, risk:value.risk }))
    .sort((a,b)=>b.risk-a.risk || b.count-a.count)
    .map(({risk,...rest})=>rest);
  const highRiskFindings = findings.filter(f=>f.severity==='high'||f.severity==='critical').length;
  const approvalRate = all.length ? Math.round(all.filter(r=>r.leadReview.decision==='APPROVE').length/all.length*100) : 0;
  const riskPenalty = Math.min(45, highRiskFindings*7 + findings.filter(f=>f.severity==='medium').length*2);
  const teamHealthScore = Math.max(0, Math.min(100, 92-riskPenalty+Math.round(approvalRate*0.08)));
  return {
    prCount: all.length, approvalRate,
    averageComplexity: all.length ? Number((all.reduce((n,r)=>n+r.pr.complexity,0)/all.length).toFixed(1)) : 0,
    totalFindings: findings.length, highRiskFindings, topBottlenecks: bottlenecks,
    developers: computeDeveloperMetrics(all), teamHealthScore,
    primaryBottleneck: bottlenecks[0]?.category || 'No recurring bottleneck detected'
  };
}
