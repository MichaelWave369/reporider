import { attachReceiptChain, buildSeedArtifactFingerprint } from './receiptFingerprint';
import type { Receipt, RepoPlan, SafetyReport } from '../types';

const isoNow = () => new Date().toISOString();

const receiptWithSafety = (
  id: string,
  action: string,
  detail: string,
  status: Receipt['status'],
  safetyReport: SafetyReport,
  timestamp: string,
  artifactFingerprint: string,
): Receipt => ({
  id,
  action,
  artifactFingerprint,
  detail,
  safetyPolicyVersion: safetyReport.policyVersion,
  safetyStatus: safetyReport.status,
  status,
  timestamp,
});

export const createSeedReceipts = (plan: RepoPlan, safetyReport: SafetyReport): Receipt[] => {
  const timestamp = isoNow();
  const seedArtifactFingerprint = buildSeedArtifactFingerprint(plan, safetyReport);
  const receipts = [
    receiptWithSafety(
      'capture-idea',
      'Idea captured',
      `Captured starter idea for ${plan.name}.`,
      'completed',
      safetyReport,
      timestamp,
      seedArtifactFingerprint,
    ),
    receiptWithSafety(
      'plan-repo',
      'Repo plan generated',
      `${plan.files.length} files and ${plan.issues.length} starter issues prepared for review.`,
      'planned',
      safetyReport,
      timestamp,
      seedArtifactFingerprint,
    ),
    receiptWithSafety(
      'safety-scan',
      'Safety scan completed',
      `Safety policy ${safetyReport.policyVersion} returned ${safetyReport.status} with ${safetyReport.warningCount} warning(s), ${safetyReport.blockerCount} blocker(s), and seed fingerprint ${seedArtifactFingerprint}.`,
      safetyReport.status === 'blocked' ? 'blocked' : 'completed',
      safetyReport,
      timestamp,
      seedArtifactFingerprint,
    ),
    receiptWithSafety(
      'human-approval',
      'Human approval required',
      'RepoRider should not write to GitHub until the user reviews and approves the plan.',
      'planned',
      safetyReport,
      timestamp,
      seedArtifactFingerprint,
    ),
  ];

  return attachReceiptChain(receipts, seedArtifactFingerprint);
};
