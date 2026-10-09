import {
 MAX_REPO_NAME_LENGTH,suggestedRepositoryName,validateRepositoryName,
 inspectKnownRepositoryNames,getRepositoryNamePrewriteGate
} from '../src/lib/repoNaming';
import {buildRepoPlan} from '../src/lib/repoPlanner';
import {scanRepoPlan} from '../src/lib/safetyScan';
import {createMockGitHubRepository} from '../src/lib/github/mockGitHubClient';
import {runAgentRail,REQUEST_SCHEMA} from '../src/agent/rail';
function equal(actual:unknown,expected:unknown,label:string){
 if(actual!==expected)throw new Error(label+': expected '+String(expected)+', got '+String(actual));
}
function checks(){
 equal(MAX_REPO_NAME_LENGTH,96,'bound');
 for(const raw of ['','RepoRider','a b','foo_bar','foo--bar','-foo','foo-','/etc',
  '../secret','.github','a'.repeat(97),'con','COM1','null','github','new']){
  equal(validateRepositoryName(raw).valid,false,'must reject '+raw);
 }
 for(const raw of ['a','a-b','my-repo2','0','2fa-auth','a'.repeat(96)]){
  equal(validateRepositoryName(raw).valid,true,'must accept '+raw);
 }
 equal(suggestedRepositoryName('Café & Robots: GO!'),'cafe-robots-go','Unicode and punctuation');
 equal(suggestedRepositoryName('!@#$'), 'new-idea-repo','punctuation only');
 equal(suggestedRepositoryName('github'),'github-starter','reserved generated');
 equal(suggestedRepositoryName('A'.repeat(140)),'a'.repeat(96),'generated hard limit');
 equal(suggestedRepositoryName('a'.repeat(95)+'---z'),'a'.repeat(95),'do not end with truncated hyphen');
 const planned=buildRepoPlan('Build a private React Vite shopping list');
 equal(validateRepositoryName(planned.name).valid,true,'generated valid');
 for(const name of ['Bad Name','null','foo_unsafe','camelCase','a'.repeat(110),'']){
  const manual=buildRepoPlan('Build a private React Vite journal',{name});
  equal(manual.name,name,'manual input preserved exactly '+name);
  const safety=scanRepoPlan(manual);
  equal(safety.status,'blocked','invalid manual slug is a blocker '+name);
  if(!safety.findings.some(f=>f.id==='unsafe-repo-name'&&f.severity==='blocker'))
   throw Error('missing named blocker '+name);
 }
 equal(buildRepoPlan('Build a private journal',{name:'nice-project'}).name,'nice-project','valid manual');
 equal(inspectKnownRepositoryNames('nice-project'), 'UNKNOWN','no inventory is unverified');
 equal(inspectKnownRepositoryNames('nice-project',['NICE-PROJECT']), 'POTENTIAL_CONFLICT','case insensitive conflict');
 equal(inspectKnownRepositoryNames('nice-project',['other']), 'NOT_IN_SUPPLIED_LIST','partial inventory cannot prove availability');
 equal(inspectKnownRepositoryNames('Bad Name',['Bad Name']),'INVALID_NAME','invalid wins over conflicts');
 const gate=getRepositoryNamePrewriteGate('nice-project');
 equal(gate.may_create_repository,false,'prewrite never authorizes');
 equal(gate.name_collision_unverified,true,'no live collision verification');
 equal(gate.required_next_gate,'AUTHENTICATED_OWNER_SCOPED_EXISTENCE_CHECK','mandatory future gate');
 const rejected=runAgentRail({schema:REQUEST_SCHEMA,action:'plan',idea:'Build a private React Vite tracker',overrides:{name:'Foo_Bar'}});
 equal(rejected.disposition,'BLOCKED','agent cannot bypass name gate');
 equal(rejected.error_code,'INVALID_REPO_NAME','agent error code');
 const accepted=runAgentRail({schema:REQUEST_SCHEMA,action:'plan',idea:'Build a private React Vite tracker',overrides:{name:'foo-bar'}});
 equal(accepted.disposition,'REVIEW_REQUIRED','agent canonical name');
}
async function run(){
 checks();
 const plan=buildRepoPlan('Build a private React Vite notebook',{name:'INVALID_REPO'});
 const fakeScan=scanRepoPlan({...plan,name:'valid-name'});
 try{await createMockGitHubRepository({plan,safetyReport:fakeScan,approvedByUser:true});throw Error('should have blocked invalid name');}
 catch(e){if(!(e instanceof Error)||!e.message.includes('Invalid repository name'))throw e;}
 console.log('Issue #22 PASS: canonical generator/validation, manual name preservation, reserved/length, agent and mock gates, collision UNKNOWN without authenticated lookup');
}
run().catch(e=>{console.error(e);process.exitCode=1;});
