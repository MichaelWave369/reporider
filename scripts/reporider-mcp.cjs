#!/usr/bin/env node
'use strict';

/**
 * RR-A02: local MCP stdio adapter for RR-A01.
 * Supported: modern MCP 2026-07-28 discovery+per-request metadata;
 * legacy MCP 2025-11-25 initialize handshake.
 *
 * No sockets, HTTP, GitHub clients, tokens, filesystem writes, agent execution,
 * notifications to people, external queues, or stateful authority.
 *
 * This is a tiny deliberately auditable bridge, not a general MCP framework.
 */
const {runAgentRail, REQUEST_SCHEMA, MAX_REQUEST_BYTES} = require('../.agent-build/src/agent/rail.js');
const {requestProperties} = require('./reporider-mcp-schema.cjs');

const MODERN = '2026-07-28';
const LEGACY = '2025-11-25';
const MAX_LINE_BYTES = MAX_REQUEST_BYTES + 8192; // MCP wire envelope overhead
const INFO = {name:'reporider-agent-rail',version:'0.2.0'};
const INSTRUCTIONS = 'Local deterministic planning only. No authorization, GitHub writes, login, remote calls, notifications, or actual review submission. The review packet must be delivered separately by the host for human review.';
const ACTIONS = [
  ['plan','Plan a repository','Generate a private-first starter repo plan from an idea. Proposals are never permission to create a repo.'],
  ['preview','Preview starter files and issues','Generate/edit only planned draft files and issues, with content fingerprints. No execution or approval.'],
  ['scan','Scan a repo plan','Run RepoRider local heuristic safety policy. A pass is not a security guarantee or authorization.'],
  ['dry_run','Describe write gate','Explain what a real creation would require. Does not write or grant permission.'],
  ['submit_for_review','Prepare a human review packet','Return a review packet IN THE RESPONSE only. Never sends, stores, approves, or dispatches it.']
];

const TOOLS = ACTIONS.map(([action,title,description])=>({
  name:'reporider_'+action,
  title,description,
  inputSchema:{
    type:'object',additionalProperties:false,required:['idea'],
    properties:requestProperties
  },
  annotations:{title,readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false}
}));

const jsonrpc = (id,result)=>({jsonrpc:'2.0',id,result});
const error = (id,code,message)=>({jsonrpc:'2.0',id,error:{code,message}});
const own = (obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
const isObject = x=>x!==null && typeof x==='object' && !Array.isArray(x) && (Object.getPrototypeOf(x)===Object.prototype || Object.getPrototypeOf(x)===null);
const emptyParams = x=>x===undefined || (isObject(x) && Object.keys(x).length===0);
let session = 'new'; // legacy: new => initializing => ready; modern: independent request metadata
const send = value=>process.stdout.write(JSON.stringify(value)+'\n');
const queue = [];
let processing = false;

function parseNoDuplicates(raw) {
  let p=0;
  const ws=()=>{while(p<raw.length&&/\s/.test(raw[p]))p++;};
  const fail=()=>{throw new Error('INVALID_JSON');};
  const str=()=>{
    if(raw[p]!=='"')fail();
    const start=p++;let escaped=false;
    while(p<raw.length){
      const c=raw[p++];
      if(escaped){escaped=false;continue;}
      if(c==='\\'){escaped=true;continue;}
      if(c==='"'){try{return JSON.parse(raw.slice(start,p));}catch{fail();}}
    }
    fail();
  };
  function value(depth){
    if(depth>32)throw new Error('DEPTH_LIMIT');
    ws();
    if(raw[p]==='"'){str();return;}
    if(raw[p]==='{'){
      p++;ws();const seen=new Set();
      if(raw[p]==='}'){p++;return;}
      while(p<raw.length){
        ws();const key=str();
        if(seen.has(key))throw new Error('DUPLICATE_JSON_KEY');
        seen.add(key);ws();
        if(raw[p++]!==':')fail();
        value(depth+1);ws();
        if(raw[p]==='}'){p++;return;}
        if(raw[p++]!==',')fail();
      }fail();
    }
    if(raw[p]==='['){
      p++;ws();if(raw[p]===']'){p++;return;}
      while(p<raw.length){
        value(depth+1);ws();
        if(raw[p]===']'){p++;return;}
        if(raw[p++]!==',')fail();
      }fail();
    }
    const m=raw.slice(p).match(/^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/);
    if(!m)fail();
    p+=m[0].length;
  }
  value(0);ws();
  if(p!==raw.length)fail();
  return JSON.parse(raw);
}

function requestMeta(msg) {
  if(!isObject(msg.params))return null;
  const meta=msg.params._meta;
  if(!isObject(meta))return null;
  return meta;
}
function modernRequest(msg) {
  const meta=requestMeta(msg);
  return meta!==null && typeof meta['io.modelcontextprotocol/protocolVersion']==='string';
}
function validateModernMeta(msg){
  const meta=requestMeta(msg);
  return !!(meta &&
    meta['io.modelcontextprotocol/protocolVersion']===MODERN &&
    isObject(meta['io.modelcontextprotocol/clientInfo']) &&
    typeof meta['io.modelcontextprotocol/clientInfo'].name==='string' &&
    typeof meta['io.modelcontextprotocol/clientInfo'].version==='string' &&
    isObject(meta['io.modelcontextprotocol/clientCapabilities']));
}
function rejectMeta(msg){
  const meta=requestMeta(msg);
  if(!meta)return null;
  if(own(meta,'io.modelcontextprotocol/protocolVersion')){
    if(meta['io.modelcontextprotocol/protocolVersion']!==MODERN)return [-32602,'UNSUPPORTED_PROTOCOL_VERSION'];
    if(!validateModernMeta(msg))return [-32602,'INVALID_PROTOCOL_METADATA'];
  }
  return null;
}
function route(msg) {
  const hasId=own(msg,'id');
  const id=hasId?msg.id:null;
  if(msg.jsonrpc!=='2.0'||typeof msg.method!=='string'||(hasId && !(typeof id==='string'||(typeof id==='number'&&Number.isFinite(id))))) {
    return error(null,-32600,'INVALID_REQUEST');
  }
  // Notifications are one-way. Never send a response to a notification.
  if(!hasId) {
    if(msg.method==='notifications/initialized' && session==='initializing')session='ready';
    return null;
  }
  if(msg.method==='server/discover'){
    if(!validateModernMeta(msg))return error(id,-32602,'INVALID_PROTOCOL_METADATA');
    return jsonrpc(id,{
      resultType:'complete',supportedVersions:[MODERN],
      capabilities:{tools:{listChanged:false}},
      instructions:INSTRUCTIONS,
      ttlMs:3600000,cacheScope:'public',
      _meta:{'io.modelcontextprotocol/serverInfo':INFO}
    });
  }
  if(msg.method==='initialize'){
    const p=msg.params;
    if(!isObject(p)||typeof p.protocolVersion!=='string'||!isObject(p.capabilities)||!isObject(p.clientInfo))
      return error(id,-32602,'INVALID_INITIALIZATION');
    if(p.protocolVersion!==LEGACY)return error(id,-32602,'UNSUPPORTED_PROTOCOL_VERSION');
    if(session!=='new')return error(id,-32600,'ALREADY_INITIALIZED');
    session='initializing';
    return jsonrpc(id,{
      protocolVersion:LEGACY,
      capabilities:{tools:{listChanged:false}},
      serverInfo:INFO,
      instructions:INSTRUCTIONS
    });
  }
  const modern=modernRequest(msg);
  const failure=rejectMeta(msg);
  if(failure)return error(id,...failure);
  if(!modern && session!=='ready')return error(id,-32000,'NOT_INITIALIZED');
  if(modern && !validateModernMeta(msg))return error(id,-32602,'INVALID_PROTOCOL_METADATA');

  if(msg.method==='ping')return jsonrpc(id,{});
  if(msg.method==='tools/list'){
    // Client metadata is allowed, but not arbitrary pagination cursor or flags.
    const p=msg.params;
    if(p!==undefined && (!isObject(p)||Object.keys(p).some(k=>k!=='_meta')))return error(id,-32602,'INVALID_LIST_PARAMS');
    return jsonrpc(id,modern?{resultType:'complete',tools:TOOLS,ttlMs:3600000,cacheScope:'public'}:{tools:TOOLS});
  }
  if(msg.method==='tools/call'){
    const p=msg.params;
    if(!isObject(p) || typeof p.name!=='string' || !own(p,'arguments') || !isObject(p.arguments) ||
       Object.keys(p).some(k=>k!=='name'&&k!=='arguments'&&k!=='_meta'))
      return error(id,-32602,'INVALID_TOOL_PARAMS');
    if(own(p.arguments,'schema') || own(p.arguments,'action'))
      return error(id,-32602,'RESERVED_TOOL_ARGUMENT');
    const action=TOOLS.find(t=>t.name===p.name);
    if(!action)return error(id,-32602,'UNKNOWN_TOOL');
    const input={...p.arguments,schema:REQUEST_SCHEMA,action:p.name.slice('reporider_'.length)};
    // Never mutate the caller's argument object or store a model request.
    let reply;
    try{reply=runAgentRail(input);}
    catch{reply={schema:'reporider.agent.response.v0.1',action:'invalid_request',mode:'mock_only',
      disposition:'BLOCKED',error_code:'MCP_RAIL_FAILURE',reason:'Fail closed',authority_granted:false,
      action_executed:false,repository_created:false,notification_sent:false,memory_admitted:false,
      review_dispatched:false,source_identity_verified:false};}
    const body={
      content:[{type:'text',text:JSON.stringify(reply)}],
      structuredContent:reply,
      isError:reply.disposition==='BLOCKED',
    };
    return jsonrpc(id,modern?{resultType:'complete',...body}:body);
  }
  return error(id,-32601,'METHOD_NOT_FOUND');
}
function processLine(line,oversized=false){
  if(oversized){send(error(null,-32600,'MESSAGE_TOO_LARGE'));return;}
  if(!line.trim())return;
  let msg;
  try{msg=parseNoDuplicates(line);}
  catch(e){send(error(null,-32700,e&&e.message==='DUPLICATE_JSON_KEY'?'DUPLICATE_JSON_KEY':'PARSE_ERROR'));return;}
  if(!isObject(msg)){send(error(null,-32600,'INVALID_REQUEST'));return;}
  const answer=route(msg);
  if(answer)send(answer);
}
function drain(){
  if(processing)return;
  processing=true;
  while(queue.length){
    const [line,oversized]=queue.shift();
    try{processLine(line,oversized);}
    catch{send(error(null,-32603,'INTERNAL_ERROR'));}
  }
  processing=false;
}
let buffer=Buffer.alloc(0);
let dropping=false;
process.stdin.on('data',chunk=>{
  const data=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk);
  buffer=Buffer.concat([buffer,data]);
  let pos;
  while((pos=buffer.indexOf(10))!==-1){
    const lineBytes=buffer.subarray(0,pos);
    buffer=buffer.subarray(pos+1);
    queue.push([lineBytes.toString('utf8'),dropping||lineBytes.length>MAX_LINE_BYTES]);
    dropping=false;
  }
  if(buffer.length>MAX_LINE_BYTES){
    buffer=Buffer.alloc(0);
    dropping=true;
  }
  drain();
});
process.stdin.on('end',()=>{
  if(buffer.length&&!dropping)queue.push([buffer.toString('utf8'),false]);
  else if(dropping)queue.push(['',true]);
  buffer=Buffer.alloc(0);drain();
});
process.stdin.on('error',()=>{process.exitCode=2;});
