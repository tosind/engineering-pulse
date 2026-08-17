# Engineering Pulse

Engineering Pulse is a multi-agent PR review and engineering-management intelligence system. It was built to demonstrate both agent orchestration and the EM responsibility of turning engineering signals into contextual, human-owned interventions.

## What it does

1. Routes each PR to a Frontend QA Agent and Backend QA Agent in parallel.
2. Combines both results into explicit shared review state.
3. Sends that state to a Lead PR Reviewer for a policy-aware final decision.
4. Stores review events and structured findings.
5. Computes complexity-aware developer and team metrics.
6. Produces a Manager Brief with recommended interventions and explicit human-decision guardrails.

## Run locally

Requirements: Node.js 22.5+. There are no third-party runtime dependencies. TypeScript is a development dependency.

```bash
npm install
cp .env.example .env
npm run demo
```

Open `http://localhost:3088`.

`npm run demo` runs deterministic seeded reviews, which lets the system be evaluated without API credentials.

## Run with OpenRouter

Set environment variables before starting:

```bash
export OPENROUTER_API_KEY="..."
export FE_MODEL="your/frontend-model"
export BE_MODEL="your/backend-model"
export LEAD_MODEL="your/lead-reviewer-model"
npm run seed
npm start
```

When an OpenRouter key is present, `DEMO_MODE` defaults off. You can explicitly force deterministic mode with `DEMO_MODE=1`.

## Tests

```bash
npm test
```

The tests verify blocking severity policy and the management analytics story, including the fact that Priya's high-complexity work should not be judged by raw PR count alone.

## API

- `GET /api/health`
- `GET /api/team`
- `GET /api/prs`
- `GET /api/brief`
- `GET /api/events`
- `POST /api/reviews/run` with `{ "prId": "PR-105" }`
- `POST /api/reviews/run-all`

## Mock team

- Maya Chen: strong cross-stack quality and throughput.
- Daniel Okafor: recurring backend validation and failure-path issues.
- Priya Shah: lower raw throughput, highest complexity, low defect density.
- Marcus Lee: junior engineer with an improving quality trajectory.

## Management philosophy

Velocity without context is not productivity. Engineering Pulse surfaces evidence, recurring technical patterns, and possible interventions. It does not infer motivation, burnout, attitude, promotion readiness, or termination readiness from PR data alone.


## Dashboard views

- **Overview** — team health, first-pass approval, risk, developer signals, and recurring bottlenecks.
- **PR Reviews** — FE QA, BE QA, and Lead Reviewer findings shown side-by-side with severity and final risk.
- **Developer Intelligence** — complexity-aware quality metrics, management signals, and recommended interventions.
- **Manager Brief** — executive summary, watch items, systemic actions, and human-decision guardrails.

The dashboard is intentionally optimized for an Engineering Manager audience rather than for raw code-review volume.

## Repository map

- `src/agents`: the three runtime agents
- `src/orchestration`: shared-state pipeline
- `src/policies`: shared engineering standards and review policy
- `src/db`: SQLite event and review store
- `src/analytics`: complexity-aware engineering metrics
- `src/manager`: Manager Brief generation
- `src/data`: eight mock PRs and four developer personas
- `public`: lightweight dashboard
- `tests`: policy and analytics verification
