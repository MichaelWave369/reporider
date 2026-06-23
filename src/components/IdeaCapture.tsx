import { StyleSheet, Text, TextInput, View } from 'react-native';

type IdeaCaptureProps = {
  initialIdea: string;
};

export const IdeaCapture = ({ initialIdea }: IdeaCaptureProps) => {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Ride New Idea</Text>
      <Text style={styles.helper}>
        Voice capture can start with device dictation. Native speech-to-text can land after the GitHub write path is safe.
      </Text>
      <TextInput
        multiline
        defaultValue={initialIdea}
        placeholder="Tell RepoRider what you want to build..."
        placeholderTextColor="#94a3b8"
        style={styles.input}
      />
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
  label: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '800',
  },
  helper: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderRadius: 18,
    borderWidth: 1,
    color: '#f8fafc',
    fontSize: 16,
    minHeight: 112,
    padding: 14,
    textAlignVertical: 'top',
  },
});
