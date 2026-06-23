# Saved Draft Import: Save Preview as Slot

RepoRider can now save a successfully parsed imported Markdown preview as a session-only draft slot without restoring it into the current editor.

## Why this exists

Sometimes the rider wants to collect or park an imported idea without interrupting the ride they are currently shaping. The save-to-slot action lets them keep the imported planning inputs nearby while leaving the active editor untouched.

## Flow

1. Paste a RepoRider saved draft Markdown export.
2. Tap **Preview Import**.
3. Review the extracted idea and steering overrides.
4. Tap **Save Preview as Slot** to park the preview as a saved draft slot.
5. Continue editing the current draft, or restore the saved slot later when ready.

## What is saved

Only the imported preview's planning snapshot is saved:

- idea text
- repo name override, when present
- visibility override, when present
- stack override, when present
- starter issue count override, when present
- session timestamp for the new slot

## What is not saved

The saved slot does not include:

- pasted Markdown text itself
- file drafts
- issue drafts
- approvals
- approval ledger state
- create state
- ride history receipts
- GitHub tokens
- GitHub writes

## Safety rule

Saving an imported preview as a slot does not restore anything into the active editor. It is a parking action only. If the rider later restores that saved slot, RepoRider reloads the idea and steering controls while resetting file drafts, issue drafts, approvals, ledgers, and create state.

## Boundary

This remains session-only. RepoRider does not persist saved imported previews to device storage or cloud storage yet.