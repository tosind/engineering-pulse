# Agent Contracts

## Specialist review
Every specialist returns:
```json
{"agent":"frontend_qa","prId":"PR-101","status":"issues_found","summary":"...","findings":[{"category":"accessibility","severity":"low","file":"file.tsx","line":10,"description":"...","recommendation":"...","confidence":0.9}]}
```

## Lead review
The Lead Reviewer returns:
```json
{"prId":"PR-101","decision":"APPROVE","riskScore":4,"summary":"...","blockingFindings":[],"nonBlockingFindings":[],"conflictResolution":[]}
```

Critical findings always block. High findings normally block. Medium is risk-weighted. Low is non-blocking by default.
