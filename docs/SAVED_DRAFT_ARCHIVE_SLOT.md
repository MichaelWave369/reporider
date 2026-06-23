# Saved Draft Archive Slot

RepoRider supports session-only archiving for saved draft slots.

Archiving is for hiding lower-priority saved drafts from the active saved-draft console without deleting them.

## What archive does

- Marks a saved draft slot as archived for the current app session.
- Removes the slot from the active save/restore/export/reorder console.
- Shows the slot in the Draft Archive card instead.
- Allows the rider to unarchive the slot later.
- Allows restoring an archived slot as a draft while still resetting review state.
- Allows deleting an archived slot explicitly.

## What archive does not do

Archiving does not:

- Delete the saved draft slot.
- Change the saved idea text.
- Change repo name, visibility, starter stack, or issue-count overrides.
- Change the saved slot label.
- Remove pinned metadata.
- Approve starter files.
- Approve starter issues.
- Restore edited file drafts.
- Restore edited issue drafts.
- Create a GitHub repository.
- Open GitHub issues.
- Push commits.

## Boundary

Archive is visibility metadata only.

A saved draft slot can be active, pinned, archived, or both pinned and archived. Pinned archived slots remain hidden from the active console until unarchived. When they return to active, pin priority can place them back near the top of the active list.

## Restore rule

Restoring an archived saved draft works like every other RepoRider restore path:

1. Load idea text.
2. Load steering overrides.
3. Reset file drafts.
4. Reset issue drafts.
5. Reset approvals.
6. Require fresh review before create.

Archive never carries approval authority.

## Markdown export

Saved draft Markdown exports include archive status as informational metadata:

```md
- Archived: yes
```

Import ignores archive metadata and restores only the Idea and Steering Overrides sections. This prevents archived state from silently changing another rider's session organization.