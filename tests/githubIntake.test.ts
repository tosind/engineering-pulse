import { loadGitHubPullRequest } from '../src/data/githubIntake';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const meta = { head: { sha: 'abc123' }, base: { sha: 'base123' }, user: { login: 'engineer' }, title: 'Fix validation', body: 'Description', changed_files: 1, additions: 1, deletions: 1, created_at: '2026-10-01T12:00:00Z' };
const file = { filename: 'api.ts', patch: '@@ -1 +1 @@\n-old\n+new', additions: 1, deletions: 1 };
function responses(payloads: unknown[]): typeof fetch {
  let index = 0;
  return (async (url: string) => {
    assert.ok(url.startsWith('https://api.github.com/repos/owner/repo/pulls/1'));
    return new Response(JSON.stringify(payloads[index++]), { status: 200 });
  }) as typeof fetch;
}
test('GitHub intake restricts repositories and preserves commit identity', async () => {
  await assert.rejects(loadGitHubPullRequest('evil/repo', 1, 2, ['owner/repo']), /not allowed/);
  const { pr, developer } = await loadGitHubPullRequest('owner/repo', 1, 2, ['owner/repo'], responses([meta, [file], meta]));
  assert.equal(pr.id, 'owner/repo#1@abc123');
  assert.equal(pr.developerId, developer.id);
  assert.equal(pr.approvedAt, '');
  assert.ok(pr.diff.includes('+new'));
});
test('GitHub intake refuses binary, truncated, or changing diffs', async () => {
  await assert.rejects(loadGitHubPullRequest('owner/repo', 1, 2, ['owner/repo'], responses([meta, [{ ...file, patch: undefined }]])), /incomplete/);
  await assert.rejects(loadGitHubPullRequest('owner/repo', 1, 2, ['owner/repo'], responses([meta, [{ ...file, additions: 2 }]])), /truncated/);
  await assert.rejects(loadGitHubPullRequest('owner/repo', 1, 2, ['owner/repo'], responses([meta, [file], { ...meta, head: { sha: 'changed' } }])), /changed/);
});
