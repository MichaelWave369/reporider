# Editable Starter Drafts

RepoRider separates generated starter-file previews from rider-approved starter-file drafts.

This keeps the approval boundary honest: the app can generate a suggested seed package, but the rider can still change the files before any create action runs.

## Current behavior

- RepoRider generates starter-file previews from the current `RepoPlan`.
- The rider can edit the selected file draft in the mobile UI.
- Edited files are marked with an asterisk in the file rail.
- The selected file can be reset to the generated baseline.
- All drafts can be reset at once.
- Drafts are keyed to the current plan, so stale edits do not silently cross into a new idea or stack.
- The rider can switch to diff view to compare the generated baseline against the reviewed draft before approval.
- Mock create receives the reviewed draft files, not regenerated content hidden behind the UI.

## Diff behavior

The inline diff view is local and read-only. It compares one generated starter file against the rider-reviewed draft for that same path.

- Unchanged lines are displayed neutrally.
- Generated-only lines are shown with `-`.
- Rider-only lines are shown with `+`.
- Changed line slots are rendered as a generated removal followed by a rider addition.

## Receipt behavior

The mock GitHub client compares reviewed drafts against the generated baseline and records how many file drafts diverged before approval.

This gives RepoRider a clean future path for:

- content hash receipts
- reviewer notes
- signed approval envelopes
- file-by-file approval state
- generated vs reviewed comparison receipts
- live GitHub writes that preserve the exact reviewed files

## Boundary

Editable drafts and diff view still do not create remote repositories, write local files, request tokens, or push to GitHub.

They only change or inspect the in-memory reviewed file set used by mock mode.

Live mode should keep this exact rule:

> What the rider reviewed is what RepoRider writes.
