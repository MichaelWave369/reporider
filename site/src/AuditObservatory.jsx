import React,{useMemo,useState} from 'react';
import {
 AlertTriangle,ArrowDownToLine,BarChart3,BookOpenCheck,CheckCircle2,
 ClipboardCheck,Database,FileJson2,FileText,Fingerprint,FolderOpen,
 History,Info,LockKeyhole,RefreshCcw,ShieldAlert,ShieldCheck,XCircle
} from 'lucide-react';
import {parseAuditReport,sampleAuditReport,MAX_AUDIT_BYTES} from './auditReport.js';

const DECISIONS={
 RECOMMEND_FOR_SEPARATE_AUTHORIZATION:'Recommend separately',
 REQUEST_CHANGES:'Changes requested',
 DECLINE:'Declined'
};
const STATUS_LABELS={
 RECORDED:'Recorded',READY_NOT_RECORDED:'Not recorded',
 REJECTED:'Rejected',UNRECORDED_NOT_VERIFIED:'Note not recorded',
 NOT_REGULAR_FILE:'Suspicious file'
};
const Badge=({children,kind='neutral'})=><span className={'ao9-badge ao9-'+kind}>{children}</span>;
const Meta=({children})=><span className="ao9-meta">{children}</span>;
const Short=({value})=><code title={value}>{value?.length>20?value.slice(0,12)+'…'+value.slice(-8):value}</code>;
function Metric({label,value,detail,icon:Icon}){
 return <div className="ao9-metric"><div className="ao9-metric-icon"><Icon size={19}/></div>
  <div><strong>{value}</strong><span>{label}</span><small>{detail}</small></div></div>;
}
function Bar({name,num,max,kind}){
 return <div className="ao9-bar"><div className="ao9-bar-label"><span>{name}</span><strong>{num}</strong></div>
  <div className="ao9-bar-track"><span className={'ao9-bar-fill ao9-'+kind}
    style={{width:(100*num/Math.max(1,max))+'%'}}/></div></div>;
}
export default function AuditObservatory(){
 const [raw,setRaw]=useState(''),[report,setReport]=useState(null),
  [error,setError]=useState(null),[demo,setDemo]=useState(false),
  [view,setView]=useState('timeline'),[filter,setFilter]=useState('ALL'),
  [selected,setSelected]=useState(null),[note,setNote]=useState('');
 const state=useMemo(()=>{
  if(!report)return{timeline:[],inbox:[],notes:[]};
  return{
   timeline:report.timeline.filter(x=>filter==='ALL'||x.decision===filter),
   inbox:report.inbox.filter(x=>filter==='ALL'||x.status===filter),
   notes:report.notes.filter(x=>filter==='ALL'||x.status===filter)
  };
 },[report,filter]);
 function load(value,isDemo=false){
  const result=parseAuditReport(value);
  if(result.ok){
   setReport(result.report);setError(null);setDemo(isDemo);setNote('');
   setFilter('ALL');setView('timeline');setSelected(null);
  }else{
   setReport(null);setError(result);setDemo(false);setSelected(null);
  }
 }
 function sample(){
  const value=JSON.stringify(sampleAuditReport(),null,2);
  setRaw(value);load(value,true);
 }
 async function pickFile(event){
  const file=event.target.files?.[0];event.target.value='';
  if(!file)return;
  if(file.size>MAX_AUDIT_BYTES){
   setReport(null);setDemo(false);setError({code:'REPORT_TOO_LARGE',message:'Maximum JSON report size is 1.5 MB.'});return;
  }
  try{
   const content=await file.text();setRaw(content);load(content);
  }catch{setReport(null);setDemo(false);setError({code:'FILE_READ_FAILED',message:'The selected file could not be read.'});}
 }
 function clear(){
  setRaw('');setReport(null);setError(null);setDemo(false);setSelected(null);setFilter('ALL');setNote('');
 }
 const numbers=report?.totals;
 const decisions=report?[
  ['Recommend separately',numbers.decisions.RECOMMEND_FOR_SEPARATE_AUTHORIZATION,'mint'],
  ['Changes requested',numbers.decisions.REQUEST_CHANGES,'gold'],
  ['Declined',numbers.decisions.DECLINE,'red']
 ]:[];
 const inboxStates=report?[
  ['Recorded',numbers.inbox_packets-numbers.ready_not_recorded-numbers.rejected_packets,'mint'],
  ['Not recorded',numbers.ready_not_recorded,'gold'],
  ['Rejected',numbers.rejected_packets,'red']
 ]:[];
 function detail(item){
  setSelected(item);setNote('Selected row details are metadata from the imported report, not independently authenticated.');
 }
 return <div className="ao9-root">
  <div className="page-heading"><span className="kicker"><span className="kicker-dot"/>RR-A09 / AUDIT OBSERVATORY</span>
   <h1>Your ledger.<br/><em>In clear view.</em></h1>
   <p>Visualize a RepoRider RR-A08 operator audit snapshot. Import JSON generated on your own machine. This public static page never reads your inbox, calls GitHub, contacts localhost or authorizes an agent.</p>
  </div>
  <div className="ao9-boundary"><ShieldAlert size={20}/><div>
   <strong>DISPLAY-ONLY · NOT INDEPENDENT VERIFICATION</strong>
   <p>The viewer checks JSON structure and internal summary consistency, not the underlying ledger, provenance or checkpoint custody. Run the local audit CLI to verify actual evidence. Imported values remain untrusted.</p>
  </div></div>
  <section className="panel ao9-intake">
   <div className="ao9-section-top"><div><Meta>01 / IMPORT</Meta><h2>Open a local audit report</h2>
    <p>Export using <code>npm run audit:console -- --inbox ABSOLUTE_DIR --format json</code>, then select or paste the output.</p>
   </div><Badge kind="mint">NO UPLOAD</Badge></div>
   <div className="ao9-actions">
    <label className="ao9-file-picker"><FolderOpen size={17}/> Select local JSON
     <input type="file" accept=".json,application/json" aria-label="Select RR-A08 audit JSON" onChange={pickFile}/>
    </label>
    <button className="btn outline" onClick={sample}><FileJson2 size={16}/> Load synthetic demo</button>
    <button className="btn outline" onClick={()=>load(raw)} disabled={!raw.trim()}><BookOpenCheck size={16}/> Inspect pasted JSON</button>
    <button className="ao9-clear" onClick={clear}><RefreshCcw size={15}/> Clear</button>
   </div>
   <label htmlFor="ao9-import" className="field-label">Audit JSON (optional paste)</label>
   <textarea id="ao9-import" className="code-editor ao9-textarea" rows={4} spellCheck={false}
    value={raw} onChange={e=>setRaw(e.target.value)}
    placeholder='{"schema":"reporider.local.operator-audit.v0.1", ...}'/>
   <div className="ao9-input-foot"><span>Accepted: RR-A08 operator audit v0.1 · JSON only</span><span>{raw.length.toLocaleString()} characters</span></div>
   {error&&<div className="ao9-error" role="alert"><XCircle size={18}/><span><strong>{error.code}</strong> · {error.message}</span></div>}
  </section>
  {report&&<>
   <div className={'ao9-import-banner'+(demo?' ao9-demo':'')} role="status">
    {demo?<AlertTriangle size={19}/>:<Info size={19}/>}
    <div><strong>{demo?'SYNTHETIC DEMONSTRATION · NO REAL EVIDENCE':'IMPORTED REPORT SNAPSHOT · UNTRUSTED SOURCE'}</strong>
     <p>{demo?'Numbers and hash strings are fictional examples. No ledger was checked.':
      'Report schema and internal counters are consistent. Actual ledger verification, witness custody and identity have not been independently checked by this page.'}</p>
    </div>
   </div>
   <section className="ao9-metrics">
    <Metric label="Recorded entries" value={numbers.recorded_entries} icon={Database}
     detail="Reported in local ledger"/>
    <Metric label="Awaiting recording" value={numbers.ready_not_recorded} icon={History}
     detail="Replay-ready inbox packets"/>
    <Metric label="Rejected packets" value={numbers.rejected_packets} icon={ShieldAlert}
     detail="Failed local replay in source report"/>
    <Metric label="Loose review notes" value={numbers.unrecorded_note_files} icon={ClipboardCheck}
     detail="Not yet in evidence chain"/>
   </section>
   <section className="panel ao9-integrity">
    <div className="ao9-section-top"><div><Meta>02 / REPORTED VERIFICATION</Meta><h2>Chain and checkpoint</h2></div><Badge kind="neutral">IMPORTED CLAIMS</Badge></div>
    <div className="ao9-integrity-grid">
     <div className="ao9-chain"><div className="ao9-label-row"><ShieldCheck size={18}/>
       <strong>{report.status==='LOCAL_CHAIN_AND_SUPPLIED_CHECKPOINT_MATCH'?'Report claims checkpoint match':'Report claims local chain consistency'}</strong>
      </div>
      <p>{report.status==='LOCAL_CHAIN_AND_SUPPLIED_CHECKPOINT_MATCH'
       ?'An operator-supplied checkpoint was reported to match a historical ledger prefix.'
       :'No independent checkpoint was supplied to the original audit. Tail rollback protection is not established by this snapshot.'}</p>
      <div className="ao9-hash"><span>Reported ledger head · SHA-256</span><code>{report.ledger.head_sha256}</code></div>
     </div>
     <div className="ao9-checkpoint"><Fingerprint size={22}/>
      <strong>{report.checkpoint.status==='NOT_SUPPLIED'?'No checkpoint supplied':'Checkpoint included in report'}</strong>
      <span>{report.checkpoint.sequence===null?'Nothing anchored in this report':'Reported historical sequence #'+report.checkpoint.sequence}</span>
      <small>Independent custody verified: NO</small><small>Digital signature verified: NO</small>
     </div>
    </div>
   </section>
   <section className="panel ao9-distribution">
    <div className="ao9-section-top"><div><Meta>03 / REPORTED ACTIVITY</Meta><h2>Review outcomes and inbox</h2></div><BarChart3 size={22}/></div>
    <div className="ao9-chart-grid">
     <div><h3>Decisions recorded</h3>{decisions.map(([name,num,kind])=><Bar key={name} name={name} num={num} max={numbers.recorded_entries} kind={kind}/>)}</div>
     <div><h3>Inbox state</h3>{inboxStates.map(([name,num,kind])=><Bar key={name} name={name} num={num} max={numbers.inbox_packets} kind={kind}/>)}
      <p className="ao9-minor">Unexpected/suspicious note entries: {numbers.suspicious_note_entries}</p></div>
    </div>
   </section>
   <section className="panel ao9-explorer">
    <div className="ao9-section-top"><div><Meta>04 / INSPECT METADATA</Meta><h2>Evidence explorer</h2><p>Read-only summaries from the imported snapshot. No source code or raw review notes appear here.</p></div></div>
    <div className="ao9-tabs">
     <button className={view==='timeline'?'active':''} onClick={()=>{setView('timeline');setFilter('ALL');setSelected(null);}}><History size={16}/> Timeline ({report.timeline.length})</button>
     <button className={view==='inbox'?'active':''} onClick={()=>{setView('inbox');setFilter('ALL');setSelected(null);}}><Database size={16}/> Inbox ({report.inbox.length})</button>
     <button className={view==='notes'?'active':''} onClick={()=>{setView('notes');setFilter('ALL');setSelected(null);}}><FileText size={16}/> Notes ({report.notes.length})</button>
    </div>
    <div className="ao9-filter">
     <label htmlFor="ao9-filter">Show</label>
     <select id="ao9-filter" value={filter} onChange={e=>{setFilter(e.target.value);setSelected(null);}}>
      <option value="ALL">All {view}</option>
      {(view==='timeline'?Object.keys(DECISIONS):view==='inbox'?['RECORDED','READY_NOT_RECORDED','REJECTED']:['RECORDED','UNRECORDED_NOT_VERIFIED','NOT_REGULAR_FILE'])
      .map(v=><option key={v} value={v}>{DECISIONS[v]||STATUS_LABELS[v]||v}</option>)}
     </select><span>{state[view].length} shown</span>
    </div>
    <div className="ao9-list">
     {state[view].length===0?<p className="ao9-none">No entries match this view.</p>:state[view].map((item,i)=>
      <button type="button" className={'ao9-row'+(selected===item?' active':'')} key={(item.entry_sha256||item.filename)+i} onClick={()=>detail(item)}>
       <div className="ao9-index">{view==='timeline'?String(item.sequence).padStart(2,'0'):view==='inbox'?<Database size={17}/>:<FileText size={17}/>}</div>
       <div className="ao9-row-body">
        <strong>{view==='timeline'?(DECISIONS[item.decision]||item.decision):view==='inbox'?item.repo_name||item.filename:item.filename}</strong>
        <small>{view==='timeline'?item.packet_filename:view==='inbox'?item.filename:'Local review note'}</small>
       </div>
       <Badge kind={((item.decision==='DECLINE'||item.status==='REJECTED'||item.status==='NOT_REGULAR_FILE')?'red':
        (item.decision==='REQUEST_CHANGES'||item.status==='READY_NOT_RECORDED'||item.status==='UNRECORDED_NOT_VERIFIED')?'gold':'mint')}>
        {view==='timeline'?'#'+item.sequence:(STATUS_LABELS[item.status]||item.status)}
       </Badge>
      </button>
     )}
    </div>
    {selected&&<div className="ao9-selection">
     <div><Info size={17}/><strong>Selected row · snapshot metadata</strong></div>
     <dl>{Object.entries(selected).map(([key,value])=><React.Fragment key={key}>
      <dt>{key.replaceAll('_',' ')}</dt><dd>{typeof value==='boolean'?String(value):String(value)}</dd>
     </React.Fragment>)}</dl>
     <p>{note}</p>
    </div>}
   </section>
  </>}
  <div className="wide-note ao9-final-note"><LockKeyhole size={20}/><div>
   <strong>Audit visualization is not an execution gate.</strong>
   <p>The GitPage only displays imported JSON. Actual ledger verification remains local. An unsigned report or recommendation never grants OAuth, GitHub access, identity proof, model authority or automatic execution.</p>
  </div></div>
 </div>;
}
