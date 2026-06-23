# Saved Draft Reorder Slot

RepoRider supports reordering saved draft slots inside the current app session.

This gives the rider a light way to keep the most important in-progress ideas near the top of the saved-draft list without changing any saved draft content.

## What reorder does

Reorder can:

- Move a selected saved draft slot up one position.
- Move a selected saved draft slot down one position.
- Keep the selected slot contents exactly the same.
- Keep the selected slot id exactly the same.
- Keep the selected slot timestamp exactly the same.
- Keep the selected slot label exactly the same.

## What reorder does not do

Reorder does not:

- Change the saved idea text.
- Change steering overrides.
- Change the slot label.
- Duplicate the slot.
- Delete the slot.
- Restore the slot into the editor.
- Save approvals.
- Restore approvals.
- Change file drafts.
- Change issue drafts.
- Create a repository.
- Push files.
- Open GitHub issues.
- Write to GitHub.

## Boundary rule

Reorder is session-list organization only.

> Moving a saved draft changes where it appears, not what it contains.

## Why this exists

Mobile builders may save several ideas quickly. Reorder lets them keep the active or important idea at the top while leaving older saved drafts available beneath it.

## Safety posture

Reorder does not bypass review.

A reordered slot still has to be restored as a fresh draft before use, and every file and issue still requires review and approval before mock create can run.

## Persistence boundary

Saved draft slots remain session-only in the current skeleton.

Reordered position also remains session-only until a future explicit persistence feature is added.