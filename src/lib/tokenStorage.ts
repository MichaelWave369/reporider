import type { TokenStorageAdapter, TokenStorageSnapshot } from '../types';

export const buildNullTokenStorageSnapshot = (): TokenStorageSnapshot => ({
  status: 'unsupported',
  label: 'Token storage unavailable',
  summary:
    'This build has no secure token storage implementation. RepoRider cannot persist, read, clear, or use GitHub tokens yet.',
  scope: 'none',
  hasStoredToken: false,
  canPersistToken: false,
  canReadToken: false,
  canClearToken: false,
  requiredGates: [
    'A platform-backed secure storage implementation must be selected.',
    'The implementation must avoid logs, receipts, Markdown exports, and saved drafts.',
    'Token read/write/clear behavior must have tests before OAuth can call it.',
    'The auth capability model must remain blocked until secure storage is reviewed.',
  ],
  boundaryNotes: [
    'No token value is accepted by this adapter.',
    'No token value is returned by this adapter.',
    'No token value is stored in memory, session state, receipts, drafts, or exported Markdown.',
    'This adapter exists only as a future integration seam.',
  ],
});

export const nullTokenStorageAdapter: TokenStorageAdapter = {
  id: 'null-token-storage-adapter',
  label: 'Null token storage adapter',
  getSnapshot: buildNullTokenStorageSnapshot,
  storeTokenUnavailable: buildNullTokenStorageSnapshot,
  readTokenUnavailable: () => null,
  clearTokenUnavailable: buildNullTokenStorageSnapshot,
};

export const isTokenStorageReady = (snapshot: TokenStorageSnapshot) => (
  snapshot.status !== 'unsupported'
  && snapshot.scope === 'secure_device_store'
  && snapshot.canPersistToken
  && snapshot.canReadToken
  && snapshot.canClearToken
);
