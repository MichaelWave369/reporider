import { StyleSheet, Text, View } from 'react-native';
import type { Receipt } from '../types';

type ReceiptTimelineProps = {
  receipts: Receipt[];
};

export const ReceiptTimeline = ({ receipts }: ReceiptTimelineProps) => {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Build Receipts</Text>
      {receipts.map((receipt) => (
        <View key={receipt.id} style={styles.receipt}>
          <Text style={styles.action}>{receipt.action}</Text>
          <Text style={styles.detail}>{receipt.detail}</Text>
          <Text style={styles.meta}>{receipt.status} · {receipt.timestamp}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#172033',
    borderColor: '#334155',
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    padding: 18,
  },
  heading: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '800',
  },
  receipt: {
    borderLeftColor: '#67e8f9',
    borderLeftWidth: 3,
    gap: 4,
    paddingLeft: 12,
  },
  action: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '800',
  },
  detail: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 18,
  },
  meta: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
