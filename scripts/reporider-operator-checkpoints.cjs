'use strict';
/**
 * RR-A07: manually exported, operator-supplied independent ledger checkpoints.
 *
 * This is NOT a timestamp authority, signature, secure witness, cloud anchor,
 * authenticated operator, GitHub executor, or an MCP tool.
 * A checkpoint can only help identify rewriting/truncation if the human keeps
 * its file under separate, trusted custody outside the courier/ledger folder.
 */
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {TextDecoder}=require('node:util');
const {assertInbox}=require('./reporider-operator-core.cjs');
const {verifyLedger,verifyLedgerAnchor,EMPTY_HEAD}=require('./reporider-operator-ledger.cjs');

const SCHEMA='reporider.local.external-checkpoint.v0.1';
const MAX_CHECKPOINT_BYTES=4096;
const HEX=/^[a-f0-9]{64}$/;
const exactKeys=[
 'schema','sequence','head_sha256','created_at','purpose','independent_custody_verified',
 'signer_authenticated','signature_verified','execution_authorized','checkpoint_sha256'
];
function fail(code){const e=new Error(code);e.code=code;throw e;}
function hash(x){return crypto.createHash('sha256').update(x).digest('hex');}
function isObject(v){return v!==null&&typeof v==='object'&&!Array.isArray(v);}
function checkpointPayload(source){
 return{
  schema:source.schema,
  sequence:source.sequence,
  head_sha256:source.head_sha256,
  created_at:source.created_at,
  purpose:source.purpose,
  independent_custody_verified:source.independent_custody_verified,
  signer_authenticated:source.signer_authenticated,
  signature_verified:source.signature_verified,
  execution_authorized:source.execution_authorized
 };
}
function makeCheckpoint(inbox,stamp=new Date().toISOString()){
 const verified=verifyLedger(inbox);
 if(typeof stamp!=='string'||!Number.isFinite(Date.parse(stamp)))fail('INVALID_CHECKPOINT_TIME');
 const payload={
  schema:SCHEMA,sequence:verified.entry_count,head_sha256:verified.head_sha256,
  created_at:stamp,purpose:'MANUALLY_PRESERVE_OUTSIDE_INBOX',
  independent_custody_verified:false,signer_authenticated:false,
  signature_verified:false,execution_authorized:false
 };
 return{...payload,checkpoint_sha256:hash(JSON.stringify(payload))};
}
function validateCheckpoint(value){
 if(!isObject(value))fail('CHECKPOINT_INVALID_SHAPE');
 if(Object.keys(value).length!==exactKeys.length||
  exactKeys.some(k=>!Object.prototype.hasOwnProperty.call(value,k)))fail('CHECKPOINT_UNKNOWN_FIELDS');
 if(value.schema!==SCHEMA||!Number.isInteger(value.sequence)||value.sequence<0||value.sequence>500||
   typeof value.head_sha256!=='string'||!HEX.test(value.head_sha256)||
   (value.sequence===0&&value.head_sha256!==EMPTY_HEAD)||
   (value.sequence>0&&value.head_sha256===EMPTY_HEAD)||
   typeof value.created_at!=='string'||!Number.isFinite(Date.parse(value.created_at))||
   value.purpose!=='MANUALLY_PRESERVE_OUTSIDE_INBOX'||
   value.independent_custody_verified!==false||
   value.signer_authenticated!==false||value.signature_verified!==false||
   value.execution_authorized!==false||typeof value.checkpoint_sha256!=='string'||
   !HEX.test(value.checkpoint_sha256))
  fail('CHECKPOINT_INVALID_CONTENT');
 if(hash(JSON.stringify(checkpointPayload(value)))!==value.checkpoint_sha256)
  fail('CHECKPOINT_CHECKSUM_MISMATCH');
 return value;
}
function openCheckpoint(inbox,filename){
 const base=assertInbox(inbox);
 if(typeof filename!=='string'||!path.isAbsolute(filename))fail('ABSOLUTE_CHECKPOINT_PATH_REQUIRED');
 const target=path.resolve(filename);
 // A checkpoint stored within the same inbox is not independent evidence.
 const rel=path.relative(base,target);
 if(rel===''||(!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel)))
  fail('CHECKPOINT_MUST_BE_OUTSIDE_INBOX');
 const st=fs.lstatSync(target);
 if(st.isSymbolicLink()||!st.isFile()||st.size===0||st.size>MAX_CHECKPOINT_BYTES)
  fail('CHECKPOINT_FILE_INVALID');
 const real=fs.realpathSync.native(target);
 if(path.normalize(real)!==path.normalize(target))fail('CHECKPOINT_SYMLINK_PATH');
 let fd;
 try{
  fd=fs.openSync(target,fs.constants.O_RDONLY|(fs.constants.O_NOFOLLOW||0));
  const initial=fs.fstatSync(fd);
  if(!initial.isFile()||initial.size===0||initial.size>MAX_CHECKPOINT_BYTES)
   fail('CHECKPOINT_FILE_INVALID');
  const bytes=Buffer.alloc(initial.size);
  let used=0;
  while(used<bytes.length){
   const n=fs.readSync(fd,bytes,used,bytes.length-used,used);
   if(n===0)fail('CHECKPOINT_READ_TRUNCATED');
   used+=n;
  }
  const final=fs.fstatSync(fd);
  if(final.ino!==initial.ino||final.size!==initial.size||final.mtimeMs!==initial.mtimeMs)
   fail('CHECKPOINT_CHANGED_DURING_READ');
  let parsed;
  try{parsed=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}
  catch{fail('CHECKPOINT_INVALID_JSON');}
  return validateCheckpoint(parsed);
 }finally{if(fd!==undefined)fs.closeSync(fd);}
}
function verifyCheckpointFile(inbox,externalAbsoluteFile){
 const checkpoint=openCheckpoint(inbox,externalAbsoluteFile);
 const status=verifyLedgerAnchor(inbox,checkpoint.sequence,checkpoint.head_sha256);
 if(!status.matches)fail(status.error_code);
 return{
  schema:'reporider.local.external-checkpoint-verify.v0.1',
  status:'CHECKPOINT_MATCHES_VERIFIED_CHAIN',
  checkpoint_sequence:checkpoint.sequence,
  checkpoint_head_sha256:checkpoint.head_sha256,
  current_sequence:status.current_sequence,
  current_head_sha256:status.current_head_sha256,
  checkpoint_matches:true,
  independent_custody_verified:false,
  signer_authenticated:false,
  signature_verified:false,
  execution_authorized:false,
  github_write_executed:false,
  warning:'Matching an operator-supplied checkpoint confirms a local chain prefix. The program cannot prove the checkpoint was kept independently or has not been forged.'
 };
}
module.exports={SCHEMA,MAX_CHECKPOINT_BYTES,makeCheckpoint,validateCheckpoint,openCheckpoint,verifyCheckpointFile};
