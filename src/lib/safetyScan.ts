import type {
  RepoPlan,
  SafetyFinding,
  SafetyPolicyCheck,
  SafetyPolicyCheckStatus,
  SafetyReport,
  StarterFilePreview,
} from '../types';

const policyVersion = 'safety-policy-gate-v0.3';

const secretLikePatterns = [/\.env$/i, /secret/i, /token/i, /api[_-]?key/i, /credential/i, /password/i, /private[_-]?key/i];
const unsafePathPatterns = [/^\//, /\.\./, /~\//, /\.pem$/i, /\.key$/i, /id_rsa/i];
const issueCredentialPatterns = [/secret/i, /token/i, /api[_-]?key/i, /credential/i, /password/i, /private key/i];

const reviewedContentBlockerPatterns = [
  {
    id: 'private-key-block',
    message: 'Reviewed file content appears to contain a private key block. Remove it before any write package can proceed.',
    pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/i,
  },
  {
    id: 'github-token-prefix',
    message: 'Reviewed file content appears to contain a GitHub token-like value. Remove it before any write package can proceed.',
    pattern: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{20,}\b/,
  },
  {
    id: 'github-fine-grained-token',
    message: 'Reviewed file content appears to contain a fine-grained GitHub token-like value. Remove it before any write package can proceed.',
    pattern: /\bgithub_pat_[A-Za-z0-9_]{30,}\b/,
  },
  {
    id: 'aws-access-key',
    message: 'Reviewed file content appears to contain an AWS access key-like value. Remove it before any write package can proceed.',
    pattern: /\bAKIA[0-9A-Z]{16}\b/,
  },
  {
    id: 'slack-token',
    message: 'Reviewed file content appears to contain a Slack token-like value. Remove it before any write package can proceed.',
    pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/,
  },
  {
    id: 'npm-token',
    message: 'Reviewed file content appears to contain an npm token-like value. Remove it before any write package can proceed.',
    pattern: /\bnpm_[A-Za-z0-9]{20,}\b/,
  },
  {
    id: 'inline-secret-assignment',
    message: 'Reviewed file content appears to assign a credential-like value. Replace it with a placeholder before any write package can proceed.',
    pattern: /\b(?:api[_-]?key|token|secret|password|credential)\b\s*[:=]\s*['"][^'"\s]{8,}['"]/i,
  },
  {
    id: 'destructive-root-command',
    message: 'Reviewed file content appears to contain a destructive root filesystem command. Remove it before any write package can proceed.',
    pattern: /\brm\s+-rf\s+\/\s*(?:$|[;&|])/im,
  },
];

const reviewedContentWarningPatterns = [
  {
    id: 'remote-shell-pipe',
    message: 'Reviewed file content appears to pipe remote script output into a shell. Review before any future write.',
    pattern: /\b(?:curl|wget)\b[^\n|]*\|\s*(?:sh|bash)\b/i,
  },
  {
    id: 'broad-permission-command',
    message: 'Reviewed file content appears to set broad 777 permissions. Review before any future write.',
    pattern: /\bchmod\s+777\b/i,
  },
  {
    id: 'environment-variable-credential-reference',
    message: 'Reviewed file content references credential-like environment variables. Confirm they are placeholders only.',
    pattern: /process\.env\.[A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|API_KEY|CREDENTIAL)[A-Z0-9_]*/,
  },
  {
    id: 'bearer-header-example',
    message: 'Reviewed file content mentions a bearer authorization header. Confirm it contains no live credential.',
    pattern: /authorization\s*:\s*bearer/i,
  },
];

const requiredGates = [
  'Every generated starter file must have a fresh content-bound approval.',
  'Every generated starter issue must have a fresh content-bound approval.',
  'The reviewed starter-file contents must pass local credential/destructive-command checks.',
  'The dry-run writer must summarize the exact reviewed package before live mode can be considered.',
  'Any blocker finding must be resolved before mock create or future live writes proceed.',
  'Future live writes still require OAuth, secure token storage, and an armed live-mode state.',
];

const boundaryNotes = [
  'Safety policy findings are local planning and reviewed-content checks, not proof that a repository is safe to publish.',
  'A passing safety report does not grant write authority and does not bypass human approvals.',
  'Reviewed file content is scanned locally in the current app state and is not sent to GitHub by this gate.',
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

const summarizePolicy = (
  status: SafetyReport['status'],
  warningCount: number,
  blockerCount: number,
  reviewedFileContentCount: number,
) => {
  if (status === 'blocked') {
    return `${blockerCount} blocker(s) must be resolved before the write package can proceed.`;
  }

  if (status === 'needs-review') {
    return `${warningCount} warning(s) require explicit review before any future live write can be considered.`;
  }

  return `No policy blockers or warnings were found across the current generated plan and ${reviewedFileContentCount} reviewed file draft(s).`;
};

const contentFindingId = (kind: string, path: string, id: string) => `${kind}:${id}:${path}`;

const scanReviewedFileContent = (reviewedStarterFiles: StarterFilePreview[]) => {
  const findings: SafetyFinding[] = [];

  for (const file of reviewedStarterFiles) {
    const content = file.content;

    if (content.trim().length === 0) {
      findings.push({
        id: contentFindingId('empty-reviewed-file', file.path, 'empty-content'),
        severity: 'warning',
        path: file.path,
        message: 'Reviewed file content is empty. Confirm this is intentional before any future write.',
      });
    }

    if (content.length > 25000) {
      findings.push({
        id: contentFindingId('large-reviewed-file', file.path, 'large-content'),
        severity: 'warning',
        path: file.path,
        message: 'Reviewed file content is unusually large for a starter file. Review before any future write.',
      });
    }

    for (const check of reviewedContentBlockerPatterns) {
      if (check.pattern.test(content)) {
        findings.push({
          id: contentFindingId('reviewed-content-blocker', file.path, check.id),
          severity: 'blocker',
          path: file.path,
          message: check.message,
        });
      }
    }

    for (const check of reviewedContentWarningPatterns) {
      if (check.pattern.test(content)) {
        findings.push({
          id: contentFindingId('reviewed-content-warning', file.path, check.id),
          severity: 'warning',
          path: file.path,
          message: check.message,
        });
      }
    }
  }

  return findings;
};

export const scanRepoPlan = (plan: RepoPlan, reviewedStarterFiles: StarterFilePreview[] = []): SafetyReport => {
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

  const reviewedContentFindings = scanReviewedFileContent(reviewedStarterFiles);
  findings.push(...reviewedContentFindings);

  if (findings.length === 0) {
    findings.push({
      id: 'baseline-pass',
      severity: 'info',
      message: 'No obvious safety blockers found in the starter repo plan or reviewed starter-file contents.',
    });
  }

  const warningCount = countSeverity(findings, 'warning');
  const blockerCount = countSeverity(findings, 'blocker');
  const status = mostSevereStatus(findings);
  const reviewedFileContentCharacters = reviewedStarterFiles.reduce((total, file) => total + file.content.length, 0);
  const contentBlockerCount = reviewedContentFindings.filter((finding) => finding.severity === 'blocker').length;
  const contentWarningCount = reviewedContentFindings.filter((finding) => finding.severity === 'warning').length;
  const contentCheckStatus: SafetyPolicyCheckStatus = contentBlockerCount > 0 ? 'blocker' : contentWarningCount > 0 ? 'warning' : 'pass';

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
      'reviewed-file-content-policy',
      'Reviewed file content policy',
      contentCheckStatus,
      `Reviewed ${reviewedStarterFiles.length} file draft(s) and ${reviewedFileContentCharacters} character(s) for credential-like or destructive content signals.`,
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
    summary: summarizePolicy(status, warningCount, blockerCount, reviewedStarterFiles.length),
    warningCount,
    blockerCount,
    reviewedScope: {
      fileCount: plan.files.length,
      issueCount: plan.issues.length,
      reviewedFileContentCharacters,
      reviewedFileContentCount: reviewedStarterFiles.length,
      stack: plan.stack,
      visibility: plan.visibility,
    },
    checks,
    findings,
    requiredGates,
    boundaryNotes,
  };
};