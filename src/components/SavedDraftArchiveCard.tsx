import { StyleSheet, Text, Pressable, View } from 'react-native';
import type { SavedDraftSlot } from '../types';

type SavedDraftArchiveCardProps = {
  activeSlots: SavedDraftSlot[];
  archivedSlots: SavedDraftSlot[];
  onDeleteSlot: (slotId: string) => void;
  onRestoreSlot: (slot: SavedDraftSlot) => void;
  onToggleArchivedSlot: (slotId: string) => void;
};

const formatSlotTitle = (slot: SavedDraftSlot, index: number) =>
  slot.label?.trim() || `Draft slot ${index + 1}`;

const formatSlotMeta = (slot: SavedDraftSlot) => [
  slot.pinned ? 'pinned' : 'unpinned',
  slot.archived ? 'archived' : 'active',
  new Date(slot.savedAt).toLocaleString(),
].join(' · ');

export const SavedDraftArchiveCard = ({
  activeSlots,
  archivedSlots,
  onDeleteSlot,
  onRestoreSlot,
  onToggleArchivedSlot,
}: SavedDraftArchiveCardProps) => (
  <View style={styles.card}>
    <View style={styles.headerRow}>
      <View style={styles.headerCopy}>
        <Text style={styles.kicker}>Draft Archive</Text>
        <Text style={styles.heading}>Hide low-priority draft slots without deleting them</Text>
        <Text style={styles.helper}>
          Archive changes only session visibility metadata. Draft snapshots, labels, pinned status, exports, and restore rules stay intact.
        </Text>
      </View>
      <View style={styles.countBadge}>
        <Text style={styles.countValue}>{archivedSlots.length}</Text>
        <Text style={styles.countLabel}>hidden</Text>
      </View>
    </View>

    {activeSlots.length > 0 ? (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active saved drafts</Text>
        <Text style={styles.helperSmall}>Archive a slot to remove it from the active save/restore console without deleting it.</Text>
        {activeSlots.map((slot, index) => (
          <View key={slot.id} style={styles.slotCard}>
            <Text style={styles.slotTitle}>{formatSlotTitle(slot, index)}</Text>
            <Text style={styles.slotMeta}>{formatSlotMeta(slot)}</Text>
            <Text numberOfLines={2} style={styles.slotIdea}>{slot.draftSnapshot.idea}</Text>
            <Pressable accessibilityRole="button" onPress={() => onToggleArchivedSlot(slot.id)} style={styles.archiveButton}>
              <Text style={styles.archiveButtonText}>Archive Slot</Text>
            </Pressable>
          </View>
        ))}
      </View>
    ) : null}

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Archived saved drafts</Text>
      {archivedSlots.length === 0 ? (
        <Text style={styles.helperSmall}>No archived draft slots yet. Archived slots stay session-only and can be returned to active when needed.</Text>
      ) : archivedSlots.map((slot, index) => (
        <View key={slot.id} style={styles.archivedSlotCard}>
          <Text style={styles.slotTitle}>{formatSlotTitle(slot, index)}</Text>
          <Text style={styles.slotMeta}>{formatSlotMeta(slot)}</Text>
          <Text numberOfLines={3} style={styles.slotIdea}>{slot.draftSnapshot.idea}</Text>
          <View style={styles.actionRow}>
            <Pressable accessibilityRole="button" onPress={() => onToggleArchivedSlot(slot.id)} style={styles.unarchiveButton}>
              <Text style={styles.unarchiveButtonText}>Unarchive</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => onRestoreSlot(slot)} style={styles.restoreButton}>
              <Text style={styles.restoreButtonText}>Restore Draft</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => onDeleteSlot(slot.id)} style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>Delete</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111827',
    borderColor: '#475569',
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
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  heading: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '900',
  },
  helper: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 18,
  },
  helperSmall: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 17,
  },
  countBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#7f1d1d',
    borderRadius: 16,
    minWidth: 62,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  countValue: {
    color: '#fecaca',
    fontSize: 20,
    fontWeight: '900',
  },
  countLabel: {
    color: '#fecaca',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '900',
  },
  slotCard: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    padding: 12,
  },
  archivedSlotCard: {
    backgroundColor: '#1f2937',
    borderColor: '#7f1d1d',
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
    padding: 12,
  },
  slotTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '900',
  },
  slotMeta: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
  },
  slotIdea: {
    color: '#dbeafe',
    fontSize: 12,
    lineHeight: 17,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  archiveButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#7f1d1d',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  archiveButtonText: {
    color: '#fecaca',
    fontSize: 12,
    fontWeight: '900',
  },
  unarchiveButton: {
    backgroundColor: '#14532d',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  unarchiveButtonText: {
    color: '#bbf7d0',
    fontSize: 12,
    fontWeight: '900',
  },
  restoreButton: {
    backgroundColor: '#1d4ed8',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  restoreButtonText: {
    color: '#dbeafe',
    fontSize: 12,
    fontWeight: '900',
  },
  deleteButton: {
    backgroundColor: '#450a0a',
    borderColor: '#991b1b',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  deleteButtonText: {
    color: '#fecaca',
    fontSize: 12,
    fontWeight: '900',
  },
});