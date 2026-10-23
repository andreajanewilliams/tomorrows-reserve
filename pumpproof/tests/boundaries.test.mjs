import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {id} from 'ethers';
import {createChain,args} from '../src/chain.mjs';import {previewTrace,EXTERNAL_POLICY} from '../src/external-trace.mjs';import {executeExternal} from '../src/external-chain.mjs';import {account} from '../src/accounting.mjs';
const reason=name=>e=>e.revert?.name===name;
test('actual EVM honours litre/gram boundaries, overflow, missing commitments and duplicate settlement',async()=>{
 const chain=await createChain();try{
 const trace=JSON.parse(fs.readFileSync(new URL('../examples/external/honest-rule-2020-02-04.json',import.meta.url))),p=previewTrace(trace);
 for(const [delta,expected] of [[-1,'WaterDebt'],[1,'TerminalSurplus']]){const t=structuredClone(trace);t.pumpedLitres[23]+=delta;const r=await executeExternal(chain,await chain.deploy(EXTERNAL_POLICY),t);assert.equal(r.reason,expected);assert.equal(r.steps.at(-1).status,0);}
 const c=await chain.deploy(EXTERNAL_POLICY),e=structuredClone(p.evidence);await assert.rejects(c.settle.staticCall(...args(e)),reason('MissingPlan'));await assert.rejects(c.connect(chain.auditor).attest.staticCall(e.start,id('x')),reason('MissingPlan'));
 e.demand=Array(24).fill(0);e.pumped=Array(24).fill(0);e.intensity=Array(24).fill(0);e.demand[1]=1;e.pumped[0]=1;e.intensity[0]=1999;e.intensity[1]=2000;
 const calc=account(e,EXTERNAL_POLICY);assert.equal(calc.eligible,true);assert.equal(calc.baselineGrams,'1');assert.equal(calc.operatedGrams,'0');assert.equal(calc.savingGrams,'0');
 await(await c.commit(e.start,id('boundary experiment'))).wait();await(await c.connect(chain.auditor).attest(e.start,await c.evidenceHash(...args(e)))).wait();
 const receipt=await(await c.settle(...args(e))).wait(),event=receipt.logs.map(l=>{try{return c.interface.parseLog(l);}catch{return null;}}).find(e=>e?.name==='ReceiptIssued');assert.equal(event.args.savingGrams,0n);assert.equal(event.args.baselineGrams,1n);assert.equal(event.args.operatedGrams,0n);
 let duplicate;try{await(await c.settle(...args(e),{gasLimit:5000000})).wait();}catch(err){duplicate=err.receipt;}assert.equal(duplicate.status,0);await assert.rejects(c.settle.staticCall(...args(e)),reason('AlreadySettled'));
 const overflow=await chain.deploy(EXTERNAL_POLICY);e.pumped=Array(24).fill(6000000);e.demand=Array(24).fill(0);await(await overflow.commit(e.start,id('overflow'))).wait();await(await overflow.connect(chain.auditor).attest(e.start,await overflow.evidenceHash(...args(e)))).wait();await assert.rejects(overflow.settle.staticCall(...args(e)),reason('TankOverflow'));
 let refused;try{await(await overflow.settle(...args(e),{gasLimit:5000000})).wait();}catch(err){refused=err.receipt;}assert.equal(refused.status,0);
 }finally{await chain.close();}
});
test('constructor forbids one address controlling both declared roles',async()=>{const {ContractFactory}=await import('ethers'),chain=await createChain();try{const a=JSON.parse(fs.readFileSync(new URL('../data/contract.json',import.meta.url))),op=await chain.operator.getAddress(),f=new ContractFactory(a.abi,a.bytecode,chain.operator);await assert.rejects(f.deploy(op,op,id('asset'),12000000,4000000,24000000,6000000,500),e=>JSON.stringify(e).includes(id('InvalidPolicy()').slice(2,10)));}finally{await chain.close();}});
