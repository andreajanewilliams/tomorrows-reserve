import test from 'node:test';
import assert from 'node:assert/strict';
import {previewTrace,parseTrace,externalDays,EXTERNAL_POLICY,NO_MODEL} from '../src/external-trace.mjs';
import {createChain,args,digestOffline} from '../src/chain.mjs';
import {executeExternal} from '../src/external-chain.mjs';
const trace=()=>({schema:'pumpproof-external-trace-v1',date:externalDays[0].date,pumpedLitres:externalDays[0].demandM3.map(v=>Math.round(v*1000))});
test('external input rejects unknown fields, dates, units and malformed integer arrays',()=>{
 for(const mutate of [t=>{t.extra=true;},t=>{delete t.date;},t=>{t.schema='other';},t=>{t.date='2020-02-01';},t=>{t.pumpedLitres.pop();},...['1',1.1,-1,NaN,Infinity,Number.MAX_SAFE_INTEGER+1].map(v=>t=>{t.pumpedLitres[0]=v;})]){const t=trace();mutate(t);assert.throws(()=>parseTrace(t));}
});
test('preview retains exact integers, every violation, immutable caller input and no model claim',()=>{
 const t=trace();t.pumpedLitres[0]=Number.MAX_SAFE_INTEGER;const before=structuredClone(t),p=previewTrace(t);assert.deepEqual(t,before);assert.deepEqual(p.evidence.pumped,t.pumpedLitres);assert.equal(p.evidence.modelHash,NO_MODEL);assert.equal(p.descriptor.modelUsed,false);assert.equal(p.receiptIssued,false);assert.ok(p.accounting.violations.some(v=>v.code==='PUMP_LIMIT'));assert.ok(p.accounting.violations.some(v=>v.code==='TANK_OVERFLOW'));
 const changed=trace();changed.pumpedLitres[0]++;assert.notEqual(previewTrace(changed).inputDigest,previewTrace(trace()).inputDigest);
});
test('exact imported evidence is committed and actual changed-after-attestation transaction refuses',async()=>{
 const chain=await createChain();try{const t=trace(),p=previewTrace(t),c=await chain.deploy(EXTERNAL_POLICY);const r=await executeExternal(chain,c,t);assert.deepEqual(r.evidence.pumped,t.pumpedLitres);assert.equal(r.planHash,p.inputDigest);assert.equal(r.evidenceDigest,digestOffline(r));assert.equal((await c.windows(p.evidence.start)).plan,p.inputDigest);assert.equal(r.reason,'NoCarbonBenefit');assert.equal(r.steps.at(-1).status,0);
 const changed=await executeExternal(chain,await chain.deploy(EXTERNAL_POLICY),t,{tamper:true});assert.equal(changed.reason,'EvidenceMismatch');assert.equal(changed.steps.at(-1).status,0);
 await assert.rejects(c.commit.staticCall(p.evidence.start,p.inputDigest),e=>e.revert?.name==='AlreadyCommitted');
 }finally{await chain.close();}
});
test('honest acceptance and WaterDebt refusal execute exact calldata in separate labelled contracts',async()=>{
 const fs=await import('node:fs'),chain=await createChain();try{const results=[];
 for(const experiment of ['honest-rule','skips-evening-refill']){const t=JSON.parse(fs.readFileSync(new URL(`../examples/external/${experiment}-2020-02-04.json`,import.meta.url))),c=await chain.deploy(EXTERNAL_POLICY),r=await executeExternal(chain,c,t,{experiment});results.push(r);const tx=await chain.provider.getTransaction(r.steps.at(-1).tx),decoded=c.interface.parseTransaction({data:tx.data});assert.deepEqual([...decoded.args[2]].map(Number),t.pumpedLitres);assert.equal(r.steps.at(-1).status,experiment==='honest-rule'?1:0);assert.equal(r.accepted,experiment==='honest-rule');if(!r.accepted)assert.equal(r.reason,'WaterDebt');}
 assert.notEqual(results[0].contract,results[1].contract);
 }finally{await chain.close();}
});
