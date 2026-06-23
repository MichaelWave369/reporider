import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { IdeaCapture } from './src/components/IdeaCapture';
import { ReceiptTimeline } from './src/components/ReceiptTimeline';
import { RepoPlanCard } from './src/components/RepoPlanCard';
import { buildRepoPlan } from './src/lib/repoPlanner';
import { scanRepoPlan } from './src/lib/safetyScan';
import { createSeedReceipts } from './src/lib/receiptLedger';

const starterIdea =
  'Create a private repo for a simple camping checklist app. Use React Native, add a README, and create starter issues.';

export default function App() {
  const repoPlan = buildRepoPlan(starterIdea);
  const safetyReport = scanRepoPlan(repoPlan);
  const receipts = createSeedReceipts(repoPlan, safetyReport);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>RepoRider</Text>
          <Text style={styles.title}>Catch the idea. Forge the repo. Ride the build.</Text>
          <Text style={styles.subtitle}>
            A mobile-first GitHub creation assistant for builders away from the desk.
          </Text>
        </View>

        <IdeaCapture initialIdea={starterIdea} />
        <RepoPlanCard plan={repoPlan} safetyReport={safetyReport} />
        <ReceiptTimeline receipts={receipts} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    padding: 20,
    gap: 18,
  },
  hero: {
    paddingTop: 18,
    paddingBottom: 8,
    gap: 10,
  },
  kicker: {
    color: '#67e8f9',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    color: '#f8fafc',
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 39,
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 16,
    lineHeight: 23,
  },
});
