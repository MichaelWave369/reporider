# JSON Receipt Verification Report

RepoRider includes a small text report builder for typed JSON ride receipt verification results.

## Purpose

`buildRideReceiptVerificationReport` turns a `verifyJsonRideReceipt` result into copy-ready Markdown-style text.

The report is intended for quick sharing, debugging, and review after a local JSON receipt check.

## Included fields

The report includes:

- Overall verifier status.
- Verifier summary.
- Receipt format id.
- Safety policy version.
- Safety status.
- Ride artifact fingerprint.
- Receipt-chain hash.
- Receipt count.
- Passed check count.
- Warning count.
- Attention-check count.
- Warning details when present.
- Attention-check details when present.

## Fixture coverage

The local fixture suite now includes `rideReceiptVerificationReport.fixtures.ts`.

That fixture builds a fresh mock ride result, exports typed JSON, verifies it locally, builds a report, and asserts the report includes status, policy version, receipt-chain hash, receipt count, warning count, and attention-check count.

## Boundary

The report builder formats verifier output only. It does not change app state, restore approvals, create repositories, contact GitHub, sign receipts, or anchor hashes remotely.
