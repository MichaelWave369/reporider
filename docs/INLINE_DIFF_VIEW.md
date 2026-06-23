# Inline Draft Diff View

RepoRider now gives the rider a local diff view for each starter-file draft before approval.

The goal is simple: the rider should never approve a seed package without being able to see how their reviewed draft differs from the generated baseline.

## Current behavior

- The starter-file card has two modes: `Edit Draft` and `Diff View`.
- `Edit Draft` lets the rider change the selected starter file.
- `Diff View` compares the generated baseline against the rider-approved draft.
- Unchanged lines are shown with a neutral prefix.
- Generated-only lines are shown as removed lines with `-`.
- Rider-only lines are shown as added lines with `+`.
- Changed line slots are shown as a generated removal followed by a rider addition.

## Boundary

The diff view is read-only. It does not write files, create repos, request tokens, or push to GitHub.

The diff view only answers one approval question:

> What changed between the generated starter file and the draft the rider is about to approve?

## Why this matters

RepoRider's future live write mode should write exactly the rider-reviewed file contents. The diff view makes that review practical on a phone.

This creates a clean path for future features:

- content hash receipts
- signed approval envelopes
- file-by-file approval state
- generated vs reviewed comparison receipts
- live GitHub writes that preserve the exact reviewed drafts
