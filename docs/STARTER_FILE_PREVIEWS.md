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

## Why this matters

RepoRider should never ask the rider to approve an invisible commit.

The safe path is:

1. generate the repo plan
2. show the planned files
3. show the starter file contents
4. run the safety scan
5. require human approval
6. create the repo only after live GitHub writes are intentionally enabled
7. record receipts

## Template boundaries

These templates are starter seeds, not final application code.

They are intended to prove the flow:

- plan-driven file generation
- human-readable preview
- private-first defaults
- safety review before write
- receipt-backed creation history

Future versions should support rider edits, file add/remove controls, diff view, and receipts when previewed content diverges from generated content.
