# Auth Capability Model

RepoRider now has a typed auth capability model that lets the app describe future GitHub auth readiness without requesting OAuth, storing tokens, or enabling live writes.

This is part of the `#31` OAuth/write-mode readiness milestone.

## Current state

The current build reports:

```text
status: mock_only
canRequestOAuth: false
canStoreToken: false
canAttemptLiveWrites: false
```

That means RepoRider can explain future GitHub permissions and show auth readiness, but the only executable create path remains mock write mode.

## Capability states

### `mock_only`

The safe default. RepoRider can plan, preview, approve, save drafts, export receipts, and run mock create flows, but it cannot request OAuth or write to GitHub.

### `auth_unavailable`

A future state for builds where live auth is expected but blocked by configuration, device support, network state, missing provider setup, or explicit policy.

### `auth_ready`

A future state meaning the auth layer is ready to begin a consent flow. This does not mean RepoRider may write to GitHub. Live writes still require fresh approvals, safety scan pass, dry-run verification, and explicit rider action.

## Capability booleans

The model exposes three direct booleans:

- `canRequestOAuth`
- `canStoreToken`
- `canAttemptLiveWrites`

All three are false in the current build.

## Required gates

The mock model lists the gates that must exist before auth can progress:

1. OAuth provider wiring must exist.
2. Secure token storage adapter must be reviewed.
3. Permission consent must be explicit and current.
4. Safety scan must be upgraded for live writes.
5. Dry-run writer must pass before any real writer is enabled.

## UI boundary

The `AuthCapabilityCard` displays the capability model to the rider.

It does not:

- start OAuth,
- ask for a GitHub token,
- store credentials,
- unlock live mode,
- create repositories,
- push files,
- open issues,
- or grant write authority.

## Restore/import boundary

Saved drafts, imported Markdown, restored ride history, duplicated slots, reordered slots, pinned slots, and archived slots do not change auth capability.

Planning state and auth capability stay separate.

## Write boundary

Even when `auth_ready` exists later, a token alone must never write. Live write mode must still pass:

1. current permission explanation,
2. current auth capability,
3. secure token storage checks,
4. safety scan checks,
5. file approval fingerprints,
6. issue approval fingerprints,
7. dry-run writer result,
8. final rider confirmation,
9. live receipt generation.

## Implementation note

The current implementation intentionally returns a mock-only capability from `buildMockAuthCapability()`.

Future implementations should add new builders/adapters instead of weakening the mock-only default.
