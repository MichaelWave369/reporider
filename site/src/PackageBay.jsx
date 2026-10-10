import React,{useMemo,useState} from 'react';
import {ArrowUpRight,Archive,CheckCircle2,ClipboardCopy,Download,FileArchive,LockKeyhole,Package,ShieldCheck,TriangleAlert} from 'lucide-react';
import {buildApprovedFilesFingerprint,buildApprovedIssuesFingerprint,buildRideArtifactFingerprint} from '../../src/lib/receiptFingerprint.ts';
import {canExportPackage,createPackageHandoff} from './packageHandoff.js';

const PHITAR_URL='https://michaelwave369.github.io/DropZone/phitar.html';
const DROPZONE_URL='https://michaelwave369.github.io/DropZone/';

function downloadLocal(blob,filename) {
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');
  link.href=url;link.download=filename;
  document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),5000);
}

export default function PackageBay({plan,files,issues,safety,result,approvedFiles,approvedIssues,go}) {
  const [busy,setBusy]=useState(false),[handoff,setHandoff]=useState(null);
  const [error,setError]=useState(''),[feedback,setFeedback]=useState('');
  const fingerprints=useMemo(()=>({
    approvedFiles:buildApprovedFilesFingerprint(files),
    approvedIssues:buildApprovedIssuesFingerprint(issues),
    rideArtifact:buildRideArtifactFingerprint({approvedFiles:files,approvedIssues:issues,plan,safetyReport:safety}),
  }),[files,issues,plan,safety]);
  const context={plan,files,issues,safety,result,
    approvedFileCount:approvedFiles,approvedIssueCount:approvedIssues,
    currentFingerprints:fingerprints};
  const ready=canExportPackage(context);
  async function exportZip() {
    if(!ready||busy)return;
    setBusy(true);setError('');setFeedback('');setHandoff(null);
    try{
      const output=await createPackageHandoff(context);
      downloadLocal(output.blob,output.filename);
      setHandoff({...output,blob:null});
      setFeedback('Downloaded the locally built starter ZIP. Nothing was uploaded.');
    }catch(e){setError(e?.message||'Could not export the handoff ZIP.');}
    finally{setBusy(false);}
  }
  async function copyDigest() {
    if(!handoff?.sha256)return;
    try{await navigator.clipboard.writeText(handoff.sha256);setFeedback('Copied ZIP SHA-256 checksum.');}
    catch{setError('Clipboard access blocked. Select and copy the visible SHA-256 instead.');}
  }
  return <div className="pb-root">
    <div className="page-heading">
      <span className="kicker"><span className="kicker-dot"/>LOCAL PACKAGE BAY / PHITAR × DROP ZONE</span>
      <h1>Review the ride.<br/><em>Pack the starter.</em></h1>
      <p>Turn your current, reviewed mock starter into a local ZIP for PhiTar inspection or a Drop Zone build kit. No GitHub uploads, accounts, credentials or remote transfers.</p>
    </div>
    <div className="pb-steps" aria-label="Package handoff workflow">
      <div><ShieldCheck size={22}/><strong>01 / Approve</strong><span>Review every file and issue in RepoRider</span></div>
      <div><Package size={22}/><strong>02 / Export</strong><span>Download the ZIP of your approved source</span></div>
      <div><Archive size={22}/><strong>03 / Inspect</strong><span>Open your ZIP locally in PhiTar</span></div>
      <div><FileArchive size={22}/><strong>04 / Build kit</strong><span>Import source into Drop Zone if compatible</span></div>
    </div>
    <div className="pb-grid">
      <section className="panel pb-panel">
        <h2><Package size={21}/> Handoff readiness</h2>
        <div className="pb-status">
          <span><strong>Current file approvals</strong><span>{approvedFiles}/{files.length}</span></span>
          <span><strong>Current issue approvals</strong><span>{approvedIssues}/{issues.length}</span></span>
          <span><strong>Safety blockers</strong><span>{safety.blockerCount}</span></span>
          <span><strong>Mock ride</strong><span>{result?.mode==='mock'?'Completed (local)':'Not completed'}</span></span>
        </div>
        <div className={'pb-readiness'+(ready?' pb-ready':'')}>
          {ready?<CheckCircle2 size={19}/>:<LockKeyhole size={19}/>}
          <div><strong>{ready?'Current mock starter is exportable':'Export locked until current approvals and mock ride'}</strong>
            <p>{ready?'Current artifact fingerprints match the completed mock result. This does not authorize a real publish.':'Finish review in the Review Pit, resolve blockers, then run the mock ride in the Ride Console. Export cannot bypass those gates.'}</p></div>
        </div>
        {!ready&&<div className="pb-actions">
          <button type="button" className="btn outline" onClick={()=>go('review')}>Review files and issues</button>
          <button type="button" className="btn outline" onClick={()=>go('launch')}>Open Ride Console</button>
        </div>}
        <button type="button" className="btn primary pb-export" disabled={!ready||busy} onClick={exportZip}>
          <Download size={17}/>{busy?'Preparing ZIP and SHA-256…':'EXPORT APPROVED STARTER ZIP'}
        </button>
        <p className="pb-small">ZIP creation is local, capped at 8 MiB and 100 starter files. Includes current starter source plus informational issue drafts and mock receipts in a reserved metadata directory. No files are executed.</p>
        {handoff&&ready&&<div className="pb-checksum">
          <span><CheckCircle2 size={16}/> Local package downloaded</span>
          <strong>{handoff.filename}</strong>
          <small>{handoff.fileCount} source files · {handoff.issueCount} draft issues · {handoff.bytes.toLocaleString()} bytes</small>
          <code aria-label="Archive SHA-256">{handoff.sha256}</code>
          <button className="btn outline" onClick={copyDigest}><ClipboardCopy size={15}/> Copy archive SHA-256</button>
          <p>The digest describes exactly the ZIP bytes exported in this session. A matching checksum does not establish that the archive is safe or from a trusted person.</p>
        </div>}
        {feedback&&<p role="status" className="pb-feedback"><CheckCircle2 size={15}/>{feedback}</p>}
        {error&&<p role="alert" className="pb-feedback pb-error"><TriangleAlert size={15}/>{error}</p>}
      </section>
      <section className="panel pb-panel">
        <h2><Archive size={21}/> Choose your destination</h2>
        <div className="pb-target">
          <div className="pb-target-title"><Archive size={22}/><strong>PhiTar Archive Studio</strong></div>
          <p>Inspect the downloaded ZIP and its file paths, or extract it locally. No automatic import between browser tabs.</p>
          <a href={PHITAR_URL} target="_blank" rel="noopener noreferrer" className="btn outline">Open PhiTar <ArrowUpRight size={16}/></a>
        </div>
        <div className="pb-target">
          <div className="pb-target-title"><FileArchive size={22}/><strong>The Drop Zone</strong></div>
          <p>Select the same ZIP in Drop Zone's source importer to inspect the starter and generate a platform build kit. A kit is not a compiled installer.</p>
          <a href={DROPZONE_URL} target="_blank" rel="noopener noreferrer" className="btn outline">Open Drop Zone <ArrowUpRight size={16}/></a>
        </div>
        <div className="pb-boundary"><ShieldCheck size={18}/><p><strong>Ledger above shortcuts.</strong> Neither link transmits the ZIP, its contents or a GitHub token. The included approval fingerprints and receipts are historical local evidence, never an execution grant. The starter may need additional build work for its chosen stack.</p></div>
      </section>
    </div>
  </div>;
}
