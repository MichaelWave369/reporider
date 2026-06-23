import type { AuthCapability, AuthCapabilityStatus, TokenStorageSnapshot } from '../types';
import { buildNullTokenStorageSnapshot, isTokenStorageReady } from './tokenStorage';

export const authCapabilityLabels: Record<AuthCapabilityStatus, string> = {
  mock_only: 'Mock only',
  auth_unavailable: 'Auth unavailable',
  auth_ready: 'Auth ready',
};

export const buildMockAuthCapability = (
  tokenStorage: TokenStorageSnapshot = buildNullTokenStorageSnapshot(),
): AuthCapability => ({
  status: 'mock_only',
  label: authCapabilityLabels.mock_only,
  summary:
    'RepoRider can explain future GitHub permissions, but OAuth is not available in this build. Mock write mode remains the only executable path.',
  canRequestOAuth: false,
  canStoreToken: isTokenStorageReady(tokenStorage),
  canAttemptLiveWrites: false,
  requiredGates: [
    'OAuth provider wiring must exist.',
    'Secure token storage adapter must replace the null adapter and pass review.',
    'Permission consent must be explicit and current.',
    'Safety scan must be upgraded for live writes.',
    'Dry-run writer must pass before any real writer is enabled.',
  ],
});

export const isLiveWriteCapabilityReady = (capability: AuthCapability) => (
  capability.status === 'auth_ready'
  && capability.canRequestOAuth
  && capability.canStoreToken
  && capability.canAttemptLiveWrites
);
