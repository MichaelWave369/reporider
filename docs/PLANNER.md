# RepoRider Planner

RepoRider's planner is intentionally local and deterministic in the current skeleton. It turns a rough idea into a safe starter repo plan without calling an AI API or GitHub write endpoint.

## Current planner behavior

The planner currently:

- keeps repositories private by default
- switches to public only when the idea clearly asks for public, open source, or OSS
- infers the starter stack from words such as `mobile`, `React Native`, `Expo`, `Next.js`, `website`, `CLI`, or `docs`
- creates a cleaner repo name by removing filler words such as `create`, `repo`, `project`, and `app`
- selects starter files based on the inferred stack
- generates three first issues: MVP journey, starter scaffold, and safety scan

## Why this matters

The planner is the bridge between a messy human thought and a GitHub-ready project shape.

RepoRider should never jump from raw idea to remote write. The safe path is:

1. capture the idea
2. build the plan locally
3. show the generated files and issues
4. scan the plan for obvious risk
5. require human approval
6. write to GitHub only after OAuth, secure token storage, and live write boundaries exist
7. record receipts for each meaningful action

## Near-term upgrades

Next planner upgrades should include:

- editable repo name before approval
- manual visibility picker
- starter template preview
- issue count controls
- framework confidence labels
- a generated README preview
- stronger secret and unsafe-path detection

## Boundary

This planner does not create repositories by itself. It only prepares a `RepoPlan`. Repo creation remains behind the approval and GitHub write boundary.
