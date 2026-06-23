# Restore Ride Draft

RepoRider can restore a recent session ride into the current editor as a new draft.

This feature is designed for the mobile builder who created a mock ride, wants to branch from that idea, or wants to retry a similar repo plan without retyping everything.

## What gets restored

Restore brings back only the captured planning inputs:

- the idea text
- the rider steering overrides, such as repo name, visibility, stack, and issue count

Those values are enough for RepoRider to regenerate the current repo plan, starter files, starter issues, safety scan, and receipts from the normal planner path.

## What does not get restored

Restore intentionally does not bring back review-state artifacts:

- starter-file draft edits
- starter-issue draft edits
- file approvals
- issue approvals
- approval-ledger pass state
- create/run completion state

After restore, the rider must review, edit, diff, approve, ledger-check, and create again.

## Why approvals reset

Approvals are content-sensitive. They are not general permission slips for a file path or issue title.

A restored draft is a new ride candidate, so approvals reset even if the restored idea produces the same starter files or issues. This prevents accidental reuse of old approvals after a plan is rehydrated, edited, or rerun.

## Current boundary

Restore is session-only.

RepoRider does not persist ride history to device storage yet, does not sync restored drafts to a cloud account, and does not write restored data to GitHub. It only moves already-in-memory session history back into the current planner input fields.

## Live-mode rule

When live GitHub writes arrive, restore must keep the same rule:

> Restoring a ride can repopulate planning inputs, but it cannot bypass preview, diff, approval, ledger, guard, or create boundaries.
