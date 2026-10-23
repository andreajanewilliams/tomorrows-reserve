import fs from 'node:fs';
import {randomUUID} from 'node:crypto';
import ganache from 'ganache';
import {BrowserProvider,ContractFactory,keccak256,toUtf8Bytes,AbiCoder,id,Wallet} from 'ethers';
import {provenance} from './engine.mjs';
import {LIMITATIONS,sealBundle} from './envelope.mjs';

const artifact=JSON.parse(fs.readFileSync(new URL('../data/contract.json',import.meta.url)));
const litre=x=>Math.round(x*1000);
export function makeEvidence(sim,pumping=sim.safe.pumpingM3){
  return {start:Date.parse(`${sim.date}T00:00Z`)/1000,demand:sim.actualDemandM3.map(litre),pumped:pumping.map(litre),
    intensity:sim.actualCarbon,modelHash:`0x${sim.modelHash}`,sourceHash:`0x${sim.sourceHash}`};
}
export const args=e=>[e.start,e.demand,e.pumped,e.intensity,e.modelHash,e.sourceHash];
export const planHash=sim=>keccak256(toUtf8Bytes(JSON.stringify({date:sim.date,policy:sim.policy,
    forecastM3:sim.forecastM3,forecastCarbon:sim.forecastCarbon,planM3:sim.planM3,modelHash:sim.modelHash})));

export async function createChain(){
  const rpc=ganache.provider({logging:{quiet:true},wallet:{totalAccounts:4},chain:{chainId:31337,hardfork:'shanghai'},miner:{blockGasLimit:30000000}});
  const provider=new BrowserProvider(rpc);provider.pollingInterval=20;
  const operator=await provider.getSigner(0),auditor=await provider.getSigner(1),stranger=await provider.getSigner(2);
  const accounts=rpc.getInitialAccounts();
  const operatorEnvelope=new Wallet(accounts[(await operator.getAddress()).toLowerCase()].secretKey);
  const auditorEnvelope=new Wallet(accounts[(await auditor.getAddress()).toLowerCase()].secretKey);
  const factory=new ContractFactory(artifact.abi,artifact.bytecode,operator);
  async function deploy(policy){
    const contract=await factory.deploy(await operator.getAddress(),await auditor.getAddress(),id('PumpProof:demonstration-district'),
      litre(policy.initialM3),litre(policy.reserveM3),litre(policy.capacityM3),litre(policy.pumpMaxM3),Math.round(policy.energyWhPerM3));
    await contract.waitForDeployment();return contract;
  }
  return {rpc,provider,operator,auditor,stranger,deploy,seal:bundle=>sealBundle(bundle,operatorEnvelope,auditorEnvelope),close:()=>rpc.disconnect()};
}

export function digestOffline(bundle){
  const e=bundle.evidence,p=bundle.policy;
  return keccak256(AbiCoder.defaultAbiCoder().encode(
    ['uint256','address','bytes32','uint256','bytes32','uint256','uint256','uint256','uint256','uint256','uint256[24]','uint256[24]','uint256[24]','bytes32','bytes32'],
    [31337,bundle.contract,id('PumpProof:demonstration-district'),e.start,bundle.planHash,
     litre(p.initialM3),litre(p.reserveM3),litre(p.capacityM3),litre(p.pumpMaxM3),Math.round(p.energyWhPerM3),
     e.demand,e.pumped,e.intensity,e.modelHash,e.sourceHash]));
}

export async function issue(chain,contract,sim,{pumping,tamper=false,replay=false,attack='none'}={}){
  const evidence=makeEvidence(sim,pumping),ph=planHash(sim),steps=[];
  const commit=await (await contract.commit(evidence.start,ph)).wait();
  steps.push({step:'Plan committed',tx:commit.hash,block:commit.blockNumber});
  const digest=await contract.evidenceHash(...args(evidence));
  const attest=await(await contract.connect(chain.auditor).attest(evidence.start,digest)).wait();
  steps.push({step:'Evidence attested',tx:attest.hash,block:attest.blockNumber});
  const submitted=structuredClone(evidence);if(tamper)submitted.pumped[0]+=1000;
  let reason=null;
  try{await contract.settle.staticCall(...args(submitted));}
  catch(e){reason=e.revert?.name||e.reason||e.shortMessage||'Contract rejected';}
  let receipt;
  try{receipt=await(await contract.settle(...args(submitted),{gasLimit:5000000})).wait();}
  catch(e){receipt=e.receipt;}
  if(!receipt)throw new Error('Transaction receipt unavailable');
  steps.push({step:receipt.status===1?'Accounting verified':'Settlement reverted',tx:receipt.hash,block:receipt.blockNumber,status:receipt.status});
  if(replay&&receipt.status===1){
    try{await contract.settle.staticCall(...args(submitted));}catch(e){reason=e.revert?.name||'AlreadySettled';}
    try{await(await contract.settle(...args(submitted),{gasLimit:5000000})).wait();}catch(e){receipt=e.receipt;}
    steps.push({step:'Duplicate receipt reverted',tx:receipt.hash,block:receipt.blockNumber,status:receipt.status});
  }
  const result={accepted:receipt.status===1,reason,steps,contract:await contract.getAddress(),chainId:31337,
    evidenceDigest:digest,planHash:ph,policy:sim.policy,evidence:submitted,compiler:artifact.compiler,
    limitations:LIMITATIONS,id:randomUUID(),attack,
    schema:'pumpproof-evidence-v2',simulation:sim,provenance};
  if(receipt.status===1){
    const event=receipt.logs.map(l=>{try{return contract.interface.parseLog(l);}catch{return null;}}).find(e=>e?.name==='ReceiptIssued');
    result.accounting={baselineGrams:Number(event.args.baselineGrams),operatedGrams:Number(event.args.operatedGrams),savingGrams:Number(event.args.savingGrams)};
  }
  return chain.seal(result);
}
