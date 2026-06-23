import { starterStackLabels } from './repoPlanner';
import type { RepoPlan } from '../types';

const setupCommandForStack = (stack: RepoPlan['stack']) => {
  switch (stack) {
    case 'expo-react-native':
      return 'npm run start';
    case 'nextjs':
      return 'npm run dev';
    case 'node-cli':
      return 'npm run start';
    case 'docs-only':
      return 'Open docs/OVERVIEW.md and begin shaping the project.';
    case 'react-vite':
    default:
      return 'npm run dev';
  }
};

const stackPurpose = (stack: RepoPlan['stack']) => {
  switch (stack) {
    case 'expo-react-native':
      return 'a mobile-first Expo / React Native application';
    case 'nextjs':
      return 'a Next.js web application';
    case 'node-cli':
      return 'a TypeScript-powered Node CLI';
    case 'docs-only':
      return 'a documentation-first project workspace';
    case 'react-vite':
    default:
      return 'a React / Vite web application';
  }
};

const renderList = (items: string[]) => items.map((item) => `- ${item}`).join('\n');

export const buildReadmePreview = (plan: RepoPlan) => {
  const fileList = renderList(plan.files.map((file) => `\`${file.path}\` — ${file.purpose}`));
  const issueList = plan.issues.length > 0
    ? renderList(plan.issues.map((issue) => `${issue.title} (${issue.labels.join(', ')})`))
    : '- No starter issues selected for this ride.';

  return `# ${plan.name}

${plan.description}

## Overview

This repository starts as ${stackPurpose(plan.stack)} prepared by RepoRider.

## Starter stack

- Stack: ${starterStackLabels[plan.stack]}
- Visibility: ${plan.visibility}
- Default branch: main
- Human approval required before any live GitHub write: ${plan.approvalRequired ? 'yes' : 'no'}

## Planned files

${fileList}

## Starter roadmap

${issueList}

## Local setup

\`\`\`bash
npm install
${setupCommandForStack(plan.stack)}
\`\`\`

## Safety notes

RepoRider generated this preview before any live repository write. Review the plan, scan for secrets, confirm visibility, and approve only when the starter repo matches your intent.

## Receipts

Creation receipts should be stored in \`docs/RECEIPTS.md\` after the repo is created.
`;
};
