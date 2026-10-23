import test from 'node:test';
import assert from 'node:assert/strict';
import {id} from 'ethers';
import {createChain,makeEvidence,args,issue,digestOffline,planHash} from '../src/chain.mjs';
import {simulate,availableDays} from '../src/engine.mjs';

const reason=name=>e=>{assert.equal(e.revert?.name,name);return true;};
test('contract state machine enforces source integrity, roles and accounting',async t=>{
 const chain=await createChain();const sim=simulate();
 try{
  await t.test('valid evidence executes and matches the independent arithmetic',async()=>{
   const c=await chain.deploy(sim.policy),r=await issue(chain,c,sim);
   assert.ok(r.accepted);assert.equal(digestOffline(r),r.evidenceDigest);
   assert.ok(Math.abs(r.accounting.savingGrams-sim.safe.savingKg*1000)<1.1);
   assert.equal((await c.windows(r.evidence.start)).settled,true);
  });
  await t.test('one asset/day cannot settle or commit twice',async()=>{
   const c=await chain.deploy(sim.policy),r=await issue(chain,c,sim);
   await assert.rejects(c.settle.staticCall(...args(r.evidence)),reason('AlreadySettled'));
   await assert.rejects(c.commit.staticCall(r.evidence.start,id('renamed claim')),reason('AlreadyCommitted'));
  });
  await t.test('overlapping non-aligned operating windows are forbidden',async()=>{
   const c=await chain.deploy(sim.policy);
   await assert.rejects(c.commit.staticCall(makeEvidence(sim).start+3600,id('overlap')),reason('InvalidWindow'));
  });
  await t.test('only designated operator and auditor can make transitions',async()=>{
   const c=await chain.deploy(sim.policy),e=makeEvidence(sim);
   await assert.rejects(c.connect(chain.stranger).commit.staticCall(e.start,planHash(sim)),reason('Unauthorised'));
   await(await c.commit(e.start,planHash(sim))).wait();
   await assert.rejects(c.attest.staticCall(e.start,id('forged')),reason('Unauthorised'));
   await assert.rejects(c.connect(chain.stranger).settle.staticCall(...args(e)),reason('Unauthorised'));
  });
  await t.test('unattested evidence cannot settle and attestations cannot be replaced',async()=>{
   const c=await chain.deploy(sim.policy),e=makeEvidence(sim);await(await c.commit(e.start,planHash(sim))).wait();
   await assert.rejects(c.settle.staticCall(...args(e)),reason('EvidenceMismatch'));
   await(await c.connect(chain.auditor).attest(e.start,await c.evidenceHash(...args(e)))).wait();
   await assert.rejects(c.connect(chain.auditor).attest.staticCall(e.start,id('replacement')),reason('AlreadyAttested'));
  });
  await t.test('changed evidence causes an actual status-0 transaction',async()=>{
   const r=await issue(chain,await chain.deploy(sim.policy),sim,{tamper:true});
   assert.equal(r.accepted,false);assert.equal(r.reason,'EvidenceMismatch');assert.equal(r.steps.at(-1).status,0);
   assert.notEqual(digestOffline(r),r.evidenceDigest);
  });
  await t.test('terminal water debt is independently rejected',async()=>{
   const pump=[...sim.safe.pumpingM3];pump[23]-=1000;
   const r=await issue(chain,await chain.deploy(sim.policy),sim,{pumping:pump});assert.equal(r.reason,'WaterDebt');
  });
  await t.test('emptying the reserve is rejected',async()=>{
   const pump=sim.safe.pumpingM3.map((p,h)=>h<12?0:p);
   const r=await issue(chain,await chain.deploy(sim.policy),sim,{pumping:pump});assert.equal(r.reason,'ReserveBreach');
  });
  await t.test('no improvement cannot earn a carbon receipt',async()=>{
   const r=await issue(chain,await chain.deploy(sim.policy),sim,{pumping:sim.actualDemandM3});assert.equal(r.reason,'NoCarbonBenefit');
  });
  await t.test('terminal overfilling is rejected, keeping the comparison like-for-like',async()=>{
   const pump=[...sim.safe.pumpingM3];pump[23]+=100;
   const r=await issue(chain,await chain.deploy(sim.policy),sim,{pumping:pump});assert.equal(r.reason,'TerminalSurplus');
  });
  await t.test('pump capacity cannot be bypassed by otherwise signed data',async()=>{
   const pump=[...sim.safe.pumpingM3];pump[0]=sim.policy.pumpMaxM3+1;
   const r=await issue(chain,await chain.deploy(sim.policy),sim,{pumping:pump});assert.equal(r.reason,'PumpLimit');
  });
  await t.test('evidence hash is bound to the specific contract',async()=>{
   const c1=await chain.deploy(sim.policy),c2=await chain.deploy(sim.policy),e=makeEvidence(sim);
   await(await c1.commit(e.start,planHash(sim))).wait();await(await c2.commit(e.start,planHash(sim))).wait();
   assert.notEqual(await c1.evidenceHash(...args(e)),await c2.evidenceHash(...args(e)));
  });
  await t.test('all development and replication days agree between JavaScript and actual EVM execution',async()=>{
   const c=await chain.deploy(sim.policy);
   for(const day of availableDays){
     const s=simulate({date:day.date});const r=await issue(chain,c,s);
     assert.equal(r.accepted,s.safe.eligible,day.date);
   }
  });
 }finally{await chain.close();}
});
