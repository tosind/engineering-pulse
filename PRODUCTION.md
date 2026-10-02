# Production rollout status

Code preparation is in progress. This branch is not a deployed production service.

## Intended first deployment

One private instance, one operator, one process, persistent SQLite storage. Put an HTTPS reverse proxy in front of the service. Basic authentication uses username `operator` and the `PULSE_API_TOKEN` password; API clients can use the same token as a Bearer credential. Protect the token in a secret store and do not place it in URLs or public client bundles.

Set `NODE_ENV=production`, `OPENROUTER_API_KEY`, a random `PULSE_API_TOKEN` of at least 32 characters, and a comma-separated `GITHUB_REPOSITORIES` allowlist (`owner/repo`). Use a fresh `DATABASE_PATH` so demo records are not carried into the pilot. Only public repositories work without `GITHUB_TOKEN`; private repositories need a narrowly scoped read-only GitHub credential. Repository code is sent to OpenRouter; only configure repositories approved for that processing.

The service starts on loopback by default. Set `HOST=0.0.0.0` inside a container and restrict network exposure to the reverse proxy. The Dockerfile runs as a non-root user. Mount `/app/data` as persistent storage owned by UID 1000. Container build and host deployment remain unverified until a Docker daemon and target host are available.

## Real PR intake

Authenticated `POST /api/reviews/github` with `Content-Type: application/json`:

```json
{"repository":"owner/repo","number":123,"complexity":3}
```

Assignment complexity is supplied by the operator, not inferred as an engineer performance rating. Reviews are keyed by repository, PR number and head commit. Intake rejects unapproved repositories, binary files, incomplete diffs, over 100 changed files, over 100k diff characters, and PRs that change during fetching. The application never posts approvals, merges PRs, executes repository code, or grants repository write access. A model decision is advisory and still requires a human review of the full change. Sample PR routes are disabled in live mode.

## Release and recovery

Run `npm ci` and `npm test` before building. Deploy an immutable commit/image and record its digest. Check public `/api/health`, verify unauthenticated data requests return 401, then run one approved PR review and verify the stored commit identity and events. Test the workflow using the real model account before calling the pilot production.

Back up SQLite using its online backup mechanism or `VACUUM INTO`; do not copy only the database file while WAL writes are active. Verify a restore on a separate instance before launch. Keep one active process to preserve the review concurrency guard. Roll back to the last image using the same compatible database; back up before any schema change. SIGTERM allows 10 seconds for shutdown; interrupted reviews retain the prior completed result and require an operator retry.

Before wider use: independent security review, operator identity management instead of a shared token, durable review job queue, retention controls, quota/rate limiting, observability alerts, restore drill, load testing, and a policy for model/code-data processing. Current management metrics reflect AI review results rather than actual GitHub approvals or full employee performance.
