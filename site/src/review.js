// Pure showcase state helpers. Approval fingerprints come from RepoRider's existing engine.
export const canCompleteMock = (fileCount,issueCount,approvedFiles,approvedIssues,blockers,reviewed) =>
  reviewed === true && fileCount > 0 && approvedFiles === fileCount && approvedIssues === issueCount && blockers === 0;
export const approvalCount = (artifacts, fingerprints, keyFor, fingerprintFor) =>
  artifacts.filter((artifact,index) => fingerprints[keyFor(artifact,index)] === fingerprintFor(artifact,index)).length;
export const resetReviewState = () => ({planKey:'',values:{}});
export const isMockOnlyResult = result => result != null && result.mode === 'mock' && result.repositoryUrl?.startsWith('https://github.com/reporider-demo/');
