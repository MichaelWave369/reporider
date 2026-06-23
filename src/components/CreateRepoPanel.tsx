import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RideCompleteSummaryCard } from './RideCompleteSummaryCard';
import { createMockGitHubRepository } from '../lib/github/mockGitHubClient';
import { mockGitHubWriteBoundary } from '../lib/github/types';
import type { GithubCreateRepoResult, RepoIssuePlan, RepoPlan, SafetyReport, StarterFilePreview } from '../types';

type CreateRepoPanelProps = {
  allStarterFilesApproved: boolean;
  allStarterIssuesApproved: boolean;
  approvedStarterFileCount: number;
  approvedStarterIssueCount: number;
  onRideComplete?: (result: GithubCreateRepoResult) => void;
  plan: RepoPlan;
  safetyReport: SafetyReport;
  starterFiles: StarterFilePreview[];
  starterIssues: RepoIssuePlan[];
};

type RidePhase = 'idle' | 'running' | 'completed' | 'blocked';
type StageStatus = 'planned' | 'running' | 'completed' | 'blocked';

type RideStage = {
  id: string;
  label: string;
  detail: string;
  status: StageStatus;
};

const statusForPhase = (phase: RidePhase, completed: boolean): StageStatus => {
  if (phase === 'blocked') return 'blocked';
  if (phase === 'completed' || completed) return 'completed';
  if (phase === 'running') return 'running';
  return 'planned';
};

const buildStages = (
  phase: RidePhase,
  result: GithubCreateRepoResult | null,
  safetyReport: SafetyReport,
  approvedStarterFileCount: number,
  totalStarterFileCount: number,
  allStarterFilesApproved: boolean,
  approvedStarterIssueCount: number,
  totalStarterIssueCount: number,
  allStarterIssuesApproved: boolean,
): RideStage[] => [
  {
    id: 'starter-file-approval',
    label: 'Starter file approvals',
    detail: `${approvedStarterFileCount}/${totalStarterFileCount} reviewed starter files approved for this exact draft set.`,
    status: allStarterFilesApproved ? 'completed' : phase === 'blocked' ? 'blocked' : 'planned',
  },
  {
    id: 'starter-issue-approval',
    label: 'Starter issue approvals',
    detail: `${approvedStarterIssueCount}/${totalStarterIssueCount} reviewed starter issues approved for this exact roadmap draft set.`,
    status: allStarterIssuesApproved ? 'completed' : phase === 'blocked' ? 'blocked' : 'planned',
  },
  {
    id: 'human-approval',
    label: 'Human approval',
    detail: 'The rider reviews the plan, starter-file drafts, and starter-issue drafts before any repo action can happen.',
    status: statusForPhase(phase, Boolean(result)),
  },
  {
    id: 'safety-gate',
    label: 'Safety gate',
    detail: `Current safety status: ${safetyReport.status}.`,
    status: safetyReport.status === 'blocked' ? 'blocked' : statusForPhase(phase, Boolean(result)),
  },
  {
    id: 'github-boundary',
    label: 'GitHub boundary',
    detail: mockGitHubWriteBoundary.canWriteToRemote ? 'Live mode is enabled.' : 'Mock mode only. No remote write is used yet.',
    status: result ? 'completed' : phase === 'running' ? 'running' : 'planned',
  },
  {
    id: 'repo-created',
    label: 'Repo creation',
    detail: result ? `Prepared ${result.repositoryUrl}` : 'Ready to simulate after file and issue approvals.',
    status: result ? 'completed' : phase === 'blocked' ? 'blocked' : 'planned',
  },
];

const buildStarterFilesKey = (starterFiles: StarterFilePreview[]) =>
  starterFiles.map((file) => `${file.path}:${file.content}`).join('\n---reporider-file---\n');

const buildStarterIssuesKey = (starterIssues: RepoIssuePlan[]) =>
  starterIssues.map((issue, index) => `${index}:${issue.title}:${issue.body}:${issue.labels.join(',')}`).join('\n---reporider-issue---\n');

export const CreateRepoPanel = ({
  allStarterFilesApproved,
  allStarterIssuesApproved,
  approvedStarterFileCount,
  approvedStarterIssueCount,
  onRideComplete,
  plan,
  safetyReport,
  starterFiles,
  starterIssues,
}: CreateRepoPanelProps) => {
  const [phase, setPhase] = useState<RidePhase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GithubCreateRepoResult | null>(null);
  const starterFilesKey = useMemo(() => buildStarterFilesKey(starterFiles), [starterFiles]);
  const starterIssuesKey = useMemo(() => buildStarterIssuesKey(starterIssues), [starterIssues]);

  useEffect(() => {
    setPhase('idle');
    setError(null);
    setResult(null);
  }, [
    plan.name,
    plan.description,
    plan.stack,
    plan.visibility,
    plan.files.length,
    plan.issues.length,
    safetyReport.status,
    starterFilesKey,
    starterIssuesKey,
    approvedStarterFileCount,
    approvedStarterIssueCount,
    allStarterFilesApproved,
    allStarterIssuesApproved,
  ]);

  const stages = useMemo(
    () => buildStages(
      phase,
      result,
      safetyReport,
      approvedStarterFileCount,
      starterFiles.length,
      allStarterFilesApproved,
      approvedStarterIssueCount,
      starterIssues.length,
      allStarterIssuesApproved,
    ),
    [allStarterFilesApproved, allStarterIssuesApproved, approvedStarterFileCount, approvedStarterIssueCount, phase, result, safetyReport, starterFiles.length, starterIssues.length],
  );
  const canRide = phase !== 'running' && safetyReport.status !== 'blocked' && allStarterFilesApproved && allStarterIssuesApproved;
  const remainingFileApprovals = starterFiles.length - approvedStarterFileCount;
  const remainingIssueApprovals = starterIssues.length - approvedStarterIssueCount;
  const approvalHelper = canRide
    ? 'All reviewed starter files and starter issues are approved for this ride.'
    : `Approve ${remainingFileApprovals} more files and ${remainingIssueApprovals} more issues to unlock repo creation.`;

  const rideMockCreateRepo = async () => {
    setError(null);
    setResult(null);
    setPhase('running');

    try {
      const mockResult = await createMockGitHubRepository({
        plan,
        safetyReport,
        approvedByUser: allStarterFilesApproved && allStarterIssuesApproved,
        starterFiles,
        starterIssues,
      });

      setResult(mockResult);
      onRideComplete?.(mockResult);
      setPhase('completed');
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Repo ride failed unexpectedly.');
      setPhase('blocked');
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>Ride Preview</Text>
          <Text style={styles.heading}>Approve & Create Repo</Text>
          <Text style={styles.helper}>Mock mode proves approvals, editable drafts, safety, boundary checks, and receipts before live writes land.</Text>
          <Text style={[styles.approvalHelper, canRide && styles.approvalHelperReady]}>{approvalHelper}</Text>
        </View>
        <View style={styles.modeBadge}><Text style={styles.modeText}>{mockGitHubWriteBoundary.mode}</Text></View>
      </View>

      <Pressable accessibilityRole="button" disabled={!canRide} onPress={rideMockCreateRepo} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, !canRide && styles.buttonDisabled]}>
        <Text style={styles.buttonText}>{phase === 'running' ? 'Riding...' : canRide ? 'Simulate Create Repo' : 'Approve Files & Issues First'}</Text>
      </Pressable>

      {stages.map((stage) => (
        <View key={stage.id} style={styles.stage}>
          <View style={styles.stageHeader}><Text style={styles.stageLabel}>{stage.label}</Text><Text style={styles.stageStatus}>{stage.status}</Text></View>
          <Text style={styles.stageDetail}>{stage.detail}</Text>
        </View>
      ))}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {result ? <RideCompleteSummaryCard result={result} /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#111827', borderColor: '#334155', borderRadius: 24, borderWidth: 1, gap: 14, padding: 18 },
  headerRow: { flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  headerCopy: { flex: 1, gap: 8 },
  kicker: { color: '#67e8f9', fontSize: 13, fontWeight: '900', letterSpacing: 1.1, textTransform: 'uppercase' },
  heading: { color: '#f8fafc', fontSize: 22, fontWeight: '900' },
  helper: { color: '#cbd5e1', fontSize: 14, lineHeight: 20 },
  approvalHelper: { color: '#fef3c7', fontSize: 13, fontWeight: '800', lineHeight: 18 },
  approvalHelperReady: { color: '#bbf7d0' },
  modeBadge: { alignSelf: 'flex-start', backgroundColor: '#164e63', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  modeText: { color: '#ecfeff', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  button: { alignItems: 'center', backgroundColor: '#06b6d4', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14 },
  buttonPressed: { opacity: 0.82 },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { color: '#082f49', fontSize: 15, fontWeight: '900' },
  stage: { backgroundColor: '#0f172a', borderRadius: 16, gap: 5, padding: 12 },
  stageHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  stageLabel: { color: '#f8fafc', flex: 1, fontSize: 14, fontWeight: '800' },
  stageStatus: { color: '#67e8f9', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  stageDetail: { color: '#cbd5e1', fontSize: 13, lineHeight: 18 },
  error: { color: '#fecaca', fontSize: 13, fontWeight: '800', lineHeight: 18 },
});