/**
 * RR Package Bay v0.1
 * A deliberately local, non-authoritative artifact export.
 * Never executes starter files, calls GitHub, reads tokens or uploads anything.
 */
import JSZip from 'jszip';

export const PACKAGE_SCHEMA='reporider.phitar-handoff.v1';
export const PACKAGE_MAX_BYTES=8*1024*1024;
export const PACKAGE_MAX_FILES=100;
export const PACKAGE_META_DIR='__reporider_handoff__';
const encoder=new TextEncoder();
const safeFile = path => {
  if(typeof path!=='string'||path.length>240||!path.trim()||
    path.includes('\\')||path.startsWith('/')||/^[a-zA-Z]:/.test(path)||
    /[\x00-\x1f\x7f:*?"<>|]/.test(path))throw new Error('Unsafe archive path.');
  const parts=path.split('/');
  if(parts.some(p=>!p||p==='.'||p==='..'||p.endsWith('.')||p.endsWith(' ')||
    /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i.test(p)))
    throw new Error('Traversal or unsupported archive filename.');
  if(parts[0].toLowerCase()===PACKAGE_META_DIR.toLowerCase())
    throw new Error('Starter files cannot overwrite handoff metadata.');
  return parts.join('/');
};
export {safeFile as safeStarterPath};

function hashHex(value) {
  if(!globalThis.crypto?.subtle?.digest)
    throw new Error('SHA-256 requires HTTPS or another secure browser context.');
  return globalThis.crypto.subtle.digest('SHA-256',value).then(bytes =>
    Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join(''));
}
export async function packageSha256(bytes) {
  const value=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);
  if(value.byteLength>PACKAGE_MAX_BYTES)throw new Error('Package exceeds the 8 MiB cap.');
  return hashHex(value);
}
/**
 * This gate must be evaluated against the CURRENT drafts and approvals.
 * The precomputed fingerprint values are supplied by RepoRider's existing
 * planner/receipt library, not taken from a handoff file.
 */
export function canExportPackage({plan,files,issues,result,safety,approvedFileCount,approvedIssueCount,currentFingerprints}={}){
  if(!plan||!Array.isArray(files)||!Array.isArray(issues)||!safety||!result||
    result.mode!=='mock'||!result.repositoryUrl?.startsWith('https://github.com/reporider-demo/'))
    return false;
  if(!files.length||files.length>PACKAGE_MAX_FILES||safety.blockerCount!==0||
    approvedFileCount!==files.length||approvedIssueCount!==issues.length) return false;
  if(result.summary?.approvedFileCount!==files.length||
    result.summary?.approvedIssueCount!==issues.length||
    result.summary?.safetyPolicyVersion!==safety.policyVersion||
    result.summary?.safetyStatus!==safety.status||
    result.summary?.safetyBlockerCount!==safety.blockerCount) return false;
  if(!Array.isArray(result.createdFiles)||!Array.isArray(result.openedIssues)||
    result.createdFiles.length!==files.length||result.openedIssues.length!==issues.length||
    files.some((f,i)=>f.path!==result.createdFiles[i])||
    issues.some((f,i)=>f.title!==result.openedIssues[i])) return false;
  if(!currentFingerprints||typeof currentFingerprints!=='object') return false;
  return currentFingerprints.approvedFiles===result.summary.approvedFilesFingerprint&&
    currentFingerprints.approvedIssues===result.summary.approvedIssuesFingerprint&&
    currentFingerprints.rideArtifact===result.summary.rideArtifactFingerprint;
}

/**
 * Creates a standard ZIP that PhiTar can inspect and Drop Zone can import.
 * Metadata lives in its own reserved directory; source files remain at root.
 */
export async function createPackageHandoff(context){
  if(!canExportPackage(context))
    throw new Error('Complete the current mock ride and approve every current file and issue before exporting.');
  const {plan,files,issues,result,safety}=context;
  const seen=new Set(),entries=[];
  let total=0;
  for(const file of files){
    const path=safeFile(file.path);
    const key=path.toLowerCase();
    if(seen.has(key))throw new Error('Duplicate archive file path.');
    seen.add(key);
    if(typeof file.content!=='string')throw new Error('Starter artifact must be reviewed text.');
    const data=encoder.encode(file.content);
    total+=data.length;
    if(total>PACKAGE_MAX_BYTES-1024*1024)throw new Error('Starter files exceed the local package size limit.');
    entries.push({path,data,sizeBytes:data.length,sha256:await hashHex(data)});
  }
  for(const a of entries){
    const prefix=a.path.toLowerCase().split('/');
    for(let i=1;i<prefix.length;i++)
      if(seen.has(prefix.slice(0,i).join('/')))
        throw new Error('A starter file conflicts with a directory path.');
  }
  const zip=new JSZip();
  for(const item of entries)zip.file(item.path,item.data,{createFolders:true,date:new Date('2000-01-01T00:00:00.000Z')});
  const issuesJson={
    schema:'reporider.issue-drafts.v1',
    state:'NOT_CREATED_ON_GITHUB',
    issues:issues.map(({title,body,labels})=>({title,body,labels})),
  };
  const manifest={
    schema:PACKAGE_SCHEMA,
    state:'LOCAL_EXPORT_ONLY',
    source:'RepoRider mock ride',
    repoName:plan.name,
    visibilityPlan:plan.visibility,
    stack:plan.stack,
    fileCount:entries.length,
    issueCount:issues.length,
    safety:{status:safety.status,blockerCount:safety.blockerCount,warningCount:safety.warningCount,policyVersion:safety.policyVersion},
    fingerprints:{
      approvedFiles:result.summary.approvedFilesFingerprint,
      approvedIssues:result.summary.approvedIssuesFingerprint,
      rideArtifact:result.summary.rideArtifactFingerprint,
      receiptChain:result.summary.receiptChainHash,
    },
    files:entries.map(({path,sizeBytes,sha256})=>({path,sizeBytes,sha256})),
    boundaries:[
      'Local export of reviewed mock starter files. No repository or issue was created on GitHub.',
      'The archive contains source text and unexecuted issue drafts, not compiled programs.',
      'Approvals and fingerprints are historical, informational records, not authority to publish, execute or deploy.',
      'SHA-256 verifies file bytes, not code safety, sender identity or legitimacy.',
      'Review every extracted file and build configuration independently before running or publishing.',
    ],
  };
  const metadata=[
    [PACKAGE_META_DIR+'/manifest.json',manifest],
    [PACKAGE_META_DIR+'/issue-drafts.json',issuesJson],
    [PACKAGE_META_DIR+'/mock-ride-receipt.json',{
      schema:'reporider.mock-receipt-link.v1',
      mode:'mock',
      fictionalRepositoryUrl:result.repositoryUrl,
      receiptChainHash:result.summary.receiptChainHash,
      authoritative:false,
      note:'This is a mock result. It grants no GitHub or build authority.',
    }],
  ];
  for(const [path,value] of metadata){
    const data=encoder.encode(JSON.stringify(value,null,2)+'\n');
    total+=data.length;
    if(total>PACKAGE_MAX_BYTES)throw new Error('Package metadata exceeds the 8 MiB limit.');
    zip.file(path,data,{createFolders:true,date:new Date('2000-01-01T00:00:00.000Z')});
  }
  const bytes=await zip.generateAsync({type:'uint8array',compression:'DEFLATE',compressionOptions:{level:6}});
  if(bytes.length>PACKAGE_MAX_BYTES)throw new Error('Compressed ZIP exceeds the 8 MiB local export limit.');
  const digest=await hashHex(bytes);
  return {
    filename:plan.name+'-reporider-starter.zip',
    blob:new Blob([bytes],{type:'application/zip'}),
    sha256:digest,
    bytes:bytes.length,
    fileCount:entries.length,
    issueCount:issues.length,
    state:'PREPARED_LOCAL_ONLY',
  };
}
