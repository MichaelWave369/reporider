# RR-A05: Local Operator Console

**Scope:** local, terminal-only inbox inspector and human review note exporter.

**Authority:** no authenticated user approval, no GitHub writes, no agent execution, no new MCP tools, no network listener, no automatic browser connection. Existing RR-A01 through RR-A04 behavior is retained.

This rung gives an operator a way to see what's sitting in the optional RR-A04 courier directory **without opening each file in a text editor**. It is separate from the public GitHub Pages Review Desk: nothing is synchronized automatically.

## Windows PowerShell quick start

In your cloned RepoRider checkout:

```powershell
git pull origin main
npm install
npm run agent:build

$inbox = Join-Path $HOME 'RepoRiderInbox'
New-Item -ItemType Directory -Path $inbox -Force | Out-Null

npm run operator:console -- --inbox $inbox list
```

To examine a particular courier packet from the listing:

```powershell
npm run operator:console -- --inbox $inbox inspect reporider-review-REPLACE-WITH-ACTUAL-UUID.json
```

To enter the manual review flow (use a real interactive terminal, not a remote/background agent shell):

```powershell
npm run operator:console -- --inbox $inbox review reporider-review-REPLACE-WITH-ACTUAL-UUID.json
```

The CLI accepts `REPORIDER_COURIER_INBOX` as a default directory, so you may omit `--inbox` if that environment variable already points to the exact existing local folder.

The courier remains opt-in and is still controlled separately through `REPORIDER_COURIER_ENABLED=1` and `REPORIDER_COURIER_INBOX` in the **MCP server process**, as documented in [RR-A04](LOCAL_PROPOSAL_COURIER_RR_A04.md). Opening this console does not start or enable the courier.

## What the commands do

- **list**: display replay-verified courier packet status, repository name, proposed visibility, file and issue counts, and number of safety findings. Invalid/tampered/oversized entries are marked REJECTED. The list does not write files, mark anything reviewed, or notify humans.
- **inspect filename**: show the complete proposed artifact index, current heuristic safety findings, and a short provenance warning, without exporting anything.
- **review filename**: requires a real terminal. The console prints each proposed file/issue body as JSON-escaped inert text and prompts the operator to type **REVIEWED** after each item genuinely inspected. It then offers **recommend for separate authorization**, **request changes**, or **decline**. A recommendation requires all items checked. Only after the operator types **SAVE** does the program export a separate JSON note.

After explicit SAVE, the informational review note appears in:

```
RepoRiderInbox/operator-notes/reporider-note-<generated-UUID>.json
```

It is created with exclusive, no-follow file open, requested owner-only Unix permissions, and a newly created private notes directory. The original courier packet stays untouched; nothing is deleted, dispatched, pushed or merged.

The note schema is the existing `reporider.local.review-note.v0.1`. RR-A05 adds a distinct `review_location=LOCAL_OPERATOR_CONSOLE`, while the browser's notes keep `review_location=LOCAL_BROWSER_ONLY`. Both are **informational only** and always set:

```json
{
  "source_identity_authenticated": false,
  "reviewer_identity_authenticated": false,
  "signature_verified": false,
  "approval_granted": false,
  "live_write_authorized": false,
  "executed": false,
  "delivered": false
}
```

A recorded recommendation is not an authorization token and cannot be replayed as permission to make a GitHub write.

## Defensive boundaries

- Reuses RR-A03's fresh replay and native safety scanner; refuses blocked/tampered proposals.
- Requires a previously configured **absolute** inbox directory that exists and is not a symlink. Denies group/other writable directories on Unix. Does not establish Windows account identity or configure Windows ACLs.
- Reads only basename-validated courier-created UUID filenames, not user-specified arbitrary paths.
- Refuses symlinked/irregular, empty, invalid UTF-8 or over-250000-byte input packets.
- Limits enumeration to 128 packet-looking entries to prevent huge unbounded reviews.
- Uses JSON-escaped output for untrusted code/content so terminal control sequences are not executed by the display.
- Cannot review without an interactive terminal. Export requires explicit typed SAVE and current manually checked artifacts. Operator note directory is separate from queue.
- No MCP method permits a model to read/list/remove the human inbox. Local processes with the same operating-system file privileges may still be able to read it; don't confuse this with encryption or user authentication.
- The console intentionally does **not** archive/delete courier packets, run generated code, call GitHub, or access OAuth tokens.

## Verification

```sh
npm run agent:test
npm run mcp:test
npm run operator:test
```

The RR-A05 test creates a real courier packet, verifies native replay, invokes real CLI list/inspect subprocesses, refuses noninteractive review, verifies recommendation check requirements, exports an unsigned human-side informational note, checks tampering and blocked input, and rejects path traversal, symlinks, oversized packets and oversized directory scans.

## Next gates

A future actual write executor would need a separate independent authenticated human permission grant, nonforgeable approval binding to current exact artifact contents, independent secure token custody, revalidation at execution time, and real audit logs. RR-A05 **does none of this**.

**Trust boundary:** a local operator tool may inspect and annotate agent-proposed data. It may not convert that data or an exported note into authority.
