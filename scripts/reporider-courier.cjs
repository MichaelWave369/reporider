#!/usr/bin/env node
'use strict';

/**
 * RR-A04: optional local-only MCP review packet courier.
 *
 * This is an opt-in *local filesystem inbox*, NOT a network service,
 * human approval, trusted identity system, GitHub writer, or execution tool.
 * Model controls request contents only. The operator must pre-create and
 * explicitly select the inbox directory. Courier creates random names with
 * exclusive open, and never reads or writes any arbitrary model-supplied path.
 */
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const MAX_PACKET_BYTES=250000;
const MAX_QUEUE_FILES=24;
const PREFIX='reporider-review-';
const SUFFIX='.json';

function reject(code){const e=new Error(code);e.code=code;throw e;}
function isNormalDir(dir){
  const ls=fs.lstatSync(dir);
  if(ls.isSymbolicLink() || !ls.isDirectory())reject('INBOX_NOT_REAL_DIRECTORY');
  const real=fs.realpathSync.native(dir);
  // No implicit aliases or symbolic-link parent path traversal.
  if(path.normalize(real)!==path.normalize(path.resolve(dir)))
    reject('INBOX_SYMLINK_PATH');
  if(process.platform!=='win32' && (ls.mode&0o022)!==0)
    reject('INBOX_INSECURE_PERMISSIONS');
  return real;
}
function createCourier(options=process.env){
  if(options.REPORIDER_COURIER_ENABLED!=='1')return null;
  const input=options.REPORIDER_COURIER_INBOX;
  if(typeof input!=='string'||!path.isAbsolute(input))
    reject('INBOX_ABSOLUTE_PATH_REQUIRED');
  const dir=isNormalDir(input);
  // A stored directory is revalidated before *each* write, not only startup.
  // If replaced with a symlink or moved, the action fails closed.
  function enqueue(response){
    if(!response || response.schema!=='reporider.agent.response.v0.1' ||
       response.action!=='submit_for_review' || response.disposition!=='REVIEW_REQUIRED' ||
       response.mode!=='mock_only' || response.authority_granted!==false ||
       response.action_executed!==false || response.repository_created!==false ||
       response.review_dispatched!==false ||
       !response.data || !response.data.review_packet ||
       !response.data.review_packet.proposal_request)
      reject('NOT_REVIEWABLE');
    const json=JSON.stringify(response)+'\n';
    const bytes=Buffer.byteLength(json,'utf8');
    if(bytes>MAX_PACKET_BYTES)reject('PACKET_TOO_LARGE');
    if(isNormalDir(input)!==dir)reject('INBOX_CHANGED');
    const queued=fs.readdirSync(dir,{withFileTypes:true}).filter(ent=>
      ent.name.startsWith(PREFIX)&&ent.name.endsWith(SUFFIX)
    ).length;
    if(queued>=MAX_QUEUE_FILES)reject('INBOX_CAPACITY_REACHED');
    const basename=PREFIX+crypto.randomUUID()+SUFFIX;
    const full=path.join(dir,basename);
    let fd;
    try{
      fd=fs.openSync(full,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|
        (fs.constants.O_NOFOLLOW||0),0o600);
      fs.writeFileSync(fd,json,{encoding:'utf8'});
      fs.fsyncSync(fd);
    }catch(e){
      if(fd!==undefined){try{fs.closeSync(fd);}catch{}}
      if(fd!==undefined)try{fs.unlinkSync(full);}catch{}
      reject('INBOX_WRITE_FAILED');
    }
    try{fs.closeSync(fd);}catch{reject('INBOX_CLOSE_FAILED');}
    return {
      schema:'reporider.local.courier-receipt.v0.1',
      disposition:'LOCAL_INBOX_SAVED',
      filename:basename,
      proposal_fingerprint:response.data.review_packet.proposal_fingerprint,
      bytes,
      capacity_max:MAX_QUEUE_FILES,
      already_queued:queued,
      local_queue_saved:true,
      queued_for_execution:false,
      human_notified:false,
      authority_granted:false,
      approval_granted:false,
      live_write_authorized:false,
      action_executed:true, // The local inbox file-write DID occur.
      local_file_write_executed:true,
      github_write_executed:false,
      repository_created:false,
      agent_identity_verified:false,
      operator_identity_verified:false,
      requires_manual_file_open:true,
      explanation:'A bounded proposal JSON file was saved to the operator-selected local folder. No human has been notified or authenticated; no live action is approved.'
    };
  }
  return {enqueue,dir,maxFiles:MAX_QUEUE_FILES};
}
module.exports={createCourier,MAX_PACKET_BYTES,MAX_QUEUE_FILES};
