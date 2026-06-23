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

export type StarterFilePreview = RepoFilePlan & {
  language: 'markdown' | 'typescript' | 'json' | 'text';
  content: string;
};

export type StarterFileDraftMap = Record<string, string>;

export type StarterFileApprovalMap = Record<string, string>;

export type StarterFileDraftSummary = {
  editedCount: number;
  editedPaths: string[];
  totalFiles: number;
  totalEditedCharacters: number;
};

export type RepoIssuePlan = {
  title: string;
  body: string;
  labels: string[];
};

export type StarterIssueDraftMap = Record<string, RepoIssuePlan>;

export type StarterIssueApprovalMap = Record<string, string>;

export type StarterIssueDraftSummary = {
  editedCount: number;
  editedKeys: string[];
  totalIssues: number;
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

export type RepoPlanOverrides = {
  name?: string;
  visibility?: RepoVisibility;
  stack?: StarterStack;
  issueCount?: number;
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

export type GithubCreateRepoRequest = {
  plan: RepoPlan;
  safetyReport: SafetyReport;
  approvedByUser: boolean;
  starterFiles?: StarterFilePreview[];
  starterIssues?: RepoIssuePlan[];
};

export type GithubCreateRepoSummary = {
  approvedFileCount: number;
  approvedIssueCount: number;
  editedFileCount: number;
  editedIssueCount: number;
  receiptCount: number;
  totalFileDraftCharacters: number;
  totalIssueDraftCharacters: number;
  writeArtifactCount: number;
};

export type GithubCreateRepoResult = {
  mode: 'mock' | 'live';
  repositoryUrl: string;
  defaultBranch: string;
  createdFiles: string[];
  openedIssues: string[];
  receipts: Receipt[];
  summary: GithubCreateRepoSummary;
};

export type RideDraftSnapshot = {
  idea: string;
  planOverrides: RepoPlanOverrides;
};

export type RideHistoryEntry = {
  id: string;
  completedAt: string;
  draftSnapshot?: RideDraftSnapshot;
  result: GithubCreateRepoResult;
};

export type SavedDraftSlot = {
  id: string;
  label?: string;
  pinned?: boolean;
  archived?: boolean;
  savedAt: string;
  draftSnapshot: RideDraftSnapshot;
};