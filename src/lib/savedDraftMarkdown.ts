import type { RepoPlanOverrides, RideDraftSnapshot, SavedDraftSlot, StarterStack } from '../types';

const unset = '_not set_';
const header = '# RepoRider Saved Draft Snapshot';
const validStacks: StarterStack[] = [
  'expo-react-native',
  'react-vite',
  'nextjs',
  'node-cli',
  'docs-only',
];

export type SavedDraftMarkdownImportResult =
  | { ok: true; draftSnapshot: RideDraftSnapshot }
  | { ok: false; error: string };

const formatOverride = <T extends keyof RepoPlanOverrides>(
  overrides: RepoPlanOverrides,
  key: T,
) => {
  const value = overrides[key];
  return value === undefined || value === '' ? unset : String(value);
};

const normalizeImportedValue = (value: string | undefined) => {
  const trimmed = value?.trim();
  return !trimmed || trimmed === unset ? undefined : trimmed;
};

const extractSection = (markdown: string, title: string) => {
  const pattern = new RegExp(`## ${title}\n\n([\s\S]*?)(?=\n## |$)`);
  return markdown.match(pattern)?.[1]?.trim();
};

const extractListValue = (section: string, label: string) => {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`^- ${escapedLabel}: (.*)$`, 'm');
  return normalizeImportedValue(section.match(pattern)?.[1]);
};

export const buildMarkdownSavedDraftSnapshot = (slot: SavedDraftSlot) => {
  const { draftSnapshot } = slot;
  const { planOverrides } = draftSnapshot;
  const idea = draftSnapshot.idea.trim() || '_No idea text saved._';
  const label = slot.label?.trim() || unset;
  const pinned = slot.pinned ? 'yes' : 'no';

  return [
    header,
    '',
    `- Slot ID: ${slot.id}`,
    `- Label: ${label}`,
    `- Pinned: ${pinned}`,
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

export const parseMarkdownSavedDraftSnapshot = (markdown: string): SavedDraftMarkdownImportResult => {
  if (!markdown.includes(header)) {
    return {
      ok: false,
      error: 'Paste a RepoRider saved draft snapshot export before importing.',
    };
  }

  const ideaSection = extractSection(markdown, 'Idea');
  const steeringSection = extractSection(markdown, 'Steering Overrides');

  if (!ideaSection || !steeringSection) {
    return {
      ok: false,
      error: 'This snapshot is missing the Idea or Steering Overrides section.',
    };
  }

  const importedIdea = ideaSection === '_No idea text saved._' ? '' : ideaSection;
  const importedName = extractListValue(steeringSection, 'Repo name');
  const importedVisibility = extractListValue(steeringSection, 'Visibility');
  const importedStack = extractListValue(steeringSection, 'Starter stack');
  const importedIssueCount = extractListValue(steeringSection, 'Starter issue count');
  const planOverrides: RepoPlanOverrides = {};

  if (importedName) {
    planOverrides.name = importedName;
  }

  if (importedVisibility) {
    if (importedVisibility !== 'private' && importedVisibility !== 'public') {
      return {
        ok: false,
        error: 'Imported visibility must be private or public.',
      };
    }

    planOverrides.visibility = importedVisibility;
  }

  if (importedStack) {
    if (!validStacks.includes(importedStack as StarterStack)) {
      return {
        ok: false,
        error: 'Imported starter stack is not supported by this version of RepoRider.',
      };
    }

    planOverrides.stack = importedStack as StarterStack;
  }

  if (importedIssueCount) {
    const parsedIssueCount = Number(importedIssueCount);

    if (!Number.isInteger(parsedIssueCount) || parsedIssueCount < 0 || parsedIssueCount > 5) {
      return {
        ok: false,
        error: 'Imported starter issue count must be a whole number from 0 to 5.',
      };
    }

    planOverrides.issueCount = parsedIssueCount;
  }

  return {
    ok: true,
    draftSnapshot: {
      idea: importedIdea.trim(),
      planOverrides,
    },
  };
};
