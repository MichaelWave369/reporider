import {buildRepoPlan} from '../src/lib/repoPlanner';
import {scanRepoPlan} from '../src/lib/safetyScan';
import {createMockGitHubRepository} from '../src/lib/github/mockGitHubClient';

async function mustReject(run:()=>Promise<unknown>,expected:string){
 let rejected=false;
 try{await run();}catch(error){
  rejected=true;
  if(!(error instanceof Error)||!error.message.includes(expected))
   throw Error('Expected '+expected+', got '+String(error));
 }
 if(!rejected)throw Error('Mock public visibility guard was bypassed');
}
async function run(){
 const privatePlan=buildRepoPlan('Build a private React Vite personal notes app');
 const publicPlan=buildRepoPlan('Build a public React Vite documentation website');
 if(privatePlan.visibility!=='private'||publicPlan.visibility!=='public')
  throw Error('Planner fixture did not infer expected visibility');
 const privateSafety=scanRepoPlan(privatePlan);
 const publicSafety=scanRepoPlan(publicPlan);
 const make=(plan:typeof privatePlan,safetyReport:typeof privateSafety,publicVisibilityConfirmed?:boolean)=>
  createMockGitHubRepository({plan,safetyReport,approvedByUser:true,publicVisibilityConfirmed});
 const privateResult=await make(privatePlan,privateSafety);
 if(privateResult.mode!=='mock')throw Error('Private fixture not mock');
 await mustReject(()=>make(publicPlan,publicSafety),'separate explicit acknowledgement');
 await mustReject(()=>make(publicPlan,publicSafety,false),'separate explicit acknowledgement');
 const publicResult=await make(publicPlan,publicSafety,true);
 if(publicResult.mode!=='mock'||publicResult.repositoryUrl.indexOf('reporider-demo')===-1)
  throw Error('Confirming public visibility did not produce mock-only receipt');
 await mustReject(()=>createMockGitHubRepository({plan:publicPlan,safetyReport:publicSafety,
   approvedByUser:false,publicVisibilityConfirmed:true}),'Every starter file');
 console.log('Issue #23 PASS: public mock writer denies missing confirmation, private default preserved, separate human review still required');
}
run().catch(e=>{console.error(e);process.exitCode=1;});
