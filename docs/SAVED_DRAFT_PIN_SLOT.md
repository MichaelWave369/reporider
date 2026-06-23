# Saved Draft Slot Pinning

RepoRider saved draft pinning lets the rider keep important session-only draft slots at the top of the saved draft list.

Pinning is a navigation and priority feature only. It does not change the saved planning snapshot.

## What pinning does

When a slot is pinned, RepoRider keeps it above unpinned slots in the current session list.

Pinned slots still contain the same safe saved draft data:

- idea text
- repo name override, if set
- visibility override, if set
- starter stack override, if set
- starter issue count override, if set
- optional human label
- saved timestamp
- pinned/unpinned session metadata

## What pinning does not do

Pinning does not store or restore:

- file approvals
- issue approvals
- edited starter files
- edited starter issues
- create results
- ride receipts
- GitHub tokens
- GitHub repositories
- GitHub issues
- any live write state

## Ordering rule

Pinned slots are prioritized above unpinned slots.

Reordering can still move slots around, but pin priority is reapplied after the move so pinned slots remain above unpinned slots.

This keeps the mental model simple:

1. pinned slots first
2. unpinned slots after
3. slot contents unchanged

## Export behavior

Saved draft Markdown exports include whether the slot was pinned at export time.

That pin status is informational metadata. Importing a saved draft export still restores only the idea text and steering controls after preview. Pinning does not bypass preview, save, restore, or approval gates.

## Boundary

Pinning is session-only metadata.

It helps the rider find priority drafts faster, but it carries no approval authority and creates no GitHub-side effect.
