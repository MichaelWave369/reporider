import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import {
  PACKAGE_SCHEMA,PACKAGE_MAX_BYTES,PACKAGE_META_DIR,
  safeStarterPath,packageSha256,canExportPackage,createPackageHandoff,
} from '../src/packageHandoff.js';

function fixture() {
  const files=[
    {path:'README.md',content:'# Hello\n'},
    {path:'src/main.js',content:"console.log('hello');\n"},
  ];
  const issues=[{title:'Smoke test',body:'Test the starter',labels:['testing']}];
  const currentFingerprints={
    approvedFiles:'files-test',
    approvedIssues:'issues-test',
    rideArtifact:'ride-test',
  };
  const plan={name:'starter-demo',visibility:'private',stack:'react-vite'};
  const safety={status:'pass',blockerCount:0,warningCount:0,policyVersion:'policy-test'};
  const result={
    mode:'mock',
    repositoryUrl:'https://github.com/reporider-demo/starter-demo',
    createdFiles:files.map(x=>x.path),
    openedIssues:issues.map(x=>x.title),
    summary:{
      approvedFileCount:2,approvedIssueCount:1,
      approvedFilesFingerprint:'files-test',
      approvedIssuesFingerprint:'issues-test',
      rideArtifactFingerprint:'ride-test',
      receiptChainHash:'receipt-test',
      safetyPolicyVersion:'policy-test',safetyStatus:'pass',safetyBlockerCount:0,
    },
  };
  return {plan,files,issues,safety,result,approvedFileCount:2,approvedIssueCount:1,currentFingerprints};
}
test('the package bay refuses unapproved, blocked, stale and non-mock drafts',()=>{
  const f=fixture();
  assert.equal(canExportPackage(f),true);
  assert.equal(canExportPackage({...f,result:null}),false);
  assert.equal(canExportPackage({...f,result:{...f.result,mode:'live'}}),false);
  assert.equal(canExportPackage({...f,approvedFileCount:1}),false);
  assert.equal(canExportPackage({...f,approvedIssueCount:0}),false);
  assert.equal(canExportPackage({...f,safety:{...f.safety,blockerCount:1}}),false);
  assert.equal(canExportPackage({...f,currentFingerprints:{...f.currentFingerprints,rideArtifact:'stale'}}),false);
  assert.equal(canExportPackage({...f,result:{...f.result,createdFiles:['other','src/main.js']}}),false);
  assert.equal(canExportPackage({...f,files:[...f.files,{path:'third.txt',content:'new'}]}),false);
  assert.equal(canExportPackage({...f,result:{...f.result,repositoryUrl:'https://github.com/real/actual'}}),false);
});
test('package ZIP keeps approved source files at root and metadata in reserved directory',async()=>{
  const output=await createPackageHandoff(fixture());
  assert.equal(output.filename,'starter-demo-reporider-starter.zip');
  assert.equal(output.state,'PREPARED_LOCAL_ONLY');
  assert.equal(output.fileCount,2);
  assert.equal(output.issueCount,1);
  assert.equal(output.sha256.length,64);
  const zip=await JSZip.loadAsync(output.blob);
  assert.equal(await zip.file('README.md').async('string'),'# Hello\n');
  assert.equal(await zip.file('src/main.js').async('string'),"console.log('hello');\n");
  const manifest=JSON.parse(await zip.file(PACKAGE_META_DIR+'/manifest.json').async('string'));
  assert.equal(manifest.schema,PACKAGE_SCHEMA);
  assert.equal(manifest.state,'LOCAL_EXPORT_ONLY');
  assert.equal(manifest.fileCount,2);
  assert.equal(manifest.files.length,2);
  assert.equal(manifest.files[0].sha256.length,64);
  assert.equal(manifest.boundaries.some(x=>x.includes('No repository or issue was created')),true);
  const issues=JSON.parse(await zip.file(PACKAGE_META_DIR+'/issue-drafts.json').async('string'));
  assert.equal(issues.state,'NOT_CREATED_ON_GITHUB');
  assert.equal(issues.issues[0].title,'Smoke test');
  const receipt=JSON.parse(await zip.file(PACKAGE_META_DIR+'/mock-ride-receipt.json').async('string'));
  assert.equal(receipt.authoritative,false);
  assert.equal(receipt.mode,'mock');
  const original=await output.blob.arrayBuffer();
  assert.equal(output.sha256,await packageSha256(new Uint8Array(original)));
});
test('an edited approved file produces a new local archive checksum',async()=>{
  const first=await createPackageHandoff(fixture());
  const changed=fixture();
  changed.files[0].content='# Changed\n';
  const second=await createPackageHandoff(changed);
  assert.notEqual(first.sha256,second.sha256);
});
test('ZIP exporter never auto-fixes traversal, Windows-device or metadata collision paths',async()=>{
  const invalid=['../secret.txt','/etc/private','C:/Windows/file.txt','a\\b','src//app.js','src/./index.js','CON','file.txt:stream','a/file?.js',PACKAGE_META_DIR+'/receipt.json'];
  for(const p of invalid)assert.throws(()=>safeStarterPath(p),{name:'Error'},p);
  const fixtureOne=fixture();fixtureOne.files[0].path='../secret.txt';fixtureOne.result.createdFiles[0]='../secret.txt';
  await assert.rejects(createPackageHandoff(fixtureOne),/Unsafe|Traversal/);
});
test('filename and directory collisions fail before archive export',async()=>{
  const f=fixture();
  f.files[1].path='README.md';
  f.result.createdFiles[1]='README.md';
  await assert.rejects(createPackageHandoff(f),/Duplicate archive file path/);
  const z=fixture();
  z.files[1].path='README.md/subfile';
  z.result.createdFiles[1]='README.md/subfile';
  await assert.rejects(createPackageHandoff(z),/conflicts with a directory/);
});
test('SHA-256 refuses local package bytes exceeding explicit cap',async()=>{
  await assert.rejects(packageSha256(new Uint8Array(PACKAGE_MAX_BYTES+1)),/8 MiB/);
});
