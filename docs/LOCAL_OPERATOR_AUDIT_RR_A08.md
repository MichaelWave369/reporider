# RR-A08: Local Operator Audit Reports

**Status:** read-only, terminal-based human audit view of RR-A04 courier packets, RR-A05 unsigned review notes, RR-A06 hash-linked ledger, and optional RR-A07 independently preserved checkpoints.

**Authority:** none. No MCP tool, GitHub writes, signed operator identity, token storage, cloud service, automatic uploads, HTML execution, or new approval service.

## Why this rung exists

The ledger proves internal consistency of recorded evidence, but a human still needs to know what is recorded, what came into the local inbox but never entered the ledger, whether there are rejected packets, and whether note files remain unrecorded. RR-A08 provides one bounded, read-only report without printing the source code or full notes.

It includes an optional historical checkpoint match. **Without a genuine external checkpoint**, it must explicitly report `LOCAL_CHAIN_ONLY_VERIFIED`, never silently claim independently witnessed evidence.

## Quick start (Windows PowerShell)

From the RepoRider checkout:

```powershell
git pull origin main
npm install
npm run agent:build

$inbox = Join-Path $HOME "RepoRiderInbox"

# Read-only human report
npm run audit:console -- --inbox $inbox --format text

# JSON suitable for local analysis; does not write any files by itself
npm run audit:console -- --inbox $inbox --format json

# Verify a checkpoint you previously stored outside the inbox
$witness = Join-Path $HOME "RepoRiderLedgerWitness.json"
npm run audit:console -- --inbox $inbox --checkpoint $witness --format text

# Save report only via your own explicit shell redirection, if desired
node .\scripts\reporider-audit.cjs --inbox $inbox --checkpoint $witness --format json |
  Set-Content -Encoding utf8 -Path (Join-Path $HOME "RepoRiderAudit.json")
```

**A copy elsewhere on the same unprotected drive is not necessarily an independent witness.** Keep a genuine RR-A07 checkpoint under separate trusted custody if you need meaningful rollback detection. The audit verifies checksum/chain consistency, not checkpoint provenance.

For Bash/zsh, the CLI works analogously with `node scripts/reporider-audit.cjs --inbox "$HOME/RepoRiderInbox" --format text`.

## Commands

```
npm run audit:console -- --inbox ABSOLUTE_DIR [--checkpoint ABSOLUTE_FILE] [--format text|json]
```

Default format is `text`; no background process, write, or saved report is created by the program.

- **text**: compact, readable status and chronological evidence timeline, quoted packet/note filenames, inbox statuses, and count summaries.
- **json**: `reporider.local.operator-audit.v0.1` structured metadata, timeline and verification flags.
- **--checkpoint ABSOLUTE_FILE**: optional; reuses RR-A07 external checkpoint verification. A mismatch, rollback, malformed checkpoint or unsafe file path aborts with a nonzero exit code and no successful report.
- **--inbox**: required unless the `REPORIDER_COURIER_INBOX` environment variable supplies the already-configured local folder.

## Report meaning

A report includes:
- Current verified ledger record count and SHA-256 head
- `checkpoint.status` of `NOT_SUPPLIED` or `OPERATOR_SUPPLIED_CHECKPOINT_MATCHED`
- Per-decision counts: recommendation for *separate* authorization, request changes, and decline
- Chronological ledger entries referencing packet/note basenames, proposal fingerprints and SHA-256 evidence digests, not raw source code
- Inbox classifications: `RECORDED`, `READY_NOT_RECORDED`, and `REJECTED`
- Note classifications: `RECORDED`, `UNRECORDED_NOT_VERIFIED`, and `NOT_REGULAR_FILE`, plus unexpected-entry count
- Immutable false authority claims: `operator_identity_authenticated=false`, `source_identity_authenticated=false`, `signature_verified=false`, `approval_granted=false`, `live_write_authorized=false`, `github_write_executed=false`, `data_sent_remotely=false`, `report_persisted=false`

**The report does not identify a real human reviewer.** It only describes evidence visible to the local operating-system account. An unrecorded note is not verified by this audit, and an already recorded note still does not authorize a GitHub write.

## Defensive behavior

1. RR-A06 fully replays and verifies recorded ledger history, all linked proposal packets, review note bytes, chain hashes, and artifact references.
2. RR-A07 optionally confirms a separately supplied historical checkpoint.
3. RR-A04/RR-A05 packet inventories are read using their bounded, replay-verified local readers. Invalid or tampered unrecorded packets are flagged rejected, not executed.
4. Operator note inventory checks directory type and safe path, enforces private Unix permissions, caps 600 entries, and **does not read unrecorded note content**. Suspicious filenames and symbolic links are counted.
5. A final ledger re-verification helps detect ordinary concurrent append races. It is **not** an immutable filesystem snapshot against an attacker controlling the OS.
6. Reporting defaults to stdout. There is no hidden write, archiving, deletion, approved status, network transport, or arbitrary output-file option.

A readable report is an aid to independent judgment, not evidence that an agent or operator was authenticated.

## Verification

```sh
npm run agent:test
npm run mcp:test
npm run operator:test
npm run ledger:test
npm run checkpoint:test
npm run audit:test
```

The RR-A08 fixture suite tests empty-ledger reporting, actual courier packets, orphan notes, recorded decisions, rejection counts, checkpoint extension, fresh JSON output, read-only behavior, tail truncation, checkpoint mismatch, bad paths, invalid options, symlinks, packet tampering, and fail-closed error exit.

No changes to the public GitPages app or existing Expo application are necessary.

## Future potential

A fully **local** read-only visual ledger view could render this audit JSON as inert text, but it must not expose a public endpoint to your PC, claim provenance, or make an unsigned note into execution approval. A separate trusted executor would need a newly designed, authenticated human consent mechanism and secure GitHub token custody.
