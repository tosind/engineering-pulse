import { Developer, PullRequest } from '../types';

export async function loadGitHubPullRequest(repository: string, number: number, complexity: number,
  allowed = (process.env.GITHUB_REPOSITORIES || '').split(',').map((s: string) => s.trim().toLowerCase()),
  request: typeof fetch = fetch): Promise<{ pr: PullRequest; developer: Developer }> {
  if (typeof repository !== 'string' || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository) ||
      !allowed.includes(repository.toLowerCase())) throw new Error('Repository is not allowed');
  if (!Number.isInteger(number) || number < 1 || !Number.isInteger(complexity) || complexity < 1 || complexity > 5) {
    throw new Error('Provide a valid PR number and assignment complexity (1–5)');
  }
  const base = 'https://api.github.com/repos/' + repository + '/pulls/' + number;
  const get = async (address: string) => {
    const response = await request(address, {
      redirect: 'error', signal: AbortSignal.timeout(15000),
      headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2026-03-10',
        ...(process.env.GITHUB_TOKEN ? { Authorization: 'Bearer ' + process.env.GITHUB_TOKEN } : {}) }
    });
    if (!response.ok) throw new Error('GitHub request failed (' + response.status + ')');
    const text = await response.text();
    if (text.length > 1000000) throw new Error('GitHub response exceeds intake limit');
    return JSON.parse(text);
  };
  const metadata = await get(base);
  if (!metadata.head?.sha || !metadata.user?.login || typeof metadata.title !== 'string') throw new Error('Invalid GitHub PR metadata');
  if (!Number.isInteger(metadata.changed_files) || metadata.changed_files < 1 || metadata.changed_files > 100) throw new Error('Intake supports 1–100 changed text files per PR');
  const files = await get(base + '/files?per_page=100');
  if (!Array.isArray(files) || files.length !== metadata.changed_files || files.some(file => typeof file.patch !== 'string' || !file.patch)) {
    throw new Error('PR diff is incomplete or contains unsupported binary files; review manually');
  }
  for (const file of files) {
    const lines = file.patch.split('\n');
    if (lines.filter((line: string) => line.startsWith('+')).length !== file.additions ||
        lines.filter((line: string) => line.startsWith('-')).length !== file.deletions) {
      throw new Error('PR diff is truncated; review manually');
    }
  }
  const diff = files.map(file => '--- ' + file.filename + '\n' + file.patch).join('\n\n');
  if (diff.length > 100000) throw new Error('PR diff exceeds review limit; review manually');
  const current = await get(base);
  if (current.head.sha !== metadata.head.sha || current.base.sha !== metadata.base.sha) throw new Error('PR changed during intake; retry');
  const developerId = 'github:' + metadata.user.login;
  return {
    developer: { id: developerId, name: metadata.user.login, level: 'Not provided', specialty: 'fullstack', managementContext: 'GitHub PR author. Seniority and performance require human context.' },
    pr: { id: repository + '#' + number + '@' + metadata.head.sha, developerId, title: metadata.title,
      description: (metadata.body || '').slice(0, 10000), domain: 'fullstack', complexity: complexity as PullRequest['complexity'],
      submittedAt: metadata.created_at, approvedAt: '', changedFiles: files.map(file => file.filename),
      linesChanged: metadata.additions + metadata.deletions, diff, demoFindings: { frontend: [], backend: [] } }
  };
}
