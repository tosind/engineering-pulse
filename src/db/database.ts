import { AgentReview, LeadReviewDecision, StoredReview } from '../types';
import { config } from '../config';
import { developers, getDeveloper, getPullRequest, pullRequests } from '../data/mockTeam';

const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

let db: any;

function database() {
  if (db) return db;
  const dbPath = path.resolve(config.databasePath);
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  initializeSchema();
  return db;
}

function initializeSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS developers (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, level TEXT NOT NULL, specialty TEXT NOT NULL, management_context TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS pull_requests (
      id TEXT PRIMARY KEY, developer_id TEXT NOT NULL, title TEXT NOT NULL, complexity INTEGER NOT NULL,
      submitted_at TEXT NOT NULL, approved_at TEXT NOT NULL, payload_json TEXT NOT NULL,
      FOREIGN KEY(developer_id) REFERENCES developers(id)
    );
    CREATE TABLE IF NOT EXISTS agent_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT, pr_id TEXT NOT NULL, agent TEXT NOT NULL, status TEXT NOT NULL,
      summary TEXT NOT NULL, findings_json TEXT NOT NULL, model TEXT NOT NULL, duration_ms INTEGER NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS lead_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT, pr_id TEXT NOT NULL, decision TEXT NOT NULL, risk_score INTEGER NOT NULL,
      summary TEXT NOT NULL, blocking_json TEXT NOT NULL, non_blocking_json TEXT NOT NULL, conflict_json TEXT NOT NULL,
      model TEXT NOT NULL, duration_ms INTEGER NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS review_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT, pr_id TEXT NOT NULL, event_type TEXT NOT NULL,
      payload_json TEXT NOT NULL, created_at TEXT NOT NULL
    );
  `);
}

export function seedDatabase(resetReviews = false) {
  const conn = database();
  if (resetReviews) conn.exec('DELETE FROM agent_reviews; DELETE FROM lead_reviews; DELETE FROM review_events;');
  const devStmt = conn.prepare('INSERT OR REPLACE INTO developers (id,name,level,specialty,management_context) VALUES (?,?,?,?,?)');
  for (const d of developers) devStmt.run(d.id, d.name, d.level, d.specialty, d.managementContext);
  const prStmt = conn.prepare('INSERT OR REPLACE INTO pull_requests (id,developer_id,title,complexity,submitted_at,approved_at,payload_json) VALUES (?,?,?,?,?,?,?)');
  for (const pr of pullRequests) prStmt.run(pr.id, pr.developerId, pr.title, pr.complexity, pr.submittedAt, pr.approvedAt, JSON.stringify(pr));
}

export function appendEvent(prId: string, eventType: string, payload: unknown) {
  database().prepare('INSERT INTO review_events (pr_id,event_type,payload_json,created_at) VALUES (?,?,?,?)')
    .run(prId, eventType, JSON.stringify(payload), new Date().toISOString());
}

export function replaceReview(prId: string, fe: AgentReview, be: AgentReview, lead: LeadReviewDecision) {
  const conn = database();
  conn.exec('BEGIN');
  try {
    conn.prepare('DELETE FROM agent_reviews WHERE pr_id=?').run(prId);
    conn.prepare('DELETE FROM lead_reviews WHERE pr_id=?').run(prId);
    const agentStmt = conn.prepare('INSERT INTO agent_reviews (pr_id,agent,status,summary,findings_json,model,duration_ms,created_at) VALUES (?,?,?,?,?,?,?,?)');
    const now = new Date().toISOString();
    for (const review of [fe, be]) agentStmt.run(prId, review.agent, review.status, review.summary, JSON.stringify(review.findings), review.model, review.durationMs, now);
    conn.prepare('INSERT INTO lead_reviews (pr_id,decision,risk_score,summary,blocking_json,non_blocking_json,conflict_json,model,duration_ms,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)')
      .run(prId, lead.decision, lead.riskScore, lead.summary, JSON.stringify(lead.blockingFindings), JSON.stringify(lead.nonBlockingFindings), JSON.stringify(lead.conflictResolution), lead.model, lead.durationMs, now);
    conn.exec('COMMIT');
  } catch (error) {
    conn.exec('ROLLBACK');
    throw error;
  }
}

export function getStoredReviews(): StoredReview[] {
  const conn = database();
  const leadRows = conn.prepare('SELECT * FROM lead_reviews ORDER BY pr_id').all() as any[];
  return leadRows.map(row => {
    const pr = getPullRequest(row.pr_id);
    if (!pr) throw new Error(`Unknown PR ${row.pr_id}`);
    const developer = getDeveloper(pr.developerId);
    if (!developer) throw new Error(`Unknown developer ${pr.developerId}`);
    const agents = conn.prepare('SELECT * FROM agent_reviews WHERE pr_id=? ORDER BY agent').all(row.pr_id) as any[];
    const feRow = agents.find(r => r.agent === 'frontend_qa');
    const beRow = agents.find(r => r.agent === 'backend_qa');
    if (!feRow || !beRow) throw new Error(`Incomplete specialist reviews for ${pr.id}`);
    const parseAgent = (r: any): AgentReview => ({ agent:r.agent, prId:r.pr_id, status:r.status, summary:r.summary, findings:JSON.parse(r.findings_json), model:r.model, durationMs:r.duration_ms });
    const lead: LeadReviewDecision = { prId:row.pr_id, decision:row.decision, riskScore:row.risk_score, summary:row.summary, blockingFindings:JSON.parse(row.blocking_json), nonBlockingFindings:JSON.parse(row.non_blocking_json), conflictResolution:JSON.parse(row.conflict_json), model:row.model, durationMs:row.duration_ms };
    return { pr, developer, frontendReview: parseAgent(feRow), backendReview: parseAgent(beRow), leadReview: lead };
  });
}

export function getReviewEvents(prId?: string) {
  const conn = database();
  const rows = prId ? conn.prepare('SELECT * FROM review_events WHERE pr_id=? ORDER BY id').all(prId) : conn.prepare('SELECT * FROM review_events ORDER BY id').all();
  return (rows as any[]).map(r => ({ id:r.id, prId:r.pr_id, eventType:r.event_type, payload:JSON.parse(r.payload_json), createdAt:r.created_at }));
}
