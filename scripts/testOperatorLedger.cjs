'use strict';
// RR-A06: actual on-disk chain, append, replay verification, tampering tests.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {spawnSync}=require('node:child_process');
const {runAgentRail,REQUEST_SCHEMA}=require('../.agent-build/src/agent/rail.js');
const {createCourier}=require('./reporider-courier.cjs');
const {inspectPacket,saveReviewNote}=require('./reporider-operator-core.cjs');
const {initLedger,verifyLedger,recordEvidence,EMPTY_HEAD}=require('./reporider-operator-ledger.cjs');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'rr-a06-'));
const inbox=path.join(root,'inbox');
fs.mkdirSync(inbox,{mode:0o700});
if(process.platform!=='win32')fs.chmodSync(inbox,0o700);
const executable=path.resolve(__dirname,'reporider-ledger.cjs');
function cli(args){
 const p=spawnSync(process.execPath,[executable,'--inbox',inbox,...args],{
  encoding:'utf8',maxBuffer:2*1024*1024,timeout:12000
 });
 assert.ifError(p.error);return p;
}
function good(args){
 const p=cli(args);assert.equal(p.status,0,p.stderr);return JSON.parse(p.stdout);
}
function checked(v){
 return [...v.files.map(x=>'file:'+x.path+':'+x.approval_fingerprint),
  ...v.issues.map(x=>'issue:'+x.index+':'+x.approval_fingerprint)];
}
try{
 assert.equal(cli(['head']).status,2,'cannot read uninitialized ledger');
 const init=good(['init']);
 assert.equal(init.entries,0);
 assert.equal(init.head_sha256,EMPTY_HEAD);
 assert.equal(init.approval_granted,false);
 assert.equal(cli(['init']).status,2,'init never resets existing chain');
 assert.equal(good(['verify']).entry_count,0);
 const before=fs.readdirSync(path.join(inbox,'operator-ledger'));
 assert.deepEqual(before,[],'verify is read-only');
 const candidate=runAgentRail({schema:REQUEST_SCHEMA,action:'submit_for_review',
  idea:'Build a private React Vite budget receipt sorter'});
 assert.equal(candidate.disposition,'REVIEW_REQUIRED');
 const courier=createCourier({REPORIDER_COURIER_ENABLED:'1',REPORIDER_COURIER_INBOX:inbox});
 const a=courier.enqueue(candidate),b=courier.enqueue(candidate);
 const v=inspectPacket(inbox,a.filename);
 assert.equal(v.ok,true);
 const yes=saveReviewNote(inbox,v.verified,checked(v.verified),
  'RECOMMEND_FOR_SEPARATE_AUTHORIZATION','Reviewed');
 const no=saveReviewNote(inbox,v.verified,[],'DECLINE','Needs different approach');
 const head0=good(['head']);
 assert.equal(head0.head_sha256,EMPTY_HEAD,'review notes cannot auto-record');
 assert.equal(head0.sequence,0);

 const first=good(['record',a.filename,yes.filename]);
 assert.equal(first.sequence,1);
 assert.equal(first.local_file_write_executed,true);
 assert.equal(first.github_write_executed,false);
 assert.equal(first.approval_granted,false);
 assert.equal(first.live_write_authorized,false);
 const verifiedOne=good(['verify']);
 assert.equal(verifiedOne.entry_count,1);
 assert.equal(verifiedOne.head_sha256,first.entry_sha256);
 assert.equal(verifiedOne.independent_anchor_verified,false);
 const second=good(['record',b.filename,no.filename]);
 assert.equal(second.sequence,2);
 assert.equal(second.previous_entry_sha256,first.entry_sha256);
 assert.notEqual(second.entry_sha256,first.entry_sha256);
 assert.equal(good(['verify']).entry_count,2);
 assert.equal(cli(['record',b.filename,no.filename]).status,2,'same note never double-added');
 assert.equal(good(['head']).head_sha256,second.entry_sha256);
 assert.equal(fs.readdirSync(path.join(inbox,'operator-ledger')).length,2,'no left-behind lock');

 const notePath=path.join(inbox,'operator-notes',no.filename);
 const originalNote=fs.readFileSync(notePath);
 fs.appendFileSync(notePath,' ');
 assert.equal(cli(['verify']).status,2,'note tampering detected');
 fs.writeFileSync(notePath,originalNote);
 assert.equal(good(['verify']).entry_count,2,'restoring original evidence succeeds');
 const packetPath=path.join(inbox,a.filename);
 const origPacket=fs.readFileSync(packetPath);
 fs.appendFileSync(packetPath,' ');
 assert.equal(cli(['verify']).status,2,'packet byte tampering detected');
 fs.writeFileSync(packetPath,origPacket);
 assert.equal(good(['verify']).entry_count,2);

 const entry1=path.join(inbox,'operator-ledger','entry-000001.json');
 const originalEntry=fs.readFileSync(entry1);
 const forged=JSON.parse(originalEntry.toString('utf8'));
 forged.decision='DECLINE';
 fs.writeFileSync(entry1,JSON.stringify(forged));
 assert.equal(cli(['verify']).status,2,'ledger record tampering detected');
 fs.writeFileSync(entry1,originalEntry);
 assert.equal(good(['verify']).entry_count,2);
 const entry2=path.join(inbox,'operator-ledger','entry-000002.json');
 const origEntry2=fs.readFileSync(entry2);
 fs.unlinkSync(entry1);
 assert.equal(cli(['verify']).status,2,'sequence gaps detected');
 fs.writeFileSync(entry1,originalEntry);
 assert.equal(good(['verify']).entry_count,2);
 fs.unlinkSync(entry2);
 assert.equal(good(['verify']).entry_count,1,'tail truncation not provable without independent anchor');
 assert.notEqual(good(['head']).head_sha256,second.entry_sha256,'previous externally saved head detects truncation');
 fs.writeFileSync(entry2,origEntry2);
 assert.equal(good(['verify']).entry_count,2);

 const lock=path.join(inbox,'operator-ledger','.append.lock');
 fs.writeFileSync(lock,'occupied');
 assert.equal(cli(['record',a.filename,yes.filename]).status,2,'locked ledger refuses changes');
 fs.unlinkSync(lock);
 assert.equal(good(['verify']).entry_count,2);
 assert.equal(cli(['record','../evil.json',yes.filename]).status,2,'packet traversal refused');
 assert.equal(cli(['record',a.filename,'../../evil.json']).status,2,'note traversal refused');
 assert.equal(good(['verify']).entry_count,2);
 if(process.platform!=='win32'){
  const symlink=path.join(inbox,'operator-ledger','entry-000003.json');
  fs.symlinkSync(entry2,symlink);
  assert.equal(cli(['verify']).status,2,'symlink entries blocked');
  fs.unlinkSync(symlink);
 }
 assert.equal(cli(['--help']).status,0,'help available');
 assert.equal(good(['verify']).entry_count,2);
 console.log('RR-A06 PASS: explicit ledger init/record, SHA256 chain, note+packet replay, no-authority, tamper/gap/truncation tests');
}finally{fs.rmSync(root,{recursive:true,force:true});}
