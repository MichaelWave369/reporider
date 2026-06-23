import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { summarizeStarterFileDrafts } from '../lib/starterFilePreview';
import type { StarterFilePreview } from '../types';

type StarterFilePreviewCardProps = {
  draftPreviews: StarterFilePreview[];
  generatedPreviews: StarterFilePreview[];
  onDraftContentChange: (path: string, content: string) => void;
  onResetAllDrafts: () => void;
  onResetFileDraft: (path: string) => void;
};

const previewLabel = (preview: StarterFilePreview) => `${preview.path} · ${preview.language} · ${preview.riskLevel}`;

export const StarterFilePreviewCard = ({
  draftPreviews,
  generatedPreviews,
  onDraftContentChange,
  onResetAllDrafts,
  onResetFileDraft,
}: StarterFilePreviewCardProps) => {
  const [activePath, setActivePath] = useState<string | null>(null);
  const selectedPreview = draftPreviews.find((preview) => preview.path === activePath) ?? draftPreviews[0];
  const generatedPreview = generatedPreviews.find((preview) => preview.path === selectedPreview.path) ?? selectedPreview;
  const draftSummary = useMemo(
    () => summarizeStarterFileDrafts(generatedPreviews, draftPreviews),
    [draftPreviews, generatedPreviews],
  );
  const selectedFileChanged = generatedPreview.content !== selectedPreview.content;
  const badgeLabel = draftSummary.editedCount > 0
    ? `${draftSummary.editedCount}/${draftSummary.totalFiles} edited`
    : `${draftSummary.totalFiles} files`;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>Starter Files</Text>
          <Text style={styles.heading}>Preview and edit the seed package</Text>
          <Text style={styles.helper}>
            Inspect or tweak every planned starter file before approval. Generated content stays separate from the rider-approved draft.
          </Text>
        </View>
        <View style={[styles.badge, draftSummary.editedCount > 0 && styles.badgeEdited]}>
          <Text style={styles.badgeText}>{badgeLabel}</Text>
        </View>
      </View>

      <View style={styles.fileRail}>
        {draftPreviews.map((preview) => {
          const selected = preview.path === selectedPreview.path;
          const generated = generatedPreviews.find((candidate) => candidate.path === preview.path);
          const changed = generated ? generated.content !== preview.content : false;

          return (
            <Pressable
              accessibilityLabel={`Preview ${preview.path}`}
              accessibilityRole="button"
              key={preview.path}
              onPress={() => setActivePath(preview.path)}
              style={({ pressed }) => [
                styles.fileChip,
                selected && styles.fileChipSelected,
                changed && styles.fileChipEdited,
                pressed && styles.fileChipPressed,
              ]}
            >
              <Text style={[styles.fileChipText, selected && styles.fileChipTextSelected]}>
                {preview.path}{changed ? ' *' : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.metaBox}>
        <View style={styles.metaHeader}>
          <Text style={styles.metaTitle}>{previewLabel(selectedPreview)}</Text>
          <Text style={[styles.changeBadge, selectedFileChanged && styles.changeBadgeEdited]}>
            {selectedFileChanged ? 'edited draft' : 'generated draft'}
          </Text>
        </View>
        <Text style={styles.metaText}>{selectedPreview.purpose}</Text>
        {draftSummary.editedCount > 0 ? (
          <Text style={styles.metaText}>
            Edited files: {draftSummary.editedPaths.join(', ')} · {draftSummary.totalEditedCharacters} drafted characters
          </Text>
        ) : null}
      </View>

      <TextInput
        accessibilityLabel={`Edit starter file ${selectedPreview.path}`}
        autoCapitalize="none"
        autoCorrect={false}
        multiline
        onChangeText={(content) => onDraftContentChange(selectedPreview.path, content)}
        scrollEnabled
        spellCheck={false}
        style={styles.editor}
        textAlignVertical="top"
        value={selectedPreview.content}
      />

      <View style={styles.actionRow}>
        <Pressable
          accessibilityRole="button"
          disabled={!selectedFileChanged}
          onPress={() => onResetFileDraft(selectedPreview.path)}
          style={({ pressed }) => [
            styles.secondaryButton,
            selectedFileChanged && styles.secondaryButtonActive,
            pressed && styles.buttonPressed,
            !selectedFileChanged && styles.buttonDisabled,
          ]}
        >
          <Text style={styles.secondaryButtonText}>Reset This File</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          disabled={draftSummary.editedCount === 0}
          onPress={onResetAllDrafts}
          style={({ pressed }) => [
            styles.secondaryButton,
            draftSummary.editedCount > 0 && styles.secondaryButtonActive,
            pressed && styles.buttonPressed,
            draftSummary.editedCount === 0 && styles.buttonDisabled,
          ]}
        >
          <Text style={styles.secondaryButtonText}>Reset All Drafts</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111827',
    borderColor: '#334155',
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
    gap: 8,
  },
  kicker: {
    color: '#67e8f9',
    fontSize: 13,
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
    fontSize: 14,
    lineHeight: 20,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#164e63',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  badgeEdited: {
    backgroundColor: '#854d0e',
  },
  badgeText: {
    color: '#ecfeff',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  fileRail: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fileChip: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  fileChipSelected: {
    backgroundColor: '#0891b2',
    borderColor: '#67e8f9',
  },
  fileChipEdited: {
    borderColor: '#facc15',
  },
  fileChipPressed: {
    opacity: 0.78,
  },
  fileChipText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '800',
  },
  fileChipTextSelected: {
    color: '#ecfeff',
  },
  metaBox: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    gap: 6,
    padding: 12,
  },
  metaHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  metaTitle: {
    color: '#e0f2fe',
    flex: 1,
    fontSize: 13,
    fontWeight: '900',
  },
  metaText: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 18,
  },
  changeBadge: {
    backgroundColor: '#1e293b',
    borderRadius: 999,
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 5,
    textTransform: 'uppercase',
  },
  changeBadgeEdited: {
    backgroundColor: '#854d0e',
    color: '#fef9c3',
  },
  editor: {
    backgroundColor: '#020617',
    borderColor: '#1e293b',
    borderRadius: 18,
    borderWidth: 1,
    color: '#dbeafe',
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
    maxHeight: 460,
    minHeight: 240,
    padding: 14,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  secondaryButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  secondaryButtonActive: {
    borderColor: '#67e8f9',
  },
  secondaryButtonText: {
    color: '#e0f2fe',
    fontSize: 13,
    fontWeight: '900',
  },
  buttonPressed: {
    opacity: 0.78,
  },
  buttonDisabled: {
    opacity: 0.42,
  },
});
