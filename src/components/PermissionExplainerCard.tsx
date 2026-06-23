import { StyleSheet, Text, View } from 'react-native';

const currentBoundaries = [
  'Mock write mode remains active.',
  'No GitHub token is requested.',
  'No token is stored on device.',
  'No real repository, file, or issue write can run from this card.',
];

const futurePermissionCategories = [
  {
    title: 'Identity check',
    body: 'Confirm which GitHub account would authorize RepoRider before any live write mode is available.',
  },
  {
    title: 'Repository creation',
    body: 'Create a new repository only after the rider chooses live mode and approves the final plan.',
  },
  {
    title: 'File contents',
    body: 'Write only the currently approved starter files, with stale approvals blocking changed drafts.',
  },
  {
    title: 'Starter issues',
    body: 'Open only the currently approved starter issues, with edited issues requiring fresh approval.',
  },
];

const liveModeGates = [
  'Permission explainer accepted by the rider.',
  'OAuth capability model implemented.',
  'Secure token storage adapter reviewed.',
  'Safety scan upgraded for live writes.',
  'All current files and issues freshly approved.',
  'Dry-run writer verified before real writer is enabled.',
];

export const PermissionExplainerCard = () => (
  <View style={styles.card}>
    <View style={styles.headerRow}>
      <View style={styles.headerCopy}>
        <Text style={styles.kicker}>Live Mode Readiness</Text>
        <Text style={styles.heading}>GitHub permission explainer</Text>
        <Text style={styles.helper}>
          This screen explains the future OAuth/write-mode contract before RepoRider ever asks for GitHub access. It is informational only right now.
        </Text>
      </View>
      <View style={styles.modeBadge}>
        <Text style={styles.modeValue}>Mock</Text>
        <Text style={styles.modeLabel}>active</Text>
      </View>
    </View>

    <View style={styles.statusGrid}>
      {currentBoundaries.map((boundary) => (
        <View key={boundary} style={styles.statusPill}>
          <Text style={styles.statusText}>{boundary}</Text>
        </View>
      ))}
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Future permission categories</Text>
      {futurePermissionCategories.map((permission) => (
        <View key={permission.title} style={styles.permissionRow}>
          <Text style={styles.permissionTitle}>{permission.title}</Text>
          <Text style={styles.permissionBody}>{permission.body}</Text>
        </View>
      ))}
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Before live writes unlock</Text>
      {liveModeGates.map((gate, index) => (
        <Text key={gate} style={styles.gateText}>{index + 1}. {gate}</Text>
      ))}
    </View>

    <View style={styles.boundaryBox}>
      <Text style={styles.boundaryTitle}>Boundary</Text>
      <Text style={styles.boundaryText}>
        Explaining permissions is not consent to write. Future OAuth, token storage, repo creation, file commits, and issue creation must each pass their own explicit gates.
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#102033',
    borderColor: '#38bdf8',
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
    color: '#7dd3fc',
    fontSize: 12,
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
    fontSize: 13,
    lineHeight: 18,
  },
  modeBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#0f172a',
    borderColor: '#38bdf8',
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 74,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  modeValue: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '900',
  },
  modeLabel: {
    color: '#bae6fd',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  statusGrid: {
    gap: 8,
  },
  statusPill: {
    backgroundColor: '#0f172a',
    borderColor: '#1e3a8a',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  statusText: {
    color: '#e0f2fe',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
  },
  section: {
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
  permissionRow: {
    gap: 4,
  },
  permissionTitle: {
    color: '#bfdbfe',
    fontSize: 13,
    fontWeight: '900',
  },
  permissionBody: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 17,
  },
  gateText: {
    color: '#dbeafe',
    fontSize: 12,
    lineHeight: 17,
  },
  boundaryBox: {
    backgroundColor: '#172554',
    borderColor: '#60a5fa',
    borderRadius: 18,
    borderWidth: 1,
    gap: 5,
    padding: 12,
  },
  boundaryTitle: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '900',
  },
  boundaryText: {
    color: '#dbeafe',
    fontSize: 12,
    lineHeight: 17,
  },
});
