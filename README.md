# Engineering Pulse

Engineering Pulse is a small PR review system built for an Engineering Manager assessment. It sends each pull request through two specialist reviewers, gives both reviews to a Lead Reviewer, and then turns the review history into a manager-facing view of team quality, recurring issues, and coaching opportunities.

The important part is the management layer. PR data can show patterns, but it is not enough to judge motivation, burnout, promotion readiness, or someone's overall performance. Those calls still belong to the manager.

## How it works

1. A Frontend QA Agent and Backend QA Agent review the same PR in parallel.
2. Their findings are stored together in `SharedReviewState`.
3. The Lead Reviewer applies the team's review policy and returns `APPROVE` or `REQUEST_CHANGES`.
4. Review events are saved to SQLite.
5. The analytics layer calculates developer and team metrics with work complexity included.
6. The Manager Brief turns those metrics into practical follow-up actions.

## Run locally

Requirements: Node.js 22.5+. The runtime has no third-party dependencies. TypeScript is only used for development and builds.

```bash
npm install
cp .env.example .env
npm run demo
```

Open `http://localhost:3088`.

`npm run demo` uses the seeded review results, so the project can be evaluated without API credentials.

## Run with OpenRouter

Set the model and API variables before starting:

```bash
export OPENROUTER_API_KEY="..."
export FE_MODEL="your/frontend-model"
export BE_MODEL="your/backend-model"
export LEAD_MODEL="your/lead-reviewer-model"
npm run seed
npm start
```

When `OPENROUTER_API_KEY` is present, demo mode is disabled by default. Set `DEMO_MODE=1` if you want to force the seeded path.

## Tests

```bash
npm test
```

The tests cover the blocking severity policy and the management analysis. One test specifically checks that Nadine's high-complexity work is not treated as weak performance simply because she ships fewer PRs than teammates working on smaller changes.

## API

- `GET /api/health`
- `GET /api/team`
- `GET /api/prs`
- `GET /api/brief`
- `GET /api/events`
- `POST /api/reviews/run` with `{ "prId": "PR-105" }`
- `POST /api/reviews/run-all`

## Mock team

The seeded dataset uses four engineers with different work patterns:

- **Amara Nwosu**, Senior Full Stack Engineer. Fast delivery, broad ownership, and consistently clean reviews.
- **Luka Petrovic**, Mid-level Backend Engineer. Strong backend focus, with repeated misses around validation and failure paths.
- **Nadine El-Khoury**, Senior Engineer. Fewer PRs, but the hardest assignments and very low defect density.
- **Theo Baptiste**, Junior Full Stack Engineer. Starts unevenly, then improves across consecutive PRs.

## Management approach

Velocity without context is not productivity. I look at review quality, rework, severity, trend direction, and the complexity of the work before deciding whether a pattern needs coaching or is simply a reflection of assignment difficulty.

The system stops at engineering evidence and manager follow-up. It can surface a pattern worth discussing in a 1:1, but it cannot diagnose burnout, attitude, engagement, promotion readiness, or termination readiness from PR history.

## Dashboard views

- **Overview:** team health, first-pass approval, risk, developer patterns, and recurring review issues.
- **PR Reviews:** Frontend QA, Backend QA, and Lead Reviewer results for each PR.
- **Developer Review History:** complexity-aware quality metrics, trends, and suggested manager follow-up.
- **Manager Brief:** a short summary of what looks healthy, what deserves attention, and what I would do next.

## Repository map

- `src/agents`: the three runtime agents
- `src/orchestration`: the shared-state review pipeline
- `src/policies`: engineering standards and review policy
- `src/db`: SQLite review and event storage
- `src/analytics`: developer and team metrics
- `src/manager`: Manager Brief generation
- `src/data`: eight mock PRs and four developer profiles
- `public`: local dashboard
- `tests`: policy and analytics tests
