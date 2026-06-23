import type {
  LiveModeState,
  Receipt,
  RepoIssuePlan,
  RepoPlan,
  SafetyReport,
  StarterFilePreview,
} from '../types';
import { isLiveModeWriteReady } from './liveModeState';

export type DryRunWriterStatus = 'dry_run_ready' | 'blocked';

export type DryRunWriterRequest = {
  plan: RepoPlan;
  safetyReport: SafetyReport;
  approvedByUser: boolean;
  approvedStarterFiles: StarterFilePreview[];
  approvedStarterIssues: RepoIssuePlan[];
  receiptPreview: Receipt[];
  liveModeState: LiveModeState;
};

export type DryRunWriterSummary = {
  wouldCreateRepository: boolean;
  wouldPushFileCount: number;
  wouldOpenIssueCount: number;
  receiptPreviewCount: number;
  warningCount: number;
  blockerCount: number;
  blockingReasons: string[];
};

export type DryRunWriterResult = {
  mode: 'dry_run';
  status: DryRunWriterStatus;
  label: string;
  summary: string;
  canPromoteToLiveWrite: boolean;
  requestSummary: DryRunWriterSummary;
  boundaryNotes: string[];
};

export type DryRunWriterAdapter = {
  id: string;
  label: string;
  dryRun: (request: DryRunWriterRequest) => DryRunWriterResult;
};

const countWarnings = (report: SafetyReport) => (
  report.findings.filter((finding) => finding.severity === 'warning').length
);

const countBlockers = (report: SafetyReport) => (
  report.findings.filter((finding) => finding.severity === 'blocker').length
);

const buildBlockingReasons = (request: DryRunWriterRequest) => {
  const reasons: string[] = [];

  if (!request.approvedByUser) {
    reasons.push('The rider has not approved the current write package.');
  }

  if (request.approvedStarterFiles.length !== request.plan.files.length) {
    reasons.push('Every current starter-file draft must have a fresh approval.');
  }

  if (request.approvedStarterIssues.length !== request.plan.issues.length) {
    reasons.push('Every current starter issue draft must have a fresh approval.');
  }

  if (request.safetyReport.status !== 'pass') {
    reasons.push(`Safety scan is ${request.safetyReport.status}, not pass.`);
  }

  if (!isLiveModeWriteReady(request.liveModeState)) {
    reasons.push('Live-mode state is not armed for real writes.');
  }

  return reasons;
};

export const dryRunWriterAdapter: DryRunWriterAdapter = {
  id: 'receipt-ready-dry-run-writer',
  label: 'Receipt-ready dry-run writer',
  dryRun: (request) => {
    const blockingReasons = buildBlockingReasons(request);
    const canPromoteToLiveWrite = blockingReasons.length === 0;
    const status: DryRunWriterStatus = canPromoteToLiveWrite ? 'dry_run_ready' : 'blocked';
    const wouldCreateRepository = request.approvedByUser && request.safetyReport.status === 'pass';

    return {
      mode: 'dry_run',
      status,
      label: canPromoteToLiveWrite ? 'Dry-run ready' : 'Dry-run blocked',
      summary: canPromoteToLiveWrite
        ? 'The reviewed artifacts are dry-run ready, but this adapter still performs no GitHub writes.'
        : 'The dry-run writer can summarize reviewed artifacts, but live write promotion is blocked.',
      canPromoteToLiveWrite,
      requestSummary: {
        wouldCreateRepository,
        wouldPushFileCount: request.approvedStarterFiles.length,
        wouldOpenIssueCount: request.approvedStarterIssues.length,
        receiptPreviewCount: request.receiptPreview.length,
        warningCount: countWarnings(request.safetyReport),
        blockerCount: countBlockers(request.safetyReport),
        blockingReasons,
      },
      boundaryNotes: [
        'This adapter does not create repositories, push files, open issues, request OAuth, or read credentials.',
        'Dry-run output is receipt-ready planning data, not permission to perform a later live write.',
        'Saved drafts, imported Markdown, restored history, and exported receipts never bypass fresh approvals.',
      ],
    };
  },
};
