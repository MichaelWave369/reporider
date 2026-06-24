import { dryRunWriterAdapter } from '../src/lib/dryRunWriter';
import { createMockGitHubRepository } from '../src/lib/github/mockGitHubClient';
import { buildMarkdownRideReceipt } from '../src/lib/rideReceiptMarkdown';
import { createSeedReceipts } from '../src/lib/receiptLedger';
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
assertEqual(safetyReport.status, 'pass', 'Receipt fixture safety report should pass');
assert(safetyReport.policyVersion.length > 0, 'Receipt fixture safety report should expose a policy version');

const seedReceipts = createSeedReceipts(plan, safetyReport);
assert(seedReceipts.length > 0, 'Seed receipts should be created');
seedReceipts.forEach((receipt) => {
  assertEqual(receipt.safetyPolicyVersion, safetyReport.policyVersion, `Seed receipt ${receipt.id} should carry safety policy version`);
  assertEqual(receipt.safetyStatus, safetyReport.status, `Seed receipt ${receipt.id} should carry safety status`);
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
assert(
  dryRunResult.boundaryNotes.some((note) => note.includes(safetyReport.policyVersion) && note.includes(safetyReport.status)),
  'Dry-run boundary notes should include policy version and status',
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
  assert(
    mockCreateResult.receipts.some((receipt) => receipt.id === 'mock-safety-policy-coupled' && receipt.detail.includes(safetyReport.policyVersion)),
    'Mock create receipts should include a dedicated policy-coupling receipt',
  );
  mockCreateResult.receipts.forEach((receipt) => {
    assertEqual(receipt.safetyPolicyVersion, safetyReport.policyVersion, `Mock receipt ${receipt.id} should carry safety policy version`);
    assertEqual(receipt.safetyStatus, safetyReport.status, `Mock receipt ${receipt.id} should carry safety status`);
  });

  const markdownReceipt = buildMarkdownRideReceipt(mockCreateResult);
  assert(markdownReceipt.includes(`**Policy version:** ${safetyReport.policyVersion}`), 'Markdown receipt should include policy version');
  assert(markdownReceipt.includes(`**Safety status:** ${safetyReport.status}`), 'Markdown receipt should include safety status');
  assert(markdownReceipt.includes(`policy ${safetyReport.policyVersion}, status ${safetyReport.status}`), 'Markdown receipt lines should include receipt-level policy metadata');
};

runMockCreateFixture()
  .then(() => {
    console.log('Receipt policy coupling fixtures passed.');
  })
  .catch((error: unknown) => {
    throw error;
  });