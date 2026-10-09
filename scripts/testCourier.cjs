'use strict';
// RR-A04: subprocess-level opt-in courier, including real bounded disk writes.
const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {createCourier,MAX_QUEUE_FILES}=require('./reporider-courier.cjs');
const server=path.join(__dirname,'reporider-mcp.cjs');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'rr-a04-test-'));
const inbox=path.join(root,'inbox');
fs.mkdirSync(inbox,{mode:0o700});
if(process.platform!=='win32')fs.chmodSync(inbox,0o700);
const metadata={'io.modelcontextprotocol/protocolVersion':'2026-07-28',
 'io.modelcontextprotocol/clientInfo':{name:'rr-a04-test',version:'1'},
 'io.modelcontextprotocol/clientCapabilities':{}};
const req=(id,method,p)=>({jsonrpc:'2.0',id,method,params:{_meta:metadata,...p}});
function run(messages,envExtra={}){
 const input=messages.map(x=>JSON.stringify(x)).join('\n')+'\n';
 const child=spawnSync(process.execPath,[server],{
   input,encoding:'utf8',timeout:30000,maxBuffer:8*1024*1024,
   env:{...process.env,REPORIDER_COURIER_ENABLED:'0',REPORIDER_COURIER_INBOX:'',...envExtra}
 });
 assert.ifError(child.error);
 assert.equal(child.status,0,child.stderr);
 assert.equal(child.stderr,'','no stdout/stderr side channels');
 return child.stdout.trim().split('\n').filter(Boolean).map(JSON.parse);
}
const enabled={REPORIDER_COURIER_ENABLED:'1',REPORIDER_COURIER_INBOX:inbox};
const plan={name:'reporider_enqueue_review',arguments:{
 idea:'Create private React Vite camping checklist',overrides:{visibility:'private',stack:'react-vite',issueCount:3}
}};
try{
 assert.equal(createCourier({REPORIDER_COURIER_ENABLED:'0',REPORIDER_COURIER_INBOX:inbox}),null,'off by default');
 const off=run([req(1,'tools/list'),req(2,'tools/call',plan)]);
 assert.equal(off[0].result.tools.length,5,'default 5 no-write tools');
 assert.equal(off[1].error.message,'UNKNOWN_TOOL','courier absent unless enabled');
 assert.equal(fs.readdirSync(inbox).length,0,'no accidental disk writes');
 const live=run([req(1,'server/discover'),req(2,'tools/list'),req(3,'tools/call',plan)],enabled);
 assert.equal(live[1].result.tools.length,6,'opt-in adds one local write tool');
 const tool=live[1].result.tools.find(x=>x.name==='reporider_enqueue_review');
 assert.ok(tool,'courier discoverable');
 assert.equal(tool.annotations.readOnlyHint,false,'tool write effect must be advertised');
 const receipt=live[2].result.structuredContent;
 assert.equal(receipt.disposition,'LOCAL_INBOX_SAVED');
 assert.equal(receipt.action_executed,true,'local inbox file write actually occurred');
 assert.equal(receipt.local_file_write_executed,true,'local file effect recorded');
 assert.equal(receipt.github_write_executed,false,'no GitHub write execution');
 assert.equal(receipt.approval_granted,false,'no grant');
 assert.equal(receipt.live_write_authorized,false,'no GitHub authority');
 assert.equal(receipt.human_notified,false,'not sent');
 assert.equal(receipt.operator_identity_verified,false,'operator not authenticated');
 assert.equal(receipt.requires_manual_file_open,true,'operator must open packet');
 assert.equal(receipt.local_queue_saved,true,'only local queue side effect');
 assert.match(receipt.filename,/^reporider-review-[a-f0-9-]+\.json$/);
 const stored=fs.readFileSync(path.join(inbox,receipt.filename),'utf8');
 const parsed=JSON.parse(stored);
 assert.equal(parsed.action,'submit_for_review');
 assert.equal(parsed.data.review_packet.delivery,'CALLER_HANDOFF_REQUIRED');
 assert.equal(parsed.data.review_packet.proposal_request.action,'submit_for_review');
 assert.equal(parsed.authority_granted,false);
 assert.equal(parsed.repository_created,false);
 assert.equal(parsed.data.summary.fingerprint,receipt.proposal_fingerprint);
 if(process.platform!=='win32'){
  assert.equal(fs.statSync(path.join(inbox,receipt.filename)).mode&0o077,0,'owner-only packet mode');
 }
 const blocked=run([req(1,'tools/call',{name:'reporider_enqueue_review',arguments:{
  idea:plan.arguments.idea,edits:{files:[{path:'README.md',content:'rm -rf /;'}]}
 }})],enabled);
 assert.equal(blocked[0].result.structuredContent.disposition,'BLOCKED');
 assert.equal(fs.readdirSync(inbox).length,1,'blocked request never queued');
 const unknown=run([req(1,'tools/call',{name:'reporider_enqueue_review',arguments:{
  ...plan.arguments,absolutePath:'/tmp/evil.json'
 }})],enabled);
 assert.equal(unknown[0].result.structuredContent.error_code,'INVALID_ENVELOPE');
 assert.equal(fs.readdirSync(inbox).length,1,'caller cannot write arbitrary paths');
 // Local inbox cap protects against runaway MCP agents even when opted in.
 const n=MAX_QUEUE_FILES-1;
 const batch=run(Array.from({length:n+1},(_,i)=>req(i+1,'tools/call',plan)),enabled);
 assert.equal(batch.filter(x=>x.result.structuredContent.disposition==='LOCAL_INBOX_SAVED').length,n);
 assert.equal(batch[n].result.structuredContent.error_code,'INBOX_CAPACITY_REACHED');
 assert.equal(fs.readdirSync(inbox).length,MAX_QUEUE_FILES);
 const unsafe=path.join(root,'symlink');
 if(process.platform!=='win32'){
  fs.symlinkSync(inbox,unsafe,'dir');
  assert.throws(()=>createCourier({REPORIDER_COURIER_ENABLED:'1',REPORIDER_COURIER_INBOX:unsafe}),/INBOX_NOT_REAL_DIRECTORY/);
  const publicDir=path.join(root,'public');fs.mkdirSync(publicDir,{mode:0o777});fs.chmodSync(publicDir,0o777);
  assert.throws(()=>createCourier({REPORIDER_COURIER_ENABLED:'1',REPORIDER_COURIER_INBOX:publicDir}),/INBOX_INSECURE_PERMISSIONS/);
 }
 assert.throws(()=>createCourier({REPORIDER_COURIER_ENABLED:'1',REPORIDER_COURIER_INBOX:'relative/path'}),/INBOX_ABSOLUTE_PATH_REQUIRED/);
 console.log('RR-A04 PASS: opt-in only, real locked-down local inbox, per-packet ACL, unsafe requests refused, capacity and path controls');
}finally{
 fs.rmSync(root,{recursive:true,force:true});
}
