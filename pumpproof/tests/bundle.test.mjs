import test from 'node:test';
import assert from 'node:assert/strict';
import {createChain,issue} from '../src/chain.mjs';
import {simulate} from '../src/engine.mjs';
import {verifyBundle} from '../scripts/verify-bundle.mjs';
test('export can be independently recomputed and altered receipts are rejected',async()=>{
 const chain=await createChain();let bundle;
 try{const s=simulate();bundle=await issue(chain,await chain.deploy(s.policy),s);}finally{await chain.close();}
 assert.equal((await verifyBundle(bundle)).valid,true);
 const changed=structuredClone(bundle);changed.evidence.pumped[0]+=1;
 await assert.rejects(verifyBundle(changed),/digest mismatch/);
 const claim=structuredClone(bundle);claim.accounting.savingGrams+=100000;
 await assert.rejects(verifyBundle(claim),/Envelope signature mismatch/);
 const source=structuredClone(bundle);source.simulation.date='2020-02-06';
 await assert.rejects(verifyBundle(source),/Plan does not reproduce/);
 const provenance=structuredClone(bundle);provenance.provenance.sources[0].creator='changed';
 await assert.rejects(verifyBundle(provenance),/Provenance manifest changed/);
 for(const mutate of [
   b=>{b.simulation.context='Measured field savings';},
   b=>{b.simulation.safe.savingKg=999999;},
   b=>{b.limitations='None.';},
   b=>{b.steps[0].tx='0x'+'a'.repeat(64);},
   b=>{b.compiler='a different compiler';},
   b=>{b.extraClaim='Verified physical measurements';}
 ]){
   const changed=structuredClone(bundle);mutate(changed);
   await assert.rejects(verifyBundle(changed),/claims differ|limitations were changed|Envelope signature mismatch/);
 }
 const unsigned=structuredClone(bundle);unsigned.signatures.claim='Unverified extra assertion';
 await assert.rejects(verifyBundle(unsigned),/Unexpected unsigned envelope fields/);
});
