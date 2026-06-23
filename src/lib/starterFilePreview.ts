import { starterStackLabels } from './repoPlanner';
import { buildReadmePreview } from './readmePreview';
import type {
  RepoPlan,
  StarterFileDraftMap,
  StarterFileDraftSummary,
  StarterFilePreview,
  StarterStack,
} from '../types';

const titleFromRepoName = (name: string) =>
  name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ') || 'New Project';

const renderJson = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;

const buildPackageJsonPreview = (plan: RepoPlan) => {
  const base = {
    name: plan.name,
    version: '0.1.0',
    private: plan.visibility === 'private',
    description: plan.description,
  };

  switch (plan.stack) {
    case 'expo-react-native':
      return renderJson({
        ...base,
        main: 'node_modules/expo/AppEntry.js',
        scripts: {
          start: 'expo start',
          android: 'expo start --android',
          ios: 'expo start --ios',
          web: 'expo start --web',
          typecheck: 'tsc --noEmit',
        },
        dependencies: {
          expo: '~51.0.0',
          'expo-status-bar': '~1.12.1',
          react: '18.2.0',
          'react-native': '0.74.0',
        },
        devDependencies: {
          '@types/react': '~18.2.79',
          typescript: '~5.3.3',
        },
      });
    case 'nextjs':
      return renderJson({
        ...base,
        scripts: {
          dev: 'next dev',
          build: 'next build',
          start: 'next start',
          typecheck: 'tsc --noEmit',
        },
        dependencies: {
          next: '^15.0.0',
          react: '^19.0.0',
          'react-dom': '^19.0.0',
        },
        devDependencies: {
          '@types/node': '^22.0.0',
          '@types/react': '^19.0.0',
          '@types/react-dom': '^19.0.0',
          typescript: '^5.0.0',
        },
      });
    case 'node-cli':
      return renderJson({
        ...base,
        type: 'module',
        bin: {
          [plan.name]: './dist/index.js',
        },
        scripts: {
          start: 'tsx src/index.ts',
          build: 'tsc',
          typecheck: 'tsc --noEmit',
        },
        dependencies: {},
        devDependencies: {
          '@types/node': '^22.0.0',
          tsx: '^4.0.0',
          typescript: '^5.0.0',
        },
      });
    case 'react-vite':
      return renderJson({
        ...base,
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'tsc && vite build',
          preview: 'vite preview',
          typecheck: 'tsc --noEmit',
        },
        dependencies: {
          '@vitejs/plugin-react': '^5.0.0',
          vite: '^7.0.0',
          react: '^19.0.0',
          'react-dom': '^19.0.0',
        },
        devDependencies: {
          '@types/react': '^19.0.0',
          '@types/react-dom': '^19.0.0',
          typescript: '^5.0.0',
        },
      });
    case 'docs-only':
      return renderJson(base);
    default:
      return renderJson(base);
  }
};

const buildGitignorePreview = (stack: StarterStack) => {
  const commonLines = [
    '# Dependencies',
    'node_modules/',
    '',
    '# Local environment files',
    '.env',
    '.env.*',
    '!.env.example',
    '',
    '# Logs',
    'npm-debug.log*',
    'yarn-debug.log*',
    'yarn-error.log*',
    '',
    '# OS and editor files',
    '.DS_Store',
    '.vscode/',
    '.idea/',
    '',
  ];

  const stackLines: Record<StarterStack, string[]> = {
    'expo-react-native': ['# Expo / React Native', '.expo/', 'dist/', 'web-build/'],
    'react-vite': ['# React / Vite', 'dist/', '.vite/'],
    nextjs: ['# Next.js', '.next/', 'out/'],
    'node-cli': ['# Node CLI build output', 'dist/', 'coverage/'],
    'docs-only': ['# Docs workspace', '.cache/'],
  };

  return [...commonLines, ...stackLines[stack], ''].join('\n');
};

const buildExpoEntryPreview = (plan: RepoPlan) => {
  const title = titleFromRepoName(plan.name);

  return [
    "import { StatusBar } from 'expo-status-bar';",
    "import { SafeAreaView, StyleSheet, Text, View } from 'react-native';",
    '',
    'export default function App() {',
    '  return (',
    '    <SafeAreaView style={styles.safeArea}>',
    '      <StatusBar style="light" />',
    '      <View style={styles.card}>',
    `        <Text style={styles.kicker}>${starterStackLabels[plan.stack]}</Text>`,
    `        <Text style={styles.title}>${title}</Text>`,
    '        <Text style={styles.body}>',
    '          This starter screen was prepared by RepoRider after human review and approval.',
    '        </Text>',
    '      </View>',
    '    </SafeAreaView>',
    '  );',
    '}',
    '',
    'const styles = StyleSheet.create({',
    "  safeArea: { flex: 1, backgroundColor: '#0f172a' },",
    "  card: { flex: 1, justifyContent: 'center', gap: 12, padding: 24 },",
    "  kicker: { color: '#67e8f9', fontSize: 13, fontWeight: '900', textTransform: 'uppercase' },",
    "  title: { color: '#f8fafc', fontSize: 34, fontWeight: '900' },",
    "  body: { color: '#cbd5e1', fontSize: 16, lineHeight: 23 },",
    '});',
    '',
  ].join('\n');
};

const buildReactEntryPreview = (plan: RepoPlan) => {
  const title = titleFromRepoName(plan.name);

  return [
    'export default function App() {',
    '  return (',
    '    <main>',
    `      <p>${starterStackLabels[plan.stack]}</p>`,
    `      <h1>${title}</h1>`,
    '      <p>This starter screen was prepared by RepoRider after human review and approval.</p>',
    '    </main>',
    '  );',
    '}',
    '',
  ].join('\n');
};

const buildNextEntryPreview = (plan: RepoPlan) => {
  const title = titleFromRepoName(plan.name);

  return [
    'export default function HomePage() {',
    '  return (',
    '    <main style={{ padding: 32, fontFamily: "system-ui, sans-serif" }}>',
    `      <p>${starterStackLabels[plan.stack]}</p>`,
    `      <h1>${title}</h1>`,
    '      <p>This starter page was prepared by RepoRider after human review and approval.</p>',
    '    </main>',
    '  );',
    '}',
    '',
  ].join('\n');
};

const buildNodeCliPreview = (plan: RepoPlan) => {
  const title = titleFromRepoName(plan.name);

  return [
    '#!/usr/bin/env node',
    '',
    'const main = () => {',
    `  console.log('${title}');`,
    "  console.log('Starter CLI prepared by RepoRider after human review and approval.');",
    '};',
    '',
    'main();',
    '',
  ].join('\n');
};

const buildDocsOverviewPreview = (plan: RepoPlan) => [
  `# ${titleFromRepoName(plan.name)} Overview`,
  '',
  plan.description,
  '',
  '## Intent',
  '',
  'Use this document to shape the first version of the project before adding code.',
  '',
  '## First decisions',
  '',
  `- Visibility: ${plan.visibility}`,
  `- Starter stack: ${starterStackLabels[plan.stack]}`,
  '- Human approval required before live GitHub writes: yes',
  '',
].join('\n');

const buildReceiptsPreview = (plan: RepoPlan) => [
  '# Creation Receipts',
  '',
  'This file records the first RepoRider decisions for the repository seed.',
  '',
  '## Planned ride',
  '',
  `- Repository: ${plan.name}`,
  `- Visibility: ${plan.visibility}`,
  `- Stack: ${starterStackLabels[plan.stack]}`,
  `- Planned files: ${plan.files.length}`,
  `- Planned starter issues: ${plan.issues.length}`,
  '- Human approval required: yes',
  '',
  '## Initial receipts',
  '',
  '- planned · idea captured',
  '- planned · repo plan generated',
  '- planned · starter file previews prepared',
  '- planned · safety scan required before live write',
  '',
].join('\n');

const contentForPath = (plan: RepoPlan, path: string) => {
  switch (path) {
    case 'README.md':
      return buildReadmePreview(plan);
    case '.gitignore':
      return buildGitignorePreview(plan.stack);
    case 'package.json':
      return buildPackageJsonPreview(plan);
    case 'App.tsx':
      return buildExpoEntryPreview(plan);
    case 'src/App.tsx':
      return buildReactEntryPreview(plan);
    case 'src/app/page.tsx':
      return buildNextEntryPreview(plan);
    case 'src/index.ts':
      return buildNodeCliPreview(plan);
    case 'docs/OVERVIEW.md':
      return buildDocsOverviewPreview(plan);
    case 'docs/RECEIPTS.md':
      return buildReceiptsPreview(plan);
    default:
      return `# ${path}\n\nStarter content for ${plan.name}.\n`;
  }
};

const languageForPath = (path: string): StarterFilePreview['language'] => {
  if (path.endsWith('.md')) {
    return 'markdown';
  }

  if (path.endsWith('.json')) {
    return 'json';
  }

  if (path.endsWith('.ts') || path.endsWith('.tsx')) {
    return 'typescript';
  }

  return 'text';
};

export type StarterFileDiffLine = {
  lineNumber: number;
  generated?: string;
  draft?: string;
  status: 'same' | 'added' | 'removed' | 'changed';
};

export const buildStarterFilePreviews = (plan: RepoPlan): StarterFilePreview[] =>
  plan.files.map((file) => ({
    ...file,
    language: languageForPath(file.path),
    content: contentForPath(plan, file.path),
  }));

export const applyStarterFileDrafts = (
  generatedPreviews: StarterFilePreview[],
  drafts: StarterFileDraftMap,
): StarterFilePreview[] =>
  generatedPreviews.map((preview) => ({
    ...preview,
    content: drafts[preview.path] ?? preview.content,
  }));

export const buildStarterFileDiff = (
  generatedContent: string,
  draftContent: string,
): StarterFileDiffLine[] => {
  const generatedLines = generatedContent.split('\n');
  const draftLines = draftContent.split('\n');
  const maxLineCount = Math.max(generatedLines.length, draftLines.length);

  return Array.from({ length: maxLineCount }, (_, index) => {
    const generated = generatedLines[index];
    const draft = draftLines[index];
    const lineNumber = index + 1;

    if (generated === draft) {
      return {
        lineNumber,
        generated,
        draft,
        status: 'same',
      };
    }

    if (generated === undefined) {
      return {
        lineNumber,
        draft,
        status: 'added',
      };
    }

    if (draft === undefined) {
      return {
        lineNumber,
        generated,
        status: 'removed',
      };
    }

    return {
      lineNumber,
      generated,
      draft,
      status: 'changed',
    };
  });
};

export const summarizeStarterFileDrafts = (
  generatedPreviews: StarterFilePreview[],
  draftPreviews: StarterFilePreview[],
): StarterFileDraftSummary => {
  const generatedByPath = new Map(generatedPreviews.map((preview) => [preview.path, preview.content]));
  const editedPaths = draftPreviews
    .filter((preview) => generatedByPath.get(preview.path) !== preview.content)
    .map((preview) => preview.path);
  const totalEditedCharacters = editedPaths.reduce((total, path) => {
    const draft = draftPreviews.find((preview) => preview.path === path);

    return total + (draft?.content.length ?? 0);
  }, 0);

  return {
    editedCount: editedPaths.length,
    editedPaths,
    totalFiles: draftPreviews.length,
    totalEditedCharacters,
  };
};
