import { createMockGitHubRepository } from '../src/lib/github/mockGitHubClient';
import { buildJsonRideReceipt, buildTypedRideReceiptJson } from '../src/lib/rideReceiptJson';
import { verifyJsonRideReceipt } from '../src/lib/rideReceiptVerify';
import { scanRepoPlan } from '../src/lib/safetyScan';
import type { RepoIssuePlan, RepoPlan, StarterFilePreview } from '../src/types';

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
  name: 'receipt-verify-lab',
  description: 'Local JSON receipt verification fixture lab.',
  visibility: 'private',
  stack: 'docs-only',
  files: [
    {
      path: 'README.md',
      purpose: 'Describe the receipt verification fixture.',
      riskLevel: 'low',
    },
  ],
  issues: [
    {
      title: 'Verify JSON receipt chain',
      body: 'Confirm typed JSON receipt previews can be verified locally.',
      labels: ['receipt', 'verification'],
    },
  ],
  approvalRequired: true,
};

const reviewedFiles: StarterFilePreview[] = [
  {
    path: 'README.md',
    purpose: 'Describe the receipt verification fixture.',
    riskLevel: 'low',
    language: 'markdown',
    content: '# Receipt Verify Lab\n\nThis fixture stays local and deterministic.\n',
  },
];

const reviewedIssues: RepoIssuePlan[] = [...plan.issues];
const safetyReport = scanRepoPlan(plan, reviewedFiles, reviewedIssues);
assertEqual(safetyReport.status, 'pass', 'Receipt verify fixture safety report should pass');

const runFixture = async () => {
  const mockCreateResult = await createMockGitHubRepository({
    approvedByUser: true,
    plan,
    safetyReport,
    starterFiles: reviewedFiles,
    starterIssues: reviewedIssues,
  });
  const jsonReceipt = buildJsonRideReceipt(mockCreateResult);
  const typedReceipt = buildTypedRideReceiptJson(mockCreateResult);

  const validVerification = verifyJsonRideReceipt(jsonReceipt);
  assertEqual(validVerification.status, 'valid', 'Fresh typed JSON receipt should verify as valid');
  assertEqual(validVerification.format, typedReceipt.format, 'Verification should expose the typed receipt format id');
  assertEqual(validVerification.policyVersion, safetyReport.policyVersion, 'Verification should expose the safety policy version');
  assertEqual(validVerification.safetyStatus, safetyReport.status, 'Verification should expose the safety status');
  assertEqual(validVerification.rideArtifactFingerprint, mockCreateResult.summary.rideArtifactFingerprint, 'Verification should expose ride artifact fingerprint');
  assertEqual(validVerification.receiptChainHash, mockCreateResult.summary.receiptChainHash, 'Verification should expose receipt-chain hash');
  assertEqual(validVerification.receiptCount, mockCreateResult.receipts.length, 'Verification should expose receipt count');
  assert(
    validVerification.checks.some((check) => check.id === 'receipt-chain-links' && check.status === 'pass'),
    'Fresh typed JSON receipt should pass chain-link verification',
  );

  const tamperedReceipt = JSON.parse(jsonReceipt) as typeof typedReceipt;
  tamperedReceipt.receipts[0] = {
    ...tamperedReceipt.receipts[0],
    detail: `${tamperedReceipt.receipts[0].detail} changed`,
  };
  const tamperedVerification = verifyJsonRideReceipt(JSON.stringify(tamperedReceipt, null, 2));
  assertEqual(tamperedVerification.status, 'invalid', 'Changing receipt detail should break the recomputed receipt hash');
  assert(
    tamperedVerification.checks.some((check) => check.id === 'receipt-0-hash' && check.status === 'fail'),
    'Tampered receipt should fail the recomputed first receipt hash check',
  );

  const brokenChainReceipt = JSON.parse(jsonReceipt) as typeof typedReceipt;
  brokenChainReceipt.receipts[1] = {
    ...brokenChainReceipt.receipts[1],
    previousReceiptHash: 'receipt-brokenlink',
  };
  const brokenChainVerification = verifyJsonRideReceipt(JSON.stringify(brokenChainReceipt, null, 2));
  assertEqual(brokenChainVerification.status, 'invalid', 'Changing previousReceiptHash should break receipt-chain verification');
  assert(
    brokenChainVerification.checks.some((check) => check.id === 'receipt-1-previous-hash' && check.status === 'fail'),
    'Broken chain should fail the second receipt previous-hash check',
  );

  const missingBoundaryReceipt = JSON.parse(jsonReceipt) as typeof typedReceipt;
  missingBoundaryReceipt.boundary = {
    ...missingBoundaryReceipt.boundary,
    notes: [],
  };
  const warningVerification = verifyJsonRideReceipt(JSON.stringify(missingBoundaryReceipt, null, 2));
  assertEqual(warningVerification.status, 'warning', 'Missing boundary notes should produce review warning, not a chain failure');
  assert(
    warningVerification.checks.some((check) => check.id === 'boundary-notes' && check.status === 'warning'),
    'Missing boundary notes should be reported as a boundary warning',
  );

  const parseVerification = verifyJsonRideReceipt('{');
  assertEqual(parseVerification.status, 'invalid', 'Invalid JSON should fail receipt verification');
  assert(
    parseVerification.checks.some((check) => check.id === 'json-parse' && check.status === 'fail'),
    'Invalid JSON should include a JSON parse failure check',
  );
};

runFixture()
  .then(() => {
    console.log('Typed JSON receipt verification fixtures passed.');
  })
  .catch((error: unknown) => {
    throw error;
  });
