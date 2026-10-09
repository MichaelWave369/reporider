# RR-A07: Independent Ledger Checkpoints

**Goal:** detect local ledger rollback, truncation, and rewriting by checking its historical head SHA-256 against a checkpoint the operator deliberately stores **outside the entire RepoRider courier inbox**.

**Trust model:** operator-only command line. No MCP method, cloud account, timestamp service, real external witness, digital signature, independently authenticated human identity, GitHub writer, or new approval authority. A local checkpoint is only as trustworthy as where its owner keeps it.

## Why RR-A07 is necessary

RR-A06's hash-linked ledger detects changes to existing entries **if the chain itself is intact**. A malicious or accidental deletion of the latest entries can leave a shorter chain that verifies as locally consistent.

RR-A07 lets you retain a historical sequence and head SHA-256 externally. Its verifier checks:
1. The existing ledger and all still-referenced courier packets and review notes pass current RR-A06/RR-A03 replay verification.
2. The externally supplied checkpoint has a bounded, exact, internally checksummed structure with no asserted signatures, authenticated identity, or execution permission.
3. The current ledger contains at least as many entries as the checkpoint.
4. The entry at the checkpoint's **specific sequence** has the exact anchored SHA-256 head.

Later ledger additions are allowed without changing the older anchored prefix. A truncated or rewritten prefix fails. **Full-history rewriting can only be detected against a genuine separately preserved checkpoint.** If an attacker can also replace the external checkpoint, this provides no independent protection.

## Windows PowerShell workflow

Starting with RR-A06 configured under a private home folder:

```powershell
git pull origin main
npm install
npm run agent:build

$inbox = Join-Path $HOME "RepoRiderInbox"
npm run ledger:console -- --inbox $inbox verify

# This is just an example destination. The real security comes from
# separately controlled storage, not from the word "external".
$anchor = Join-Path $HOME "RepoRiderLedgerWitness.json"

# Use the Node CLI directly so npm banners do not corrupt redirected JSON.
node .\scripts\reporider-ledger.cjs --inbox $inbox checkpoint |
  Set-Content -Path $anchor -Encoding utf8

node .\scripts\reporider-ledger.cjs --inbox $inbox verify-checkpoint $anchor
```

The checkpoint command only prints JSON to stdout. It does **not** automatically write a checkpoint anywhere. You deliberately choose the external destination. The verifier accepts **only an absolute existing file path outside the inbox**. For meaningful protection, preserve a copy on separate trusted storage such as an offline drive or an independently controlled private location. Keeping the JSON file elsewhere on the same unprotected system does **not** provide independent custody.

For other shells, redirect JSON stdout to an absolute filepath outside the inbox and pass that path to `verify-checkpoint`.

## Commands

- `checkpoint`: recomputes the full live RR-A06 ledger, produces a JSON checkpoint containing current sequence, head SHA-256, generation time, and explicit denial of authenticated/signed/authorized status. Read-only.
- `verify-checkpoint ABSOLUTE_FILE`: reads the operator-specified external JSON file (max 4096 bytes), checks its structure and checksum, verifies the entire current ledger, and compares the checkpoint's recorded prefix against current history. Read-only.

The checkpoint schema is `reporider.local.external-checkpoint.v0.1` with these fields:

```json
{
  "schema": "reporider.local.external-checkpoint.v0.1",
  "sequence": 0,
  "head_sha256": "0000000000000000000000000000000000000000000000000000000000000000",
  "created_at": "2026-10-09T00:00:00.000Z",
  "purpose": "MANUALLY_PRESERVE_OUTSIDE_INBOX",
  "independent_custody_verified": false,
  "signer_authenticated": false,
  "signature_verified": false,
  "execution_authorized": false,
  "checkpoint_sha256": "GENERATED_CHECKSUM_SHA256"
}
```

The example is intentionally incomplete as a usable file: generate the checksum using the actual command. The checksum detects accidental edits but is **not** a signature, not protection against intentional forgery, and not an external witness.

## Fail-closed outcomes

- `CHECKPOINT_AHEAD_OF_LEDGER` when a checkpoint references an entry beyond the current verified ledger, including a truncated tail.
- `CHECKPOINT_HISTORY_DIVERGED` when a checkpoint's head no longer matches its historical prefix.
- `CHECKPOINT_CHECKSUM_MISMATCH`, `CHECKPOINT_INVALID_CONTENT`, or `CHECKPOINT_UNKNOWN_FIELDS` for malformed or changed external checkpoint data.
- `CHECKPOINT_MUST_BE_OUTSIDE_INBOX` for attempts to point at an anchor in the same courier/ledger tree.
- Symlinked checkpoint targets/ancestor paths, over-4096-byte files, non-absolute paths and nonregular files are rejected.

Successful output is `CHECKPOINT_MATCHES_VERIFIED_CHAIN`, *not* "independent custody verified." The latter is always false because software cannot establish who stored or controlled the checkpoint.

## Tests

```sh
npm run agent:test
npm run ledger:test
npm run checkpoint:test
```

The fixture suite uses real courier packets and informational human review notes. It verifies genesis pinning, extension, tampering, prefix mismatch, tail truncation, a recomputed but wrong checkpoint, injected metadata and false authority flags, oversized checkpoint files, forbidden inbox-local paths and symlinks.

**Capability ≠ authority.** Anchored evidence can strengthen auditability; it does not let agents approve themselves or perform GitHub writes.
