import { StyleSheet, Text, View } from 'react-native';
import type { TokenStorageSnapshot } from '../types';

const formatBoolean = (value: boolean) => (value ? 'Yes' : 'No');

export type TokenStorageStatusCardProps = {
  snapshot: TokenStorageSnapshot;
};

export const TokenStorageStatusCard = ({ snapshot }: TokenStorageStatusCardProps) => (
  <View style={styles.card}>
    <View style={styles.headerRow}>
      <View style={styles.headerCopy}>
        <Text style={styles.kicker}>Token Storage Adapter</Text>
        <Text style={styles.heading}>No credential storage is active</Text>
        <Text style={styles.helper}>{snapshot.summary}</Text>
      </View>
      <View style={styles.statusBadge}>
        <Text style={styles.statusValue}>{snapshot.label}</Text>
        <Text style={styles.statusLabel}>{snapshot.status.replace('_', ' ')}</Text>
      </View>
    </View>

    <View style={styles.grid}>
      <View style={styles.pill}>
        <Text style={styles.pillLabel}>Scope</Text>
        <Text style={styles.pillValue}>{snapshot.scope.replace('_', ' ')}</Text>
      </View>
      <View style={styles.pill}>
        <Text style={styles.pillLabel}>Stored token</Text>
        <Text style={styles.pillValue}>{formatBoolean(snapshot.hasStoredToken)}</Text>
      </View>
      <View style={styles.pill}>
        <Text style={styles.pillLabel}>Persist token</Text>
        <Text style={styles.pillValue}>{formatBoolean(snapshot.canPersistToken)}</Text>
      </View>
      <View style={styles.pill}>
        <Text style={styles.pillLabel}>Read token</Text>
        <Text style={styles.pillValue}>{formatBoolean(snapshot.canReadToken)}</Text>
      </View>
      <View style={styles.pill}>
        <Text style={styles.pillLabel}>Clear token</Text>
        <Text style={styles.pillValue}>{formatBoolean(snapshot.canClearToken)}</Text>
      </View>
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Required before token storage can unlock</Text>
      {snapshot.requiredGates.map((gate, index) => (
        <Text key={gate} style={styles.itemText}>{index + 1}. {gate}</Text>
      ))}
    </View>

    <View style={styles.boundaryBox}>
      <Text style={styles.boundaryTitle}>Boundary</Text>
      {snapshot.boundaryNotes.map((note) => (
        <Text key={note} style={styles.boundaryText}>• {note}</Text>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111827',
    borderColor: '#38bdf8',
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
    color: '#7dd3fc',
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
    color: '#d1d5db',
    fontSize: 13,
    lineHeight: 18,
  },
  statusBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#0c4a6e',
    borderColor: '#7dd3fc',
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 104,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  statusValue: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
  statusLabel: {
    color: '#bae6fd',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  grid: {
    gap: 8,
  },
  pill: {
    backgroundColor: '#1f2937',
    borderColor: '#075985',
    borderRadius: 14,
    borderWidth: 1,
    gap: 3,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  pillLabel: {
    color: '#bae6fd',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  pillValue: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  section: {
    backgroundColor: '#1f2937',
    borderRadius: 18,
    gap: 9,
    padding: 12,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '900',
  },
  itemText: {
    color: '#e5e7eb',
    fontSize: 12,
    lineHeight: 17,
  },
  boundaryBox: {
    backgroundColor: '#082f49',
    borderColor: '#7dd3fc',
    borderRadius: 18,
    borderWidth: 1,
    gap: 5,
    padding: 12,
  },
  boundaryTitle: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '900',
  },
  boundaryText: {
    color: '#e0f2fe',
    fontSize: 12,
    lineHeight: 17,
  },
});
