import type { RepoPlan, SafetyFinding, SafetyReport } from '../types';

const secretLikePatterns = [/\.env$/i, /secret/i, /token/i, /api[_-]?key/i, /credential/i];

export const scanRepoPlan = (plan: RepoPlan): SafetyReport => {
  const findings: SafetyFinding[] = [];

  if (plan.visibility === 'public') {
    findings.push({
      id: 'public-repo-review',
      severity: 'warning',
      message: 'Public repositories should receive extra review before generated files are committed.',
    });
  }

  for (const file of plan.files) {
    const looksSecretLike = secretLikePatterns.some((pattern) => pattern.test(file.path));

    if (looksSecretLike) {
      findings.push({
        id: `secret-like-path:${file.path}`,
        severity: 'blocker',
        path: file.path,
        message: 'This path looks like it may contain secrets or credentials. Block commit until reviewed.',
      });
    }

    if (file.riskLevel === 'high') {
      findings.push({
        id: `high-risk-file:${file.path}`,
        severity: 'warning',
        path: file.path,
        message: 'High-risk generated file requires explicit human approval.',
      });
    }
  }

  if (findings.some((finding) => finding.severity === 'blocker')) {
    return { status: 'blocked', findings };
  }

  if (findings.some((finding) => finding.severity === 'warning')) {
    return { status: 'needs-review', findings };
  }

  return {
    status: 'pass',
    findings: [
      {
        id: 'baseline-pass',
        severity: 'info',
        message: 'No obvious safety blockers found in the starter repo plan.',
      },
    ],
  };
};
