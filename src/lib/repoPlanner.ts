import type {
  RepoFilePlan,
  RepoIssuePlan,
  RepoPlan,
  RepoPlanOverrides,
  RepoVisibility,
  StarterStack,
} from '../types';

const fallbackIdea = 'New mobile build idea';

const maxIssueCount = 5;

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

export const starterStackLabels: Record<StarterStack, string> = {
  'expo-react-native': 'Expo / React Native',
  'react-vite': 'React / Vite',
  nextjs: 'Next.js',
  'node-cli': 'Node CLI',
  'docs-only': 'Docs only',
};

export const starterStackOptions = Object.keys(starterStackLabels) as StarterStack[];

const cleanIdea = (idea: string) => idea.trim() || fallbackIdea;

const tokenizeIdea = (idea: string) =>
  cleanIdea(idea)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .split(/\s+/)
    .map((word) => word.replace(/^-+|-+$/g, ''))
    .filter(Boolean);

const normalizeRepoSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9-_\s]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);

const normalizeRepoName = (idea: string) => {
  const meaningfulWords = tokenizeIdea(idea)
    .filter((word) => !fillerWords.has(word))
    .slice(0, 5);

  const words = meaningfulWords.length > 0 ? meaningfulWords : tokenizeIdea(idea).slice(0, 4);

  if (words.length === 0) {
    return 'new-idea-repo';
  }

  return normalizeRepoSlug(words.join('-')) || 'new-idea-repo';
};

const normalizeManualRepoName = (name: string | undefined, fallbackName: string) => {
  if (!name) {
    return fallbackName;
  }

  return normalizeRepoSlug(name) || fallbackName;
};

const clampIssueCount = (issueCount: number | undefined) => {
  if (typeof issueCount !== 'number' || Number.isNaN(issueCount)) {
    return 3;
  }

  return Math.max(0, Math.min(maxIssueCount, Math.round(issueCount)));
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

const buildStarterIssues = (idea: string, stack: StarterStack, issueCount: number): RepoIssuePlan[] => {
  const baseIssues: RepoIssuePlan[] = [
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
    {
      title: 'Draft README and setup path',
      body: 'Write the first README with project purpose, local setup, and the first safe build command.',
      labels: ['docs', 'starter'],
    },
    {
      title: 'Plan first release checkpoint',
      body: 'Define what must be true before this starter repo is ready for a first public or private release.',
      labels: ['release', 'planning'],
    },
  ];

  return baseIssues.slice(0, issueCount);
};

export const buildRepoPlan = (idea: string, overrides: RepoPlanOverrides = {}): RepoPlan => {
  const normalizedIdea = cleanIdea(idea);
  const suggestedStack = inferStack(normalizedIdea);
  const stack = overrides.stack ?? suggestedStack;
  const suggestedName = normalizeRepoName(normalizedIdea);
  const name = normalizeManualRepoName(overrides.name, suggestedName);
  const issueCount = clampIssueCount(overrides.issueCount);

  return {
    name,
    description: `Starter repository generated from idea: ${normalizedIdea}`,
    visibility: overrides.visibility ?? inferVisibility(normalizedIdea),
    stack,
    approvalRequired: true,
    files: buildStarterFiles(stack),
    issues: buildStarterIssues(normalizedIdea, stack, issueCount),
  };
};