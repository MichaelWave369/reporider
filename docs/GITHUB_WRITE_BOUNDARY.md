# GitHub Write Boundary

RepoRider should never jump straight from an idea to a remote GitHub write without visible consent, safety review, and a receipt trail.

## Current mode

The app currently runs in **mock write mode**.

Mock mode means:

- no GitHub token is requested
- no repository is created remotely
- no files are pushed
- no issues are opened
- the app simulates the full ride locally so the UX can be tested safely

## Required gates before live mode

Before RepoRider can enable real GitHub writes, the app needs:

1. GitHub OAuth sign-in.
2. Secure token storage suitable for mobile devices.
3. Clear scope display before authorization.
4. Human approval immediately before writing.
5. Safety scan pass or explicit reviewed warning state.
6. Diff/file preview before the first commit.
7. Receipt generation after every GitHub action.
8. Safe failure behavior if any write step fails halfway through.

## Default live-write policy

When live mode lands, RepoRider should default to:

- private repositories
- least-privilege GitHub scopes
- draft branches when possible
- no generated secrets
- no silent public publishing
- no background writes after approval expires

## Receipt model

Each write step should emit a receipt with:

- action name
- status
- timestamp
- remote URL or local mock reference
- human-readable detail

Receipts are part of the core product, not decoration. They let the rider understand exactly what RepoRider did.
