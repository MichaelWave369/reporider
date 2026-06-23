import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { createMockGitHubRepository } from '../lib/github/mockGitHubClient';
import { mockGitHubWriteBoundary } from '../lib/github/types';
import type { GithubCreateRepoResult, Receipt, RepoPlan, SafetyReport } from '../types';

type CreateRepoPanelProps = {
  plan: RepoPlan;
  safetyReport: SafetyReport;
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
  if (phase === 'blocked') {
    return 'blocked';
  }

  if (phase === 'completed' || completed) {
    return 'completed';
  }

  if (phase === 'running') {
    return 'running';
  }

  return 'planned';
};

const buildStages = (
  phase: RidePhase,
  result: GithubCreateRepoResult | null,
  safetyReport: SafetyReport,
): RideStage[] => [
  {
    id: 'human-approval',
    label: 'Human approval',
    detail: 'The rider reviews the plan before any repo action can happen.',
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
    label: 'GitHub write boundary',
    detail: mockGitHubWriteBoundary.canWriteToRemote
      ? 'Live write mode is enabled.'
      : 'Mock mode only. No GitHub token or remote write is used yet.',
    status: result ? 'completed' : phase === 'running' ? 'running' : 'planned',
  },
  {
    id: 'repo-created',
    label: 'Repo creation',
    detail: result ? `Prepared ${result.repositoryUrl}` : 'Create repo call is ready to simulate.',
    status: result ? 'completed' : phase === 'blocked' ? 'blocked' : 'planned',
  },
];

const formatReceiptLine = (receipt: Receipt) => `${receipt.status.toUpperCase()} · ${receipt.action}`;

export const CreateRepoPanel = ({ plan, safetyReport }: CreateRepoPanelProps) => {
  const [phase, setPhase] = useState<RidePhase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GithubCreateRepoResult | null>(null);

  const stages = useMemo(() => buildStages(phase, result, safetyReport), [phase, result, safetyReport]);
  const canRide = phase !== 'running' && safetyReport.status !== 'blocked';

  const rideMockCreateRepo = async () => {
    setError(null);
    setResult(null);
    setPhase('running');

    try {
      const mockResult = await createMockGitHubRepository({
        plan,
        safetyReport,
        approvedByUser: true,
      });

      setResult(mockResult);
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
          <Text style={styles.helper}>
            This is the first complete repo creation lane. It proves approval, safety, GitHub boundary, and receipts in mock mode before live OAuth lands.
          </Text>
        </View>
        <View style={styles.modeBadge}>
          <Text style={styles.modeText}>{mockGitHubWriteBoundary.mode}</Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={!canRide}
        onPress={rideMockCreateRepo}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
          !canRide && styles.buttonDisabled,
        ]}
      >
        <Text style={styles.buttonText}>{phase === 'running' ? 'Riding...' : 'Simulate Create Repo'}</Text>
      </Pressable>

      {stages.map((stage) => (
        <View key={stage.id} style={styles.stage}>
          <View style={styles.stageHeader}>
            <Text style={styles.stageLabel}>{stage.label}</Text>
            <Text style={styles.stageStatus}>{stage.status}</Text>
          </View>
          <Text style={styles.stageDetail}>{stage.detail}</Text>
        </View>
      ))}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {result ? (
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>Mock repo ready</Text>
          <Text style={styles.resultText}>{result.repositoryUrl}</Text>
          <Text style={styles.resultText}>{result.createdFiles.length} files · {result.openedIssues.length} issues · branch {result.defaultBranch}</Text>
          {result.receipts.map((receipt) => (
            <Text key={receipt.id} style={styles.receiptLine}>{formatReceiptLine(receipt)}</Text>
          ))}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111827',
    borderColor: '#334155',
    borderRadius: 24,
    borderWidth: 1,
    gap: 14,
    padding: 18,
  },
  headerRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  headerCopy: {
    flex: 1,
    gap: 8,
  },
  kicker: {
    color: '#67e8f9',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  heading: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '900',
  },
  helper: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 20,
  },
  modeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#164e63',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  modeText: {
    color: '#ecfeff',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#06b6d4',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  buttonPressed: {
    opacity: 0.82,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: '#082f49',
    fontSize: 15,
    fontWeight: '900',
  },
  stage: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    gap: 5,
    padding: 12,
  },
  stageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  stageLabel: {
    color: '#f8fafc',
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
  },
  stageStatus: {
    color: '#67e8f9',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  stageDetail: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 18,
  },
  error: {
    color: '#fecaca',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  resultBox: {
    backgroundColor: '#082f49',
    borderRadius: 18,
    gap: 6,
    padding: 14,
  },
  resultTitle: {
    color: '#ecfeff',
    fontSize: 15,
    fontWeight: '900',
  },
  resultText: {
    color: '#cffafe',
    fontSize: 13,
    lineHeight: 18,
  },
  receiptLine: {
    color: '#a5f3fc',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
  },
});
