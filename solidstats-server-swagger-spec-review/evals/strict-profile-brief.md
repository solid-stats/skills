# Synthetic contract policy probe

This is a bounded authoring/review exercise, not a deployed API or a full
specification phase. Use the supplied version of the skill's contract rules.
Do not run GSD, contact a product repository, query memory, fabricate validation
results, request approval, or dispatch more agents. No implementation is needed.

An author proposes these new public contract choices:

1. `GET /ReplayRequest/{request_id}`, with operationId `get_replay_request`,
   component `replay_request`, and JSON field `created_at`. The current
   implementation uses those names; no consumers or retained records exist.
2. A result has `oneOf: [ReadyResult, FailedResult]` and a discriminator mapping
   on `status`, but each branch makes `status` optional and declares it as a
   free string. Every result field is optional; both branches accept arbitrary
   additional properties. No positive or negative payload cases exist.
3. A 409 error from the replay module and a 409 error from moderation both use
   `errorCode: conflict`. One means duplicate replay content and carries
   `{replayId: UUID}`; the other means a prohibited moderation transition and
   carries `{currentStatus: string}`. Their descriptions explain the difference.
4. Another two operations reference the very same `ReplayNotFoundError`
   component: fixed status 404, `error: Not Found`, fixed
   `errorCode: replay_not_found`, human message, and required closed details
   `{replayId: UUID}`. They denote exactly the same visibility/absence condition.
5. The author simplifies all error responses to one generic component with
   `errorCode: string`, `details: object` and `additionalProperties: true`.
   The web client branches on `message.includes('duplicate')`, casts details
   to the expected shape and treats an unknown code as a known conflict.
6. A structural OpenAPI validator passes. The author claims this proves global
   semantic uniqueness of error codes and that all possible union payloads
   match exactly one branch. Existing schema/export behavior is offered as a
   reason to keep all proposed choices.

Return a concise JSON object with `findings` (numbered design choice, problem,
concrete correction and rule source), `validReuse` (assessment of choice 4),
`unknownCodeBehavior`, and `validationLimits`. Identify actual defects without
inventing product states, imposing a unique code per endpoint, or claiming a
real validator was executed. This is a policy probe only; a full review would
still require real stage YAML, payload checks and the normal human gate.
