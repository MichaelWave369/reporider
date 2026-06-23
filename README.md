# RepoRider

**Catch the idea. Forge the repo. Ride the build.**

RepoRider is a mobile-first, voice-friendly GitHub creation assistant for builders who get ideas while they are away from the desk.

The goal is simple:

> Speak an idea on your phone, review the repo plan, steer the final settings, save/export/import in-progress drafts when useful, preview, edit, diff, approve every starter file and starter issue, inspect the unified approval ledger, then publish a safe starter repository with receipts.

## What this skeleton includes

- Expo + React Native + TypeScript starter app
- Phone-first project capture flow
- Live idea-to-repo planner
- Editable repo name, visibility, stack, and starter issue controls
- Session-only saved draft slots for in-progress idea/plan steering
- Copy-ready Markdown export for saved draft slots before create
- Saved draft Markdown import that restores idea/steering controls as a fresh draft
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
- Receipt ledger model for every meaningful action
- Product spec and architecture docs
- GitHub issue/PR templates
- Basic CI typecheck workflow
- MIT license

## Current mode

RepoRider currently runs in **mock write mode**.

That means the app can simulate the full ride from approval to repo creation without requesting a GitHub token, creating a real repository, pushing files, or opening issues. This lets us safely build the UX before live OAuth and GitHub writes exist.

## Core flow

1. **Capture** — user speaks or types a rough idea.
2. **Shape** — RepoRider turns it into a structured project brief.
3. **Steer** — user edits repo name, visibility, starter stack, and issue count.
4. **Save draft** — user can save the current idea and steering controls as a session-only draft slot before create.
5. **Export saved draft** — user can open a copy-ready Markdown snapshot of a saved draft slot before create.
6. **Import saved draft** — user can paste a RepoRider saved draft snapshot and restore the idea/steering controls as a fresh draft with approvals reset.
7. **Plan** — user reviews repo files, starter issues, and safety status.
8. **Preview** — user inspects the generated starter files that would be committed.
9. **Edit files** — user can tweak starter-file drafts before approval.
10. **Diff** — user compares generated baselines against rider-reviewed file drafts.
11. **Approve files** — every current starter-file draft must be approved before create unlocks.
12. **Edit issues** — user can tweak starter issue titles, bodies, and labels.
13. **Approve issues** — every current starter-issue draft must be approved before create unlocks.
14. **Ledger** — user reviews one unified approval receipt with file status, issue status, edit status, and compact fingerprints.
15. **Guard** — safety checks catch secrets, dangerous file names, and risky defaults.
16. **Create** — approved starter files and approved starter issues are pushed/opened on GitHub once live mode exists.
17. **Complete** — user sees a final Ride Complete summary with repo URL, queued files, queued issues, approval totals, edit totals, and receipts.
18. **Export ride** — user can open a copy-ready Markdown ride receipt for notes, PRs, issues, or handoffs.
19. **History** — recent mock ride receipts remain available during the current app session for revisit/export.
20. **Restore ride** — a previous session ride can reload its captured idea and steering controls as a new draft, with file drafts, issue drafts, and approvals reset.
21. **Restore saved draft** — a saved draft slot can reload in-progress idea and steering controls, also with review state reset.
22. **Receipt** — every action gets a human-readable audit trail.

## Planner behavior

The current planner is local and deterministic. As the idea text changes, RepoRider regenerates the suggested repo plan, safety report, approval state, receipt preview, generated starter file previews, and generated starter issue previews.

The rider can override the generated repo name, choose public or private visibility, switch starter stacks, cap starter issue generation, save the current idea/steering controls into a session-only draft slot, export a saved draft slot as copy-ready Markdown, import a saved draft Markdown snapshot as a fresh draft, edit starter-file drafts, compare generated vs rider-edited drafts, approve each file, edit starter issue drafts, approve each issue, review a unified approval ledger before creation, inspect a ride-complete summary after mock creation, export a copy-ready Markdown ride receipt, revisit recent mock ride receipts during the same app session, and restore either a completed ride's planning inputs or a saved in-progress draft as a fresh draft. Editing a file or issue after approval makes that artifact require approval again, because approvals are tied to the current draft content.

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
- `docs/SAVED_DRAFT_EXPORT.md`
- `docs/SAVED_DRAFT_IMPORT.md`

## License

MIT — see `LICENSE`.
