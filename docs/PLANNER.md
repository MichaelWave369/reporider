# RepoRider Planner

RepoRider's planner is intentionally local and deterministic in the current skeleton. It turns a rough idea into a safe starter repo plan without calling an AI API or GitHub write endpoint.

## Current planner behavior

The planner currently:

- keeps repositories private by default
- switches to public only when the idea clearly asks for public, open source, or OSS, unless the rider overrides it
- infers the starter stack from words such as `mobile`, `React Native`, `Expo`, `Next.js`, `website`, `CLI`, or `docs`
- lets the rider manually choose a starter stack before approval
- creates a cleaner repo name by removing filler words such as `create`, `repo`, `project`, and `app`
- lets the rider edit the repo name before approval
- selects starter files based on the selected stack
- includes `package.json` for code-based starter stacks
- generates up to five starter issues, with controls for 0, 1, 3, or 5 issues
- generates local starter file previews from the current plan

## Why this matters

The planner is the bridge between a messy human thought and a GitHub-ready project shape.

RepoRider should never jump from raw idea to remote write. The safe path is:

1. capture the idea
2. build the plan locally
3. let the rider steer the name, visibility, stack, and issue count
4. show the generated files, starter issues, and starter file previews
5. scan the plan for obvious risk
6. require human approval
7. write to GitHub only after OAuth, secure token storage, and live write boundaries exist
8. record receipts for each meaningful action

## Override behavior

Plan overrides are layered on top of the generated suggestion. This keeps the app friendly while preserving human authority.

When the rider edits the idea text, RepoRider resets overrides and regenerates the suggestion. This prevents a stale repo name, stack choice, or issue count from accidentally riding along with a new idea.

When the rider changes a control after a mock create simulation, the ride preview resets. This keeps receipts honest and prevents an old mock result from pretending to belong to the new plan.

## Starter file preview behavior

Starter file previews are produced from the final `RepoPlan`, after rider overrides are applied. This means the previews reflect the actual repo name, visibility, stack, starter files, and starter issues that would be used by the create flow.

The preview system currently supports `README.md`, `.gitignore`, code-stack `package.json` files, stack entry files, docs-only overview files, and `docs/RECEIPTS.md`.

The previews are still read-only in the current skeleton. Future versions should let the rider edit sections and record when generated content diverges from the reviewed plan.

## Near-term upgrades

Next planner upgrades should include:

- framework confidence labels
- manual file add/remove controls
- stronger secret and unsafe-path detection
- validation messages for repo names before live GitHub writes
- editable preview sections with divergence receipts
- diff view before live commits

## Boundary

This planner does not create repositories by itself. It only prepares a `RepoPlan` and local preview artifacts. Repo creation remains behind the approval and GitHub write boundary.
