'use strict';
/**
 * RR-A08: local, read-only audit reporting across operator-ledger, optional
 * operator-provided witness checkpoint, courier inbox and note filenames.
 *
 * This does not authenticate users, approve work, execute code, call GitHub,
 * upload content, persist a report, or expose an MCP tool.
 */
const fs=require('node:fs');
const path=require('node:path');
const {assertInbox,listPackets}=require('./reporider-operator-core.cjs');
const {getVerifiedLedgerTimeline,verifyLedger}=require('./reporider-operator-ledger.cjs');
const {verifyCheckpointFile}=require('./reporider-operator-checkpoints.cjs');
const MAX_NOTES=600;
const NOTE_NAME=/^reporider-note-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.json$/;
const SCHEMA='reporider.local.operator-audit.v0.1';
function fail(code){const err=new Error(code);err.code=code;throw err;}
function noteInventory(inbox){
 const dir=path.join(assertInbox(inbox),'operator-notes');
 if(!fs.existsSync(dir))return{notes:[],unexpected_entries:0};
 const stat=fs.lstatSync(dir);
 if(stat.isSymbolicLink()||!stat.isDirectory()||
    path.normalize(fs.realpathSync.native(dir))!==path.normalize(dir))
  fail('AUDIT_NOTES_DIRECTORY_UNSAFE');
 if(process.platform!=='win32'&&(stat.mode&0o077)!==0)
  fail('AUDIT_NOTES_DIRECTORY_INSECURE');
 const found=fs.readdirSync(dir,{withFileTypes:true});
 if(found.length>MAX_NOTES)fail('AUDIT_NOTES_CAPACITY_EXCEEDED');
 let unexpected=0;
 const notes=[];
 for(const item of found){
  if(!NOTE_NAME.test(item.name)){unexpected++;continue;}
  if(!item.isFile()||item.isSymbolicLink()){
   notes.push({filename:item.name,status:'NOT_REGULAR_FILE'});continue;
  }
  notes.push({filename:item.name,status:'UNRECORDED_NOT_VERIFIED'});
 }
 notes.sort((a,b)=>a.filename.localeCompare(b.filename));
 return{notes,unexpected_entries:unexpected};
}
function makeAuditReport(inbox,options={}){
 if(!options||typeof options!=='object'||Array.isArray(options)||
   Object.keys(options).some(k=>k!=='checkpointPath'))
  fail('AUDIT_UNKNOWN_OPTIONS');
 if(options.checkpointPath!==undefined&&
   (typeof options.checkpointPath!=='string'||options.checkpointPath.length===0))
  fail('AUDIT_INVALID_CHECKPOINT');
 const base=assertInbox(inbox);
 const timeline=getVerifiedLedgerTimeline(base);
 const checkpoint=options.checkpointPath===undefined?null:
  verifyCheckpointFile(base,options.checkpointPath);
 const packets=listPackets(base);
 const localNotes=noteInventory(base);
 const usedPackets=new Map(),usedNotes=new Set();
 for(const e of timeline.entries){
  usedPackets.set(e.packet_filename,(usedPackets.get(e.packet_filename)||0)+1);
  usedNotes.add(e.note_filename);
 }
 const packetRows=packets.map(x=>x.status==='REJECTED'?{
  filename:x.filename,status:'REJECTED',code:x.code,ledger_record_count:0
 }:{
  filename:x.filename,status:usedPackets.has(x.filename)?'RECORDED':'READY_NOT_RECORDED',
  repo_name:x.repo_name,visibility:x.visibility,files:x.files,issues:x.issues,
  warnings:x.warnings,fingerprint:x.fingerprint,
  ledger_record_count:usedPackets.get(x.filename)||0
 });
 const noteRows=localNotes.notes.map(n=>({
  filename:n.filename,
  status:n.status==='NOT_REGULAR_FILE'?'NOT_REGULAR_FILE':
    usedNotes.has(n.filename)?'RECORDED':'UNRECORDED_NOT_VERIFIED',
 }));
 const decisions={
  RECOMMEND_FOR_SEPARATE_AUTHORIZATION:0,
  REQUEST_CHANGES:0,
  DECLINE:0
 };
 for(const e of timeline.entries)decisions[e.decision]++;
 // Re-read the complete ledger once at the end so a benign concurrent append
 // cannot yield an apparently current report with a stale head.
 const after=verifyLedger(base);
 if(after.entry_count!==timeline.verification.entry_count||
    after.head_sha256!==timeline.verification.head_sha256)
  fail('LEDGER_CHANGED_DURING_AUDIT');
 if(checkpoint&&(
   checkpoint.current_sequence!==after.entry_count||
   checkpoint.current_head_sha256!==after.head_sha256))
  fail('LEDGER_CHANGED_AFTER_CHECKPOINT');
 return{
  schema:SCHEMA,
  status:checkpoint?'LOCAL_CHAIN_AND_SUPPLIED_CHECKPOINT_MATCH':'LOCAL_CHAIN_ONLY_VERIFIED',
  ledger:{
   entry_count:after.entry_count,head_sha256:after.head_sha256,
   local_consistency_verified:true,
   snapshot_authenticated:false
  },
  checkpoint:checkpoint?{
   status:'OPERATOR_SUPPLIED_CHECKPOINT_MATCHED',
   sequence:checkpoint.checkpoint_sequence,
   head_sha256:checkpoint.checkpoint_head_sha256,
   operator_supplied_path_used:true,
   independent_custody_verified:false
  }:{
   status:'NOT_SUPPLIED',
   sequence:null,head_sha256:null,
   operator_supplied_path_used:false,
   independent_custody_verified:false
  },
  totals:{
   recorded_entries:timeline.entries.length,
   distinct_recorded_packets:usedPackets.size,
   inbox_packets:packetRows.length,
   ready_not_recorded:packetRows.filter(x=>x.status==='READY_NOT_RECORDED').length,
   rejected_packets:packetRows.filter(x=>x.status==='REJECTED').length,
   operator_note_files:noteRows.length,
   unrecorded_note_files:noteRows.filter(x=>x.status==='UNRECORDED_NOT_VERIFIED').length,
   suspicious_note_entries:
    localNotes.unexpected_entries+noteRows.filter(x=>x.status==='NOT_REGULAR_FILE').length,
   decisions
  },
  timeline:timeline.entries,
  inbox:packetRows,
  notes:noteRows,
  evidence_sources_rechecked:true,
  operator_identity_authenticated:false,
  source_identity_authenticated:false,
  signature_verified:false,
  approval_granted:false,
  live_write_authorized:false,
  github_write_executed:false,
  data_sent_remotely:false,
  report_persisted:false,
  warning:'Read-only metadata audit, not a trusted identity, signed timestamp, verified independent witness or approval to execute. Preserve genuine external checkpoint under separate custody.'
 };
}
function renderAuditText(report){
 if(!report||report.schema!==SCHEMA)fail('AUDIT_REPORT_INVALID');
 const q=x=>JSON.stringify(String(x));
 const lines=[
  'RepoRider RR-A08 | LOCAL OPERATOR AUDIT (UNSIGNED, NO AUTHORITY)',
  'Status: '+report.status,
  'Ledger records: '+report.ledger.entry_count,
  'Ledger SHA256 head: '+report.ledger.head_sha256,
  'Checkpoint: '+report.checkpoint.status,
  report.checkpoint.sequence===null?'Checkpoint sequence: not supplied':
    'Checkpoint sequence: '+report.checkpoint.sequence,
  'Independent checkpoint custody: NOT VERIFIED',
  '',
  'COUNTS',
  '  Recorded entries: '+report.totals.recorded_entries,
  '  Inbox packets: '+report.totals.inbox_packets,
  '  Ready but not recorded: '+report.totals.ready_not_recorded,
  '  Rejected inbox packets: '+report.totals.rejected_packets,
  '  Unrecorded local notes: '+report.totals.unrecorded_note_files,
  '  Suspicious note entries: '+report.totals.suspicious_note_entries,
  '  Recommendations: '+report.totals.decisions.RECOMMEND_FOR_SEPARATE_AUTHORIZATION,
  '  Changes requested: '+report.totals.decisions.REQUEST_CHANGES,
  '  Declines: '+report.totals.decisions.DECLINE,
  '',
  'EVIDENCE TIMELINE',
 ];
 if(!report.timeline.length)lines.push('  (no recorded entries)');
 for(const row of report.timeline){
  lines.push('  #'+row.sequence+' '+q(row.decision)+' '+q(row.recorded_at));
  lines.push('    Packet: '+q(row.packet_filename));
  lines.push('    Note: '+q(row.note_filename));
  lines.push('    Entry SHA256: '+row.entry_sha256);
 }
 lines.push('','INBOX STATUS');
 if(!report.inbox.length)lines.push('  (empty)');
 for(const item of report.inbox){
  lines.push('  '+q(item.status)+' '+q(item.filename)+
   (item.status==='REJECTED'?' '+q(item.code):' recorded='+item.ledger_record_count));
 }
 lines.push('','LOCAL REVIEW NOTE STATUS');
 if(!report.notes.length)lines.push('  (empty)');
 for(const item of report.notes)lines.push('  '+q(item.status)+' '+q(item.filename));
 lines.push('','NO HUMAN ID VERIFIED | NO SIGNATURE | NO GITHUB WRITES | NO EXECUTION APPROVAL');
 lines.push(report.warning);
 return lines.join('\n')+'\n';
}
module.exports={makeAuditReport,renderAuditText,SCHEMA,MAX_NOTES};
