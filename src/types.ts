export type RepoVisibility = 'private' | 'public';

export type StarterStack =
  | 'expo-react-native'
  | 'react-vite'
  | 'nextjs'
  | 'node-cli'
  | 'docs-only';

export type AuthCapabilityStatus = 'mock_only' | 'auth_unavailable' | 'auth_ready';

export type AuthCapability = {
  status: AuthCapabilityStatus;
  label: string;
  summary: string;
  canRequestOAuth: boolean;
  canStoreToken: boolean;
  canAttemptLiveWrites: boolean;
  requiredGates: string[];
};

export type TokenStorageStatus = 'unsupported' | 'empty' | 'mock_stored';

export type TokenStorageScope = 'none' | 'memory_mock' | 'secure_device_store';

export type TokenStorageSnapshot = {
  status: TokenStorageStatus;
  label: string;
  summary: string;
  scope: TokenStorageScope;
  hasStoredToken: boolean;
  canPersistToken: boolean;
  canReadToken: boolean;
  canClearToken: boolean;
  requiredGates: string[];
  boundaryNotes: string[];
};

export type TokenStorageAdapter = {
  id: string;
  label: string;
  getSnapshot: () => TokenStorageSnapshot;
  storeTokenUnavailable: () => TokenStorageSnapshot;
  readTokenUnavailable: () => null;
  clearTokenUnavailable: () => TokenStorageSnapshot;
};

export type LiveModeStateStatus =
  | 'mock_only'
  | 'live_available'
  | 'live_armed'
  | 'writing'
  | 'write_complete'
  | 'write_failed';

export type LiveModeState = {
  status: LiveModeStateStatus;
  label: string;
  summary: string;
  canArmLiveMode: boolean;
  canStartWrite: boolean;
  canRetryWrite: boolean;
  isTerminal: boolean;
  requiredGates: string[];
  boundaryNotes: string[];
};

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

export type SafetyFindingSeverity = 'info' | 'warning' | 'blocker';

export type SafetyFinding = {
  id: string;
  severity: SafetyFindingSeverity;
  message: string;
  path?: string;
};

export type SafetyPolicyCheckStatus = 'pass' | 'warning' | 'blocker';

export type SafetyPolicyCheck = {
  id: string;
  label: string;
  status: SafetyPolicyCheckStatus;
  summary: string;
};

export type SafetyReviewedScope = {
  fileCount: number;
  issueCount: number;
  stack: StarterStack;
  visibility: RepoVisibility;
};

export type SafetyReport = {
  status: 'pass' | 'needs-review' | 'blocked';
  policyVersion: string;
  summary: string;
  warningCount: number;
  blockerCount: number;
  reviewedScope: SafetyReviewedScope;
  checks: SafetyPolicyCheck[];
  findings: SafetyFinding[];
  requiredGates: string[];
  boundaryNotes: string[];
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
