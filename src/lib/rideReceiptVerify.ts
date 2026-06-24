import { buildStableFingerprint } from './receiptFingerprint';
import { RIDE_RECEIPT_JSON_FORMAT } from './rideReceiptJson';

export type RideReceiptVerificationCheckStatus = 'pass' | 'warning' | 'fail';

export type RideReceiptVerificationCheck = {
  id: string;
  label: string;
  status: RideReceiptVerificationCheckStatus;
  detail: string;
};

export type RideReceiptVerificationStatus = 'valid' | 'warning' | 'invalid';

export type RideReceiptVerificationResult = {
  status: RideReceiptVerificationStatus;
  summary: string;
  checks: RideReceiptVerificationCheck[];
  format?: string;
  policyVersion?: string;
  safetyStatus?: string;
  rideArtifactFingerprint?: string;
  receiptChainHash?: string;
  receiptCount?: number;
};

type JsonObject = Record<string, unknown>;

type JsonReceipt = {
  action?: unknown;
  artifactFingerprint?: unknown;
  detail?: unknown;
  id?: unknown;
  previousReceiptHash?: unknown;
  receiptHash?: unknown;
  safetyPolicyVersion?: unknown;
  safetyStatus?: unknown;
  status?: unknown;
  timestamp?: unknown;
};

const isObject = (value: unknown): value is JsonObject => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const stringValue = (value: unknown) => (typeof value === 'string' ? value : undefined);

const stringArray = (value: unknown) => (Array.isArray(value) && value.every((item) => typeof item === 'string') ? value : undefined);

const asReceiptArray = (value: unknown): JsonReceipt[] | undefined => (Array.isArray(value) && value.every(isObject) ? value : undefined);

const check = (id: string, label: string, status: RideReceiptVerificationCheckStatus, detail: string): RideReceiptVerificationCheck => ({
  id,
  label,
  status,
  detail,
});

const summarize = (checks: RideReceiptVerificationCheck[]) => {
  const failCount = checks.filter((item) => item.status === 'fail').length;
  const warningCount = checks.filter((item) => item.status === 'warning').length;

  if (failCount > 0) {
    return {
      status: 'invalid' as const,
      summary: `${failCount} receipt verification check(s) failed. Do not trust this JSON receipt until it is regenerated from the original mock ride result.`,
    };
  }

  if (warningCount > 0) {
    return {
      status: 'warning' as const,
      summary: `${warningCount} receipt verification warning(s) need review, but no chain-breaking failure was found.`,
    };
  }

  return {
    status: 'valid' as const,
    summary: 'JSON ride receipt format, policy metadata, artifact fingerprints, receipt hashes, and receipt-chain links are internally consistent.',
  };
};

const optionalString = (value: unknown) => (typeof value === 'string' ? value : undefined);

const recomputeReceiptHash = (receipt: JsonReceipt, previousReceiptHash: string) => buildStableFingerprint('receipt', {
  action: optionalString(receipt.action),
  artifactFingerprint: optionalString(receipt.artifactFingerprint),
  detail: optionalString(receipt.detail),
  id: optionalString(receipt.id),
  previousReceiptHash,
  safetyPolicyVersion: optionalString(receipt.safetyPolicyVersion),
  safetyStatus: optionalString(receipt.safetyStatus),
  status: optionalString(receipt.status),
  timestamp: optionalString(receipt.timestamp),
});

export const verifyJsonRideReceipt = (source: string): RideReceiptVerificationResult => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(source);
  } catch (error) {
    return {
      status: 'invalid',
      summary: 'JSON could not be parsed. Paste a complete RepoRider typed ride receipt JSON export.',
      checks: [check('json-parse', 'JSON parse', 'fail', error instanceof Error ? error.message : 'Unknown JSON parse error.')],
    };
  }

  if (!isObject(parsed)) {
    return {
      status: 'invalid',
      summary: 'JSON receipt root must be an object.',
      checks: [check('json-root', 'JSON root', 'fail', 'The pasted value was not a JSON object.')],
    };
  }

  const artifactFingerprints = isObject(parsed.artifactFingerprints) ? parsed.artifactFingerprints : undefined;
  const boundary = isObject(parsed.boundary) ? parsed.boundary : undefined;
  const safetyPolicy = isObject(parsed.safetyPolicy) ? parsed.safetyPolicy : undefined;
  const receipts = asReceiptArray(parsed.receipts);
  const queuedFiles = Array.isArray(parsed.queuedFiles) ? parsed.queuedFiles : undefined;
  const queuedIssues = Array.isArray(parsed.queuedIssues) ? parsed.queuedIssues : undefined;

  const format = stringValue(parsed.format);
  const policyVersion = stringValue(safetyPolicy?.policyVersion);
  const safetyStatus = stringValue(safetyPolicy?.status);
  const rideArtifactFingerprint = stringValue(artifactFingerprints?.rideArtifact);
  const approvedFilesFingerprint = stringValue(artifactFingerprints?.approvedFiles);
  const approvedIssuesFingerprint = stringValue(artifactFingerprints?.approvedIssues);
  const receiptChainHash = stringValue(artifactFingerprints?.receiptChain);
  const boundaryNotes = stringArray(boundary?.notes);

  const checks: RideReceiptVerificationCheck[] = [
    format === RIDE_RECEIPT_JSON_FORMAT
      ? check('format-id', 'Format id', 'pass', `Format is ${RIDE_RECEIPT_JSON_FORMAT}.`)
      : check('format-id', 'Format id', 'fail', `Expected ${RIDE_RECEIPT_JSON_FORMAT}; received ${format ?? 'missing'}.`),
    policyVersion
      ? check('policy-version', 'Safety policy version', 'pass', `Policy version ${policyVersion} is present.`)
      : check('policy-version', 'Safety policy version', 'fail', 'Missing safety policy version.'),
    safetyStatus === 'pass' || safetyStatus === 'needs-review' || safetyStatus === 'blocked'
      ? check('safety-status', 'Safety status', 'pass', `Safety status ${safetyStatus} is present.`)
      : check('safety-status', 'Safety status', 'fail', `Expected pass, needs-review, or blocked; received ${safetyStatus ?? 'missing'}.`),
    rideArtifactFingerprint?.startsWith('ride-')
      ? check('ride-fingerprint', 'Ride artifact fingerprint', 'pass', rideArtifactFingerprint)
      : check('ride-fingerprint', 'Ride artifact fingerprint', 'fail', `Expected ride-* fingerprint; received ${rideArtifactFingerprint ?? 'missing'}.`),
    approvedFilesFingerprint?.startsWith('files-')
      ? check('files-fingerprint', 'Approved files fingerprint', 'pass', approvedFilesFingerprint)
      : check('files-fingerprint', 'Approved files fingerprint', 'fail', `Expected files-* fingerprint; received ${approvedFilesFingerprint ?? 'missing'}.`),
    approvedIssuesFingerprint?.startsWith('issues-')
      ? check('issues-fingerprint', 'Approved issues fingerprint', 'pass', approvedIssuesFingerprint)
      : check('issues-fingerprint', 'Approved issues fingerprint', 'fail', `Expected issues-* fingerprint; received ${approvedIssuesFingerprint ?? 'missing'}.`),
    receiptChainHash?.startsWith('receipt-')
      ? check('receipt-chain-fingerprint', 'Receipt-chain fingerprint', 'pass', receiptChainHash)
      : check('receipt-chain-fingerprint', 'Receipt-chain fingerprint', 'fail', `Expected receipt-* chain hash; received ${receiptChainHash ?? 'missing'}.`),
    receipts && receipts.length > 0
      ? check('receipt-list', 'Receipt list', 'pass', `${receipts.length} receipt(s) found.`)
      : check('receipt-list', 'Receipt list', 'fail', 'No receipt list found.'),
    queuedFiles
      ? check('queued-files', 'Queued files', 'pass', `${queuedFiles.length} queued file item(s) found.`)
      : check('queued-files', 'Queued files', 'warning', 'Queued files array is missing.'),
    queuedIssues
      ? check('queued-issues', 'Queued issues', 'pass', `${queuedIssues.length} queued issue item(s) found.`)
      : check('queued-issues', 'Queued issues', 'warning', 'Queued issues array is missing.'),
    boundaryNotes && boundaryNotes.length > 0
      ? check('boundary-notes', 'Boundary notes', 'pass', `${boundaryNotes.length} boundary note(s) found.`)
      : check('boundary-notes', 'Boundary notes', 'warning', 'Boundary notes are missing.'),
  ];

  if (receipts && receipts.length > 0 && rideArtifactFingerprint) {
    let previousHash = rideArtifactFingerprint;
    let chainHasFailure = false;

    receipts.forEach((receipt, index) => {
      const receiptId = stringValue(receipt.id) ?? `receipt-${index}`;
      const declaredPreviousHash = stringValue(receipt.previousReceiptHash);
      const declaredReceiptHash = stringValue(receipt.receiptHash);
      const recomputedReceiptHash = recomputeReceiptHash(receipt, previousHash);

      if (declaredPreviousHash !== previousHash) {
        chainHasFailure = true;
        checks.push(check(
          `receipt-${index}-previous-hash`,
          `Receipt ${index + 1} previous hash`,
          'fail',
          `${receiptId} should point to ${previousHash}; received ${declaredPreviousHash ?? 'missing'}.`,
        ));
      }

      if (declaredReceiptHash !== recomputedReceiptHash) {
        chainHasFailure = true;
        checks.push(check(
          `receipt-${index}-hash`,
          `Receipt ${index + 1} hash`,
          'fail',
          `${receiptId} recomputed to ${recomputedReceiptHash}; received ${declaredReceiptHash ?? 'missing'}.`,
        ));
      }

      previousHash = declaredReceiptHash ?? recomputedReceiptHash;
    });

    const finalReceiptHash = stringValue(receipts.at(-1)?.receiptHash);
    if (receiptChainHash !== finalReceiptHash) {
      chainHasFailure = true;
      checks.push(check(
        'receipt-chain-final-hash',
        'Final receipt-chain hash',
        'fail',
        `Receipt chain field should equal final receipt hash ${finalReceiptHash ?? 'missing'}; received ${receiptChainHash ?? 'missing'}.`,
      ));
    }

    if (!chainHasFailure) {
      checks.push(check('receipt-chain-links', 'Receipt-chain links', 'pass', 'Every receipt previous-hash link, recomputed hash, and final chain hash matched.'));
    }
  }

  const result = summarize(checks);

  return {
    ...result,
    checks,
    format,
    policyVersion,
    receiptChainHash,
    receiptCount: receipts?.length,
    rideArtifactFingerprint,
    safetyStatus,
  };
};
