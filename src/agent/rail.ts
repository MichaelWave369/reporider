/**
 * RR-A01: pure, untrusted-input, mock-only agent adapter.
 *
 * This file imports RepoRider's canonical local planning, preview and safety
 * helpers, but NO GitHub clients, network, file writes, token storage, native
 * device APIs or execution adapters. Neither the caller nor an agent can grant
 * itself permission to create a repository.
 */
import { buildRepoPlan, starterStackOptions } from '../lib/repoPlanner';
import { applyStarterFileDrafts, buildStarterFilePreviews } from '../lib/starterFilePreview';
import {
  applyStarterIssueDrafts,
  buildStarterIssuePreviews,
  starterIssueKeyForIndex,
} from '../lib/starterIssuePreview';
import { scanRepoPlan } from '../lib/safetyScan';
import {
  buildApprovedFilesFingerprint, buildApprovedIssuesFingerprint,
  buildPlanFingerprint, buildStableFingerprint,
} from '../lib/receiptFingerprint';
import type { RepoPlanOverrides, StarterFilePreview, RepoIssuePlan } from '../types';

export const REQUEST_SCHEMA = 'reporider.agent.request.v0.1' as const;
export const RESPONSE_SCHEMA = 'reporider.agent.response.v0.1' as const;
export const AGENT_MODE = 'mock_only' as const;
export const MAX_REQUEST_BYTES = 65536;
const MAX_IDEA_LENGTH = 1200;
const MAX_FILE_CONTENT = 8192;
const MAX_ISSUE_BODY = 4096;
const ACTIONS = ['plan', 'preview', 'scan', 'dry_run', 'submit_for_review'] as const;
type RailAction = typeof ACTIONS[number];
type Obj = Record<string, unknown>;

type FileEdit = {path: string; content: string};
type IssueEdit = {index: number; title: string; body: string; labels: string[]};
export type RailRequest = {
  schema: typeof REQUEST_SCHEMA;
  action: RailAction;
  idea: string;
  overrides?: RepoPlanOverrides;
  edits?: {files?: FileEdit[]; issues?: IssueEdit[]};
};

export type RailResponse = {
  schema: typeof RESPONSE_SCHEMA;
  action: RailAction | 'invalid_request';
  mode: typeof AGENT_MODE;
  disposition: 'REVIEW_REQUIRED' | 'BLOCKED';
  authority_granted: false;
  action_executed: false;
  repository_created: false;
  notification_sent: false;
  memory_admitted: false;
  review_dispatched: false;
  source_identity_verified: false;
  reason: string;
  error_code?: string;
  data?: Record<string, unknown>;
};

const plain = (value: unknown): value is Obj =>
  value !== null && typeof value === 'object' && !Array.isArray(value) &&
  (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);

const exact = (value: Obj, allowed: readonly string[]) =>
  Object.keys(value).every(key => allowed.includes(key));

const tokenPattern = /(?:-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{20,}\b|\bgithub_pat_[A-Za-z0-9_]{30,}\b|\bAKIA[0-9A-Z]{16}\b|\bxox[baprs]-[A-Za-z0-9-]{10,}\b|\bnpm_[A-Za-z0-9]{20,}\b)/i;
const hasToken = (value: string) => tokenPattern.test(value);
const safeText = (value: unknown, limit: number): value is string =>
  typeof value === 'string' && value.length <= limit && !hasToken(value) &&
  !/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value);
const validName = (value: string) => /^[a-zA-Z0-9._-]{1,96}$/.test(value)
  && value !== '.' && value !== '..';

export class RailInputError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = 'RailInputError';
  }
}

function reject(code: string): never { throw new RailInputError(code); }
function check(condition: boolean, code: string): asserts condition {
  if (!condition) reject(code);
}

export function parseRailRequest(input: unknown): RailRequest {
  check(plain(input) && exact(input, ['schema', 'action', 'idea', 'overrides', 'edits']), 'INVALID_ENVELOPE');
  check(input.schema === REQUEST_SCHEMA, 'UNKNOWN_SCHEMA');
  check(typeof input.action === 'string' && (ACTIONS as readonly string[]).includes(input.action), 'UNKNOWN_ACTION');
  check(safeText(input.idea, MAX_IDEA_LENGTH) && input.idea.trim().length >= 3, 'INVALID_IDEA');

  let overrides: RepoPlanOverrides | undefined;
  if (input.overrides !== undefined) {
    check(plain(input.overrides) && exact(input.overrides, ['name', 'visibility', 'stack', 'issueCount']), 'INVALID_OVERRIDES');
    const source = input.overrides;
    overrides = {};
    if (source.name !== undefined) {
      check(typeof source.name === 'string' && validName(source.name) && !hasToken(source.name), 'INVALID_REPO_NAME');
      overrides.name = source.name;
    }
    if (source.visibility !== undefined) {
      check(source.visibility === 'private' || source.visibility === 'public', 'INVALID_VISIBILITY');
      overrides.visibility = source.visibility;
    }
    if (source.stack !== undefined) {
      check(typeof source.stack === 'string' && starterStackOptions.some(x => x === source.stack), 'INVALID_STACK');
      overrides.stack = source.stack as RepoPlanOverrides['stack'];
    }
    if (source.issueCount !== undefined) {
      check(typeof source.issueCount === 'number' && Number.isInteger(source.issueCount) &&
        source.issueCount >= 0 && source.issueCount <= 5, 'INVALID_ISSUE_COUNT');
      overrides.issueCount = source.issueCount;
    }
  }

  let edits: RailRequest['edits'];
  if (input.edits !== undefined) {
    check(plain(input.edits) && exact(input.edits, ['files', 'issues']), 'INVALID_EDITS');
    edits = {};
    if (input.edits.files !== undefined) {
      check(Array.isArray(input.edits.files) && input.edits.files.length <= 6, 'INVALID_FILE_EDITS');
      const seen = new Set<string>();
      edits.files = input.edits.files.map((item: unknown) => {
        check(plain(item) && exact(item, ['path', 'content']) &&
          typeof item.path === 'string' && item.path.length <= 160, 'INVALID_FILE_EDIT');
        check(!seen.has(item.path), 'DUPLICATE_FILE_EDIT');
        seen.add(item.path);
        check(safeText(item.content, MAX_FILE_CONTENT), 'INVALID_FILE_CONTENT');
        return {path: item.path, content: item.content};
      });
    }
    if (input.edits.issues !== undefined) {
      check(Array.isArray(input.edits.issues) && input.edits.issues.length <= 5, 'INVALID_ISSUE_EDITS');
      const seen = new Set<number>();
      edits.issues = input.edits.issues.map((item: unknown) => {
        check(plain(item) && exact(item, ['index', 'title', 'body', 'labels']) &&
          typeof item.index === 'number' && Number.isInteger(item.index) && item.index >= 0 && item.index < 5, 'INVALID_ISSUE_EDIT');
        check(!seen.has(item.index), 'DUPLICATE_ISSUE_EDIT');
        seen.add(item.index);
        check(safeText(item.title, 180) && item.title.trim().length > 0 &&
          safeText(item.body, MAX_ISSUE_BODY), 'INVALID_ISSUE_CONTENT');
        check(Array.isArray(item.labels) && item.labels.length <= 10 &&
          item.labels.every((label: unknown) => safeText(label, 48) && label.trim().length > 0), 'INVALID_ISSUE_LABELS');
        return {index:item.index,title:item.title,body:item.body,labels:item.labels};
      });
    }
  }
  return {schema:REQUEST_SCHEMA,action:input.action as RailAction,idea:input.idea,overrides,edits};
}

const response = (
  action: RailResponse['action'], disposition: RailResponse['disposition'],
  reason: string, data?: Record<string,unknown>, error_code?: string,
): RailResponse => ({
  schema: RESPONSE_SCHEMA, action, mode: AGENT_MODE, disposition,
  authority_granted: false, action_executed: false,
  repository_created: false, notification_sent: false,
  memory_admitted: false, review_dispatched: false, source_identity_verified: false,
  reason, ...(error_code ? {error_code} : {}), ...(data ? {data} : {}),
});

export function failRail(code: string): RailResponse {
  return response('invalid_request', 'BLOCKED', 'Input rejected. No work package was prepared.', undefined, code);
}

function applyEdits(
  files: StarterFilePreview[], issues: RepoIssuePlan[], edits?: RailRequest['edits'],
): {files: StarterFilePreview[]; issues: RepoIssuePlan[]} {
  const paths = new Set(files.map(file => file.path));
  const fileDrafts: Record<string,string> = {};
  for(const edit of edits?.files ?? []) {
    check(paths.has(edit.path), 'UNPLANNED_FILE_PATH');
    fileDrafts[edit.path] = edit.content;
  }
  const issueDrafts: Record<string,RepoIssuePlan> = {};
  for(const edit of edits?.issues ?? []) {
    check(edit.index < issues.length, 'UNPLANNED_ISSUE_INDEX');
    issueDrafts[starterIssueKeyForIndex(edit.index)] = {
      title: edit.title, body: edit.body,
      labels: [...new Set(edit.labels.map(x=>x.trim().toLowerCase()))],
    };
  }
  return {
    files:applyStarterFileDrafts(files,fileDrafts),
    issues:applyStarterIssueDrafts(issues,issueDrafts),
  };
}

export function runAgentRail(untrusted: unknown): RailResponse {
  let action: RailResponse['action'] = 'invalid_request';
  try {
    const request = parseRailRequest(untrusted);
    action = request.action;
    // Headless always defaults PRIVATE, even if the idea text mentions "public".
    // Only an explicit validated override may request a public *proposal*.
    const plan = buildRepoPlan(request.idea, {visibility:'private', ...request.overrides});
    const {files,issues} = applyEdits(
      buildStarterFilePreviews(plan),buildStarterIssuePreviews(plan),request.edits,
    );
    const safety = scanRepoPlan(plan,files,issues);
    const planFingerprint = buildPlanFingerprint(plan);
    const filesFingerprint = buildApprovedFilesFingerprint(files);
    const issuesFingerprint = buildApprovedIssuesFingerprint(issues);
    const packageFingerprint = buildStableFingerprint('agent-proposal',{
      planFingerprint,filesFingerprint,issuesFingerprint,
      safetyPolicy:safety.policyVersion,safetyStatus:safety.status,
      warnings:safety.warningCount,blockers:safety.blockerCount,
    });
    const summary = {
      repository_name:plan.name, visibility:plan.visibility, stack:plan.stack,
      starter_files:files.length, starter_issues:issues.length,
      safety_policy:safety.policyVersion,safety_status:safety.status,
      warnings:safety.warningCount,blockers:safety.blockerCount,
      fingerprint:packageFingerprint,
      fingerprint_is_authentication:false,
      required_human_approvals:files.length+issues.length,
      approved_artifacts:0,
    };
    const exposedFiles = files.map(file=>({
      path:file.path,purpose:file.purpose,riskLevel:file.riskLevel,
      content:file.content,
      approval_fingerprint:buildStableFingerprint('file-draft',{path:file.path,content:file.content}),
    }));
    const exposedIssues = issues.map((issue,index)=>({
      index,title:issue.title,body:issue.body,labels:issue.labels,
      approval_fingerprint:buildStableFingerprint('issue-draft',{index,...issue}),
    }));
    const findings = safety.findings.map(f=>({
      id:f.id,severity:f.severity,category:f.category??null,
      path:f.path??null,message:f.message,remediation:f.remediation??null,
    }));
    if (request.action === 'plan') {
      return response(action,'REVIEW_REQUIRED','A plan has been prepared; an agent cannot approve or publish it.',
        {summary,plan});
    }
    if (request.action === 'preview') {
      return response(action,'REVIEW_REQUIRED','Generated drafts require independent human review.',
        {summary,files:exposedFiles,issues:exposedIssues});
    }
    if (request.action === 'scan') {
      return response(action,safety.blockerCount?'BLOCKED':'REVIEW_REQUIRED',
        'Heuristic findings are advisory and never authorize execution.',
        {summary,checks:safety.checks,findings,required_gates:safety.requiredGates});
    }
    if (request.action === 'dry_run') {
      return response(action,safety.blockerCount?'BLOCKED':'REVIEW_REQUIRED',
        'No approvals or live writer exist in this rail. The package is a simulated write proposal only.',
        {summary,would_create_repository:false,would_push_files:0,would_open_issues:0,
          findings,missing_gates:['Independent current human approval of every artifact',
            'Separate OAuth and secure token custody', 'Trusted live-mode authorization',
            'Revalidation at the moment of execution']});
    }
    if(safety.blockerCount) {
      return response(action,'BLOCKED','Safety blockers prevent packaging for human review.',
        {summary,findings});
    }
    // "submit_for_review" is IN-BAND ONLY. No queue, message or remote submission.
    return response(action,'REVIEW_REQUIRED',
      'Human review packet prepared in this response. It was not submitted or dispatched.',
      {summary,review_packet:{
        schema:'reporider.agent.review-packet.v0.1',
        delivery:'CALLER_HANDOFF_REQUIRED',
        operator_identity_authenticated:false,
        human_approval_recorded:false,
        proposal_fingerprint:packageFingerprint,
        fingerprint_is_cryptographic_signature:false,
        files:exposedFiles,issues:exposedIssues,
        findings,required_gates:safety.requiredGates,
        requested_effect:'NONE',
      }});
  } catch (e) {
    if(e instanceof RailInputError) return failRail(e.code);
    return response(action,'BLOCKED','Planner or policy failed closed; no package was prepared.',
      undefined,'INTERNAL_POLICY_FAILURE');
  }
}
