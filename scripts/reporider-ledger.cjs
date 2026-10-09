#!/usr/bin/env node
'use strict';
/**
 * RR-A06 local human-side evidence ledger terminal.
 * Not an MCP tool, authenticated approval system, or GitHub executor.
 * init/record make explicit local disk changes; verify/head are read-only.
 */
const {initLedger,verifyLedger,recordEvidence}=require('./reporider-operator-ledger.cjs');
const HELP=[
 'RepoRider RR-A06 · Operator Evidence Ledger (LOCAL, UNSIGNED, NOT APPROVAL)',
 'Usage: node scripts/reporider-ledger.cjs --inbox ABSOLUTE_FOLDER init|verify|head|record PACKET_FILENAME NOTE_FILENAME',
 '',
 'init                Explicitly create private local ledger directory',
 'verify              Read and verify full local chain and referenced packet/note digests',
 'head                Print current chain head SHA-256 to pin OUTSIDE this folder',
 'record PACKET NOTE  Explicitly append an entry linking a reviewed courier packet to an unsigned note',
 '',
 'No GitHub writes or MCP inbox access. A local SHA-256 chain is not a digital signature.',
 ].join('\n');
function argsFrom(argv){
 let inbox=process.env.REPORIDER_COURIER_INBOX;
 const rest=[];
 for(let i=0;i<argv.length;i++){
  if(argv[i]==='--help'||argv[i]==='-h')return{help:true};
  if(argv[i]==='--inbox'){
   if(i+1>=argv.length)throw Error('MISSING_INBOX_VALUE');
   inbox=argv[++i];
  }else if(argv[i].startsWith('--inbox='))inbox=argv[i].slice(8);
  else if(argv[i].startsWith('-'))throw Error('UNKNOWN_OPTION');
  else rest.push(argv[i]);
 }
 if(!['init','verify','head','record'].includes(rest[0]))throw Error('INVALID_COMMAND');
 if(rest[0]==='record'&&rest.length!==3)throw Error('PACKET_AND_NOTE_REQUIRED');
 if(rest[0]!=='record'&&rest.length!==1)throw Error('INVALID_ARGUMENT_COUNT');
 return{inbox,command:rest[0],packet:rest[1],note:rest[2]};
}
function output(record){
 process.stdout.write(JSON.stringify(record,null,2)+'\n');
}
function main(){
 const cfg=argsFrom(process.argv.slice(2));
 if(cfg.help){process.stdout.write(HELP+'\n');return;}
 if(cfg.command==='init'){output(initLedger(cfg.inbox));return;}
 if(cfg.command==='record'){output(recordEvidence(cfg.inbox,cfg.packet,cfg.note));return;}
 const state=verifyLedger(cfg.inbox);
 if(cfg.command==='head'){
  output({
   schema:'reporider.local.ledger-head.v0.1',
   sequence:state.entry_count,head_sha256:state.head_sha256,
   independent_anchor_verified:false,
   approval_granted:false,live_write_authorized:false,github_write_executed:false,
   warning:'Save this head independently. It cannot authenticate an operator or approve a GitHub write.'
  });
 }else output(state);
}
try{main();}catch(err){
 const code=String(err?.code||err?.message||'LEDGER_ERROR').replace(/[^A-Z0-9_]/gi,'_').slice(0,80);
 process.stderr.write('RepoRider local ledger failed: '+code+'\n');
 process.exitCode=2;
}
