import { scanRepoPlan } from '../src/lib/safetyScan';
import type { RepoIssuePlan, RepoPlan, StarterFilePreview } from '../src/types';

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
  title: 'Build checklist screen',
  body: 'Create a simple checklist screen with local state and no network calls.',
  labels: ['enhancement'],
};

const safeReviewedFile: StarterFilePreview = {
  path: 'README.md',
  purpose: 'Explain the project and safe setup steps.',
  riskLevel: 'low',
  language: 'markdown',
  content: '# Camping Checklist\n\nA small local-first checklist app with no credential material.',
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
  issues: [baseIssue],
  approvalRequired: true,
};

const unixAbsolutePathReport = scanRepoPlan(
  {
    ...basePlan,
    files: [
      ...basePlan.files,
      {
        path: '/tmp/reporider/README.md',
        purpose: 'Unsafe absolute path that must never be written outside the repo root.',
        riskLevel: 'medium',
      },
    ],
  },
  [safeReviewedFile],
  [baseIssue],
);

assertEqual(unixAbsolutePathReport.status, 'blocked', 'Unix absolute path fixture should block');
assert(
  unixAbsolutePathReport.findings.some((finding) => (
    finding.severity === 'blocker' &&
    finding.category === 'unsafe-path' &&
    finding.id === 'unsafe-path:/tmp/reporider/README.md'
  )),
  'Unix absolute path fixture should produce unsafe-path blocker',
);

assert(
  unixAbsolutePathReport.checks.some((check) => (
    check.id === 'file-path-policy' && check.status === 'blocker'
  )),
  'Unix absolute path fixture should mark file-path-policy as blocker',
);

console.log('Safety absolute path fixtures passed.');
