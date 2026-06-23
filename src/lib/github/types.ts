export type GitHubWriteMode = 'mock' | 'live';

export type GitHubWriteBoundary = {
  mode: GitHubWriteMode;
  requiresHumanApproval: boolean;
  requiresSecureTokenStorage: boolean;
  canWriteToRemote: boolean;
};

export const mockGitHubWriteBoundary: GitHubWriteBoundary = {
  mode: 'mock',
  requiresHumanApproval: true,
  requiresSecureTokenStorage: true,
  canWriteToRemote: false,
};
