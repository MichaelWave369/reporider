# Approval Receipt Preview

RepoRider shows a read-only approval ledger before the create step.

This ledger answers one simple question:

> What exact starter-file drafts are approved for this ride?

## What the ledger shows

For every reviewed starter file, the preview lists:

- File path
- Approval state
- Whether the file still matches the generated baseline or was edited by the rider
- Language
- Risk level
- Character count
- A compact display fingerprint

The display fingerprint is intentionally short and safe. It is designed for human comparison in the UI, not for cryptographic signing.

## Why this exists

RepoRider should never ask a rider to approve an invisible bundle.

The approval ledger gives the rider one final summary before mock or live creation:

1. Which files are included?
2. Which files were edited?
3. Which files still need approval?
4. Which fingerprint represents the currently reviewed draft?

## Safety boundary

The approval ledger is read-only.

It does not:

- Change draft contents
- Approve files by itself
- Write to GitHub
- Replace file-by-file approval
- Replace the safety scan

It only reflects the current reviewed starter-file state.

## Live-mode rule

When RepoRider gains live GitHub writes, the live writer must use the same reviewed starter files summarized by this ledger.

The rule remains:

> What the rider approved is what RepoRider writes.

If a file is edited after approval, its content fingerprint changes and the file must be approved again before creation can continue.
