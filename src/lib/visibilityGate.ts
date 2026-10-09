import type { RepoVisibility } from '../types';

/** An extra, explicit human confirmation for intentionally public plans. */
export const visibilityEducation = {
  private: 'Private repositories are visible to you and people granted access. GitHub organization administrators and platform policies may also apply.',
  public: 'Public repositories and their committed history can be read, cloned, copied, and redistributed by anyone. Never include tokens, secrets, personal data, or unpublished work.',
} as const;

export const canProceedWithVisibility = (
  visibility: RepoVisibility,
  acknowledgedPublic: boolean,
): boolean => visibility === 'private' || (visibility === 'public' && acknowledgedPublic === true);
