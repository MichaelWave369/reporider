# Dry-Run Writer Adapter Contract

RepoRider's dry-run writer adapter is the next safe step toward live GitHub write-mode. It creates a typed seam for future repo/file/issue writers without performing any real remote action.

Current status: **dry-run only**.

The adapter does not:

- request OAuth
- read credentials
- store credentials
- create repositories
- push files
- open issues
- retry writes
- promote receipts into write authority

## Why this exists

Before RepoRider can support live GitHub writes, the app needs one stable contract that can consume the reviewed write package and return receipt-ready planning data.

That lets the UI answer:

- Which current starter-file drafts have fresh approvals?
- Which current starter issues have fresh approvals?
- Which safety policy version reviewed this package?
- What safety status did that policy return?
- Would the repo creation package be blocked by safety findings?
- How many files would be pushed if live mode existed?
- How many issues would be opened if live mode existed?
- Which gates are still blocking live promotion?

## Inputs

The dry-run writer consumes only the current, reviewed runtime state:

1. `RepoPlan`
2. `SafetyReport`
3. `approvedByUser`
4. approved starter-file drafts
5. approved starter issue drafts
6. receipt preview
7. live-mode state

Generated baselines are not enough. A starter file or issue must be current and approved before it contributes to the dry-run write package.

## Output

The adapter returns a `DryRunWriterResult` with:

- mode: `dry_run`
- status: `dry_run_ready` or `blocked`
- repo creation intent
- approved file count
- approved issue count
- receipt preview count
- safety policy version
- safety status
- safety warning count
- safety blocker count
- blocking reasons
- boundary notes

## Blocking rules

The current dry-run writer blocks promotion if:

- the rider has not approved the current write package
- every current starter-file draft is not freshly approved
- every current starter issue draft is not freshly approved
- safety status is not `pass`
- live-mode state is not armed for real writes

Because live-mode state is currently `mock_only`, live promotion remains blocked even if all reviewed artifacts are approved.

## Receipt coupling

The dry-run writer records the active safety policy version and safety status in its typed summary and in a boundary note.

This makes dry-run output receipt-ready without implying write authority. It lets the UI, future logs, and later handoffs prove which local policy reviewed the package.

## Boundary

Dry-run readiness is not live write authority.

Even if a future dry-run result reports no artifact blockers, RepoRider still requires separate future gates for:

- real OAuth
- secure device token storage
- live-mode arming
- safety policy hardening
- repo writer implementation
- file writer implementation
- issue writer implementation
- final receipt generation

Saved drafts, imported Markdown, restored history, exported receipts, and prior mock creates never bypass these gates.

## Current implementation

The current adapter is `dryRunWriterAdapter` in `src/lib/dryRunWriter.ts`.

It is intentionally local and deterministic. It returns summaries and blockers only.

No GitHub API call happens here.