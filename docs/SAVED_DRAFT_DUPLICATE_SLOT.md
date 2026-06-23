# Saved Draft Duplicate Slot

RepoRider can duplicate a selected saved draft slot into a fresh session slot so the rider can branch an idea without touching the original.

## Why this exists

Saved draft slots are useful for parking an in-progress idea before create. Duplication adds a safe branching move:

- keep the original saved draft untouched
- create a fresh slot with a new timestamp
- carry forward the same idea text and steering controls
- give the copy a short `copy` label for recognition
- let the rider later rename, restore, export, or delete the copy independently

## What gets duplicated

A duplicate carries only the safe planning snapshot:

- idea text
- repo name override, if present
- visibility override, if present
- starter stack override, if present
- starter issue count override, if present

## What does not get duplicated

Duplication does not copy operational or approval state:

- no starter-file drafts
- no starter-issue drafts
- no file approvals
- no issue approvals
- no approval ledger state
- no ride-complete result
- no GitHub token
- no GitHub repository
- no GitHub writes

## Session-only boundary

Duplicated slots are still session-only. They remain available while the app is open, but RepoRider does not persist them to device storage or sync them to a cloud account yet.

## Restore boundary

Restoring a duplicated slot follows the same rule as restoring any saved slot:

> Restore reloads idea text and steering controls only. Every starter file and starter issue must be reviewed and approved again before create unlocks.

## Label boundary

If the original slot has a label, the duplicate receives a derived copy label such as `Camping app copy`. If the original is unlabeled, RepoRider uses a generic `Draft copy` label. The rider can rename or clear that label later.

The label is metadata only. It does not change the draft snapshot, repo plan, approvals, ledger state, or create behavior.