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
- Receipt-ready dry-run writer adapter contract that performs no GitHub writes
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
- Post-create Ride Complete summary with repo URL, queued files, queued issues, approval totals, edit totals, and receipts
- Copy-ready Markdown ride receipt export after mock create
- Session-only local ride history for recent mock ride receipts
- Draft ride restore from session history with approvals intentionally reset
- Content-sensitive approval fingerprints that stale out after edits
- Code-stack `package.json` planning
- Safety scan placeholder for generated files
- Mock create-repo ride flow that receives reviewed and approved file and issue drafts
- GitHub write boundary model
- OAuth/write-mode architecture contract before live GitHub writes
- Receipt ledger model for every meaningful action
- Product spec and architecture docs
- GitHub issue/PR templates
- Basic CI typecheck workflow
- MIT license

## Current mode

RepoRider currently runs in **mock write mode**.

That means the app can simulate the full ride from approval to repo creation without requesting a GitHub token, creating a real repository, pushing files, or opening issues. This lets us safely build the UX before live OAuth and GitHub writes exist.

## Core flow

1. **Understand permissions** — user sees the current mock-mode boundary and future GitHub permission categories before any OAuth or token flow exists.
2. **Check auth capability** — user sees the typed auth state, currently `mock_only`, with OAuth request, token storage, and live writes all blocked.
3. **Check token storage** — user sees the current null token storage adapter, which stores no credentials and keeps live writes blocked.
4. **Check live mode** — user sees the typed live-mode state machine, currently `mock_only`, with arming, writing, and retry all blocked.
5. **Check dry-run writer** — user sees the receipt-ready writer contract summarize approved artifacts and blocking reasons without performing GitHub writes.
6. **Capture** — user speaks or types a rough idea.
7. **Shape** — RepoRider turns it into a structured project brief.
8. **Steer** — user edits repo name, visibility, starter stack, and issue count.
9. **Save draft** — user can save the current idea and steering controls as a session-only draft slot before create.
10. **Label saved draft** — user can add a short session label to recognize a saved draft slot without changing the saved snapshot.
11. **Duplicate saved draft** — user can branch a selected saved draft into a fresh slot with a new timestamp and copy label while leaving the original untouched.
12. **Reorder saved drafts** — user can move a selected saved draft up or down in the session list without changing its contents.
13. **Pin saved draft** — user can pin priority saved drafts so they stay above unpinned slots in the session list.
14. **Archive saved draft** — user can hide lower-priority saved drafts from the active draft console without deleting them.
15. **Export saved draft** — user can open a copy-ready Markdown snapshot of a saved draft slot before create.
16. **Preview imported draft** — user can paste a RepoRider saved draft snapshot and inspect the extracted idea/steering controls before any action.
17. **Save imported preview** — after preview, user can park the imported idea/steering controls as a saved draft slot without changing the current editor.
18. **Import saved draft** — after preview, user can restore the imported idea/steering controls as a fresh draft with approvals reset.
19. **Plan** — user reviews repo files, starter issues, and safety status.
20. **Preview** — user inspects the generated starter files that would be committed.
21. **Edit files** — user can tweak starter-file drafts before approval.
22. **Diff** — user compares generated baselines against rider-reviewed file drafts.
23. **Approve files** — every current starter-file draft must be approved before create unlocks.
24. **Edit issues** — user can tweak starter issue titles, bodies, and labels.
25. **Approve issues** — every current starter-issue draft must be approved before create unlocks.
26. **Ledger** — user reviews one unified approval receipt with file status, issue status, edit status, and compact fingerprints.
27. **Guard** — safety checks catch secrets, dangerous file names, and risky defaults.
28. **Create** — approved starter files and approved starter issues are pushed/opened on GitHub once live mode exists.
29. **Complete** — user sees a final Ride Complete summary with repo URL, queued files, queued issues, approval totals, edit totals, and receipts.
30. **Export ride** — user can open a copy-ready Markdown ride receipt for notes, PRs, issues, or handoffs.
31. **History** — recent mock ride receipts remain available during the current app session for revisit/export.
32. **Restore ride** — a previous session ride can reload its captured idea and steering controls as a new draft, with file drafts, issue drafts, and approvals reset.
33. **Restore saved draft** — a saved draft slot can reload in-progress idea and steering controls, also with review state reset.
34. **Receipt** — every action gets a human-readable audit trail.

## Planner behavior

The current planner is local and deterministic. As the idea text changes, RepoRider regenerates the suggested repo plan, safety report, approval state, receipt preview, generated starter file previews, and generated starter issue previews.

The rider can review the permission explainer, inspect the current mock-only auth capability state, inspect the null token storage adapter state, inspect the mock-only live-mode state machine, inspect the dry-run writer summary, override the generated repo name, choose public or private visibility, switch starter stacks, cap starter issue generation, save the current idea/steering controls into a session-only draft slot, label saved draft slots, duplicate a saved draft slot into a fresh branch slot, reorder saved draft slots in the session list, pin priority saved draft slots to the top, archive lower-priority saved draft slots away from the active console without deleting them, export a saved draft slot as copy-ready Markdown, paste a saved draft Markdown snapshot, preview the extracted planning inputs, save the preview as a session-only draft slot without changing the current editor, restore the preview as a fresh draft, edit starter-file drafts, compare generated vs rider-edited drafts, approve each file, edit starter issue drafts, approve each issue, review a unified approval ledger before creation, inspect a ride-complete summary after mock creation, export a copy-ready Markdown ride receipt, revisit recent mock ride receipts during the same app session, and restore either a completed ride's planning inputs or a saved in-progress draft as a fresh draft. Editing a file or issue after approval makes that artifact require approval again, because approvals are tied to the current draft content.

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

## Docs

Start with:

- `docs/PRODUCT_SPEC.md`
- `docs/ARCHITECTURE.md`
- `docs/GITHUB_WRITE_BOUNDARY.md`
- `docs/OAUTH_WRITE_MODE_ARCHITECTURE.md`
- `docs/PERMISSION_EXPLAINER.md`
- `docs/AUTH_CAPABILITY_MODEL.md`
- `docs/TOKEN_STORAGE_ADAPTER.md`
- `docs/LIVE_MODE_STATE_MACHINE.md`
- `docs/DRY_RUN_WRITER_ADAPTER.md`
- `docs/PLANNER.md`
- `docs/README_PREVIEW.md`
- `docs/STARTER_FILE_PREVIEWS.md`
- `docs/EDITABLE_DRAFTS.md`
- `docs/INLINE_DIFF_VIEW.md`
- `docs/FILE_APPROVALS.md`
- `docs/STARTER_ISSUE_APPROVALS.md`
- `docs/APPROVAL_RECEIPT_PREVIEW.md`
- `docs/RIDE_COMPLETE_SUMMARY.md`
- `docs/MARKDOWN_RIDE_RECEIPT.md`
- `docs/LOCAL_RIDE_HISTORY.md`
- `docs/RESTORE_RIDE_DRAFT.md`
- `docs/SAVED_DRAFT_SLOTS.md`
- `docs/SAVED_DRAFT_SLOT_LABELS.md`
- `docs/SAVED_DRAFT_DUPLICATE_SLOT.md`
- `docs/SAVED_DRAFT_REORDER_SLOT.md`
- `docs/SAVED_DRAFT_PIN_SLOT.md`
- `docs/SAVED_DRAFT_ARCHIVE_SLOT.md`
- `docs/SAVED_DRAFT_EXPORT.md`
- `docs/SAVED_DRAFT_IMPORT.md`
- `docs/SAVED_DRAFT_IMPORT_PREVIEW.md`
- `docs/SAVED_DRAFT_IMPORT_SAVE_SLOT.md`

## License

MIT — see `LICENSE`.
