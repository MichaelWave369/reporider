# RR-A06: Operator Evidence Ledger

**Purpose:** a local, append-only-by-the-program, hash-linked ledger that records *which exact existing courier packet and informational operator note* were associated. It is a **local consistency check**, not a cryptographic signature, verified user identity, tamper-proof remote record, or GitHub authorization.

RR-A06 is deliberately an **operator-side CLI only**, not an MCP tool. Agents have no tool to list, read, update, verify, or append to this ledger. The default MCP planner stays unchanged.

## Windows PowerShell

From the RepoRider checkout, use your existing manually configured RR-A04 local inbox:

```powershell
git pull origin main
npm install
npm run agent:build
$inbox = Join-Path $HOME "RepoRiderInbox"
npm run ledger:console -- --inbox $inbox init
npm run ledger:console -- --inbox $inbox verify
```

**Initialize only once.** The `init` command creates the `operator-ledger/` directory under the existing inbox with owner-only permissions requested where supported. It refuses to reset an existing directory. Windows directory/file ACLs still follow the machine's configuration; the code does **not** establish Windows user authentication, secure Windows ACLs, encryption, or provenance.

Complete a review using RR-A05 (which already requires manually inspecting artifacts and typing SAVE):

```powershell
npm run operator:console -- --inbox $inbox list
npm run operator:console -- --inbox $inbox review reporider-review-REPLACE-WITH-UUID.json
```

That produces an unsigned JSON note in `operator-notes/`. Then **explicitly** link that note to the corresponding unchanged proposal:

```powershell
npm run ledger:console -- --inbox $inbox record reporider-review-REPLACE-WITH-UUID.json reporider-note-REPLACE-WITH-UUID.json
npm run ledger:console -- --inbox $inbox verify
npm run ledger:console -- --inbox $inbox head
```

Use the actual basenames returned by the courier, review console, and ledger. Never enter filesystem paths for individual packets or notes. The program constructs the paths inside its fixed local folder.

## What gets stored

`RepoRiderInbox/operator-ledger/entry-000001.json`, `entry-000002.json`, and so on. Each entry includes:
- strictly increasing sequence and previous entry SHA-256
- SHA-256 of the **exact packet bytes** and **exact unsigned review-note bytes**
- proposal fingerprint, review decision, and generated entry timestamp
- SHA-256 of the new entry's own canonical serialized fields
- explicit `approval_granted=false`, `reviewer_identity_authenticated=false`, `signature_verified=false`, `live_write_authorized=false`, `github_write_executed=false`

The ledger stores references and digests, **not** duplicate source code, prompt text, personal data, or raw file contents. Original packets and notes stay in their existing directories.

**Commands:**
- `init`: explicitly create the private ledger subdirectory. Fails if already present.
- `record <packet> <note>`: explicitly append a new evidence entry; fails if the current chain or referenced evidence is inconsistent.
- `verify`: read and validate the whole chain, linked notes and referenced packets, including fresh RR-A03 local replay/safety checks. Read only.
- `head`: print the current sequence and SHA-256 head. Read only.

No quiet new writes occur during `verify` or `head`. Ledger records cannot be edited or removed by commands in this feature. The append operation uses an exclusive lock and exclusive filename creation. If a previous process crashes while writing, it may leave a lock or partial entry, in which case it **fails closed**; investigate the disk state manually instead of force-resetting.

## Evidence limitations

- A local hash chain makes accidental or unauthorized changes *detectable during verification* when prior entry digests and source files survive.
- Someone who controls the filesystem can rewrite history and recompute the entire chain, or remove the most recent entries. A previous copy of the `head_sha256` stored **outside this inbox and under separate custody** is required to detect that.
- The `head` output itself is not independently notarized, externally anchored, signed, witnessed, or timestamp-authoritative.
- Replay proves internal consistency of the RR-A01 deterministic planner and heuristic safety policy, not the identity of the submitting agent or the operator, and not code safety.
- Source packet or note changes, even an extra whitespace byte, invalidate the associated ledger digest.
- This does not make the "recommend" review decision an actionable authorization. A separate authenticated human grant and execution-time verification would be required before any future GitHub writer.

## Boundaries and test plan

- Reads only pre-existing courier UUID basenames and local operator-note UUID basenames.
- Max 500 evidence entries, 8192 bytes per entry, 16384 bytes per note, and bounded original courier packets.
- No symlinked ledger directory or evidence file, no group/other-readable ledger directory on Unix, and no new network listener.
- Only explicit `init` and `record` create local files.
- Unknown packet or note paths, tampering, missing sequence, malformed record, duplicate note, lock contention, and unsafe provenance flags fail closed.

```sh
npm run agent:test
npm run mcp:test
npm run operator:test
npm run ledger:test
```

The RR-A06 test creates real agent proposals and operator notes, records entries, verifies links, tampers with packet, note and ledger bytes, tests missing middle entries and deliberate tail deletion, lock contention, and attempts to escape the designated inbox.

**Trust boundary:** evidence of a local review is not authority to act. The ledger is *only* a local record for the human operator.
