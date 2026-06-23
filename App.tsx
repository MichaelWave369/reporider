import { useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CreateRepoPanel } from './src/components/CreateRepoPanel';
import { IdeaCapture } from './src/components/IdeaCapture';
import { ReceiptTimeline } from './src/components/ReceiptTimeline';
import { RepoPlanCard } from './src/components/RepoPlanCard';
import { RepoPlanControls } from './src/components/RepoPlanControls';
import { StarterFilePreviewCard } from './src/components/StarterFilePreviewCard';
import { buildRepoPlan } from './src/lib/repoPlanner';
import { scanRepoPlan } from './src/lib/safetyScan';
import { createSeedReceipts } from './src/lib/receiptLedger';
import {
  applyStarterFileDrafts,
  buildStarterFileApprovalFingerprint,
  buildStarterFilePreviews,
} from './src/lib/starterFilePreview';
import type {
  RepoPlan,
  RepoPlanOverrides,
  StarterFileApprovalMap,
  StarterFileDraftMap,
} from './src/types';

const starterIdea =
  'Create a private repo for a simple camping checklist app. Use React Native, add a README, and create starter issues.';

const createStarterFilePlanKey = (plan: RepoPlan) =>
  JSON.stringify({
    name: plan.name,
    description: plan.description,
    visibility: plan.visibility,
    stack: plan.stack,
    files: plan.files,
    issues: plan.issues.map((issue) => issue.title),
  });

export default function App() {
  const [idea, setIdea] = useState(starterIdea);
  const [planOverrides, setPlanOverrides] = useState<RepoPlanOverrides>({});
  const [starterFileDraftState, setStarterFileDraftState] = useState<{
    drafts: StarterFileDraftMap;
    planKey: string;
  }>({ drafts: {}, planKey: '' });
  const [starterFileApprovalState, setStarterFileApprovalState] = useState<{
    approvals: StarterFileApprovalMap;
    planKey: string;
  }>({ approvals: {}, planKey: '' });

  const suggestedPlan = useMemo(() => buildRepoPlan(idea), [idea]);
  const repoPlan = useMemo(() => buildRepoPlan(idea, planOverrides), [idea, planOverrides]);
  const starterFilePlanKey = useMemo(() => createStarterFilePlanKey(repoPlan), [repoPlan]);
  const starterFileDrafts = starterFileDraftState.planKey === starterFilePlanKey
    ? starterFileDraftState.drafts
    : {};
  const starterFileApprovals = starterFileApprovalState.planKey === starterFilePlanKey
    ? starterFileApprovalState.approvals
    : {};
  const generatedStarterFiles = useMemo(() => buildStarterFilePreviews(repoPlan), [repoPlan]);
  const reviewedStarterFiles = useMemo(
    () => applyStarterFileDrafts(generatedStarterFiles, starterFileDrafts),
    [generatedStarterFiles, starterFileDrafts],
  );
  const approvedStarterFileCount = useMemo(
    () => reviewedStarterFiles.filter(
      (file) => starterFileApprovals[file.path] === buildStarterFileApprovalFingerprint(file),
    ).length,
    [reviewedStarterFiles, starterFileApprovals],
  );
  const allStarterFilesApproved = reviewedStarterFiles.length > 0
    && approvedStarterFileCount === reviewedStarterFiles.length;
  const safetyReport = useMemo(() => scanRepoPlan(repoPlan), [repoPlan]);
  const receipts = useMemo(() => createSeedReceipts(repoPlan, safetyReport), [repoPlan, safetyReport]);

  const handleIdeaChange = (nextIdea: string) => {
    setIdea(nextIdea);
    setPlanOverrides({});
    setStarterFileDraftState({ drafts: {}, planKey: '' });
    setStarterFileApprovalState({ approvals: {}, planKey: '' });
  };

  const updateStarterFileDraft = (path: string, content: string) => {
    setStarterFileDraftState({
      planKey: starterFilePlanKey,
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
      planKey: starterFilePlanKey,
      drafts: nextDrafts,
    });
  };

  const resetAllStarterFileDrafts = () => {
    setStarterFileDraftState({ drafts: {}, planKey: starterFilePlanKey });
  };

  const approveStarterFile = (path: string) => {
    const file = reviewedStarterFiles.find((candidate) => candidate.path === path);

    if (!file) {
      return;
    }

    setStarterFileApprovalState({
      planKey: starterFilePlanKey,
      approvals: {
        ...starterFileApprovals,
        [path]: buildStarterFileApprovalFingerprint(file),
      },
    });
  };

  const approveAllStarterFiles = () => {
    setStarterFileApprovalState({
      planKey: starterFilePlanKey,
      approvals: reviewedStarterFiles.reduce<StarterFileApprovalMap>((approvals, file) => ({
        ...approvals,
        [file.path]: buildStarterFileApprovalFingerprint(file),
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
        <CreateRepoPanel
          allStarterFilesApproved={allStarterFilesApproved}
          approvedStarterFileCount={approvedStarterFileCount}
          plan={repoPlan}
          safetyReport={safetyReport}
          starterFiles={reviewedStarterFiles}
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
