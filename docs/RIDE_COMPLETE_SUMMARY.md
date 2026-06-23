# Ride Complete Summary

RepoRider shows a final ride-complete summary after a mock create succeeds.

This card is the post-create counterpart to the pre-create approval ledger:

- the approval ledger asks, "What is about to be written?"
- the ride-complete summary answers, "What did this ride prepare?"

## What it shows

The summary includes:

- mock/live mode
- repository URL
- default branch
- approved starter-file count
- approved starter-issue count
- edited starter-file count
- edited starter-issue count
- total write-artifact count
- file draft character count
- issue draft character count
- receipt count
- queued starter file paths
- queued starter issue titles
- final receipt lines

## Current boundary

The summary is generated from the mock writer result.

In current mock mode, it does **not** prove that GitHub was changed. It proves that RepoRider carried an approved write package through the simulated create boundary and produced a stable final receipt.

## Live-mode rule

When live GitHub writes are added, this same summary should be populated from the real write result:

- created repository URL from GitHub
- created file paths from the commit response
- opened issue titles from issue creation responses
- receipt rows from the same write operation

The rider should never have to infer whether the ride succeeded from scattered UI state.

## Safety rule

The summary must not bypass approval gates.

A ride-complete summary can only appear after:

1. every current starter-file draft is approved;
2. every current starter-issue draft is approved;
3. the safety scan is not blocked;
4. the create boundary returns a result.

## Design principle

The final screen should feel like a boarding pass and a receipt at the same time:

> Here is the repo ride you approved, here is what was prepared, and here are the receipts.
