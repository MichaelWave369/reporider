# Approval Receipt Preview

RepoRider shows a read-only approval ledger before the create step.

This ledger answers one simple question:

> What exact starter files and starter issues are approved for this ride?

## What the ledger shows

For every reviewed starter file, the preview lists:

- File path
- Approval state
- Whether the file still matches the generated baseline or was edited by the rider
- Language
- Risk level
- Character count
- A compact display fingerprint

For every reviewed starter issue, the preview lists:

- Issue number
- Issue title
- Approval state
- Whether the issue still matches the generated baseline or was edited by the rider
- Label count
- Body character count
- Total character count
- A compact display fingerprint

The display fingerprint is intentionally short and safe. It is designed for human comparison in the UI, not for cryptographic signing.

## Why this exists

RepoRider should never ask a rider to approve an invisible bundle.

The approval ledger gives the rider one final summary before mock or live creation:

1. Which files are included?
2. Which issues are included?
3. Which files and issues were edited?
4. Which files and issues still need approval?
5. Which fingerprints represent the currently reviewed drafts?

## Safety boundary

The approval ledger is read-only.

It does not:

- Change draft contents
- Approve files or issues by itself
- Write to GitHub
- Replace file-by-file approval
- Replace issue-by-issue approval
- Replace the safety scan

It only reflects the current reviewed starter-file and starter-issue state.

## Live-mode rule

When RepoRider gains live GitHub writes, the live writer must use the same reviewed starter files and starter issues summarized by this ledger.

The rules remain:

> What the rider approved is what RepoRider writes.

> What the rider approved is what RepoRider opens.

If a file or issue is edited after approval, its content fingerprint changes and that artifact must be approved again before creation can continue.
