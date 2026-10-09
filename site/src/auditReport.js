/**
 * RR-A09: browser-only, structural validation of a local operator audit JSON.
 *
 * A public static page CANNOT recompute RR-A08's ledger/source verification
 * from this summary. Importing valid JSON is not proof of independent custody,
 * operator identity, code safety, or GitHub authorization.
 */
export const AUDIT_SCHEMA='reporider.local.operator-audit.v0.1';
export const MAX_AUDIT_BYTES=1500000;
export const MAX_AUDIT_RECORDS=500;
const ZEROS='0'.repeat(64);
const HEX=/^[a-f0-9]{64}$/;
const PACKET=/^reporider-review-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.json$/;
const NOTE=/^reporider-note-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.json$/;
const DECISIONS=['RECOMMEND_FOR_SEPARATE_AUTHORIZATION','REQUEST_CHANGES','DECLINE'];
const REPORT_STATES=['LOCAL_CHAIN_ONLY_VERIFIED','LOCAL_CHAIN_AND_SUPPLIED_CHECKPOINT_MATCH'];
const ITEM_STATES=['RECORDED','READY_NOT_RECORDED','REJECTED'];
const NOTE_STATES=['RECORDED','UNRECORDED_NOT_VERIFIED','NOT_REGULAR_FILE'];
const own=(v,k)=>Object.prototype.hasOwnProperty.call(v,k);
const obj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const integer=(v,max=100000)=>Number.isInteger(v)&&v>=0&&v<=max;
const hex=v=>typeof v==='string'&&HEX.test(v);
const bounded=(v,max=300)=>typeof v==='string'&&v.length<=max;
const err=(code,message)=>({ok:false,code,message});
function count(map,key){map[key]=(map[key]||0)+1;}
function reportedTotalsEqual(report,entries,rows,notes){
 const total=report.totals,decisionCounts={};
 DECISIONS.forEach(d=>decisionCounts[d]=0);
 entries.forEach(e=>count(decisionCounts,e.decision));
 if(!obj(total)||!obj(total.decisions))return false;
 const expected={
  recorded_entries:entries.length,
  distinct_recorded_packets:new Set(entries.map(e=>e.packet_filename)).size,
  inbox_packets:rows.length,
  ready_not_recorded:rows.filter(x=>x.status==='READY_NOT_RECORDED').length,
  rejected_packets:rows.filter(x=>x.status==='REJECTED').length,
  operator_note_files:notes.length,
  unrecorded_note_files:notes.filter(x=>x.status==='UNRECORDED_NOT_VERIFIED').length,
 };
 for(const [key,value] of Object.entries(expected))if(total[key]!==value)return false;
 for(const decision of DECISIONS)if(total.decisions[decision]!==decisionCounts[decision])return false;
 return integer(total.suspicious_note_entries,100000)&&
    total.suspicious_note_entries>=notes.filter(x=>x.status==='NOT_REGULAR_FILE').length;
}
export function parseAuditReport(raw){
 if(typeof raw!=='string'||!raw.length)return err('EMPTY_REPORT','Choose an exported RR-A08 JSON report.');
 if(new TextEncoder().encode(raw).byteLength>MAX_AUDIT_BYTES)
  return err('REPORT_TOO_LARGE','The local report exceeds the 1.5 MB viewer limit.');
 let report;
 try{report=JSON.parse(raw);}
 catch{return err('INVALID_JSON','This is not valid JSON. Export RR-A08 with --format json.');}
 if(!obj(report)||report.schema!==AUDIT_SCHEMA)
  return err('UNKNOWN_SCHEMA','Expected a RepoRider RR-A08 operator-audit.v0.1 JSON report.');
 if(!REPORT_STATES.includes(report.status)||
    !obj(report.ledger)||!obj(report.checkpoint)||!obj(report.totals)||
    !Array.isArray(report.timeline)||!Array.isArray(report.inbox)||!Array.isArray(report.notes))
  return err('INVALID_STRUCTURE','Report status, ledger, checkpoint, counts or entry arrays are missing.');
 if(report.operator_identity_authenticated!==false||
    report.source_identity_authenticated!==false||
    report.signature_verified!==false||report.approval_granted!==false||
    report.live_write_authorized!==false||report.github_write_executed!==false||
    report.data_sent_remotely!==false||report.report_persisted!==false||
    report.evidence_sources_rechecked!==true||
    report.ledger.local_consistency_verified!==true||
    report.ledger.snapshot_authenticated!==false)
  return err('AUTHORITY_CLAIM_REJECTED','A browser import cannot claim trusted identity, signing, live writing or approval.');
 const entries=report.timeline,rows=report.inbox,notes=report.notes;
 if(entries.length>MAX_AUDIT_RECORDS||rows.length>128||notes.length>600)
  return err('COLLECTION_LIMIT','Report exceeds the bounded RR-A08 collection limits.');
 if(!integer(report.ledger.entry_count,MAX_AUDIT_RECORDS)||
    report.ledger.entry_count!==entries.length||!hex(report.ledger.head_sha256))
  return err('LEDGER_METADATA_MISMATCH','Ledger count or SHA-256 head is inconsistent with the timeline.');
 const seenNotes=new Set();
 let prev=ZEROS;
 for(let i=0;i<entries.length;i++){
  const e=entries[i];
  if(!obj(e)||e.sequence!==i+1||!DECISIONS.includes(e.decision)||
    !PACKET.test(e.packet_filename??'')||!NOTE.test(e.note_filename??'')||
    !hex(e.entry_sha256)||!hex(e.previous_entry_sha256)||
    !hex(e.packet_sha256)||!hex(e.note_sha256)||
    e.previous_entry_sha256!==prev||
    !bounded(e.proposal_fingerprint,150)||!bounded(e.recorded_at,100)||
    e.approval_granted!==false||e.live_write_authorized!==false||
    e.github_write_executed!==false)
   return err('TIMELINE_INCONSISTENT','Entry sequence, hash links, paths or denial flags are inconsistent.');
  if(seenNotes.has(e.note_filename))
   return err('DUPLICATE_NOTE','The same review note was recorded more than once.');
  seenNotes.add(e.note_filename);
  prev=e.entry_sha256;
 }
 if(report.ledger.head_sha256!==prev)
  return err('LEDGER_HEAD_MISMATCH','The report head does not match its final listed entry.');
 const cp=report.checkpoint;
 if(cp.independent_custody_verified!==false)
  return err('CUSTODY_CLAIM_REJECTED','The browser cannot verify independent checkpoint custody.');
 const attached=report.status==='LOCAL_CHAIN_AND_SUPPLIED_CHECKPOINT_MATCH';
 if(attached){
  if(cp.status!=='OPERATOR_SUPPLIED_CHECKPOINT_MATCHED'||
    cp.operator_supplied_path_used!==true||!integer(cp.sequence,entries.length)||
    !hex(cp.head_sha256)||
    cp.head_sha256!==(cp.sequence===0?ZEROS:entries[cp.sequence-1].entry_sha256))
   return err('CHECKPOINT_INCONSISTENT','Checkpoint metadata does not match the listed historical prefix.');
 }else if(cp.status!=='NOT_SUPPLIED'||cp.sequence!==null||
   cp.head_sha256!==null||cp.operator_supplied_path_used!==false)
  return err('CHECKPOINT_INCONSISTENT','A report without a supplied checkpoint must say so.');
 const packetMap=new Map();
 for(const item of rows){
  if(!obj(item)||!PACKET.test(item.filename??'')||
    !ITEM_STATES.includes(item.status)||packetMap.has(item.filename))
   return err('INBOX_INVALID','Courier inbox rows have invalid filenames, statuses or duplicates.');
  if(item.status!=='REJECTED'&&(!integer(item.files,100)||!integer(item.issues,100)||
    !integer(item.warnings,10000)||!integer(item.ledger_record_count,MAX_AUDIT_RECORDS)||
    !bounded(item.repo_name,200)||!bounded(item.visibility,20)||!bounded(item.fingerprint,150)))
   return err('INBOX_INVALID','A replay-ready packet row is missing bounded metadata.');
  if(item.status==='REJECTED'&&!bounded(item.code,150))
   return err('INBOX_INVALID','Rejected packets must have a bounded error code.');
  packetMap.set(item.filename,item);
 }
 const useMap=new Map();
 entries.forEach(e=>useMap.set(e.packet_filename,(useMap.get(e.packet_filename)||0)+1));
 for(const e of entries){
  const row=packetMap.get(e.packet_filename);
  if(!row||row.status!=='RECORDED'||row.fingerprint!==e.proposal_fingerprint)
   return err('INBOX_LEDGER_MISMATCH','Recorded evidence is missing from the inbox inventory.');
 }
 for(const row of rows){
  const uses=useMap.get(row.filename)||0;
  if((row.status==='RECORDED')!==(uses>0)||
    (row.status==='RECORDED'&&row.ledger_record_count!==uses)||
    (row.status==='READY_NOT_RECORDED'&&row.ledger_record_count!==0)||
    (row.status==='REJECTED'&&uses>0))
   return err('INBOX_LEDGER_MISMATCH','A packet status conflicts with the ledger timeline.');
 }
 const noteMap=new Map();
 for(const note of notes){
  if(!obj(note)||!NOTE.test(note.filename??'')||
    !NOTE_STATES.includes(note.status)||noteMap.has(note.filename))
   return err('NOTES_INVALID','Notes inventory contains invalid filenames, statuses or duplicates.');
  noteMap.set(note.filename,note);
 }
 for(const e of entries){
  if(noteMap.get(e.note_filename)?.status!=='RECORDED')
   return err('NOTES_LEDGER_MISMATCH','A recorded note is missing from the notes inventory.');
 }
 for(const note of notes){
  if(note.status==='RECORDED'!==seenNotes.has(note.filename))
   return err('NOTES_LEDGER_MISMATCH','A note status conflicts with the evidence timeline.');
 }
 if(!reportedTotalsEqual(report,entries,rows,notes))
  return err('TOTALS_MISMATCH','The displayed summary counters disagree with the detailed rows.');
 return{ok:true,report};
}
/**
 * A deliberately synthetic demonstration. Its hashes and names are mock
 * placeholders, not actual cryptographic evidence.
 */
export function sampleAuditReport(){
 const ids=[
 '00000000-0000-4000-8000-000000000001',
 '00000000-0000-4000-8000-000000000002',
 '00000000-0000-4000-8000-000000000003'
 ];
 const packet=i=>'reporider-review-'+ids[i]+'.json';
 const note=i=>'reporider-note-'+ids[i]+'.json';
 const h=(c)=>c.repeat(64);
 const entries=[
  {sequence:1,recorded_at:'2026-10-09T10:00:00.000Z',decision:'REQUEST_CHANGES',
   packet_filename:packet(0),note_filename:note(0),proposal_fingerprint:'example-fingerprint-one',
   entry_sha256:h('a'),previous_entry_sha256:ZEROS,packet_sha256:h('b'),note_sha256:h('c'),
   approval_granted:false,live_write_authorized:false,github_write_executed:false},
  {sequence:2,recorded_at:'2026-10-09T10:15:00.000Z',decision:'DECLINE',
   packet_filename:packet(1),note_filename:note(1),proposal_fingerprint:'example-fingerprint-two',
   entry_sha256:h('d'),previous_entry_sha256:h('a'),packet_sha256:h('e'),note_sha256:h('f'),
   approval_granted:false,live_write_authorized:false,github_write_executed:false},
 ];
 return{
  schema:AUDIT_SCHEMA,status:'LOCAL_CHAIN_AND_SUPPLIED_CHECKPOINT_MATCH',
  ledger:{entry_count:2,head_sha256:h('d'),local_consistency_verified:true,snapshot_authenticated:false},
  checkpoint:{status:'OPERATOR_SUPPLIED_CHECKPOINT_MATCHED',sequence:1,
   head_sha256:h('a'),operator_supplied_path_used:true,independent_custody_verified:false},
  totals:{recorded_entries:2,distinct_recorded_packets:2,inbox_packets:3,ready_not_recorded:1,
   rejected_packets:0,operator_note_files:2,unrecorded_note_files:0,suspicious_note_entries:0,
   decisions:{RECOMMEND_FOR_SEPARATE_AUTHORIZATION:0,REQUEST_CHANGES:1,DECLINE:1}},
  timeline:entries,
  inbox:[
   {filename:packet(0),status:'RECORDED',repo_name:'sample-journal',visibility:'private',
    files:5,issues:2,warnings:0,fingerprint:'example-fingerprint-one',ledger_record_count:1},
   {filename:packet(1),status:'RECORDED',repo_name:'sample-budget',visibility:'private',
    files:4,issues:3,warnings:1,fingerprint:'example-fingerprint-two',ledger_record_count:1},
   {filename:packet(2),status:'READY_NOT_RECORDED',repo_name:'sample-inbox',visibility:'private',
    files:3,issues:1,warnings:0,fingerprint:'example-fingerprint-three',ledger_record_count:0},
  ],
  notes:[{filename:note(0),status:'RECORDED'},{filename:note(1),status:'RECORDED'}],
  evidence_sources_rechecked:true,operator_identity_authenticated:false,
  source_identity_authenticated:false,signature_verified:false,
  approval_granted:false,live_write_authorized:false,
  github_write_executed:false,data_sent_remotely:false,report_persisted:false,
  warning:'SYNTHETIC DEMONSTRATION ONLY. No evidence, signatures or identities were checked.'
 };
}
