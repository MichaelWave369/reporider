import { StyleSheet, Text, View } from 'react-native';
import type { AuthCapability } from '../types';

const formatCapability = (allowed: boolean) => (allowed ? 'Available' : 'Blocked');

export type AuthCapabilityCardProps = {
  capability: AuthCapability;
};

export const AuthCapabilityCard = ({ capability }: AuthCapabilityCardProps) => (
  <View style={styles.card}>
    <View style={styles.headerRow}>
      <View style={styles.headerCopy}>
        <Text style={styles.kicker}>Auth Capability</Text>
        <Text style={styles.heading}>Current GitHub access state</Text>
        <Text style={styles.helper}>{capability.summary}</Text>
      </View>
      <View style={styles.statusBadge}>
        <Text style={styles.statusValue}>{capability.label}</Text>
        <Text style={styles.statusLabel}>{capability.status.replace('_', ' ')}</Text>
      </View>
    </View>

    <View style={styles.capabilityGrid}>
      <View style={styles.capabilityPill}>
        <Text style={styles.capabilityLabel}>OAuth request</Text>
        <Text style={styles.capabilityValue}>{formatCapability(capability.canRequestOAuth)}</Text>
      </View>
      <View style={styles.capabilityPill}>
        <Text style={styles.capabilityLabel}>Token storage</Text>
        <Text style={styles.capabilityValue}>{formatCapability(capability.canStoreToken)}</Text>
      </View>
      <View style={styles.capabilityPill}>
        <Text style={styles.capabilityLabel}>Live writes</Text>
        <Text style={styles.capabilityValue}>{formatCapability(capability.canAttemptLiveWrites)}</Text>
      </View>
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Required before auth can progress</Text>
      {capability.requiredGates.map((gate, index) => (
        <Text key={gate} style={styles.gateText}>{index + 1}. {gate}</Text>
      ))}
    </View>

    <View style={styles.boundaryBox}>
      <Text style={styles.boundaryTitle}>Boundary</Text>
      <Text style={styles.boundaryText}>
        This card reports capability only. It does not start OAuth, store credentials, unlock live mode, or grant write authority.
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111827',
    borderColor: '#a78bfa',
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
    color: '#c4b5fd',
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
    backgroundColor: '#1f2937',
    borderColor: '#a78bfa',
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 94,
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
    color: '#ddd6fe',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  capabilityGrid: {
    gap: 8,
  },
  capabilityPill: {
    backgroundColor: '#1f2937',
    borderColor: '#4c1d95',
    borderRadius: 14,
    borderWidth: 1,
    gap: 3,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  capabilityLabel: {
    color: '#ddd6fe',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  capabilityValue: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '900',
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
  gateText: {
    color: '#e5e7eb',
    fontSize: 12,
    lineHeight: 17,
  },
  boundaryBox: {
    backgroundColor: '#2e1065',
    borderColor: '#c4b5fd',
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
    color: '#ede9fe',
    fontSize: 12,
    lineHeight: 17,
  },
});
