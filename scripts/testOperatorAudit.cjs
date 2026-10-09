'use strict';
// RR-A08: real-disk read-only audit reporting, checkpoint options, metadata
// inventory, source tampering, truncation, and zero-side-effect CLI tests.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const crypto=require('node:crypto');
const {spawnSync}=require('node:child_process');
const {runAgentRail,REQUEST_SCHEMA}=require('../.agent-build/src/agent/rail.js');
const {createCourier}=require('./reporider-courier.cjs');
const {inspectPacket,saveReviewNote}=require('./reporider-operator-core.cjs');
const {initLedger,recordEvidence,verifyLedger}=require('./reporider-operator-ledger.cjs');
const {makeCheckpoint}=require('./reporider-operator-checkpoints.cjs');
const {makeAuditReport,renderAuditText}=require('./reporider-operator-audit.cjs');
const ROOT=fs.mkdtempSync(path.join(os.tmpdir(),'rr-a08-'));
const inbox=path.join(ROOT,'inbox'),external=path.join(ROOT,'operator-kept');
fs.mkdirSync(inbox,{mode:0o700});fs.mkdirSync(external,{mode:0o700});
if(process.platform!=='win32'){fs.chmodSync(inbox,0o700);fs.chmodSync(external,0o700);}
const cliPath=path.join(__dirname,'reporider-audit.cjs');
const runner=(args)=>spawnSync(process.execPath,[cliPath,'--inbox',inbox,...args],{
 encoding:'utf8',timeout:15000,maxBuffer:1024*1024,
 env:{...process.env,REPORIDER_COURIER_ENABLED:'0'}
});
function cli(args=[]){
 const result=runner(args);assert.ifError(result.error);
 assert.equal(result.status,0,result.stderr);assert.equal(result.stderr,'');
 return result.stdout;
}
function draft(idea){
 const response=runAgentRail({schema:REQUEST_SCHEMA,action:'submit_for_review',idea});
 assert.equal(response.disposition,'REVIEW_REQUIRED');
 return response;
}
const c=createCourier({REPORIDER_COURIER_ENABLED:'1',REPORIDER_COURIER_INBOX:inbox});
try{
 assert.equal(runner(['--format','json']).status,2,'audit requires initialized ledger');
 initLedger(inbox);
 const empty=makeAuditReport(inbox);
 assert.equal(empty.status,'LOCAL_CHAIN_ONLY_VERIFIED');
 assert.equal(empty.ledger.entry_count,0);
 assert.equal(empty.checkpoint.status,'NOT_SUPPLIED');
 assert.equal(empty.checkpoint.independent_custody_verified,false);
 assert.equal(empty.approval_granted,false);
 assert.equal(empty.data_sent_remotely,false);
 assert.equal(empty.report_persisted,false);
 assert.equal(empty.totals.inbox_packets,0);
 const diskBefore=fs.readdirSync(inbox).sort();
 const emptyJSON=JSON.parse(cli(['--format','json']));
 assert.deepEqual(emptyJSON,empty,'CLI JSON exactly matches pure audit report');
 const emptyText=cli(['--format','text']);
 assert.match(emptyText,/LOCAL OPERATOR AUDIT/);
 assert.match(emptyText,/NO HUMAN ID VERIFIED/);
 assert.deepEqual(fs.readdirSync(inbox).sort(),diskBefore,'audit makes no disk changes');

 const p1=c.enqueue(draft('Build a private React Vite recipe index'));
 const p2=c.enqueue(draft('Create a private React Vite expense tracker'));
 let review=makeAuditReport(inbox);
 assert.equal(review.totals.ready_not_recorded,2,'courier packets are visible, not silently recorded');
 assert.equal(review.totals.recorded_entries,0);
 assert.equal(review.totals.operator_note_files,0);
 const candidate=inspectPacket(inbox,p1.filename);
 assert.equal(candidate.ok,true);
 const note1=saveReviewNote(inbox,candidate.verified,[],
  'REQUEST_CHANGES','Needs more accessibility');
 review=makeAuditReport(inbox);
 assert.equal(review.totals.unrecorded_note_files,1,'unsigned note without ledger entry is surfaced');
 assert.equal(review.notes[0].status,'UNRECORDED_NOT_VERIFIED');
 assert.equal(review.totals.ready_not_recorded,2);
 const rec1=recordEvidence(inbox,p1.filename,note1.filename);
 assert.equal(rec1.sequence,1);
 const anchored=makeCheckpoint(inbox);
 const witness=path.join(external,'checkpoint-one.json');
 fs.writeFileSync(witness,JSON.stringify(anchored,null,2)+'\n',{mode:0o600});
 const checked=makeAuditReport(inbox,{checkpointPath:witness});
 assert.equal(checked.status,'LOCAL_CHAIN_AND_SUPPLIED_CHECKPOINT_MATCH');
 assert.equal(checked.checkpoint.sequence,1);
 assert.equal(checked.checkpoint.independent_custody_verified,false);
 assert.equal(checked.totals.recorded_entries,1);
 assert.equal(checked.totals.distinct_recorded_packets,1);
 assert.equal(checked.totals.ready_not_recorded,1);
 assert.equal(checked.totals.unrecorded_note_files,0);
 assert.equal(checked.totals.decisions.REQUEST_CHANGES,1);
 assert.equal(checked.timeline[0].packet_filename,p1.filename);
 assert.equal(checked.inbox.find(x=>x.filename===p1.filename).status,'RECORDED');
 assert.equal(checked.inbox.find(x=>x.filename===p2.filename).status,'READY_NOT_RECORDED');
 assert.equal(JSON.parse(cli(['--checkpoint',witness,'--format','json'])).checkpoint.sequence,1);
 assert.match(cli(['--checkpoint',witness]),/OPERATOR_SUPPLIED_CHECKPOINT_MATCHED/);
 assert.match(renderAuditText(checked),/INBOX STATUS/);
 assert.equal(fs.existsSync(path.join(inbox,'audit.json')),false,'no reports written without explicit shell redirection');

 const pack2=inspectPacket(inbox,p2.filename);
 assert.equal(pack2.ok,true);
 const note2=saveReviewNote(inbox,pack2.verified,[],'DECLINE','Decline');
 const rec2=recordEvidence(inbox,p2.filename,note2.filename);
 assert.equal(rec2.sequence,2);
 const extended=makeAuditReport(inbox,{checkpointPath:witness});
 assert.equal(extended.ledger.entry_count,2,'historical checkpoint accepts extension');
 assert.equal(extended.checkpoint.sequence,1,'checkpoint is pinned to original prefix');
 assert.equal(extended.totals.decisions.DECLINE,1);

 const garbage='reporider-review-'+crypto.randomUUID()+'.json';
 fs.writeFileSync(path.join(inbox,garbage),'not json',{mode:0o600});
 const rejected=makeAuditReport(inbox);
 assert.equal(rejected.totals.rejected_packets,1,'invalid packet appears as rejected');
 assert.equal(rejected.inbox.find(x=>x.filename===garbage).status,'REJECTED');
 fs.unlinkSync(path.join(inbox,garbage));
 const unknownNote='reporider-note-'+crypto.randomUUID()+'.json';
 fs.writeFileSync(path.join(inbox,'operator-notes',unknownNote),'{}',{mode:0o600});
 const orphan=makeAuditReport(inbox);
 assert.equal(orphan.totals.unrecorded_note_files,1,'unrecorded note is not silently approved');
 fs.unlinkSync(path.join(inbox,'operator-notes',unknownNote));
 const suspicious=path.join(inbox,'operator-notes','strange-file.txt');
 fs.writeFileSync(suspicious,'unexpected');
 assert.equal(makeAuditReport(inbox).totals.suspicious_note_entries,1);
 fs.unlinkSync(suspicious);
 if(process.platform!=='win32'){
  const symlink=path.join(inbox,'operator-notes','reporider-note-'+crypto.randomUUID()+'.json');
  fs.symlinkSync(path.join(inbox,'operator-notes',note1.filename),symlink);
  const r=makeAuditReport(inbox);
  assert.equal(r.totals.suspicious_note_entries,1,'untrusted note symlink remains unopened');
  fs.unlinkSync(symlink);
 }

 const entry2=path.join(inbox,'operator-ledger','entry-000002.json');
 const original=fs.readFileSync(entry2);
 fs.unlinkSync(entry2);
 assert.equal(verifyLedger(inbox).entry_count,1,'shortened local chain still locally consistent');
 assert.equal(runner(['--checkpoint',path.join(external,'checkpoint-one.json'),'--format','json']).status,0,
  'older independent checkpoint correctly verifies surviving prefix');
 const anchor2=makeCheckpoint(inbox);
 assert.equal(anchor2.sequence,1);
 fs.writeFileSync(entry2,original);
 const newer=makeCheckpoint(inbox),file2=path.join(external,'checkpoint-two.json');
 fs.writeFileSync(file2,JSON.stringify(newer));
 fs.unlinkSync(entry2);
 const truncated=runner(['--checkpoint',file2,'--format','json']);
 assert.equal(truncated.status,2,'newer independent checkpoint blocks rollback');
 assert.equal(truncated.stdout,'','no success JSON on verification failure');
 assert.match(truncated.stderr,/CHECKPOINT_AHEAD_OF_LEDGER/);
 fs.writeFileSync(entry2,original);
 assert.equal(JSON.parse(cli(['--checkpoint',file2,'--format','json'])).ledger.entry_count,2);
 assert.equal(runner(['--checkpoint',path.join(inbox,'local-anchor.json')]).status,2,
  'inbox-local checkpoint not accepted');
 assert.equal(runner(['--format','html']).status,2,'reject unsupported rendering formats');
 assert.equal(runner(['--output',path.join(ROOT,'could-write')]).status,2,'no output-file write option');
 assert.equal(fs.existsSync(path.join(ROOT,'could-write')),false);
 assert.equal(runner(['--format','json','--format','json']).status,2,'duplicate flags denied');

 const originalPacket=fs.readFileSync(path.join(inbox,p1.filename));
 fs.appendFileSync(path.join(inbox,p1.filename),' ');
 const tamp=runner(['--format','json']);
 assert.equal(tamp.status,2,'recorded source drift blocks successful report');
 assert.equal(tamp.stdout,'');
 fs.writeFileSync(path.join(inbox,p1.filename),originalPacket);
 assert.equal(JSON.parse(cli(['--format','json'])).ledger.entry_count,2);
 console.log('RR-A08 PASS: read-only local report, inventory, unsigned decisions, independent prefix checks, truncation, tampering and no hidden write');
}finally{fs.rmSync(ROOT,{recursive:true,force:true});}
