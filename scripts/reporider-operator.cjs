#!/usr/bin/env node
'use strict';

/**
 * RR-A05 operator-only terminal console. NOT an MCP tool, web server,
 * background daemon, authenticated approval service or GitHub executor.
 *
 * Commands:
 *   npm run operator:console -- --inbox ABSOLUTE_DIR list
 *   npm run operator:console -- --inbox ABSOLUTE_DIR inspect PACKET_FILENAME
 *   npm run operator:console -- --inbox ABSOLUTE_DIR review PACKET_FILENAME
 *
 * No deletion, network access, arbitrary file paths or GitHub credentials.
 */
const readline=require('node:readline/promises');
const {stdin,stdout}=require('node:process');
const {listPackets,inspectPacket,saveReviewNote}=require('./reporider-operator-core.cjs');

const HELP=[
 'RepoRider RR-A05 · Local Operator Console (OS-account boundary only)',
 '',
 'Usage: node scripts/reporider-operator.cjs --inbox ABSOLUTE_DIRECTORY [list|inspect|review] [packet_filename]',
 '',
 'Commands:',
 '  list                   Show replay-verified inbox entries (no writes)',
 '  inspect <filename>     Print safe metadata, findings, and artifact index (no writes)',
 '  review <filename>      Interactive inspection and unsigned local note export (requires a terminal)',
 '',
 'Default: list. Packet filenames must be courier-generated UUID basenames.',
 'This console does NOT authenticate human identity or authorize repo execution.',
 ].join('\n');
const print=value=>stdout.write(value+'\n');
// JSON encoding prevents untrusted text from sending ANSI/terminal controls.
const escaped=value=>JSON.stringify(String(value));
function argumentsFrom(args){
 let inbox=process.env.REPORIDER_COURIER_INBOX;
 const positionals=[];
 for(let i=0;i<args.length;i++){
  const arg=args[i];
  if(arg==='--inbox'){if(i+1>=args.length)throw Error('MISSING_INBOX_VALUE');inbox=args[++i];}
  else if(arg.startsWith('--inbox='))inbox=arg.slice(8);
  else if(arg==='--help'||arg==='-h')return{help:true};
  else if(arg.startsWith('-'))throw Error('UNKNOWN_OPTION');
  else positionals.push(arg);
 }
 const cmd=positionals[0]||'list';
 if(!['list','inspect','review'].includes(cmd))throw Error('UNKNOWN_COMMAND');
 if(cmd==='list'&&positionals.length!==0&&positionals.length!==1)throw Error('INVALID_ARGUMENT_COUNT');
 if(cmd!=='list'&&positionals.length!==2)throw Error('PACKET_NAME_REQUIRED');
 return{inbox,command:cmd,filename:positionals[1]};
}
function show(index){
 const v=index.verified;
 print('Packet: '+escaped(index.filename));
 print('Replay: CONSISTENT AGAINST LOCAL PLANNER/POLICY (not source authentication)');
 print('Proposal: '+escaped(v.summary.repository_name));
 print('Visibility: '+escaped(v.summary.visibility)+' · Stack: '+escaped(v.summary.stack));
 print('Fingerprint (NON-signature): '+escaped(v.fingerprint));
 print('Files: '+v.files.length+' · Issues: '+v.issues.length+' · Findings: '+v.findings.length);
 print('FILES');
 v.files.forEach((x,i)=>print('  '+(i+1)+'. '+escaped(x.path)+' · '+escaped(x.riskLevel)));
 print('ISSUES');
 v.issues.forEach((x,i)=>print('  '+(i+1)+'. '+escaped(x.title)));
 print('HEURISTIC POLICY FINDINGS');
 if(!v.findings.length)print('  No heuristic findings; this is NOT proof of safety.');
 v.findings.forEach((f,i)=>print('  '+(i+1)+'. '+escaped(f.severity)+' '+escaped(f.message)));
 print('No auth, GitHub write, queue promotion, notification or approval occurred.');
}
async function interact(inbox,entry){
 if(!stdin.isTTY||!stdout.isTTY)throw Error('REVIEW_REQUIRES_INTERACTIVE_TERMINAL');
 const v=entry.verified;
 const rl=readline.createInterface({input:stdin,output:stdout});
 const inspected=[];
 const questions=[
  ...v.files.map(f=>({key:'file:'+f.path+':'+f.approval_fingerprint,name:'FILE '+f.path,body:f.content})),
  ...v.issues.map(i=>({key:'issue:'+i.index+':'+i.approval_fingerprint,name:'ISSUE #'+(i.index+1)+' '+i.title,body:i.body}))
 ];
 try{
  show(entry);
  print('Each body below is inert escaped text. No content is executed.');
  for(const item of questions){
   print('\n==================== '+escaped(item.name)+' ====================');
   print(escaped(item.body));
   const answer=(await rl.question('Type REVIEWED if you inspected that exact artifact (otherwise Enter): ')).trim();
   if(answer==='REVIEWED')inspected.push(item.key);
  }
  print('Decision: R = recommend for SEPARATE authorization, C = request changes, D = decline, Q = quit.');
  const value=(await rl.question('Enter R, C, D or Q: ')).trim().toUpperCase();
  const options={R:'RECOMMEND_FOR_SEPARATE_AUTHORIZATION',C:'REQUEST_CHANGES',D:'DECLINE'};
  if(value==='Q'||!options[value]){print('No note saved.');return;}
  if(value==='R'&&inspected.length!==questions.length){
   print('REVIEW_INCOMPLETE: every artifact must be checked for a recommendation. No note saved.');
   return;
  }
  const reason=(await rl.question('Optional short rationale (max 1000 characters): '));
  if(reason.length>1000){print('INVALID_RATIONALE: no note saved.');return;}
  print('This is an unsigned, non-authoritative review note. It will NOT approve or execute anything.');
  const consent=(await rl.question('Type SAVE to write a local informational note, or Enter to cancel: ')).trim();
  if(consent!=='SAVE'){print('No note saved.');return;}
  const result=saveReviewNote(inbox,v,inspected,options[value],reason);
  print('LOCAL NOTE WRITTEN: '+escaped(result.relativePath));
  print('Approval granted: false. Identity authenticated: false. GitHub write executed: false.');
 }finally{rl.close();}
}
async function main(){
 const config=argumentsFrom(process.argv.slice(2));
 if(config.help){print(HELP);return;}
 const dir=config.inbox;
 if(config.command==='list'){
  const all=listPackets(dir);
  print('RepoRider operator inbox: '+escaped(dir));
  print('Packets: '+all.length+' (none auto-approved or notified)');
  for(const item of all){
   if(item.status==='REJECTED')print('REJECTED '+escaped(item.filename)+' '+escaped(item.code));
   else print('REPLAY READY '+escaped(item.filename)+' · '+escaped(item.repo_name)+
     ' · '+item.files+' files / '+item.issues+' issues / '+item.warnings+' findings');
  }
  print('Use inspect or review with the exact packet filename.');
  return;
 }
 const item=inspectPacket(dir,config.filename);
 if(!item.ok)throw Error('PACKET_REJECTED_'+item.code);
 if(config.command==='inspect')show(item);
 else await interact(dir,item);
}
main().catch(err=>{
 // Never echo untrusted paths or content in error text.
 process.stderr.write('RepoRider operator console failed: '+String(err&&err.code||err&&err.message||'UNKNOWN_FAILURE').replace(/[^A-Z0-9_]/gi,'_').slice(0,80)+'\n');
 process.exitCode=2;
});
