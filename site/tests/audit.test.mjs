import test from 'node:test';
import assert from 'node:assert/strict';
import {parseAuditReport,sampleAuditReport,AUDIT_SCHEMA,MAX_AUDIT_BYTES} from '../src/auditReport.js';
const clone=x=>JSON.parse(JSON.stringify(x));
const parse=obj=>parseAuditReport(JSON.stringify(obj));
const expect=(input,code)=>{const result=parse(input);assert.equal(result.ok,false,JSON.stringify(result));assert.equal(result.code,code);};

test('RR-A09 demo is visibly synthetic but structurally valid',()=>{
 const fixture=sampleAuditReport();
 assert.equal(fixture.schema,AUDIT_SCHEMA);
 assert.match(fixture.warning,/SYNTHETIC/);
 const result=parse(fixture);
 assert.equal(result.ok,true,result.message);
 assert.equal(result.report.timeline.length,2);
 assert.equal(result.report.checkpoint.independent_custody_verified,false);
 assert.equal(result.report.approval_granted,false);
});

test('empty RR-A08 report accepted without an anchor',()=>{
 const obj=sampleAuditReport();
 obj.status='LOCAL_CHAIN_ONLY_VERIFIED';
 obj.ledger={entry_count:0,head_sha256:'0'.repeat(64),local_consistency_verified:true,snapshot_authenticated:false};
 obj.checkpoint={status:'NOT_SUPPLIED',sequence:null,head_sha256:null,operator_supplied_path_used:false,independent_custody_verified:false};
 obj.timeline=[];obj.inbox=[];obj.notes=[];
 obj.totals={recorded_entries:0,distinct_recorded_packets:0,inbox_packets:0,ready_not_recorded:0,
  rejected_packets:0,operator_note_files:0,unrecorded_note_files:0,suspicious_note_entries:0,
  decisions:{RECOMMEND_FOR_SEPARATE_AUTHORIZATION:0,REQUEST_CHANGES:0,DECLINE:0}};
 assert.equal(parse(obj).ok,true,JSON.stringify(parse(obj)));
});

test('accepts legitimate statuses for pending and rejected courier imports',()=>{
 const x=sampleAuditReport();
 const pending=x.inbox[2];
 x.inbox.push({...pending,
  filename:'reporider-review-00000000-0000-4000-8000-000000000004.json',
  status:'REJECTED',code:'INVALID_JSON'});
 delete x.inbox[3].repo_name;
 delete x.inbox[3].files;
 delete x.inbox[3].issues;
 delete x.inbox[3].warnings;
 delete x.inbox[3].fingerprint;
 delete x.inbox[3].ledger_record_count;
 x.totals.inbox_packets++;
 x.totals.rejected_packets++;
 x.notes.push({filename:'reporider-note-00000000-0000-4000-8000-000000000004.json',
  status:'UNRECORDED_NOT_VERIFIED'});
 x.totals.operator_note_files++;
 x.totals.unrecorded_note_files++;
 assert.equal(parse(x).ok,true,JSON.stringify(parse(x)));
});

test('rejects forged approval, identity, signature, network and custody flags',()=>{
 for(const key of ['operator_identity_authenticated','source_identity_authenticated','signature_verified',
  'approval_granted','live_write_authorized','github_write_executed','data_sent_remotely','report_persisted']){
  const x=sampleAuditReport();x[key]=true;expect(x,'AUTHORITY_CLAIM_REJECTED');
 }
 const snap=sampleAuditReport();snap.ledger.snapshot_authenticated=true;expect(snap,'AUTHORITY_CLAIM_REJECTED');
 const cp=sampleAuditReport();cp.checkpoint.independent_custody_verified=true;expect(cp,'CUSTODY_CLAIM_REJECTED');
 const e=sampleAuditReport();e.timeline[0].approval_granted=true;expect(e,'TIMELINE_INCONSISTENT');
});

test('rejects broken ledger sequence, hash links and inconsistent current head',()=>{
 const sequence=sampleAuditReport();sequence.timeline[1].sequence=3;expect(sequence,'TIMELINE_INCONSISTENT');
 const link=sampleAuditReport();link.timeline[1].previous_entry_sha256='f'.repeat(64);
 expect(link,'TIMELINE_INCONSISTENT');
 const head=sampleAuditReport();head.ledger.head_sha256='1'.repeat(64);expect(head,'LEDGER_HEAD_MISMATCH');
 const badCount=sampleAuditReport();badCount.ledger.entry_count=3;expect(badCount,'LEDGER_METADATA_MISMATCH');
 const duplicate=sampleAuditReport();duplicate.timeline[1].note_filename=duplicate.timeline[0].note_filename;
 expect(duplicate,'DUPLICATE_NOTE');
});

test('rejects misrepresented checkpoint and malicious metadata',()=>{
 const suffix=sampleAuditReport();suffix.checkpoint.head_sha256='f'.repeat(64);
 expect(suffix,'CHECKPOINT_INCONSISTENT');
 const cp=sampleAuditReport();cp.checkpoint.sequence=3;expect(cp,'CHECKPOINT_INCONSISTENT');
 const fakeNoCheckpoint=sampleAuditReport();fakeNoCheckpoint.status='LOCAL_CHAIN_ONLY_VERIFIED';
 expect(fakeNoCheckpoint,'CHECKPOINT_INCONSISTENT');
 const missing=sampleAuditReport();missing.status='BOGUS';expect(missing,'INVALID_STRUCTURE');
});

test('rejects forged inbox status, mismatched hashes and missing reviewed notes',()=>{
 const invalidPacket=sampleAuditReport();
 invalidPacket.inbox[0].status='READY_NOT_RECORDED';
 expect(invalidPacket,'INBOX_LEDGER_MISMATCH');
 const missingPacket=sampleAuditReport();missingPacket.inbox.splice(0,1);
 expect(missingPacket,'INBOX_LEDGER_MISMATCH');
 const wrongFp=sampleAuditReport();wrongFp.inbox[0].fingerprint='wrong';
 expect(wrongFp,'INBOX_LEDGER_MISMATCH');
 const unrecordedNote=sampleAuditReport();unrecordedNote.notes[0].status='UNRECORDED_NOT_VERIFIED';
 expect(unrecordedNote,'NOTES_LEDGER_MISMATCH');
 const summary=sampleAuditReport();summary.totals.decisions.DECLINE=90;expect(summary,'TOTALS_MISMATCH');
 const suspicious=sampleAuditReport();suspicious.totals.inbox_packets=8;expect(suspicious,'TOTALS_MISMATCH');
});

test('rejects JSON, schema and byte bound failures',()=>{
 assert.equal(parseAuditReport('no').code,'INVALID_JSON');
 assert.equal(parseAuditReport('[]').code,'UNKNOWN_SCHEMA');
 assert.equal(parseAuditReport('').code,'EMPTY_REPORT');
 assert.equal(parseAuditReport('x'.repeat(MAX_AUDIT_BYTES+1)).code,'REPORT_TOO_LARGE');
 const changed=sampleAuditReport();changed.schema='reporider.agents.review-note.v0.1';
 expect(changed,'UNKNOWN_SCHEMA');
 const invalidFilename=sampleAuditReport();invalidFilename.inbox[2].filename='../../secrets.txt';
 expect(invalidFilename,'INBOX_INVALID');
});
