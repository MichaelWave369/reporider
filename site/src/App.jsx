import React,{useMemo,useState} from 'react';
import {
 ArrowRight,ArrowUpRight,BookOpen,Check,CheckCircle2,ChevronRight,ClipboardCheck,
 Code2,Copy,Download,FileCode2,FileText,FolderGit2,GitBranch,Github,KeyRound,
 Layers3,LockKeyhole,Menu,NotebookPen,Play,Plus,RotateCcw,Route,Shield,
 ShieldAlert,ShieldCheck,Sparkles,Terminal,TicketCheck,Bike,UserRoundCheck,ChartNoAxesCombined,Package,X,Zap
} from 'lucide-react';

import {buildRepoPlan,starterStackLabels,starterStackOptions} from '../../src/lib/repoPlanner.ts';
import {visibilityEducation,canProceedWithVisibility} from '../../src/lib/visibilityGate.ts';
import {validateRepositoryName,getRepositoryNamePrewriteGate,MAX_REPO_NAME_LENGTH} from '../../src/lib/repoNaming.ts';
import {scanRepoPlan} from '../../src/lib/safetyScan.ts';
import {buildStarterFilePreviews,applyStarterFileDrafts,buildStarterFileApprovalFingerprint} from '../../src/lib/starterFilePreview.ts';
import {buildStarterIssuePreviews,applyStarterIssueDrafts,buildStarterIssueApprovalFingerprint,starterIssueKeyForIndex} from '../../src/lib/starterIssuePreview.ts';
import {createSeedReceipts} from '../../src/lib/receiptLedger.ts';
import {createMockGitHubRepository} from '../../src/lib/github/mockGitHubClient.ts';
import {buildJsonRideReceipt} from '../../src/lib/rideReceiptJson.ts';
import {buildMockAuthCapability} from '../../src/lib/authCapability.ts';
import {buildMockLiveModeState} from '../../src/lib/liveModeState.ts';
import {nullTokenStorageAdapter} from '../../src/lib/tokenStorage.ts';
import {dryRunWriterAdapter} from '../../src/lib/dryRunWriter.ts';
import {approvalCount,canCompleteMock,resetReviewState,isMockOnlyResult} from './review.js';
import ReviewDesk from './ReviewDesk.jsx';
import AuditObservatory from './AuditObservatory.jsx';
import PackageBay from './PackageBay.jsx';

const REPO='https://github.com/MichaelWave369/reporider';
const IDEAS=[
  {name:'Camp Companion',value:'Build a private mobile camping checklist app using Expo React Native with offline-first checklists and three starter issues.'},
  {name:'Portfolio',value:'Create a public React website for an illustrator portfolio with project galleries and a contact page.'},
  {name:'CLI Toolkit',value:'Make a private Node CLI that organizes local engineering notes and helps generate release checklists.'}
];
const initialIdea=IDEAS[0].value;
const sections=[
  {id:'dashboard',name:'Dashboard',hint:'The starting line',icon:Route},
  {id:'garage',name:'Idea Garage',hint:'Capture and shape',icon:NotebookPen},
  {id:'review',name:'Review Pit',hint:'Inspect every artifact',icon:FileCode2},
  {id:'launch',name:'Ride Console',hint:'Safety and receipts',icon:ShieldCheck},
  {id:'review-desk',name:'Agent Review Desk',hint:'RR-A03 · Human review',icon:UserRoundCheck},
  {id:'audit-observatory',name:'Audit Observatory',hint:'RR-A09 · Visual audit',icon:ChartNoAxesCombined},
  {id:'package-bay',name:'Package Bay',hint:'PhiTar + Drop Zone handoff',icon:Package},
  {id:'about',name:'About RepoRider',hint:'Capabilities and boundaries',icon:BookOpen}
];
function Badge({type='muted',children}){return <span className={'badge badge-'+type}>{children}</span>;}
function Brand(){return <div className="brand"><span className="brand-symbol"><Bike size={24}/><span className="brand-spark">✦</span></span><span><strong>REPO<span>RIDER</span></strong><small>IDEA → REPO → RECEIPTS</small></span></div>;}
function Kicker({children}){return <span className="kicker"><span className="kicker-dot"/>{children}</span>;}
function StepHeading({number,title,caption,right}){return <div className="step-heading"><div className="step-heading-main"><span className="step-number">{number}</span><div><h2>{title}</h2><p>{caption}</p></div></div>{right}</div>;}
function PromoVisual(){return <div className="promo-visual" aria-label="Stylized route from idea to reviewed repository" role="img"><div className="orb orb-one"/><div className="orb orb-two"/><div className="grid-art"/><div className="path-art"><svg viewBox="0 0 440 390" aria-hidden="true"><path d="M65 333c-23-49 3-113 62-111 54 2 79 42 138 7 37-22 18-73 78-83 34-6 56-35 42-74" fill="none" stroke="#536574" strokeWidth="8" strokeLinecap="round" strokeDasharray="4 16"/><path d="M65 333c-23-49 3-113 62-111 54 2 79 42 138 7 37-22 18-73 78-83 34-6 56-35 42-74" fill="none" stroke="#b8ed73" strokeWidth="3" strokeLinecap="round" strokeDasharray="5 15"/></svg></div><div className="path-label path-first"><Sparkles size={18}/><strong>01</strong><small>IDEA</small></div><div className="path-label path-middle"><ShieldCheck size={18}/><strong>02</strong><small>REVIEW</small></div><div className="path-label path-last"><FolderGit2 size={19}/><strong>03</strong><small>MOCK RIDE</small></div><div className="visual-sticker">NO REAL GITHUB WRITES <LockKeyhole size={13}/></div></div>;}
function Dashboard({go,plan,safety,approvedFiles,approvedIssues}){
 return <>
 <div className="hero-panel"><div className="hero-text"><Kicker>THE BUILDERS' LAUNCHPAD · MOCK MODE</Kicker><h1>Catch the idea.<br/><em>Ride the build.</em></h1><p>Your next great repo doesn't have to wait until you're back at the desk. Capture the spark, shape the starter, review every file and issue, then take a safe mock ride.</p><div className="hero-actions"><button className="btn primary" onClick={()=>go('garage')}>Start a new ride <ArrowRight size={17}/></button><button className="btn outline" onClick={()=>go('about')}>How it works <ArrowUpRight size={16}/></button></div><div className="hero-facts"><span><ShieldCheck size={14}/> Human approval first</span><span><LockKeyhole size={14}/> No tokens collected</span></div></div><PromoVisual/></div>
 <div className="stats-grid"><div className="stat-card"><span className="stat-icon lime"><FolderGit2 size={21}/></span><strong>{plan.files.length}</strong><span>Starter files planned</span><small>Generated by the actual planner</small></div><div className="stat-card"><span className="stat-icon cyan"><TicketCheck size={21}/></span><strong>{plan.issues.length}</strong><span>Starter issues</span><small>Each requires human review</small></div><div className="stat-card"><span className="stat-icon amber"><Shield size={21}/></span><strong>{safety.blockerCount}</strong><span>Safety blockers</span><small>{safety.warningCount} warning(s) to inspect</small></div></div>
 <div className="dashboard-lower"><section className="panel journey-panel"><div className="section-heading"><Kicker>THE RIDE SEQUENCE</Kicker><h2>Four steps. No blind commits.</h2></div>{[
 ['01','Capture','Speak or type the idea and choose a direction.','garage'],
 ['02','Shape','Review the repo name, stack, privacy and first issues.','garage'],
 ['03','Approve','Read, edit and approve each generated artifact.','review'],
 ['04','Mock ride','Inspect the safety gate, simulate, and export a receipt.','launch']
 ].map(([n,title,detail,target])=><button className="journey-row" onClick={()=>go(target)} key={n}><span>{n}</span><span><strong>{title}</strong><small>{detail}</small></span><ArrowRight size={17}/></button>)}</section>
 <section className="panel current-card"><Kicker>ON THE WORKBENCH</Kicker><div className="current-icon"><FolderGit2 size={32}/></div><h2>{plan.name}</h2><p>{plan.description}</p><div className="current-tags"><Badge type="lime">{plan.visibility.toUpperCase()}-FIRST</Badge><Badge>{starterStackLabels[plan.stack]}</Badge></div><div className="meter-label"><span>Artifact approvals</span><strong>{approvedFiles+approvedIssues} / {plan.files.length+plan.issues.length}</strong></div><div className="meter"><span style={{width:((approvedFiles+approvedIssues)/Math.max(1,plan.files.length+plan.issues.length)*100)+'%'}}/></div><button className="text-link" onClick={()=>go('review')}>Inspect draft files <ArrowRight size={15}/></button></section></div>
 </>;
}
function Garage({idea,updateIdea,overrides,updateOverrides,plan,safety,go}){
 const nameStatus=validateRepositoryName(plan.name);
 const collisionStatus=getRepositoryNamePrewriteGate(plan.name);
 return <><div className="page-heading"><Kicker>THE IDEA GARAGE / 01</Kicker><h1>Every big build starts <em>somewhere.</em></h1><p>Use your words. RepoRider's existing local planner turns the idea into a reviewable GitHub starter plan.</p></div>
 <div className="two-column"><section className="panel"><StepHeading number="01" title="Capture the spark" caption="Type, paste, or use your device's keyboard dictation."/><label className="field-label" htmlFor="idea">Describe your repository idea</label><textarea className="idea-box" id="idea" rows={7} maxLength={2400} value={idea} onChange={e=>updateIdea(e.target.value)} placeholder="I want a little app that..."/><div className="counter">{idea.length} / 2400 characters · Local browser state only</div><span className="mini-title">TRY AN EXAMPLE IDEA</span><div className="preset-grid">{IDEAS.map(example=><button key={example.name} className="preset" onClick={()=>updateIdea(example.value)}><Sparkles size={14}/>{example.name}</button>)}</div><div className="note-box"><LockKeyhole size={19}/><span>No transcription service, model API or GitHub permission is used. Device dictation may follow your device's own privacy rules.</span></div></section>
 <section className="panel"><StepHeading number="02" title="Steer the starter" caption="The real RepoRider planner makes these suggestions."/><div className="field-stack"><label className="field-label" htmlFor="repo-name">Repository name</label><input id="repo-name" value={overrides.name??plan.name} onChange={e=>updateOverrides({name:e.target.value})} maxLength={MAX_REPO_NAME_LENGTH} aria-invalid={!nameStatus.valid} aria-describedby="repo-name-help"/>
 <div id="repo-name-help" className={'repo-name-guidance'+(nameStatus.valid?'':' invalid')} role="status">
  <strong>{nameStatus.valid?'Valid lowercase slug format.':'Blocked: '+nameStatus.message}</strong>
  <span>96 characters max, lowercase letters, numbers, and single hyphens.</span>
  <span>GitHub name collision: {collisionStatus.name_collision_unverified?'UNVERIFIED':'VERIFIED'} until an authenticated owner-scoped prewrite check is available.</span>
 </div><div className="settings-two"><div><label className="field-label" htmlFor="visibility">Visibility</label><select id="visibility" value={plan.visibility} onChange={e=>updateOverrides({visibility:e.target.value})}><option value="private">Private (recommended)</option><option value="public">Public</option></select></div><div><label className="field-label" htmlFor="issues">Starter issues</label><select id="issues" value={plan.issues.length} onChange={e=>updateOverrides({issueCount:Number(e.target.value)})}>{[0,1,2,3,4,5].map(n=><option value={n} key={n}>{n}</option>)}</select></div></div><label className="field-label" htmlFor="stack">Starter technology</label><select id="stack" value={plan.stack} onChange={e=>updateOverrides({stack:e.target.value})}>{starterStackOptions.map(stack=><option value={stack} key={stack}>{starterStackLabels[stack]}</option>)}</select></div><div className={'visibility-guide'+(plan.visibility==='public'?' public':'')}>
 <strong>{plan.visibility==='public'?'PUBLIC · Anyone can view the code and history':'PRIVATE · Recommended for early ideas'}</strong>
 <p>{visibilityEducation[plan.visibility]}</p>
 {plan.visibility==='public'&&<small>A separate confirmation is required in the Ride Console. The live GitHub writer is still disabled.</small>}
 </div><div className="setting-footer"><Badge type={safety.blockerCount?'red':safety.warningCount?'amber':'lime'}>{safety.status.toUpperCase()}</Badge><span>{plan.files.length} files · {plan.issues.length} issues</span></div><button className="btn primary full" onClick={()=>go('review')}>Review starter artifacts <ArrowRight size={17}/></button><button className="reset-action" onClick={()=>updateOverrides({},true)}><RotateCcw size={14}/> Reset to planner suggestions</button></section></div>
 <div className="wide-note"><ShieldAlert size={19}/><div><strong>Private-first. Approval always required.</strong><p>Generated files are drafts, not executed code. Every change needs fresh approval. Public visibility and detected risks should be inspected before even a future write mode is considered.</p></div></div>
 </>;
}
function Review({plan,files,issues,selectedFile,setSelectedFile,selectedIssue,setSelectedIssue,fileApprovals,issueApprovals,onFileChange,onIssueChange,approveFile,approveIssue,go}){
 const [kind,setKind]=useState('files');const file=files.find(f=>f.path===selectedFile)||files[0];const issue=issues[selectedIssue]||issues[0];
 const fileOk=file && fileApprovals[file.path]===buildStarterFileApprovalFingerprint(file);
 const issueOk=issue && issueApprovals[starterIssueKeyForIndex(selectedIssue)]===buildStarterIssueApprovalFingerprint(issue,selectedIssue);
 const countFiles=approvalCount(files,fileApprovals,f=>f.path,f=>buildStarterFileApprovalFingerprint(f));
 const countIssues=approvalCount(issues,issueApprovals,(_,i)=>starterIssueKeyForIndex(i),(x,i)=>buildStarterIssueApprovalFingerprint(x,i));
 return <><div className="page-heading"><Kicker>THE REVIEW PIT / 02</Kicker><h1>Inspect everything. <em>Approve deliberately.</em></h1><p>These starter files and issues come from RepoRider's existing generators. Edits invalidate previous approvals, so no old fingerprint gets to sneak through.</p></div>
 <div className="review-status"><div><span className="review-circle"><ClipboardCheck size={22}/></span><span><strong>{countFiles} / {files.length}</strong><small>Fresh file approvals</small></span></div><div><span className="review-circle cyan"><TicketCheck size={22}/></span><span><strong>{countIssues} / {issues.length}</strong><small>Fresh issue approvals</small></span></div><button className="btn outline" onClick={()=>go('launch')}>Safety and receipts <ArrowRight size={15}/></button></div>
 <div className="review-tabs"><button className={kind==='files'?'active':''} onClick={()=>setKind('files')}><FileCode2 size={18}/> Starter files ({files.length})</button><button className={kind==='issues'?'active':''} onClick={()=>setKind('issues')}><TicketCheck size={18}/> Starter issues ({issues.length})</button></div>
 {kind==='files'?<div className="review-layout"><aside className="artifact-list">{files.map(f=><button key={f.path} className={'artifact '+(file?.path===f.path?'selected':'')} onClick={()=>setSelectedFile(f.path)}><FileText size={16}/><span><strong>{f.path}</strong><small>{f.riskLevel} risk</small></span>{fileApprovals[f.path]===buildStarterFileApprovalFingerprint(f)?<CheckCircle2 size={17} className="approved-icon"/>:<span className="unapproved-dot"/>}</button>)}</aside><section className="panel editor-panel"><div className="editor-header"><div><span className="mini-title">FILE DRAFT</span><h2>{file.path}</h2></div><Badge type={fileOk?'lime':'amber'}>{fileOk?'APPROVED':'REVIEW REQUIRED'}</Badge></div><p className="editor-purpose">{file.purpose}</p><label className="field-label" htmlFor="file-editor">Editable starter content</label><textarea spellCheck={false} id="file-editor" className="code-editor" value={file.content} onChange={e=>onFileChange(file.path,e.target.value)} rows={17}/><div className="editor-footer"><span>Approval bound to this exact content. Every edit resets it.</span><button className="btn primary" onClick={()=>approveFile(file.path)} disabled={Boolean(fileOk)}><Check size={16}/>{fileOk?'Approved':'Approve file'}</button></div></section></div>:
 <div className="review-layout"><aside className="artifact-list">{issues.length===0?<div className="no-issues">No starter issues planned.</div>:issues.map((it,i)=><button key={i} className={'artifact '+(selectedIssue===i?'selected':'')} onClick={()=>setSelectedIssue(i)}><TicketCheck size={16}/><span><strong>#{i+1} {it.title}</strong><small>{it.labels.join(' · ')}</small></span>{issueApprovals[starterIssueKeyForIndex(i)]===buildStarterIssueApprovalFingerprint(it,i)?<CheckCircle2 size={17} className="approved-icon"/>:<span className="unapproved-dot"/>}</button>)}</aside><section className="panel editor-panel">{issue?<><div className="editor-header"><div><span className="mini-title">ISSUE DRAFT #{selectedIssue+1}</span><h2>Starter issue</h2></div><Badge type={issueOk?'lime':'amber'}>{issueOk?'APPROVED':'REVIEW REQUIRED'}</Badge></div><label className="field-label" htmlFor="issue-title">Issue title</label><input id="issue-title" value={issue.title} maxLength={180} onChange={e=>onIssueChange(selectedIssue,{...issue,title:e.target.value})}/><label className="field-label spaced" htmlFor="issue-body">Issue body</label><textarea id="issue-body" rows={12} className="code-editor" value={issue.body} onChange={e=>onIssueChange(selectedIssue,{...issue,body:e.target.value})}/><label className="field-label spaced" htmlFor="issue-labels">Labels (comma-separated)</label><input id="issue-labels" value={issue.labels.join(', ')} onChange={e=>onIssueChange(selectedIssue,{...issue,labels:e.target.value.split(',').map(x=>x.trim()).filter(Boolean)})}/><div className="editor-footer"><span>Every edit invalidates the previous approval.</span><button className="btn primary" onClick={()=>approveIssue(selectedIssue)} disabled={Boolean(issueOk)}><Check size={16}/>{issueOk?'Approved':'Approve issue'}</button></div></>:<div className="no-issues">You planned zero starter issues. Return to the Idea Garage to change that.</div>}</section></div>}
 <div className="review-next"><span><ShieldCheck size={18}/> Approve all current file and issue drafts before the mock ride.</span><button className="btn outline" onClick={()=>go('launch')}>Go to Ride Console <ArrowRight size={16}/></button></div>
 </>;
}
function Launch({plan,safety,files,issues,approvedFiles,approvedIssues,checked,setChecked,publicConfirmed,setPublicConfirmed,receipts,dryRun,doMock,creating,result,copyJson,downloadJson,go}){
 const [showAll,setShowAll]=useState(false);
 const allApproved=approvedFiles===files.length&&approvedIssues===issues.length&&files.length>0;
 const visibilityReady=canProceedWithVisibility(plan.visibility,publicConfirmed);
 const canMock=visibilityReady&&canCompleteMock(files.length,issues.length,approvedFiles,approvedIssues,safety.blockerCount,checked);
 return <><div className="page-heading"><Kicker>THE RIDE CONSOLE / 03</Kicker><h1>Safety first. <em>Then take the ride.</em></h1><p>This is RepoRider's actual local safety scan and mock creator, without authentication, GitHub writes or any deployed backend.</p></div>
 <div className="console-grid"><section className="panel"><StepHeading number="01" title="Safety checkpoint" caption={'Native policy: '+safety.policyVersion} right={<Badge type={safety.blockerCount?'red':safety.warningCount?'amber':'lime'}>{safety.status.toUpperCase()}</Badge>}/><div className="score-grid"><div><strong>{safety.blockerCount}</strong><span>Blockers</span></div><div><strong>{safety.warningCount}</strong><span>Warnings</span></div><div><strong>{safety.checks.length}</strong><span>Checks</span></div></div><p className="safety-summary">{safety.summary}</p><div className="finding-header"><strong>Policy findings</strong><small>{safety.findings.length} item(s)</small></div>{safety.findings.length===0?<div className="pass-message"><CheckCircle2 size={17}/> No findings from current heuristic checks.</div>:safety.findings.slice(0,showAll?undefined:5).map((f,i)=><div className="finding" key={f.id+'-'+i}><span className={'finding-indicator '+f.severity}/><div><strong>{f.severity.toUpperCase()} · {f.category||'POLICY'}</strong><p>{f.message}</p>{f.remediation&&<small>Fix: {f.remediation}</small>}</div></div>)}{safety.findings.length>5&&<button className="text-link" onClick={()=>setShowAll(!showAll)}>{showAll?'Show fewer':'Show all '+safety.findings.length+' findings'} <ChevronRight size={15}/></button>}</section>
 <section className="panel"><StepHeading number="02" title="Approval ledger" caption="Only current fingerprints count."/><div className="ledger-rows"><div><span>Starter files</span><strong>{approvedFiles}/{files.length}</strong></div><div><span>Starter issues</span><strong>{approvedIssues}/{issues.length}</strong></div><div><span>Visibility</span><strong>{plan.visibility}</strong></div><div><span>GitHub authorization</span><strong className="never">NOT CONNECTED</strong></div><div><span>Live writer</span><strong className="never">DISABLED</strong></div></div><div className="ledger-progress"><div style={{width:(100*(approvedFiles+approvedIssues)/Math.max(1,files.length+issues.length))+'%'}}/></div><p className="ledger-help">Reviewed artifacts still cannot be sent to GitHub from this public Pages site.</p><div className="receipt-sample"><span className="mini-title">PRE-CREATE RECEIPTS · {receipts.length}</span>{receipts.map(r=><div key={r.id}><span>{r.action}</span><small>{r.status.toUpperCase()}</small></div>)}</div><details className="dryrun"><summary><Terminal size={16}/> Inspect dry-run writer <ChevronRight size={16}/></summary><pre>{JSON.stringify({status:dryRun.status,mode:dryRun.mode,canPromoteToLiveWrite:dryRun.canPromoteToLiveWrite,requestSummary:dryRun.requestSummary},null,2)}</pre></details></section></div>
 <section className="panel mock-run"><div><Kicker>03 / MOCK CREATION</Kicker><h2>Ride the build, without touching GitHub.</h2><p>Even with approved drafts and a passing scan, live write mode remains unavailable. The existing mock writer can generate a demonstration result and receipt chain locally.</p><div className={'visibility-guide'+(plan.visibility==='public'?' public':'')}>
  <strong>{plan.visibility==='public'?'Public visibility requires separate consent':'Private repository · Safer default'}</strong>
  <p>{visibilityEducation[plan.visibility]}</p>
  {plan.visibility==='public'&&<label className="accept-line public-consent">
   <input type="checkbox" checked={publicConfirmed} onChange={e=>setPublicConfirmed(e.target.checked)}/>
   <span>I understand that anyone could view and copy this repository and its history if I later create it publicly.</span>
  </label>}
 </div>
 <label className="accept-line"><input type="checkbox" checked={checked} onChange={e=>setChecked(e.target.checked)}/> <span>I reviewed the current starter package and understand this is a mock creation only.</span></label>{safety.warningCount>0&&<p className="warning-note"><ShieldAlert size={15}/> {safety.warningCount} warning(s) still require attention before any future real deployment.</p>}</div><div className="mock-cta"><button className="btn primary" disabled={!canMock||creating} onClick={doMock}><Play size={17}/>{creating?'Simulating...':'Run mock ride'} <ArrowRight size={16}/></button><small>{safety.blockerCount>0?'Safety blockers must be fixed first.':!allApproved?'Approve every file and issue first.':!visibilityReady?'Confirm public visibility separately.':!checked?'Confirm review to enable.':'No network calls or GitHub mutations.'}</small></div></section>
 {result&&isMockOnlyResult(result)&&<section className="panel complete-card"><div className="complete-icon"><CheckCircle2 size={35}/></div><div className="complete-body"><Kicker>MOCK RIDE COMPLETE</Kicker><h2>That was a simulated launch.</h2><p>The creator generated a demonstration receipt for <strong>{result.createdFiles.length} files</strong> and <strong>{result.openedIssues.length} issues</strong>. No real repository exists at the example URL.</p><div className="fake-url"><LockKeyhole size={16}/><span>{result.repositoryUrl} (fictional)</span></div><div className="result-meta"><span>{result.receipts.length} receipts</span><span>{result.summary.receiptChainHash}</span></div><div className="result-buttons"><button className="btn outline" onClick={copyJson}><Copy size={16}/> Copy JSON receipt</button><button className="btn primary" onClick={downloadJson}><Download size={16}/> Export JSON</button><button className="btn outline" onClick={()=>go('package-bay')}><Package size={16}/> Package starter ZIP</button></div></div></section>}
 <div className="wide-note"><ShieldAlert size={19}/><div><strong>A green local scan is not a security guarantee.</strong><p>These are deterministic checks and local example receipts. No token, OAuth consent, hosted vault, API key, or real repository is involved. Hash-like fingerprints are not digital signatures.</p></div></div>
 </>;
}
function About({go}){
 const cards=[
 {icon:NotebookPen,title:'Capture anywhere',text:'The mobile Expo app is designed for typed notes and device dictation. The browser preview accepts typed ideas.'},
 {icon:Layers3,title:'Local deterministic planning',text:'The static site imports the existing RepoRider plan generator instead of inventing different plan rules.'},
 {icon:ShieldCheck,title:'Content and policy checks',text:'Reusable safety scans inspect starter names, paths, package scripts and reviewed content. They are heuristics, not comprehensive auditing.'},
 {icon:ClipboardCheck,title:'Fresh approval per artifact',text:'Approval depends on the exact current file or issue body. Edit it and the approval goes stale.'},
 {icon:Terminal,title:'Mock GitHub writer',text:'Run the existing mock writer locally and export receipts. No GitHub credentials or real pushes.'},
 {icon:KeyRound,title:'Live mode not available',text:'Secure token storage, OAuth, independently verified permissions and live writers still need separate design and qualification.'},
 ];
 return <><div className="page-heading"><Kicker>THE RIDER MANUAL</Kicker><h1>Built to catch sparks. <em>Not steal control.</em></h1><p>RepoRider is an experimental, phone-first, voice-friendly GitHub creation assistant. The real mobile app runs in Expo; this site lets anyone explore a safe part of its existing planning engine.</p></div><div className="about-grid">{cards.map(c=><div className="panel about-card" key={c.title}><span className="about-icon"><c.icon size={24}/></span><h3>{c.title}</h3><p>{c.text}</p></div>)}</div><div className="about-bottom"><div><Kicker>CATCH THE IDEA. FORGE THE REPO.</Kicker><h2>The human holds the handlebars.</h2><p>All work stays in the browser, and clearing the tab clears the ride. You can explore source and architecture before any future live permission system exists.</p><button className="btn primary" onClick={()=>go('garage')}>Try the Idea Garage <ArrowRight size={16}/></button></div><a href={REPO} target="_blank" rel="noreferrer" className="source-tile"><Github size={35}/><span>OPEN SOURCE REPO</span><strong>MichaelWave369/reporider</strong><small>Inspect the Expo app, safety scanner and receipts <ArrowUpRight size={15}/></small></a></div></>;
}
export default function App(){
 const [page,setPage]=useState('dashboard'),[mobile,setMobile]=useState(false);
 const [idea,setIdea]=useState(initialIdea),[overrides,setOverrides]=useState({});
 const [filesDraft,setFilesDraft]=useState(resetReviewState()),[filesApproved,setFilesApproved]=useState(resetReviewState());
 const [issuesDraft,setIssuesDraft]=useState(resetReviewState()),[issuesApproved,setIssuesApproved]=useState(resetReviewState());
 const [selectedFile,setSelectedFile]=useState('README.md'),[selectedIssue,setSelectedIssue]=useState(0);
 const [reviewed,setReviewed]=useState(false),[publicConfirmed,setPublicConfirmed]=useState(false),[creating,setCreating]=useState(false),[result,setResult]=useState(null);
 const [toast,setToast]=useState('');
 const plan=useMemo(()=>buildRepoPlan(idea,overrides),[idea,overrides]);
 const planKey=JSON.stringify(plan);
 const fd=filesDraft.planKey===planKey?filesDraft.values:{};
 const fa=filesApproved.planKey===planKey?filesApproved.values:{};
 const id=issuesDraft.planKey===planKey?issuesDraft.values:{};
 const ia=issuesApproved.planKey===planKey?issuesApproved.values:{};
 const generatedFiles=useMemo(()=>buildStarterFilePreviews(plan),[plan]);
 const files=useMemo(()=>applyStarterFileDrafts(generatedFiles,fd),[generatedFiles,fd]);
 const generatedIssues=useMemo(()=>buildStarterIssuePreviews(plan),[plan]);
 const issues=useMemo(()=>applyStarterIssueDrafts(generatedIssues,id),[generatedIssues,id]);
 const safety=useMemo(()=>scanRepoPlan(plan,files,issues),[plan,files,issues]);
 const seedReceipts=useMemo(()=>createSeedReceipts(plan,safety),[plan,safety]);
 const approvedFileCount=approvalCount(files,fa,f=>f.path,f=>buildStarterFileApprovalFingerprint(f));
 const approvedIssueCount=approvalCount(issues,ia,(_,i)=>starterIssueKeyForIndex(i),(x,i)=>buildStarterIssueApprovalFingerprint(x,i));
 const tokenSnapshot=useMemo(()=>nullTokenStorageAdapter.getSnapshot(),[]);
 const auth=useMemo(()=>buildMockAuthCapability(tokenSnapshot),[tokenSnapshot]);
 const liveMode=useMemo(()=>buildMockLiveModeState(auth,tokenSnapshot),[auth,tokenSnapshot]);
 const dryRun=useMemo(()=>dryRunWriterAdapter.dryRun({plan,safetyReport:safety,approvedByUser:approvedFileCount===files.length&&approvedIssueCount===issues.length,approvedStarterFiles:files.filter(f=>fa[f.path]===buildStarterFileApprovalFingerprint(f)),approvedStarterIssues:issues.filter((issue,i)=>ia[starterIssueKeyForIndex(i)]===buildStarterIssueApprovalFingerprint(issue,i)),receiptPreview:seedReceipts,liveModeState:liveMode}),[plan,safety,files,issues,fa,ia,approvedFileCount,approvedIssueCount,seedReceipts,liveMode]);
 const current=sections.find(s=>s.id===page)||sections[0];
 function go(next){setPage(next);setMobile(false);window.scrollTo({top:0,behavior:'smooth'});}
 function resetApprovals(){setPublicConfirmed(false);setFilesDraft(resetReviewState());setFilesApproved(resetReviewState());setIssuesDraft(resetReviewState());setIssuesApproved(resetReviewState());setSelectedIssue(0);setSelectedFile('README.md');setReviewed(false);setResult(null);}
 function updateIdea(next){setIdea(next);setOverrides({});resetApprovals();}
 function updateOverrides(patch,replace=false){setOverrides(o=>replace?patch:{...o,...patch});resetApprovals();}
 function onFileChange(path,value){setFilesDraft({planKey,values:{...fd,[path]:value}});setReviewed(false);setResult(null);}
 function onIssueChange(i,value){setIssuesDraft({planKey,values:{...id,[starterIssueKeyForIndex(i)]:value}});setReviewed(false);setResult(null);}
 function approveFile(path){const file=files.find(f=>f.path===path);if(!file)return;setFilesApproved({planKey,values:{...fa,[path]:buildStarterFileApprovalFingerprint(file)}});setReviewed(false);setResult(null);}
 function approveIssue(i){const issue=issues[i];if(!issue)return;setIssuesApproved({planKey,values:{...ia,[starterIssueKeyForIndex(i)]:buildStarterIssueApprovalFingerprint(issue,i)}});setReviewed(false);setResult(null);}
 async function doMock(){if(creating||!canProceedWithVisibility(plan.visibility,publicConfirmed)||!canCompleteMock(files.length,issues.length,approvedFileCount,approvedIssueCount,safety.blockerCount,reviewed))return;
  setCreating(true);setResult(null);
  try{const next=await createMockGitHubRepository({plan,safetyReport:safety,approvedByUser:true,publicVisibilityConfirmed:plan.visibility==='public'&&publicConfirmed,starterFiles:files,starterIssues:issues});if(!isMockOnlyResult(next))throw new Error('Non-mock result was refused by public preview.');setResult(next);}
  catch(err){setToast('Mock ride blocked: '+String(err?.message||err));}finally{setCreating(false);}
 }
 async function copyJson(){if(!result||!isMockOnlyResult(result))return;try{await navigator.clipboard.writeText(buildJsonRideReceipt(result));setToast('Mock receipt copied to clipboard.');}catch{setToast('Clipboard unavailable. Use Export JSON instead.');}}
 function downloadJson(){if(!result||!isMockOnlyResult(result))return;const blob=new Blob([buildJsonRideReceipt(result)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='reporider-mock-receipt.json';document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url);setToast('Mock receipt export generated locally.');}
 return <><a className="skip-link" href="#reporider-main">Skip to main content</a><div className="shell"><aside aria-label="RepoRider primary navigation" className={'sidebar'+(mobile?' opened':'')}><div className="sidebar-header"><Brand/><button className="close-nav" aria-label="Close navigation" onClick={()=>setMobile(false)}><X size={20}/></button></div><div className="sidebar-section">RIDER OPERATIONS</div><nav aria-label="Main navigation">{sections.map(section=><button key={section.id} className={'nav-link'+(page===section.id?' active':'')} onClick={()=>go(section.id)} aria-current={page===section.id?'page':undefined} aria-label={`Navigate to ${section.name}`}><section.icon size={19}/><span><strong>{section.name}</strong><small>{section.hint}</small></span>{page===section.id&&<span className="nav-dot"/>}</button>)}</nav><div className="sidebar-bottom"><div className="mode-card"><span className="mode-light"/> <strong>MOCK MODE / SAFE</strong><p>No OAuth. No credentials. No GitHub writes. Your ride stays here.</p><Badge type="lime">BUILD ENGINE ONLINE</Badge></div><a href={REPO} target="_blank" rel="noreferrer" className="sidebar-source"><Github size={17}/> View original Expo app <ArrowUpRight size={15}/></a></div></aside>
 {mobile&&<button className="scrim" onClick={()=>setMobile(false)} aria-label="Close navigation"/>}
 <div className="main-column"><header className="topbar"><div><button className="menu-trigger" onClick={()=>setMobile(true)} aria-label="Open navigation"><Menu size={23}/></button><span className="topbar-crumb">THE GARAGE</span><ChevronRight size={15}/><strong>{current.name.toUpperCase()}</strong></div><div className="topbar-right"><Badge type="lime"><span className="alive-dot"/> MOCK / LOCAL</Badge><a href={REPO} target="_blank" rel="noreferrer" aria-label="RepoRider source on GitHub"><Github size={21}/></a></div></header>
 <div className="privacy-banner"><ShieldCheck size={17}/><strong>PUBLIC INTERACTIVE PREVIEW</strong><span>Using RepoRider's actual deterministic planning and mock-write modules. No real repositories, accounts or tokens involved.</span></div>
 <main id="reporider-main" tabIndex={-1} className="content">
 {page==='dashboard'&&<Dashboard {...{go,plan,safety,approvedFiles:approvedFileCount,approvedIssues:approvedIssueCount}}/>}
 {page==='garage'&&<Garage {...{idea,updateIdea,overrides,updateOverrides,plan,safety,go}}/>}
 {page==='review'&&<Review {...{plan,files,issues,selectedFile,setSelectedFile,selectedIssue,setSelectedIssue,fileApprovals:fa,issueApprovals:ia,onFileChange,onIssueChange,approveFile,approveIssue,go}}/>}
 {page==='launch'&&<Launch {...{plan,safety,files,issues,approvedFiles:approvedFileCount,approvedIssues:approvedIssueCount,checked:reviewed,setChecked:setReviewed,publicConfirmed,setPublicConfirmed,receipts:seedReceipts,dryRun,doMock,creating,result,copyJson,downloadJson,go}}/>}
 {page==='review-desk'&&<ReviewDesk/>}
 {page==='audit-observatory'&&<AuditObservatory/>}
 {page==='package-bay'&&<PackageBay {...{plan,files,issues,safety,result,approvedFiles:approvedFileCount,approvedIssues:approvedIssueCount,go}}/>}
 {page==='about'&&<About go={go}/>}
 <footer><div><Brand/><span>Catch the idea. Forge the repo. Ride the build.</span></div><p>Static preview · In-memory inputs · Real planning engine · No GitHub writes</p><a href={REPO} target="_blank" rel="noreferrer">Source <ArrowUpRight size={15}/></a></footer>
 </main></div>
 {toast&&<div className="toast" role="status" aria-live="polite"><span>{toast}</span><button aria-label="Dismiss notification" onClick={()=>setToast('')}><X size={16}/></button></div>}
 </div></>;
}
