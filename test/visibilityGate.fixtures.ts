import {canProceedWithVisibility,visibilityEducation} from '../src/lib/visibilityGate';

function eq(actual:unknown,expected:unknown,label:string){
 if(actual!==expected)throw Error(label+': expected '+String(expected)+', got '+String(actual));
}
eq(canProceedWithVisibility('private',false),true,'private does not need extra confirmation');
eq(canProceedWithVisibility('private',true),true,'private remains allowed');
eq(canProceedWithVisibility('public',false),false,'public refused without distinct confirmation');
eq(canProceedWithVisibility('public',true),true,'public requires explicit true');
eq(canProceedWithVisibility('public',undefined as unknown as boolean),false,'undefined must fail closed');
eq(canProceedWithVisibility('public',1 as unknown as boolean),false,'truthy numeric not a confirmation');
if(!visibilityEducation.public.includes('anyone'))throw Error('public visibility warning missing');
if(!visibilityEducation.private.includes('granted access'))throw Error('private explanation missing');
console.log('Issue #23 PASS: private-first default, public confirmation, denial of unconfirmed and nonboolean values');
