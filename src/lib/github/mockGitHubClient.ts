import { buildStarterFilePreviews } from '../starterFilePreview';
import type { GithubCreateRepoRequest, GithubCreateRepoResult, Receipt } from '../../types';

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });

const isoNow = () => new Date().toISOString();

const receipt = (id: string, action: string, detail: string, status: Receipt['status']): Receipt => ({
  id,
  action,
  detail,
  status,
  timestamp: isoNow(),
});

/**
 * Mock writer used by the mobile UI while OAuth, secure storage, and real GitHub
 * write permissions are still being designed. This lets RepoRider prove the full
 * approval-first flow without sending any network request or touching GitHub.
 */
export const createMockGitHubRepository = async ({
  plan,
  safetyReport,
  approvedByUser,
  starterFiles,
}: GithubCreateRepoRequest): Promise<GithubCreateRepoResult> => {
  if (!approvedByUser) {
    throw new Error('Human approval is required before RepoRider can create a repository.');
  }

  if (safetyReport.status === 'blocked') {
    throw new Error('Safety scan blocked this ride. Review findings before creating the repo.');
  }

  await wait(350);

  const repositoryUrl = `https://github.com/reporider-demo/${plan.name}`;
  const generatedPreviews = buildStarterFilePreviews(plan);
  const starterPreviews = starterFiles ?? generatedPreviews;
  const generatedContentByPath = new Map(generatedPreviews.map((file) => [file.path, file.content]));
  const editedFiles = starterPreviews.filter((file) => generatedContentByPath.get(file.path) !== file.content);
  const createdFiles = starterPreviews.map((file) => file.path);
  const openedIssues = plan.issues.map((issue) => issue.title);
  const previewCharacterCount = starterPreviews.reduce((total, file) => total + file.content.length, 0);

  return {
    mode: 'mock',
    repositoryUrl,
    defaultBranch: 'main',
    createdFiles,
    openedIssues,
    receipts: [
      receipt('mock-auth-boundary', 'GitHub auth boundary checked', 'No token was requested. Mock mode kept the ride local.', 'completed'),
      receipt('mock-repo-created', 'Repository creation simulated', `Prepared ${repositoryUrl} as a ${plan.visibility} ${plan.stack} repo.`, 'completed'),
      receipt('mock-file-drafts-reviewed', 'Starter file drafts reviewed', `${starterPreviews.length} files reviewed; ${editedFiles.length} file drafts changed by the rider before approval.`, 'completed'),
      receipt('mock-file-previews-prepared', 'Starter file previews prepared', `${starterPreviews.length} files and ${previewCharacterCount} approved draft characters were prepared from the reviewed plan.`, 'completed'),
      receipt('mock-files-created', 'Starter files simulated', `${createdFiles.length} reviewed files queued for first commit.`, 'completed'),
      receipt('mock-issues-created', 'Starter issues simulated', `${openedIssues.length} roadmap issues queued after repo creation.`, 'completed'),
    ],
  };
};
