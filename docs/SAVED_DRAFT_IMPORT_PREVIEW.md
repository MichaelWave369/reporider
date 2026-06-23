# Saved Draft Import Preview

RepoRider requires a preview step before a pasted saved-draft Markdown snapshot can restore anything into the current editor.

## Why preview exists

Saved draft Markdown can travel through notes, chats, planning docs, or other handoff surfaces. Before RepoRider applies pasted content, the rider should see exactly what the app extracted.

The preview step keeps import useful without turning Markdown into an invisible state-changing command.

## Two-step flow

1. Paste a `# RepoRider Saved Draft Snapshot` export into the import box.
2. Tap **Preview Import**.
3. Review the extracted idea text and steering controls.
4. Tap **Restore Preview as New Draft** only after the preview looks right.

## What the preview shows

The preview shows:

- Idea text
- Repo name override, when present
- Visibility override, when present
- Starter stack override, when present
- Starter issue count override, when present

## What changes after restore

Restoring the preview reloads planning inputs only.

RepoRider resets:

- Starter-file drafts
- Starter-issue drafts
- File approvals
- Issue approvals
- Approval ledger state
- Create state

## What preview does not do

Preview does not:

- Save a draft slot
- Approve files
- Approve issues
- Create a repo
- Open GitHub issues
- Push GitHub files
- Restore receipt history

## Stale preview rule

If the pasted Markdown changes, the preview is cleared. The rider must tap **Preview Import** again before restore can run.

This keeps the restore action tied to the exact Markdown the rider most recently reviewed.