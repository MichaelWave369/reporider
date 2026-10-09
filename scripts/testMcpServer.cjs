'use strict';
const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const path=require('node:path');
const SCRIPT=path.resolve(__dirname,'reporider-mcp.cjs');

const meta={'io.modelcontextprotocol/protocolVersion':'2026-07-28',
  'io.modelcontextprotocol/clientInfo':{name:'ci-smoke',version:'1.0.0'},
  'io.modelcontextprotocol/clientCapabilities':{}};
const legacyMeta={protocolVersion:'2025-11-25',capabilities:{},clientInfo:{name:'legacy-test',version:'1.0.0'}};
const req=(id,method,params)=>({jsonrpc:'2.0',id,method,...(params===undefined?{}:{params})});
const modern=(id,method,other={})=>req(id,method,{_meta:meta,...other});
const proto=(wire)=>{const p=spawnSync(process.execPath,[SCRIPT],{
  input:wire,encoding:'utf8',maxBuffer:8*1024*1024,timeout:10000
});assert.ifError(p.error);assert.equal(p.status,0,p.stderr);
assert.equal(p.stderr,'','no secret logs on stderr');
const lines=p.stdout.trim().split('\n').filter(Boolean);
return lines.map(s=>JSON.parse(s));};
const send=(...messages)=>proto(messages.map(msg=>JSON.stringify(msg)).join('\n')+'\n');
const seed={idea:'Build a private React Vite recipe notebook'};
const m=send(modern(1,'server/discover'),modern(2,'tools/list'),
  modern(3,'tools/call',{name:'reporider_plan',arguments:seed}),
  modern(4,'tools/call',{name:'reporider_preview',arguments:seed}),
  modern(5,'tools/call',{name:'reporider_scan',arguments:seed}),
  modern(6,'tools/call',{name:'reporider_dry_run',arguments:seed}),
  modern(7,'tools/call',{name:'reporider_submit_for_review',arguments:seed}));
assert.deepEqual(m.map(x=>x.id),[1,2,3,4,5,6,7],'multiline request lifecycle');
assert.deepEqual(m[0].result.supportedVersions,['2026-07-28']);
assert.equal(m[0].result.capabilities.tools.listChanged,false);
assert.equal(m[1].result.tools.length,5,'five fixed tools exposed');
assert.deepEqual(m[1].result.tools.map(x=>x.name),
 ['reporider_plan','reporider_preview','reporider_scan','reporider_dry_run','reporider_submit_for_review']);
assert.equal(m[1].result.tools[0].annotations.readOnlyHint,true);
for(const item of m.slice(2)){
  assert.equal(item.result.resultType,'complete');
  const data=item.result.structuredContent;
  assert.equal(data.mode,'mock_only');
  assert.equal(data.action_executed,false);
  assert.equal(data.repository_created,false);
  assert.equal(data.authority_granted,false);
  assert.equal(data.review_dispatched,false);
  assert.equal(data.source_identity_verified,false);
  assert.deepEqual(JSON.parse(item.result.content[0].text),data);
}
assert.equal(m[2].result.structuredContent.data.summary.visibility,'private');
assert.equal(m[6].result.structuredContent.data.review_packet.delivery,'CALLER_HANDOFF_REQUIRED');

const legacy=send(req(1,'initialize',legacyMeta),
 {jsonrpc:'2.0',method:'notifications/initialized'},
 req(2,'tools/list'),
 req(3,'tools/call',{name:'reporider_plan',arguments:seed}),
 req(4,'ping'));
assert.deepEqual(legacy.map(x=>x.id),[1,2,3,4]);
assert.equal(legacy[0].result.protocolVersion,'2025-11-25');
assert.equal(legacy[1].result.tools.length,5);
assert.equal(legacy[2].result.structuredContent.authority_granted,false);
assert.deepEqual(legacy[3].result,{});

const noHandshake=send(req(11,'tools/list'));
assert.equal(noHandshake[0].error.message,'NOT_INITIALIZED');
const unsafe=send(modern(1,'tools/call',{name:'reporider_preview',arguments:{...seed,edits:{files:[{path:'README.md',content:'rm -rf /;'}]}}}));
assert.equal(unsafe[0].result.structuredContent.disposition,'BLOCKED');
assert.equal(unsafe[0].result.structuredContent.data.files,undefined);
assert.equal(unsafe[0].result.isError,true);
assert.ok(!unsafe[0].result.content[0].text.includes('rm -rf'));

const unknown=send(modern(1,'tools/call',{name:'reporider_github_write',arguments:seed}));
assert.equal(unknown[0].error.message,'UNKNOWN_TOOL');
const bypass=send(modern(1,'tools/call',{name:'reporider_plan',arguments:{...seed,authority_granted:true}}));
assert.equal(bypass[0].result.structuredContent.disposition,'BLOCKED');
assert.equal(bypass[0].result.structuredContent.error_code,'INVALID_ENVELOPE');
const wrongProtocol=send(req(1,'server/discover',{_meta:{...meta,['io.modelcontextprotocol/protocolVersion']:'2025-11-25'}}));
assert.equal(wrongProtocol[0].error.message,'INVALID_PROTOCOL_METADATA');
const duplicate=proto('{"jsonrpc":"2.0","id":1,"id":2,"method":"tools/list"}\n');
assert.equal(duplicate[0].error.message,'DUPLICATE_JSON_KEY');
const invalid=proto('not json\n');
assert.equal(invalid[0].error.code,-32700);
const malformed=send(req(1,'tools/call',{name:'reporider_plan',arguments:'raw'}));
assert.equal(malformed[0].error.message,'NOT_INITIALIZED');
const big=proto('x'.repeat(85000)+'\n');
assert.equal(big[0].error.message,'MESSAGE_TOO_LARGE');
console.log('RR-A02 MCP smoke PASS: modern discovery, legacy handshake, 5 tools, deny controls, framing, no stdout noise');
