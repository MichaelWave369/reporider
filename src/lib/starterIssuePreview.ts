import type {
  RepoIssuePlan,
  RepoPlan,
  StarterIssueApprovalMap,
  StarterIssueDraftMap,
  StarterIssueDraftSummary,
} from '../types';

export const starterIssueKeyForIndex = (index: number) => `issue-${index + 1}`;

const normalizeLabels = (labels: string[]) =>
  labels
    .map((label) => label.trim().toLowerCase())
    .filter(Boolean)
    .filter((label, index, allLabels) => allLabels.indexOf(label) === index);

export const parseStarterIssueLabels = (labelsText: string) =>
  normalizeLabels(labelsText.split(',').map((label) => label.trim()));

export const buildStarterIssuePreviews = (plan: RepoPlan): RepoIssuePlan[] =>
  plan.issues.map((issue) => ({
    ...issue,
    labels: normalizeLabels(issue.labels),
  }));

export const applyStarterIssueDrafts = (
  generatedIssues: RepoIssuePlan[],
  drafts: StarterIssueDraftMap,
): RepoIssuePlan[] =>
  generatedIssues.map((issue, index) => drafts[starterIssueKeyForIndex(index)] ?? issue);

export const buildStarterIssueApprovalFingerprint = (issue: RepoIssuePlan, index: number) => [
  starterIssueKeyForIndex(index),
  issue.title.length,
  issue.body.length,
  normalizeLabels(issue.labels).join(','),
  issue.title,
  issue.body,
].join('::');

export const buildStarterIssueDisplayFingerprint = (issue: RepoIssuePlan, index: number) => {
  const source = buildStarterIssueApprovalFingerprint(issue, index);
  let hash = 0;

  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) >>> 0;
  }

  return `iri-${hash.toString(16).padStart(8, '0').slice(0, 8)}`;
};

export const isStarterIssueApproved = (
  issue: RepoIssuePlan,
  index: number,
  approvals: StarterIssueApprovalMap,
) => approvals[starterIssueKeyForIndex(index)] === buildStarterIssueApprovalFingerprint(issue, index);

export const summarizeStarterIssueDrafts = (
  generatedIssues: RepoIssuePlan[],
  draftIssues: RepoIssuePlan[],
): StarterIssueDraftSummary => {
  const editedKeys = draftIssues
    .map((issue, index) => ({ issue, index }))
    .filter(({ issue, index }) => JSON.stringify(generatedIssues[index]) !== JSON.stringify(issue))
    .map(({ index }) => starterIssueKeyForIndex(index));

  return {
    editedCount: editedKeys.length,
    editedKeys,
    totalIssues: draftIssues.length,
  };
};

export const updateStarterIssueDraft = (
  issue: RepoIssuePlan,
  patch: Partial<RepoIssuePlan>,
): RepoIssuePlan => ({
  ...issue,
  ...patch,
  labels: patch.labels ? normalizeLabels(patch.labels) : normalizeLabels(issue.labels),
});