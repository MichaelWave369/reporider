import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  buildStarterFileApprovalReceiptEntries,
  summarizeStarterFileApprovalReceiptEntries,
} from '../lib/approvalReceipt';
import type { StarterFileApprovalMap, StarterFilePreview } from '../types';

type ApprovalReceiptPreviewCardProps = {
  approvedDraftFingerprints: StarterFileApprovalMap;
  draftPreviews: StarterFilePreview[];
  generatedPreviews: StarterFilePreview[];
};

export const ApprovalReceiptPreviewCard = ({
  approvedDraftFingerprints,
  draftPreviews,
  generatedPreviews,
}: ApprovalReceiptPreviewCardProps) => {
  const entries = useMemo(
    () => buildStarterFileApprovalReceiptEntries(
      generatedPreviews,
      draftPreviews,
      approvedDraftFingerprints,
    ),
    [approvedDraftFingerprints, draftPreviews, generatedPreviews],
  );
  const summary = useMemo(() => summarizeStarterFileApprovalReceiptEntries(entries), [entries]);
  const badgeLabel = summary.allApproved
    ? `${summary.approvedCount}/${summary.totalCount} approved`
    : `${summary.totalCount - summary.approvedCount} pending`;

  if (entries.length === 0) {
    return null;
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>Approval Ledger</Text>
          <Text style={styles.heading}>Review the file approval receipt before create</Text>
          <Text style={styles.helper}>
            This read-only ledger summarizes the exact starter drafts currently approved for the ride.
          </Text>
        </View>
        <View style={[styles.badge, summary.allApproved ? styles.badgeApproved : styles.badgePending]}>
          <Text style={styles.badgeText}>{badgeLabel}</Text>
        </View>
      </View>

      <View style={styles.summaryBox}>
        <Text style={styles.summaryText}>{summary.approvedCount} approved files</Text>
        <Text style={styles.summaryText}>{summary.editedCount} rider-edited drafts</Text>
        <Text style={styles.summaryText}>{summary.totalCount} total starter files</Text>
      </View>

      {entries.map((entry) => (
        <View key={entry.path} style={styles.receiptRow}>
          <View style={styles.receiptHeader}>
            <Text style={styles.path}>{entry.path}</Text>
            <Text style={[styles.status, entry.approved ? styles.statusApproved : styles.statusPending]}>
              {entry.approved ? 'approved' : 'needs approval'}
            </Text>
          </View>
          <View style={styles.pillRow}>
            <Text style={[styles.pill, entry.edited ? styles.pillEdited : styles.pillGenerated]}>
              {entry.edited ? 'edited' : 'generated'}
            </Text>
            <Text style={styles.pill}>{entry.language}</Text>
            <Text style={styles.pill}>{entry.riskLevel} risk</Text>
            <Text style={styles.pill}>{entry.characterCount} chars</Text>
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
  path: {
    color: '#f8fafc',
    flex: 1,
    fontSize: 14,
    fontWeight: '900',
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
