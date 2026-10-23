import {randomUUID} from 'node:crypto';
import {args} from './chain.mjs';
import {EXTERNAL_LIMITATIONS,externalVersions} from './external-envelope.mjs';
import {inputs} from './inputs.mjs';
import {previewTrace} from './external-trace.mjs';
export const EXPERIMENTS=['honest-rule','skips-evening-refill','uploaded-trace'];
export async function executeExternal(chain,contract,trace,{experiment='uploaded-trace',tamper=false}={}){
 if(!EXPERIMENTS.includes(experiment))throw new Error('Unknown external experiment');
 const preview=previewTrace(trace),evidence=structuredClone(preview.evidence),steps=[];
 const commit=await(await contract.commit(evidence.start,preview.inputDigest)).wait();
 steps.push({step:'Exact trace committed',tx:commit.hash,block:commit.blockNumber,status:commit.status});
 const digest=await contract.evidenceHash(...args(evidence));
 const attestation=await(await contract.connect(chain.auditor).attest(evidence.start,digest)).wait();
 steps.push({step:'Evidence attested',tx:attestation.hash,block:attestation.blockNumber,status:attestation.status});
 const submitted=structuredClone(evidence);if(tamper)submitted.pumped[0]+=1;
 let reason=null;try{await contract.settle.staticCall(...args(submitted));}catch(e){reason=e.revert?.name||e.reason||e.shortMessage;}
 let receipt;try{receipt=await(await contract.settle(...args(submitted),{gasLimit:5000000})).wait();}catch(e){receipt=e.receipt;}
 if(!receipt)throw new Error('Settlement receipt unavailable');
 steps.push({step:receipt.status===1?'Accounting accepted':'Settlement refused',tx:receipt.hash,block:receipt.blockNumber,status:receipt.status});
 let eventAccounting=null;
 if(receipt.status===1){const event=receipt.logs.map(l=>{try{return contract.interface.parseLog(l);}catch{return null;}}).find(e=>e?.name==='ReceiptIssued');if(!event)throw new Error('Receipt event unavailable');eventAccounting=Object.fromEntries(['baselineGrams','operatedGrams','savingGrams'].map(k=>[k,String(event.args[k])]));}
 return chain.sealExternal({schema:'pumpproof-evidence-v3',id:randomUUID(),inputDigest:preview.inputDigest,preview,planHash:preview.inputDigest,policy:preview.descriptor.policy,evidence:submitted,attestedEvidence:evidence,evidenceDigest:digest,
  chainId:31337,contract:await contract.getAddress(),experiment,scope:'Isolated labelled local experiment contract; duplicate protection is within this contract only.',accepted:receipt.status===1,receiptIssued:receipt.status===1,reason,steps,eventAccounting,exportSupported:true,provenance:inputs.provenance,limitations:EXTERNAL_LIMITATIONS,versions:externalVersions()});
}
