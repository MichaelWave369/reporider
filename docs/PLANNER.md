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
- generates up to five starter issues, with controls for 0, 1, 3, or 5 issues

## Why this matters

The planner is the bridge between a messy human thought and a GitHub-ready project shape.

RepoRider should never jump from raw idea to remote write. The safe path is:

1. capture the idea
2. build the plan locally
3. let the rider steer the name, visibility, stack, and issue count
4. show the generated files and issues
5. scan the plan for obvious risk
6. require human approval
7. write to GitHub only after OAuth, secure token storage, and live write boundaries exist
8. record receipts for each meaningful action

## Override behavior

Plan overrides are layered on top of the generated suggestion. This keeps the app friendly while preserving human authority.

When the rider edits the idea text, RepoRider resets overrides and regenerates the suggestion. This prevents a stale repo name, stack choice, or issue count from accidentally riding along with a new idea.

When the rider changes a control after a mock create simulation, the ride preview resets. This keeps receipts honest and prevents an old mock result from pretending to belong to the new plan.

## Near-term upgrades

Next planner upgrades should include:

- generated README preview
- starter template preview
- framework confidence labels
- manual file add/remove controls
- stronger secret and unsafe-path detection
- validation messages for repo names before live GitHub writes

## Boundary

This planner does not create repositories by itself. It only prepares a `RepoPlan`. Repo creation remains behind the approval and GitHub write boundary.