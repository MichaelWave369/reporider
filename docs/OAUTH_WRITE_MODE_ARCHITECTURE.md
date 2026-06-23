# OAuth and Write-Mode Architecture

RepoRider is currently a mock writer. This document defines the architecture required before any live OAuth token, repository creation, file write, or issue creation is enabled.

## Goal

Move from mock create to real GitHub write mode without weakening the existing safety model.

Live mode must preserve RepoRider's core promise:

- no blind commits
- no hidden GitHub writes
- private-first defaults
- file-by-file approval
- issue-by-issue approval
- content-sensitive stale approvals
- human-readable receipts
- mock mode as the safe fallback

## Current boundary

RepoRider can already simulate a full create flow:

1. Capture idea text.
2. Generate a local repo plan.
3. Let the rider steer repo name, visibility, stack, and issue count.
4. Save, label, duplicate, reorder, pin, archive, export, and import session draft slots.
5. Preview generated files and issues.
6. Edit file and issue drafts.
7. Approve current file and issue drafts.
8. Review a unified approval ledger.
9. Run a safety scan placeholder.
10. Mock-create a repository result and receipts.

That flow does not request a GitHub token and does not write to GitHub.

## Required live-mode modules

### 1. Auth boundary

The auth boundary owns OAuth/device authorization state and token availability.

Responsibilities:

- request the minimum viable GitHub scopes
- explain the requested permissions before auth begins
- keep token values out of UI logs, receipts, issue bodies, exported Markdown, and error messages
- support sign out / token clear
- expose only capability state to the app, such as `unauthenticated`, `authenticated`, or `expired`

The UI should never directly inspect or print token values.

### 2. Token storage boundary

Token storage must be platform-specific and private by default.

Requirements:

- no token in React state longer than needed for a call
- no token in AsyncStorage as plain text
- no token in saved draft slots, ride history, receipts, Markdown exports, or issue imports
- no token in crash reports or analytics
- clear token on sign out

Preferred mobile storage:

- iOS Keychain
- Android Keystore-backed secure storage
- web fallback only when explicitly supported and documented

### 3. Permission explainer

Before OAuth begins, the rider sees a plain-language explanation of what RepoRider is asking for.

Minimum copy requirements:

- what RepoRider can create
- what RepoRider cannot do without approval
- how mock mode differs from live mode
- how to revoke/clear access
- why private-first creation remains the default

### 4. Write-mode state machine

RepoRider should treat live writes as an explicit mode transition.

Suggested states:

```text
mock_only
live_available
live_armed
writing
write_complete
write_failed
```

Rules:

- `mock_only` is default.
- `live_available` means auth exists, but no write has been armed.
- `live_armed` requires all current approvals and a passing safety scan.
- `writing` may only start from `live_armed`.
- any content edit exits `live_armed` and requires fresh approval.
- failed writes must return to a safe state with clear recovery instructions.

### 5. Approval gate adapter

The write adapter must receive only current approved artifacts.

Inputs:

- repo name
- visibility
- current approved file drafts
- current approved issue drafts
- current safety report
- current approval ledger

The adapter must reject writes when:

- any required file approval is missing or stale
- any required issue approval is missing or stale
- safety scan blocks the ride
- repo name is invalid
- auth is missing or expired
- live mode has not been explicitly armed

### 6. GitHub writer service

The writer service performs real GitHub calls only after all gates pass.

Expected write sequence:

1. Create repository with requested visibility.
2. Create approved files from rider-reviewed drafts.
3. Create approved starter issues from rider-reviewed issue drafts.
4. Generate a write receipt with created URLs and operation statuses.

The writer should be idempotency-aware where possible. If a write partially fails, the rider needs a recovery receipt instead of a hidden retry loop.

### 7. Failure and recovery model

Write failures must be visible and recoverable.

Handle at least:

- auth expired
- insufficient permissions
- repo name already exists
- rate limit exceeded
- network timeout
- file creation failure
- issue creation failure
- partial repo creation

Every failure path should produce:

- a human-readable error
- the safe next step
- whether any remote resource was created
- whether retry is safe
- whether manual cleanup may be needed

### 8. Receipt expansion

Live mode needs receipts beyond the current mock receipt.

Required live receipt fields:

- mode: `live`
- repo URL
- file operation results
- issue operation results
- approval fingerprint summary
- safety scan summary
- auth capability state, not token data
- failure/recovery notes when applicable

Receipts must never contain token values.

## Safety invariants

These must remain true after live mode exists:

1. A token alone never permits a write.
2. A generated plan alone never permits a write.
3. A saved draft slot never permits a write.
4. A restored ride never permits a write.
5. Imported Markdown never permits a write.
6. Archived or pinned draft metadata never permits a write.
7. Any content edit invalidates prior approval for that artifact.
8. Mock mode remains available even when live mode exists.
9. Real writes require a final human action after all gates pass.
10. Receipts describe actions but do not become authority to repeat them.

## Minimal implementation sequence

Recommended build order:

1. Add permission explainer screen/card.
2. Add auth capability model with mock auth state.
3. Add token storage adapter interface without real token persistence.
4. Add live-mode state machine in mock mode.
5. Add write adapter interface with dry-run implementation.
6. Harden repo-name validation and conflict messaging.
7. Expand safety scan result model.
8. Add live receipt schema.
9. Add real OAuth only after the above test cleanly.
10. Add real GitHub writer behind the same gates.

## Issue tracker alignment

This document starts the architecture track for:

- `#31 Milestone: OAuth and real GitHub write-mode readiness`
- `#2 GitHub OAuth and secure token handling`
- `#4 Create repo writer service with dry-run mode`
- `#17 GitHub API failure and rate-limit handling`
- `#20 Permission explainer`
- `#25 Document generated repo receipt format`
- `#30 Generated issue creation guardrails`

## Non-goals for this step

This document does not implement OAuth.

It does not request a token, store a token, create a repository, push a file, or open a GitHub issue from the app.

It defines the boundary that future code must satisfy first.
