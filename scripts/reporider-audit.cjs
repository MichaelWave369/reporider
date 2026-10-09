#!/usr/bin/env node
'use strict';
/**
 * RR-A08: read-only, local metadata audit report.
 * No filesystem writes; choose shell redirection to explicitly save a report.
 */
const {makeAuditReport,renderAuditText}=require('./reporider-operator-audit.cjs');
const HELP=[
 'RepoRider RR-A08 | OPERATOR AUDIT (READ ONLY, NOT AUTHORITY)',
 'Usage: node scripts/reporider-audit.cjs --inbox ABSOLUTE_DIR [--checkpoint ABSOLUTE_FILE] [--format text|json]',
 '',
 'No network, HTML execution, disk writes, trusted signatures or GitHub API.',
 'Optional checkpoint compares a separately preserved ledger prefix.',
 'For a saved report, explicitly redirect stdout to your own chosen path.',
 ].join('\n');
function configFrom(argv){
 const options={inbox:process.env.REPORIDER_COURIER_INBOX,format:'text',checkpointPath:undefined};
 const seen=new Set();
 for(let i=0;i<argv.length;i++){
  const arg=argv[i];
  if(arg==='--help'||arg==='-h')return{help:true};
  const [flag,attached]=arg.includes('=')?arg.split(/=(.*)/s).slice(0,2):[arg,undefined];
  if(!['--inbox','--checkpoint','--format'].includes(flag))throw Error('UNKNOWN_OPTION');
  if(seen.has(flag))throw Error('DUPLICATE_OPTION');
  seen.add(flag);
  const value=attached===undefined?argv[++i]:attached;
  if(typeof value!=='string'||!value||value.startsWith('--'))throw Error('MISSING_OPTION_VALUE');
  if(flag==='--inbox')options.inbox=value;
  if(flag==='--checkpoint')options.checkpointPath=value;
  if(flag==='--format')options.format=value;
 }
 if(!['text','json'].includes(options.format))throw Error('INVALID_OUTPUT_FORMAT');
 return options;
}
function main(){
 const cfg=configFrom(process.argv.slice(2));
 if(cfg.help){process.stdout.write(HELP+'\n');return;}
 const report=makeAuditReport(cfg.inbox,
  cfg.checkpointPath===undefined?{}:{checkpointPath:cfg.checkpointPath});
 const body=cfg.format==='json'?JSON.stringify(report,null,2)+'\n':renderAuditText(report);
 process.stdout.write(body);
}
try{main();}
catch(err){
 const message=String(err&&err.code||err&&err.message||'AUDIT_FAILED')
  .replace(/[^a-zA-Z0-9_]/g,'_').slice(0,90);
 process.stderr.write('RepoRider operator audit failed: '+message+'\n');
 process.exitCode=2;
}
