import type { RepoFilePlan, RepoIssuePlan, RepoPlan, RepoVisibility, StarterStack } from '../types';

const fallbackIdea = 'New mobile build idea';

const fillerWords = new Set([
  'a',
  'an',
  'and',
  'app',
  'build',
  'create',
  'for',
  'generate',
  'github',
  'idea',
  'make',
  'me',
  'new',
  'private',
  'project',
  'public',
  'repo',
  'repository',
  'simple',
  'starter',
  'the',
  'to',
  'use',
  'with',
]);

const cleanIdea = (idea: string) => idea.trim() || fallbackIdea;

const tokenizeIdea = (idea: string) =>
  cleanIdea(idea)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .split(/\s+/)
    .map((word) => word.replace(/^-+|-+$/g, ''))
    .filter(Boolean);

const normalizeRepoName = (idea: string) => {
  const meaningfulWords = tokenizeIdea(idea)
    .filter((word) => !fillerWords.has(word))
    .slice(0, 5);

  const words = meaningfulWords.length > 0 ? meaningfulWords : tokenizeIdea(idea).slice(0, 4);

  if (words.length === 0) {
    return 'new-idea-repo';
  }

  return words.join('-').replace(/-+/g, '-');
};

const inferVisibility = (idea: string): RepoVisibility => {
  const lowerIdea = idea.toLowerCase();

  if (lowerIdea.includes('public') || lowerIdea.includes('open source') || lowerIdea.includes('oss')) {
    return 'public';
  }

  return 'private';
};

const inferStack = (idea: string): StarterStack => {
  const lowerIdea = idea.toLowerCase();

  if (
    lowerIdea.includes('mobile') ||
    lowerIdea.includes('react native') ||
    lowerIdea.includes('expo') ||
    lowerIdea.includes('ios') ||
    lowerIdea.includes('android')
  ) {
    return 'expo-react-native';
  }

  if (lowerIdea.includes('next') || lowerIdea.includes('next.js') || lowerIdea.includes('website')) {
    return 'nextjs';
  }

  if (lowerIdea.includes('cli') || lowerIdea.includes('terminal') || lowerIdea.includes('command line')) {
    return 'node-cli';
  }

  if (lowerIdea.includes('docs') || lowerIdea.includes('readme') || lowerIdea.includes('documentation')) {
    return 'docs-only';
  }

  return 'react-vite';
};

const stackEntryFile = (stack: StarterStack): RepoFilePlan => {
  switch (stack) {
    case 'expo-react-native':
      return {
        path: 'App.tsx',
        purpose: 'Seed the first mobile screen for the Expo app.',
        riskLevel: 'medium',
      };
    case 'nextjs':
      return {
        path: 'src/app/page.tsx',
        purpose: 'Seed the first Next.js landing page.',
        riskLevel: 'medium',
      };
    case 'node-cli':
      return {
        path: 'src/index.ts',
        purpose: 'Seed the command-line entry point.',
        riskLevel: 'medium',
      };
    case 'docs-only':
      return {
        path: 'docs/OVERVIEW.md',
        purpose: 'Seed the first project overview document.',
        riskLevel: 'low',
      };
    case 'react-vite':
    default:
      return {
        path: 'src/App.tsx',
        purpose: 'Seed the first React app screen.',
        riskLevel: 'medium',
      };
  }
};

const buildStarterFiles = (stack: StarterStack): RepoFilePlan[] => [
  {
    path: 'README.md',
    purpose: 'Explain the project, setup, and first build path.',
    riskLevel: 'low',
  },
  {
    path: '.gitignore',
    purpose: 'Prevent local files, logs, and secrets from entering Git history.',
    riskLevel: 'low',
  },
  stackEntryFile(stack),
  {
    path: 'docs/RECEIPTS.md',
    purpose: 'Track creation decisions and approval history.',
    riskLevel: 'low',
  },
];

const buildStarterIssues = (idea: string, stack: StarterStack): RepoIssuePlan[] => [
  {
    title: 'Define MVP user journey',
    body: `Document the smallest complete path for this idea: ${cleanIdea(idea)}`,
    labels: ['mvp', 'product'],
  },
  {
    title: `Scaffold ${stack} starter`,
    body: 'Create the initial files, setup commands, and first runnable screen or entry point.',
    labels: ['engineering', 'starter'],
  },
  {
    title: 'Run safety scan before first commit',
    body: 'Review generated files for secrets, credentials, unsafe defaults, and accidental public exposure.',
    labels: ['safety', 'ledger'],
  },
];

export const buildRepoPlan = (idea: string): RepoPlan => {
  const normalizedIdea = cleanIdea(idea);
  const stack = inferStack(normalizedIdea);
  const name = normalizeRepoName(normalizedIdea);

  return {
    name,
    description: `Starter repository generated from idea: ${normalizedIdea}`,
    visibility: inferVisibility(normalizedIdea),
    stack,
    approvalRequired: true,
    files: buildStarterFiles(stack),
    issues: buildStarterIssues(normalizedIdea, stack),
  };
};
