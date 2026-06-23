import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { SavedDraftSlot } from '../types';

type SavedDraftPinningCardProps = {
  slots: SavedDraftSlot[];
  onTogglePinnedSlot: (slotId: string) => void;
};

const formatSavedAt = (timestamp: string) => {
  const parsedDate = new Date(timestamp);
  return Number.isNaN(parsedDate.getTime()) ? timestamp : parsedDate.toLocaleString();
};

const slotDisplayTitle = (slot: SavedDraftSlot, index: number, total: number) =>
  slot.label?.trim() || `Slot #${total - index}`;

export const SavedDraftPinningCard = ({ onTogglePinnedSlot, slots }: SavedDraftPinningCardProps) => {
  const pinnedCount = slots.filter((slot) => slot.pinned).length;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>Draft Priority</Text>
          <Text style={styles.heading}>Pin important saved drafts</Text>
          <Text style={styles.helper}>
            Pinning keeps a saved draft near the top of the session list. It changes slot priority only; it never changes idea text, steering controls, approvals, exports, imports, or GitHub write state.
          </Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countValue}>{pinnedCount}</Text>
          <Text style={styles.countLabel}>pinned</Text>
        </View>
      </View>

      {slots.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.sectionTitle}>No saved slots to pin yet</Text>
          <Text style={styles.helperSmall}>Save an in-progress draft slot first, then pin the ones you want to keep near the top.</Text>
        </View>
      ) : (
        <View style={styles.slotList}>
          {slots.map((slot, index) => (
            <View key={slot.id} style={[styles.slotRow, slot.pinned && styles.slotRowPinned]}>
              <View style={styles.slotCopy}>
                <View style={styles.titleRow}>
                  <Text style={styles.slotTitle}>{slotDisplayTitle(slot, index, slots.length)}</Text>
                  <Text style={slot.pinned ? styles.pinnedPill : styles.unpinnedPill}>{slot.pinned ? 'Pinned' : 'Unpinned'}</Text>
                </View>
                <Text style={styles.slotMeta}>Position {index + 1}/{slots.length} · {formatSavedAt(slot.savedAt)}</Text>
                <Text numberOfLines={2} style={styles.slotIdea}>{slot.draftSnapshot.idea}</Text>
              </View>
              <Pressable accessibilityRole="button" onPress={() => onTogglePinnedSlot(slot.id)} style={slot.pinned ? styles.unpinButton : styles.pinButton}>
                <Text style={styles.buttonText}>{slot.pinned ? 'Unpin' : 'Pin'}</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111827',
    borderColor: '#a78bfa',
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
    color: '#ddd6fe',
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
  helperSmall: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 17,
  },
  countBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#4c1d95',
    borderRadius: 16,
    minWidth: 66,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  countValue: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '900',
  },
  countLabel: {
    color: '#ede9fe',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  emptyState: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    gap: 6,
    padding: 12,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '900',
  },
  slotList: {
    gap: 10,
  },
  slotRow: {
    alignItems: 'flex-start',
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    padding: 12,
  },
  slotRowPinned: {
    borderColor: '#c4b5fd',
  },
  slotCopy: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotTitle: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '900',
  },
  pinnedPill: {
    backgroundColor: '#5b21b6',
    borderRadius: 999,
    color: '#ede9fe',
    fontSize: 10,
    fontWeight: '900',
    paddingHorizontal: 8,
    paddingVertical: 4,
    textTransform: 'uppercase',
  },
  unpinnedPill: {
    backgroundColor: '#334155',
    borderRadius: 999,
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '900',
    paddingHorizontal: 8,
    paddingVertical: 4,
    textTransform: 'uppercase',
  },
  slotMeta: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 16,
  },
  slotIdea: {
    color: '#fef3c7',
    fontSize: 12,
    lineHeight: 17,
  },
  pinButton: {
    backgroundColor: '#5b21b6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  unpinButton: {
    backgroundColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  buttonText: {
    color: '#ede9fe',
    fontSize: 12,
    fontWeight: '900',
  },
});
