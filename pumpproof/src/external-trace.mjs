import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {id,keccak256,toUtf8Bytes} from 'ethers';
import {inputs} from './inputs.mjs';
import {canonical} from './envelope.mjs';
import {account} from './accounting.mjs';
export const EXTERNAL_POLICY=Object.freeze({initialM3:12000,reserveM3:4000,capacityM3:24000,pumpMaxM3:6000,energyWhPerM3:500});
export const NO_MODEL=id('PumpProof:external-trace:no-model:v1');
const carbon=new Map(['2020-01','2020-02','2020-02-validation'].flatMap(m=>inputs.sources[`carbon-${m}.json`].data).filter(r=>Number.isFinite(r.intensity.actual)).map(r=>[r.from,r.intensity.actual]));
export function carbonDay(date){
 const result=[];for(let h=0;h<24;h++){const prefix=`${date}T${String(h).padStart(2,'0')}`,a=carbon.get(prefix+':00Z'),b=carbon.get(prefix+':30Z');if(!Number.isFinite(a)||!Number.isFinite(b))return null;result.push(Math.round((a+b)/2));}return result;
}
export const previousDay=date=>new Date(Date.parse(date+'T00:00Z')-86400000).toISOString().slice(0,10);
export const externalDays=inputs.sources['demand-days.json'].filter(d=>carbonDay(d.date)&&carbonDay(previousDay(d.date)));
export function strictKeys(value,keys,label){if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).sort().join(',')!==[...keys].sort().join(','))throw new Error(`Invalid ${label} fields`);}
export function parseTrace(value){
 strictKeys(value,['schema','date','pumpedLitres'],'external trace');
 if(value.schema!=='pumpproof-external-trace-v1')throw new Error('Unsupported external trace schema');
 if(typeof value.date!=='string'||!externalDays.some(d=>d.date===value.date))throw new Error('Unsupported source-complete replay date');
 if(!Array.isArray(value.pumpedLitres)||value.pumpedLitres.length!==24||!value.pumpedLitres.every(v=>Number.isSafeInteger(v)&&v>=0))throw new Error('Expected exactly 24 non-negative safe integer litres');
 return {schema:value.schema,date:value.date,pumpedLitres:[...value.pumpedLitres]};
}
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
export const contractSha256=sha(fs.readFileSync(new URL('../contracts/PumpProof.sol',import.meta.url)));
export function previewTrace(value){
 const trace=parseTrace(value),day=externalDays.find(d=>d.date===trace.date),policy={...EXTERNAL_POLICY};
 const descriptor={schema:'pumpproof-external-descriptor-v1',mode:'external',modelUsed:false,trace,policy,sourceHash:inputs.sourceHash,sourceIdentities:inputs.provenance.sources,baseline:'demand-following-v1',contractSha256,units:'litres',hourSlots:'24 UTC hours'};
 const inputDigest=keccak256(toUtf8Bytes('PumpProof external descriptor v1\n'+canonical(descriptor)));
 const evidence={start:Date.parse(trace.date+'T00:00Z')/1000,demand:day.demandM3.map(v=>Math.round(v*1000)),pumped:[...trace.pumpedLitres],intensity:carbonDay(trace.date),modelHash:NO_MODEL,sourceHash:'0x'+inputs.sourceHash};
 return {schema:'pumpproof-external-preview-v1',inputDigest,descriptor,evidence,accounting:account(evidence,policy),formatValid:true,receiptIssued:false,execution:'calculated preview; no transaction has run'};
}
