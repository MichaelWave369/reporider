import {runAgentRail,REQUEST_SCHEMA} from '../src/agent/rail';
import {
 inspectReviewImport,makeLocalReviewNote,requiredReviewKeys,fileReviewKey,issueReviewKey
} from '../src/agent/reviewDesk';

function must(value:unknown,message:string):asserts value{
 if(!value)throw new Error(message);
}
function eq(a:unknown,b:unknown,msg:string){
 if(a!==b)throw new Error(msg+' expected '+String(b)+' got '+String(a));
}
const req={schema:REQUEST_SCHEMA,action:'submit_for_review',idea:'Create a private React Vite todo app'};
const output=runAgentRail(req);
eq(output.disposition,'REVIEW_REQUIRED','precondition scan');
const a=inspectReviewImport(JSON.stringify(output));
must(a.ok,'self-generated response replay verifies');
const b=inspectReviewImport(JSON.stringify(req));
must(b.ok,'bare request replays into verified desk package');
eq(a.value.fingerprint,b.value.fingerprint,'same proposal replay');
eq(a.value.summary.visibility,'private','headless private default');
const mcp={jsonrpc:'2.0',id:7,result:{structuredContent:output}};
const c=inspectReviewImport(JSON.stringify(mcp));
must(c.ok,'MCP tool output accepted');
const keys=requiredReviewKeys(a.value);
must(keys.length>0,'packet has reviewable artifacts');
must(keys.every(x=>x.startsWith('file:')||x.startsWith('issue:')),'typed per-artifact keys');
eq(fileReviewKey(a.value.files[0]),keys[0],'file review key');
if(a.value.issues.length){
 eq(issueReviewKey(a.value.issues[0]),keys[a.value.files.length],'issue review key');
}
const incomplete=()=>{
 try{makeLocalReviewNote(a.value,[], 'RECOMMEND_FOR_SEPARATE_AUTHORIZATION','good');return false;}
 catch{return true;}
};
must(incomplete(),'cannot recommend without reviewing every artifact');
const recommend=makeLocalReviewNote(
 a.value,keys,'RECOMMEND_FOR_SEPARATE_AUTHORIZATION','Recommend for a separate authenticated workflow.','2026-10-09T00:00:00Z'
);
eq(recommend.checked_artifacts.length,keys.length,'all checks recorded');
eq(recommend.approval_granted,false,'cannot authorize');
eq(recommend.live_write_authorized,false,'no live write');
eq(recommend.reviewer_identity_authenticated,false,'no identity proof');
eq(recommend.signature_verified,false,'no signature');
eq(recommend.delivered,false,'no dispatch');
const decline=makeLocalReviewNote(a.value,[],'DECLINE','Not appropriate');
eq(decline.decision,'DECLINE','decline without item reviews');
const change=makeLocalReviewNote(a.value,[],'REQUEST_CHANGES','Needs more work');
eq(change.decision,'REQUEST_CHANGES','request changes without item review');
for(const invalid of ['fake','file:unplanned']){
 let thrown=false;
 try{makeLocalReviewNote(a.value,[invalid],'DECLINE','');}catch{thrown=true;}
 must(thrown,'unknown checked artifacts rejected');
}
const tampered=JSON.parse(JSON.stringify(output));
tampered.data.review_packet.files[0].content+=' security bypass';
const rejected=inspectReviewImport(JSON.stringify(tampered));
must(!rejected.ok,'tampered artifact blocked');
eq(rejected.code,'PACKET_MISMATCH','tamper mismatch detected');
const forged=JSON.parse(JSON.stringify(output));
forged.authority_granted=true;
const forgedResult=inspectReviewImport(JSON.stringify(forged));
must(!forgedResult.ok,'forged approval cannot be imported');
const oldPacket=JSON.parse(JSON.stringify(output));
delete oldPacket.data.review_packet.proposal_request;
const oldResult=inspectReviewImport(JSON.stringify(oldPacket));
must(!oldResult.ok,'non replayable older packet refused');
eq(oldResult.code,'REPLAY_REQUIRED','old requires re-export');
const blocker=runAgentRail({...req,edits:{files:[{path:'README.md',content:'rm -rf /;'}]}});
const blockerResult=inspectReviewImport(JSON.stringify(blocker));
must(!blockerResult.ok,'unsafe prebuilt output blocked');
const badRequest=inspectReviewImport(JSON.stringify({...req,edits:{files:[{path:'README.md',content:'rm -rf /;'}]}}));
must(!badRequest.ok,'unsafe raw request blocked');
const unknownAction=inspectReviewImport(JSON.stringify({...req,action:'plan'}));
must(!unknownAction.ok,'no plan document mistaken for review packet');
const invalid=inspectReviewImport('not json');
must(!invalid.ok,'invalid JSON blocked');
const over=inspectReviewImport('x'.repeat(256001));
must(!over.ok,'size limit enforced');
const spoof=JSON.parse(JSON.stringify(output));
spoof.data.review_packet.proposal_request.idea='Create an unrelated game';
const spoofResult=inspectReviewImport(JSON.stringify(spoof));
must(!spoofResult.ok,'modified replay input caught');
console.log('RR-A03 review desk fixtures PASS: replay, tamper rejection, blocked imports, decision notes, no authority');
