import {runAgentRail, parseRailRequest, REQUEST_SCHEMA, failRail} from '../src/agent/rail';

function eq(actual: unknown, expected: unknown, label: string) {
  if(actual !== expected) throw new Error(label + ': expected ' + String(expected) + ', got ' + String(actual));
}
function ok(value: unknown,label: string) {if(!value) throw new Error(label);}
const base = (action: 'plan'|'preview'|'scan'|'dry_run'|'submit_for_review', extra: Record<string,unknown>={}) => ({
  schema:REQUEST_SCHEMA,action,idea:'Create a private React Vite personal task tracker',...extra,
});
function alwaysNoAuthority(reply: ReturnType<typeof runAgentRail>) {
  eq(reply.authority_granted,false,'no authority');
  eq(reply.action_executed,false,'no execution');
  eq(reply.repository_created,false,'no remote repo');
  eq(reply.notification_sent,false,'no notification');
  eq(reply.memory_admitted,false,'no memory admission');
  eq(reply.review_dispatched,false,'no review dispatch');
  eq(reply.source_identity_verified,false,'no source authentication');
}
const p = runAgentRail(base('plan'));
alwaysNoAuthority(p);
eq(p.disposition,'REVIEW_REQUIRED','plan is advisory');
eq((p.data?.summary as {visibility:string}).visibility,'private','default private');
ok((p.data?.summary as {fingerprint:string}).fingerprint,'plan fingerprint available');

const publicText = runAgentRail({...base('plan'),idea:'Make this a public open source repo'});
eq((publicText.data?.summary as {visibility:string}).visibility,'private','public idea does not change default');
const publicExplicit = runAgentRail(base('plan',{overrides:{visibility:'public'}}));
eq((publicExplicit.data?.summary as {visibility:string}).visibility,'public','explicit public proposal');
alwaysNoAuthority(publicExplicit);

const preview=runAgentRail(base('preview'));
alwaysNoAuthority(preview);
const files = preview.data?.files as Array<{path:string,content:string}>;
const issues = preview.data?.issues as Array<{index:number}>;
ok(Array.isArray(files)&&files.some(f=>f.path==='README.md'),'real starter generator used');
ok(Array.isArray(issues) && issues.length===3,'real issue planner used');

const readme=files.find(f=>f.path==='README.md');
ok(readme,'README present');
const edit=runAgentRail(base('preview',{edits:{files:[{path:'README.md',content:'# Rewritten by agent\n\nAwaiting human review.'}]}}));
alwaysNoAuthority(edit);
ok((edit.data?.files as typeof files).some(f=>f.path==='README.md'&&f.content.startsWith('# Rewritten')),'bounded edits applied');
eq(edit.disposition,'REVIEW_REQUIRED','edited file still unapproved');
const fp1=(preview.data?.summary as {fingerprint:string}).fingerprint;
const fp2=(edit.data?.summary as {fingerprint:string}).fingerprint;
ok(fp1!==fp2,'edit changes package fingerprint');

const block=runAgentRail(base('scan',{edits:{files:[{path:'README.md',content:'rm -rf /;'}]}}));
alwaysNoAuthority(block);
eq(block.disposition,'BLOCKED','unsafe command blocked');
ok((block.data?.summary as {blockers:number}).blockers>0,'native safety scanner reported blocker');

const dry=runAgentRail(base('dry_run'));
alwaysNoAuthority(dry);
eq(dry.data?.would_create_repository,false,'dry-run never writes');
eq(dry.data?.would_push_files,0,'dry-run no file write');

const packet=runAgentRail(base('submit_for_review'));
alwaysNoAuthority(packet);
const data=packet.data?.review_packet as {delivery:string;human_approval_recorded:boolean;requested_effect:string}|undefined;
if(packet.disposition==='REVIEW_REQUIRED') {
  if(!data) throw new Error('review packet missing');
  eq(data.delivery,'CALLER_HANDOFF_REQUIRED','no dispatch to humans');
  eq(data.human_approval_recorded,false,'never self-approves');
  eq(data.requested_effect,'NONE','no requested external effects');
}
const blockReview=runAgentRail(base('submit_for_review',{edits:{files:[{path:'README.md',content:'rm -rf /;'}]}}));
eq(blockReview.disposition,'BLOCKED','unsafe review packet blocked');
eq(blockReview.data?.review_packet,undefined,'no packet on blocker');

for(const [label,payload,code] of [
  ['unknown key',base('plan',{approved:true}),'INVALID_ENVELOPE'],
  ['unknown action',base('write' as 'plan'),'UNKNOWN_ACTION'],
  ['bad schema',{...base('plan'),schema:'v999'},'UNKNOWN_SCHEMA'],
  ['empty idea',{...base('plan'),idea:''},'INVALID_IDEA'],
  ['unknown field',base('preview',{edits:{files:[{path:'secrets.env',content:'safe'}]}}),'UNPLANNED_FILE_PATH'],
  ['issue out of scope',base('preview',{edits:{issues:[{index:4,title:'Oops',body:'x',labels:[]}]}}),'UNPLANNED_ISSUE_INDEX'],
  ['duplicate edits',base('preview',{edits:{files:[{path:'README.md',content:'a'},{path:'README.md',content:'b'}]}}),'DUPLICATE_FILE_EDIT'],
  ['bad visibility',base('plan',{overrides:{visibility:'everyone'}}),'INVALID_VISIBILITY'],
  ['oversized content',base('preview',{edits:{files:[{path:'README.md',content:'a'.repeat(8193)}]}}),'INVALID_FILE_CONTENT'],
  ['token input',base('plan',{idea:'Create repo ghp_'+'A'.repeat(24)}),'INVALID_IDEA'],
] as Array<[string,unknown,string]>) {
  const r=runAgentRail(payload);
  eq(r.disposition,'BLOCKED',label);
  eq(r.error_code,code,label+' code');
  alwaysNoAuthority(r);
}
eq(failRail('INVALID_JSON').error_code,'INVALID_JSON','parse fail closed');
let rejected=false;
try{parseRailRequest(base('plan',{overrides:{issueCount:-1}}));}catch{rejected=true;}
ok(rejected,'invalid issue count rejected');
console.log('RR-A01 rail fixtures PASS: native planner, edits, safety, mock-only, review, deny and bounds');
