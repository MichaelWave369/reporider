import { StyleSheet, Text, View } from 'react-native';
import type { RepoPlan, SafetyReport } from '../types';

type RepoPlanCardProps = {
  plan: RepoPlan;
  safetyReport: SafetyReport;
};

export const RepoPlanCard = ({ plan, safetyReport }: RepoPlanCardProps) => {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Repo Plan</Text>
      <View style={styles.row}>
        <Text style={styles.key}>Name</Text>
        <Text style={styles.value}>{plan.name}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.key}>Visibility</Text>
        <Text style={styles.value}>{plan.visibility}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.key}>Stack</Text>
        <Text style={styles.value}>{plan.stack}</Text>
      </View>

      <Text style={styles.sectionTitle}>Starter files</Text>
      {plan.files.map((file) => (
        <View key={file.path} style={styles.fileItem}>
          <Text style={styles.filePath}>{file.path}</Text>
          <Text style={styles.filePurpose}>{file.purpose}</Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Safety</Text>
      <View style={styles.safetyBadge}>
        <Text style={styles.safetyText}>{safetyReport.status}</Text>
      </View>
      {safetyReport.findings.map((finding) => (
        <Text key={finding.id} style={styles.finding}>
          • {finding.severity}: {finding.message}
        </Text>
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
    gap: 10,
    padding: 18,
  },
  heading: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
  },
  key: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '700',
  },
  value: {
    color: '#f8fafc',
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },
  sectionTitle: {
    color: '#67e8f9',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 10,
    textTransform: 'uppercase',
  },
  fileItem: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    gap: 4,
    padding: 12,
  },
  filePath: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '800',
  },
  filePurpose: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 18,
  },
  safetyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#164e63',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  safetyText: {
    color: '#ecfeff',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  finding: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 18,
  },
});
