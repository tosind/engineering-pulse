export const engineeringStandards = `
ENGINEERING STANDARDS
1. Security and data integrity outrank style and convenience.
2. Validate all untrusted input at trust boundaries.
3. Authentication and authorization decisions must fail safely.
4. Database operations must handle errors, transactions, and scale-sensitive query patterns.
5. APIs must return deliberate status codes and stable error contracts.
6. Frontend state must avoid stale closures, race conditions, and hidden side effects.
7. UI controls must be keyboard accessible and programmatically labeled.
8. Loading, empty, error, and retry states should be explicit where applicable.
9. New behavior should have meaningful tests, especially failure paths and edge cases.
10. Prefer clear maintainable code over clever abstractions.
`;

export const severityPolicy = `
SEVERITY POLICY
- critical: security, authorization, destructive data integrity, or severe production risk. Always blocks.
- high: material correctness or reliability issue. Normally blocks.
- medium: meaningful maintainability, performance, accessibility, or recoverability concern. Risk-weighted.
- low: minor improvement or style issue. Non-blocking by default.
Priority: Security > Correctness > Reliability > Data Integrity > Performance > Maintainability > Style.
`;
