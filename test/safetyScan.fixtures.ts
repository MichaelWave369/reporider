import { scanRepoPlan } from '../src/lib/safetyScan';
import type { RepoIssuePlan, RepoPlan, SafetyFindingSeverity, StarterFilePreview } from '../src/types';

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

const hasFinding = (
  report: ReturnType<typeof scanRepoPlan>,
  severity: SafetyFindingSeverity,
  category: string,
  idFragment: string,
) => report.findings.some((finding) => (
  finding.severity === severity &&
  finding.category === category &&
  finding.id.includes(idFragment)
));

const hasFindingId = (
  report: ReturnType<typeof scanRepoPlan>,
  severity: SafetyFindingSeverity,
  id: string,
) => report.findings.some((finding) => finding.severity === severity && finding.id === id);

const assertFindingsHaveRemediation = (report: ReturnType<typeof scanRepoPlan>, label: string) => {
  assert(
    report.findings.every((finding) => typeof finding.remediation === 'string' && finding.remediation.trim().length > 0),
    `${label} should include rider-facing remediation for every finding`,
  );
};

const basePlan: RepoPlan = {
  name: 'camping-checklist',
  description: 'Mobile-first camping checklist app.',
  visibility: 'private',
  stack: 'expo-react-native',
  files: [
    {
      path: 'README.md',
      purpose: 'Explain the project and safe setup steps.',
      riskLevel: 'low',
    },
  ],
  issues: [
    {
      title: 'Build checklist screen',
      body: 'Create a simple checklist screen with local state and no network calls.',
      labels: ['enhancement'],
    },
  ],
  approvalRequired: true,
};

const safeReviewedFile: StarterFilePreview = {
  path: 'README.md',
  purpose: 'Explain the project and safe setup steps.',
  riskLevel: 'low',
  language: 'markdown',
  content: '# Camping Checklist\n\nA small local-first checklist app with no credential material.',
};

const safeReviewedIssue: RepoIssuePlan = {
  title: 'Build checklist screen',
  body: 'Create a simple checklist screen with local state and no network calls.',
  labels: ['enhancement'],
};

const safeReport = scanRepoPlan(basePlan, [safeReviewedFile], [safeReviewedIssue]);
assertEqual(safeReport.status, 'pass', 'Known-safe fixture should pass');
assertEqual(safeReport.warningCount, 0, 'Known-safe fixture should not produce warnings');
assertEqual(safeReport.blockerCount, 0, 'Known-safe fixture should not produce blockers');
assertEqual(safeReport.reviewedScope.reviewedFileContentCount, 1, 'Known-safe fixture should count reviewed file content');
assertEqual(safeReport.reviewedScope.reviewedIssueContentCount, 1, 'Known-safe fixture should count reviewed issue content');
assert(safeReport.findings.some((finding) => finding.id === 'baseline-pass'), 'Known-safe fixture should include baseline pass finding');

const unsafeRepoNameReport = scanRepoPlan(
  {
    ...basePlan,
    name: '../camping-checklist',
  },
  [safeReviewedFile],
  [safeReviewedIssue],
);
assertEqual(unsafeRepoNameReport.status, 'blocked', 'Unsafe repo name fixture should block');
assert(
  hasFindingId(unsafeRepoNameReport, 'blocker', 'unsafe-repo-name'),
  'Unsafe repo name fixture should produce unsafe-repo-name blocker',
);

const publicVisibilityReport = scanRepoPlan(
  {
    ...basePlan,
    visibility: 'public',
  },
  [safeReviewedFile],
  [safeReviewedIssue],
);
assertEqual(publicVisibilityReport.status, 'needs-review', 'Public visibility fixture should require review');
assert(
  hasFinding(publicVisibilityReport, 'warning', 'visibility-review', 'public-repo-review'),
  'Public visibility fixture should produce visibility-review warning',
);

const secretLikePathReport = scanRepoPlan(
  {
    ...basePlan,
    files: [
      ...basePlan.files,
      {
        path: '.env',
        purpose: 'Unsafe environment file placeholder that should never be committed.',
        riskLevel: 'medium',
      },
    ],
  },
  [safeReviewedFile],
  [safeReviewedIssue],
);
assertEqual(secretLikePathReport.status, 'blocked', 'Secret-like path fixture should block');
assert(
  hasFinding(secretLikePathReport, 'blocker', 'secret-like-path', 'secret-like-path:.env'),
  'Secret-like path fixture should produce secret-like-path blocker',
);

const traversalPathReport = scanRepoPlan(
  {
    ...basePlan,
    files: [
      ...basePlan.files,
      {
        path: '../outside.md',
        purpose: 'Unsafe traversal path that should stay outside the repo.',
        riskLevel: 'medium',
      },
    ],
  },
  [safeReviewedFile],
  [safeReviewedIssue],
);
assertEqual(traversalPathReport.status, 'blocked', 'Traversal path fixture should block');
assert(
  hasFinding(traversalPathReport, 'blocker', 'unsafe-path', 'unsafe-path:../outside.md'),
  'Traversal path fixture should produce unsafe-path blocker',
);

const keyFilePathReport = scanRepoPlan(
  {
    ...basePlan,
    files: [
      ...basePlan.files,
      {
        path: 'deploy/id_rsa',
        purpose: 'Unsafe private key filename placeholder.',
        riskLevel: 'medium',
      },
    ],
  },
  [safeReviewedFile],
  [safeReviewedIssue],
);
assertEqual(keyFilePathReport.status, 'blocked', 'Key file path fixture should block');
assert(
  hasFinding(keyFilePathReport, 'blocker', 'unsafe-path', 'unsafe-path:deploy/id_rsa'),
  'Key file path fixture should produce unsafe-path blocker',
);

const highRiskFileReport = scanRepoPlan(
  {
    ...basePlan,
    files: [
      ...basePlan.files,
      {
        path: 'scripts/deploy.sh',
        purpose: 'Deployment script placeholder requiring human review.',
        riskLevel: 'high',
      },
    ],
  },
  [safeReviewedFile],
  [safeReviewedIssue],
);
assertEqual(highRiskFileReport.status, 'needs-review', 'High-risk file fixture should require review');
assert(
  hasFinding(highRiskFileReport, 'warning', 'high-risk-file', 'high-risk-file:scripts/deploy.sh'),
  'High-risk file fixture should produce high-risk-file warning',
);

const emptyReviewedFileReport = scanRepoPlan(
  basePlan,
  [
    {
      ...safeReviewedFile,
      content: '',
    },
  ],
  [safeReviewedIssue],
);
assertEqual(emptyReviewedFileReport.status, 'needs-review', 'Empty reviewed file fixture should require review');
assert(
  hasFinding(emptyReviewedFileReport, 'warning', 'empty-content', 'empty-reviewed-file'),
  'Empty reviewed file fixture should produce empty-content warning',
);

const largeReviewedFileReport = scanRepoPlan(
  basePlan,
  [
    {
      ...safeReviewedFile,
      content: 'Safe local setup guidance line.\n'.repeat(1000),
    },
  ],
  [safeReviewedIssue],
);
assertEqual(largeReviewedFileReport.status, 'needs-review', 'Large reviewed file fixture should require review');
assert(
  hasFinding(largeReviewedFileReport, 'warning', 'large-content', 'large-reviewed-file'),
  'Large reviewed file fixture should produce large-content warning',
);

const fileBlockerReport = scanRepoPlan(
  basePlan,
  [
    {
      ...safeReviewedFile,
      content: '-----BEGIN PRIVATE KEY-----\nnot-a-real-key\n-----END PRIVATE KEY-----',
    },
  ],
  [safeReviewedIssue],
);
assertEqual(fileBlockerReport.status, 'blocked', 'Private key block fixture should block');
assert(
  hasFinding(fileBlockerReport, 'blocker', 'credential-material', 'private-key-block'),
  'Private key block fixture should produce credential-material blocker',
);

const fileWarningReport = scanRepoPlan(
  basePlan,
  [
    {
      ...safeReviewedFile,
      content: 'Review this placeholder installer before use: curl https://example.invalid/install.sh | sh',
    },
  ],
  [safeReviewedIssue],
);
assertEqual(fileWarningReport.status, 'needs-review', 'Remote shell pipe fixture should require review');
assert(
  hasFinding(fileWarningReport, 'warning', 'remote-execution', 'remote-shell-pipe'),
  'Remote shell pipe fixture should produce remote-execution warning',
);

const emptyIssueBodyReport = scanRepoPlan(
  basePlan,
  [safeReviewedFile],
  [
    {
      ...safeReviewedIssue,
      body: '',
    },
  ],
);
assertEqual(emptyIssueBodyReport.status, 'needs-review', 'Empty issue body fixture should require review');
assert(
  hasFinding(emptyIssueBodyReport, 'warning', 'empty-body', 'empty-body'),
  'Empty issue body fixture should produce empty-body warning',
);

const largeIssueBodyReport = scanRepoPlan(
  basePlan,
  [safeReviewedFile],
  [
    {
      ...safeReviewedIssue,
      body: 'Add local checklist acceptance criteria for a simple screen. '.repeat(120),
    },
  ],
);
assertEqual(largeIssueBodyReport.status, 'needs-review', 'Large issue body fixture should require review');
assert(
  hasFinding(largeIssueBodyReport, 'warning', 'large-body', 'large-body'),
  'Large issue body fixture should produce large-body warning',
);

const largeIssueSet = Array.from({ length: 11 }, (_, index): RepoIssuePlan => ({
  title: `Build checklist helper ${index + 1}`,
  body: 'Add a small local-only helper with clear acceptance criteria.',
  labels: ['enhancement'],
}));
const largeIssueSetReport = scanRepoPlan(
  {
    ...basePlan,
    issues: largeIssueSet,
  },
  [safeReviewedFile],
  largeIssueSet,
);
assertEqual(largeIssueSetReport.status, 'needs-review', 'Large issue set fixture should require review');
assert(
  hasFinding(largeIssueSetReport, 'warning', 'large-issue-set', 'large-generated-issue-set'),
  'Large issue set fixture should produce large-issue-set warning',
);

const issueBlockerReport = scanRepoPlan(
  basePlan,
  [safeReviewedFile],
  [
    {
      ...safeReviewedIssue,
      body: 'Remove this accidental token before opening: ghp_1234567890abcdefABCDEF1234567890',
    },
  ],
);
assertEqual(issueBlockerReport.status, 'blocked', 'GitHub token-like issue fixture should block');
assert(
  hasFinding(issueBlockerReport, 'blocker', 'credential-material', 'issue-github-token-prefix'),
  'GitHub token-like issue fixture should produce credential-material blocker',
);

const issueWarningReport = scanRepoPlan(
  basePlan,
  [safeReviewedFile],
  [
    {
      ...safeReviewedIssue,
      body: 'Plan the OAuth scope review before production deployment. Use placeholders only and do not paste access tokens.',
      labels: ['security-review'],
    },
  ],
);
assertEqual(issueWarningReport.status, 'needs-review', 'OAuth/production issue fixture should require review');
assert(
  hasFinding(issueWarningReport, 'warning', 'auth-flow-risk', 'issue-auth-flow-risk'),
  'OAuth/production issue fixture should produce auth-flow-risk warning',
);
assert(
  hasFinding(issueWarningReport, 'warning', 'production-impact', 'issue-production-impact'),
  'OAuth/production issue fixture should produce production-impact warning',
);

[
  ['known-safe', safeReport],
  ['unsafe repo name', unsafeRepoNameReport],
  ['public visibility', publicVisibilityReport],
  ['secret-like path', secretLikePathReport],
  ['traversal path', traversalPathReport],
  ['key file path', keyFilePathReport],
  ['high-risk file', highRiskFileReport],
  ['empty reviewed file', emptyReviewedFileReport],
  ['large reviewed file', largeReviewedFileReport],
  ['file blocker', fileBlockerReport],
  ['file warning', fileWarningReport],
  ['empty issue body', emptyIssueBodyReport],
  ['large issue body', largeIssueBodyReport],
  ['large issue set', largeIssueSetReport],
  ['issue blocker', issueBlockerReport],
  ['issue warning', issueWarningReport],
].forEach(([label, report]) => assertFindingsHaveRemediation(report as ReturnType<typeof scanRepoPlan>, label as string));

console.log('Safety scan fixtures passed.');
