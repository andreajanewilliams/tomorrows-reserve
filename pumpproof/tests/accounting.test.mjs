import test from 'node:test';import assert from 'node:assert/strict';import {account} from '../src/accounting.mjs';import {EXTERNAL_POLICY} from '../src/external-trace.mjs';
test('integer accounting preserves gram floor distinction and positive subgram benefits',()=>{
 const d=Array(24).fill(0),p=[...d],i=Array(24).fill(1);d[0]=2001;p[1]=2001;i[0]=2;
 const a=account({demand:d,pumped:p,intensity:i},EXTERNAL_POLICY);assert.equal(a.baselineGrams,'2');assert.equal(a.operatedGrams,'1');assert.equal(a.savingGrams,'1');
 d[0]=1999;p[1]=1999;const b=account({demand:d,pumped:p,intensity:i},EXTERNAL_POLICY);assert.equal(b.baselineGrams,'1');assert.equal(b.operatedGrams,'0');assert.equal(b.savingGrams,'0');assert.equal(b.positiveCarbonDifference,true);assert.equal(b.eligible,true);
 const negative=account({demand:p,pumped:d,intensity:i},EXTERNAL_POLICY);assert.equal(negative.savingGrams,'0');assert.equal(negative.positiveCarbonDifference,false);
});
