// Run the two labelled experiments on a public testnet with separate operator and auditor wallets.
// Uses the same contract and commit → attest → settle code as the local demo, and records public
// transaction links in data/testnet-runs.json. Needs RPC_URL, OPERATOR_KEY and AUDITOR_KEY (see .env.example).
import fs from 'node:fs';
import {JsonRpcProvider,Wallet,NonceManager,ContractFactory,id} from 'ethers';
import {executeExternal} from '../src/external-chain.mjs';
import {EXTERNAL_POLICY} from '../src/external-trace.mjs';

const {RPC_URL,OPERATOR_KEY,AUDITOR_KEY}=process.env,EXPLORER=(process.env.EXPLORER||'https://sepolia.etherscan.io').replace(/\/$/,'');
if(!['https://sepolia.etherscan.io','https://eth-sepolia.blockscout.com'].includes(EXPLORER))throw new Error('EXPLORER must be https://sepolia.etherscan.io or https://eth-sepolia.blockscout.com');
if(!RPC_URL||!OPERATOR_KEY||!AUDITOR_KEY)throw new Error('Set RPC_URL, OPERATOR_KEY and AUDITOR_KEY (test wallets only), for example in .env');
const provider=new JsonRpcProvider(RPC_URL),network=await provider.getNetwork();
if(network.chainId!==11155111n)throw new Error(`Sepolia only (chain 11155111); this RPC is chain ${network.chainId}`);
const operatorWallet=new Wallet(OPERATOR_KEY,provider),auditorWallet=new Wallet(AUDITOR_KEY,provider);
if(operatorWallet.address===auditorWallet.address)throw new Error('Operator and auditor must be different wallets');
const operator=new NonceManager(operatorWallet),auditor=new NonceManager(auditorWallet);
const artifact=JSON.parse(fs.readFileSync(new URL('../data/contract.json',import.meta.url))),litre=x=>Math.round(x*1000);
const factory=new ContractFactory(artifact.abi,artifact.bytecode,operator);
async function deploy(policy){
  const contract=await factory.deploy(operatorWallet.address,auditorWallet.address,id('PumpProof:demonstration-district'),
    litre(policy.initialM3),litre(policy.reserveM3),litre(policy.capacityM3),litre(policy.pumpMaxM3),Math.round(policy.energyWhPerM3));
  await contract.waitForDeployment();return contract;
}
// Public runs are recorded as transaction links, not re-signed bundles: the signed v3 format describes the local EVM.
const chain={provider,operator,auditor,deploy,sealExternal:bundle=>bundle};

const runs=[];
for(const experiment of ['skips-evening-refill','honest-rule']){
  const trace=JSON.parse(fs.readFileSync(new URL(`../examples/external/${experiment}-2020-02-04.json`,import.meta.url)));
  const contract=await deploy(EXTERNAL_POLICY),address=await contract.getAddress();
  const result=await executeExternal(chain,contract,trace,{experiment});
  runs.push({experiment,date:trace.date,accepted:result.accepted,reason:result.reason,contract:address,contractUrl:`${EXPLORER}/address/${address}`,inputDigest:result.inputDigest,
    steps:result.steps.map(s=>({step:s.step,status:s.status,block:s.block,tx:s.tx,url:`${EXPLORER}/tx/${s.tx}`}))});
  console.log(experiment,result.accepted?'accepted':`refused (${result.reason})`,`${EXPLORER}/address/${address}`);
}
const record={schema:'pumpproof-testnet-runs-v1',network:network.name,chainId:Number(network.chainId),explorer:EXPLORER,operator:operatorWallet.address,auditor:auditorWallet.address,
  recordedAt:new Date().toISOString(),note:'Same contract and policy as the local demo, with separate operator and auditor wallets. Inputs remain attested claims; a public chain does not make them true.',runs};
fs.writeFileSync(new URL('../data/testnet-runs.json',import.meta.url),JSON.stringify(record,null,2)+'\n');
console.log('Wrote data/testnet-runs.json');
