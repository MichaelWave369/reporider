# JSON Receipt Verification Preview UI

RepoRider includes a local JSON receipt check surface in the ride receipt export card.

## Purpose

The card lets a rider paste a RepoRider typed JSON ride receipt and see a compact local verification summary.

It uses the same `verifyJsonRideReceipt` helper that is covered by the safety fixture suite.

## What it checks

The preview reports the verifier result for:

- JSON parseability.
- RepoRider receipt format id.
- Safety policy version and status presence.
- Ride, approved-file, approved-issue, and receipt-chain fingerprints.
- Receipt list presence.
- Receipt `previousReceiptHash` links.
- Recomputed per-receipt hashes.
- Final receipt-chain hash consistency.
- Boundary note presence.

The preview shows a compact result status, summary, policy/status pills, receipt count, and the first several checks so mobile screens stay readable.

## Boundary

The preview does **not**:

- Restore approvals.
- Restore review state.
- Import a ride into app history.
- Create repositories.
- Push files.
- Open issues.
- Request OAuth.
- Read or store tokens.
- Contact GitHub.
- Contact package registries.
- Cryptographically sign receipts.
- Anchor hashes remotely.
- Certify a future repository as safe.

A valid preview means the pasted JSON receipt is internally consistent according to the local verifier. It does not grant write authority.

## Current fixture relationship

The fixture suite covers the verifier core, including valid receipts, changed receipt details, broken chain links, missing boundary notes, and parse failures.

The UI card is intentionally thin: it renders the verifier output and does not change the verifier's safety behavior.
