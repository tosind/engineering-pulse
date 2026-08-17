const content = document.querySelector('#content');
const title = document.querySelector('#title');
const subtitle = document.querySelector('#subtitle');
const mode = document.querySelector('#mode');
const runAllButton = document.querySelector('#runAll');
let data = {};

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

const nice = value => String(value ?? '').replaceAll('_', ' ');
const trendLabel = value => value === 'insufficient_data' ? 'not enough data' : nice(value);
const duration = ms => ms ? `${(ms / 1000).toFixed(ms >= 10000 ? 0 : 1)}s` : 'local';
const findingCount = review => review?.findings?.length || 0;
const modelLabel = model => String(model || 'unknown').replace(':free', '');

async function getJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  return response.json();
}

async function load() {
  const [health, team, prs, brief] = await Promise.all([
    getJson('/api/health'), getJson('/api/team'), getJson('/api/prs'), getJson('/api/brief')
  ]);
  data = { health, team, prs, brief };
  mode.textContent = `${health.mode} / ${modelLabel(health.models.lead)}`;
  render(document.querySelector('.nav-item.active')?.dataset.view || 'overview');
}

function decisionMarkup(decision) {
  const approved = decision === 'APPROVE';
  return `<span class="decision ${approved ? 'approve' : 'block'}">${approved ? 'approved' : 'changes requested'}</span>`;
}

function pulseStat(label, value, note) {
  return `<div class="pulse-stat"><span>${esc(label)}</span><b>${esc(value)}</b><small>${esc(note)}</small></div>`;
}

function emptyState() {
  return `<div class="empty-state"><strong>No stored review results yet.</strong><p>The mock team is loaded, but there are no completed reviews in SQLite. Run the pipeline when you are ready to populate the review history and management views.</p></div>`;
}

function overview() {
  const metrics = data.team.metrics;
  if (!metrics || !data.prs.length) return emptyState();
  const risky = [...data.prs]
    .sort((a, b) => b.leadReview.riskScore - a.leadReview.riskScore)
    .slice(0, 4);

  const queue = risky.map(review => `
    <div class="queue-row">
      <div class="pr-code">${esc(review.pr.id)}</div>
      <div class="queue-title"><strong>${esc(review.pr.title)}</strong><span>${esc(review.developer.name)} · complexity ${esc(review.pr.complexity)}</span></div>
      <div class="queue-metric"><span>risk</span><b>${esc(review.leadReview.riskScore)}/100</b></div>
      <div>${decisionMarkup(review.leadReview.decision)}</div>
    </div>`).join('');

  const patterns = metrics.developers.map(engineer => `
    <tr>
      <td><div class="engineer-name">${esc(engineer.developerName)}</div><div class="engineer-note">${esc(engineer.managementSignal)}</div></td>
      <td><span class="trend ${esc(engineer.qualityTrend)}">${esc(trendLabel(engineer.qualityTrend))}</span></td>
      <td class="mono">${esc(engineer.averageComplexity)}</td>
      <td class="mono">${esc(engineer.firstPassApprovalRate)}%</td>
      <td class="mono">${esc(engineer.weightedDefectsPerComplexityPoint)}</td>
    </tr>`).join('');

  const issues = metrics.topBottlenecks.slice(0, 5).map(issue => `
    <div class="issue-row">
      <div><strong>${esc(nice(issue.category))}</strong><div class="issue-meter"><i style="width:${Math.max(7, Math.min(100, issue.percentage))}%"></i></div></div>
      <span>${esc(issue.count)} hits</span>
      <span>${esc(issue.percentage)}%</span>
    </div>`).join('') || '<div class="empty-finding">No recurring review issue detected.</div>';

  return `
    <div class="pulse-strip">
      <div class="pulse-intro"><small>REVIEW PULSE</small><strong>Velocity only means something when review quality and assignment difficulty are visible beside it.</strong></div>
      ${pulseStat('Team signal', `${metrics.teamHealthScore}/100`, 'Quality and review risk')}
      ${pulseStat('First pass', `${metrics.approvalRate}%`, 'Approved without blocking findings')}
      ${pulseStat('High-risk findings', metrics.highRiskFindings, `Primary pattern: ${nice(metrics.primaryBottleneck)}`)}
      ${pulseStat('PRs reviewed', metrics.prCount, `${metrics.totalFindings} structured findings`)}
    </div>

    <p class="section-label">Decision queue</p>
    <div class="panel"><div class="panel-body">${queue}</div></div>

    <div class="section-grid two-col">
      <div>
        <p class="section-label">Engineer patterns</p>
        <div class="panel">
          <div class="panel-head"><div><h2>Quality beside assignment difficulty</h2><p>Raw PR count is deliberately not treated as a performance score.</p></div><span class="meta">complexity adjusted</span></div>
          <div class="panel-body"><table class="pattern-table"><thead><tr><th>Engineer</th><th>Trend</th><th>Avg complexity</th><th>First pass</th><th>Defect density</th></tr></thead><tbody>${patterns}</tbody></table></div>
        </div>
      </div>
      <div>
        <p class="section-label">Team bottlenecks</p>
        <div class="panel">
          <div class="panel-head"><div><h2>Recurring review issues</h2><p>Sorted by repeated review evidence, not manager intuition.</p></div><span class="meta">${metrics.totalFindings} findings</span></div>
          <div class="panel-body"><div class="issue-list">${issues}</div></div>
        </div>
      </div>
    </div>

    <div class="manager-read"><div class="label">Manager read</div><div><strong>Velocity without context is not productivity.</strong><p>Nadine owns the hardest work in the sample and still keeps review defects low. Luka's repeated misses are concentrated in backend validation and failure paths, which is a focused coaching topic rather than a verdict on his overall performance.</p></div></div>`;
}

function railStep(number, label, review, kind) {
  const isLead = kind === 'lead';
  const state = isLead
    ? (review.decision === 'APPROVE' ? 'approved' : 'blocked')
    : (review.status === 'clean' ? 'clean' : 'issues');
  const model = modelLabel(review.model);
  const note = isLead
    ? `${review.decision === 'APPROVE' ? 'approved' : 'blocked'} · risk ${review.riskScore}/100`
    : `${findingCount(review)} finding${findingCount(review) === 1 ? '' : 's'} · ${duration(review.durationMs)}`;
  return `<div class="rail-step ${state}"><div class="rail-node">${number}</div><strong>${esc(label)}</strong><code>${esc(model)}</code><small>${esc(note)}</small></div>`;
}

function findingsMarkup(findings) {
  if (!findings?.length) return '<div class="empty-finding">No material findings in scope.</div>';
  return findings.map(finding => `
    <div class="finding ${esc(finding.severity)}">
      <div class="finding-meta"><span>${esc(finding.severity)}</span><span>${esc(nice(finding.category))}</span><span>${esc(finding.file)}${finding.line ? `:${esc(finding.line)}` : ''}</span>${finding.confidence != null ? `<span>${Math.round(Number(finding.confidence) * 100)}% confidence</span>` : ''}</div>
      <strong>${esc(finding.description)}</strong>
      <p>${esc(finding.recommendation)}</p>
    </div>`).join('');
}

function reviews() {
  if (!data.prs.length) return emptyState();
  return `<div class="review-stack">${data.prs.map(review => {
    const approved = review.leadReview.decision === 'APPROVE';
    return `
      <article class="review-record ${approved ? 'approved' : 'blocked'}">
        <div class="review-header">
          <div class="pr-code">${esc(review.pr.id)}</div>
          <div><h2>${esc(review.pr.title)}</h2><p>${esc(review.developer.name)} · ${esc(review.pr.domain)} · complexity ${esc(review.pr.complexity)} · ${esc(review.pr.linesChanged)} lines changed</p></div>
          <div class="risk-box"><span>lead risk</span><b>${esc(review.leadReview.riskScore)}/100</b></div>
        </div>
        <div class="decision-rail">
          ${railStep('FE', 'Frontend QA', review.frontendReview, 'agent')}
          ${railStep('BE', 'Backend QA', review.backendReview, 'agent')}
          ${railStep('LD', 'Lead reviewer', review.leadReview, 'lead')}
        </div>
        <div class="review-detail">
          <section class="agent-column"><h3>Frontend findings</h3><p class="agent-summary">${esc(review.frontendReview.summary)}</p>${findingsMarkup(review.frontendReview.findings)}</section>
          <section class="agent-column"><h3>Backend findings</h3><p class="agent-summary">${esc(review.backendReview.summary)}</p>${findingsMarkup(review.backendReview.findings)}</section>
          <section class="agent-column"><h3>Lead decision</h3>${decisionMarkup(review.leadReview.decision)}<div class="lead-call"><strong>${esc(review.leadReview.summary)}</strong>${review.leadReview.conflictResolution?.length ? `<p>Conflict resolution: ${esc(review.leadReview.conflictResolution.join(' '))}</p>` : ''}</div>${review.leadReview.blockingFindings?.length ? `<div class="finding high"><div class="finding-meta"><span>blocking policy</span></div><strong>${review.leadReview.blockingFindings.length} finding${review.leadReview.blockingFindings.length === 1 ? '' : 's'} require changes before approval.</strong></div>` : '<div class="empty-finding">No blocking severity rule triggered.</div>'}</section>
        </div>
      </article>`;
  }).join('')}</div>`;
}

function engineers() {
  const metrics = data.team.metrics;
  if (!metrics?.developers?.length) return emptyState();
  return `
    <div class="engineer-list">
      ${metrics.developers.map(engineer => `
        <section class="engineer-record">
          <div class="identity"><strong>${esc(engineer.developerName)}</strong><span>${esc(engineer.prCount)} PRs · ${esc(engineer.complexityPoints)} complexity points</span><span class="trend ${esc(engineer.qualityTrend)}">${esc(trendLabel(engineer.qualityTrend))}</span></div>
          <div class="metric-block"><span>First pass</span><b>${esc(engineer.firstPassApprovalRate)}%</b></div>
          <div class="metric-block"><span>Avg complexity</span><b>${esc(engineer.averageComplexity)}</b></div>
          <div class="metric-block"><span>Defect density</span><b>${esc(engineer.weightedDefectsPerComplexityPoint)}</b></div>
          <div class="management-evidence"><strong>Evidence I would take into a 1:1</strong><p>${esc(engineer.managementSignal)}</p><p class="next-step"><strong>Next step:</strong> ${esc(engineer.recommendedAction)}</p><span class="human-check">Needs manager context</span></div>
        </section>`).join('')}
    </div>`;
}

function managerBrief() {
  const brief = data.brief;
  const metrics = data.team.metrics;
  if (!brief || !metrics) return emptyState();
  const strengths = brief.strengths.map(item => `<div class="memo-item good">${esc(item)}</div>`).join('');
  const watch = brief.watchItems.map(item => `<div class="memo-item watch">${esc(item)}</div>`).join('');
  const interventions = brief.interventions.map(item => `<div class="intervention-row"><strong>${esc(item.developer)}</strong><p>${esc(item.action)}</p></div>`).join('');
  const systemic = (brief.systemicActions || []).map(item => `<div class="memo-item">${esc(item)}</div>`).join('');

  return `
    <article class="memo">
      <div class="memo-head">
        <div class="memo-label">MANAGER BRIEF / REVIEW EVIDENCE</div>
        <h2>${esc(brief.headline)}</h2>
        <p>${esc(brief.summary)}</p>
        <div class="memo-scoreline">
          <div class="memo-score"><span>Team signal</span><b>${esc(brief.teamHealthScore)}/100</b></div>
          <div class="memo-score"><span>First-pass approval</span><b>${esc(metrics.approvalRate)}%</b></div>
          <div class="memo-score"><span>Primary bottleneck</span><b>${esc(nice(metrics.primaryBottleneck))}</b></div>
        </div>
      </div>
      <div class="memo-grid">
        <section class="memo-section"><h3>What is working</h3><div class="memo-list">${strengths}</div></section>
        <section class="memo-section"><h3>What needs attention</h3><div class="memo-list">${watch}</div></section>
        <section class="memo-section"><h3>Targeted manager interventions</h3>${interventions}</section>
        <section class="memo-section"><h3>System changes</h3><div class="memo-list">${systemic}</div></section>
      </div>
      <div class="guardrail"><strong>Human decision boundary</strong><p>${esc(brief.guardrail)}</p></div>
    </article>`;
}

const titles = {
  overview: 'Overview',
  prs: 'Reviews',
  developers: 'Engineers',
  brief: 'Manager brief'
};

const subtitles = {
  overview: 'Quality signals, review decisions, and patterns worth a manager conversation.',
  prs: 'See the specialist findings, shared decision path, and final blocking logic for every PR.',
  developers: 'Review history shown beside assignment difficulty, trend direction, and manager follow-up.',
  brief: 'A short operating memo: what looks healthy, what needs attention, and what I would change next.'
};

function render(view) {
  document.querySelectorAll('.nav-item').forEach(button => button.classList.toggle('active', button.dataset.view === view));
  title.textContent = titles[view];
  subtitle.textContent = subtitles[view];
  content.innerHTML = ({ overview, prs: reviews, developers: engineers, brief: managerBrief }[view])();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('.nav-item').forEach(button => {
  button.addEventListener('click', () => render(button.dataset.view));
});

runAllButton.addEventListener('click', async () => {
  const original = runAllButton.textContent;
  runAllButton.disabled = true;
  runAllButton.textContent = 'Running reviews...';
  try {
    const response = await fetch('/api/reviews/run-all', { method: 'POST' });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || `Review run failed with ${response.status}`);
    }
    await load();
  } catch (error) {
    content.innerHTML = `<div class="empty-state"><strong>Review run stopped.</strong><p>${esc(error.message)} Existing stored results were left available where possible. You can retry after checking model availability.</p></div>`;
  } finally {
    runAllButton.disabled = false;
    runAllButton.textContent = original;
  }
});

content.innerHTML = '<div class="loading">Loading review data...</div>';
load().catch(error => {
  content.innerHTML = `<div class="empty-state"><strong>Unable to load Engineering Pulse.</strong><p>${esc(error.message)}</p></div>`;
});
