import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createChain,args,digestOffline,planHash,makeEvidence} from '../src/chain.mjs';
import {simulate} from '../src/engine.mjs';
import {canonical,verifyEnvelope,LIMITATIONS} from '../src/envelope.mjs';
export async function verifyBundle(bundle){
 if(bundle.schema!=='pumpproof-evidence-v2'||bundle.chainId!==31337||bundle.accepted!==true)throw new Error('Expected an accepted local PumpProof v2 receipt');
 for(const name of ['demand','pumped','intensity']){
   const a=bundle.evidence?.[name];
   if(!Array.isArray(a)||a.length!==24||!a.every(v=>Number.isSafeInteger(v)&&v>=0))throw new Error('Invalid hourly '+name);
 }
 if(digestOffline(bundle)!==bundle.evidenceDigest)throw new Error('Evidence digest mismatch');
 if('0x'+createHash('sha256').update(JSON.stringify(bundle.provenance,null,2)).digest('hex')!==bundle.evidence.sourceHash)throw new Error('Provenance manifest changed');
 const reference=simulate({date:bundle.simulation.date,shockPercent:bundle.simulation.shockPercent,
   reserveM3:bundle.policy.reserveM3,capacityM3:bundle.policy.capacityM3});
 if(!reference.feasible||JSON.stringify(reference.policy)!==JSON.stringify(bundle.policy))throw new Error('Unsupported or changed policy');
 if(planHash(reference)!==bundle.planHash)throw new Error('Plan does not reproduce from the pinned model and source data');
 if(JSON.stringify(makeEvidence(reference))!==JSON.stringify(bundle.evidence))throw new Error('Measurements or operations do not reproduce from the declared replay');
 if(canonical(bundle.simulation)!==canonical(reference))throw new Error('Simulation claims differ from the reproduced replay');
 if(bundle.limitations!==LIMITATIONS)throw new Error('Evidence limitations were changed');
 verifyEnvelope(bundle);
 const chain=await createChain();
 try{
   const c=await chain.deploy(bundle.policy),e=bundle.evidence;
   await(await c.commit(e.start,bundle.planHash)).wait();
   await(await c.connect(chain.auditor).attest(e.start,await c.evidenceHash(...args(e)))).wait();
   const tx=await(await c.settle(...args(e))).wait();
   const event=tx.logs.map(l=>{try{return c.interface.parseLog(l);}catch{return null;}}).find(e=>e?.name==='ReceiptIssued');
   const accounting={baselineGrams:Number(event.args.baselineGrams),operatedGrams:Number(event.args.operatedGrams),savingGrams:Number(event.args.savingGrams)};
   if(JSON.stringify(accounting)!==JSON.stringify(bundle.accounting))throw new Error('Claimed accounting differs from fresh EVM execution');
   return {valid:true,accounting,originalDigestMatches:true,envelopeSignaturesMatch:true,freshEvmTransaction:tx.hash,
     meaning:'Pinned replay reproduced, complete envelope signed by its declared demo addresses, and accounting accepted by a fresh local EVM. This does not authenticate real-world signer identities, a physical meter or original chain history.'};
 }finally{await chain.close();}
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 try{if(!process.argv[2])throw new Error('Usage: npm run verify -- path/to/evidence.json');
 console.log(JSON.stringify(await verifyBundle(JSON.parse(fs.readFileSync(process.argv[2],'utf8'))),null,2));}
 catch(e){console.error('Verification failed: '+e.message);process.exitCode=1;}
}
