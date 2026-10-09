# RR-A09: Audit Observatory (static React GitPage)

**Purpose:** display a human-friendly, **read-only local audit-report snapshot** from the RR-A08 Operator Audit CLI.

**Authority:** NONE. The public website cannot read your filesystem except a file you explicitly choose, cannot access the local MCP courier, cannot verify the actual ledger or independent checkpoint custody, and does not connect to GitHub APIs or execute generated proposals.

## Use it

After merging, open the public RepoRider GitPage:

https://michaelwave369.github.io/reporider/

Choose **Audit Observatory** in the sidebar.

From your Windows PowerShell in the RepoRider checkout, generate a real local report:

```powershell
git pull origin main
npm install
npm run agent:build

$inbox = Join-Path $HOME "RepoRiderInbox"
$report = Join-Path $HOME "RepoRiderAudit.json"

# npm banners are avoided by using the Node CLI directly.
node .\scripts\reporider-audit.cjs --inbox $inbox --format json |
  Set-Content -Path $report -Encoding utf8
```

If you already have an independently preserved RR-A07 checkpoint, include it in the **local report generator**:

```powershell
$witness = Join-Path $HOME "RepoRiderLedgerWitness.json"
node .\scripts\reporider-audit.cjs --inbox $inbox --checkpoint $witness --format json |
  Set-Content -Path $report -Encoding utf8
```

The local report command *fails closed* if its actual ledger or supplied checkpoint does not verify. The resulting JSON report is not a cryptographic attestation of that execution. Do not trust JSON supplied by another party merely because the viewer accepts its structure.

On the GitPage, press **Select local JSON** and choose `RepoRiderAudit.json`. Alternatively, paste the entire JSON report into the import box and click **Inspect pasted JSON**.

The file remains inside the browser tab. No upload, remote storage, browser localStorage/IndexedDB, fetch request, localhost service, GitHub write, or background sync is used.

The **Load synthetic demo** button opens an explicitly labeled *fictional* report with example names, hash shapes and counters. It was NOT generated from your real ledger.

## What it displays

- Reported ledger entry count and SHA-256 head
- Reported checkpoint state: **not supplied** or **matched by local CLI**
- Explicit warning that external checkpoint custody is not verified by the public viewer
- Recorded decisions by category: recommend for separate authorization, request changes, decline
- Packet inbox classification: recorded, unrecorded, rejected
- Unrecorded notes, suspicious entries, and timeline of evidence metadata
- Three filterable explorer views: timeline, inbox, notes, and an inspectable metadata panel

No source code, review-note bodies, credentials, or file contents are included in the RR-A08 report. However, repository names, filenames, labels, timestamps, and hashes can still be sensitive metadata, so inspect what you are opening in any website.

## Validation boundary

The site ships with `site/src/auditReport.js`, a pure parser and structural validator that:
- Accepts only RR-A08 `reporider.local.operator-audit.v0.1` JSON and a bounded input size
- Refuses malformed arrays, inconsistent counts, unexpected ledger sequences or broken links
- Requires a matching imported head digest and (if claimed) matching checkpoint prefix metadata
- Cross-checks decision totals, recorded/unrecorded packet classifications, and note references
- Refuses metadata that claims authenticated identities, verified signatures, GitHub writes or execution approvals
- Displays all imported text as inert React text, never HTML or executable code

**This validation is NOT ledger verification.** The JSON can be fabricated or rehashed. The page does not possess the underlying packet bytes, operator-note bytes, signed witness evidence, or private local trust context. For authoritative current local consistency, use the RR-A08 CLI itself and preserve independently secured RR-A07 witness checkpoints.

## Tests and security

```sh
cd site
npm install
npm test
npm run build
```

`site/tests/audit.test.mjs` tests a structurally valid synthetic fixture, an empty ledger, rejected and pending packets, fake authority claims, broken sequence/hash links, false checkpoint claims, wrong counters and references, malformed JSON, oversized reports and invalid filenames.

RR-A09 changes the static site and its documentation only. Existing Expo, MCP, courier, local operator CLI, evidence ledger, and checkpoint logic are untouched.

**No approval granted. No authenticated person or agent identified. No GitHub write authorized.**
