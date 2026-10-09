'use strict';

/**
 * RR-A06: operator-only, tamper-EVIDENT local evidence chain.
 * Never surfaced as an MCP method. Never authenticates anyone and never
 * approves/executes GitHub writes. Local SHA-256 records can be rewritten by
 * an attacker with filesystem access; export HEAD separately to pin history.
 */
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {TextDecoder}=require('node:util');
const {assertInbox,readPacket,PACKET}=require('./reporider-operator-core.cjs');
const {inspectReviewImport}=require('../.agent-build/src/agent/reviewDesk.js');
const NOTE_PATTERN=/^reporider-note-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.json$/;
const ENTRY_PATTERN=/^entry-(\d{6})\.json$/;
const SUBDIR='operator-ledger';
const NOTES='operator-notes';
const MAX_ENTRIES=500;
const MAX_ENTRY_BYTES=8192;
const MAX_NOTE_BYTES=16384;
const EMPTY_HEAD='0'.repeat(64);
const SCHEMA='reporider.local.evidence-entry.v0.1';
function fail(code){const e=new Error(code);e.code=code;throw e;}
const sha256=data=>crypto.createHash('sha256').update(data).digest('hex');
const hex64=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const strictObject=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
function dirInfo(dir){
 const stat=fs.lstatSync(dir);
 if(stat.isSymbolicLink()||!stat.isDirectory())fail('LEDGER_DIRECTORY_UNSAFE');
 if(fs.realpathSync.native(dir)!==path.resolve(dir))fail('LEDGER_DIRECTORY_ALIAS');
 if(process.platform!=='win32'&&(stat.mode&0o077)!==0)fail('LEDGER_DIRECTORY_PERMISSIONS');
 return dir;
}
function location(inbox){
 const base=assertInbox(inbox);
 return{base,dir:path.join(base,SUBDIR),notes:path.join(base,NOTES)};
}
function existing(inbox){
 const loc=location(inbox);
 if(!fs.existsSync(loc.dir))fail('LEDGER_NOT_INITIALIZED');
 dirInfo(loc.dir);
 return loc;
}
function initLedger(inbox){
 const loc=location(inbox);
 try{fs.mkdirSync(loc.dir,{mode:0o700});}
 catch(e){if(e.code==='EEXIST')fail('LEDGER_ALREADY_INITIALIZED');fail('LEDGER_INIT_FAILED');}
 dirInfo(loc.dir);
 return{schema:'reporider.local.ledger-init.v0.1',directory:SUBDIR,entries:0,
  head_sha256:EMPTY_HEAD,executed_local_directory_write:true,
  approval_granted:false,live_write_authorized:false,github_write_executed:false};
}
function readBoundedFile(dir,name,max){
 const full=path.join(dir,name);
 const lst=fs.lstatSync(full);
 if(lst.isSymbolicLink()||!lst.isFile())fail('NOT_REGULAR_FILE');
 if(lst.size===0||lst.size>max)fail('FILE_SIZE_INVALID');
 let fd;
 try{
  fd=fs.openSync(full,fs.constants.O_RDONLY|(fs.constants.O_NOFOLLOW||0));
  const st=fs.fstatSync(fd);
  if(!st.isFile()||st.size===0||st.size>max)fail('FILE_SIZE_INVALID');
  const bytes=Buffer.alloc(st.size);let pos=0;
  while(pos<bytes.length){
   const n=fs.readSync(fd,bytes,pos,bytes.length-pos,pos);
   if(n===0)fail('FILE_CHANGED_DURING_READ');
   pos+=n;
  }
  const after=fs.fstatSync(fd);
  if(after.ino!==st.ino||after.size!==st.size||after.mtimeMs!==st.mtimeMs)
   fail('FILE_CHANGED_DURING_READ');
  return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
 }finally{if(fd!==undefined)fs.closeSync(fd);}
}
function readNote(notes,filename){
 if(typeof filename!=='string'||!NOTE_PATTERN.test(filename))fail('INVALID_NOTE_NAME');
 const stat=fs.lstatSync(notes);
 if(stat.isSymbolicLink()||!stat.isDirectory()||
    fs.realpathSync.native(notes)!==path.resolve(notes))fail('NOTE_DIRECTORY_UNSAFE');
 if(process.platform!=='win32'&&(stat.mode&0o077)!==0)fail('NOTE_DIRECTORY_PERMISSIONS');
 const contents=readBoundedFile(notes,filename,MAX_NOTE_BYTES);
 let note;
 try{note=JSON.parse(contents);}catch{fail('INVALID_NOTE_JSON');}
 if(!strictObject(note)||note.schema!=='reporider.local.review-note.v0.1'||
  note.review_location!=='LOCAL_OPERATOR_CONSOLE'||
  note.approval_granted!==false||note.live_write_authorized!==false||
  note.source_identity_authenticated!==false||note.reviewer_identity_authenticated!==false||
  note.signature_verified!==false||note.executed!==false||note.delivered!==false||
  note.boundary!=='INFORMATIONAL_NOTE_ONLY'||
  !['RECOMMEND_FOR_SEPARATE_AUTHORIZATION','REQUEST_CHANGES','DECLINE'].includes(note.decision)||
  !Array.isArray(note.checked_artifacts)||!Number.isInteger(note.required_artifacts)||
  typeof note.proposal_fingerprint!=='string')fail('NOTE_NOT_INFORMATIONAL');
 return{contents,note};
}
function verifyNoteAgainstPacket(note,verified){
 const wanted=[
  ...verified.files.map(f=>'file:'+f.path+':'+f.approval_fingerprint),
  ...verified.issues.map(it=>'issue:'+it.index+':'+it.approval_fingerprint)
 ];
 if(note.required_artifacts!==wanted.length||
   new Set(note.checked_artifacts).size!==note.checked_artifacts.length||
   note.checked_artifacts.some(key=>typeof key!=='string'||!wanted.includes(key))||
   (note.decision==='RECOMMEND_FOR_SEPARATE_AUTHORIZATION'&&
    (note.checked_artifacts.length!==wanted.length||
     wanted.some(key=>!note.checked_artifacts.includes(key)))))
  fail('LEDGER_NOTE_REVIEW_MISMATCH');
}
function validRecordShape(e){
 return strictObject(e)&&e.schema===SCHEMA&&
   Number.isInteger(e.sequence)&&e.sequence>=1&&e.sequence<=MAX_ENTRIES&&
   hex64(e.previous_entry_sha256)&&hex64(e.packet_sha256)&&hex64(e.note_sha256)&&hex64(e.entry_sha256)&&
   typeof e.proposal_fingerprint==='string'&&typeof e.recorded_at==='string'&&
   typeof e.packet_filename==='string'&&PACKET.test(e.packet_filename)&&
   NOTE_PATTERN.test(e.note_filename)&&
   ['RECOMMEND_FOR_SEPARATE_AUTHORIZATION','REQUEST_CHANGES','DECLINE'].includes(e.decision)&&
   e.source_identity_authenticated===false&&e.reviewer_identity_authenticated===false&&
   e.signature_verified===false&&e.approval_granted===false&&
   e.live_write_authorized===false&&e.github_write_executed===false;
}
function readEntries(dir){
 const listing=fs.readdirSync(dir,{withFileTypes:true});
 const entries=listing.filter(x=>ENTRY_PATTERN.test(x.name));
 if(entries.length>MAX_ENTRIES)fail('LEDGER_CAPACITY_REACHED');
 entries.sort((a,b)=>a.name.localeCompare(b.name));
 const result=[];
 for(let i=0;i<entries.length;i++){
  const name=entries[i].name;
  if(name!=='entry-'+String(i+1).padStart(6,'0')+'.json')
   fail('LEDGER_SEQUENCE_GAP');
  const bytes=readBoundedFile(dir,name,MAX_ENTRY_BYTES);
  let entry;
  try{entry=JSON.parse(bytes);}catch{fail('LEDGER_ENTRY_INVALID_JSON');}
  if(!validRecordShape(entry)||entry.sequence!==i+1)fail('LEDGER_ENTRY_INVALID');
  const without={...entry};delete without.entry_sha256;
  if(entry.entry_sha256!==sha256(JSON.stringify(without)))
   fail('LEDGER_ENTRY_HASH_MISMATCH');
  if(entry.previous_entry_sha256!==(i===0?EMPTY_HEAD:result[i-1].entry_sha256))
   fail('LEDGER_LINK_MISMATCH');
  result.push(entry);
 }
 return result;
}
function verifyLedger(inbox){
 const loc=existing(inbox);
 const records=readEntries(loc.dir);
 for(const entry of records){
  const rawPacket=readPacket(loc.base,entry.packet_filename);
  const packet=inspectReviewImport(rawPacket);
  if(!packet.ok)fail('LEDGER_PACKET_MISSING_OR_CHANGED');
  if(packet.value.fingerprint!==entry.proposal_fingerprint)
   fail('LEDGER_PROPOSAL_CHANGED');
  if(sha256(Buffer.from(rawPacket,'utf8'))!==entry.packet_sha256)fail('LEDGER_PACKET_HASH_MISMATCH');
  const {contents,note}=readNote(loc.notes,entry.note_filename);
  if(sha256(contents)!==entry.note_sha256)fail('LEDGER_NOTE_HASH_MISMATCH');
  if(note.proposal_fingerprint!==entry.proposal_fingerprint||note.decision!==entry.decision)
   fail('LEDGER_NOTE_MISMATCH');
  verifyNoteAgainstPacket(note,packet.value);
 }
 return{
  schema:'reporider.local.ledger-verify.v0.1',
  status:'LOCAL_CHAIN_CONSISTENT',
  entry_count:records.length,
  head_sha256:records.length?records[records.length-1].entry_sha256:EMPTY_HEAD,
  independent_anchor_verified:false,
  operator_identity_authenticated:false,
  approval_granted:false,live_write_authorized:false,github_write_executed:false,
  warning:'Local SHA-256 chain cannot prevent full-history rewriting or tail truncation. Preserve HEAD independently to detect those changes.'
 };
}
function recordEvidence(inbox,packetFilename,noteFilename){
 const loc=existing(inbox);
 if(typeof packetFilename!=='string'||!PACKET.test(packetFilename))
  fail('INVALID_PACKET_NAME');
 const packetSource=readPacket(loc.base,packetFilename);
 const packet=inspectReviewImport(packetSource);
 if(!packet.ok)fail('INVALID_PACKET');
 const noteInfo=readNote(loc.notes,noteFilename);
 if(noteInfo.note.proposal_fingerprint!==packet.value.fingerprint)
  fail('PROPOSAL_FINGERPRINT_MISMATCH');
 verifyNoteAgainstPacket(noteInfo.note,packet.value);
 // Fail-closed full current history verification before append.
 const lock=path.join(loc.dir,'.append.lock');
 let fd;
 try{
  fd=fs.openSync(lock,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|
    (fs.constants.O_NOFOLLOW||0),0o600);
 }catch{fail('LEDGER_LOCKED');}
 try{
  const prior=verifyLedger(loc.base);
  if(prior.entry_count>=MAX_ENTRIES)fail('LEDGER_CAPACITY_REACHED');
  const prev=readEntries(loc.dir);
  if(prev.some(x=>x.note_filename===noteFilename))fail('NOTE_ALREADY_RECORDED');
  // Recheck both pieces of evidence after obtaining the exclusive append lock.
  const packetNow=readPacket(loc.base,packetFilename);
  const noteNow=readNote(loc.notes,noteFilename);
  if(packetNow!==packetSource||noteNow.contents!==noteInfo.contents)fail('EVIDENCE_CHANGED_DURING_APPEND');
  const packetBytes=Buffer.from(packetNow,'utf8');
  const noteBytes=Buffer.from(noteNow.contents,'utf8');
  const entry={
   schema:SCHEMA,sequence:prior.entry_count+1,
   previous_entry_sha256:prior.head_sha256,
   packet_filename:packetFilename,
   note_filename:noteFilename,
   proposal_fingerprint:packet.value.fingerprint,
   decision:noteInfo.note.decision,
   packet_sha256:sha256(packetBytes),note_sha256:sha256(noteBytes),
   recorded_at:new Date().toISOString(),
   source_identity_authenticated:false,reviewer_identity_authenticated:false,
   signature_verified:false,approval_granted:false,
   live_write_authorized:false,github_write_executed:false
  };
  const entry_sha256=sha256(JSON.stringify(entry));
  const record={...entry,entry_sha256};
  const name='entry-'+String(entry.sequence).padStart(6,'0')+'.json';
  let writer;
  try{
   writer=fs.openSync(path.join(loc.dir,name),fs.constants.O_WRONLY|fs.constants.O_CREAT|
    fs.constants.O_EXCL|(fs.constants.O_NOFOLLOW||0),0o600);
   fs.writeFileSync(writer,JSON.stringify(record,null,2)+'\n');
   fs.fsyncSync(writer);fs.closeSync(writer);writer=undefined;
  }catch(e){
   if(writer!==undefined)try{fs.closeSync(writer);}catch{}
   // Never delete/rewrite an existing entry after O_EXCL failure.
   fail('LEDGER_APPEND_FAILED');
  }
  return{
   schema:'reporider.local.ledger-record-receipt.v0.1',
   status:'LOCAL_ENTRY_RECORDED',sequence:entry.sequence,
   entry_filename:name,entry_sha256,previous_entry_sha256:entry.previous_entry_sha256,
   local_file_write_executed:true,operator_identity_authenticated:false,
   approval_granted:false,live_write_authorized:false,github_write_executed:false
  };
 }finally{
  try{fs.closeSync(fd);}catch{}
  try{fs.unlinkSync(lock);}catch{}
 }
}
module.exports={initLedger,verifyLedger,recordEvidence,SCHEMA,EMPTY_HEAD,MAX_ENTRIES};
