import { scanRepoPlan } from '../src/lib/safetyScan';
import type { RepoIssuePlan, RepoPlan, SafetyReport, StarterFilePreview } from '../src/types';

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

const scanPlanWithPath = (path: string) => scanRepoPlan(
  {
    ...basePlan,
    files: [
      ...basePlan.files,
      {
        path,
        purpose: 'Unsafe absolute path that must never be written outside the repo root.',
        riskLevel: 'medium',
      },
    ],
  },
  [safeReviewedFile],
  [baseIssue],
);

const assertUnsafeAbsolutePath = (report: SafetyReport, path: string, label: string) => {
  assertEqual(report.status, 'blocked', `${label} fixture should block`);
  assert(
    report.findings.some((finding) => (
      finding.severity === 'blocker' &&
      finding.category === 'unsafe-path' &&
      finding.id === `unsafe-path:${path}`
    )),
    `${label} fixture should produce unsafe-path blocker`,
  );
  assert(
    report.checks.some((check) => (
      check.id === 'file-path-policy' && check.status === 'blocker'
    )),
    `${label} fixture should mark file-path-policy as blocker`,
  );
};

const unixAbsolutePath = '/tmp/reporider/README.md';
assertUnsafeAbsolutePath(scanPlanWithPath(unixAbsolutePath), unixAbsolutePath, 'Unix absolute path');

const windowsDriveBackslashPath = 'C:\\Users\\rider\\RepoRider\\README.md';
assertUnsafeAbsolutePath(scanPlanWithPath(windowsDriveBackslashPath), windowsDriveBackslashPath, 'Windows drive-letter backslash path');

const windowsDriveForwardSlashPath = 'C:/Users/rider/RepoRider/README.md';
assertUnsafeAbsolutePath(scanPlanWithPath(windowsDriveForwardSlashPath), windowsDriveForwardSlashPath, 'Windows drive-letter forward-slash path');

const windowsUncPath = '\\\\server\\share\\RepoRider\\README.md';
assertUnsafeAbsolutePath(scanPlanWithPath(windowsUncPath), windowsUncPath, 'Windows UNC path');

console.log('Safety absolute path fixtures passed.');