import type { AuthCapability, LiveModeState, LiveModeStateStatus, TokenStorageSnapshot } from '../types';
import { isLiveWriteCapabilityReady } from './authCapability';
import { isTokenStorageReady } from './tokenStorage';

export const liveModeStateLabels: Record<LiveModeStateStatus, string> = {
  mock_only: 'Mock only',
  live_available: 'Live available',
  live_armed: 'Live armed',
  writing: 'Writing',
  write_complete: 'Write complete',
  write_failed: 'Write failed',
};

export const buildMockLiveModeState = (
  authCapability: AuthCapability,
  tokenStorage: TokenStorageSnapshot,
): LiveModeState => ({
  status: 'mock_only',
  label: liveModeStateLabels.mock_only,
  summary:
    'RepoRider can simulate the reviewed ride, but live GitHub write-mode is not available in this build.',
  canArmLiveMode: false,
  canStartWrite: false,
  canRetryWrite: false,
  isTerminal: false,
  requiredGates: [
    'Auth capability must be auth_ready.',
    'Secure token storage must replace the null adapter and report ready.',
    'Live writer service must pass dry-run verification.',
    'Current file and issue drafts must have fresh approvals.',
    'Safety scan must pass the live-write policy gate.',
  ],
  boundaryNotes: [
    `Auth ready: ${isLiveWriteCapabilityReady(authCapability) ? 'yes' : 'no'}.`,
    `Token storage ready: ${isTokenStorageReady(tokenStorage) ? 'yes' : 'no'}.`,
    'This state machine does not request OAuth, store tokens, create repositories, push files, or open issues.',
    'Saved drafts, imports, history restores, and receipts never advance the live-mode state by themselves.',
  ],
});

export const isLiveModeWriteReady = (state: LiveModeState) => (
  state.status === 'live_armed'
  && state.canStartWrite
);
