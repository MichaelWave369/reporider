import { createMockGitHubRepository } from '../src/lib/github/mockGitHubClient';
import { buildJsonRideReceipt } from '../src/lib/rideReceiptJson';
import { buildRideReceiptVerificationReport } from '../src/lib/rideReceiptVerificationReport';
import { verifyJsonRideReceipt } from '../src/lib/rideReceiptVerify';
import { scanRepoPlan } from '../src/lib/safetyScan';
import type { RepoIssuePlan, RepoPlan, StarterFilePreview } from '../src/types';

const assert = (condition: boolean, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const plan: RepoPlan = {
  name: 'receipt-report-lab',
  description: 'Local JSON receipt report fixture lab.',
  visibility: 'private',
  stack: 'docs-only',
  files: [
    {
      path: 'README.md',
      purpose: 'Describe the receipt report fixture.',
      riskLevel: 'low',
    },
  ],
  issues: [
    {
      title: 'Review JSON receipt report',
      body: 'Confirm typed JSON receipt reports summarize local verifier output.',
      labels: ['receipt', 'report'],
    },
  ],
  approvalRequired: true,
};

const reviewedFiles: StarterFilePreview[] = [
  {
    path: 'README.md',
    purpose: 'Describe the receipt report fixture.',
    riskLevel: 'low',
    language: 'markdown',
    content: '# Receipt Report Lab\n\nThis fixture stays local and deterministic.\n',
  },
];

const reviewedIssues: RepoIssuePlan[] = [...plan.issues];
const safetyReport = scanRepoPlan(plan, reviewedFiles, reviewedIssues);

const runFixture = async () => {
  const mockCreateResult = await createMockGitHubRepository({
    approvedByUser: true,
    plan,
    safetyReport,
    starterFiles: reviewedFiles,
    starterIssues: reviewedIssues,
  });
  const verification = verifyJsonRideReceipt(buildJsonRideReceipt(mockCreateResult));
  const report = buildRideReceiptVerificationReport(verification);

  assert(report.includes('# RepoRider JSON Receipt Check'), 'Report should include title');
  assert(report.includes('Status: valid'), 'Report should include status');
  assert(report.includes(`Policy version: ${safetyReport.policyVersion}`), 'Report should include policy version');
  assert(report.includes(`Receipt-chain hash: ${mockCreateResult.summary.receiptChainHash}`), 'Report should include receipt-chain hash');
  assert(report.includes(`Receipt count: ${mockCreateResult.receipts.length}`), 'Report should include receipt count');
  assert(report.includes('Warnings: 0'), 'Report should include warning count');
  assert(report.includes('Attention checks: 0'), 'Report should include attention count');
};

runFixture()
  .then(() => {
    console.log('Typed JSON receipt verification report fixtures passed.');
  })
  .catch((error: unknown) => {
    throw error;
  });
