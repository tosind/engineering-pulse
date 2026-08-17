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

## Review safety and operating modes

The model does not have final authority over merge safety.

Specialist agents identify and explain findings, but blocking policy is enforced in code. Critical findings always block. High-severity findings normally block. The Lead Reviewer can explain and consolidate the evidence, but it cannot override those rules.

Risk scoring is also deterministic. Each finding contributes a fixed severity weight, so a model cannot return an arbitrary low score for a clearly risky PR.

Live reviews are kept separate from the seeded demo data. The `demoFindings` field is used only for deterministic demo mode and is removed before any live OpenRouter prompt is sent. It is also excluded from public live review responses.

The project supports two operating modes:

- **Deterministic demo mode** provides a complete, reproducible eight-PR dataset for analytics and presentation.
- **Live OpenRouter mode** runs the actual Frontend QA, Backend QA, and Lead Reviewer agents against the mock PR input.

This split keeps the dashboard reliable for evaluation while still proving that the multi-agent pipeline works with live models.

## Presentation

The assessment presentation is included in the repository:

[Engineering Pulse Presentation](presentation/Engineering_Pulse_fin.pdf)

The deck focuses on the three-agent architecture, deterministic review guardrails, complexity-aware workforce diagnostics, coaching strategy, systemic engineering bottlenecks, and the human judgment boundary.

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

Example configuration:

```bash
OPENROUTER_API_KEY="..."
DEMO_MODE=0

FE_MODEL="google/gemini-3.1-flash-lite"
BE_MODEL="z-ai/glm-5.2"
LEAD_MODEL="z-ai/glm-5.2"

npm run seed
npm start

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

- **Overview:** team review health, approval rate, recurring risk, engineer patterns, and the main management signal.
- **Reviews:** the Frontend QA, Backend QA, shared review path, Lead Reviewer decision, severity, and blocking outcome for each PR.
- **Engineers:** complexity-aware review history, quality trend, recurring issues, and a suggested manager follow-up for each engineer.
- **Manager brief:** strengths, watch items, individual interventions, systemic actions, and the human-context guardrail.

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
