import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  buildUnifiedApprovalReceiptEntries,
  summarizeUnifiedApprovalReceiptEntries,
} from '../lib/approvalReceipt';
import type {
  RepoIssuePlan,
  StarterFileApprovalMap,
  StarterFilePreview,
  StarterIssueApprovalMap,
} from '../types';

type ApprovalReceiptPreviewCardProps = {
  approvedDraftFingerprints: StarterFileApprovalMap;
  approvedIssueFingerprints: StarterIssueApprovalMap;
  draftIssues: RepoIssuePlan[];
  draftPreviews: StarterFilePreview[];
  generatedIssues: RepoIssuePlan[];
  generatedPreviews: StarterFilePreview[];
};

export const ApprovalReceiptPreviewCard = ({
  approvedDraftFingerprints,
  approvedIssueFingerprints,
  draftIssues,
  draftPreviews,
  generatedIssues,
  generatedPreviews,
}: ApprovalReceiptPreviewCardProps) => {
  const entries = useMemo(
    () => buildUnifiedApprovalReceiptEntries(
      generatedPreviews,
      draftPreviews,
      approvedDraftFingerprints,
      generatedIssues,
      draftIssues,
      approvedIssueFingerprints,
    ),
    [
      approvedDraftFingerprints,
      approvedIssueFingerprints,
      draftIssues,
      draftPreviews,
      generatedIssues,
      generatedPreviews,
    ],
  );
  const summary = useMemo(() => summarizeUnifiedApprovalReceiptEntries(entries), [entries]);
  const pendingCount = summary.totalCount - summary.approvedCount;
  const badgeLabel = summary.allApproved
    ? `${summary.approvedCount}/${summary.totalCount} approved`
    : `${pendingCount} pending`;

  if (entries.length === 0) {
    return null;
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>Approval Ledger</Text>
          <Text style={styles.heading}>Review the full write receipt before create</Text>
          <Text style={styles.helper}>
            This read-only ledger summarizes the exact starter files and starter issues currently approved for the ride.
          </Text>
        </View>
        <View style={[styles.badge, summary.allApproved ? styles.badgeApproved : styles.badgePending]}>
          <Text style={styles.badgeText}>{badgeLabel}</Text>
        </View>
      </View>

      <View style={styles.summaryBox}>
        <Text style={styles.summaryText}>{summary.approvedFileCount}/{summary.totalFileCount} approved files</Text>
        <Text style={styles.summaryText}>{summary.approvedIssueCount}/{summary.totalIssueCount} approved issues</Text>
        <Text style={styles.summaryText}>{summary.editedFileCount} edited file drafts</Text>
        <Text style={styles.summaryText}>{summary.editedIssueCount} edited issue drafts</Text>
      </View>

      {entries.map((entry) => (
        <View key={`${entry.kind}:${entry.id}`} style={styles.receiptRow}>
          <View style={styles.receiptHeader}>
            <View style={styles.receiptTitleGroup}>
              <Text style={styles.path}>{entry.primaryLabel}</Text>
              <Text style={styles.secondaryLabel}>{entry.secondaryLabel}</Text>
            </View>
            <Text style={[styles.status, entry.approved ? styles.statusApproved : styles.statusPending]}>
              {entry.approved ? 'approved' : 'needs approval'}
            </Text>
          </View>
          <View style={styles.pillRow}>
            <Text style={[styles.kindPill, entry.kind === 'starter-file' ? styles.filePill : styles.issuePill]}>
              {entry.kind === 'starter-file' ? 'file' : 'issue'}
            </Text>
            <Text style={[styles.pill, entry.edited ? styles.pillEdited : styles.pillGenerated]}>
              {entry.edited ? 'edited' : 'generated'}
            </Text>
            {entry.pills.map((pill) => (
              <Text key={`${entry.id}:${pill}`} style={styles.pill}>{pill}</Text>
            ))}
          </View>
          <Text style={styles.fingerprint}>fingerprint · {entry.fingerprint}</Text>
        </View>
      ))}
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
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  badgeApproved: {
    backgroundColor: '#14532d',
  },
  badgePending: {
    backgroundColor: '#854d0e',
  },
  badgeText: {
    color: '#ecfeff',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  summaryBox: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    gap: 6,
    padding: 12,
  },
  summaryText: {
    color: '#dbeafe',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  receiptRow: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    padding: 12,
  },
  receiptHeader: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  receiptTitleGroup: {
    flex: 1,
    gap: 4,
  },
  path: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '900',
  },
  secondaryLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  status: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  statusApproved: {
    color: '#86efac',
  },
  statusPending: {
    color: '#fde68a',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    backgroundColor: '#1e293b',
    borderRadius: 999,
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  kindPill: {
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '900',
    paddingHorizontal: 9,
    paddingVertical: 5,
    textTransform: 'uppercase',
  },
  filePill: {
    backgroundColor: '#164e63',
    color: '#cffafe',
  },
  issuePill: {
    backgroundColor: '#713f12',
    color: '#fef3c7',
  },
  pillEdited: {
    backgroundColor: '#581c87',
    color: '#f3e8ff',
  },
  pillGenerated: {
    backgroundColor: '#164e63',
    color: '#cffafe',
  },
  fingerprint: {
    color: '#a5b4fc',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
  },
});
