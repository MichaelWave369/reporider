import { buildStarterFileApprovalFingerprint } from './starterFilePreview';
import type { StarterFileApprovalMap, StarterFilePreview } from '../types';

export type StarterFileApprovalReceiptEntry = {
  path: string;
  approved: boolean;
  edited: boolean;
  fingerprint: string;
  language: StarterFilePreview['language'];
  riskLevel: StarterFilePreview['riskLevel'];
  characterCount: number;
};

export type StarterFileApprovalReceiptSummary = {
  approvedCount: number;
  editedCount: number;
  totalCount: number;
  allApproved: boolean;
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
