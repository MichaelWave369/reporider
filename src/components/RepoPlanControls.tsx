import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { starterStackLabels, starterStackOptions } from '../lib/repoPlanner';
import { visibilityEducation } from '../lib/visibilityGate';
import {validateRepositoryName,MAX_REPO_NAME_LENGTH,getRepositoryNamePrewriteGate} from '../lib/repoNaming';
import type { RepoPlan, RepoPlanOverrides, RepoVisibility, StarterStack } from '../types';

type RepoPlanControlsProps = {
  plan: RepoPlan;
  suggestedPlan: RepoPlan;
  overrides: RepoPlanOverrides;
  onOverridesChange: (overrides: RepoPlanOverrides) => void;
  onReset: () => void;
};

const issueCountOptions = [0, 1, 3, 5];

const visibilityOptions: RepoVisibility[] = ['private', 'public'];

export const RepoPlanControls = ({
  plan,
  suggestedPlan,
  overrides,
  onOverridesChange,
  onReset,
}: RepoPlanControlsProps) => {
  const updateOverrides = (patch: RepoPlanOverrides) => {
    onOverridesChange({
      ...overrides,
      ...patch,
    });
  };

  const selectedIssueCount = plan.issues.length;
  const repoNameValue = overrides.name ?? plan.name;
  const hasOverrides = Object.keys(overrides).length > 0;
  const nameStatus=validateRepositoryName(repoNameValue);
  const prewrite=getRepositoryNamePrewriteGate(repoNameValue);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>Rider Controls</Text>
          <Text style={styles.heading}>Steer the Plan</Text>
          <Text style={styles.helper}>
            RepoRider suggests the first shape. You can change the name, visibility, stack, and starter issue count before approval.
          </Text>
        </View>
        <Pressable accessibilityLabel="Reset repository plan controls" accessibilityRole="button" disabled={!hasOverrides} onPress={onReset} style={[styles.resetButton, !hasOverrides && styles.disabledButton]}>
          <Text style={styles.resetText}>Reset</Text>
        </Pressable>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Repo name</Text>
        <TextInput
          accessibilityLabel="Repository name"
          accessibilityHint="Edit the suggested GitHub repository name"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={MAX_REPO_NAME_LENGTH}
          onChangeText={(name) => updateOverrides({ name })}
          placeholder={suggestedPlan.name}
          placeholderTextColor="#94a3b8"
          style={styles.input}
          value={repoNameValue}
        />
        <Text accessibilityRole="text" style={[styles.microcopy,!nameStatus.valid && styles.nameError]}>
          {nameStatus.valid ? 'Valid slug format.' : 'Name blocked: '+nameStatus.message}
        </Text>
        <Text style={styles.microcopy}>Suggestion: {suggestedPlan.name} · Max 96 lowercase letters, numbers and hyphens.</Text>
        <Text style={styles.microcopy}>GitHub collision check: {prewrite.name_collision_unverified ? 'UNVERIFIED' : 'VERIFIED'}.
          Requires owner-specific authenticated prewrite verification when live mode is built.
        </Text>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Visibility</Text>
        <View style={styles.chipRow}>
          {visibilityOptions.map((visibility) => (
            <Pressable
              accessibilityRole="radio"
              accessibilityLabel={`Repository visibility: ${visibility}`}
              accessibilityState={{ selected: plan.visibility === visibility }}
              key={visibility}
              onPress={() => updateOverrides({ visibility })}
              style={[styles.chip, plan.visibility === visibility && styles.selectedChip]}
            >
              <Text style={[styles.chipText, plan.visibility === visibility && styles.selectedChipText]}>{visibility}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.microcopy}>{visibilityEducation[plan.visibility]}</Text>
        {plan.visibility === 'public' ? <Text style={styles.microcopy}>Public requires a separate confirmation before mock creation.</Text> : null}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Starter stack</Text>
        <View style={styles.chipRow}>
          {starterStackOptions.map((stack: StarterStack) => (
            <Pressable
              accessibilityRole="radio"
              accessibilityLabel={`Starter stack: ${starterStackLabels[stack]}`}
              accessibilityState={{ selected: plan.stack === stack }}
              key={stack}
              onPress={() => updateOverrides({ stack })}
              style={[styles.chip, plan.stack === stack && styles.selectedChip]}
            >
              <Text style={[styles.chipText, plan.stack === stack && styles.selectedChipText]}>{starterStackLabels[stack]}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Starter issues</Text>
        <View style={styles.chipRow}>
          {issueCountOptions.map((issueCount) => (
            <Pressable
              accessibilityRole="radio"
              accessibilityLabel={`Starter issue count: ${issueCount}`}
              accessibilityState={{ selected: selectedIssueCount === issueCount }}
              key={issueCount}
              onPress={() => updateOverrides({ issueCount })}
              style={[styles.chip, selectedIssueCount === issueCount && styles.selectedChip]}
            >
              <Text style={[styles.chipText, selectedIssueCount === issueCount && styles.selectedChipText]}>{issueCount}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.microcopy}>Issue generation is capped so new repos do not get flooded.</Text>
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
    gap: 16,
    padding: 18,
  },
  headerRow: {
    alignItems: 'flex-start',
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
  resetButton: {
    backgroundColor: '#164e63',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  disabledButton: {
    opacity: 0.4,
  },
  resetText: {
    color: '#ecfeff',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '900',
  },
  input: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderRadius: 16,
    borderWidth: 1,
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '800',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  nameError: { color: '#fecaca', fontWeight: '800' },
  microcopy: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 17,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectedChip: {
    backgroundColor: '#06b6d4',
    borderColor: '#67e8f9',
  },
  chipText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '800',
  },
  selectedChipText: {
    color: '#082f49',
  },
});