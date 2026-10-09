import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {MAX_REPO_NAME_LENGTH,validateRepositoryName,
 inspectKnownRepositoryNames,getRepositoryNamePrewriteGate} from '../../src/lib/repoNaming.ts';
const source=(ref)=>readFileSync(fileURLToPath(new URL(ref,import.meta.url)),'utf8');
test('Issue #22: exactly one shared 96-character lower-case slug policy',()=>{
 assert.equal(MAX_REPO_NAME_LENGTH,96);
 for(const slug of ['repo1','my-app','a'.repeat(96)])assert.equal(validateRepositoryName(slug).valid,true);
 for(const slug of ['MyApp','my_repo','foo.bar','x y','foo--bar','con','null','a'.repeat(97)])
  assert.equal(validateRepositoryName(slug).valid,false,slug);
});
test('Issue #22: collision status is unverified unless a matching name was supplied',()=>{
 assert.equal(inspectKnownRepositoryNames('demo'),'UNKNOWN');
 assert.equal(inspectKnownRepositoryNames('demo',['DEMO']),'POTENTIAL_CONFLICT');
 assert.equal(inspectKnownRepositoryNames('demo',['another']),'NOT_IN_SUPPLIED_LIST');
 const gate=getRepositoryNamePrewriteGate('demo');
 assert.equal(gate.may_create_repository,false);
 assert.equal(gate.name_collision_unverified,true);
});
test('Issue #22: web name field displays actionable text and never hides invalid input',()=>{
 const app=source('../src/App.jsx');
 assert.match(app,/validateRepositoryName\(plan\.name\)/);
 assert.match(app,/aria-invalid={!nameStatus.valid}/);
 assert.match(app,/repo-name-guidance/);
 assert.match(app,/getRepositoryNamePrewriteGate\(plan\.name\)/);
 assert.match(app,/UNVERIFIED/);
 assert.match(app,/maxLength={MAX_REPO_NAME_LENGTH}/);
});
test('Issue #22: mobile name field and shared writer use name validation',()=>{
 const native=source('../../src/components/RepoPlanControls.tsx');
 const mock=source('../../src/lib/github/mockGitHubClient.ts');
 assert.match(native,/validateRepositoryName\(repoNameValue\)/);
 assert.match(native,/Name blocked:/);
 assert.match(native,/GitHub collision check:/);
 assert.match(mock,/validateRepositoryName\(plan\.name\)/);
 assert.match(mock,/Unexpected name authority escalation/);
});
