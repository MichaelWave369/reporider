# RepoRider

**Catch the idea. Forge the repo. Ride the build.**

RepoRider is a mobile-first, voice-friendly GitHub creation assistant for builders who get ideas while they are away from the desk.

The goal is simple:

> Speak an idea on your phone, review the repo plan, steer the final settings, preview, edit, diff, approve every starter file, inspect the approval ledger, then publish a safe starter repository with receipts.

## What this skeleton includes

- Expo + React Native + TypeScript starter app
- Phone-first project capture flow
- Live idea-to-repo planner
- Editable repo name, visibility, stack, and starter issue controls
- Dynamic repo name, visibility, stack, file, and issue planning
- Generated starter file previews before approval
- Editable starter-file drafts with reset controls
- Inline generated-vs-draft diff view
- File-by-file starter approval gate
- Approval receipt preview before create
- Content-sensitive approval fingerprints that stale out after edits
- Code-stack `package.json` planning
- Safety scan placeholder for generated files
- Mock create-repo ride flow that receives reviewed and approved drafts
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
4. **Plan** — user reviews repo files, starter issues, and safety status.
5. **Preview** — user inspects the generated starter files that would be committed.
6. **Edit** — user can tweak starter-file drafts before approval.
7. **Diff** — user compares generated baselines against rider-reviewed drafts.
8. **Approve files** — every current starter-file draft must be approved before create unlocks.
9. **Ledger** — user reviews the approval receipt preview with file status, edit status, and compact fingerprints.
10. **Guard** — safety checks catch secrets, dangerous file names, and risky defaults.
11. **Create** — approved starter files are pushed to GitHub once live mode exists.
12. **Receipt** — every action gets a human-readable audit trail.

## Planner behavior

The current planner is local and deterministic. As the idea text changes, RepoRider regenerates the suggested repo plan, safety report, approval state, receipt preview, and generated starter file previews.

The rider can override the generated repo name, choose public or private visibility, switch starter stacks, cap starter issue generation, edit starter-file drafts, compare generated vs rider-edited drafts, approve each file, and review an approval ledger before creation. Editing a file after approval makes that file require approval again, because approvals are tied to the current draft content.

It keeps repositories private by default, infers likely starter stacks from idea text, chooses starter files from the selected stack, includes `package.json` for code stacks, generates a first starter file preview set, and creates a small first issue set. It does not write to GitHub by itself.

## MVP scope

The first version is intentionally small:

- No full IDE.
- No blind commits.
- Private-first repo creation recommendation.
- File-by-file human approval before GitHub writes.
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

- [Product Spec](docs/PRODUCT_SPEC.md)
- [Architecture](docs/ARCHITECTURE.md)
- [GitHub Write Boundary](docs/GITHUB_WRITE_BOUNDARY.md)
- [Planner](docs/PLANNER.md)
- [README Preview](docs/README_PREVIEW.md)
- [Starter File Previews](docs/STARTER_FILE_PREVIEWS.md)
- [Editable Drafts](docs/EDITABLE_DRAFTS.md)
- [Inline Draft Diff View](docs/INLINE_DIFF_VIEW.md)
- [Starter File Approval Gate](docs/FILE_APPROVALS.md)
- [Approval Receipt Preview](docs/APPROVAL_RECEIPT_PREVIEW.md)

## Product principle

RepoRider should feel like a friendly pocket forge, not a complicated developer console.

No idea left uncommitted.

## License

MIT © 2026 Michael Hughes
