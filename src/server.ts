import { config, validateServerConfig } from './config';
import { getStoredReviews, getReviewEvents, seedDatabase, storePullRequest, getStoredDevelopers } from './db/database';
import { loadGitHubPullRequest } from './data/githubIntake';
import { developers, getPullRequest } from './data/mockTeam';
import { ReviewPipeline } from './orchestration/reviewPipeline';
import { computeTeamMetrics } from './analytics/metrics';
import { generateManagerBrief } from './manager/managerBrief';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const BufferClass = require('node:buffer').Buffer;
const MAX_BODY_BYTES = 64 * 1024;

class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
function json(res: any, status: number, data: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}
function authorized(req: any, token: string): boolean {
  if (!token) return true; // Local development only; production requires a token.
  const header = req.headers.authorization || '';
  let supplied = '';
  if (header.startsWith('Bearer ')) supplied = header.slice(7);
  if (header.startsWith('Basic ')) {
    const decoded = BufferClass.from(header.slice(6), 'base64').toString('utf8');
    if (decoded.startsWith('operator:')) supplied = decoded.slice('operator:'.length);
  }
  const actual = BufferClass.from(supplied);
  const expected = BufferClass.from(token);
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}
async function readBody(req: any) {
  let size = 0;
  const chunks: any[] = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new HttpError(413, 'Request body too large');
    chunks.push(chunk);
  }
  try { return JSON.parse(BufferClass.concat(chunks).toString('utf8') || '{}'); }
  catch { throw new HttpError(400, 'Invalid JSON'); }
}
function serveFile(res: any, file: string, type: string) {
  const target = path.join(process.cwd(), 'public', file);
  if (!fs.existsSync(target)) return json(res, 404, { error: 'Not found' });
  res.writeHead(200, { 'Content-Type': type });
  res.end(fs.readFileSync(target));
}
export function createServer(token = config.apiToken) {
  const pipeline = new ReviewPipeline();
  let reviewing = false;
  const server = http.createServer(async (req: any, res: any) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cache-Control', 'no-store');
    try {
      const pathname = new URL(req.url || '/', 'http://localhost').pathname;
      if (req.method === 'GET' && pathname === '/api/health') {
        return json(res, 200, { ok: true, mode: config.demoMode ? 'demo' : 'live-openrouter', models: config.models, intake: config.demoMode ? 'sample-prs' : 'github' });
      }
      if (!authorized(req, token)) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Engineering Pulse", charset="UTF-8"');
        return json(res, 401, { error: 'Authentication required' });
      }
      if (req.method === 'POST') {
        if (req.headers['sec-fetch-site'] === 'cross-site' ||
            (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host)) {
          return json(res, 403, { error: 'Cross-origin requests are forbidden' });
        }
        if (req.headers['content-type']?.split(';')[0].trim() !== 'application/json') {
          return json(res, 415, { error: 'Use application/json' });
        }
      }
      if (req.method === 'GET' && pathname === '/api/team') return json(res, 200, { developers: getStoredDevelopers(), metrics: computeTeamMetrics(getStoredReviews()) });
      if (req.method === 'GET' && pathname === '/api/prs') return json(res, 200, getStoredReviews());
      if (req.method === 'GET' && pathname === '/api/brief') return json(res, 200, generateManagerBrief(computeTeamMetrics(getStoredReviews())));
      if (req.method === 'GET' && pathname === '/api/events') return json(res, 200, getReviewEvents());
      if (req.method === 'POST' && ['/api/reviews/run-all', '/api/reviews/run', '/api/reviews/github'].includes(pathname)) {
        const body = await readBody(req);
        if (!body || typeof body !== 'object' || Array.isArray(body)) throw new HttpError(400, 'Expected a JSON object');
        if (reviewing) return json(res, 409, { error: 'A review is already running' });
        if (pathname === '/api/reviews/github') {
          if (config.demoMode) throw new HttpError(409, 'GitHub intake requires live model mode');
          reviewing = true;
          try {
            const { pr, developer } = await loadGitHubPullRequest(body.repository, body.number, body.complexity);
            storePullRequest(pr, developer);
            return json(res, 200, await pipeline.run(pr));
          } finally { reviewing = false; }
        }
        if (!config.demoMode) throw new HttpError(409, 'Sample reviews are disabled in live mode; use GitHub intake');
        if (pathname.endsWith('/run') && typeof body.prId !== 'string') throw new HttpError(400, 'prId must be a string');
        const pr = pathname.endsWith('/run') ? getPullRequest(body.prId) : undefined;
        if (pathname.endsWith('/run') && !pr) return json(res, 404, { error: 'Unknown PR' });
        reviewing = true;
        try {
          if (pr) return json(res, 200, await pipeline.run(pr));
          const reviews = await pipeline.runAll();
          return json(res, 200, { processed: reviews.length, metrics: computeTeamMetrics(reviews) });
        } finally { reviewing = false; }
      }
      if (req.method === 'GET' && pathname === '/') return serveFile(res, 'index.html', 'text/html; charset=utf-8');
      if (req.method === 'GET' && pathname === '/app.js') return serveFile(res, 'app.js', 'text/javascript; charset=utf-8');
      if (req.method === 'GET' && pathname === '/styles.css') return serveFile(res, 'styles.css', 'text/css; charset=utf-8');
      return json(res, 404, { error: 'Not found' });
    } catch (error) {
      if (error instanceof HttpError) return json(res, error.status, { error: error.message });
      console.error('Request failed', error instanceof Error ? error.name : 'UnknownError');
      return json(res, 500, { error: 'Internal server error' });
    }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  server.keepAliveTimeout = 5000;
  return server;
}
if (require.main === module) {
  validateServerConfig();
  if (config.demoMode) seedDatabase(false);
  const server = createServer();
  server.listen(config.port, config.host, () => console.log('Engineering Pulse listening on ' + config.host + ':' + config.port));
  const shutdown = () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
