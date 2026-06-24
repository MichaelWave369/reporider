import { StyleSheet, Text, View } from 'react-native';
import type { SafetyReport } from '../types';

const statusLabel = (status: SafetyReport['status']) => {
  if (status === 'pass') return 'Policy pass';
  if (status === 'needs-review') return 'Needs review';
  return 'Blocked';
};

type SafetyPolicyGateCardProps = {
  report: SafetyReport;
};

export const SafetyPolicyGateCard = ({ report }: SafetyPolicyGateCardProps) => (
  <View style={styles.card}>
    <Text style={styles.kicker}>Safety policy gate</Text>
    <Text style={styles.heading}>{statusLabel(report.status)}</Text>
    <Text style={styles.summary}>{report.summary}</Text>

    <View style={styles.grid}>
      <View style={styles.metricBox}>
        <Text style={styles.metricValue}>{report.warningCount}</Text>
        <Text style={styles.metricLabel}>Warnings</Text>
      </View>
      <View style={styles.metricBox}>
        <Text style={styles.metricValue}>{report.blockerCount}</Text>
        <Text style={styles.metricLabel}>Blockers</Text>
      </View>
      <View style={styles.metricBox}>
        <Text style={styles.metricValue}>{report.reviewedScope.fileCount}</Text>
        <Text style={styles.metricLabel}>Plan files</Text>
      </View>
      <View style={styles.metricBox}>
        <Text style={styles.metricValue}>{report.reviewedScope.issueCount}</Text>
        <Text style={styles.metricLabel}>Plan issues</Text>
      </View>
      <View style={styles.metricBox}>
        <Text style={styles.metricValue}>{report.reviewedScope.reviewedFileContentCount}</Text>
        <Text style={styles.metricLabel}>File drafts</Text>
      </View>
      <View style={styles.metricBox}>
        <Text style={styles.metricValue}>{report.reviewedScope.reviewedFileContentCharacters}</Text>
        <Text style={styles.metricLabel}>File chars</Text>
      </View>
      <View style={styles.metricBox}>
        <Text style={styles.metricValue}>{report.reviewedScope.reviewedIssueContentCount}</Text>
        <Text style={styles.metricLabel}>Issue drafts</Text>
      </View>
      <View style={styles.metricBox}>
        <Text style={styles.metricValue}>{report.reviewedScope.reviewedIssueContentCharacters}</Text>
        <Text style={styles.metricLabel}>Issue chars</Text>
      </View>
    </View>

    <Text style={styles.sectionTitle}>Policy checks</Text>
    {report.checks.map((check) => (
      <View key={check.id} style={styles.checkRow}>
        <View style={styles.checkHeader}>
          <Text style={styles.checkLabel}>{check.label}</Text>
          <Text style={styles.checkStatus}>{check.status}</Text>
        </View>
        <Text style={styles.checkSummary}>{check.summary}</Text>
      </View>
    ))}

    <Text style={styles.sectionTitle}>Findings</Text>
    {report.findings.slice(0, 8).map((finding) => (
      <View key={`${finding.id}:${finding.path ?? 'global'}`} style={styles.findingRow}>
        <Text style={styles.findingSeverity}>{finding.severity}</Text>
        {finding.category ? <Text style={styles.findingCategory}>{finding.category}</Text> : null}
        <Text style={styles.findingMessage}>{finding.path ? `${finding.path}: ${finding.message}` : finding.message}</Text>
        {finding.remediation ? (
          <Text style={styles.findingRemediation}>Fix: {finding.remediation}</Text>
        ) : null}
      </View>
    ))}

    <Text style={styles.sectionTitle}>Required gates</Text>
    {report.requiredGates.map((gate) => (
      <Text key={gate} style={styles.note}>• {gate}</Text>
    ))}

    <Text style={styles.sectionTitle}>Boundary</Text>
    {report.boundaryNotes.map((note) => (
      <Text key={note} style={styles.note}>• {note}</Text>
    ))}

    <Text style={styles.policyVersion}>Policy version: {report.policyVersion}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111827',
    borderColor: '#334155',
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    padding: 18,
  },
  kicker: {
    color: '#67e8f9',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  heading: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '900',
  },
  summary: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricBox: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    minWidth: '46%',
    padding: 12,
  },
  metricValue: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '900',
  },
  metricLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: '#67e8f9',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  checkRow: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
    padding: 12,
  },
  checkHeader: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  checkLabel: {
    color: '#f8fafc',
    flex: 1,
    fontSize: 14,
    fontWeight: '900',
  },
  checkStatus: {
    color: '#fde68a',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  checkSummary: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 18,
  },
  findingRow: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  findingSeverity: {
    color: '#fde68a',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  findingCategory: {
    color: '#67e8f9',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  findingMessage: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 18,
  },
  findingRemediation: {
    color: '#bbf7d0',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  note: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 19,
  },
  policyVersion: {
    color: '#94a3b8',
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
  },
});
