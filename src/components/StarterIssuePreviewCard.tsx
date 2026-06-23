import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  buildStarterIssueApprovalFingerprint,
  buildStarterIssueDisplayFingerprint,
  isStarterIssueApproved,
  parseStarterIssueLabels,
  starterIssueKeyForIndex,
  updateStarterIssueDraft,
} from '../lib/starterIssuePreview';
import type { RepoIssuePlan, StarterIssueApprovalMap } from '../types';

type StarterIssuePreviewCardProps = {
  approvedIssueFingerprints: StarterIssueApprovalMap;
  draftIssues: RepoIssuePlan[];
  generatedIssues: RepoIssuePlan[];
  onApproveAllIssues: () => void;
  onApproveIssue: (index: number) => void;
  onIssueChange: (index: number, issue: RepoIssuePlan) => void;
  onResetAllIssues: () => void;
  onResetIssue: (index: number) => void;
};

const labelsToText = (labels: string[]) => labels.join(', ');

export const StarterIssuePreviewCard = ({
  approvedIssueFingerprints,
  draftIssues,
  generatedIssues,
  onApproveAllIssues,
  onApproveIssue,
  onIssueChange,
  onResetAllIssues,
  onResetIssue,
}: StarterIssuePreviewCardProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedIssue = draftIssues[selectedIndex];
  const generatedIssue = generatedIssues[selectedIndex];
  const approvedCount = draftIssues.filter((issue, index) => (
    isStarterIssueApproved(issue, index, approvedIssueFingerprints)
  )).length;
  const allApproved = draftIssues.length > 0 && approvedCount === draftIssues.length;

  useEffect(() => {
    if (selectedIndex > Math.max(0, draftIssues.length - 1)) {
      setSelectedIndex(Math.max(0, draftIssues.length - 1));
    }
  }, [draftIssues.length, selectedIndex]);

  const isEdited = useMemo(() => (
    selectedIssue && generatedIssue
      ? JSON.stringify(selectedIssue) !== JSON.stringify(generatedIssue)
      : false
  ), [generatedIssue, selectedIssue]);
  const selectedApproved = selectedIssue
    ? approvedIssueFingerprints[starterIssueKeyForIndex(selectedIndex)] === buildStarterIssueApprovalFingerprint(selectedIssue, selectedIndex)
    : false;
  const fingerprint = selectedIssue
    ? buildStarterIssueDisplayFingerprint(selectedIssue, selectedIndex)
    : 'iri-none';

  if (draftIssues.length === 0 || !selectedIssue || !generatedIssue) {
    return (
      <View style={styles.card}>
        <Text style={styles.kicker}>Issue Preview</Text>
        <Text style={styles.heading}>No starter issues planned</Text>
        <Text style={styles.helper}>Set issue count above zero to preview and approve starter roadmap issues.</Text>
      </View>
    );
  }

  const updateSelectedIssue = (patch: Partial<RepoIssuePlan>) => {
    onIssueChange(selectedIndex, updateStarterIssueDraft(selectedIssue, patch));
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>Issue Preview</Text>
          <Text style={styles.heading}>Review starter issues</Text>
          <Text style={styles.helper}>
            Edit and approve each starter GitHub issue before RepoRider can queue it in the mock create ride.
          </Text>
          <Text style={[styles.approvalText, allApproved && styles.approvalTextReady]}>
            {approvedCount}/{draftIssues.length} starter issues approved.
          </Text>
        </View>
        <Pressable accessibilityRole="button" onPress={onApproveAllIssues} style={styles.approveAllButton}>
          <Text style={styles.approveAllText}>Approve All</Text>
        </Pressable>
      </View>

      <View style={styles.issueChips}>
        {draftIssues.map((issue, index) => {
          const approved = isStarterIssueApproved(issue, index, approvedIssueFingerprints);
          const edited = JSON.stringify(generatedIssues[index]) !== JSON.stringify(issue);

          return (
            <Pressable
              accessibilityRole="button"
              key={starterIssueKeyForIndex(index)}
              onPress={() => setSelectedIndex(index)}
              style={[
                styles.issueChip,
                selectedIndex === index && styles.issueChipSelected,
                approved && styles.issueChipApproved,
              ]}
            >
              <Text style={styles.issueChipText} numberOfLines={1}>
                {approved ? '✓ ' : ''}#{index + 1}{edited ? '*' : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.statusRow}>
        <Text style={[styles.statusPill, selectedApproved && styles.statusPillApproved]}>
          {selectedApproved ? 'approved' : 'needs approval'}
        </Text>
        <Text style={[styles.statusPill, isEdited && styles.statusPillEdited]}>
          {isEdited ? 'edited draft' : 'generated draft'}
        </Text>
        <Text style={styles.fingerprint}>{fingerprint}</Text>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Issue title</Text>
        <TextInput
          onChangeText={(title) => updateSelectedIssue({ title })}
          placeholder="Issue title"
          placeholderTextColor="#64748b"
          style={styles.input}
          value={selectedIssue.title}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Issue body</Text>
        <TextInput
          multiline
          onChangeText={(body) => updateSelectedIssue({ body })}
          placeholder="Issue body"
          placeholderTextColor="#64748b"
          style={[styles.input, styles.bodyInput]}
          textAlignVertical="top"
          value={selectedIssue.body}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Labels</Text>
        <TextInput
          onChangeText={(labelsText) => updateSelectedIssue({ labels: parseStarterIssueLabels(labelsText) })}
          placeholder="mvp, product"
          placeholderTextColor="#64748b"
          style={styles.input}
          value={labelsToText(selectedIssue.labels)}
        />
      </View>

      <View style={styles.actionRow}>
        <Pressable accessibilityRole="button" onPress={() => onApproveIssue(selectedIndex)} style={styles.approveButton}>
          <Text style={styles.approveButtonText}>Approve This Issue</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => onResetIssue(selectedIndex)} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Reset Issue</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onResetAllIssues} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Reset All</Text>
        </Pressable>
      </View>
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
    gap: 7,
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
  approvalText: {
    color: '#fef3c7',
    fontSize: 13,
    fontWeight: '800',
  },
  approvalTextReady: {
    color: '#bbf7d0',
  },
  approveAllButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#164e63',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  approveAllText: {
    color: '#ecfeff',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  issueChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  issueChip: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  issueChipSelected: {
    borderColor: '#67e8f9',
  },
  issueChipApproved: {
    backgroundColor: '#14532d',
    borderColor: '#86efac',
  },
  issueChipText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '900',
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusPill: {
    backgroundColor: '#78350f',
    borderRadius: 999,
    color: '#fef3c7',
    fontSize: 11,
    fontWeight: '900',
    paddingHorizontal: 10,
    paddingVertical: 5,
    textTransform: 'uppercase',
  },
  statusPillApproved: {
    backgroundColor: '#14532d',
    color: '#bbf7d0',
  },
  statusPillEdited: {
    backgroundColor: '#164e63',
    color: '#cffafe',
  },
  fingerprint: {
    color: '#94a3b8',
    fontFamily: 'Courier',
    fontSize: 11,
    fontWeight: '800',
    paddingVertical: 5,
  },
  fieldGroup: {
    gap: 7,
  },
  label: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '900',
  },
  input: {
    backgroundColor: '#020617',
    borderColor: '#334155',
    borderRadius: 14,
    borderWidth: 1,
    color: '#f8fafc',
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  bodyInput: {
    minHeight: 112,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  approveButton: {
    backgroundColor: '#06b6d4',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  approveButtonText: {
    color: '#082f49',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  secondaryButton: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
});