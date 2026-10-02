import { createServer } from '../src/server';
const { test } = require('node:test');
const assert = require('node:assert/strict');

test('HTTP security: health, authentication, JSON bounds and CSRF', async () => {
  const token = 'test-only-pulse-token-32-characters';
  const server = createServer(token);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const headers = { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' };
  try {
    assert.equal((await fetch(base + '/api/health')).status, 200);
    assert.equal((await fetch(base + '/api/events')).status, 401);
    assert.equal((await fetch(base + '/', { headers: { Authorization: 'Bearer wrong' } })).status, 401);
    const html = await fetch(base + '/', { headers });
    assert.equal(html.status, 200);
    assert.equal(html.headers.get('x-frame-options'), 'DENY');
    assert.equal((await fetch(base + '/api/reviews/run', { method: 'POST', headers, body: '{' })).status, 400);
    assert.equal((await fetch(base + '/api/reviews/run', { method: 'POST', headers, body: JSON.stringify({ prId: 'x'.repeat(70000) }) })).status, 413);
    assert.equal((await fetch(base + '/api/reviews/run', { method: 'POST', headers: { ...headers, Origin: 'https://other.example' }, body: '{}' })).status, 403);
    assert.equal((await fetch(base + '/api/reviews/run', { method: 'POST', headers: { Authorization: headers.Authorization }, body: '{}' })).status, 415);
    assert.equal((await fetch(base + '/api/reviews/run', { method: 'POST', headers, body: '[]' })).status, 400);
  } finally { await new Promise<void>(resolve => server.close(resolve)); }
});
