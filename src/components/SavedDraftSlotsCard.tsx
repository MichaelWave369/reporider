import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { buildMarkdownSavedDraftSnapshot } from '../lib/savedDraftMarkdown';
import type { SavedDraftSlot } from '../types';

type SavedDraftSlotsCardProps = {
  slots: SavedDraftSlot[];
  onClearSlots: () => void;
  onDeleteSlot: (slotId: string) => void;
  onRestoreSlot: (slot: SavedDraftSlot) => void;
  onSaveCurrentDraft: () => void;
};

const countLines = (content: string) => content.split('\n').length;

const formatSavedAt = (timestamp: string) => {
  const parsedDate = new Date(timestamp);

  if (Number.isNaN(parsedDate.getTime())) {
    return timestamp;
  }

  return parsedDate.toLocaleString();
};

const summarizeOverrides = (slot: SavedDraftSlot) => {
  const { planOverrides } = slot.draftSnapshot;
  const values = [
    planOverrides.name ? `name: ${planOverrides.name}` : null,
    planOverrides.visibility ? `visibility: ${planOverrides.visibility}` : null,
    planOverrides.stack ? `stack: ${planOverrides.stack}` : null,
    typeof planOverrides.issueCount === 'number' ? `issues: ${planOverrides.issueCount}` : null,
  ].filter(Boolean);

  return values.length > 0 ? values.join(' · ') : 'No steering overrides saved';
};

export const SavedDraftSlotsCard = ({
  onClearSlots,
  onDeleteSlot,
  onRestoreSlot,
  onSaveCurrentDraft,
  slots,
}: SavedDraftSlotsCardProps) => {
  const [exportExpanded, setExportExpanded] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const selectedSlot = useMemo(
    () => slots.find((slot) => slot.id === selectedSlotId) ?? slots[0],
    [selectedSlotId, slots],
  );
  const markdownSnapshot = useMemo(
    () => (selectedSlot ? buildMarkdownSavedDraftSnapshot(selectedSlot) : ''),
    [selectedSlot],
  );

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>Saved Drafts</Text>
          <Text style={styles.heading}>Park an in-progress ride</Text>
          <Text style={styles.helper}>
            Save the current idea and steering controls before create. Slots are session-only and do not include edited files, edited issues, approvals, or create results.
          </Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countValue}>{slots.length}</Text>
          <Text style={styles.countLabel}>slots</Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={onSaveCurrentDraft}
        style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
      >
        <Text style={styles.primaryButtonText}>Save Current Draft Slot</Text>
      </Pressable>

      {slots.length === 0 || !selectedSlot ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No saved draft slots yet</Text>
          <Text style={styles.emptyCopy}>
            Save the current idea/controls when you want to park a ride before approving files or creating a mock repo.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.slotList}>
            {slots.map((slot, index) => {
              const selected = slot.id === selectedSlot.id;

              return (
                <Pressable
                  accessibilityRole="button"
                  key={slot.id}
                  onPress={() => {
                    setSelectedSlotId(slot.id);
                    setExportExpanded(false);
                  }}
                  style={({ pressed }) => [
                    styles.slotButton,
                    selected && styles.slotButtonSelected,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.slotTitle}>Slot #{slots.length - index}</Text>
                  <Text style={styles.slotMeta}>{formatSavedAt(slot.savedAt)}</Text>
                  <Text numberOfLines={2} style={styles.slotIdea}>{slot.draftSnapshot.idea}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.selectedCard}>
            <Text style={styles.sectionTitle}>Selected draft slot</Text>
            <Text style={styles.ideaPreview}>{selectedSlot.draftSnapshot.idea}</Text>
            <Text style={styles.overrideSummary}>{summarizeOverrides(selectedSlot)}</Text>
            <Text style={styles.restoreHelper}>
              Restore reloads the idea and steering controls only. File drafts, issue drafts, approvals, ledger state, and create state reset for a fresh review.
            </Text>

            <View style={styles.exportCard}>
              <View style={styles.exportHeaderRow}>
                <View style={styles.headerCopy}>
                  <Text style={styles.exportKicker}>Draft Export</Text>
                  <Text style={styles.exportTitle}>Copy-ready planning snapshot</Text>
                  <Text style={styles.exportHelper}>
                    Export the saved idea and steering controls before create. This is not an approval receipt.
                  </Text>
                </View>
                <View style={styles.exportBadge}>
                  <Text style={styles.exportBadgeValue}>{countLines(markdownSnapshot)}</Text>
                  <Text style={styles.exportBadgeLabel}>lines</Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaPill}>{markdownSnapshot.length} chars</Text>
                <Text style={styles.metaPill}>pre-create</Text>
                <Text style={styles.metaPill}>session-only</Text>
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={() => setExportExpanded((current) => !current)}
                style={({ pressed }) => [styles.exportToggle, pressed && styles.buttonPressed]}
              >
                <Text style={styles.exportToggleText}>{exportExpanded ? 'Hide Saved Draft Markdown' : 'Show Saved Draft Markdown'}</Text>
              </Pressable>

              {exportExpanded ? (
                <View style={styles.exportBox}>
                  <Text style={styles.exportHelpText}>Tap into the box, then use your device/browser select and copy controls.</Text>
                  <TextInput
                    editable={false}
                    multiline
                    selectTextOnFocus
                    style={styles.markdownInput}
                    value={markdownSnapshot}
                  />
                </View>
              ) : null}
            </View>

            <View style={styles.actionRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => onRestoreSlot(selectedSlot)}
                style={({ pressed }) => [styles.restoreButton, pressed && styles.buttonPressed]}
              >
                <Text style={styles.restoreButtonText}>Restore Slot as Draft</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => onDeleteSlot(selectedSlot.id)}
                style={({ pressed }) => [styles.deleteButton, pressed && styles.buttonPressed]}
              >
                <Text style={styles.deleteButtonText}>Delete Slot</Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={onClearSlots}
            style={({ pressed }) => [styles.clearButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.clearButtonText}>Clear Saved Draft Slots</Text>
          </Pressable>
        </>
      )}
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
    color: '#fde68a',
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
    backgroundColor: '#713f12',
    borderRadius: 16,
    minWidth: 62,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  countValue: {
    color: '#fefce8',
    fontSize: 18,
    fontWeight: '900',
  },
  countLabel: {
    color: '#fef3c7',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  primaryButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#ca8a04',
    borderColor: '#fde047',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '900',
  },
  emptyState: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    gap: 6,
    padding: 12,
  },
  emptyTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '900',
  },
  emptyCopy: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 17,
  },
  slotList: {
    gap: 8,
  },
  slotButton: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  slotButtonSelected: {
    borderColor: '#fde047',
  },
  slotTitle: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '900',
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
  ideaPreview: {
    color: '#fefce8',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  overrideSummary: {
    color: '#fde68a',
    fontSize: 12,
    lineHeight: 17,
  },
  restoreHelper: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 17,
  },
  exportCard: {
    backgroundColor: '#020617',
    borderColor: '#38bdf8',
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  exportHeaderRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  exportKicker: {
    color: '#7dd3fc',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  exportTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '900',
  },
  exportHelper: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 17,
  },
  exportBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#075985',
    borderRadius: 14,
    minWidth: 56,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  exportBadgeValue: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '900',
  },
  exportBadgeLabel: {
    color: '#bae6fd',
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaPill: {
    backgroundColor: '#1e293b',
    borderRadius: 999,
    color: '#e0f2fe',
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  exportToggle: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#38bdf8',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  exportToggleText: {
    color: '#082f49',
    fontSize: 12,
    fontWeight: '900',
  },
  exportBox: {
    gap: 8,
  },
  exportHelpText: {
    color: '#bae6fd',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  markdownInput: {
    backgroundColor: '#020617',
    borderColor: '#1e293b',
    borderRadius: 14,
    borderWidth: 1,
    color: '#e2e8f0',
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 16,
    minHeight: 220,
    padding: 12,
    textAlignVertical: 'top',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  restoreButton: {
    alignItems: 'center',
    backgroundColor: '#0369a1',
    borderColor: '#38bdf8',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  restoreButtonText: {
    color: '#f0f9ff',
    fontSize: 12,
    fontWeight: '900',
  },
  deleteButton: {
    alignItems: 'center',
    backgroundColor: '#7f1d1d',
    borderColor: '#fca5a5',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  deleteButtonText: {
    color: '#fee2e2',
    fontSize: 12,
    fontWeight: '900',
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
  clearButtonText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '900',
  },
  buttonPressed: {
    opacity: 0.82,
  },
});
