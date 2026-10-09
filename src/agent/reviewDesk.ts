/**
 * RR-A03: offline, client-side human-review desk logic.
 *
 * Never trust an imported model/agent response. Replay the complete bounded
 * RR-A01 proposal request with the canonical planner/scanner, and compare
 * the resulting packet structurally. This verifies local consistency, NOT
 * caller identity, human consent, provenance, or execution authorization.
 */
import {runAgentRail, REQUEST_SCHEMA, RESPONSE_SCHEMA} from './rail';

type Dict = Record<string,unknown>;
type RailOutput = ReturnType<typeof runAgentRail>;
const isObj=(x:unknown): x is Dict => x!==null&&typeof x==='object'&&!Array.isArray(x);
export const MAX_REVIEW_IMPORT_CHARS=256000;
export const DECISION_SCHEMA='reporider.local.review-note.v0.1' as const;

export type VerifiedReview={
  proposal:RailOutput;
  fingerprint:string;
  files:Array<{path:string;content:string;purpose:string;approval_fingerprint:string;riskLevel:string}>;
  issues:Array<{index:number;title:string;body:string;labels:string[];approval_fingerprint:string}>;
  findings:Array<{id:string;message:string;severity:string;remediation:string|null}>;
  summary:Record<string,unknown>;
};
export type ReviewResult=
 |{ok:true;value:VerifiedReview}
 |{ok:false;code:string;message:string};
export type Decision='RECOMMEND_FOR_SEPARATE_AUTHORIZATION'|'REQUEST_CHANGES'|'DECLINE';

function fail(code:string,message:string):ReviewResult{return{ok:false,code,message};}
function normalizedJson(value:unknown):string {
  if(Array.isArray(value))return '['+value.map(normalizedJson).join(',')+']';
  if(isObj(value))return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+normalizedJson(value[k])).join(',')+'}';
  return JSON.stringify(value);
}
export const fileReviewKey=(file:{path:string;approval_fingerprint:string}) =>
  'file:'+file.path+':'+file.approval_fingerprint;
export const issueReviewKey=(issue:{index:number;approval_fingerprint:string}) =>
  'issue:'+issue.index+':'+issue.approval_fingerprint;
export const requiredReviewKeys=(verified:VerifiedReview)=>
  [...verified.files.map(fileReviewKey),...verified.issues.map(issueReviewKey)];
/**
 * A request, bare RR-A01 response, or MCP tools/call envelope is accepted.
 * No imported "approval" flags are accepted as authority.
 */
export function inspectReviewImport(input:string):ReviewResult{
  if(typeof input!=='string'||input.length===0||input.length>MAX_REVIEW_IMPORT_CHARS)
    return fail('INVALID_LENGTH','Provide one JSON request or review response, no more than 256000 characters.');
  let raw:unknown;
  try{raw=JSON.parse(input);}catch{return fail('INVALID_JSON','The review input must be valid JSON.');}
  if(!isObj(raw))return fail('INVALID_SHAPE','Expected a JSON object.');
  if(raw.jsonrpc==='2.0'&&isObj(raw.result)&&isObj(raw.result.structuredContent))
    raw=raw.result.structuredContent;
  if(!isObj(raw))return fail('INVALID_SHAPE','No structured review packet was found.');

  let supplied:unknown=raw;
  // A raw agent request can be replayed directly as a review request.
  if(raw.schema===REQUEST_SCHEMA){
    if(raw.action!=='submit_for_review')
      return fail('NOT_REVIEW_ACTION','Use submit_for_review to prepare a review packet.');
    supplied=runAgentRail(raw);
  }
  if(!isObj(supplied)||supplied.schema!==RESPONSE_SCHEMA||supplied.action!=='submit_for_review'||
    supplied.mode!=='mock_only'||supplied.disposition!=='REVIEW_REQUIRED'||
    supplied.authority_granted!==false||supplied.action_executed!==false||
    supplied.repository_created!==false||supplied.review_dispatched!==false)
    return fail('UNTRUSTED_RESPONSE','This is not a review-only RR-A01 proposal.');

  const packet=isObj(supplied.data)?supplied.data.review_packet:undefined;
  if(!isObj(packet)||packet.schema!=='reporider.agent.review-packet.v0.1'||
    !isObj(packet.proposal_request)||packet.proposal_request.schema!==REQUEST_SCHEMA||
    packet.proposal_request.action!=='submit_for_review')
    return fail('REPLAY_REQUIRED','Packet does not include a replayable RR-A01 submit_for_review request. Regenerate it with the current rail.');

  const regenerated=runAgentRail(packet.proposal_request);
  if(regenerated.disposition!=='REVIEW_REQUIRED'||regenerated.action!=='submit_for_review')
    return fail('LOCAL_SCAN_BLOCKED','The current local scanner rejected this proposal.');
  // Reject any forged/tampered content including findings, summary, artifacts
  // and flags. Key order does not matter, content always does.
  if(normalizedJson(regenerated)!==normalizedJson(supplied))
    return fail('PACKET_MISMATCH','Imported response differs from a fresh local replay.');
  const data=regenerated.data;
  const replayPacket=data?.review_packet;
  if(!isObj(replayPacket)||!Array.isArray(replayPacket.files)||!Array.isArray(replayPacket.issues)||
     !Array.isArray(replayPacket.findings)||!isObj(data?.summary))
    return fail('INVALID_REPLAY','Local scanner did not provide a complete review package.');
  const summary=data.summary as Dict;
  if(typeof summary.blockers!=='number'||summary.blockers!==0||
    typeof summary.fingerprint!=='string'||summary.fingerprint!==replayPacket.proposal_fingerprint)
    return fail('INVALID_REPLAY','Current proposal fingerprint and zero-blocker gate must agree.');
  return {ok:true,value:{
    proposal:regenerated,
    fingerprint:summary.fingerprint,
    summary,
    files:replayPacket.files as VerifiedReview['files'],
    issues:replayPacket.issues as VerifiedReview['issues'],
    findings:replayPacket.findings as VerifiedReview['findings'],
  }};
}

export type LocalReviewNote={
  schema:typeof DECISION_SCHEMA;
  proposal_fingerprint:string;
  proposed_repository:string;
  decision:Decision;
  checked_artifacts:string[];
  required_artifacts:number;
  generated_at:string;
  rationale:string;
  review_location:'LOCAL_BROWSER_ONLY';
  content_replayed:true;
  source_identity_authenticated:false;
  reviewer_identity_authenticated:false;
  signature_verified:false;
  approval_granted:false;
  live_write_authorized:false;
  executed:false;
  delivered:false;
  boundary:'INFORMATIONAL_NOTE_ONLY';
};
export function makeLocalReviewNote(
  verified:VerifiedReview, checked:string[], choice:Decision,rationale:string,
  now:string=new Date().toISOString(),
):LocalReviewNote{
  if(!['RECOMMEND_FOR_SEPARATE_AUTHORIZATION','REQUEST_CHANGES','DECLINE'].includes(choice))
    throw new Error('INVALID_REVIEW_DECISION');
  if(typeof rationale!=='string'||rationale.length>1000)
    throw new Error('INVALID_RATIONALE');
  if(typeof now!=='string'||!Number.isFinite(Date.parse(now)))
    throw new Error('INVALID_TIMESTAMP');
  const wanted=requiredReviewKeys(verified);
  const checkedUnique=[...new Set(checked)];
  if(checkedUnique.some(key=>!wanted.includes(key)))
    throw new Error('UNKNOWN_ARTIFACT');
  if(choice==='RECOMMEND_FOR_SEPARATE_AUTHORIZATION' &&
     (checkedUnique.length!==wanted.length||wanted.some(key=>!checkedUnique.includes(key))))
    throw new Error('REVIEW_INCOMPLETE');
  return {
    schema:DECISION_SCHEMA,
    proposal_fingerprint:verified.fingerprint,
    proposed_repository:String(verified.summary.repository_name),
    decision:choice,
    checked_artifacts:checkedUnique,
    required_artifacts:wanted.length,
    generated_at:now,
    rationale,
    review_location:'LOCAL_BROWSER_ONLY',
    content_replayed:true,
    source_identity_authenticated:false,
    reviewer_identity_authenticated:false,
    signature_verified:false,
    approval_granted:false,
    live_write_authorized:false,
    executed:false,
    delivered:false,
    boundary:'INFORMATIONAL_NOTE_ONLY',
  };
}
