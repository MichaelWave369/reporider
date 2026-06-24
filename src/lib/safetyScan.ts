import type {
  RepoIssuePlan,
  RepoPlan,
  SafetyFinding,
  SafetyPolicyCheck,
  SafetyPolicyCheckStatus,
  SafetyReport,
  StarterFilePreview,
} from '../types';

const policyVersion = 'safety-policy-gate-v0.7';

const secretLikePatterns = [/\.env$/i, /secret/i, /token/i, /api[_-]?key/i, /credential/i, /password/i, /private[_-]?key/i];
const unsafePathPatterns = [
  /^\//,
  /^[A-Za-z]:[\\/]/,
  /^\\\\[^\\]+\\[^\\]+/,
  /\.\./,
  /~[\\/]/,
  /\.pem$/i,
  /\.key$/i,
  /id_rsa/i,
];

type RiskPattern = {
  category: string;
  id: string;
  message: string;
  pattern: RegExp;
};

const reviewedContentBlockerPatterns: RiskPattern[] = [
  {
    category: 'credential-material',
    id: 'private-key-block',
    message: 'Reviewed file content appears to contain a private key block. Remove it before any write package can proceed.',
    pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/i,
  },
  {
    category: 'credential-material',
    id: 'github-token-prefix',
    message: 'Reviewed file content appears to contain a GitHub token-like value. Remove it before any write package can proceed.',
    pattern: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{20,}\b/,
  },
  {
    category: 'credential-material',
    id: 'github-fine-grained-token',
    message: 'Reviewed file content appears to contain a fine-grained GitHub token-like value. Remove it before any write package can proceed.',
    pattern: /\bgithub_pat_[A-Za-z0-9_]{30,}\b/,
  },
  {
    category: 'credential-material',
    id: 'aws-access-key',
    message: 'Reviewed file content appears to contain an AWS access key-like value. Remove it before any write package can proceed.',
    pattern: /\bAKIA[0-9A-Z]{16}\b/,
  },
  {
    category: 'credential-material',
    id: 'slack-token',
    message: 'Reviewed file content appears to contain a Slack token-like value. Remove it before any write package can proceed.',
    pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/,
  },
  {
    category: 'credential-material',
    id: 'npm-token',
    message: 'Reviewed file content appears to contain an npm token-like value. Remove it before any write package can proceed.',
    pattern: /\bnpm_[A-Za-z0-9]{20,}\b/,
  },
  {
    category: 'credential-material',
    id: 'inline-secret-assignment',
    message: 'Reviewed file content appears to assign a credential-like value. Replace it with a placeholder before any write package can proceed.',
    pattern: /\b(?:api[_-]?key|token|secret|password|credential)\b\s*[:=]\s*['"][^'"\s]{8,}['"]/i,
  },
  {
    category: 'destructive-command',
    id: 'destructive-root-command',
    message: 'Reviewed file content appears to contain a destructive root filesystem command. Remove it before any write package can proceed.',
    pattern: /\brm\s+-rf\s+\/\s*(?:$|[;&|])/im,
  },
];

const reviewedContentWarningPatterns: RiskPattern[] = [
  {
    category: 'remote-execution',
    id: 'remote-shell-pipe',
    message: 'Reviewed file content appears to pipe remote script output into a shell. Review before any future write.',
    pattern: /\b(?:curl|wget)\b[^\n|]*\|\s*(?:sh|bash)\b/i,
  },
  {
    category: 'permission-risk',
    id: 'broad-permission-command',
    message: 'Reviewed file content appears to set broad 777 permissions. Review before any future write.',
    pattern: /\bchmod\s+777\b/i,
  },
  {
    category: 'credential-reference',
    id: 'environment-variable-credential-reference',
    message: 'Reviewed file content references credential-like environment variables. Confirm they are placeholders only.',
    pattern: /process\.env\.[A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|API_KEY|CREDENTIAL)[A-Z0-9_]*/,
  },
  {
    category: 'credential-reference',
    id: 'bearer-header-example',
    message: 'Reviewed file content mentions a bearer authorization header. Confirm it contains no live credential.',
    pattern: /authorization\s*:\s*bearer/i,
  },
];

const issueBodyBlockerPatterns: RiskPattern[] = [
  {
    category: 'credential-material',
    id: 'issue-private-key-block',
    message: 'Reviewed issue body appears to contain a private key block. Remove it before any issue can be opened.',
    pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/i,
  },
  {
    category: 'credential-material',
    id: 'issue-github-token-prefix',
    message: 'Reviewed issue body appears to contain a GitHub token-like value. Remove it before any issue can be opened.',
    pattern: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{20,}\b/,
  },
  {
    category: 'credential-material',
    id: 'issue-github-fine-grained-token',
    message: 'Reviewed issue body appears to contain a fine-grained GitHub token-like value. Remove it before any issue can be opened.',
    pattern: /\bgithub_pat_[A-Za-z0-9_]{30,}\b/,
  },
  {
    category: 'credential-material',
    id: 'issue-aws-access-key',
    message: 'Reviewed issue body appears to contain an AWS access key-like value. Remove it before any issue can be opened.',
    pattern: /\bAKIA[0-9A-Z]{16}\b/,
  },
  {
    category: 'credential-material',
    id: 'issue-inline-secret-assignment',
    message: 'Reviewed issue body appears to assign a credential-like value. Replace it with a placeholder before any issue can be opened.',
    pattern: /\b(?:api[_-]?key|token|secret|password|credential)\b\s*[:=]\s*['"][^'"\s]{8,}['"]/i,
  },
  {
    category: 'destructive-command',
    id: 'issue-destructive-root-command',
    message: 'Reviewed issue body appears to contain a destructive root filesystem command. Remove it before any issue can be opened.',
    pattern: /\brm\s+-rf\s+\/\s*(?:$|[;&|])/im,
  },
];

const issueBodyWarningPatterns: RiskPattern[] = [
  {
    category: 'credential-reference',
    id: 'issue-credential-reference',
    message: 'Reviewed issue text references credentials, tokens, API keys, passwords, or secrets. Confirm it is guidance only and contains placeholders.',
    pattern: /\b(?:secret|token|api[_ -]?key|credential|password|private key)\b/i,
  },
  {
    category: 'security-disclosure',
    id: 'issue-security-disclosure',
    message: 'Reviewed issue text appears to discuss vulnerability/security disclosure work. Review before opening publicly or in bulk.',
    pattern: /\b(?:vulnerability|exploit|cve|zero[- ]?day|security disclosure|responsible disclosure)\b/i,
  },
  {
    category: 'privileged-operation',
    id: 'issue-privileged-command',
    message: 'Reviewed issue text mentions privileged or destructive setup commands. Confirm they are safe instructions before opening.',
    pattern: /\b(?:sudo|chmod\s+777|chown\s+-R|rm\s+-rf|format\s+disk|drop\s+database)\b/i,
  },
  {
    category: 'remote-execution',
    id: 'issue-remote-shell-pipe',
    message: 'Reviewed issue text appears to pipe remote script output into a shell. Review before opening.',
    pattern: /\b(?:curl|wget)\b[^\n|]*\|\s*(?:sh|bash)\b/i,
  },
  {
    category: 'production-impact',
    id: 'issue-production-impact',
    message: 'Reviewed issue text references production/deployment/migration work. Confirm this starter issue cannot be mistaken for live ops instructions.',
    pattern: /\b(?:production|deploy|deployment|migration|migrate|rollback|incident|outage)\b/i,
  },
  {
    category: 'auth-flow-risk',
    id: 'issue-auth-flow-risk',
    message: 'Reviewed issue text references OAuth, tokens, scopes, or login flows. Confirm it preserves RepoRider write-boundary language.',
    pattern: /\b(?:oauth|access token|refresh token|scope|login|authorization code)\b/i,
  },
];

const packageLifecycleScripts = new Set(['preinstall', 'install', 'postinstall', 'prepare', 'prepublish', 'prepublishOnly']);
const dependencySections = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'] as const;

const packageScriptBlockerPatterns: RiskPattern[] = [
  {
    category: 'package-script-risk',
    id: 'package-script-remote-shell-pipe',
    message: 'package.json script pipes remote output into a shell. Remove or replace with a reviewed local command.',
    pattern: /\b(?:curl|wget)\b[^\n|]*\|\s*(?:sh|bash)\b/i,
  },
  {
    category: 'package-script-risk',
    id: 'package-script-destructive-root-command',
    message: 'package.json script contains a destructive root filesystem command. Remove it before approval.',
    pattern: /\brm\s+-rf\s+\/\s*(?:$|[;&|])/im,
  },
  {
    category: 'package-script-risk',
    id: 'package-script-broad-permission-command',
    message: 'package.json script sets broad 777 permissions. Replace it with narrower reviewed permissions.',
    pattern: /\bchmod\s+777\b/i,
  },
];

const packageManagerWarningPatterns: RiskPattern[] = [
  {
    category: 'package-manager-command-risk',
    id: 'package-manager-global-install',
    message: 'package.json script runs a global package install. Review before any generated package can proceed.',
    pattern: /\b(?:npm|pnpm|yarn)\s+(?:install|add|global\s+add)\b[^\n]*\s(?:-g|--global)\b/i,
  },
  {
    category: 'package-manager-command-risk',
    id: 'package-manager-force-install',
    message: 'package.json script uses a force install or force audit fix. Review before approval.',
    pattern: /\b(?:npm|pnpm|yarn)\b[^\n]*(?:--force|audit\s+fix\s+--force)\b/i,
  },
  {
    category: 'package-manager-command-risk',
    id: 'package-manager-npx-execution',
    message: 'package.json script runs npx. Confirm the package and version are pinned and expected.',
    pattern: /\bnpx\s+[^\n]+/i,
  },
];

const suspiciousDependencyNamePattern = /(?:^|[-_/@])(?:token|secret|password|credential|stealer|malware)(?:$|[-_/@])/i;
const dependencySourceWarningPattern = /^(?:git\+|file:|https?:\/\/)/i;

const requiredGates = [
  'Every generated starter file must have a fresh content-bound approval.',
  'Every generated starter issue must have a fresh content-bound approval.',
  'Every safety warning or blocker must include rider-facing remediation guidance.',
  'The reviewed starter-file contents must pass local credential/destructive-command checks.',
  'The reviewed package manifest contents must pass local script/dependency risk checks.',
  'The reviewed starter-issue bodies must pass local credential/destructive/security/ops risk classification.',
  'The dry-run writer must summarize the exact reviewed package before live mode can be considered.',
  'Any blocker finding must be resolved before mock create or future live writes proceed.',
  'Future live writes still require OAuth, secure token storage, and an armed live-mode state.',
];

const boundaryNotes = [
  'Safety policy findings are local planning, reviewed file-content, package-manifest, and reviewed issue-body checks, not proof that a repository is safe to publish.',
  'A passing safety report does not grant write authority and does not bypass human approvals.',
  'Remediation guidance is a local cleanup prompt for the rider and is not automatic repair or approval.',
  'Reviewed file and issue content is scanned locally in the current app state and is not sent to GitHub by this gate.',
  'Package manifest checks are local heuristics for starter package review and do not install dependencies or contact a package registry.',
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
  reviewedIssueContentCount: number,
) => {
  if (status === 'blocked') {
    return `${blockerCount} blocker(s) must be resolved before the write package can proceed.`;
  }

  if (status === 'needs-review') {
    return `${warningCount} warning(s) require explicit review before any future live write can be considered.`;
  }

  return `No policy blockers or warnings were found across the current generated plan, ${reviewedFileContentCount} reviewed file draft(s), and ${reviewedIssueContentCount} reviewed issue draft(s).`;
};

const contentFindingId = (kind: string, path: string, id: string) => `${kind}:${id}:${path}`;
const issueFindingId = (kind: string, issueIndex: number, id: string) => `${kind}:${id}:issue-${issueIndex + 1}`;
const issuePath = (issueIndex: number, issue: RepoIssuePlan) => `issue:${issueIndex + 1}:${issue.title}`;
const isPackageManifestFile = (path: string) => /(?:^|\/)package\.json$/i.test(path);

const remediationForFinding = (finding: SafetyFinding) => {
  if (finding.id === 'baseline-pass') {
    return 'No cleanup needed for this pass finding. Keep approvals fresh before any future write path.';
  }

  if (finding.id === 'unsafe-repo-name') {
    return 'Rename the repo to a simple slug with no slashes or traversal, then regenerate/review the package.';
  }

  switch (finding.category) {
    case 'visibility-review':
      return 'Keep the repo private until the rider intentionally confirms public release language and reviewed content.';
    case 'secret-like-path':
      return 'Rename or remove this generated path. Use sample or template files for environment values instead of committing secret-like files.';
    case 'unsafe-path':
      return 'Move this generated file to a safe repo-relative path. Remove absolute paths, home-directory paths, traversal, key-file names, and Windows/UNC roots.';
    case 'high-risk-file':
      return 'Open the generated file, reduce risky operations where possible, and require explicit file approval after the final edit.';
    case 'large-issue-set':
      return 'Reduce the starter issue count or split the package into smaller reviewed batches before any future issue creation.';
    case 'empty-content':
      return 'Add intentional starter content or remove the empty file from the generated package before approval.';
    case 'large-content':
      return 'Split the file into smaller reviewed files or confirm the large starter content is intentional before approval.';
    case 'credential-material':
      return 'Remove credential-like material entirely. Replace examples with obvious placeholders such as YOUR_TOKEN_HERE before re-review.';
    case 'destructive-command':
      return 'Remove destructive commands or rewrite them as non-executing documentation warnings before re-review.';
    case 'remote-execution':
      return 'Avoid pipe-to-shell instructions. Prefer documented manual install steps or a reviewed local script with explicit approval.';
    case 'permission-risk':
      return 'Replace broad permission commands with the narrowest required permission and explain why it is needed.';
    case 'credential-reference':
      return 'Confirm the text uses placeholders only and does not include real secrets, tokens, passwords, or live authorization headers.';
    case 'security-disclosure':
      return 'Review whether this belongs in a private security process before opening or publishing the issue.';
    case 'privileged-operation':
      return 'Clarify that privileged operations are examples only, remove dangerous commands, or keep the issue out of starter automation.';
    case 'production-impact':
      return 'Rewrite production/deployment language so it cannot be mistaken for live ops instructions, or hold it for a later reviewed release task.';
    case 'auth-flow-risk':
      return 'Keep OAuth/token language boundary-safe: no live tokens, no requested secrets, and no live-mode claims before auth gates exist.';
    case 'empty-body':
      return 'Add a clear issue body with safe acceptance criteria or remove the empty issue from the starter package.';
    case 'large-body':
      return 'Shorten or split the issue body so the starter issue remains reviewable before any future issue creation.';
    case 'package-manifest-parse':
      return 'Fix package.json syntax before approval. The package manifest must parse locally before it can be reviewed.';
    case 'package-lifecycle-hook':
      return 'Review lifecycle scripts such as install/postinstall/prepare. Remove broad setup hooks unless the rider explicitly approves them.';
    case 'package-script-risk':
      return 'Rewrite this package script to remove destructive, remote-shell, or broad-permission behavior before approval.';
    case 'package-manager-command-risk':
      return 'Avoid package-manager commands that install globally, force changes, or run unpinned packages. Replace them with reviewed local instructions.';
    case 'package-dependency-name-risk':
      return 'Review the dependency name. Remove suspicious or credential-like package names unless the rider explicitly approves the package.';
    case 'package-dependency-source-risk':
      return 'Use registry-pinned dependency versions where possible. Review git, file, or URL dependencies before approval.';
    case 'baseline':
      return 'No cleanup needed. Continue with fresh review and approval gates.';
    default:
      return finding.severity === 'blocker'
        ? 'Resolve this blocker and re-run the safety scan before approval.'
        : 'Review this warning, document the decision, and keep approvals fresh.';
  }
};

const withRemediation = (finding: SafetyFinding): SafetyFinding => ({
  ...finding,
  remediation: finding.remediation ?? remediationForFinding(finding),
});

const scanPackageManifest = (file: StarterFilePreview) => {
  const findings: SafetyFinding[] = [];

  if (!isPackageManifestFile(file.path)) return findings;

  let parsed: unknown;
  try {
    parsed = JSON.parse(file.content);
  } catch {
    findings.push({
      id: contentFindingId('package-manifest-warning', file.path, 'package-json-parse'),
      severity: 'warning',
      path: file.path,
      category: 'package-manifest-parse',
      message: 'Reviewed package.json content could not be parsed. Fix JSON syntax before package approval.',
    });
    return findings;
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    findings.push({
      id: contentFindingId('package-manifest-warning', file.path, 'package-json-shape'),
      severity: 'warning',
      path: file.path,
      category: 'package-manifest-parse',
      message: 'Reviewed package.json content is not an object. Fix package manifest shape before approval.',
    });
    return findings;
  }

  const manifest = parsed as Record<string, unknown>;
  const scripts = manifest.scripts && typeof manifest.scripts === 'object' && !Array.isArray(manifest.scripts)
    ? manifest.scripts as Record<string, unknown>
    : {};

  Object.entries(scripts).forEach(([scriptName, command]) => {
    if (typeof command !== 'string') return;

    if (packageLifecycleScripts.has(scriptName)) {
      findings.push({
        id: contentFindingId('package-lifecycle-warning', file.path, scriptName),
        severity: 'warning',
        path: file.path,
        category: 'package-lifecycle-hook',
        message: `package.json lifecycle script "${scriptName}" requires explicit review before approval.`,
      });
    }

    packageScriptBlockerPatterns.forEach((check) => {
      if (check.pattern.test(command)) {
        findings.push({
          id: contentFindingId('package-script-blocker', file.path, `${scriptName}:${check.id}`),
          severity: 'blocker',
          path: file.path,
          category: check.category,
          message: `${check.message} Script: "${scriptName}".`,
        });
      }
    });

    packageManagerWarningPatterns.forEach((check) => {
      if (check.pattern.test(command)) {
        findings.push({
          id: contentFindingId('package-manager-warning', file.path, `${scriptName}:${check.id}`),
          severity: 'warning',
          path: file.path,
          category: check.category,
          message: `${check.message} Script: "${scriptName}".`,
        });
      }
    });
  });

  dependencySections.forEach((section) => {
    const dependencies = manifest[section];

    if (!dependencies || typeof dependencies !== 'object' || Array.isArray(dependencies)) return;

    Object.entries(dependencies as Record<string, unknown>).forEach(([dependencyName, version]) => {
      if (suspiciousDependencyNamePattern.test(dependencyName)) {
        findings.push({
          id: contentFindingId('package-dependency-warning', file.path, `${section}:${dependencyName}`),
          severity: 'warning',
          path: file.path,
          category: 'package-dependency-name-risk',
          message: `Dependency "${dependencyName}" in ${section} contains suspicious or credential-like wording. Review before approval.`,
        });
      }

      if (typeof version === 'string' && dependencySourceWarningPattern.test(version)) {
        findings.push({
          id: contentFindingId('package-dependency-source-warning', file.path, `${section}:${dependencyName}`),
          severity: 'warning',
          path: file.path,
          category: 'package-dependency-source-risk',
          message: `Dependency "${dependencyName}" in ${section} uses a git/file/URL source. Review before approval.`,
        });
      }
    });
  });

  return findings;
};

const scanReviewedFileContent = (reviewedStarterFiles: StarterFilePreview[]) => {
  const findings: SafetyFinding[] = [];

  for (const file of reviewedStarterFiles) {
    const content = file.content;

    if (content.trim().length === 0) {
      findings.push({
        id: contentFindingId('empty-reviewed-file', file.path, 'empty-content'),
        severity: 'warning',
        path: file.path,
        category: 'empty-content',
        message: 'Reviewed file content is empty. Confirm this is intentional before any future write.',
      });
    }

    if (content.length > 25000) {
      findings.push({
        id: contentFindingId('large-reviewed-file', file.path, 'large-content'),
        severity: 'warning',
        path: file.path,
        category: 'large-content',
        message: 'Reviewed file content is unusually large for a starter file. Review before any future write.',
      });
    }

    for (const check of reviewedContentBlockerPatterns) {
      if (check.pattern.test(content)) {
        findings.push({
          id: contentFindingId('reviewed-content-blocker', file.path, check.id),
          severity: 'blocker',
          path: file.path,
          category: check.category,
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
          category: check.category,
          message: check.message,
        });
      }
    }

    findings.push(...scanPackageManifest(file));
  }

  return findings;
};

const scanReviewedIssueBodies = (reviewedStarterIssues: RepoIssuePlan[]) => {
  const findings: SafetyFinding[] = [];

  reviewedStarterIssues.forEach((issue, index) => {
    const issueText = `${issue.title}\n${issue.body}\n${issue.labels.join(' ')}`;
    const path = issuePath(index, issue);

    if (issue.body.trim().length === 0) {
      findings.push({
        id: issueFindingId('issue-body-warning', index, 'empty-body'),
        severity: 'warning',
        path,
        category: 'empty-body',
        message: 'Reviewed issue body is empty. Confirm this is intentional before any future issue creation.',
      });
    }

    if (issueText.length > 5000) {
      findings.push({
        id: issueFindingId('issue-body-warning', index, 'large-body'),
        severity: 'warning',
        path,
        category: 'large-body',
        message: 'Reviewed issue text is unusually large for a starter issue. Review before any future issue creation.',
      });
    }

    for (const check of issueBodyBlockerPatterns) {
      if (check.pattern.test(issueText)) {
        findings.push({
          id: issueFindingId('issue-body-blocker', index, check.id),
          severity: 'blocker',
          path,
          category: check.category,
          message: check.message,
        });
      }
    }

    for (const check of issueBodyWarningPatterns) {
      if (check.pattern.test(issueText)) {
        findings.push({
          id: issueFindingId('issue-body-warning', index, check.id),
          severity: 'warning',
          path,
          category: check.category,
          message: check.message,
        });
      }
    }
  });

  return findings;
};

export const scanRepoPlan = (
  plan: RepoPlan,
  reviewedStarterFiles: StarterFilePreview[] = [],
  reviewedStarterIssues: RepoIssuePlan[] = plan.issues,
): SafetyReport => {
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
      category: 'visibility-review',
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
        category: 'secret-like-path',
        message: 'This path looks like it may contain secrets or credentials. Block commit until reviewed.',
      });
    }

    if (looksUnsafePath) {
      findings.push({
        id: `unsafe-path:${file.path}`,
        severity: 'blocker',
        path: file.path,
        category: 'unsafe-path',
        message: 'Generated file paths must stay repo-relative and must not reference key files or traversal paths.',
      });
    }

    if (file.riskLevel === 'high') {
      findings.push({
        id: `high-risk-file:${file.path}`,
        severity: 'warning',
        path: file.path,
        category: 'high-risk-file',
        message: 'High-risk generated file requires explicit human approval.',
      });
    }
  }

  if (reviewedStarterIssues.length > 10) {
    findings.push({
      id: 'large-generated-issue-set',
      severity: 'warning',
      category: 'large-issue-set',
      message: 'Large generated issue sets should be reviewed carefully before any future bulk issue creation.',
    });
  }

  const reviewedContentFindings = scanReviewedFileContent(reviewedStarterFiles);
  findings.push(...reviewedContentFindings);

  const reviewedIssueFindings = scanReviewedIssueBodies(reviewedStarterIssues);
  findings.push(...reviewedIssueFindings);

  if (findings.length === 0) {
    findings.push({
      id: 'baseline-pass',
      severity: 'info',
      category: 'baseline',
      message: 'No obvious safety blockers found in the starter repo plan, reviewed starter-file contents, package manifests, or reviewed starter-issue bodies.',
    });
  }

  const findingsWithRemediation = findings.map(withRemediation);
  const warningCount = countSeverity(findingsWithRemediation, 'warning');
  const blockerCount = countSeverity(findingsWithRemediation, 'blocker');
  const status = mostSevereStatus(findingsWithRemediation);
  const reviewedFileContentCharacters = reviewedStarterFiles.reduce((total, file) => total + file.content.length, 0);
  const reviewedIssueContentCharacters = reviewedStarterIssues.reduce((total, issue) => (
    total + issue.title.length + issue.body.length + issue.labels.join(' ').length
  ), 0);
  const contentBlockerCount = reviewedContentFindings.filter((finding) => finding.severity === 'blocker').length;
  const contentWarningCount = reviewedContentFindings.filter((finding) => finding.severity === 'warning').length;
  const contentCheckStatus: SafetyPolicyCheckStatus = contentBlockerCount > 0 ? 'blocker' : contentWarningCount > 0 ? 'warning' : 'pass';
  const issueRiskBlockerCount = reviewedIssueFindings.filter((finding) => finding.severity === 'blocker').length;
  const issueRiskWarningCount = reviewedIssueFindings.filter((finding) => finding.severity === 'warning').length;
  const issueRiskCheckStatus: SafetyPolicyCheckStatus = issueRiskBlockerCount > 0 ? 'blocker' : issueRiskWarningCount > 0 ? 'warning' : 'pass';
  const issueCountCheckStatus: SafetyPolicyCheckStatus = reviewedStarterIssues.length > 10 ? 'warning' : 'pass';
  const pathPolicyStatus: SafetyPolicyCheckStatus = findingsWithRemediation.some((finding) => (
    finding.id.startsWith('secret-like-path') || finding.id.startsWith('unsafe-path')
  )) ? 'blocker' : 'pass';
  const packageManifestCount = reviewedStarterFiles.filter((file) => isPackageManifestFile(file.path)).length;
  const packageFindings = reviewedContentFindings.filter((finding) => finding.category?.startsWith('package-'));
  const packageBlockerCount = packageFindings.filter((finding) => finding.severity === 'blocker').length;
  const packageWarningCount = packageFindings.filter((finding) => finding.severity === 'warning').length;
  const packageManifestCheckStatus: SafetyPolicyCheckStatus = packageBlockerCount > 0 ? 'blocker' : packageWarningCount > 0 ? 'warning' : 'pass';

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
      pathPolicyStatus,
      'Generated file paths were checked for secret-like names, traversal, Unix absolute paths, Windows absolute paths, UNC absolute paths, and key-file patterns.',
    ),
    buildCheck(
      'file-risk-policy',
      'File risk policy',
      findingsWithRemediation.some((finding) => finding.id.startsWith('high-risk-file')) ? 'warning' : 'pass',
      'Generated file risk levels were checked for high-risk artifacts requiring explicit review.',
    ),
    buildCheck(
      'reviewed-file-content-policy',
      'Reviewed file content policy',
      contentCheckStatus,
      `Reviewed ${reviewedStarterFiles.length} file draft(s) and ${reviewedFileContentCharacters} character(s) for credential-like, destructive, and package-manifest risk signals.`,
    ),
    buildCheck(
      'package-manifest-policy',
      'Package manifest policy',
      packageManifestCheckStatus,
      `Reviewed ${packageManifestCount} package manifest draft(s) for lifecycle scripts, package-manager command risk, dependency names, and dependency sources.`,
    ),
    buildCheck(
      'starter-issue-count-policy',
      'Starter issue count policy',
      issueCountCheckStatus,
      'Starter issue count was checked for future bulk-creation review needs.',
    ),
    buildCheck(
      'reviewed-issue-body-risk-policy',
      'Reviewed issue body risk policy',
      issueRiskCheckStatus,
      `Reviewed ${reviewedStarterIssues.length} issue draft(s) and ${reviewedIssueContentCharacters} character(s) for credential, destructive, disclosure, ops, auth, and remote-execution risk signals.`,
    ),
  ];

  return {
    status,
    policyVersion,
    summary: summarizePolicy(status, warningCount, blockerCount, reviewedStarterFiles.length, reviewedStarterIssues.length),
    warningCount,
    blockerCount,
    reviewedScope: {
      fileCount: plan.files.length,
      issueCount: plan.issues.length,
      reviewedFileContentCharacters,
      reviewedFileContentCount: reviewedStarterFiles.length,
      reviewedIssueContentCharacters,
      reviewedIssueContentCount: reviewedStarterIssues.length,
      stack: plan.stack,
      visibility: plan.visibility,
    },
    checks,
    findings: findingsWithRemediation,
    requiredGates,
    boundaryNotes,
  };
};
