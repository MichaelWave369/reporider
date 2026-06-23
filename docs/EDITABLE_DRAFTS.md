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
- Mock create receives the reviewed draft files, not regenerated content hidden behind the UI.

## Receipt behavior

The mock GitHub client compares reviewed drafts against the generated baseline and records how many file drafts diverged before approval.

This gives RepoRider a clean future path for:

- diff view
- content hash receipts
- reviewer notes
- signed approval envelopes
- live GitHub writes that preserve the exact reviewed files

## Boundary

Editable drafts still do not create remote repositories, write local files, request tokens, or push to GitHub.

They only change the in-memory reviewed file set used by mock mode.

Live mode should keep this exact rule:

> What the rider reviewed is what RepoRider writes.
