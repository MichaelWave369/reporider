# Saved Draft Markdown Import

RepoRider can import its own saved draft Markdown snapshots back into the current editor as a fresh draft.

This feature is designed for mobile handoffs:

1. Save an in-progress draft slot.
2. Export the saved draft as Markdown.
3. Paste that Markdown into notes, chat, a planning doc, or another RepoRider session.
4. Paste the Markdown into RepoRider's import box.
5. Preview the extracted idea and steering controls.
6. Restore the preview as a new draft only after review.
7. Re-review generated files, starter issues, approvals, and ledgers before create.

## What import accepts

The importer only accepts Markdown snapshots that include the RepoRider saved-draft header:

```markdown
# RepoRider Saved Draft Snapshot
```

It extracts only these sections:

- `## Idea`
- `## Steering Overrides`

The importer reads the following steering values:

- Repo name
- Visibility
- Starter stack
- Starter issue count

## Validation rules

Import is intentionally narrow and predictable.

- Visibility must be `private` or `public`.
- Starter stack must match a supported RepoRider stack.
- Starter issue count must be a whole number from `0` to `5`.
- Missing override values are treated as unset.
- Unknown extra Markdown content is ignored.

## Preview before restore

Import now has two explicit actions:

1. **Preview Import** parses the pasted Markdown and shows the extracted idea plus steering controls.
2. **Restore Preview as New Draft** reloads those planning inputs only after the rider has inspected the preview.

The restore action stays unavailable until a valid preview exists. Editing the pasted Markdown clears the preview and requires parsing again.

## What import restores

Import restores only:

- Idea text
- Repo name override
- Visibility override
- Starter stack override
- Starter issue count override

## What import does not restore

Import does **not** restore:

- Edited starter files
- Edited starter issues
- File approvals
- Issue approvals
- Approval ledger state
- Create state
- Ride history
- Ride receipts
- GitHub tokens
- GitHub writes

## Safety boundary

Importing a saved draft snapshot is not an approval action.

After import, RepoRider regenerates the plan and requires the rider to review, edit, approve, and inspect the ledger again before any create action can unlock.

This keeps Markdown import useful for handoff without becoming a bypass around the trust gates.