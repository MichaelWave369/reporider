import React,{useState} from 'react';
import {Check,CheckCircle2,ClipboardCheck,Copy,Download,FileCode2,FileText,
FolderOpen,LockKeyhole,RotateCcw,ShieldAlert,ShieldCheck,TicketCheck} from 'lucide-react';
import {runAgentRail,REQUEST_SCHEMA} from '../../src/agent/rail.ts';
import {inspectReviewImport,makeLocalReviewNote,requiredReviewKeys,
fileReviewKey,issueReviewKey,MAX_REVIEW_IMPORT_CHARS} from '../../src/agent/reviewDesk.ts';

const EXAMPLE={schema:REQUEST_SCHEMA,action:'submit_for_review',
idea:'Create a private React Vite reading tracker with local notes and 3 starter issues',
overrides:{visibility:'private',stack:'react-vite',issueCount:3}};
const CHOICES=[
['RECOMMEND_FOR_SEPARATE_AUTHORIZATION','Recommend for separate authorization','Not an approval or an execution grant'],
['REQUEST_CHANGES','Request changes','Record what should be revised'],
['DECLINE','Decline proposal','Record that this draft should not proceed'],
];
const Label=({children})=><span className="rr3-label">{children}</span>;
const Status=({children,kind=''})=><span className={'rr3-status rr3-'+kind}>{children}</span>;
export default function ReviewDesk(){
 const [raw,setRaw]=useState(''),[bundle,setBundle]=useState(null),[error,setError]=useState(null);
 const [tab,setTab]=useState('files'),[fileIndex,setFileIndex]=useState(0),[issueIndex,setIssueIndex]=useState(0);
 const [checked,setChecked]=useState([]),[decision,setDecision]=useState('REQUEST_CHANGES');
 const [rationale,setRationale]=useState(''),[note,setNote]=useState(null),[feedback,setFeedback]=useState('');
 function load(value){
  const result=inspectReviewImport(value);
  setNote(null);setFeedback('');setChecked([]);setTab('files');setFileIndex(0);setIssueIndex(0);
  if(result.ok){setBundle(result.value);setError(null);}
  else{setBundle(null);setError(result);}
 }
 function sample(){const value=JSON.stringify(runAgentRail(EXAMPLE),null,2);setRaw(value);load(value);}
 function clear(){setRaw('');setBundle(null);setError(null);setChecked([]);setNote(null);setFeedback('');}
 const file=bundle?.files[fileIndex],issue=bundle?.issues[issueIndex];
 const keys=bundle?requiredReviewKeys(bundle):[];
 const allChecked=keys.length>0&&keys.every(k=>checked.includes(k));
 function toggle(key){setChecked(prev=>prev.includes(key)?prev.filter(x=>x!==key):[...prev,key]);setNote(null);setFeedback('');}
 function record(){
  if(!bundle)return;
  try{setNote(makeLocalReviewNote(bundle,checked,decision,rationale));
   setFeedback('Local decision prepared. No external action or approval occurred.');}
  catch(e){setFeedback(e?.message||'Could not prepare review note.');}
 }
 function download(){
  if(!note)return;
  const blob=new Blob([JSON.stringify(note,null,2)+'\n'],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='reporider-local-review-note.json';document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url);
  setFeedback('Downloaded locally. No service contacted.');
 }
 async function copy(){
  if(!note)return;
  try{await navigator.clipboard.writeText(JSON.stringify(note,null,2));setFeedback('Local note copied.');}
  catch{setFeedback('Clipboard unavailable. Export JSON instead.');}
 }
 return <div className="rr3-root">
  <div className="page-heading"><span className="kicker"><span className="kicker-dot"/>RR-A03 / HUMAN REVIEW DESK</span>
   <h1>Agents propose.<br/><em>Humans inspect.</em></h1>
   <p>Import an agent review packet, replay it against RepoRider's own planner and safety policy, and record an informational decision. No accounts, remote queue, or GitHub writes.</p>
  </div>
  <section className="rr3-notice"><ShieldCheck size={20}/><div><strong>REVIEW STATION · NOT AN AUTHORIZATION SERVICE</strong>
    <p>A successful replay checks internal consistency. It cannot prove who authored a packet, authenticate the reviewer, certify the code, or authorize execution.</p></div></section>
  <section className="panel rr3-intake">
   <div className="rr3-heading"><div><Label>01 / IMPORT</Label><h2>Bring an agent proposal into the desk</h2><p>Paste a complete RR-A01 <code>submit_for_review</code> response, MCP tool result, or original request.</p></div><Status kind="lime">LOCAL ONLY</Status></div>
   <label className="field-label" htmlFor="rr3-input">Proposal JSON</label>
   <textarea id="rr3-input" className="code-editor rr3-import" rows={7} maxLength={MAX_REVIEW_IMPORT_CHARS} spellCheck={false}
    placeholder='{"schema":"reporider.agent.response.v0.1", ... }' value={raw} onChange={e=>setRaw(e.target.value)}/>
   <div className="rr3-import-actions"><div>
    <button className="btn primary" disabled={!raw.trim()} onClick={()=>load(raw)}><FolderOpen size={16}/> Inspect proposal</button>
    <button className="btn outline" onClick={sample}><FileText size={16}/> Sample packet</button>
    <button className="rr3-clear" onClick={clear}><RotateCcw size={14}/> Clear</button></div>
    <small>{raw.length.toLocaleString()} / {MAX_REVIEW_IMPORT_CHARS.toLocaleString()} chars</small></div>
   {error&&<div className="rr3-error" role="alert"><ShieldAlert size={18}/><span><strong>{error.code}:</strong> {error.message}</span></div>}
  </section>
  {bundle&&<>
   <div className="rr3-overview">
    <section className="panel rr3-overview-card"><Label>02 / REPLAY RESULT</Label>
      <h2>{String(bundle.summary.repository_name)}</h2><p>{String(bundle.summary.stack)} · {String(bundle.summary.visibility)} proposal</p>
      <div className="rr3-badges"><Status kind="lime"><CheckCircle2 size={13}/> LOCAL REPLAY MATCH</Status><Status>NOT AUTHENTICATED</Status></div>
      <div className="rr3-fingerprint"><span>Consistency fingerprint, not a signature</span><code>{bundle.fingerprint}</code></div>
    </section>
    <section className="panel rr3-overview-card"><Label>ARTIFACT REVIEW</Label>
     <div className="rr3-counters"><div><strong>{bundle.files.length}</strong><span>files</span></div><div><strong>{bundle.issues.length}</strong><span>issues</span></div><div><strong>{checked.length}/{keys.length}</strong><span>checked</span></div></div>
     <div className="meter"><span style={{width:(100*checked.length/Math.max(1,keys.length))+'%'}}/></div>
     <p>Check each exact file or issue after inspecting it. Checking items never grants write authority.</p>
    </section>
   </div>
   <section className="panel rr3-artifacts">
    <div className="rr3-heading"><div><Label>03 / INSPECTION</Label><h2>Inspect the proposed package</h2><p>Source text is displayed inertly, never executed or interpreted as HTML.</p></div><Status>{keys.length} ITEMS</Status></div>
    <div className="rr3-tabs">
     <button className={tab==='files'?'active':''} onClick={()=>setTab('files')}><FileCode2 size={16}/> Files ({bundle.files.length})</button>
     <button className={tab==='issues'?'active':''} onClick={()=>setTab('issues')}><TicketCheck size={16}/> Issues ({bundle.issues.length})</button>
     <button className={tab==='findings'?'active':''} onClick={()=>setTab('findings')}><ShieldAlert size={16}/> Policy ({bundle.findings.length})</button>
    </div>
    {tab==='files'&&<div className="rr3-inspector">
     <nav className="rr3-item-nav" aria-label="Proposed files">{bundle.files.map((f,i)=><button key={fileReviewKey(f)} className={fileIndex===i?'active':''} onClick={()=>setFileIndex(i)}><FileText size={16}/><span>{f.path}</span>{checked.includes(fileReviewKey(f))&&<CheckCircle2 size={15}/>}</button>)}</nav>
     {file&&<div className="rr3-reader"><div className="rr3-reader-title"><strong>{file.path}</strong><Status>{file.riskLevel.toUpperCase()} RISK</Status></div>
       <p>{file.purpose}</p><pre>{file.content}</pre><label className="rr3-check"><input type="checkbox" checked={checked.includes(fileReviewKey(file))} onChange={()=>toggle(fileReviewKey(file))}/><span>I inspected this exact file draft.</span></label></div>}
    </div>}
    {tab==='issues'&&<div className="rr3-inspector">
     <nav className="rr3-item-nav" aria-label="Proposed issues">{bundle.issues.map((it,i)=><button key={issueReviewKey(it)} className={issueIndex===i?'active':''} onClick={()=>setIssueIndex(i)}><TicketCheck size={16}/><span>#{i+1} {it.title}</span>{checked.includes(issueReviewKey(it))&&<CheckCircle2 size={15}/>}</button>)}</nav>
     {issue?<div className="rr3-reader"><div className="rr3-reader-title"><strong>#{issue.index+1} {issue.title}</strong></div>
       <p>{issue.labels.join(' · ')}</p><pre>{issue.body}</pre><label className="rr3-check"><input type="checkbox" checked={checked.includes(issueReviewKey(issue))} onChange={()=>toggle(issueReviewKey(issue))}/><span>I inspected this exact issue draft.</span></label></div>:<p className="rr3-empty">No starter issues proposed.</p>}
    </div>}
    {tab==='findings'&&<div className="rr3-findings">
     <div className="rr3-policy"><ShieldCheck size={20}/><div><strong>Original policy re-evaluated locally</strong><p>{String(bundle.summary.safety_policy)} · {String(bundle.summary.warnings)} warnings · {String(bundle.summary.blockers)} blockers</p></div></div>
     {bundle.findings.length===0?<p className="rr3-empty">No heuristic findings reported. This does not prove the project is secure.</p>:bundle.findings.map((f,i)=><div className="rr3-finding" key={i}><Status kind={f.severity==='warning'?'amber':'red'}>{f.severity.toUpperCase()}</Status><div><strong>{f.id}</strong><p>{f.message}</p>{f.remediation&&<small>{f.remediation}</small>}</div></div>)}
    </div>}
   </section>
   <section className="panel rr3-decisions">
    <div className="rr3-heading"><div><Label>04 / HUMAN ASSESSMENT</Label><h2>Record a local review note</h2><p>No identity validation, approval grant, dispatch or real GitHub action.</p></div><LockKeyhole size={26}/></div>
    <div className="rr3-choices">{CHOICES.map(([value,title,desc])=><label key={value} className={decision===value?'active':''}><input type="radio" name="rr3-choice" checked={decision===value} onChange={()=>{setDecision(value);setNote(null);}}/><span><strong>{title}</strong><small>{desc}</small></span></label>)}</div>
    <label htmlFor="rr3-comment" className="field-label">Rationale (optional)</label>
    <textarea id="rr3-comment" value={rationale} maxLength={1000} rows={3} onChange={e=>{setRationale(e.target.value);setNote(null);}}
      placeholder="Explain your assessment and remaining questions."/>
    <div className="rr3-decision-actions"><div><strong>{checked.length} / {keys.length} artifacts inspected</strong>
     <small>{decision==='RECOMMEND_FOR_SEPARATE_AUTHORIZATION'&&!allChecked?'Inspect all artifacts before recommending.':'A recommendation is not approval to execute.'}</small></div>
     <button className="btn primary" disabled={decision==='RECOMMEND_FOR_SEPARATE_AUTHORIZATION'&&!allChecked} onClick={record}><ClipboardCheck size={16}/> Record local decision</button>
    </div>
    {feedback&&<p className="rr3-feedback" role="status">{feedback}</p>}
    {note&&<div className="rr3-note"><div><Check size={17}/><strong>Informational review note prepared</strong></div>
     <p>{note.decision} · {note.checked_artifacts.length} checked · <code>{note.proposal_fingerprint}</code></p>
     <div><button className="btn outline" onClick={copy}><Copy size={15}/> Copy JSON</button><button className="btn primary" onClick={download}><Download size={15}/> Export JSON</button></div>
    </div>}
   </section>
  </>}
  <div className="wide-note rr3-footer"><ShieldAlert size={19}/><div><strong>Agent work stays untrusted, even after a successful replay.</strong>
   <p>This desk creates no persistent queue, authentication, digital signature, remote handoff or execution approval. A future trusted writer would need fresh authenticated human authorization and an execution-time scan.</p></div></div>
 </div>;
}
