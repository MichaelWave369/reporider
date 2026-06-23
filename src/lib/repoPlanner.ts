import type { RepoPlan, StarterStack } from '../types';

const normalizeRepoName = (idea: string) => {
  const words = idea
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4);

  if (words.length === 0) {
    return 'new-idea-repo';
  }

  return words.join('-').replace(/-+/g, '-');
};

const inferStack = (idea: string): StarterStack => {
  const lowerIdea = idea.toLowerCase();

  if (lowerIdea.includes('mobile') || lowerIdea.includes('react native')) {
    return 'expo-react-native';
  }

  if (lowerIdea.includes('next')) {
    return 'nextjs';
  }

  if (lowerIdea.includes('cli')) {
    return 'node-cli';
  }

  if (lowerIdea.includes('docs') || lowerIdea.includes('readme')) {
    return 'docs-only';
  }

  return 'react-vite';
};

export const buildRepoPlan = (idea: string): RepoPlan => {
  const stack = inferStack(idea);
  const name = normalizeRepoName(idea);

  return {
    name,
    description: `Starter repository generated from idea: ${idea}`,
    visibility: 'private',
    stack,
    approvalRequired: true,
    files: [
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
      {
        path: 'src/App.tsx',
        purpose: 'Seed the first app screen or project entry point.',
        riskLevel: 'medium',
      },
      {
        path: 'docs/RECEIPTS.md',
        purpose: 'Track creation decisions and approval history.',
        riskLevel: 'low',
      },
    ],
    issues: [
      {
        title: 'Define MVP user journey',
        body: 'Document the smallest complete path from idea capture to approved GitHub commit.',
        labels: ['mvp', 'product'],
      },
      {
        title: 'Add GitHub OAuth flow',
        body: 'Implement secure GitHub sign-in and token storage before enabling write actions.',
        labels: ['security', 'github'],
      },
      {
        title: 'Create safety scan before commit',
        body: 'Block secrets and risky generated files before any repo write.',
        labels: ['safety', 'ledger'],
      },
    ],
  };
};
