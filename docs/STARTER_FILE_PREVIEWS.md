# Starter File Previews

RepoRider prepares starter file previews before any create action can run.

The preview system is local, deterministic, and tied to the current `RepoPlan`. It does not call GitHub, write files, request OAuth, or use a remote AI service.

## What gets previewed

The current preview generator can prepare:

- `README.md`
- `.gitignore`
- `package.json` for code-based stacks
- `App.tsx` for Expo / React Native
- `src/App.tsx` for React / Vite
- `src/app/page.tsx` for Next.js
- `src/index.ts` for Node CLI
- `docs/OVERVIEW.md` for docs-only projects
- `docs/RECEIPTS.md`

## Editable drafts

Generated previews are treated as the baseline. The rider-approved draft is a separate layer on top of that baseline.

That means RepoRider can show:

- generated content
- rider-edited content
- which files diverged from generation
- reset controls for one file or all drafts
- receipts proving edited drafts were reviewed before mock creation

If the repo plan changes, stale drafts are not carried forward into the new plan.

## Why this matters

RepoRider should never ask the rider to approve an invisible commit.

The safe path is:

1. generate the repo plan
2. show the planned files
3. show the starter file contents
4. allow rider edits before approval
5. track which drafts diverged from generated content
6. run the safety scan
7. require human approval
8. create the repo only after live GitHub writes are intentionally enabled
9. record receipts

## Template boundaries

These templates are starter seeds, not final application code.

They are intended to prove the flow:

- plan-driven file generation
- human-readable preview
- rider-editable starter drafts
- private-first defaults
- safety review before write
- receipt-backed creation history

Future versions should support file add/remove controls, inline diff view, stronger syntax validation, and receipts that store content hashes instead of raw file content.
