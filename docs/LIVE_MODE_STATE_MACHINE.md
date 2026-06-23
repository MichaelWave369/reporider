# Live Mode State Machine

RepoRider now has a typed live-mode state machine, but the current implementation is intentionally locked to `mock_only`.

This document defines what the state machine means and what it does **not** authorize.

## Current implementation

The active implementation uses `buildMockLiveModeState(...)`.

Current state:

```text
mock_only
```

That means RepoRider may simulate the reviewed ride, but it cannot request OAuth, store tokens, create repositories, push files, or open issues.

## State names

The type system allows these future states:

```text
mock_only
live_available
live_armed
writing
write_complete
write_failed
```

Only `mock_only` is reachable today.

## State meanings

### mock_only

The app can run the mock creation flow only.

No live write can start.

### live_available

Future state. OAuth, secure token storage, and a verified dry-run writer may exist, but live writes are not armed yet.

### live_armed

Future state. The rider has fresh approvals, safety scan has passed, and the system may be ready to start a write.

This still must require an explicit human action before writing.

### writing

Future state. A live GitHub write is in progress.

Receipts and rollback/recovery state must be captured.

### write_complete

Future state. A live write completed and receipts were finalized.

A completed receipt is not repeat authority.

### write_failed

Future state. A live write failed or partially completed.

Recovery must be explicit and receipt-backed.

## Current model fields

`LiveModeState` reports:

- `status`
- `label`
- `summary`
- `canArmLiveMode`
- `canStartWrite`
- `canRetryWrite`
- `isTerminal`
- `requiredGates`
- `boundaryNotes`

The current mock state reports all write/arm/retry capabilities as blocked.

## Required gates before live mode can arm

The mock state lists these gates:

1. Auth capability must be `auth_ready`.
2. Secure token storage must replace the null adapter and report ready.
3. Live writer service must pass dry-run verification.
4. Current file and issue drafts must have fresh approvals.
5. Safety scan must pass the live-write policy gate.

## Boundary rules

The live-mode state machine is descriptive in this build.

It does not:

- request OAuth
- accept a token
- store a token
- read a token
- create a repository
- push files
- open issues
- replay receipts
- promote saved drafts or imports into write authority

## Restore and import boundary

Saved drafts, imported Markdown, archived drafts, ride history restores, and exported receipts never advance live-mode state by themselves.

Restoring planning inputs resets review state and keeps live-mode state at `mock_only`.

## Future implementation order

Before any non-mock state can become reachable:

1. Add a reviewed secure token storage implementation.
2. Add a dry-run writer adapter.
3. Expand safety scan for live-write policy.
4. Require fresh file and issue approvals.
5. Add explicit human arm/write actions.
6. Add failure and recovery receipts.
7. Only then consider real OAuth and real GitHub writes.
