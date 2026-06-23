import { StyleSheet, Text, View } from 'react-native';
import { RideReceiptExportCard } from './RideReceiptExportCard';
import type { GithubCreateRepoResult } from '../types';

type RideCompleteSummaryCardProps = {
  result: GithubCreateRepoResult;
};

const formatReceiptLine = (status: string, action: string) => `${status.toUpperCase()} · ${action}`;

export const RideCompleteSummaryCard = ({ result }: RideCompleteSummaryCardProps) => {
  const metrics = [
    ['Write artifacts', result.summary.writeArtifactCount],
    ['Files approved', result.summary.approvedFileCount],
    ['Issues approved', result.summary.approvedIssueCount],
    ['Edited files', result.summary.editedFileCount],
    ['Edited issues', result.summary.editedIssueCount],
    ['Receipts', result.summary.receiptCount],
  ];

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>Ride Complete</Text>
          <Text style={styles.heading}>Mock repo creation summary</Text>
          <Text style={styles.helper}>This final receipt summarizes the approved write package that would be created in live mode.</Text>
        </View>
        <View style={styles.modeBadge}>
          <Text style={styles.modeText}>{result.mode}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Repository</Text>
        <Text style={styles.itemStrong}>{result.repositoryUrl}</Text>
        <Text style={styles.itemLine}>default branch · {result.defaultBranch}</Text>
      </View>

      <View style={styles.metricGrid}>
        {metrics.map(([label, value]) => (
          <View key={String(label)} style={styles.metricCard}>
            <Text style={styles.metricValue}>{String(value)}</Text>
            <Text style={styles.metricLabel}>{String(label)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Files queued</Text>
        {result.createdFiles.map((path) => <Text key={path} style={styles.itemLine}>• {path}</Text>)}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Issues queued</Text>
        {result.openedIssues.map((title, index) => <Text key={`${index}-${title}`} style={styles.itemLine}>• {title}</Text>)}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Approval totals</Text>
        <Text style={styles.itemLine}>{result.summary.totalFileDraftCharacters} file draft characters · {result.summary.totalIssueDraftCharacters} issue draft characters</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Receipts</Text>
        {result.receipts.map((receipt) => <Text key={receipt.id} style={styles.receiptLine}>{formatReceiptLine(receipt.status, receipt.action)}</Text>)}
      </View>

      <RideReceiptExportCard result={result} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#082f49', borderColor: '#22d3ee', borderRadius: 22, borderWidth: 1, gap: 14, padding: 16 },
  headerRow: { flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  headerCopy: { flex: 1, gap: 7 },
  kicker: { color: '#a5f3fc', fontSize: 12, fontWeight: '900', letterSpacing: 1.1, textTransform: 'uppercase' },
  heading: { color: '#ecfeff', fontSize: 20, fontWeight: '900' },
  helper: { color: '#cffafe', fontSize: 13, lineHeight: 18 },
  modeBadge: { alignSelf: 'flex-start', backgroundColor: '#0f766e', borderRadius: 999, paddingHorizontal: 11, paddingVertical: 7 },
  modeText: { color: '#ecfeff', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metricCard: { backgroundColor: '#164e63', borderRadius: 14, minWidth: '30%', paddingHorizontal: 10, paddingVertical: 9 },
  metricValue: { color: '#f8fafc', fontSize: 18, fontWeight: '900' },
  metricLabel: { color: '#cffafe', fontSize: 11, fontWeight: '800', lineHeight: 15, textTransform: 'uppercase' },
  section: { backgroundColor: '#0f172a', borderRadius: 16, gap: 6, padding: 12 },
  sectionTitle: { color: '#ecfeff', fontSize: 14, fontWeight: '900' },
  itemStrong: { color: '#f8fafc', fontSize: 14, fontWeight: '800', lineHeight: 19 },
  itemLine: { color: '#cffafe', fontSize: 13, lineHeight: 18 },
  receiptLine: { color: '#a5f3fc', fontSize: 12, fontWeight: '800', lineHeight: 17 },
});
