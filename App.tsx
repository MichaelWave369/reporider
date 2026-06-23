import { useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ApprovalReceiptPreviewCard } from './src/components/ApprovalReceiptPreviewCard';
import { CreateRepoPanel } from './src/components/CreateRepoPanel';
import { IdeaCapture } from './src/components/IdeaCapture';
import { ReceiptTimeline } from './src/components/ReceiptTimeline';
import { RepoPlanCard } from './src/components/RepoPlanCard';
import { RepoPlanControls } from './src/components/RepoPlanControls';
import { RideHistoryCard } from './src/components/RideHistoryCard';
import { SavedDraftSlotsCard } from './src/components/SavedDraftSlotsCard';
import { StarterFilePreviewCard } from './src/components/StarterFilePreviewCard';
import { StarterIssuePreviewCard } from './src/components/StarterIssuePreviewCard';
import { buildRepoPlan } from './src/lib/repoPlanner';
import { scanRepoPlan } from './src/lib/safetyScan';
import { createSeedReceipts } from './src/lib/receiptLedger';
import {
  applyStarterFileDrafts,
  buildStarterFileApprovalFingerprint,
  buildStarterFilePreviews,
} from './src/lib/starterFilePreview';
import {
  applyStarterIssueDrafts,
  buildStarterIssueApprovalFingerprint,
  buildStarterIssuePreviews,
  starterIssueKeyForIndex,
} from './src/lib/starterIssuePreview';
import type {
  GithubCreateRepoResult,
  RepoIssuePlan,
  RepoPlan,
  RepoPlanOverrides,
  RideDraftSnapshot,
  RideHistoryEntry,
  SavedDraftSlot,
  StarterFileApprovalMap,
  StarterFileDraftMap,
  StarterIssueApprovalMap,
  StarterIssueDraftMap,
} from './src/types';

const starterIdea =
  'Create a private repo for a simple camping checklist app. Use React Native, add a README, and create starter issues.';

const createStarterPlanKey = (plan: RepoPlan) =>
  JSON.stringify({
    name: plan.name,
    description: plan.description,
    visibility: plan.visibility,
    stack: plan.stack,
    files: plan.files,
    issues: plan.issues,
  });

const buildRideHistoryId = (result: GithubCreateRepoResult, completedAt: string) =>
  `${result.repositoryUrl}:${completedAt}:${result.summary.writeArtifactCount}:${result.summary.receiptCount}`;

const buildSavedDraftSlotId = (snapshot: RideDraftSnapshot, savedAt: string) =>
  `${savedAt}:${snapshot.idea}:${JSON.stringify(snapshot.planOverrides)}`;

const normalizeSavedDraftLabel = (label: string) => {
  const trimmed = label.trim().replace(/\s+/g, ' ');
  return trimmed ? trimmed.slice(0, 48) : undefined;
};

export default function App() {
  const [idea, setIdea] = useState(starterIdea);
  const [planOverrides, setPlanOverrides] = useState<RepoPlanOverrides>({});
  const [rideHistory, setRideHistory] = useState<RideHistoryEntry[]>([]);
  const [savedDraftSlots, setSavedDraftSlots] = useState<SavedDraftSlot[]>([]);
  const [starterFileDraftState, setStarterFileDraftState] = useState<{
    drafts: StarterFileDraftMap;
    planKey: string;
  }>({ drafts: {}, planKey: '' });
  const [starterFileApprovalState, setStarterFileApprovalState] = useState<{
    approvals: StarterFileApprovalMap;
    planKey: string;
  }>({ approvals: {}, planKey: '' });
  const [starterIssueDraftState, setStarterIssueDraftState] = useState<{
    drafts: StarterIssueDraftMap;
    planKey: string;
  }>({ drafts: {}, planKey: '' });
  const [starterIssueApprovalState, setStarterIssueApprovalState] = useState<{
    approvals: StarterIssueApprovalMap;
    planKey: string;
  }>({ approvals: {}, planKey: '' });

  const suggestedPlan = useMemo(() => buildRepoPlan(idea), [idea]);
  const repoPlan = useMemo(() => buildRepoPlan(idea, planOverrides), [idea, planOverrides]);
  const starterPlanKey = useMemo(() => createStarterPlanKey(repoPlan), [repoPlan]);
  const starterFileDrafts = starterFileDraftState.planKey === starterPlanKey
    ? starterFileDraftState.drafts
    : {};
  const starterFileApprovals = starterFileApprovalState.planKey === starterPlanKey
    ? starterFileApprovalState.approvals
    : {};
  const starterIssueDrafts = starterIssueDraftState.planKey === starterPlanKey
    ? starterIssueDraftState.drafts
    : {};
  const starterIssueApprovals = starterIssueApprovalState.planKey === starterPlanKey
    ? starterIssueApprovalState.approvals
    : {};
  const generatedStarterFiles = useMemo(() => buildStarterFilePreviews(repoPlan), [repoPlan]);
  const reviewedStarterFiles = useMemo(
    () => applyStarterFileDrafts(generatedStarterFiles, starterFileDrafts),
    [generatedStarterFiles, starterFileDrafts],
  );
  const generatedStarterIssues = useMemo(() => buildStarterIssuePreviews(repoPlan), [repoPlan]);
  const reviewedStarterIssues = useMemo(
    () => applyStarterIssueDrafts(generatedStarterIssues, starterIssueDrafts),
    [generatedStarterIssues, starterIssueDrafts],
  );
  const approvedStarterFileCount = useMemo(
    () => reviewedStarterFiles.filter(
      (file) => starterFileApprovals[file.path] === buildStarterFileApprovalFingerprint(file),
    ).length,
    [reviewedStarterFiles, starterFileApprovals],
  );
  const approvedStarterIssueCount = useMemo(
    () => reviewedStarterIssues.filter(
      (issue, index) => starterIssueApprovals[starterIssueKeyForIndex(index)] === buildStarterIssueApprovalFingerprint(issue, index),
    ).length,
    [reviewedStarterIssues, starterIssueApprovals],
  );
  const allStarterFilesApproved = reviewedStarterFiles.length > 0
    && approvedStarterFileCount === reviewedStarterFiles.length;
  const allStarterIssuesApproved = reviewedStarterIssues.length === approvedStarterIssueCount;
  const safetyReport = useMemo(() => scanRepoPlan(repoPlan), [repoPlan]);
  const receipts = useMemo(() => createSeedReceipts(repoPlan, safetyReport), [repoPlan, safetyReport]);

  const resetReviewState = () => {
    setStarterFileDraftState({ drafts: {}, planKey: '' });
    setStarterFileApprovalState({ approvals: {}, planKey: '' });
    setStarterIssueDraftState({ drafts: {}, planKey: '' });
    setStarterIssueApprovalState({ approvals: {}, planKey: '' });
  };

  const buildCurrentDraftSnapshot = (): RideDraftSnapshot => ({
    idea,
    planOverrides: { ...planOverrides },
  });

  const saveDraftSnapshotSlot = (draftSnapshot: RideDraftSnapshot, label?: string) => {
    const savedAt = new Date().toISOString();
    const draftSlot: SavedDraftSlot = {
      draftSnapshot,
      id: buildSavedDraftSlotId(draftSnapshot, savedAt),
      label: normalizeSavedDraftLabel(label ?? ''),
      savedAt,
    };

    setSavedDraftSlots((currentSlots) => [draftSlot, ...currentSlots].slice(0, 5));
  };

  const restoreDraftSnapshot = (snapshot: RideDraftSnapshot) => {
    setIdea(snapshot.idea);
    setPlanOverrides(snapshot.planOverrides);
    resetReviewState();
  };

  const handleSaveCurrentDraftSlot = () => {
    saveDraftSnapshotSlot(buildCurrentDraftSnapshot());
  };

  const handleSaveImportedPreviewSlot = (snapshot: RideDraftSnapshot) => {
    saveDraftSnapshotSlot(snapshot);
  };

  const handleRenameSavedDraftSlot = (slotId: string, nextLabel: string) => {
    const normalizedLabel = normalizeSavedDraftLabel(nextLabel);

    setSavedDraftSlots((currentSlots) => currentSlots.map((slot) => (
      slot.id === slotId
        ? { ...slot, label: normalizedLabel }
        : slot
    )));
  };

  const handleRestoreSavedDraftSlot = (slot: SavedDraftSlot) => {
    restoreDraftSnapshot(slot.draftSnapshot);
  };

  const handleDeleteSavedDraftSlot = (slotId: string) => {
    setSavedDraftSlots((currentSlots) => currentSlots.filter((slot) => slot.id !== slotId));
  };

  const handleRideComplete = (result: GithubCreateRepoResult) => {
    const completedAt = result.receipts.at(-1)?.timestamp ?? new Date().toISOString();
    const historyEntry: RideHistoryEntry = {
      completedAt,
      draftSnapshot: buildCurrentDraftSnapshot(),
      id: buildRideHistoryId(result, completedAt),
      result,
    };

    setRideHistory((currentHistory) => [
      historyEntry,
      ...currentHistory.filter((entry) => entry.id !== historyEntry.id),
    ].slice(0, 5));
  };

  const handleRestoreRideDraft = (entry: RideHistoryEntry) => {
    if (!entry.draftSnapshot) {
      return;
    }

    restoreDraftSnapshot(entry.draftSnapshot);
  };

  const handleIdeaChange = (nextIdea: string) => {
    setIdea(nextIdea);
    setPlanOverrides({});
    resetReviewState();
  };

  const updateStarterFileDraft = (path: string, content: string) => {
    setStarterFileDraftState({
      planKey: starterPlanKey,
      drafts: {
        ...starterFileDrafts,
        [path]: content,
      },
    });
  };

  const resetStarterFileDraft = (path: string) => {
    const nextDrafts = { ...starterFileDrafts };
    delete nextDrafts[path];

    setStarterFileDraftState({
      planKey: starterPlanKey,
      drafts: nextDrafts,
    });
  };

  const resetAllStarterFileDrafts = () => {
    setStarterFileDraftState({ drafts: {}, planKey: starterPlanKey });
  };

  const approveStarterFile = (path: string) => {
    const file = reviewedStarterFiles.find((candidate) => candidate.path === path);

    if (!file) {
      return;
    }

    setStarterFileApprovalState({
      planKey: starterPlanKey,
      approvals: {
        ...starterFileApprovals,
        [path]: buildStarterFileApprovalFingerprint(file),
      },
    });
  };

  const approveAllStarterFiles = () => {
    setStarterFileApprovalState({
      planKey: starterPlanKey,
      approvals: reviewedStarterFiles.reduce<StarterFileApprovalMap>((approvals, file) => ({
        ...approvals,
        [file.path]: buildStarterFileApprovalFingerprint(file),
      }), {}),
    });
  };

  const updateStarterIssueDraft = (index: number, issue: RepoIssuePlan) => {
    setStarterIssueDraftState({
      planKey: starterPlanKey,
      drafts: {
        ...starterIssueDrafts,
        [starterIssueKeyForIndex(index)]: issue,
      },
    });
  };

  const resetStarterIssueDraft = (index: number) => {
    const nextDrafts = { ...starterIssueDrafts };
    delete nextDrafts[starterIssueKeyForIndex(index)];

    setStarterIssueDraftState({
      planKey: starterPlanKey,
      drafts: nextDrafts,
    });
  };

  const resetAllStarterIssueDrafts = () => {
    setStarterIssueDraftState({ drafts: {}, planKey: starterPlanKey });
  };

  const approveStarterIssue = (index: number) => {
    const issue = reviewedStarterIssues[index];

    if (!issue) {
      return;
    }

    setStarterIssueApprovalState({
      planKey: starterPlanKey,
      approvals: {
        ...starterIssueApprovals,
        [starterIssueKeyForIndex(index)]: buildStarterIssueApprovalFingerprint(issue, index),
      },
    });
  };

  const approveAllStarterIssues = () => {
    setStarterIssueApprovalState({
      planKey: starterPlanKey,
      approvals: reviewedStarterIssues.reduce<StarterIssueApprovalMap>((approvals, issue, index) => ({
        ...approvals,
        [starterIssueKeyForIndex(index)]: buildStarterIssueApprovalFingerprint(issue, index),
      }), {}),
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>RepoRider</Text>
          <Text style={styles.title}>Catch the idea. Forge the repo. Ride the build.</Text>
          <Text style={styles.subtitle}>
            A mobile-first GitHub creation assistant for builders away from the desk.
          </Text>
        </View>

        <IdeaCapture idea={idea} onIdeaChange={handleIdeaChange} />
        <RepoPlanControls
          overrides={planOverrides}
          onOverridesChange={setPlanOverrides}
          onReset={() => setPlanOverrides({})}
          plan={repoPlan}
          suggestedPlan={suggestedPlan}
        />
        <SavedDraftSlotsCard
          onClearSlots={() => setSavedDraftSlots([])}
          onDeleteSlot={handleDeleteSavedDraftSlot}
          onImportSnapshot={restoreDraftSnapshot}
          onRenameSlot={handleRenameSavedDraftSlot}
          onRestoreSlot={handleRestoreSavedDraftSlot}
          onSaveCurrentDraft={handleSaveCurrentDraftSlot}
          onSaveImportPreview={handleSaveImportedPreviewSlot}
          slots={savedDraftSlots}
        />
        <RepoPlanCard plan={repoPlan} safetyReport={safetyReport} />
        <StarterFilePreviewCard
          approvedDraftFingerprints={starterFileApprovals}
          draftPreviews={reviewedStarterFiles}
          generatedPreviews={generatedStarterFiles}
          onApproveAllFiles={approveAllStarterFiles}
          onApproveFile={approveStarterFile}
          onDraftContentChange={updateStarterFileDraft}
          onResetAllDrafts={resetAllStarterFileDrafts}
          onResetFileDraft={resetStarterFileDraft}
        />
        <StarterIssuePreviewCard
          approvedIssueFingerprints={starterIssueApprovals}
          draftIssues={reviewedStarterIssues}
          generatedIssues={generatedStarterIssues}
          onApproveAllIssues={approveAllStarterIssues}
          onApproveIssue={approveStarterIssue}
          onIssueChange={updateStarterIssueDraft}
          onResetAllIssues={resetAllStarterIssueDrafts}
          onResetIssue={resetStarterIssueDraft}
        />
        <ApprovalReceiptPreviewCard
          approvedDraftFingerprints={starterFileApprovals}
          approvedIssueFingerprints={starterIssueApprovals}
          draftIssues={reviewedStarterIssues}
          draftPreviews={reviewedStarterFiles}
          generatedIssues={generatedStarterIssues}
          generatedPreviews={generatedStarterFiles}
        />
        <CreateRepoPanel
          allStarterFilesApproved={allStarterFilesApproved}
          allStarterIssuesApproved={allStarterIssuesApproved}
          approvedStarterFileCount={approvedStarterFileCount}
          approvedStarterIssueCount={approvedStarterIssueCount}
          onRideComplete={handleRideComplete}
          plan={repoPlan}
          safetyReport={safetyReport}
          starterFiles={reviewedStarterFiles}
          starterIssues={reviewedStarterIssues}
        />
        <RideHistoryCard
          history={rideHistory}
          onClearHistory={() => setRideHistory([])}
          onRestoreDraft={handleRestoreRideDraft}
        />
        <ReceiptTimeline receipts={receipts} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    padding: 20,
    gap: 18,
  },
  hero: {
    paddingTop: 18,
    paddingBottom: 8,
    gap: 10,
  },
  kicker: {
    color: '#67e8f9',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    color: '#f8fafc',
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 39,
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 16,
    lineHeight: 23,
  },
});