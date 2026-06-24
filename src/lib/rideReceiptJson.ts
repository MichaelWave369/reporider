import type { GithubCreateRepoResult, Receipt } from '../types';

const latestReceiptTimestamp = (result: GithubCreateRepoResult) => (
  result.receipts.at(-1)?.timestamp ?? 'unknown'
);

const boundaryNotes = [
  'Mock-mode receipt export only. No GitHub repository was created by this result.',
  'No OAuth token was requested, read, stored, or used.',
  'No files were pushed and no issues were opened.',
  'Policy metadata and fingerprints are local planning receipts, not cryptographic signatures or remote ledger anchors.',
];

const serializeReceipt = (receipt: Receipt) => ({
  action: receipt.action,
  artifactFingerprint: receipt.artifactFingerprint ?? null,
  detail: receipt.detail,
  id: receipt.id,
  previousReceiptHash: receipt.previousReceiptHash ?? null,
  receiptHash: receipt.receiptHash ?? null,
  safetyPolicyVersion: receipt.safetyPolicyVersion ?? null,
  safetyStatus: receipt.safetyStatus ?? null,
  status: receipt.status,
  timestamp: receipt.timestamp,
});

export const buildTypedRideReceiptJson = (result: GithubCreateRepoResult) => ({
  approvalSummary: {
    approvedFileCount: result.summary.approvedFileCount,
    approvedIssueCount: result.summary.approvedIssueCount,
    editedFileCount: result.summary.editedFileCount,
    editedIssueCount: result.summary.editedIssueCount,
    receiptCount: result.summary.receiptCount,
    totalFileDraftCharacters: result.summary.totalFileDraftCharacters,
    totalIssueDraftCharacters: result.summary.totalIssueDraftCharacters,
    writeArtifactCount: result.summary.writeArtifactCount,
  },
  artifactFingerprints: {
    approvedFiles: result.summary.approvedFilesFingerprint,
    approvedIssues: result.summary.approvedIssuesFingerprint,
    receiptChain: result.summary.receiptChainHash,
    rideArtifact: result.summary.rideArtifactFingerprint,
  },
  boundary: {
    mode: result.mode,
    notes: boundaryNotes,
  },
  format: 'reporider.ride-receipt.v1' as const,
  generatedAt: latestReceiptTimestamp(result),
  queuedFiles: result.createdFiles.map((path) => ({ path })),
  queuedIssues: result.openedIssues.map((title) => ({ title })),
  receipts: result.receipts.map(serializeReceipt),
  ride: {
    completedAt: latestReceiptTimestamp(result),
    defaultBranch: result.defaultBranch,
    mode: result.mode,
    repositoryUrl: result.repositoryUrl,
  },
  safetyPolicy: {
    blockerCount: result.summary.safetyBlockerCount,
    policyVersion: result.summary.safetyPolicyVersion,
    status: result.summary.safetyStatus,
    warningCount: result.summary.safetyWarningCount,
  },
});

export const buildJsonRideReceipt = (result: GithubCreateRepoResult) => `${JSON.stringify(buildTypedRideReceiptJson(result), null, 2)}\n`;
