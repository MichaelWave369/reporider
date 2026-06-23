import type { Receipt, RepoPlan, SafetyReport } from '../types';

const isoNow = () => new Date().toISOString();

export const createSeedReceipts = (plan: RepoPlan, safetyReport: SafetyReport): Receipt[] => {
  const timestamp = isoNow();

  return [
    {
      id: 'capture-idea',
      action: 'Idea captured',
      status: 'completed',
      detail: `Captured starter idea for ${plan.name}.`,
      timestamp,
    },
    {
      id: 'plan-repo',
      action: 'Repo plan generated',
      status: 'planned',
      detail: `${plan.files.length} files and ${plan.issues.length} starter issues prepared for review.`,
      timestamp,
    },
    {
      id: 'safety-scan',
      action: 'Safety scan completed',
      status: safetyReport.status === 'blocked' ? 'blocked' : 'completed',
      detail: `Safety status: ${safetyReport.status}.`,
      timestamp,
    },
    {
      id: 'human-approval',
      action: 'Human approval required',
      status: 'planned',
      detail: 'RepoRider should not write to GitHub until the user reviews and approves the plan.',
      timestamp,
    },
  ];
};
