import { StyleSheet, Text, View } from 'react-native';
import type { LiveModeState } from '../types';

const formatFlag = (enabled: boolean) => (enabled ? 'Available' : 'Blocked');

export type LiveModeStateCardProps = {
  state: LiveModeState;
};

export const LiveModeStateCard = ({ state }: LiveModeStateCardProps) => (
  <View style={styles.card}>
    <View style={styles.headerRow}>
      <View style={styles.headerCopy}>
        <Text style={styles.kicker}>Live Mode State</Text>
        <Text style={styles.heading}>Write-mode state machine</Text>
        <Text style={styles.helper}>{state.summary}</Text>
      </View>
      <View style={styles.statusBadge}>
        <Text style={styles.statusValue}>{state.label}</Text>
        <Text style={styles.statusLabel}>{state.status.replace('_', ' ')}</Text>
      </View>
    </View>

    <View style={styles.stateGrid}>
      <View style={styles.statePill}>
        <Text style={styles.stateLabel}>Arm live mode</Text>
        <Text style={styles.stateValue}>{formatFlag(state.canArmLiveMode)}</Text>
      </View>
      <View style={styles.statePill}>
        <Text style={styles.stateLabel}>Start write</Text>
        <Text style={styles.stateValue}>{formatFlag(state.canStartWrite)}</Text>
      </View>
      <View style={styles.statePill}>
        <Text style={styles.stateLabel}>Retry write</Text>
        <Text style={styles.stateValue}>{formatFlag(state.canRetryWrite)}</Text>
      </View>
      <View style={styles.statePill}>
        <Text style={styles.stateLabel}>Terminal state</Text>
        <Text style={styles.stateValue}>{state.isTerminal ? 'Yes' : 'No'}</Text>
      </View>
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Required before live mode can arm</Text>
      {state.requiredGates.map((gate, index) => (
        <Text key={gate} style={styles.gateText}>{index + 1}. {gate}</Text>
      ))}
    </View>

    <View style={styles.boundaryBox}>
      <Text style={styles.boundaryTitle}>Boundary notes</Text>
      {state.boundaryNotes.map((note) => (
        <Text key={note} style={styles.boundaryText}>• {note}</Text>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0f172a',
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
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 18,
  },
  statusBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#082f49',
    borderColor: '#38bdf8',
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 96,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  statusValue: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
  },
  statusLabel: {
    color: '#bae6fd',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  stateGrid: {
    gap: 8,
  },
  statePill: {
    backgroundColor: '#082f49',
    borderColor: '#0ea5e9',
    borderRadius: 14,
    borderWidth: 1,
    gap: 3,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  stateLabel: {
    color: '#bae6fd',
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
    backgroundColor: '#111827',
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
    backgroundColor: '#0c4a6e',
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
