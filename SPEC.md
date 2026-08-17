# Engineering Pulse Specification

## Objective
Build a three-agent OpenRouter PR review pipeline that also converts review events into management intelligence. The system must keep workforce decisions human-owned.

## Runtime agents
1. Frontend QA Agent
2. Backend QA Agent
3. Lead PR Reviewer

FE and BE execute in parallel. The Lead Reviewer receives both outputs through an explicit `SharedReviewState` object.

## Required outputs
- Structured agent reviews
- Approval or request-changes decision
- Append-only review events
- Developer metrics
- Team bottlenecks
- Manager Brief
- Four-screen local dashboard

## Guardrail
PR activity can reveal engineering patterns. It cannot by itself diagnose motivation, burnout, engagement, promotion readiness, or termination readiness.
