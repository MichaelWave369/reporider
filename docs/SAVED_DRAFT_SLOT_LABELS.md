# Saved Draft Slot Labels

Saved draft slot labels let the rider add a short human-readable name to a session draft slot.

Examples:

- `Camping checklist v2`
- `RepoRider mobile test`
- `Docs-only handoff`

## Why labels exist

Saved draft slots are useful, but unlabeled slots can be hard to recognize once several ideas are parked in the same session.

A label gives the slot a quick name without changing the underlying saved draft snapshot.

## What a label stores

A label stores only short session metadata attached to the slot.

It does **not** change:

- idea text
- repo name override
- visibility override
- starter stack override
- starter issue count override
- starter-file drafts
- starter-issue drafts
- approvals
- approval ledger state
- create results
- GitHub writes

## Rename and clear behavior

The selected saved draft slot can be renamed from the Saved Drafts card.

The rider can also clear the label. Clearing a label leaves the draft snapshot intact and returns the UI to the fallback slot name.

## Export behavior

Saved draft Markdown exports include the current slot label as metadata when present.

Imports still restore planning inputs only. The label is not imported into the active editor because labels are slot metadata, not repo-planning authority.

## Restore boundary

Restoring a labeled slot reloads only the idea and steering controls.

All review gates still reset:

- starter-file drafts reset
- starter-issue drafts reset
- file approvals reset
- issue approvals reset
- approval ledger must be reviewed again
- create must be run again

Core rule:

> Labels help humans find saved drafts. Labels do not carry approval authority.
