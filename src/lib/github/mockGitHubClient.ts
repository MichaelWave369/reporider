import { buildStarterFilePreviews, summarizeStarterFileDrafts } from '../starterFilePreview';
import { buildStarterIssuePreviews, summarizeStarterIssueDrafts } from '../starterIssuePreview';
import type { GithubCreateRepoRequest, GithubCreateRepoResult, Receipt, SafetyReport } from '../../types';

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });

const isoNow = () => new Date().toISOString();

const receipt = (
  id: string,
  action: string,
  detail: string,
  status: Receipt['status'],
  safetyReport: SafetyReport,
): Receipt => ({
  id,
  action,
  detail,
  safetyPolicyVersion: safetyReport.policyVersion,
  safetyStatus: safetyReport.status,
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
  starterIssues,
}: GithubCreateRepoRequest): Promise<GithubCreateRepoResult> => {
  if (!approvedByUser) {
    throw new Error('Every starter file and starter issue must be approved before RepoRider can create a repository.');
  }

  if (safetyReport.status === 'blocked') {
    throw new Error(`Safety policy ${safetyReport.policyVersion} blocked this ride. Review findings before creating the repo.`);
  }

  await wait(350);

  const repositoryUrl = `https://github.com/reporider-demo/${plan.name}`;
  const generatedPreviews = buildStarterFilePreviews(plan);
  const starterPreviews = starterFiles ?? generatedPreviews;
  const fileSummary = summarizeStarterFileDrafts(generatedPreviews, starterPreviews);
  const createdFiles = starterPreviews.map((file) => file.path);
  const generatedIssues = buildStarterIssuePreviews(plan);
  const reviewedIssues = starterIssues ?? generatedIssues;
  const issueSummary = summarizeStarterIssueDrafts(generatedIssues, reviewedIssues);
  const openedIssues = reviewedIssues.map((issue) => issue.title);
  const previewCharacterCount = starterPreviews.reduce((total, file) => total + file.content.length, 0);
  const issueCharacterCount = reviewedIssues.reduce(
    (total, issue) => total + issue.title.length + issue.body.length + issue.labels.join(',').length,
    0,
  );
  const receipts = [
    receipt('mock-auth-boundary', 'GitHub auth boundary checked', 'No token was requested. Mock mode kept the ride local.', 'completed', safetyReport),
    receipt('mock-safety-policy-coupled', 'Safety policy receipt coupled', `Mock ride used ${safetyReport.policyVersion} with status ${safetyReport.status}, ${safetyReport.warningCount} warning(s), and ${safetyReport.blockerCount} blocker(s).`, safetyReport.status === 'blocked' ? 'blocked' : 'completed', safetyReport),
    receipt('mock-file-approvals-verified', 'Starter file approvals verified', `${starterPreviews.length} reviewed file drafts were approved before mock creation.`, 'approved', safetyReport),
    receipt('mock-issue-approvals-verified', 'Starter issue approvals verified', `${reviewedIssues.length} reviewed issue drafts were approved before mock creation.`, 'approved', safetyReport),
    receipt('mock-repo-created', 'Repository creation simulated', `Prepared ${repositoryUrl} as a ${plan.visibility} ${plan.stack} repo.`, 'completed', safetyReport),
    receipt('mock-file-drafts-reviewed', 'Starter file drafts reviewed', `${starterPreviews.length} files reviewed; ${fileSummary.editedCount} file drafts changed by the rider before approval.`, 'completed', safetyReport),
    receipt('mock-issue-drafts-reviewed', 'Starter issue drafts reviewed', `${reviewedIssues.length} issues reviewed; ${issueSummary.editedCount} issue drafts changed by the rider before approval.`, 'completed', safetyReport),
    receipt('mock-file-previews-prepared', 'Starter file previews prepared', `${starterPreviews.length} files and ${previewCharacterCount} approved draft characters were prepared from the reviewed plan.`, 'completed', safetyReport),
    receipt('mock-files-created', 'Starter files simulated', `${createdFiles.length} reviewed files queued for first commit.`, 'completed', safetyReport),
    receipt('mock-issues-created', 'Starter issues simulated', `${openedIssues.length} reviewed roadmap issues queued after repo creation.`, 'completed', safetyReport),
  ];

  return {
    mode: 'mock',
    repositoryUrl,
    defaultBranch: 'main',
    createdFiles,
    openedIssues,
    receipts,
    summary: {
      approvedFileCount: starterPreviews.length,
      approvedIssueCount: reviewedIssues.length,
      editedFileCount: fileSummary.editedCount,
      editedIssueCount: issueSummary.editedCount,
      receiptCount: receipts.length,
      safetyPolicyVersion: safetyReport.policyVersion,
      safetyStatus: safetyReport.status,
      safetyWarningCount: safetyReport.warningCount,
      safetyBlockerCount: safetyReport.blockerCount,
      totalFileDraftCharacters: previewCharacterCount,
      totalIssueDraftCharacters: issueCharacterCount,
      writeArtifactCount: createdFiles.length + openedIssues.length,
    },
  };
};