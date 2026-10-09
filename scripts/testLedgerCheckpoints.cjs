'use strict';
// RR-A07: independent operator checkpoint pinning, prefix verification,
// extension, truncation, malformed anchors and custody-boundary controls.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const crypto=require('node:crypto');
const {spawnSync}=require('node:child_process');
const {runAgentRail,REQUEST_SCHEMA}=require('../.agent-build/src/agent/rail.js');
const {createCourier}=require('./reporider-courier.cjs');
const {inspectPacket,saveReviewNote}=require('./reporider-operator-core.cjs');
const {initLedger,recordEvidence,verifyLedger}=require('./reporider-operator-ledger.cjs');
const {makeCheckpoint,validateCheckpoint,verifyCheckpointFile}=require('./reporider-operator-checkpoints.cjs');

const root=fs.mkdtempSync(path.join(os.tmpdir(),'rr-a07-'));
const inbox=path.join(root,'private-inbox');
const elsewhere=path.join(root,'operator-witness');
fs.mkdirSync(inbox,{mode:0o700});
fs.mkdirSync(elsewhere,{mode:0o700});
if(process.platform!=='win32'){fs.chmodSync(inbox,0o700);fs.chmodSync(elsewhere,0o700);}
const script=path.resolve(__dirname,'reporider-ledger.cjs');
function cli(args){
 const result=spawnSync(process.execPath,[script,'--inbox',inbox,...args],{
  encoding:'utf8',timeout:10000,maxBuffer:1024*1024
 });
 assert.ifError(result.error);
 return result;
}
function ok(args){
 const result=cli(args);
 assert.equal(result.status,0,result.stderr);
 return JSON.parse(result.stdout);
}
const checkKeys=(v)=>[
 ...v.files.map(f=>'file:'+f.path+':'+f.approval_fingerprint),
 ...v.issues.map(it=>'issue:'+it.index+':'+it.approval_fingerprint)
];
function candidate(idea){
 const result=runAgentRail({schema:REQUEST_SCHEMA,action:'submit_for_review',idea});
 assert.equal(result.disposition,'REVIEW_REQUIRED');
 return result;
}
function addEvidence(idea,decision){
 const courier=createCourier({REPORIDER_COURIER_ENABLED:'1',REPORIDER_COURIER_INBOX:inbox});
 const receipt=courier.enqueue(candidate(idea));
 const pack=inspectPacket(inbox,receipt.filename);
 assert.equal(pack.ok,true);
 const checked=decision==='RECOMMEND_FOR_SEPARATE_AUTHORIZATION'?checkKeys(pack.verified):[];
 const note=saveReviewNote(inbox,pack.verified,checked,decision,'Independent review note, no authority');
 return recordEvidence(inbox,receipt.filename,note.filename);
}
try{
 assert.equal(cli(['checkpoint']).status,2,'checkpoint requires initialized ledger');
 initLedger(inbox);
 const zero=ok(['checkpoint']);
 assert.equal(zero.sequence,0);
 assert.equal(zero.head_sha256,'0'.repeat(64));
 assert.equal(validateCheckpoint(zero).checkpoint_sha256,zero.checkpoint_sha256);
 const anchor0=path.join(elsewhere,'genesis.json');
 fs.writeFileSync(anchor0,JSON.stringify(zero)+'\n',{mode:0o600});
 assert.equal(ok(['verify-checkpoint',anchor0]).checkpoint_matches,true);

 const first=addEvidence('Make a private React Vite journal app','REQUEST_CHANGES');
 assert.equal(first.sequence,1);
 const c1=ok(['checkpoint']);
 assert.equal(c1.sequence,1);
 assert.equal(c1.head_sha256,first.entry_sha256);
 assert.equal(c1.independent_custody_verified,false);
 assert.equal(c1.signature_verified,false);
 const file1=path.join(elsewhere,'checkpoint-one.json');
 fs.writeFileSync(file1,JSON.stringify(c1,null,2)+'\n',{mode:0o600});
 const match1=ok(['verify-checkpoint',file1]);
 assert.equal(match1.checkpoint_matches,true);
 assert.equal(match1.current_sequence,1);
 assert.equal(match1.independent_custody_verified,false);
 assert.equal(match1.execution_authorized,false);
 assert.equal(match1.github_write_executed,false);
 assert.equal(ok(['verify-checkpoint',anchor0]).checkpoint_matches,true,
  'genesis retained when history extends');

 const second=addEvidence('Build a private React Vite reading list','DECLINE');
 assert.equal(second.sequence,2);
 const extended=ok(['verify-checkpoint',file1]);
 assert.equal(extended.checkpoint_matches,true,'older checkpoint remains true for an unchanged prefix');
 assert.equal(extended.current_sequence,2);
 assert.equal(extended.current_head_sha256,second.entry_sha256);
 const c2=ok(['checkpoint']);
 assert.equal(c2.sequence,2);
 const file2=path.join(elsewhere,'checkpoint-two.json');
 fs.writeFileSync(file2,JSON.stringify(c2)+'\n',{mode:0o600});
 assert.equal(ok(['verify-checkpoint',file2]).checkpoint_matches,true);

 const inside=path.join(inbox,'not-independent.json');
 fs.writeFileSync(inside,JSON.stringify(c2));
 assert.equal(cli(['verify-checkpoint',inside]).status,2,'inbox cannot masquerade as independent custody');
 assert.equal(cli(['verify-checkpoint','./relative.json']).status,2);
 const mutated={...c2,head_sha256:crypto.randomBytes(32).toString('hex')};
 const wrongChecksum=path.join(elsewhere,'checksum-wrong.json');
 fs.writeFileSync(wrongChecksum,JSON.stringify(mutated));
 assert.equal(cli(['verify-checkpoint',wrongChecksum]).status,2,'checksum flags casual editing');
 const forgedContent={
   ...c2,head_sha256:crypto.randomBytes(32).toString('hex')
 };
 const {checkpoint_sha256,...raw}=forgedContent;
 forgedContent.checkpoint_sha256=crypto.createHash('sha256').update(JSON.stringify(raw)).digest('hex');
 const forgedFile=path.join(elsewhere,'consistent-but-wrong.json');
 fs.writeFileSync(forgedFile,JSON.stringify(forgedContent));
 const failure=cli(['verify-checkpoint',forgedFile]);
 assert.equal(failure.status,2,'consistent forged hash still mismatches ledger');
 assert.match(failure.stderr,/CHECKPOINT_HISTORY_DIVERGED/);
 const unknown=path.join(elsewhere,'unknown-field.json');
 fs.writeFileSync(unknown,JSON.stringify({...c2,trust_me:true}));
 assert.equal(cli(['verify-checkpoint',unknown]).status,2,'unknown metadata blocked');
 const promoted=path.join(elsewhere,'claimed-authorized.json');
 fs.writeFileSync(promoted,JSON.stringify({...c2,execution_authorized:true}));
 assert.equal(cli(['verify-checkpoint',promoted]).status,2,'cannot promote checkpoint to authority');
 const large=path.join(elsewhere,'large.json');
 fs.writeFileSync(large,'X'.repeat(4097));
 assert.equal(cli(['verify-checkpoint',large]).status,2,'oversized anchor refused');
 if(process.platform!=='win32'){
  const sym=path.join(elsewhere,'linked.json');
  fs.symlinkSync(file2,sym);
  assert.equal(cli(['verify-checkpoint',sym]).status,2,'symlink anchor refused');
 }

 const ledgerDir=path.join(inbox,'operator-ledger');
 const last=path.join(ledgerDir,'entry-000002.json');
 const original=fs.readFileSync(last);
 fs.unlinkSync(last);
 assert.equal(verifyLedger(inbox).entry_count,1,'self-consistent truncated chain still passes local-only check');
 const truncated=cli(['verify-checkpoint',file2]);
 assert.equal(truncated.status,2,'externally retained sequence detects deletion');
 assert.match(truncated.stderr,/CHECKPOINT_AHEAD_OF_LEDGER/);
 assert.equal(ok(['verify-checkpoint',file1]).checkpoint_matches,true,
  'previous retained checkpoint still validates surviving prefix');
 fs.writeFileSync(last,original);
 assert.equal(ok(['verify-checkpoint',file2]).checkpoint_matches,true,'restore full history');

 const firstPath=path.join(ledgerDir,'entry-000001.json');
 const originalFirst=fs.readFileSync(firstPath);
 const entry=JSON.parse(originalFirst.toString('utf8'));
 entry.decision='DECLINE';
 fs.writeFileSync(firstPath,JSON.stringify(entry));
 assert.equal(cli(['verify-checkpoint',file2]).status,2,'record mutation fails local verification');
 fs.writeFileSync(firstPath,originalFirst);
 assert.equal(ok(['verify-checkpoint',file2]).checkpoint_matches,true);
 assert.equal(fs.readdirSync(elsewhere).length>=2,true);
 console.log('RR-A07 PASS: external SHA-256 checkpoints, prefix extension, truncation rollback, forgery mismatch, path and size constraints, no authority');
}finally{
 fs.rmSync(root,{recursive:true,force:true});
}
