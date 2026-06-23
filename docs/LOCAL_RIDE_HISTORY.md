# Local Ride History

RepoRider keeps a small in-app history of recent mock ride receipts so the rider can revisit and export earlier rides during the same session.

## Purpose

The local ride history helps a mobile builder recover the last few completed mock rides without scrolling through the current Ride Complete card only.

It supports:

- Reviewing recent mock ride summaries.
- Reopening the Markdown export surface for an earlier ride.
- Comparing approval counts across recent ride attempts.
- Clearing the in-session history when the rider wants a clean slate.

## Current boundary

The history is intentionally **session-only**.

That means:

- No device storage is used yet.
- No AsyncStorage dependency is added yet.
- No cloud sync is used.
- No hidden background persistence happens.
- Refreshing or closing the app can clear the history.

This keeps the privacy boundary simple while RepoRider is still in mock write mode.

## Stored shape

Each history entry stores:

- A generated local history id.
- The ride completion timestamp from the final receipt when available.
- The typed `GithubCreateRepoResult` returned by the mock GitHub boundary.

Because the entry stores the same typed result that powers the Ride Complete screen and Markdown export, history receipts do not need a separate export format.

## Current limit

RepoRider keeps the most recent **five** rides in memory.

The newest ride appears first. If the same generated id appears again, the newer entry replaces the older matching entry.

## Live-mode rule

When RepoRider moves to live GitHub writes, local ride history must still remain explicit and privacy-respecting.

Before adding persistence, the app should define:

- Where receipts are stored.
- How long they remain.
- Whether the rider can delete them.
- Whether sensitive repo names or issue titles need redaction.
- Whether export history should be included in the same receipt model.

## Non-goals for this slice

This feature does not:

- Persist ride history after app close.
- Upload receipts anywhere.
- Prove that GitHub was changed.
- Replace the final Ride Complete summary.
- Replace the copy-ready Markdown export.

It only keeps recent mock ride receipts available during the current app session.