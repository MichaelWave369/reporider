'use strict';
const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const path=require('node:path');
const cli=path.resolve(__dirname,'reporider-agent.cjs');
function invoke(raw){
  const r=spawnSync(process.execPath,[cli],{input:raw,encoding:'utf8',maxBuffer:1024*1024});
  assert.ifError(r.error);
  const lines=r.stdout.trim().split('\n');
  assert.equal(lines.length,1,'exactly one output record');
  return {code:r.status,result:JSON.parse(lines[0]),stderr:r.stderr};
}
const base={schema:'reporider.agent.request.v0.1',action:'plan',idea:'Create private docs for a neighborhood reading club'};
const success=invoke(JSON.stringify(base));
assert.equal(success.code,0);
assert.equal(success.result.disposition,'REVIEW_REQUIRED');
assert.equal(success.result.repository_created,false);
assert.equal(success.stderr,'');
const duplicate=invoke('{"schema":"reporider.agent.request.v0.1","action":"plan","action":"submit_for_review","idea":"demo"}');
assert.equal(duplicate.code,2);
assert.equal(duplicate.result.error_code,'DUPLICATE_JSON_KEY');
const nested=invoke('{"schema":"reporider.agent.request.v0.1","action":"plan","idea":"demo","overrides":{"name":"good","name":"bad"}}');
assert.equal(nested.result.error_code,'DUPLICATE_JSON_KEY');
const bad=invoke('not-json');
assert.equal(bad.result.error_code,'INVALID_JSON');
const large=invoke('x'.repeat(65537));
assert.equal(large.result.error_code,'REQUEST_TOO_LARGE');
assert.equal(large.result.action_executed,false);
console.log('RR-A01 CLI fixtures PASS: JSON stdin/stdout, duplicate keys, malformed/oversized denial');
