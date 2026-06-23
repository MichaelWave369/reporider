import type {
  RepoPlan,
  SafetyFinding,
  SafetyPolicyCheck,
  SafetyPolicyCheckStatus,
  SafetyReport,
} from '../types';

const policyVersion = 'safety-policy-gate-v0.2';

const secretLikePatterns = [/\.env$/i, /secret/i, /token/i, /api[_-]?key/i, /credential/i, /password/i, /private[_-]?key/i];
const unsafePathPatterns = [/^\//, /\.\./, /~\//, /\.pem$/i, /\.key$/i, /id_rsa/i];
const issueCredentialPatterns = [/secret/i, /token/i, /api[_-]?key/i, /credential/i, /password/i, /private key/i];

const requiredGates = [
  'Every generated starter file must have a fresh content-bound approval.',
  'Every generated starter issue must have a fresh content-bound approval.',
  'The dry-run writer must summarize the exact reviewed package before live mode can be considered.',
  'Any blocker finding must be resolved before mock create or future live writes proceed.',
  'Future live writes still require OAuth, secure token storage, and an armed live-mode state.',
];

const boundaryNotes = [
  'Safety policy findings are local planning checks, not proof that a repository is safe to publish.',
  'A passing safety report does not grant write authority and does not bypass human approvals.',
  'Saved drafts, imported Markdown, and restored rides always reset review state and never carry safety approval forward.',
  'Future live write mode must treat any warning as an explicit review prompt and any blocker as a hard stop.',
];

const buildCheck = (
  id: string,
  label: string,
  status: SafetyPolicyCheckStatus,
  summary: string,
): SafetyPolicyCheck => ({ id, label, status, summary });

const mostSevereStatus = (findings: SafetyFinding[]): SafetyReport['status'] => {
  if (findings.some((finding) => finding.severity === 'blocker')) return 'blocked';
  if (findings.some((finding) => finding.severity === 'warning')) return 'needs-review';
  return 'pass';
};

const countSeverity = (findings: SafetyFinding[], severity: SafetyFinding['severity']) => (
  findings.filter((finding) => finding.severity === severity).length
);

const summarizePolicy = (status: SafetyReport['status'], warningCount: number, blockerCount: number) => {
  if (status === 'blocked') {
    return `${blockerCount} blocker(s) must be resolved before the write package can proceed.`;
  }

  if (status === 'needs-review') {
    return `${warningCount} warning(s) require explicit review before any future live write can be considered.`;
  }

  return 'No policy blockers or warnings were found in the current generated plan.';
};

export const scanRepoPlan = (plan: RepoPlan): SafetyReport => {
  const findings: SafetyFinding[] = [];

  const repoNameLooksUnsafe = !plan.name.trim() || plan.name.includes('/') || plan.name.includes('..');
  if (repoNameLooksUnsafe) {
    findings.push({
      id: 'unsafe-repo-name',
      severity: 'blocker',
      message: 'Repository name must be non-empty and must not contain path traversal or slash characters.',
    });
  }

  if (plan.visibility === 'public') {
    findings.push({
      id: 'public-repo-review',
      severity: 'warning',
      message: 'Public repositories should receive extra review before generated files are committed.',
    });
  }

  for (const file of plan.files) {
    const looksSecretLike = secretLikePatterns.some((pattern) => pattern.test(file.path));
    const looksUnsafePath = unsafePathPatterns.some((pattern) => pattern.test(file.path));

    if (looksSecretLike) {
      findings.push({
        id: `secret-like-path:${file.path}`,
        severity: 'blocker',
        path: file.path,
        message: 'This path looks like it may contain secrets or credentials. Block commit until reviewed.',
      });
    }

    if (looksUnsafePath) {
      findings.push({
        id: `unsafe-path:${file.path}`,
        severity: 'blocker',
        path: file.path,
        message: 'Generated file paths must stay repo-relative and must not reference key files or traversal paths.',
      });
    }

    if (file.riskLevel === 'high') {
      findings.push({
        id: `high-risk-file:${file.path}`,
        severity: 'warning',
        path: file.path,
        message: 'High-risk generated file requires explicit human approval.',
      });
    }
  }

  if (plan.issues.length > 10) {
    findings.push({
      id: 'large-generated-issue-set',
      severity: 'warning',
      message: 'Large generated issue sets should be reviewed carefully before any future bulk issue creation.',
    });
  }

  for (const issue of plan.issues) {
    const issueText = `${issue.title}\n${issue.body}\n${issue.labels.join(' ')}`;
    if (issueCredentialPatterns.some((pattern) => pattern.test(issueText))) {
      findings.push({
        id: `credential-like-issue:${issue.title}`,
        severity: 'warning',
        message: 'Starter issue text appears to mention credentials or secrets and should be reviewed before opening.',
      });
    }
  }

  if (findings.length === 0) {
    findings.push({
      id: 'baseline-pass',
      severity: 'info',
      message: 'No obvious safety blockers found in the starter repo plan.',
    });
  }

  const warningCount = countSeverity(findings, 'warning');
  const blockerCount = countSeverity(findings, 'blocker');
  const status = mostSevereStatus(findings);

  const checks: SafetyPolicyCheck[] = [
    buildCheck(
      'repo-name-hygiene',
      'Repository name hygiene',
      repoNameLooksUnsafe ? 'blocker' : 'pass',
      repoNameLooksUnsafe
        ? 'Repo name must be corrected before any write package can proceed.'
        : 'Repo name is non-empty and path-safe.',
    ),
    buildCheck(
      'visibility-review',
      'Visibility review',
      plan.visibility === 'public' ? 'warning' : 'pass',
      plan.visibility === 'public'
        ? 'Public visibility requires extra human review.'
        : 'Private-first visibility is currently selected.',
    ),
    buildCheck(
      'file-path-policy',
      'File path policy',
      findings.some((finding) => finding.id.startsWith('secret-like-path') || finding.id.startsWith('unsafe-path')) ? 'blocker' : 'pass',
      'Generated file paths were checked for secret-like names, traversal, absolute paths, and key-file patterns.',
    ),
    buildCheck(
      'file-risk-policy',
      'File risk policy',
      findings.some((finding) => finding.id.startsWith('high-risk-file')) ? 'warning' : 'pass',
      'Generated file risk levels were checked for high-risk artifacts requiring explicit review.',
    ),
    buildCheck(
      'issue-policy',
      'Starter issue policy',
      findings.some((finding) => finding.id.startsWith('credential-like-issue') || finding.id === 'large-generated-issue-set') ? 'warning' : 'pass',
      'Starter issue count and text were checked for bulk-creation and credential-like review signals.',
    ),
  ];

  return {
    status,
    policyVersion,
    summary: summarizePolicy(status, warningCount, blockerCount),
    warningCount,
    blockerCount,
    reviewedScope: {
      fileCount: plan.files.length,
      issueCount: plan.issues.length,
      stack: plan.stack,
      visibility: plan.visibility,
    },
    checks,
    findings,
    requiredGates,
    boundaryNotes,
  };
};
