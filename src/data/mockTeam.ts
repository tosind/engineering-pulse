import { Developer, PullRequest } from '../types';

export const developers: Developer[] = [
  { id: 'maya', name: 'Maya Chen', level: 'Senior Full Stack Engineer', specialty: 'fullstack', managementContext: 'High-throughput engineer with strong quality and broad ownership.' },
  { id: 'daniel', name: 'Daniel Okafor', level: 'Mid-level Backend Engineer', specialty: 'backend', managementContext: 'Backend-focused engineer. Dataset is designed to reveal recurring boundary-condition and validation issues.' },
  { id: 'priya', name: 'Priya Shah', level: 'Senior Engineer', specialty: 'fullstack', managementContext: 'Assigned the highest-complexity work. Lower raw throughput should be interpreted in context.' },
  { id: 'marcus', name: 'Marcus Lee', level: 'Junior Full Stack Engineer', specialty: 'fullstack', managementContext: 'Early inconsistency followed by visible improvement across consecutive work.' }
];

export const pullRequests: PullRequest[] = [
  {
    id: 'PR-101', developerId: 'maya', title: 'User profile editor', domain: 'fullstack', complexity: 3,
    description: 'Adds editable user profile fields with optimistic UI and validated API updates.',
    submittedAt: '2026-08-01T09:00:00Z', approvedAt: '2026-08-01T12:00:00Z', linesChanged: 214,
    changedFiles: ['app/profile/ProfileEditor.tsx', 'src/api/profile.ts', 'src/schemas/profile.ts'],
    diff: '+ Profile editor with optimistic state\n+ Shared profile schema\n+ Server-side validation\n+ Error rollback handling',
    demoFindings: { frontend: [{ category:'accessibility', severity:'low', file:'app/profile/ProfileEditor.tsx', line:88, description:'Success status is not announced to assistive technology.', recommendation:'Add an aria-live region for save status.' }], backend: [] }
  },
  {
    id: 'PR-102', developerId: 'daniel', title: 'Orders API', domain: 'backend', complexity: 3,
    description: 'Creates order submission and retrieval endpoints.',
    submittedAt: '2026-08-02T10:00:00Z', approvedAt: '2026-08-03T11:00:00Z', linesChanged: 176,
    changedFiles: ['src/api/orders.ts', 'src/db/orders.ts'],
    diff: '+ POST /orders\n+ GET /orders/:id\n- payload validation omitted\n- missing not-found branch',
    demoFindings: { frontend: [], backend: [
      { category:'input_validation', severity:'high', file:'src/api/orders.ts', line:42, description:'Request payload is passed to persistence without schema validation.', recommendation:'Validate the payload before constructing the order record.' },
      { category:'edge_cases', severity:'medium', file:'src/api/orders.ts', line:76, description:'Missing order IDs return a generic 500 instead of a controlled 404.', recommendation:'Handle the not-found path explicitly.' }
    ] }
  },
  {
    id: 'PR-103', developerId: 'priya', title: 'Permission evaluation engine', domain: 'backend', complexity: 5,
    description: 'Introduces hierarchical policy evaluation with deny precedence, caching, and audit output.',
    submittedAt: '2026-08-03T08:00:00Z', approvedAt: '2026-08-04T18:00:00Z', linesChanged: 642,
    changedFiles: ['src/auth/policyEngine.ts', 'src/auth/cache.ts', 'tests/policyEngine.test.ts'],
    diff: '+ Hierarchical policy graph\n+ deny-precedence evaluator\n+ cache invalidation\n+ audit trail\n+ comprehensive tests',
    demoFindings: { frontend: [], backend: [{ category:'observability', severity:'low', file:'src/auth/cache.ts', line:121, description:'Cache eviction lacks a structured debug event.', recommendation:'Emit an audit-level cache eviction event.' }] }
  },
  {
    id: 'PR-104', developerId: 'marcus', title: 'Dashboard filters', domain: 'frontend', complexity: 2,
    description: 'Adds multi-select dashboard filters and URL state synchronization.',
    submittedAt: '2026-08-05T09:30:00Z', approvedAt: '2026-08-06T17:00:00Z', linesChanged: 188,
    changedFiles: ['app/dashboard/Filters.tsx', 'app/dashboard/useFilters.ts'],
    diff: '+ filter state\n+ URL sync\n- stale closure in reset callback\n- labels not associated with controls',
    demoFindings: { frontend: [
      { category:'state_management', severity:'high', file:'app/dashboard/useFilters.ts', line:54, description:'Reset callback captures stale filter state and can restore an outdated selection.', recommendation:'Use a functional state update or stable reducer.' },
      { category:'accessibility', severity:'medium', file:'app/dashboard/Filters.tsx', line:91, description:'Filter controls are not programmatically associated with their labels.', recommendation:'Add explicit label/control associations.' }
    ], backend: [] }
  },
  {
    id: 'PR-105', developerId: 'daniel', title: 'Batch payment endpoint', domain: 'backend', complexity: 4,
    description: 'Adds batched payment processing with database writes and retry handling.',
    submittedAt: '2026-08-07T08:00:00Z', approvedAt: '2026-08-09T10:00:00Z', linesChanged: 351,
    changedFiles: ['src/api/payments.ts', 'src/db/payments.ts', 'src/services/paymentProcessor.ts'],
    diff: '+ batch payment route\n+ transaction writes\n- request schema validation\n- transaction rollback gap\n- sequential account lookup loop',
    demoFindings: { frontend: [], backend: [
      { category:'input_validation', severity:'high', file:'src/api/payments.ts', line:38, description:'Batch items are accepted without validating amount, currency, or account identifiers.', recommendation:'Validate each batch item with the shared payment schema.' },
      { category:'data_integrity', severity:'critical', file:'src/services/paymentProcessor.ts', line:109, description:'Partial failures can commit earlier payments without rolling back the batch.', recommendation:'Wrap the batch in an atomic transaction or implement explicit compensating behavior.' },
      { category:'database_queries', severity:'medium', file:'src/db/payments.ts', line:67, description:'Account records are fetched sequentially inside the batch loop.', recommendation:'Batch account lookups to avoid an N+1-style query pattern.' }
    ] }
  },
  {
    id: 'PR-106', developerId: 'maya', title: 'Analytics widgets', domain: 'frontend', complexity: 3,
    description: 'Adds reusable trend and score widgets with loading and empty states.',
    submittedAt: '2026-08-09T09:00:00Z', approvedAt: '2026-08-09T14:00:00Z', linesChanged: 267,
    changedFiles: ['app/analytics/TrendCard.tsx', 'app/analytics/ScoreCard.tsx'],
    diff: '+ reusable widgets\n+ loading state\n+ empty state\n+ memoized chart data',
    demoFindings: { frontend: [], backend: [] }
  },
  {
    id: 'PR-107', developerId: 'marcus', title: 'Notification preferences', domain: 'fullstack', complexity: 3,
    description: 'Adds user notification settings with accessible controls and validated persistence.',
    submittedAt: '2026-08-11T09:00:00Z', approvedAt: '2026-08-11T17:00:00Z', linesChanged: 244,
    changedFiles: ['app/settings/Notifications.tsx', 'src/api/notifications.ts', 'src/schemas/notifications.ts'],
    diff: '+ reducer-based state\n+ accessible grouped controls\n+ schema validated API\n+ tests for reset and save',
    demoFindings: { frontend: [{ category:'performance', severity:'low', file:'app/settings/Notifications.tsx', line:77, description:'Derived channel options are rebuilt on every render.', recommendation:'Move static option metadata outside the component.' }], backend: [] }
  },
  {
    id: 'PR-108', developerId: 'priya', title: 'Background job execution system', domain: 'backend', complexity: 5,
    description: 'Adds idempotent background jobs with retry policy, dead-letter handling, and metrics.',
    submittedAt: '2026-08-12T07:00:00Z', approvedAt: '2026-08-14T15:00:00Z', linesChanged: 711,
    changedFiles: ['src/jobs/runner.ts', 'src/jobs/retryPolicy.ts', 'src/jobs/deadLetter.ts', 'tests/jobs.test.ts'],
    diff: '+ idempotency keys\n+ exponential retry\n+ dead-letter queue\n+ metrics\n+ failure-path tests',
    demoFindings: { frontend: [], backend: [{ category:'maintainability', severity:'low', file:'src/jobs/retryPolicy.ts', line:49, description:'Retry constants are local to the module rather than centralized.', recommendation:'Move retry defaults to the shared runtime configuration.' }] }
  }
];

export function getDeveloper(id: string): Developer | undefined { return developers.find(d => d.id === id); }
export function getPullRequest(id: string): PullRequest | undefined { return pullRequests.find(pr => pr.id === id); }
