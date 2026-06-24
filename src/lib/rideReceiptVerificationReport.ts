import type { RideReceiptVerificationResult } from './rideReceiptVerify';

const present = (value: string | number | undefined) => (value === undefined || value === '' ? 'unknown' : String(value));

export const buildRideReceiptVerificationReport = (result: RideReceiptVerificationResult) => {
  const passCount = result.checks.filter((check) => check.status === 'pass').length;
  const warningChecks = result.checks.filter((check) => check.status === 'warning');
  const attentionChecks = result.checks.filter((check) => check.status === 'fail');
  const lines = [
    '# RepoRider JSON Receipt Check',
    '',
    `Status: ${result.status}`,
    `Summary: ${result.summary}`,
    '',
    '## Metadata',
    `Format: ${present(result.format)}`,
    `Policy version: ${present(result.policyVersion)}`,
    `Safety status: ${present(result.safetyStatus)}`,
    `Ride fingerprint: ${present(result.rideArtifactFingerprint)}`,
    `Receipt-chain hash: ${present(result.receiptChainHash)}`,
    `Receipt count: ${present(result.receiptCount)}`,
    '',
    '## Check counts',
    `Passed checks: ${passCount}`,
    `Warnings: ${warningChecks.length}`,
    `Attention checks: ${attentionChecks.length}`,
  ];

  if (warningChecks.length > 0) {
    lines.push('', '## Warnings', ...warningChecks.map((check) => `- ${check.label}: ${check.detail}`));
  }

  if (attentionChecks.length > 0) {
    lines.push('', '## Attention checks', ...attentionChecks.map((check) => `- ${check.label}: ${check.detail}`));
  }

  return lines.join('\n');
};
