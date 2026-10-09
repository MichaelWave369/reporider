# RepoRider

**Catch the idea. Forge the repo. Ride the build.**

RepoRider is a mobile-first, voice-friendly GitHub creation assistant for builders who get ideas while they are away from the desk.

The goal is simple:

> Speak an idea on your phone, review the repo plan, steer the final settings, save/label/duplicate/reorder/pin/archive/export/import in-progress drafts when useful, preview, edit, diff, approve every starter file and starter issue, inspect the unified approval ledger, then publish a safe starter repository with receipts.

## What this skeleton includes

- Expo + React Native + TypeScript starter app
- Phone-first project capture flow
- In-app GitHub permission explainer for live-mode readiness without requesting OAuth yet
- Typed auth capability model and mock-only auth status card
- Typed token storage adapter seam with a null adapter that stores no credentials
- Typed live-mode state machine locked to mock-only writes in this build
- Receipt-ready dry-run writer adapter contract that performs no GitHub writes and carries safety policy version/status metadata plus approved artifact fingerprints
- Strengthened safety policy gate with policy version, named checks, reviewed file/issue content scope, package manifest checks, warning/blocker counts, rider-facing remediation guidance, and live-write boundary notes
- Live idea-to-repo planner
- Editable repo name, visibility, stack, and starter issue controls
- Session-only saved draft slots for in-progress idea/plan steering
- Saved draft slot labels for easier session navigation
- Saved draft slot duplication for branching an idea without touching the original
- Saved draft slot reorder controls for moving important slots up or down in the session list
- Saved draft slot pinning for keeping priority drafts at the top of the session list
- Saved draft archiving for hiding lower-priority slots without deleting them
- Copy-ready Markdown export for saved draft slots before create
- Saved draft Markdown import with a required preview before save or restore
- Save imported Markdown previews into session draft slots without changing the current editor
- Dynamic repo name, visibility, stack, file, and issue planning
- Generated starter file previews before approval
- Editable starter-file drafts with reset controls
- Inline generated-vs-draft diff view
- File-by-file starter approval gate
- Editable starter issue drafts with title/body/label controls
- Issue-by-issue starter approval gate
- Unified approval receipt preview for starter files and starter issues before create
- Post-create Ride Complete summary with repo URL, queued files, queued issues, approval totals, edit totals, receipts, and policy-coupled safety status
- Copy-ready Markdown ride receipt export after mock create with safety policy version/status metadata, artifact fingerprints, and receipt-chain hashes
- Copy-ready typed JSON ride receipt export after mock create with policy metadata, artifact fingerprints, queued files/issues, receipt-chain hashes, and boundary notes
- Local typed JSON ride receipt verifier for checking format, policy metadata, fingerprints, and receipt-chain consistency without restoring state
- One-tap current JSON verifier helper for testing the current ride export/check loop without manual copy and paste
- Session-only local ride history for recent mock ride receipts
- Draft ride restore from session history with approvals intentionally reset
- Content-sensitive approval fingerprints that stale out after edits
- Code-stack `package.json` planning
- Reviewed starter-file content safety scan for credential-like and destructive-command signals
- Reviewed package manifest safety checks for lifecycle hooks, risky scripts, package-manager commands, dependency names, dependency ranges, dependency sources, missing licenses, package private/visibility mismatches, and invalid JSON
- Reviewed starter-issue body risk classification for credential, destructive, disclosure, ops, auth, and remote-execution signals
- Safety fixture coverage for known-safe, path-policy, Unix/Windows absolute path, visibility, high-risk file, empty/large content, package manifest license/source/range review, reviewed file, reviewed issue, remediation guidance, receipt policy-coupling, receipt fingerprint/chain, typed JSON export, and typed JSON verification examples
- Mock create-repo ride flow that receives reviewed and approved file and issue drafts
- GitHub write boundary model
- OAuth/write-mode architecture contract before live GitHub writes
- Receipt ledger model for every meaningful action, with local artifact fingerprints and receipt-chain hashes
- Product spec and architecture docs
- GitHub issue/PR templates
- Basic CI typecheck workflow plus safety fixture checks
- MIT license

## Current mode

RepoRider currently runs in **mock write mode**.

That means the app can simulate the full ride from approval to repo creation without requesting a GitHub token, creating a real repository, pushing files, or opening issues. This lets us safely build the UX before live OAuth and GitHub writes exist.

## Core flow

1. **Understand permissions** — user sees the current mock-mode boundary and future GitHub permission categories before any OAuth or token flow exists.
2. **Check auth capability** — user sees the typed auth state, currently `mock_only`, with OAuth request, token storage, and live writes all blocked.
3. **Check token storage** — user sees the current null token storage adapter, which stores no credentials and keeps live writes blocked.
4. **Check live mode** — user sees the typed live-mode state machine, currently `mock_only`, with arming, writing, and retry all blocked.
5. **Check dry-run writer** — user sees the receipt-ready writer contract summarize approved artifacts, safety policy version/status, artifact fingerprints, and blocking reasons without performing GitHub writes.
6. **Check safety policy** — user sees the strengthened safety policy gate with policy version, plan scope, reviewed file/issue content scope, package manifest checks, named checks, warnings, blockers, remediation guidance, and required gates.
7. **Capture** — user speaks or types a rough idea.
8. **Shape** — RepoRider turns it into a structured project brief.
9. **Steer** — user edits repo name, visibility, starter stack, and issue count.
10. **Save draft** — user can save the current idea and steering controls as a session-only draft slot before create.
11. **Label saved draft** — user can add a short session label to recognize a saved draft slot without changing the saved snapshot.
12. **Duplicate saved draft** — user can branch a selected saved draft into a fresh slot with a new timestamp and copy label while leaving the original untouched.
13. **Reorder saved drafts** — user can move a selected saved draft up or down in the session list without changing its contents.
14. **Pin saved draft** — user can pin priority saved drafts so they stay above unpinned slots in the session list.
15. **Archive saved draft** — user can hide lower-priority saved drafts from the active draft console without deleting them.
16. **Export saved draft** — user can open a copy-ready Markdown snapshot of a saved draft slot before create.
17. **Preview imported draft** — user can paste a RepoRider saved draft snapshot and inspect the extracted idea/steering controls before any action.
18. **Save imported preview** — after preview, user can park the imported idea/steering controls as a saved draft slot without changing the current editor.
19. **Import saved draft** — after preview, user can restore the imported idea/steering controls as a fresh draft with approvals reset.
20. **Plan** — user reviews repo files, starter issues, and safety status.
21. **Preview** — user inspects the generated starter files that would be committed.
22. **Edit files** — user can tweak starter-file drafts before approval.
23. **Diff** — user compares generated baselines against rider-reviewed file drafts.
24. **Approve files** — every current starter-file draft must be approved before create unlocks.
25. **Edit issues** — user can tweak starter issue titles, bodies, and labels.
26. **Approve issues** — every current starter-issue draft must be approved before create unlocks.
27. **Ledger** — user reviews one unified approval receipt with file status, issue status, edit status, and compact fingerprints.
28. **Guard** — safety checks catch unsafe repo names, public visibility review needs, secrets, Unix/Windows absolute paths, traversal paths, dangerous file names, risky defaults, package manifest lifecycle/script/dependency/license/private/range/source risks, reviewed-file credential/destructive/empty/large content, and reviewed-issue credential/security/ops/auth/empty/large risk signals; findings include cleanup guidance.
29. **Create** — approved starter files and approved starter issues are pushed/opened on GitHub once live mode exists.
30. **Complete** — user sees a final Ride Complete summary with repo URL, queued files, queued issues, approval totals, edit totals, receipts, safety policy version, safety status, artifact fingerprints, and receipt-chain hash.
31. **Export ride** — user can open a copy-ready Markdown ride receipt for humans and a typed JSON ride receipt for tools; both exports include policy metadata, artifact fingerprints, queued files/issues, receipt hashes, and boundary notes.
32. **Verify ride JSON** — a typed JSON ride receipt can be checked locally for format id, policy metadata, artifact fingerprints, receipt hashes, and receipt-chain links without restoring approvals or state; the current ride JSON can fill the checker directly.
33. **History** — recent mock ride receipts remain available during the current app session for revisit/export.
34. **Restore ride** — a previous session ride can reload its captured idea and steering controls as a new draft, with file drafts, issue drafts, and approvals reset.
35. **Restore saved draft** — a saved draft slot can reload in-progress idea and steering controls, also with review state reset.
36. **Receipt** — every meaningful action gets a human-readable and machine-readable audit trail tied to the safety policy and local artifact fingerprints that reviewed the ride package.

## Planner behavior

The current planner is local and deterministic. As the idea text changes, RepoRider regenerates the suggested repo plan, safety report, approval state, receipt preview, generated starter file previews, and generated starter issue previews.

The rider can review the permission explainer, inspect the current mock-only auth capability state, inspect the null token storage adapter state, inspect the mock-only live-mode state machine, inspect the dry-run writer summary, inspect the strengthened safety policy gate with reviewed file content checks, package manifest safety checks, reviewed issue body risk classification, and remediation guidance, override the generated repo name, choose public or private visibility, switch starter stacks, cap starter issue generation, save the current idea/steering controls into a session-only draft slot, label saved draft slots, duplicate a saved draft slot into a fresh branch slot, reorder saved draft slots in the session list, pin priority saved draft slots to the top, archive lower-priority saved draft slots away from the active console without deleting them, export a saved draft slot as copy-ready Markdown, paste a saved draft Markdown snapshot, preview the extracted planning inputs, save the preview as a session-only draft slot without changing the current editor, restore the preview as a fresh draft, edit starter-file drafts, compare generated vs rider-edited drafts, approve each file, edit starter issue drafts, approve each issue, review a unified approval ledger before creation, inspect a policy-coupled and fingerprint-coupled ride-complete summary after mock creation, export copy-ready Markdown and JSON ride receipts, verify typed JSON ride receipts locally, fill the verifier with the current ride JSON export, revisit recent mock ride receipts during the same app session, and restore either a completed ride's planning inputs or a saved in-progress draft as a fresh draft. Editing a file or issue after approval makes that artifact require approval again, because approvals are tied to the current draft content.

It keeps repositories private by default, infers likely starter stacks from idea text, chooses starter files from the selected stack, includes `package.json` for code stacks, generates a first starter file preview set, and creates a small first issue set. It does not write to GitHub by itself.

## MVP scope

The first version is intentionally small:

- No full IDE.
- No blind commits.
- Private-first repo creation recommendation.
- File-by-file and issue-by-issue human approval before GitHub writes.
- Voice capture can begin as device dictation or typed notes.

## Development

```bash
npm install
npm run start
```

For TypeScript checks:

```bash
npm run typecheck
```

For local safety fixture checks:

```bash
npm run test:safety
```

CI runs both `npm run typecheck` and `npm run test:safety`.

## Public React GitHub Pages preview

The companion **RepoRider browser studio** lives in [site/](site/) and is published at
[https://michaelwave369.github.io/reporider/](https://michaelwave369.github.io/reporider/) when GitHub Pages is configured to use Actions.

Unlike a disconnected mockup, this standalone React/Vite site imports the actual RepoRider planner, safety scan, generated starter previews, approvals, mock GitHub creator, and receipt exporter. It remains **strictly mock-only**: no OAuth, tokens, real repositories, pushes, GitHub issues or persisted private data. See [site/README.md](site/README.md) for setup and the [Pages workflow](.github/workflows/pages.yml) for deployment.

## RR-A01: Agent-Native Headless Planner

The [RR-A01 agent rail](docs/AGENT_RAIL_RR_A01.md) reuses the actual RepoRider planner, generated starter previews and safety scanner through a **strict, versioned, one-shot JSON CLI**. Agents can propose a plan, preview/edit only planned artifacts, inspect policy findings, dry-run the approval requirements and **prepare** an in-band review packet.

Run `npm run agent:test` and `npm run agent:build`, then:

```sh
node scripts/reporider-agent.cjs < examples/agent-request.json
```

**All rail output is review-only or blocked.** No credentials, GitHub writes, human notifications, external review submission, memory admission or agent self-approval. This separate interface does not change the Expo mobile app or the browser Pages mock-only boundary.

## RR-A02: Local MCP agent bridge

[RR-A02 MCP Bridge](docs/REPORIDER_MCP_RR_A02.md) exposes RR-A01's real TypeScript planning/safety/review-packet functions to compatible MCP clients through **local stdio**, with a fixed five-tool catalog. Supports modern 2026-07-28 discovery and legacy 2025-11-25 clients. Nothing connects automatically or inherits GitHub write authority.

Run `npm run agent:build` once, then configure your MCP client to launch `node scripts/reporider-mcp.cjs`. Test with `npm run mcp:test`. This remains completely **mock-only**: no git writes, token storage, external notifications, agents approving their own work, or execution rights.


## RR-A03: Agent Human Review Desk

The public GitPage now has a dedicated [Agent Review Desk](docs/REVIEW_DESK_RR_A03.md) for deliberate import and replay of agent-created review packets. It uses the original TypeScript planner/scanner in the browser, compares imported results to a fresh local replay, displays each file/issue as inert text, and offers per-artifact examination plus an **unsigned informational review note**.

No identity authentication, server-side queue, real approvals, external dispatch, GitHub writes, tokens or persistent browser data. Older packets lacking replayable input must be regenerated. Run the existing agent:test command for RR-A01/RR-A03 fixtures.


## RR-A04: Local Proposal Courier

[RR-A04 Courier](docs/LOCAL_PROPOSAL_COURIER_RR_A04.md) optionally adds an owner-controlled local inbox for agent review packets. The existing five read-only MCP tools are unchanged **unless** you explicitly enable the local file courier. When enabled, a sixth MCP tool, `reporider_enqueue_review`, can save only bounded, replayable, zero-blocker proposals into a pre-created directory of your choice.

The GitPage's Agent Review Desk now has an **Open local .json packet** picker. No browser-to-local-network connection or automatic queue sync exists. An agent still cannot approve or execute a repository write. Run `npm run mcp:test` for all RR-A02/RR-A04 smoke cases.


## RR-A05: Local Operator Console

The new [RR-A05 Local Operator Console](docs/LOCAL_OPERATOR_CONSOLE_RR_A05.md) can list/inspect replay-verified packets in the explicitly configured RR-A04 courier folder. In a real interactive terminal it can walk through every file and issue, require typed review acknowledgments for recommendations, and export an **unsigned informational review note** under a separate private `operator-notes/` subfolder.

No server ports, OAuth, token storage, inbox-reading MCP methods, GitHub writes, or agent self-approval. The operator console is **local-only** and does not replace the GitHub Pages Human Review Desk. Use `npm run operator:test` and `npm run operator:console -- --help`.

## RR-A06: Operator Evidence Ledger

The [RR-A06 local evidence ledger](docs/OPERATOR_EVIDENCE_LEDGER_RR_A06.md) can explicitly link reviewed courier packets to RR-A05 unsigned review notes in a private, SHA-256 hash-linked local history. Commands `init`, `record`, `verify`, and `head` run only on the operator computer. A saved head hash must be anchored separately to detect entire-history rewriting/truncation.

No GitHub write authority, MCP ledger tools, cloud service, authentication, or trusted signatures. Run `npm run ledger:test` for negative and tamper controls.

## RR-A07: Independent Ledger Checkpoints

[RR-A07 Independent Checkpoints](docs/INDEPENDENT_LEDGER_CHECKPOINTS_RR_A07.md) let a human export the current operator-ledger sequence and SHA-256 head **outside the courier directory** and verify that a later local chain still contains the exact anchored prefix. This detects deletion/rewriting of previously anchored entries when the checkpoint really is preserved separately. A checksum is not a signature and does not verify checkpoint custody, identity, or approval.

Run `npm run checkpoint:test` for rollback, tamper, and custody-boundary tests. CLI: `checkpoint` and `verify-checkpoint ABSOLUTE_FILE` via `node scripts/reporider-ledger.cjs --inbox ...`.
