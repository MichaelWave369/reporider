'use strict';
// RR-A05: real courier -> read-only operator inbox -> unsigned note tests.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const crypto=require('node:crypto');
const {spawnSync}=require('node:child_process');
const {runAgentRail,REQUEST_SCHEMA}=require('../.agent-build/src/agent/rail.js');
const {createCourier}=require('./reporider-courier.cjs');
const {assertInbox,readPacket,listPackets,inspectPacket,saveReviewNote}=
 require('./reporider-operator-core.cjs');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'rr-a05-'));
const dir=path.join(root,'inbox');
fs.mkdirSync(dir,{mode:0o700});
if(process.platform!=='win32')fs.chmodSync(dir,0o700);
function cli(args){
 const result=spawnSync(process.execPath,[path.join(__dirname,'reporider-operator.cjs'),...args],
  {encoding:'utf8',timeout:10000,maxBuffer:1024*1024,env:{...process.env,REPORIDER_COURIER_INBOX:''}});
 assert.ifError(result.error);
 return result;
}
try{
 const candidate=runAgentRail({
  schema:REQUEST_SCHEMA,action:'submit_for_review',
  idea:'Create a private React Vite personal task tracker'
 });
 assert.equal(candidate.disposition,'REVIEW_REQUIRED','candidate replayable');
 const c=createCourier({REPORIDER_COURIER_ENABLED:'1',REPORIDER_COURIER_INBOX:dir});
 assert.ok(c);
 const receipt=c.enqueue(candidate);
 assert.equal(receipt.local_file_write_executed,true);
 const name=receipt.filename;
 const filenames=fs.readdirSync(dir);
 assert.deepEqual(filenames,[name],'only courier file exists');
 const info=inspectPacket(dir,name);
 assert.equal(info.ok,true,'packet verified');
 assert.equal(info.verified.fingerprint,candidate.data.summary.fingerprint);
 const list=listPackets(dir);
 assert.equal(list.length,1);
 assert.equal(list[0].status,'READY_FOR_MANUAL_INSPECTION');
 assert.equal(list[0].filename,name);
 assert.equal(list[0].files,info.verified.files.length);
 assert.equal(list[0].issues,info.verified.issues.length);
 assert.equal(readPacket(dir,name).endsWith('\n'),true,'retains whole UTF-8 packet');
 assert.equal(fs.existsSync(path.join(dir,'operator-notes')),false,'listing does not write');

 const printed=cli(['--inbox',dir,'list']);
 assert.equal(printed.status,0,printed.stderr);
 assert.match(printed.stdout,/READY/);
 assert.match(printed.stdout,/none auto-approved/);
 assert.equal(fs.existsSync(path.join(dir,'operator-notes')),false);
 const inspect=cli(['--inbox',dir,'inspect',name]);
 assert.equal(inspect.status,0,inspect.stderr);
 assert.match(inspect.stdout,/not source authentication/);
 assert.match(inspect.stdout,/NON-signature/);
 const direct=cli(['--inbox',dir,'inspect','../../etc/passwd']);
 assert.equal(direct.status,2,'cannot read outside inbox');
 assert.match(direct.stderr,/PACKET_REJECTED_INVALID_PACKET_NAME/);
 const nonInteractive=cli(['--inbox',dir,'review',name]);
 assert.equal(nonInteractive.status,2,'note recording requires interactive terminal');
 assert.match(nonInteractive.stderr,/REVIEW_REQUIRES_INTERACTIVE_TERMINAL/);
 assert.equal(fs.existsSync(path.join(dir,'operator-notes')),false);
 const help=cli(['--help']);
 assert.equal(help.status,0);
 assert.match(help.stdout,/Local Operator Console/);

 const v=info.verified;
 const checked=[...v.files.map(f=>'file:'+f.path+':'+f.approval_fingerprint),
  ...v.issues.map(it=>'issue:'+it.index+':'+it.approval_fingerprint)];
 assert.throws(()=>saveReviewNote(dir,v,[],
   'RECOMMEND_FOR_SEPARATE_AUTHORIZATION','Not complete'),/REVIEW_INCOMPLETE/);
 assert.equal(fs.existsSync(path.join(dir,'operator-notes')),false,'incomplete note never opens folder');
 const saved=saveReviewNote(dir,v,checked,'RECOMMEND_FOR_SEPARATE_AUTHORIZATION','Only an informational recommendation.');
 const notePath=path.join(dir,'operator-notes',saved.filename);
 assert.equal(fs.existsSync(notePath),true,'manual note file explicitly saved');
 const note=JSON.parse(fs.readFileSync(notePath,'utf8'));
 assert.equal(note.review_location,'LOCAL_OPERATOR_CONSOLE','not mislabeled browser');
 assert.equal(note.approval_granted,false);
 assert.equal(note.reviewer_identity_authenticated,false);
 assert.equal(note.signature_verified,false);
 assert.equal(note.live_write_authorized,false);
 assert.equal(note.executed,false);
 assert.equal(note.delivered,false);
 assert.equal(note.checked_artifacts.length,checked.length);
 if(process.platform!=='win32'){
  assert.equal(fs.statSync(notePath).mode&0o077,0,'owner-only local note');
  assert.equal(fs.statSync(path.dirname(notePath)).mode&0o077,0,'private note directory');
 }
 assert.equal(listPackets(dir).length,1,'note never counted as courier proposal');
 const decline=saveReviewNote(dir,v,[],'DECLINE','Not suitable for the project');
 assert.equal(decline.note.approval_granted,false);

 const forged=path.join(dir,'reporider-review-'+crypto.randomUUID()+'.json');
 const modified=JSON.parse(fs.readFileSync(path.join(dir,name),'utf8'));
 modified.data.review_packet.files[0].content='malicious changed content';
 fs.writeFileSync(forged,JSON.stringify(modified),{mode:0o600});
 assert.equal(inspectPacket(dir,path.basename(forged)).ok,false,'tampered replay rejected');
 const wrong=path.join(dir,'reporider-review-'+crypto.randomUUID()+'.json');
 fs.writeFileSync(wrong,'not json',{mode:0o600});
 assert.equal(inspectPacket(dir,path.basename(wrong)).ok,false,'malformed packet rejected');
 const huge=path.join(dir,'reporider-review-'+crypto.randomUUID()+'.json');
 fs.writeFileSync(huge,'X'.repeat(250001),{mode:0o600});
 assert.equal(inspectPacket(dir,path.basename(huge)).code,'PACKET_SIZE_INVALID');
 assert.throws(()=>readPacket(dir,'../../secret.json'),/INVALID_PACKET_NAME/);
 assert.throws(()=>readPacket(dir,'reporider-review-bad.json'),/INVALID_PACKET_NAME/);
 if(process.platform!=='win32'){
  const symlink=path.join(dir,'reporider-review-'+crypto.randomUUID()+'.json');
  fs.symlinkSync(path.join(dir,name),symlink);
  assert.equal(inspectPacket(dir,path.basename(symlink)).code,'PACKET_NOT_REGULAR_FILE');
  const outside=path.join(root,'symlink');
  fs.symlinkSync(dir,outside,'dir');
  assert.throws(()=>assertInbox(outside),/INVALID_INBOX/);
  const weak=path.join(root,'weak');fs.mkdirSync(weak);fs.chmodSync(weak,0o777);
  assert.throws(()=>assertInbox(weak),/INBOX_INSECURE_PERMISSIONS/);
 }
 for(let i=0;i<130;i++)fs.writeFileSync(path.join(dir,'reporider-review-nope'+i+'.json'),'{}');
 assert.throws(()=>listPackets(dir),/TOO_MANY_PACKET_ENTRIES/,'overlarge enumeration fails closed');
 console.log('RR-A05 PASS: real inbox, CLI list/inspect, no TTY bypass, replay tamper checks, note export and hard path boundaries');
}finally{fs.rmSync(root,{recursive:true,force:true});}
