# Saved Draft Markdown Export

Saved draft export gives the rider a copy-ready Markdown snapshot of an in-progress saved draft slot before create.

It is separate from the post-create ride receipt.

## What it exports

The saved draft Markdown export includes:

- saved draft slot id
- saved timestamp
- idea text
- repo name override, when set
- visibility override, when set
- starter stack override, when set
- starter issue count override, when set
- restore and review boundary notes

## What it does not export

The saved draft export does **not** include:

- edited starter-file drafts
- edited starter-issue drafts
- file approvals
- issue approvals
- approval ledger rows
- create results
- ride receipts
- GitHub tokens
- GitHub writes

This keeps the export useful for planning and handoff without turning it into an approval artifact.

## Copy boundary

The current implementation renders a read-only multiline Markdown box.

The rider can tap/select/copy using device or browser controls.

RepoRider does not add a clipboard dependency yet. A future clipboard implementation should make the copy action visible, explicit, and receipt-safe.

## Import boundary

RepoRider can import its own saved draft Markdown snapshots back into the current editor.

Import is still a planning action, not an approval action. It restores only idea text and steering controls, then forces the rider to review generated files and starter issues again.

See `docs/SAVED_DRAFT_IMPORT.md` for the import contract and parser validation rules.

## Restore boundary

A saved draft export can help someone recreate planning intent, but it does not restore authority.

Core rule:

> A saved draft export preserves planning context. It does not preserve approval authority.

After restoring or importing from an exported draft, the rider must review generated files, review generated issues, approve files, approve issues, inspect the ledger, and run create again.
