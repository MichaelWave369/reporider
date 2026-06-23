import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { buildMarkdownRideReceipt } from '../lib/rideReceiptMarkdown';
import type { GithubCreateRepoResult } from '../types';

type RideReceiptExportCardProps = {
  result: GithubCreateRepoResult;
};

const countLines = (content: string) => content.split('\n').length;

export const RideReceiptExportCard = ({ result }: RideReceiptExportCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const markdownReceipt = useMemo(() => buildMarkdownRideReceipt(result), [result]);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>Export Receipt</Text>
          <Text style={styles.heading}>Copy-ready Markdown</Text>
          <Text style={styles.helper}>
            Share this mock ride summary in notes, a PR, an issue, or a handoff. It is generated from the same typed result shown above.
          </Text>
        </View>
        <View style={styles.statBadge}>
          <Text style={styles.statValue}>{countLines(markdownReceipt)}</Text>
          <Text style={styles.statLabel}>lines</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaPill}>{markdownReceipt.length} chars</Text>
        <Text style={styles.metaPill}>{result.summary.writeArtifactCount} artifacts</Text>
        <Text style={styles.metaPill}>{result.summary.receiptCount} receipts</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => setExpanded((current) => !current)}
        style={({ pressed }) => [styles.toggleButton, pressed && styles.toggleButtonPressed]}
      >
        <Text style={styles.toggleText}>{expanded ? 'Hide Markdown Receipt' : 'Show Markdown Receipt'}</Text>
      </Pressable>

      {expanded ? (
        <View style={styles.exportBox}>
          <Text style={styles.exportHelp}>Tap into the box, then use your device/browser select and copy controls.</Text>
          <TextInput
            editable={false}
            multiline
            selectTextOnFocus
            style={styles.markdownInput}
            value={markdownReceipt}
          />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0f172a',
    borderColor: '#38bdf8',
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  headerRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  headerCopy: {
    flex: 1,
    gap: 6,
  },
  kicker: {
    color: '#7dd3fc',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heading: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '900',
  },
  helper: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 17,
  },
  statBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#075985',
    borderRadius: 16,
    minWidth: 62,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  statValue: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '900',
  },
  statLabel: {
    color: '#bae6fd',
    fontSize: 10,
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
  toggleButton: {
    alignItems: 'center',
    backgroundColor: '#38bdf8',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  toggleButtonPressed: {
    opacity: 0.82,
  },
  toggleText: {
    color: '#082f49',
    fontSize: 13,
    fontWeight: '900',
  },
  exportBox: {
    gap: 8,
  },
  exportHelp: {
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
    minHeight: 240,
    padding: 12,
    textAlignVertical: 'top',
  },
});
