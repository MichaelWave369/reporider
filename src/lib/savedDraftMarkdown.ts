import type { RepoPlanOverrides, SavedDraftSlot } from '../types';

const unset = '_not set_';

const formatOverride = <T extends keyof RepoPlanOverrides>(
  overrides: RepoPlanOverrides,
  key: T,
) => {
  const value = overrides[key];
  return value === undefined || value === '' ? unset : String(value);
};

export const buildMarkdownSavedDraftSnapshot = (slot: SavedDraftSlot) => {
  const { draftSnapshot } = slot;
  const { planOverrides } = draftSnapshot;
  const idea = draftSnapshot.idea.trim() || '_No idea text saved._';

  return [
    '# RepoRider Saved Draft Snapshot',
    '',
    `- Slot ID: ${slot.id}`,
    `- Saved At: ${slot.savedAt}`,
    '- Mode: session-only pre-create draft',
    '- Boundary: no approvals, no edited starter files, no edited starter issues, no GitHub writes',
    '',
    '## Idea',
    '',
    idea,
    '',
    '## Steering Overrides',
    '',
    `- Repo name: ${formatOverride(planOverrides, 'name')}`,
    `- Visibility: ${formatOverride(planOverrides, 'visibility')}`,
    `- Starter stack: ${formatOverride(planOverrides, 'stack')}`,
    `- Starter issue count: ${formatOverride(planOverrides, 'issueCount')}`,
    '',
    '## Restore Rule',
    '',
    'Restoring this snapshot reloads the idea text and steering controls only. File drafts, issue drafts, approvals, ledgers, create results, and ride receipts must be reviewed again before any create action.',
    '',
    '## Safe Use',
    '',
    '- Paste this into notes, planning docs, or a handoff thread.',
    '- Treat it as a planning snapshot, not an approval receipt.',
    '- Re-review generated files and starter issues after restore.',
  ].join('\n');
};
