import {isAddress,id} from 'ethers';
import {canonical} from '../src/envelope.mjs';
import {verifyExternalEnvelope,externalVersions,EXTERNAL_LIMITATIONS} from '../src/external-envelope.mjs';
import {previewTrace,strictKeys} from '../src/external-trace.mjs';
import {createChain,digestOffline} from '../src/chain.mjs';
import {executeExternal,EXPERIMENTS} from '../src/external-chain.mjs';
import {inputs} from '../src/inputs.mjs';
const equal=(a,b,message)=>{if(canonical(a)!==canonical(b))throw new Error(message);};
export async function verifyExternal(bundle,{expect='accepted'}={}){
 strictKeys(bundle,['schema','id','inputDigest','preview','planHash','policy','evidence','attestedEvidence','evidenceDigest','chainId','contract','experiment','scope','accepted','receiptIssued','reason','steps','eventAccounting','exportSupported','provenance','limitations','versions','signers','signatures'],'v3 bundle');
 if(bundle.schema!=='pumpproof-evidence-v3'||bundle.chainId!==31337||!isAddress(bundle.contract)||!EXPERIMENTS.includes(bundle.experiment)||typeof bundle.id!=='string'||bundle.id.length>100)throw new Error('Unsupported external bundle identity');
 verifyExternalEnvelope(bundle);
 if(!['accepted','rejected'].includes(expect)||bundle.accepted!==(expect==='accepted')||bundle.receiptIssued!==bundle.accepted||bundle.exportSupported!==true)throw new Error('Unexpected accounting outcome');
 equal(bundle.versions,externalVersions(),'Code/contract version differs from local snapshot');
 equal(bundle.provenance,inputs.provenance,'Provenance differs from pinned sources');
 equal(bundle.limitations,EXTERNAL_LIMITATIONS,'External limitations changed');
 const preview=previewTrace(bundle.preview?.descriptor?.trace,{experiment:bundle.experiment});
 equal(bundle.preview,preview,'Preview claims differ from direct exact-trace accounting');
 equal(bundle.policy,preview.descriptor.policy,'Unsupported policy');
 equal(bundle.evidence,preview.evidence,'Submitted trace/evidence differs from pinned external trace');
 equal(bundle.attestedEvidence,preview.evidence,'Attested evidence differs from external trace');
 if(bundle.inputDigest!==preview.inputDigest||bundle.planHash!==preview.inputDigest||bundle.evidenceDigest!==digestOffline(bundle))throw new Error('External commitment/digest mismatch');
 const expectedNames=['Exact trace committed','Evidence attested',bundle.accepted?'Accounting accepted':'Settlement refused'];
 if(!Array.isArray(bundle.steps)||bundle.steps.length!==3)throw new Error('Invalid transaction steps');
 for(const [i,s] of bundle.steps.entries()){strictKeys(s,['step','tx','block','status'],'transaction');if(s.step!==expectedNames[i]||!/^0x[0-9a-f]{64}$/i.test(s.tx)||!Number.isSafeInteger(s.block)||s.block<1||s.status!==(i===2&&!bundle.accepted?0:1)||(i>0&&s.block<=bundle.steps[i-1].block))throw new Error('Invalid transaction claims');}
 if(new Set(bundle.steps.map(s=>s.tx)).size!==3)throw new Error('Repeated transaction hash');
 const chain=await createChain();try{
  const replay=await executeExternal(chain,await chain.deploy(bundle.policy),preview.descriptor.trace,{experiment:bundle.experiment});
  equal(bundle.scope,replay.scope,'Experiment scope changed');
  equal(bundle.eventAccounting,replay.eventAccounting,'Event accounting differs from fresh EVM');
  if(replay.accepted!==bundle.accepted||replay.reason!==bundle.reason)throw new Error('Fresh EVM outcome differs');
  return {evidenceValid:true,accountingAccepted:replay.accepted,receiptIssued:replay.accepted,reason:replay.reason,inputDigest:preview.inputDigest,freshEvmTransaction:replay.steps.at(-1).tx,freshEvmStatus:replay.steps.at(-1).status,optimiserUsed:false,meaning:'Exact supplied trace, pinned sources, signed claims and fresh local EVM outcome reproduced. Original chain history and physical measurements are not authenticated.'};
 }finally{await chain.close();}
}
