# README Preview

RepoRider now generates a local README preview from the current `RepoPlan` before any create action can run.

## Purpose

The preview gives the rider a readable first-file checkpoint:

1. Confirm the repo name.
2. Confirm the project description.
3. Confirm the chosen starter stack.
4. Confirm private/public visibility.
5. Confirm planned files and starter issues.
6. Confirm safety and receipt expectations before approval.

## Boundary

The preview is local and deterministic. It does not call an AI API, request a GitHub token, create a repository, push files, or open issues.

Live GitHub writing should only use this content after:

- OAuth is connected.
- Token storage is secure.
- The safety scan passes.
- The rider explicitly approves the ride.
- Receipts are recorded.

## Current behavior

`buildReadmePreview(plan)` turns the current `RepoPlan` into a Markdown string. The mobile UI displays that string in `ReadmePreviewCard`, collapsed by default with an option to show the full preview.

The mock GitHub client also records a receipt confirming that README content was prepared from the reviewed plan.

## Future upgrades

- Let the rider edit README sections before creation.
- Add copy/share/export actions.
- Show previews for `.gitignore`, entry files, and receipts.
- Track whether manual edits diverge from the generated plan.
- Include README preview hash in live creation receipts.
