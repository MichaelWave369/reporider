import type { GithubCreateRepoResult, Receipt } from '../types';

const listItems = (items: string[]) => (items.length > 0
  ? items.map((item) => `- ${item}`).join('\n')
  : '- None');

const formatReceiptSafety = (receipt: Receipt) => (
  receipt.safetyPolicyVersion && receipt.safetyStatus
    ? ` _(policy ${receipt.safetyPolicyVersion}, status ${receipt.safetyStatus})_`
    : ''
);

const formatReceiptHashes = (receipt: Receipt) => {
  const parts = [
    receipt.artifactFingerprint ? `artifact ${receipt.artifactFingerprint}` : undefined,
    receipt.previousReceiptHash ? `previous ${receipt.previousReceiptHash}` : undefined,
    receipt.receiptHash ? `hash ${receipt.receiptHash}` : undefined,
  ].filter(Boolean);

  return parts.length > 0 ? ` — ${parts.join(' · ')}` : '';
};

const formatReceipt = (receipt: Receipt) => (
  `- **${receipt.status.toUpperCase()}** · ${receipt.action} — ${receipt.detail}${formatReceiptSafety(receipt)}${formatReceiptHashes(receipt)}`
);

const formatReceipts = (receipts: Receipt[]) => (receipts.length > 0
  ? receipts.map(formatReceipt).join('\n')
  : '- No receipts recorded.');

const latestReceiptTimestamp = (result: GithubCreateRepoResult) => (
  result.receipts.at(-1)?.timestamp ?? 'unknown'
);

/**
 * Builds a copy-ready Markdown receipt from the typed create result.
 *
 * The export intentionally uses the same result payload that powers the final
 * Ride Complete card so copied receipts cannot drift from the on-screen summary.
 */
export const buildMarkdownRideReceipt = (result: GithubCreateRepoResult) => `# RepoRider Ride Receipt

> Mock-mode export. This receipt summarizes the approved ride package prepared by RepoRider. It does not prove that GitHub was changed.

## Ride

- **Mode:** ${result.mode}
- **Repository:** ${result.repositoryUrl}
- **Default branch:** ${result.defaultBranch}
- **Completed at:** ${latestReceiptTimestamp(result)}

## Safety Policy

- **Policy version:** ${result.summary.safetyPolicyVersion}
- **Safety status:** ${result.summary.safetyStatus}
- **Warnings:** ${result.summary.safetyWarningCount}
- **Blockers:** ${result.summary.safetyBlockerCount}

## Artifact Fingerprints

- **Ride artifact:** ${result.summary.rideArtifactFingerprint}
- **Approved files:** ${result.summary.approvedFilesFingerprint}
- **Approved issues:** ${result.summary.approvedIssuesFingerprint}
- **Receipt chain:** ${result.summary.receiptChainHash}

## Approval Summary

- **Write artifacts:** ${result.summary.writeArtifactCount}
- **Approved files:** ${result.summary.approvedFileCount}
- **Approved issues:** ${result.summary.approvedIssueCount}
- **Edited files:** ${result.summary.editedFileCount}
- **Edited issues:** ${result.summary.editedIssueCount}
- **File draft characters:** ${result.summary.totalFileDraftCharacters}
- **Issue draft characters:** ${result.summary.totalIssueDraftCharacters}
- **Receipt count:** ${result.summary.receiptCount}

## Files Queued

${listItems(result.createdFiles)}

## Issues Queued

${listItems(result.openedIssues)}

## Receipts

${formatReceipts(result.receipts)}

## Boundary

RepoRider generated this Markdown from the same typed create result shown on the Ride Complete screen. In mock mode, no token is requested, no remote repository is created, no files are pushed, and no issues are opened. The safety policy section records which local policy version reviewed the ride package, and the artifact fingerprint section ties the approved file/issue package to the receipt chain.
`;
