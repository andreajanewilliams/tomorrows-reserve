import fs from 'node:fs';import {createHash} from 'node:crypto';
import {keccak256,toUtf8Bytes,getBytes,verifyMessage,getAddress} from 'ethers';
import {canonical} from './envelope.mjs';
export const EXTERNAL_LIMITATIONS=[
 'Supplied pumping is a simulated operating trace, not evidence that a physical pump ran.',
 'Measured German demand is paired by hour index with estimated average GB grid intensity.',
 'Hypothetical tank/pump and constant 0.5 kWh/m³; no hydraulic service or physical safety claim.',
 'Generated policies use idealised within-hour demand feedback. External traces are never repaired.',
 'Attributed operational CO2 is not causal avoided emissions; no utility pilot or measured field saving.',
 'Operator and auditor are local demo roles controlled on one machine; attested input truth remains trusted.',
 'Duplicate protection is limited to this isolated experiment contract, not a shared global registry.',
 'Commitment follows the historical replay date; timely day-ahead commitment is not enforced.',
 'Signatures establish integrity under declared keys, not real-world identity or original chain history.',
 'Local ephemeral EVM; no public deployment, money, tokens or carbon credits.'
];
function readVersions(){return Object.fromEntries(['contracts/PumpProof.sol','data/contract.json','src/accounting.mjs','src/rules.mjs','src/external-trace.mjs','src/external-chain.mjs','src/external-envelope.mjs'].map(file=>[file,createHash('sha256').update(fs.readFileSync(new URL('../'+file,import.meta.url))).digest('hex')]));}
const loadedVersions=readVersions();
export function externalVersions(){if(canonical(readVersions())!==canonical(loadedVersions))throw new Error('Executable snapshot changed; restart before issuing or verifying evidence');return structuredClone(loadedVersions);}
export function externalEnvelopeDigest(bundle){const {signatures,...payload}=bundle;return keccak256(toUtf8Bytes('PumpProof evidence envelope v3\n'+canonical(payload)));}
export async function sealExternal(bundle,operator,auditor){bundle.signers={operator:operator.address,auditor:auditor.address};const digest=externalEnvelopeDigest(bundle);bundle.signatures={operator:await operator.signMessage(getBytes(digest)),auditor:await auditor.signMessage(getBytes(digest))};return bundle;}
export function verifyExternalEnvelope(bundle){
 if(!bundle.signers||!bundle.signatures||Object.keys(bundle.signers).sort().join(',')!=='auditor,operator'||Object.keys(bundle.signatures).sort().join(',')!=='auditor,operator')throw new Error('Invalid signature metadata');
 let op,audit;try{op=getAddress(bundle.signers.operator);audit=getAddress(bundle.signers.auditor);}catch{throw new Error('Invalid signer address');}
 if(op===audit)throw new Error('Distinct external signers required');
 const digest=externalEnvelopeDigest(bundle);
 for(const role of ['operator','auditor']){let recovered;try{recovered=verifyMessage(getBytes(digest),bundle.signatures[role]);}catch{throw new Error('External signature invalid');}if(recovered!==getAddress(bundle.signers[role]))throw new Error('External signature mismatch: '+role);}
}
