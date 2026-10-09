#!/usr/bin/env node
'use strict';

/**
 * RR-A01 one-shot, read-only JSON CLI.
 * Reads ONE versioned JSON object from stdin, emits ONE JSON result on stdout.
 * No shell commands, remote calls, GitHub writes, HTTP listeners, tokens,
 * file persistence or background execution. Build first via npm run agent:build.
 */
const {runAgentRail, failRail, MAX_REQUEST_BYTES} = require('../.agent-build/src/agent/rail.js');

function parseStrictJson(raw) {
  let p = 0;
  const spaces = () => { while (p < raw.length && /\s/.test(raw[p])) p++; };
  const bad = () => { throw new Error('INVALID_JSON'); };
  function str() {
    if (raw[p] !== '"') bad();
    const begin = p++;
    let escaped = false;
    while (p < raw.length) {
      const c = raw[p++];
      if (escaped) { escaped = false; continue; }
      if (c === '\\') { escaped = true; continue; }
      if (c === '"') {
        try { return JSON.parse(raw.slice(begin, p)); }
        catch { bad(); }
      }
    }
    bad();
  }
  function value(depth) {
    if (depth > 32) throw new Error('DEPTH_LIMIT');
    spaces();
    if (raw[p] === '"') { str(); return; }
    if (raw[p] === '{') {
      p++; spaces();
      const keys = new Set();
      if (raw[p] === '}') { p++; return; }
      while (p < raw.length) {
        spaces(); const key = str();
        if (keys.has(key)) throw new Error('DUPLICATE_JSON_KEY');
        keys.add(key); spaces();
        if (raw[p++] !== ':') bad();
        value(depth + 1); spaces();
        if (raw[p] === '}') { p++; return; }
        if (raw[p++] !== ',') bad();
      }
      bad();
    }
    if (raw[p] === '[') {
      p++; spaces();
      if (raw[p] === ']') { p++; return; }
      while (p < raw.length) {
        value(depth + 1); spaces();
        if (raw[p] === ']') { p++; return; }
        if (raw[p++] !== ',') bad();
      }
      bad();
    }
    const match = raw.slice(p).match(/^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/);
    if (!match) bad();
    p += match[0].length;
  }
  value(0); spaces();
  if (p !== raw.length) bad();
  return JSON.parse(raw);
}

let raw = '';
let bytes = 0;
let aborted = false;
function done(out, status) {
  process.stdout.write(JSON.stringify(out) + '\n');
  if(status) process.exitCode = status;
}
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  if(aborted) return;
  bytes += Buffer.byteLength(chunk, 'utf8');
  if(bytes > MAX_REQUEST_BYTES) {
    aborted = true; raw = '';
    done(failRail('REQUEST_TOO_LARGE'),2);
  } else raw += chunk;
});
process.stdin.on('end', () => {
  if(aborted) return;
  try {
    const obj = parseStrictJson(raw);
    const reply = runAgentRail(obj);
    done(reply, reply.error_code ? 2 : 0);
  } catch (e) {
    const code = ['DUPLICATE_JSON_KEY','DEPTH_LIMIT'].includes(e?.message) ? e.message : 'INVALID_JSON';
    done(failRail(code),2);
  }
});
process.stdin.on('error', () => {
  if(!aborted){aborted=true;done(failRail('INPUT_STREAM_ERROR'),2);}
});
