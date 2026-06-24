import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { buildJsonRideReceipt } from '../lib/rideReceiptJson';
import { buildMarkdownRideReceipt } from '../lib/rideReceiptMarkdown';
import { verifyJsonRideReceipt } from '../lib/rideReceiptVerify';
import type { GithubCreateRepoResult } from '../types';

type RideReceiptExportCardProps = {
  result: GithubCreateRepoResult;
};

type ExportFormat = 'markdown' | 'json';

const countLines = (content: string) => content.split('\n').length;

export const RideReceiptExportCard = ({ result }: RideReceiptExportCardProps) => {
  const [expandedFormat, setExpandedFormat] = useState<ExportFormat | null>(null);
  const [receiptCheckSource, setReceiptCheckSource] = useState('');
  const markdownReceipt = useMemo(() => buildMarkdownRideReceipt(result), [result]);
  const jsonReceipt = useMemo(() => buildJsonRideReceipt(result), [result]);
  const activeReceipt = expandedFormat === 'json' ? jsonReceipt : markdownReceipt;
  const receiptCheck = useMemo(
    () => (receiptCheckSource.trim() ? verifyJsonRideReceipt(receiptCheckSource) : null),
    [receiptCheckSource],
  );

  const toggleFormat = (format: ExportFormat) => {
    setExpandedFormat((current) => (current === format ? null : format));
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>Export Receipt</Text>
          <Text style={styles.heading}>Copy-ready Markdown + JSON</Text>
          <Text style={styles.helper}>
            Share Markdown with humans or JSON with tools. Both exports are generated from the same typed result shown above.
          </Text>
        </View>
        <View style={styles.statBadge}>
          <Text style={styles.statValue}>{countLines(activeReceipt)}</Text>
          <Text style={styles.statLabel}>lines</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaPill}>{markdownReceipt.length} md chars</Text>
        <Text style={styles.metaPill}>{jsonReceipt.length} json chars</Text>
        <Text style={styles.metaPill}>{result.summary.writeArtifactCount} artifacts</Text>
        <Text style={styles.metaPill}>{result.summary.receiptCount} receipts</Text>
      </View>

      <View style={styles.buttonRow}>
        <Pressable
          accessibilityRole="button"
          onPress={() => toggleFormat('markdown')}
          style={({ pressed }) => [styles.toggleButton, pressed && styles.toggleButtonPressed, expandedFormat === 'markdown' && styles.toggleButtonActive]}
        >
          <Text style={styles.toggleText}>{expandedFormat === 'markdown' ? 'Hide Markdown' : 'Show Markdown'}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => toggleFormat('json')}
          style={({ pressed }) => [styles.toggleButton, pressed && styles.toggleButtonPressed, expandedFormat === 'json' && styles.toggleButtonActive]}
        >
          <Text style={styles.toggleText}>{expandedFormat === 'json' ? 'Hide JSON' : 'Show JSON'}</Text>
        </Pressable>
      </View>

      {expandedFormat ? (
        <View style={styles.exportBox}>
          <Text style={styles.exportHelp}>Tap into the box, then use your device/browser select and copy controls.</Text>
          <TextInput
            editable={false}
            multiline
            selectTextOnFocus
            style={styles.exportInput}
            value={activeReceipt}
          />
        </View>
      ) : null}

      <View style={styles.verifyBox}>
        <Text style={styles.verifyHeading}>JSON receipt check</Text>
        <Text style={styles.verifyHelp}>Check JSON receipt format, policy fields, fingerprints, and receipt-chain links locally.</Text>
        <View style={styles.buttonRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setReceiptCheckSource(jsonReceipt)}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.toggleButtonPressed]}
          >
            <Text style={styles.secondaryButtonText}>Use current JSON</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setReceiptCheckSource('')}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.toggleButtonPressed]}
          >
            <Text style={styles.secondaryButtonText}>Clear check</Text>
          </Pressable>
        </View>
        <TextInput
          multiline
          onChangeText={setReceiptCheckSource}
          placeholder="Paste JSON receipt here"
          placeholderTextColor="#64748b"
          style={styles.verifyInput}
          value={receiptCheckSource}
        />
        {receiptCheck ? (
          <View style={styles.verifyResult}>
            <Text style={[styles.verifyStatus, receiptCheck.status === 'valid' && styles.verifyStatusGood, receiptCheck.status === 'warning' && styles.verifyStatusWarn, receiptCheck.status === 'invalid' && styles.verifyStatusBad]}>
              {receiptCheck.status.toUpperCase()}: {receiptCheck.summary}
            </Text>
            <View style={styles.metaRow}>
              {receiptCheck.policyVersion ? <Text style={styles.metaPill}>{receiptCheck.policyVersion}</Text> : null}
              {receiptCheck.safetyStatus ? <Text style={styles.metaPill}>safety: {receiptCheck.safetyStatus}</Text> : null}
              {receiptCheck.receiptCount !== undefined ? <Text style={styles.metaPill}>{receiptCheck.receiptCount} receipts</Text> : null}
            </View>
            {receiptCheck.checks.slice(0, 8).map((check) => (
              <Text key={check.id} style={styles.verifyCheck}>
                {check.status.toUpperCase()} · {check.label}: {check.detail}
              </Text>
            ))}
            {receiptCheck.checks.length > 8 ? <Text style={styles.verifyCheck}>+ {receiptCheck.checks.length - 8} more check(s)</Text> : null}
          </View>
        ) : null}
      </View>
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
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  toggleButton: {
    alignItems: 'center',
    backgroundColor: '#38bdf8',
    borderRadius: 14,
    flex: 1,
    minWidth: 130,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  toggleButtonActive: {
    backgroundColor: '#67e8f9',
  },
  toggleButtonPressed: {
    opacity: 0.82,
  },
  toggleText: {
    color: '#082f49',
    fontSize: 13,
    fontWeight: '900',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderColor: '#38bdf8',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    minWidth: 130,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: '#e0f2fe',
    fontSize: 12,
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
  exportInput: {
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
  verifyBox: {
    backgroundColor: '#020617',
    borderColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    padding: 12,
  },
  verifyHeading: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '900',
  },
  verifyHelp: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 16,
  },
  verifyInput: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderRadius: 12,
    borderWidth: 1,
    color: '#e2e8f0',
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 15,
    minHeight: 110,
    padding: 10,
    textAlignVertical: 'top',
  },
  verifyResult: {
    gap: 8,
  },
  verifyStatus: {
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 17,
  },
  verifyStatusGood: {
    color: '#86efac',
  },
  verifyStatusWarn: {
    color: '#fde68a',
  },
  verifyStatusBad: {
    color: '#fecaca',
  },
  verifyCheck: {
    color: '#cbd5e1',
    fontSize: 11,
    lineHeight: 15,
  },
});