import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { buildStarterFilePreviews } from '../lib/starterFilePreview';
import type { RepoPlan, StarterFilePreview } from '../types';

type StarterFilePreviewCardProps = {
  plan: RepoPlan;
};

const previewLineLimit = 30;

const previewLabel = (preview: StarterFilePreview) => `${preview.path} · ${preview.language} · ${preview.riskLevel}`;

export const StarterFilePreviewCard = ({ plan }: StarterFilePreviewCardProps) => {
  const [activePath, setActivePath] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const previews = useMemo(() => buildStarterFilePreviews(plan), [plan]);
  const selectedPreview = previews.find((preview) => preview.path === activePath) ?? previews[0];
  const previewLines = selectedPreview.content.split('\n');
  const visibleContent = expanded
    ? selectedPreview.content
    : previewLines.slice(0, previewLineLimit).join('\n');
  const canExpand = previewLines.length > previewLineLimit;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>Starter Files</Text>
          <Text style={styles.heading}>Preview the seed package</Text>
          <Text style={styles.helper}>
            Inspect every planned starter file before approval. These previews are deterministic, local, and tied to the current repo plan.
          </Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{previews.length} files</Text>
        </View>
      </View>

      <View style={styles.fileRail}>
        {previews.map((preview) => {
          const selected = preview.path === selectedPreview.path;

          return (
            <Pressable
              accessibilityLabel={`Preview ${preview.path}`}
              accessibilityRole="button"
              key={preview.path}
              onPress={() => {
                setActivePath(preview.path);
                setExpanded(false);
              }}
              style={({ pressed }) => [
                styles.fileChip,
                selected && styles.fileChipSelected,
                pressed && styles.fileChipPressed,
              ]}
            >
              <Text style={[styles.fileChipText, selected && styles.fileChipTextSelected]}>{preview.path}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.metaBox}>
        <Text style={styles.metaTitle}>{previewLabel(selectedPreview)}</Text>
        <Text style={styles.metaText}>{selectedPreview.purpose}</Text>
      </View>

      <View style={styles.previewBox}>
        <Text style={styles.previewText}>{visibleContent}</Text>
        {!expanded && canExpand ? <Text style={styles.fadeText}>…</Text> : null}
      </View>

      {canExpand ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => setExpanded((current) => !current)}
          style={({ pressed }) => [styles.toggleButton, pressed && styles.toggleButtonPressed]}
        >
          <Text style={styles.toggleText}>{expanded ? 'Collapse File Preview' : 'Show Full File Preview'}</Text>
        </Pressable>
      ) : null}
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
  metaTitle: {
    color: '#e0f2fe',
    fontSize: 13,
    fontWeight: '900',
  },
  metaText: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 18,
  },
  previewBox: {
    backgroundColor: '#020617',
    borderColor: '#1e293b',
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  previewText: {
    color: '#dbeafe',
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
  fadeText: {
    color: '#67e8f9',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  toggleButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  toggleButtonPressed: {
    opacity: 0.78,
  },
  toggleText: {
    color: '#e0f2fe',
    fontSize: 13,
    fontWeight: '900',
  },
});