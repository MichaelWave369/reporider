import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { buildReadmePreview } from '../lib/readmePreview';
import type { RepoPlan } from '../types';

type ReadmePreviewCardProps = {
  plan: RepoPlan;
};

const previewLineLimit = 28;

export const ReadmePreviewCard = ({ plan }: ReadmePreviewCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const readme = useMemo(() => buildReadmePreview(plan), [plan]);
  const readmeLines = readme.split('\n');
  const visibleReadme = expanded ? readme : readmeLines.slice(0, previewLineLimit).join('\n');
  const canExpand = readmeLines.length > previewLineLimit;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>File Preview</Text>
          <Text style={styles.heading}>Generated README.md</Text>
          <Text style={styles.helper}>
            Review the first README before the ride creates anything. This preview updates with the repo name, stack, visibility, files, and starter issues.
          </Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>local</Text>
        </View>
      </View>

      <View style={styles.previewBox}>
        <Text style={styles.previewText}>{visibleReadme}</Text>
        {!expanded && canExpand ? <Text style={styles.fadeText}>…</Text> : null}
      </View>

      {canExpand ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => setExpanded((current) => !current)}
          style={({ pressed }) => [styles.toggleButton, pressed && styles.toggleButtonPressed]}
        >
          <Text style={styles.toggleText}>{expanded ? 'Collapse README Preview' : 'Show Full README Preview'}</Text>
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
