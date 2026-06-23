import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { RideReceiptExportCard } from './RideReceiptExportCard';
import type { RideHistoryEntry } from '../types';

type RideHistoryCardProps = {
  history: RideHistoryEntry[];
  onClearHistory: () => void;
};

const formatCompletedAt = (timestamp: string) => {
  const parsedDate = new Date(timestamp);

  if (Number.isNaN(parsedDate.getTime())) {
    return timestamp;
  }

  return parsedDate.toLocaleString();
};

export const RideHistoryCard = ({ history, onClearHistory }: RideHistoryCardProps) => {
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null);
  const selectedRide = useMemo(
    () => history.find((entry) => entry.id === selectedRideId) ?? history[0],
    [history, selectedRideId],
  );

  if (history.length === 0 || !selectedRide) {
    return null;
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>Ride History</Text>
          <Text style={styles.heading}>Session receipts</Text>
          <Text style={styles.helper}>
            Recent mock rides stay available while the app is open. They are not persisted to device storage yet.
          </Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countValue}>{history.length}</Text>
          <Text style={styles.countLabel}>rides</Text>
        </View>
      </View>

      <View style={styles.rideList}>
        {history.map((entry, index) => {
          const selected = entry.id === selectedRide.id;

          return (
            <Pressable
              accessibilityRole="button"
              key={entry.id}
              onPress={() => setSelectedRideId(entry.id)}
              style={({ pressed }) => [
                styles.rideButton,
                selected && styles.rideButtonSelected,
                pressed && styles.rideButtonPressed,
              ]}
            >
              <Text style={styles.rideTitle}>#{history.length - index} · {entry.result.repositoryUrl}</Text>
              <Text style={styles.rideMeta}>{formatCompletedAt(entry.completedAt)}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.selectedCard}>
        <Text style={styles.sectionTitle}>Selected ride</Text>
        <Text style={styles.selectedUrl}>{selectedRide.result.repositoryUrl}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaPill}>{selectedRide.result.summary.writeArtifactCount} artifacts</Text>
          <Text style={styles.metaPill}>{selectedRide.result.summary.approvedFileCount} files</Text>
          <Text style={styles.metaPill}>{selectedRide.result.summary.approvedIssueCount} issues</Text>
          <Text style={styles.metaPill}>{selectedRide.result.summary.receiptCount} receipts</Text>
        </View>
        <Text style={styles.selectedDetail}>
          {selectedRide.result.summary.editedFileCount} edited files · {selectedRide.result.summary.editedIssueCount} edited issues
        </Text>
        <RideReceiptExportCard result={selectedRide.result} />
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={onClearHistory}
        style={({ pressed }) => [styles.clearButton, pressed && styles.clearButtonPressed]}
      >
        <Text style={styles.clearButtonText}>Clear Session Ride History</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111827',
    borderColor: '#475569',
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
    color: '#c4b5fd',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  heading: {
    color: '#f8fafc',
    fontSize: 21,
    fontWeight: '900',
  },
  helper: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 18,
  },
  countBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#312e81',
    borderRadius: 16,
    minWidth: 62,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  countValue: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '900',
  },
  countLabel: {
    color: '#ddd6fe',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  rideList: {
    gap: 8,
  },
  rideButton: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  rideButtonSelected: {
    borderColor: '#a78bfa',
  },
  rideButtonPressed: {
    opacity: 0.82,
  },
  rideTitle: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  rideMeta: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 16,
  },
  selectedCard: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    gap: 10,
    padding: 12,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '900',
  },
  selectedUrl: {
    color: '#e0f2fe',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaPill: {
    backgroundColor: '#312e81',
    borderRadius: 999,
    color: '#ede9fe',
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  selectedDetail: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 17,
  },
  clearButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#1e293b',
    borderColor: '#475569',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  clearButtonPressed: {
    opacity: 0.82,
  },
  clearButtonText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '900',
  },
});