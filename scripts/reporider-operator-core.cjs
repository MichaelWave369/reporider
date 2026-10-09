'use strict';

/**
 * RR-A05: human-side local review inbox core.
 *
 * Operator-only CLI dependency, never registered as an MCP tool.
 * Uses RR-A03 replay/safety verifier, no live GitHub writer.
 * The only writes are explicitly requested, unsigned review-note exports.
 */
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {TextDecoder}=require('node:util');
const {inspectReviewImport,makeLocalReviewNote,requiredReviewKeys}=
  require('../.agent-build/src/agent/reviewDesk.js');
const {MAX_PACKET_BYTES}=require('./reporider-courier.cjs');
const PACKET=/^reporider-review-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.json$/;
const MAX_ENTRIES=128;
const NOTES_DIR='operator-notes';

function fail(code){const err=new Error(code);err.code=code;throw err;}
function assertInbox(input){
 if(typeof input!=='string'||!path.isAbsolute(input))fail('ABSOLUTE_INBOX_REQUIRED');
 const abs=path.resolve(input),stat=fs.lstatSync(abs);
 if(!stat.isDirectory()||stat.isSymbolicLink())fail('INVALID_INBOX');
 const real=fs.realpathSync.native(abs);
 if(path.normalize(real)!==path.normalize(abs))fail('INBOX_ALIAS_REJECTED');
 if(process.platform!=='win32'&&(stat.mode&0o022)!==0)fail('INBOX_INSECURE_PERMISSIONS');
 return abs;
}
function readPacket(inbox,filename){
 const dir=assertInbox(inbox);
 if(typeof filename!=='string'||!PACKET.test(filename))fail('INVALID_PACKET_NAME');
 const full=path.join(dir,filename);
 const lst=fs.lstatSync(full);
 if(!lst.isFile()||lst.isSymbolicLink())fail('PACKET_NOT_REGULAR_FILE');
 if(lst.size===0||lst.size>MAX_PACKET_BYTES)fail('PACKET_SIZE_INVALID');
 const nofollow=fs.constants.O_NOFOLLOW||0;
 let fd;
 try{
  fd=fs.openSync(full,fs.constants.O_RDONLY|nofollow);
  const stat=fs.fstatSync(fd);
  if(!stat.isFile()||stat.size===0||stat.size>MAX_PACKET_BYTES)fail('PACKET_SIZE_INVALID');
  const bytes=Buffer.allocUnsafe(stat.size);
  let used=0;
  while(used<bytes.length){
   const count=fs.readSync(fd,bytes,used,bytes.length-used,used);
   if(count===0)fail('PACKET_CHANGED_DURING_READ');
   used+=count;
  }
  const end=fs.fstatSync(fd);
  if(end.size!==stat.size||end.mtimeMs!==stat.mtimeMs||end.ino!==stat.ino)
   fail('PACKET_CHANGED_DURING_READ');
  return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
 }catch(err){
  if(err.code)throw err;
  fail('PACKET_READ_FAILED');
 }finally{
  if(fd!==undefined)fs.closeSync(fd);
 }
}
function inspectPacket(inbox,filename){
 try{
  const text=readPacket(inbox,filename);
  const check=inspectReviewImport(text);
  if(!check.ok)return{ok:false,filename,code:check.code};
  return{ok:true,filename,verified:check.value};
 }catch(err){
  return{ok:false,filename,code:typeof err.code==='string'?err.code:'PACKET_UNREADABLE'};
 }
}
function listPackets(inbox){
 const dir=assertInbox(inbox);
 const entries=fs.readdirSync(dir,{withFileTypes:true})
  .filter(e=>e.name.startsWith('reporider-review-')&&e.name.endsWith('.json'));
 if(entries.length>MAX_ENTRIES)fail('TOO_MANY_PACKET_ENTRIES');
 return entries.sort((a,b)=>a.name.localeCompare(b.name))
  .map(e=>inspectPacket(dir,e.name))
  .map(({ok,filename,verified,code})=>ok?{
   filename,status:'READY_FOR_MANUAL_INSPECTION',
   fingerprint:verified.fingerprint,
   repo_name:String(verified.summary.repository_name),
   visibility:String(verified.summary.visibility),
   files:verified.files.length,issues:verified.issues.length,
   warnings:verified.findings.length
  }:{filename,status:'REJECTED',code});
}
function saveReviewNote(inbox,verified,checked,decision,rationale){
 const dir=assertInbox(inbox);
 const note=makeLocalReviewNote(verified,checked,decision,rationale);
 const sub=path.join(dir,NOTES_DIR);
 // Directory creation occurs ONLY after an explicit operator action.
 try{fs.mkdirSync(sub,{mode:0o700});}
 catch(err){if(err.code!=='EEXIST')fail('NOTE_DIRECTORY_CREATE_FAILED');}
 const lst=fs.lstatSync(sub);
 if(!lst.isDirectory()||lst.isSymbolicLink()||
    path.normalize(fs.realpathSync.native(sub))!==path.normalize(sub))
   fail('NOTE_DIRECTORY_UNSAFE');
 if(process.platform!=='win32'&&(lst.mode&0o077)!==0)
   fail('NOTE_DIRECTORY_INSECURE_PERMISSIONS');
 if(assertInbox(dir)!==dir)fail('INBOX_CHANGED');
 const name='reporider-note-'+crypto.randomUUID()+'.json';
 const output=JSON.stringify(note,null,2)+'\n';
 let fd;
 const target=path.join(sub,name);
 try{
  fd=fs.openSync(target,fs.constants.O_WRONLY|fs.constants.O_CREAT|
    fs.constants.O_EXCL|(fs.constants.O_NOFOLLOW||0),0o600);
  fs.writeFileSync(fd,output,{encoding:'utf8'});
  fs.fsyncSync(fd);
  fs.closeSync(fd);fd=undefined;
 }catch{
  if(fd!==undefined)try{fs.closeSync(fd);}catch{}
  try{fs.unlinkSync(target);}catch{}
  fail('NOTE_WRITE_FAILED');
 }
 return{filename:name,relativePath:NOTES_DIR+'/'+name,note};
}
module.exports={assertInbox,readPacket,inspectPacket,listPackets,saveReviewNote,PACKET,MAX_ENTRIES};
