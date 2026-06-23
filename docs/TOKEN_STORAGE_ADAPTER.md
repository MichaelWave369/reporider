# Token Storage Adapter

RepoRider now has a typed token storage adapter seam, but the current implementation is intentionally a **null adapter**.

This is part of the live-mode readiness path from `#31`, but it does not enable OAuth, token handling, or GitHub writes.

## Current adapter

Current adapter:

```text
null-token-storage-adapter
```

Current status:

```text
unsupported
```

Current scope:

```text
none
```

The null adapter reports that token storage is unavailable. It does not persist, read, clear, return, log, export, or inspect credential material.

## Why this exists

The adapter exists so future OAuth work has a clearly named integration seam instead of scattering token logic through UI components or writer code.

The goal is to make the future secure implementation obvious:

1. OAuth asks for permission.
2. Token storage receives credentials only through a reviewed secure adapter.
3. The auth capability model checks whether secure storage is ready.
4. The write-mode state machine remains blocked until storage, permissions, approvals, safety, and dry-run checks all pass.

## Current guarantees

In the current build:

- No OAuth flow exists.
- No GitHub token is requested.
- No GitHub token is accepted by the null adapter.
- No GitHub token is stored in memory.
- No GitHub token is written to receipts.
- No GitHub token is written to saved drafts.
- No GitHub token is written to Markdown exports.
- No GitHub token is returned to callers.
- No live GitHub write can be unlocked by this adapter.

## Adapter snapshot

The current snapshot exposes only safe metadata:

- `status`
- `label`
- `summary`
- `scope`
- `hasStoredToken`
- `canPersistToken`
- `canReadToken`
- `canClearToken`
- `requiredGates`
- `boundaryNotes`

The UI can display this metadata to explain why live mode remains blocked.

## Current null operations

The null adapter exposes unavailable operations only:

- `getSnapshot()` returns safe metadata.
- `storeTokenUnavailable()` returns the same blocked snapshot and accepts no token value.
- `readTokenUnavailable()` returns `null`.
- `clearTokenUnavailable()` returns the same blocked snapshot.

This shape is deliberate. The current adapter has no method that accepts a token string.

## Required before a real adapter

A real secure adapter must not be added until these questions are answered:

1. Which platform-backed secure storage provider is used?
2. How are tokens kept out of logs, receipts, saved drafts, Markdown exports, and screenshots?
3. How is storage tested without real credentials?
4. How does token clearing behave if the app is interrupted?
5. How does the auth capability model downgrade if storage fails?
6. How are stale approvals invalidated when auth state changes?

## Boundary

Token storage readiness is not write authority.

Even after a future secure adapter exists, live GitHub writes must still require:

- explicit current consent,
- current non-stale approvals,
- upgraded safety scan pass,
- dry-run writer pass,
- live write-mode state transition,
- receipt generation that never includes token material.

## Next implementation step

The next safe step is to create the live-mode state machine around these capability snapshots, still without real OAuth or real writes.
