import { dryRunWriterAdapter } from '../src/lib/dryRunWriter';
import { createMockGitHubRepository } from '../src/lib/github/mockGitHubClient';
import { buildJsonRideReceipt, buildTypedRideReceiptJson } from '../src/lib/rideReceiptJson';
import { buildMarkdownRideReceipt } from '../src/lib/rideReceiptMarkdown';
import { createSeedReceipts } from '../src/lib/receiptLedger';
import {
  buildApprovedFilesFingerprint,
  buildApprovedIssuesFingerprint,
  buildRideArtifactFingerprint,
} from '../src/lib/receiptFingerprint';
import { scanRepoPlan } from '../src/lib/safetyScan';
import type { LiveModeState, RepoIssuePlan, RepoPlan, StarterFilePreview } from '../src/types';

const assert = (condition: boolean, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const assertEqual = <T>(actual: T, expected: T, message: string) => {
  if (actual !== expected) {
    throw new Error(`${message}. Expected ${String(expected)}, received ${String(actual)}.`);
  }
};

const assertFingerprint = (value: string | undefined, prefix: string, message: string) => {
  assert(Boolean(value?.startsWith(prefix)), `${message}. Received ${String(value)}.`);
};

const plan: RepoPlan = {
  name: 'receipt-policy-lab',
  description: 'Local receipt policy coupling fixture lab.',
  visibility: 'private',
  stack: 'docs-only',
  files: [
    {
      path: 'README.md',
      purpose: 'Describe the fixture project.',
      riskLevel: 'low',
    },
  ],
  issues: [
    {
      title: 'Review receipt policy coupling',
      body: 'Confirm receipts carry the active safety policy version and status.',
      labels: ['safety', 'receipt'],
    },
  ],
  approvalRequired: true,
};

const reviewedFiles: StarterFilePreview[] = [
  {
    path: 'README.md',
    purpose: 'Describe the fixture project.',
    riskLevel: 'low',
    language: 'markdown',
    content: '# Receipt Policy Lab\n\nThis fixture stays local and safe.\n',
  },
];

const reviewedIssues: RepoIssuePlan[] = [...plan.issues];

const mockOnlyLiveModeState: LiveModeState = {
  status: 'mock_only',
  label: 'Mock only',
  summary: 'Fixture state keeps real writes unavailable.',
  canArmLiveMode: false,
  canStartWrite: false,
  canRetryWrite: false,
  isTerminal: false,
  requiredGates: ['Future OAuth, secure token storage, and live write arming are still required.'],
  boundaryNotes: ['Fixture state performs no GitHub writes.'],
};

const safetyReport = scanRepoPlan(plan, reviewedFiles, reviewedIssues);
const approvedFilesFingerprint = buildApprovedFilesFingerprint(reviewedFiles);
const approvedIssuesFingerprint = buildApprovedIssuesFingerprint(reviewedIssues);
const rideArtifactFingerprint = buildRideArtifactFingerprint({
  approvedFiles: reviewedFiles,
  approvedIssues: reviewedIssues,
  plan,
  safetyReport,
});
assertEqual(safetyReport.status, 'pass', 'Receipt fixture safety report should pass');
assert(safetyReport.policyVersion.length > 0, 'Receipt fixture safety report should expose a policy version');
assertFingerprint(approvedFilesFingerprint, 'files-', 'Approved files fingerprint should use files namespace');
assertFingerprint(approvedIssuesFingerprint, 'issues-', 'Approved issues fingerprint should use issues namespace');
assertFingerprint(rideArtifactFingerprint, 'ride-', 'Ride artifact fingerprint should use ride namespace');

const seedReceipts = createSeedReceipts(plan, safetyReport);
assert(seedReceipts.length > 0, 'Seed receipts should be created');
seedReceipts.forEach((receipt, index) => {
  assertEqual(receipt.safetyPolicyVersion, safetyReport.policyVersion, `Seed receipt ${receipt.id} should carry safety policy version`);
  assertEqual(receipt.safetyStatus, safetyReport.status, `Seed receipt ${receipt.id} should carry safety status`);
  assertFingerprint(receipt.artifactFingerprint, 'seed-', `Seed receipt ${receipt.id} should carry seed artifact fingerprint`);
  assertFingerprint(receipt.receiptHash, 'receipt-', `Seed receipt ${receipt.id} should carry receipt hash`);
  assert(index === 0 || receipt.previousReceiptHash === seedReceipts[index - 1].receiptHash, `Seed receipt ${receipt.id} should chain to prior receipt`);
});
assert(
  seedReceipts.some((receipt) => receipt.id === 'safety-scan' && receipt.detail.includes(safetyReport.policyVersion)),
  'Seed safety receipt detail should name the active policy version',
);

const dryRunResult = dryRunWriterAdapter.dryRun({
  approvedByUser: true,
  approvedStarterFiles: reviewedFiles,
  approvedStarterIssues: reviewedIssues,
  liveModeState: mockOnlyLiveModeState,
  plan,
  receiptPreview: seedReceipts,
  safetyReport,
});
assertEqual(dryRunResult.requestSummary.safetyPolicyVersion, safetyReport.policyVersion, 'Dry-run summary should carry safety policy version');
assertEqual(dryRunResult.requestSummary.safetyStatus, safetyReport.status, 'Dry-run summary should carry safety status');
assertEqual(dryRunResult.requestSummary.approvedFilesFingerprint, approvedFilesFingerprint, 'Dry-run summary should carry approved file fingerprint');
assertEqual(dryRunResult.requestSummary.approvedIssuesFingerprint, approvedIssuesFingerprint, 'Dry-run summary should carry approved issue fingerprint');
assertEqual(dryRunResult.requestSummary.rideArtifactFingerprint, rideArtifactFingerprint, 'Dry-run summary should carry ride artifact fingerprint');
assertFingerprint(dryRunResult.requestSummary.receiptPreviewFingerprint, 'receipt-preview-', 'Dry-run summary should carry receipt preview fingerprint');
assert(
  dryRunResult.boundaryNotes.some((note) => note.includes(safetyReport.policyVersion) && note.includes(safetyReport.status)),
  'Dry-run boundary notes should include policy version and status',
);
assert(
  dryRunResult.boundaryNotes.some((note) => note.includes(approvedFilesFingerprint) && note.includes(approvedIssuesFingerprint) && note.includes(rideArtifactFingerprint)),
  'Dry-run boundary notes should include artifact fingerprints',
);

const runMockCreateFixture = async () => {
  const mockCreateResult = await createMockGitHubRepository({
    approvedByUser: true,
    plan,
    safetyReport,
    starterFiles: reviewedFiles,
    starterIssues: reviewedIssues,
  });

  assertEqual(mockCreateResult.summary.safetyPolicyVersion, safetyReport.policyVersion, 'Mock create summary should carry safety policy version');
  assertEqual(mockCreateResult.summary.safetyStatus, safetyReport.status, 'Mock create summary should carry safety status');
  assertEqual(mockCreateResult.summary.safetyWarningCount, safetyReport.warningCount, 'Mock create summary should carry warning count');
  assertEqual(mockCreateResult.summary.safetyBlockerCount, safetyReport.blockerCount, 'Mock create summary should carry blocker count');
  assertEqual(mockCreateResult.summary.approvedFilesFingerprint, approvedFilesFingerprint, 'Mock create summary should carry approved file fingerprint');
  assertEqual(mockCreateResult.summary.approvedIssuesFingerprint, approvedIssuesFingerprint, 'Mock create summary should carry approved issue fingerprint');
  assertEqual(mockCreateResult.summary.rideArtifactFingerprint, rideArtifactFingerprint, 'Mock create summary should carry ride artifact fingerprint');
  assertEqual(mockCreateResult.summary.receiptChainHash, mockCreateResult.receipts.at(-1)?.receiptHash, 'Mock create summary should carry final receipt chain hash');
  assert(
    mockCreateResult.receipts.some((receipt) => receipt.id === 'mock-safety-policy-coupled' && receipt.detail.includes(safetyReport.policyVersion)),
    'Mock create receipts should include a dedicated policy-coupling receipt',
  );
  assert(
    mockCreateResult.receipts.some((receipt) => receipt.id === 'mock-artifact-fingerprint-coupled' && receipt.detail.includes(rideArtifactFingerprint)),
    'Mock create receipts should include a dedicated artifact-fingerprint receipt',
  );
  mockCreateResult.receipts.forEach((receipt, index) => {
    assertEqual(receipt.safetyPolicyVersion, safetyReport.policyVersion, `Mock receipt ${receipt.id} should carry safety policy version`);
    assertEqual(receipt.safetyStatus, safetyReport.status, `Mock receipt ${receipt.id} should carry safety status`);
    assertFingerprint(receipt.artifactFingerprint, index < 3 || receipt.id.includes('repo') ? 'ride-' : receipt.id.includes('file') ? 'files-' : 'issues-', `Mock receipt ${receipt.id} should carry an artifact fingerprint`);
    assertFingerprint(receipt.receiptHash, 'receipt-', `Mock receipt ${receipt.id} should carry receipt hash`);
    assert(index === 0 || receipt.previousReceiptHash === mockCreateResult.receipts[index - 1].receiptHash, `Mock receipt ${receipt.id} should chain to prior receipt`);
  });

  const markdownReceipt = buildMarkdownRideReceipt(mockCreateResult);
  assert(markdownReceipt.includes(`**Policy version:** ${safetyReport.policyVersion}`), 'Markdown receipt should include policy version');
  assert(markdownReceipt.includes(`**Safety status:** ${safetyReport.status}`), 'Markdown receipt should include safety status');
  assert(markdownReceipt.includes(`**Ride artifact:** ${rideArtifactFingerprint}`), 'Markdown receipt should include ride artifact fingerprint');
  assert(markdownReceipt.includes(`**Approved files:** ${approvedFilesFingerprint}`), 'Markdown receipt should include approved files fingerprint');
  assert(markdownReceipt.includes(`**Approved issues:** ${approvedIssuesFingerprint}`), 'Markdown receipt should include approved issues fingerprint');
  assert(markdownReceipt.includes(`**Receipt chain:** ${mockCreateResult.summary.receiptChainHash}`), 'Markdown receipt should include receipt chain hash');
  assert(markdownReceipt.includes(`policy ${safetyReport.policyVersion}, status ${safetyReport.status}`), 'Markdown receipt lines should include receipt-level policy metadata');
  assert(markdownReceipt.includes('hash receipt-'), 'Markdown receipt lines should include receipt hashes');

  const typedJsonReceipt = buildTypedRideReceiptJson(mockCreateResult);
  const jsonReceipt = buildJsonRideReceipt(mockCreateResult);
  const parsedJsonReceipt = JSON.parse(jsonReceipt) as typeof typedJsonReceipt;
  assertEqual(typedJsonReceipt.format, 'reporider.ride-receipt.v1', 'Typed JSON receipt should carry the versioned format id');
  assertEqual(parsedJsonReceipt.format, typedJsonReceipt.format, 'JSON export should parse back to the typed receipt format id');
  assertEqual(parsedJsonReceipt.safetyPolicy.policyVersion, safetyReport.policyVersion, 'JSON export should include safety policy version');
  assertEqual(parsedJsonReceipt.safetyPolicy.status, safetyReport.status, 'JSON export should include safety status');
  assertEqual(parsedJsonReceipt.artifactFingerprints.rideArtifact, rideArtifactFingerprint, 'JSON export should include ride artifact fingerprint');
  assertEqual(parsedJsonReceipt.artifactFingerprints.approvedFiles, approvedFilesFingerprint, 'JSON export should include approved files fingerprint');
  assertEqual(parsedJsonReceipt.artifactFingerprints.approvedIssues, approvedIssuesFingerprint, 'JSON export should include approved issues fingerprint');
  assertEqual(parsedJsonReceipt.artifactFingerprints.receiptChain, mockCreateResult.summary.receiptChainHash, 'JSON export should include receipt chain hash');
  assertEqual(parsedJsonReceipt.queuedFiles[0].path, reviewedFiles[0].path, 'JSON export should include queued file paths');
  assertEqual(parsedJsonReceipt.queuedIssues[0].title, reviewedIssues[0].title, 'JSON export should include queued issue titles');
  assertEqual(parsedJsonReceipt.receipts.length, mockCreateResult.receipts.length, 'JSON export should include all receipts');
  assert(
    parsedJsonReceipt.receipts.every((receipt) => receipt.receiptHash?.startsWith('receipt-')),
    'JSON export receipts should include receipt hashes',
  );
  assert(
    parsedJsonReceipt.boundary.notes.some((note) => note.includes('No OAuth token')),
    'JSON export should include boundary notes',
  );
};

runMockCreateFixture()
  .then(() => {
    console.log('Receipt policy coupling fixtures passed.');
  })
  .catch((error: unknown) => {
    throw error;
  });
