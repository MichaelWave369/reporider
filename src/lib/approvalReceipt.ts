import { buildStarterFileApprovalFingerprint } from './starterFilePreview';
import {
  buildStarterIssueApprovalFingerprint,
  buildStarterIssueDisplayFingerprint,
  starterIssueKeyForIndex,
} from './starterIssuePreview';
import type {
  RepoIssuePlan,
  StarterFileApprovalMap,
  StarterFilePreview,
  StarterIssueApprovalMap,
} from '../types';

export type StarterFileApprovalReceiptEntry = {
  path: string;
  approved: boolean;
  edited: boolean;
  fingerprint: string;
  language: StarterFilePreview['language'];
  riskLevel: StarterFilePreview['riskLevel'];
  characterCount: number;
};

export type StarterIssueApprovalReceiptEntry = {
  key: string;
  title: string;
  approved: boolean;
  edited: boolean;
  fingerprint: string;
  labels: string[];
  bodyCharacterCount: number;
  characterCount: number;
};

export type ApprovalReceiptEntry = {
  kind: 'starter-file' | 'starter-issue';
  id: string;
  primaryLabel: string;
  secondaryLabel: string;
  approved: boolean;
  edited: boolean;
  fingerprint: string;
  characterCount: number;
  pills: string[];
};

export type StarterFileApprovalReceiptSummary = {
  approvedCount: number;
  editedCount: number;
  totalCount: number;
  allApproved: boolean;
};

export type UnifiedApprovalReceiptSummary = StarterFileApprovalReceiptSummary & {
  approvedFileCount: number;
  approvedIssueCount: number;
  editedFileCount: number;
  editedIssueCount: number;
  totalFileCount: number;
  totalIssueCount: number;
};

const compactHash = (value: string) => {
  let hash = 5381;

  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) + hash) ^ value.charCodeAt(index);
  }

  return (hash >>> 0).toString(16).padStart(8, '0');
};

export const buildStarterFileDisplayFingerprint = (preview: StarterFilePreview) =>
  `rr-${compactHash(`${preview.path}\n${preview.content}`)}-${preview.content.length}`;

export const buildStarterFileApprovalReceiptEntries = (
  generatedPreviews: StarterFilePreview[],
  draftPreviews: StarterFilePreview[],
  approvedDraftFingerprints: StarterFileApprovalMap,
): StarterFileApprovalReceiptEntry[] => {
  const generatedByPath = new Map(generatedPreviews.map((preview) => [preview.path, preview.content]));

  return draftPreviews.map((preview) => ({
    path: preview.path,
    approved: approvedDraftFingerprints[preview.path] === buildStarterFileApprovalFingerprint(preview),
    edited: generatedByPath.get(preview.path) !== preview.content,
    fingerprint: buildStarterFileDisplayFingerprint(preview),
    language: preview.language,
    riskLevel: preview.riskLevel,
    characterCount: preview.content.length,
  }));
};

export const buildStarterIssueApprovalReceiptEntries = (
  generatedIssues: RepoIssuePlan[],
  draftIssues: RepoIssuePlan[],
  approvedIssueFingerprints: StarterIssueApprovalMap,
): StarterIssueApprovalReceiptEntry[] =>
  draftIssues.map((issue, index) => {
    const labels = issue.labels.map((label) => label.trim().toLowerCase()).filter(Boolean);
    const generatedIssue = generatedIssues[index];
    const key = starterIssueKeyForIndex(index);
    const bodyCharacterCount = issue.body.length;

    return {
      key,
      title: issue.title,
      approved: approvedIssueFingerprints[key] === buildStarterIssueApprovalFingerprint(issue, index),
      edited: JSON.stringify(generatedIssue) !== JSON.stringify(issue),
      fingerprint: buildStarterIssueDisplayFingerprint(issue, index),
      labels,
      bodyCharacterCount,
      characterCount: issue.title.length + bodyCharacterCount + labels.join(',').length,
    };
  });

export const summarizeStarterFileApprovalReceiptEntries = (
  entries: StarterFileApprovalReceiptEntry[],
): StarterFileApprovalReceiptSummary => {
  const approvedCount = entries.filter((entry) => entry.approved).length;
  const editedCount = entries.filter((entry) => entry.edited).length;

  return {
    approvedCount,
    editedCount,
    totalCount: entries.length,
    allApproved: entries.length > 0 && approvedCount === entries.length,
  };
};

export const buildUnifiedApprovalReceiptEntries = (
  generatedPreviews: StarterFilePreview[],
  draftPreviews: StarterFilePreview[],
  approvedDraftFingerprints: StarterFileApprovalMap,
  generatedIssues: RepoIssuePlan[],
  draftIssues: RepoIssuePlan[],
  approvedIssueFingerprints: StarterIssueApprovalMap,
): ApprovalReceiptEntry[] => {
  const fileEntries = buildStarterFileApprovalReceiptEntries(
    generatedPreviews,
    draftPreviews,
    approvedDraftFingerprints,
  ).map<ApprovalReceiptEntry>((entry) => ({
    kind: 'starter-file',
    id: entry.path,
    primaryLabel: entry.path,
    secondaryLabel: 'Starter file',
    approved: entry.approved,
    edited: entry.edited,
    fingerprint: entry.fingerprint,
    characterCount: entry.characterCount,
    pills: [entry.language, `${entry.riskLevel} risk`, `${entry.characterCount} chars`],
  }));

  const issueEntries = buildStarterIssueApprovalReceiptEntries(
    generatedIssues,
    draftIssues,
    approvedIssueFingerprints,
  ).map<ApprovalReceiptEntry>((entry, index) => ({
    kind: 'starter-issue',
    id: entry.key,
    primaryLabel: entry.title,
    secondaryLabel: `Starter issue #${index + 1}`,
    approved: entry.approved,
    edited: entry.edited,
    fingerprint: entry.fingerprint,
    characterCount: entry.characterCount,
    pills: [
      `${entry.labels.length} labels`,
      `${entry.bodyCharacterCount} body chars`,
      `${entry.characterCount} total chars`,
    ],
  }));

  return [...fileEntries, ...issueEntries];
};

export const summarizeUnifiedApprovalReceiptEntries = (
  entries: ApprovalReceiptEntry[],
): UnifiedApprovalReceiptSummary => {
  const fileEntries = entries.filter((entry) => entry.kind === 'starter-file');
  const issueEntries = entries.filter((entry) => entry.kind === 'starter-issue');
  const approvedCount = entries.filter((entry) => entry.approved).length;
  const editedCount = entries.filter((entry) => entry.edited).length;

  return {
    approvedCount,
    editedCount,
    totalCount: entries.length,
    allApproved: entries.length > 0 && approvedCount === entries.length,
    approvedFileCount: fileEntries.filter((entry) => entry.approved).length,
    approvedIssueCount: issueEntries.filter((entry) => entry.approved).length,
    editedFileCount: fileEntries.filter((entry) => entry.edited).length,
    editedIssueCount: issueEntries.filter((entry) => entry.edited).length,
    totalFileCount: fileEntries.length,
    totalIssueCount: issueEntries.length,
  };
};
