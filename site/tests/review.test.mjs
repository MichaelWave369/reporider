import test from 'node:test';import assert from 'node:assert/strict';import {canCompleteMock,approvalCount,resetReviewState,isMockOnlyResult} from '../src/review.js';
test('unapproved draft cannot simulate a completed ride',()=>{assert.equal(canCompleteMock(3,2,2,2,0,true),false);assert.equal(canCompleteMock(3,2,3,1,0,true),false);});
test('warnings do not silently waive blocker gate',()=>{assert.equal(canCompleteMock(3,2,3,2,1,true),false);assert.equal(canCompleteMock(3,2,3,2,0,false),false);assert.equal(canCompleteMock(3,2,3,2,0,true),true);});
test('all current content fingerprints must match',()=>{const items=[{id:'a',data:'one'},{id:'b',data:'changed'}];assert.equal(approvalCount(items,{a:'one',b:'old'},x=>x.id,x=>x.data),1);});
test('new idea resets approval state',()=>{assert.deepEqual(resetReviewState(),{planKey:'',values:{}});});
test('a fake live-result claim cannot pass the mock-only guard',()=>{assert.equal(isMockOnlyResult({mode:'live',repositoryUrl:'https://github.com/me/project'}),false);assert.equal(isMockOnlyResult({mode:'mock',repositoryUrl:'https://github.com/reporider-demo/my-app'}),true);});
