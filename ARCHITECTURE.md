# Architecture

```text
PR -> ReviewPipeline -> FE QA ---\
                     -> BE QA ----> SharedReviewState -> Lead Reviewer -> Event Store
                                                                       -> Analytics
                                                                       -> Manager Brief
                                                                       -> Dashboard
```

## Design choices
- Specialist reviews run concurrently with `Promise.all`.
- Agent output is structured JSON and validated before entering analytics.
- Severity rules are deterministic guardrails. A model cannot approve a critical/high issue simply by voting differently.
- SQLite is used for a portable local event/review store.
- `DEMO_MODE` uses deterministic findings so the repository is demonstrable without credentials. Supplying `OPENROUTER_API_KEY` activates the real OpenRouter path.
