import type { GithubCreateRepoResult, Receipt } from '../types';

const listItems = (items: string[]) => (items.length > 0
  ? items.map((item) => `- ${item}`).join('\n')
  : '- None');

const formatReceipt = (receipt: Receipt) => (
  `- **${receipt.status.toUpperCase()}** · ${receipt.action} — ${receipt.detail}`
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

RepoRider generated this Markdown from the same typed create result shown on the Ride Complete screen. In mock mode, no token is requested, no remote repository is created, no files are pushed, and no issues are opened.
`;
