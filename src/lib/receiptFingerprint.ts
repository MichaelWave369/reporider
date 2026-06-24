import type { Receipt, RepoIssuePlan, RepoPlan, SafetyReport, StarterFilePreview } from '../types';

type CanonicalValue = string | number | boolean | null | CanonicalValue[] | { [key: string]: CanonicalValue };

const canonicalize = (value: unknown): CanonicalValue => {
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, CanonicalValue>>((canonical, key) => {
        const nextValue = (value as Record<string, unknown>)[key];
        if (nextValue !== undefined) {
          canonical[key] = canonicalize(nextValue);
        }
        return canonical;
      }, {});
  }

  return String(value);
};

const hashString = (source: string) => {
  let hash = 0x811c9dc5;

  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }

  return hash.toString(16).padStart(8, '0');
};

export const buildStableFingerprint = (namespace: string, value: unknown) => {
  const canonicalJson = JSON.stringify(canonicalize(value));
  return `${namespace}-${hashString(`${namespace}:${canonicalJson}`)}`;
};

export const buildSafetyReportFingerprint = (safetyReport: SafetyReport) => buildStableFingerprint('safety', {
  blockerCount: safetyReport.blockerCount,
  checks: safetyReport.checks.map((check) => ({ id: check.id, status: check.status })),
  findings: safetyReport.findings.map((finding) => ({
    category: finding.category,
    id: finding.id,
    message: finding.message,
    path: finding.path,
    remediation: finding.remediation,
    severity: finding.severity,
  })),
  policyVersion: safetyReport.policyVersion,
  requiredGates: safetyReport.requiredGates,
  status: safetyReport.status,
  warningCount: safetyReport.warningCount,
});

export const buildApprovedFilesFingerprint = (files: StarterFilePreview[]) => buildStableFingerprint('files', files.map((file) => ({
  content: file.content,
  language: file.language,
  path: file.path,
  purpose: file.purpose,
  riskLevel: file.riskLevel,
})));

export const buildApprovedIssuesFingerprint = (issues: RepoIssuePlan[]) => buildStableFingerprint('issues', issues.map((issue) => ({
  body: issue.body,
  labels: [...issue.labels].sort(),
  title: issue.title,
})));

export const buildPlanFingerprint = (plan: RepoPlan) => buildStableFingerprint('plan', {
  approvalRequired: plan.approvalRequired,
  description: plan.description,
  files: plan.files,
  issues: plan.issues,
  name: plan.name,
  stack: plan.stack,
  visibility: plan.visibility,
});

export const buildRideArtifactFingerprint = ({
  approvedFiles,
  approvedIssues,
  plan,
  safetyReport,
}: {
  approvedFiles: StarterFilePreview[];
  approvedIssues: RepoIssuePlan[];
  plan: RepoPlan;
  safetyReport: SafetyReport;
}) => buildStableFingerprint('ride', {
  approvedFilesFingerprint: buildApprovedFilesFingerprint(approvedFiles),
  approvedIssuesFingerprint: buildApprovedIssuesFingerprint(approvedIssues),
  planFingerprint: buildPlanFingerprint(plan),
  safetyReportFingerprint: buildSafetyReportFingerprint(safetyReport),
});

export const buildSeedArtifactFingerprint = (plan: RepoPlan, safetyReport: SafetyReport) => buildStableFingerprint('seed', {
  planFingerprint: buildPlanFingerprint(plan),
  safetyReportFingerprint: buildSafetyReportFingerprint(safetyReport),
});

export const buildReceiptPreviewFingerprint = (receipts: Receipt[]) => buildStableFingerprint('receipt-preview', receipts.map((receipt) => ({
  action: receipt.action,
  artifactFingerprint: receipt.artifactFingerprint,
  detail: receipt.detail,
  id: receipt.id,
  previousReceiptHash: receipt.previousReceiptHash,
  receiptHash: receipt.receiptHash,
  safetyPolicyVersion: receipt.safetyPolicyVersion,
  safetyStatus: receipt.safetyStatus,
  status: receipt.status,
})));

export const attachReceiptChain = (receipts: Receipt[], chainSeed: string): Receipt[] => {
  let previousReceiptHash = chainSeed;

  return receipts.map((receipt) => {
    const receiptHash = buildStableFingerprint('receipt', {
      action: receipt.action,
      artifactFingerprint: receipt.artifactFingerprint,
      detail: receipt.detail,
      id: receipt.id,
      previousReceiptHash,
      safetyPolicyVersion: receipt.safetyPolicyVersion,
      safetyStatus: receipt.safetyStatus,
      status: receipt.status,
      timestamp: receipt.timestamp,
    });

    const chainedReceipt = {
      ...receipt,
      previousReceiptHash,
      receiptHash,
    };

    previousReceiptHash = receiptHash;
    return chainedReceipt;
  });
};
