# Data Model

Core contracts are declared in `src/types.ts`:
- `Developer`
- `PullRequest`
- `ReviewFinding`
- `AgentReview`
- `SharedReviewState`
- `LeadReviewDecision`
- `StoredReview`
- `DeveloperMetrics`
- `TeamMetrics`
- `ManagerBrief`

SQLite tables:
- `developers`
- `pull_requests`
- `agent_reviews`
- `lead_reviews`
- `review_events`
