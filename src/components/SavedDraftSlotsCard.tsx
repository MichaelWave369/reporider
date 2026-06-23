import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  buildMarkdownSavedDraftSnapshot,
  parseMarkdownSavedDraftSnapshot,
} from '../lib/savedDraftMarkdown';
import type { RepoPlanOverrides, RideDraftSnapshot, SavedDraftSlot } from '../types';

type SavedDraftSlotsCardProps = {
  slots: SavedDraftSlot[];
  onClearSlots: () => void;
  onDeleteSlot: (slotId: string) => void;
  onDuplicateSlot: (slot: SavedDraftSlot) => void;
  onImportSnapshot: (snapshot: RideDraftSnapshot) => void;
  onRenameSlot: (slotId: string, label: string) => void;
  onRestoreSlot: (slot: SavedDraftSlot) => void;
  onSaveCurrentDraft: () => void;
  onSaveImportPreview: (snapshot: RideDraftSnapshot) => void;
};

const countLines = (content: string) => content.split('\n').length;

const formatSavedAt = (timestamp: string) => {
  const parsedDate = new Date(timestamp);
  return Number.isNaN(parsedDate.getTime()) ? timestamp : parsedDate.toLocaleString();
};

const summarizeOverrides = (overrides: RepoPlanOverrides) => {
  const values = [
    overrides.name ? `name: ${overrides.name}` : null,
    overrides.visibility ? `visibility: ${overrides.visibility}` : null,
    overrides.stack ? `stack: ${overrides.stack}` : null,
    typeof overrides.issueCount === 'number' ? `issues: ${overrides.issueCount}` : null,
  ].filter(Boolean);

  return values.length > 0 ? values.join(' · ') : 'No steering overrides saved';
};

const slotDisplayTitle = (slot: SavedDraftSlot, index: number, total: number) =>
  slot.label?.trim() || `Slot #${total - index}`;

export const SavedDraftSlotsCard = ({
  onClearSlots,
  onDeleteSlot,
  onDuplicateSlot,
  onImportSnapshot,
  onRenameSlot,
  onRestoreSlot,
  onSaveCurrentDraft,
  onSaveImportPreview,
  slots,
}: SavedDraftSlotsCardProps) => {
  const [exportExpanded, setExportExpanded] = useState(false);
  const [importExpanded, setImportExpanded] = useState(false);
  const [importMarkdown, setImportMarkdown] = useState('');
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<RideDraftSnapshot | null>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [renameLabel, setRenameLabel] = useState('');
  const [renameMessage, setRenameMessage] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const selectedSlot = useMemo(
    () => slots.find((slot) => slot.id === selectedSlotId) ?? slots[0],
    [selectedSlotId, slots],
  );
  const selectedSlotIndex = selectedSlot ? slots.findIndex((slot) => slot.id === selectedSlot.id) : -1;
  const markdownSnapshot = useMemo(
    () => (selectedSlot ? buildMarkdownSavedDraftSnapshot(selectedSlot) : ''),
    [selectedSlot],
  );

  useEffect(() => {
    setRenameLabel(selectedSlot?.label ?? '');
    setRenameMessage(null);
  }, [selectedSlot?.id, selectedSlot?.label]);

  const resetImportState = () => {
    setImportMessage(null);
    setImportPreview(null);
    setImportStatus('idle');
  };

  const previewImport = () => {
    const result = parseMarkdownSavedDraftSnapshot(importMarkdown);

    if (!result.ok) {
      setImportPreview(null);
      setImportStatus('error');
      setImportMessage(result.error);
      return;
    }

    setImportPreview(result.draftSnapshot);
    setImportStatus('success');
    setImportMessage('Import preview ready. Review the extracted idea and steering controls before saving or restoring.');
  };

  const saveImportPreview = () => {
    if (!importPreview) {
      setImportStatus('error');
      setImportMessage('Preview the saved draft before saving it as a session slot.');
      return;
    }

    onSaveImportPreview(importPreview);
    setImportStatus('success');
    setImportMessage('Import preview saved as a session draft slot. Current editor was not changed.');
  };

  const restoreImportPreview = () => {
    if (!importPreview) {
      setImportStatus('error');
      setImportMessage('Preview the saved draft before restoring it as a new draft.');
      return;
    }

    onImportSnapshot(importPreview);
    setImportStatus('success');
    setImportMessage('Preview restored as a new draft. Review gates were reset.');
    setImportMarkdown('');
    setImportPreview(null);
  };

  const saveSelectedLabel = () => {
    if (!selectedSlot) return;
    onRenameSlot(selectedSlot.id, renameLabel);
    setRenameMessage(renameLabel.trim() ? 'Slot label saved.' : 'Slot label cleared.');
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>Saved Drafts</Text>
          <Text style={styles.heading}>Park, branch, label, export, or import drafts</Text>
          <Text style={styles.helper}>
            Session-only draft slots store idea and steering controls only. Duplicate creates a fresh slot for branching without touching the original.
          </Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countValue}>{slots.length}</Text>
          <Text style={styles.countLabel}>slots</Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <Pressable accessibilityRole="button" onPress={onSaveCurrentDraft} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Save Current Draft Slot</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setImportExpanded((current) => !current);
            resetImportState();
          }}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>{importExpanded ? 'Hide Import' : 'Import Markdown'}</Text>
        </Pressable>
      </View>

      {importExpanded ? (
        <View style={styles.importCard}>
          <Text style={styles.sectionTitle}>Import saved draft Markdown</Text>
          <Text style={styles.helperSmall}>
            Paste a RepoRider saved draft export, preview the extracted idea and controls, then save that preview as a slot or restore it after review.
          </Text>
          <TextInput
            multiline
            onChangeText={(value) => {
              setImportMarkdown(value);
              resetImportState();
            }}
            placeholder="Paste # RepoRider Saved Draft Snapshot here..."
            placeholderTextColor="#64748b"
            style={styles.importInput}
            value={importMarkdown}
          />
          <View style={styles.metaRow}>
            <Text style={styles.metaPill}>{countLines(importMarkdown || ' ')} lines</Text>
            <Text style={styles.metaPill}>{importMarkdown.length} chars</Text>
            <Text style={styles.metaPill}>preview required</Text>
          </View>
          {importMessage ? (
            <Text style={importStatus === 'error' ? styles.errorMessage : styles.successMessage}>{importMessage}</Text>
          ) : null}
          {importPreview ? (
            <View style={styles.previewCard}>
              <Text style={styles.previewKicker}>Import Preview</Text>
              <Text style={styles.ideaPreview}>{importPreview.idea || 'No idea text imported.'}</Text>
              <Text style={styles.overrideSummary}>{summarizeOverrides(importPreview.planOverrides)}</Text>
              <Text style={styles.helperSmall}>Saving parks this preview as a session slot. Restoring reloads planning inputs only and resets all review gates.</Text>
            </View>
          ) : null}
          <View style={styles.actionRow}>
            <Pressable accessibilityRole="button" onPress={previewImport} style={styles.importButton}>
              <Text style={styles.importButtonText}>Preview Import</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={!importPreview}
              onPress={saveImportPreview}
              style={[styles.secondaryButton, !importPreview && styles.disabledButton]}
            >
              <Text style={styles.secondaryButtonText}>Save Preview as Slot</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={!importPreview}
              onPress={restoreImportPreview}
              style={[styles.restoreButton, !importPreview && styles.disabledButton]}
            >
              <Text style={styles.restoreButtonText}>Restore Preview as New Draft</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {slots.length === 0 || !selectedSlot ? (
        <View style={styles.emptyState}>
          <Text style={styles.sectionTitle}>No saved draft slots yet</Text>
          <Text style={styles.helperSmall}>Save the current idea and steering controls when you want to park or branch a ride before approval.</Text>
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
                  style={[styles.slotButton, selected && styles.slotButtonSelected]}
                >
                  <Text style={styles.slotTitle}>{slotDisplayTitle(slot, index, slots.length)}</Text>
                  <Text style={styles.slotMeta}>{slot.label ? 'custom label' : 'unlabeled session slot'} · {formatSavedAt(slot.savedAt)}</Text>
                  <Text numberOfLines={2} style={styles.slotIdea}>{slot.draftSnapshot.idea}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.selectedCard}>
            <Text style={styles.sectionTitle}>Selected draft slot</Text>
            <Text style={styles.slotTitle}>{slotDisplayTitle(selectedSlot, selectedSlotIndex, slots.length)}</Text>
            <Text style={styles.ideaPreview}>{selectedSlot.draftSnapshot.idea}</Text>
            <Text style={styles.overrideSummary}>{summarizeOverrides(selectedSlot.draftSnapshot.planOverrides)}</Text>
            <Text style={styles.helperSmall}>Restore reloads planning inputs only. Duplicate creates a new slot from the same safe snapshot and does not change the current editor.</Text>

            <View style={styles.renameCard}>
              <Text style={styles.previewKicker}>Slot Label</Text>
              <Text style={styles.helperSmall}>Add a short session label. Renaming changes only slot metadata.</Text>
              <TextInput
                onChangeText={setRenameLabel}
                placeholder="Example: Camping app v2"
                placeholderTextColor="#64748b"
                style={styles.renameInput}
                value={renameLabel}
              />
              {renameMessage ? <Text style={styles.successMessage}>{renameMessage}</Text> : null}
              <View style={styles.actionRow}>
                <Pressable accessibilityRole="button" onPress={saveSelectedLabel} style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>Save Slot Label</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setRenameLabel('');
                    onRenameSlot(selectedSlot.id, '');
                    setRenameMessage('Slot label cleared.');
                  }}
                  style={styles.clearLabelButton}
                >
                  <Text style={styles.clearButtonText}>Clear Label</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.exportCard}>
              <View style={styles.headerRow}>
                <View style={styles.headerCopy}>
                  <Text style={styles.previewKicker}>Draft Export</Text>
                  <Text style={styles.sectionTitle}>Copy-ready planning snapshot</Text>
                  <Text style={styles.helperSmall}>This pre-create export is not an approval receipt.</Text>
                </View>
                <View style={styles.countBadgeBlue}>
                  <Text style={styles.countValue}>{countLines(markdownSnapshot)}</Text>
                  <Text style={styles.countLabel}>lines</Text>
                </View>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaPill}>{markdownSnapshot.length} chars</Text>
                <Text style={styles.metaPill}>pre-create</Text>
                <Text style={styles.metaPill}>session-only</Text>
                <Text style={styles.metaPill}>{selectedSlot.label ? 'labeled' : 'unlabeled'}</Text>
              </View>
              <Pressable accessibilityRole="button" onPress={() => setExportExpanded((current) => !current)} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>{exportExpanded ? 'Hide Saved Draft Markdown' : 'Show Saved Draft Markdown'}</Text>
              </Pressable>
              {exportExpanded ? (
                <TextInput editable={false} multiline selectTextOnFocus style={styles.markdownInput} value={markdownSnapshot} />
              ) : null}
            </View>

            <View style={styles.actionRow}>
              <Pressable accessibilityRole="button" onPress={() => onRestoreSlot(selectedSlot)} style={styles.restoreButton}>
                <Text style={styles.restoreButtonText}>Restore Slot as Draft</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => onDuplicateSlot(selectedSlot)} style={styles.duplicateButton}>
                <Text style={styles.duplicateButtonText}>Duplicate Slot</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => onDeleteSlot(selectedSlot.id)} style={styles.deleteButton}>
                <Text style={styles.deleteButtonText}>Delete Slot</Text>
              </Pressable>
            </View>
          </View>

          <Pressable accessibilityRole="button" onPress={onClearSlots} style={styles.clearButton}>
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
  helperSmall: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 17,
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
  countBadgeBlue: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#075985',
    borderRadius: 14,
    minWidth: 56,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  countValue: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '900',
  },
  countLabel: {
    color: '#fef3c7',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  primaryButton: {
    alignItems: 'center',
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
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#164e63',
    borderColor: '#67e8f9',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: '#e0f2fe',
    fontSize: 12,
    fontWeight: '900',
  },
  importCard: {
    backgroundColor: '#020617',
    borderColor: '#22c55e',
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  importInput: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderRadius: 14,
    borderWidth: 1,
    color: '#f8fafc',
    minHeight: 150,
    padding: 12,
    textAlignVertical: 'top',
  },
  previewCard: {
    backgroundColor: '#052e16',
    borderColor: '#22c55e',
    borderRadius: 14,
    borderWidth: 1,
    gap: 7,
    padding: 12,
  },
  previewKicker: {
    color: '#86efac',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  importButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#15803d',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  importButtonText: {
    color: '#dcfce7',
    fontSize: 12,
    fontWeight: '900',
  },
  errorMessage: {
    color: '#fecaca',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
  },
  successMessage: {
    color: '#bbf7d0',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
  },
  emptyState: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    gap: 6,
    padding: 12,
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
  renameCard: {
    backgroundColor: '#020617',
    borderColor: '#facc15',
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  renameInput: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderRadius: 14,
    borderWidth: 1,
    color: '#f8fafc',
    padding: 12,
  },
  clearLabelButton: {
    backgroundColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  exportCard: {
    backgroundColor: '#020617',
    borderColor: '#38bdf8',
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    padding: 12,
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
  markdownInput: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderRadius: 14,
    borderWidth: 1,
    color: '#f8fafc',
    fontFamily: 'monospace',
    minHeight: 220,
    padding: 12,
    textAlignVertical: 'top',
  },
  restoreButton: {
    backgroundColor: '#0369a1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  restoreButtonText: {
    color: '#e0f2fe',
    fontSize: 12,
    fontWeight: '900',
  },
  duplicateButton: {
    backgroundColor: '#4c1d95',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  duplicateButtonText: {
    color: '#ede9fe',
    fontSize: 12,
    fontWeight: '900',
  },
  deleteButton: {
    backgroundColor: '#7f1d1d',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  deleteButtonText: {
    color: '#fee2e2',
    fontSize: 12,
    fontWeight: '900',
  },
  clearButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  clearButtonText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '900',
  },
  disabledButton: {
    opacity: 0.45,
  },
});