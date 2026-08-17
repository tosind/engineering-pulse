# Engineering Pulse Specification

## Goal
Build a three-agent PR review pipeline on OpenRouter and use the resulting review history to help an Engineering Manager spot quality patterns, bottlenecks, and coaching needs. The system provides evidence for a manager. It does not make HR decisions.

## Runtime agents
1. Frontend QA Agent
2. Backend QA Agent
3. Lead PR Reviewer

The Frontend and Backend agents run in parallel. The Lead Reviewer receives both outputs in a `SharedReviewState` object.

## Required outputs
- Structured specialist reviews
- Final approval or request-changes decision
- Append-only review events
- Developer metrics
- Team-level recurring issues
- Manager Brief
- Four-view local dashboard

## Boundary
PR activity can reveal engineering patterns. It cannot diagnose motivation, burnout, engagement, promotion readiness, or termination readiness on its own.
