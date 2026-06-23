export type RepoVisibility = 'private' | 'public';

export type StarterStack =
  | 'expo-react-native'
  | 'react-vite'
  | 'nextjs'
  | 'node-cli'
  | 'docs-only';

export type RepoFilePlan = {
  path: string;
  purpose: string;
  riskLevel: 'low' | 'medium' | 'high';
};

export type RepoIssuePlan = {
  title: string;
  body: string;
  labels: string[];
};

export type RepoPlan = {
  name: string;
  description: string;
  visibility: RepoVisibility;
  stack: StarterStack;
  files: RepoFilePlan[];
  issues: RepoIssuePlan[];
  approvalRequired: boolean;
};

export type SafetyFinding = {
  id: string;
  severity: 'info' | 'warning' | 'blocker';
  message: string;
  path?: string;
};

export type SafetyReport = {
  status: 'pass' | 'needs-review' | 'blocked';
  findings: SafetyFinding[];
};

export type Receipt = {
  id: string;
  action: string;
  status: 'planned' | 'approved' | 'completed' | 'blocked';
  detail: string;
  timestamp: string;
};
