# Saved Draft Slots

Saved draft slots let the rider park an in-progress repo idea before running a mock create ride.

They are separate from ride history:

- **Saved draft slots** are for work that has not been created yet.
- **Ride history** is for completed mock create runs and their receipts.

## Current behavior

A saved draft slot stores:

- idea text
- repo name override, when set
- visibility override, when set
- starter stack override, when set
- starter issue count override, when set
- saved timestamp

RepoRider keeps the most recent five saved draft slots in app state.

## Saved draft export

Each selected saved draft slot can render a copy-ready Markdown planning snapshot.

That export includes the slot id, timestamp, idea text, steering overrides, and restore/review boundary notes.

The saved draft export is **pre-create**. It is not the same thing as the post-create Markdown ride receipt.

## What saved draft slots do not store

Saved draft slots do **not** store:

- edited starter-file drafts
- edited starter-issue drafts
- file approvals
- issue approvals
- approval ledger state
- create results
- ride receipts
- GitHub tokens
- GitHub writes

This keeps saved drafts useful without becoming a hidden approval bypass.

## Restore rule

Restoring a saved draft slot reloads the idea and steering controls as a fresh draft.

After restore, the rider must review files, review issues, approve files, approve issues, inspect the ledger, and run create again.

Core rule:

> Saving or exporting a draft parks planning inputs. It does not preserve approval authority.

## Persistence boundary

Saved draft slots are session-only right now.

That means:

- they exist while the app remains open
- they are not written to device storage
- they are not synced to a cloud service
- they are not sent to GitHub

Future persistent saved drafts should require an explicit storage design, visible retention rules, and a clear delete/export path.
