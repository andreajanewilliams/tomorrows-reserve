import {keccak256,toUtf8Bytes,verifyMessage,getBytes} from 'ethers';

export const LIMITATIONS='Local EVM simulation. Auditor and operator are demo roles on one machine. No live meter, money or carbon credit. Envelope signatures establish integrity under the declared demo addresses, not their real-world identity or original chain history.';
export function canonical(value){
  if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
  if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+canonical(value[key])).join(',')+'}';
  return JSON.stringify(value);
}
export function envelopeDigest(bundle){
  const {signatures,...payload}=bundle;
  return keccak256(toUtf8Bytes('PumpProof evidence envelope v2\n'+canonical(payload)));
}
export async function sealBundle(bundle,operator,auditor){
  bundle.signers={operator:operator.address,auditor:auditor.address};
  const digest=envelopeDigest(bundle);
  bundle.signatures={operator:await operator.signMessage(getBytes(digest)),auditor:await auditor.signMessage(getBytes(digest))};
  return bundle;
}
export function verifyEnvelope(bundle){
  if(!bundle.signers||!bundle.signatures||bundle.signers.operator===bundle.signers.auditor)throw new Error('Distinct envelope signers required');
  if(Object.keys(bundle.signatures).sort().join(',')!=='auditor,operator')throw new Error('Unexpected unsigned envelope fields');
  const digest=envelopeDigest(bundle);
  for(const role of ['operator','auditor']){
    let recovered;
    try{recovered=verifyMessage(getBytes(digest),bundle.signatures[role]);}catch{throw new Error('Envelope signature invalid: '+role);}
    if(recovered!==bundle.signers[role])throw new Error('Envelope signature mismatch: '+role);
  }
}
