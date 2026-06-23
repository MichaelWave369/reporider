# Starter File Approval Gate

RepoRider now treats starter-file approval as a first-class gate in the ride flow.

## Purpose

The rider should not approve a vague repo creation action. They should approve the exact starter files that RepoRider may create.

That means each generated or edited starter file moves through this path:

1. Generated from the current repo plan.
2. Optionally edited by the rider.
3. Compared against the generated baseline in diff view.
4. Approved file by file.
5. Passed into the mock create lane as the reviewed starter package.

## Content-sensitive approvals

Approvals are tied to the current draft content, not just the file path.

If a rider approves `README.md` and then changes the draft, the previous approval no longer matches the current content. The create action stays locked until the rider approves the new draft.

This protects the live-write boundary from stale approvals.

## Unlock rule

The create panel only unlocks when:

- the safety report is not blocked,
- every planned starter file has an approval fingerprint for its current content,
- the app is not already running a create action.

In mock mode, this proves the approval model without touching GitHub.

## Live-mode rule

When live OAuth and GitHub writes are added, the live writer must use the same rule:

> What the rider approved is what RepoRider writes.

No regenerated starter content should bypass the approval gate.
