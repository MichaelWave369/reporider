import { StyleSheet, Text, View } from 'react-native';
import type { DryRunWriterResult } from '../lib/dryRunWriter';

const formatFlag = (enabled: boolean) => (enabled ? 'Yes' : 'No');

export type DryRunWriterCardProps = {
  result: DryRunWriterResult;
};

export const DryRunWriterCard = ({ result }: DryRunWriterCardProps) => (
  <View style={styles.card}>
    <View style={styles.headerRow}>
      <View style={styles.headerCopy}>
        <Text style={styles.kicker}>Dry-Run Writer</Text>
        <Text style={styles.heading}>Receipt-ready writer contract</Text>
        <Text style={styles.helper}>{result.summary}</Text>
      </View>
      <View style={styles.statusBadge}>
        <Text style={styles.statusValue}>{result.label}</Text>
        <Text style={styles.statusLabel}>{result.status.replace('_', ' ')}</Text>
      </View>
    </View>

    <View style={styles.policyBox}>
      <Text style={styles.policyTitle}>Safety receipt coupling</Text>
      <Text style={styles.policyText}>Policy · {result.requestSummary.safetyPolicyVersion}</Text>
      <Text style={styles.policyText}>Status · {result.requestSummary.safetyStatus}</Text>
      <Text style={styles.policyText}>Warnings / blockers · {result.requestSummary.warningCount} / {result.requestSummary.blockerCount}</Text>
    </View>

    <View style={styles.policyBox}>
      <Text style={styles.policyTitle}>Artifact fingerprints</Text>
      <Text style={styles.policyText}>Ride · {result.requestSummary.rideArtifactFingerprint}</Text>
      <Text style={styles.policyText}>Files · {result.requestSummary.approvedFilesFingerprint}</Text>
      <Text style={styles.policyText}>Issues · {result.requestSummary.approvedIssuesFingerprint}</Text>
      <Text style={styles.policyText}>Receipt preview · {result.requestSummary.receiptPreviewFingerprint}</Text>
    </View>

    <View style={styles.stateGrid}>
      <View style={styles.statePill}>
        <Text style={styles.stateLabel}>Would create repo</Text>
        <Text style={styles.stateValue}>{formatFlag(result.requestSummary.wouldCreateRepository)}</Text>
      </View>
      <View style={styles.statePill}>
        <Text style={styles.stateLabel}>Approved files</Text>
        <Text style={styles.stateValue}>{result.requestSummary.wouldPushFileCount}</Text>
      </View>
      <View style={styles.statePill}>
        <Text style={styles.stateLabel}>Approved issues</Text>
        <Text style={styles.stateValue}>{result.requestSummary.wouldOpenIssueCount}</Text>
      </View>
      <View style={styles.statePill}>
        <Text style={styles.stateLabel}>Receipt preview</Text>
        <Text style={styles.stateValue}>{result.requestSummary.receiptPreviewCount}</Text>
      </View>
      <View style={styles.statePill}>
        <Text style={styles.stateLabel}>Warnings / blockers</Text>
        <Text style={styles.stateValue}>{result.requestSummary.warningCount} / {result.requestSummary.blockerCount}</Text>
      </View>
      <View style={styles.statePill}>
        <Text style={styles.stateLabel}>Live promotion</Text>
        <Text style={styles.stateValue}>{result.canPromoteToLiveWrite ? 'Ready later' : 'Blocked'}</Text>
      </View>
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Blocking reasons</Text>
      {result.requestSummary.blockingReasons.length === 0 ? (
        <Text style={styles.gateText}>No dry-run blockers found. Live promotion still requires future write-mode gates.</Text>
      ) : result.requestSummary.blockingReasons.map((reason, index) => (
        <Text key={reason} style={styles.gateText}>{index + 1}. {reason}</Text>
      ))}
    </View>

    <View style={styles.boundaryBox}>
      <Text style={styles.boundaryTitle}>Boundary notes</Text>
      {result.boundaryNotes.map((note) => (
        <Text key={note} style={styles.boundaryText}>• {note}</Text>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111827',
    borderColor: '#f59e0b',
    borderRadius: 24,
    borderWidth: 1,
    gap: 16,
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
    color: '#fbbf24',
    fontSize: 12,
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
    color: '#e5e7eb',
    fontSize: 13,
    lineHeight: 18,
  },
  statusBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#451a03',
    borderColor: '#f59e0b',
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 96,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  statusValue: {
    color: '#fef3c7',
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
  },
  statusLabel: {
    color: '#fde68a',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  policyBox: {
    backgroundColor: '#0f172a',
    borderColor: '#fbbf24',
    borderRadius: 18,
    borderWidth: 1,
    gap: 5,
    padding: 12,
  },
  policyTitle: {
    color: '#fef3c7',
    fontSize: 13,
    fontWeight: '900',
  },
  policyText: {
    color: '#fffbeb',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
  },
  stateGrid: {
    gap: 8,
  },
  statePill: {
    backgroundColor: '#1f2937',
    borderColor: '#f59e0b',
    borderRadius: 14,
    borderWidth: 1,
    gap: 3,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  stateLabel: {
    color: '#fde68a',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  stateValue: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '900',
  },
  section: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    gap: 9,
    padding: 12,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '900',
  },
  gateText: {
    color: '#e5e7eb',
    fontSize: 12,
    lineHeight: 17,
  },
  boundaryBox: {
    backgroundColor: '#451a03',
    borderColor: '#fbbf24',
    borderRadius: 18,
    borderWidth: 1,
    gap: 5,
    padding: 12,
  },
  boundaryTitle: {
    color: '#fef3c7',
    fontSize: 13,
    fontWeight: '900',
  },
  boundaryText: {
    color: '#fffbeb',
    fontSize: 12,
    lineHeight: 17,
  },
});
