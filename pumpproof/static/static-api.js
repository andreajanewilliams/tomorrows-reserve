// Public static demo. Answers the page's /api requests from runs recorded on a real local EVM,
// and runs the whole-day accounting for uploaded plans in the browser with the project's own code.
import {account} from './accounting.mjs';

document.documentElement.dataset.demo='recorded';
const realFetch=window.fetch.bind(window),base=new URL('./',location.href);
const load=path=>realFetch(new URL(path,base)).then(r=>{if(!r.ok)throw new Error('Missing recorded data: '+path);return r.json();});
const cache=new Map(),data=path=>{if(!cache.has(path))cache.set(path,load(path));return cache.get(path);};
const LOCAL='Run the project locally (npm ci, npm start) for live contract checks.';
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
// Mirror the local server's strict key checks so the static demo accepts nothing the server would reject.
const exactKeys=(value,keys,label)=>{if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).sort().join(',')!==[...keys].sort().join(','))throw new Error(`Invalid ${label}`);};
const EXPERIMENTS=['honest-rule','skips-evening-refill','uploaded-trace'];
// Recorded results carry an unsigned `recorded` flag; signed fields are returned unchanged.
const recorded=run=>({...run,recorded:true});

async function preview(body){
  exactKeys(body,['trace','experiment'],'external preview request');
  if(!EXPERIMENTS.includes(body.experiment))throw new Error('Unknown external experiment');
  const trace=body.trace,policy={initialM3:12000,reserveM3:4000,capacityM3:24000,pumpMaxM3:6000,energyWhPerM3:500};
  exactKeys(trace,['schema','date','pumpedLitres'],'external trace');
  if(trace.schema!=='pumpproof-external-trace-v1')throw new Error('Unsupported external trace schema');
  const days=await data('api/days.json'),day=typeof trace.date==='string'&&Object.hasOwn(days,trace.date)?days[trace.date]:null;
  if(!day)throw new Error('Date must be one of the source-complete days in February 2020');
  if(!Array.isArray(trace.pumpedLitres)||trace.pumpedLitres.length!==24||!trace.pumpedLitres.every(v=>Number.isSafeInteger(v)&&v>=0))throw new Error('pumpedLitres must be 24 non-negative whole numbers of litres');
  const recorded=(await data('api/external/previews.json'))[body.experiment];
  if(body.experiment!=='uploaded-trace'){
    if(!recorded||!same(recorded.descriptor.trace,trace))throw new Error('Named experiment trace differs from pinned rule; use uploaded-trace for edited inputs');
    return recorded;
  }
  const ai=(await data('api/external/proofs.json'))['ai-plan'];
  if(ai&&same(ai.preview.descriptor.trace,trace))return ai.preview;
  const evidence={demand:day.demand,pumped:[...trace.pumpedLitres],intensity:day.intensity};
  return {schema:'pumpproof-external-preview-v1',inputDigest:'computed by the local server only',descriptor:{experiment:'uploaded-trace',trace,policy},evidence,accounting:account(evidence,policy),formatValid:true,receiptIssued:false,execution:'calculated in your browser; no transaction has run'};
}

async function route(path,body){
  if(['meta','comparison','external/examples','hydraulics','testnet'].includes(path))return data(`api/${path}.json`);
  if(path==='external/preview')return preview(body);
  if(path==='external/prove'){
    exactKeys(body,['trace','inputDigest','experiment'],'external request');
    if(!EXPERIMENTS.includes(body.experiment))throw new Error('Unknown external experiment');
    const proofs=await data('api/external/proofs.json');
    const ai=proofs['ai-plan'],run=body?.experiment==='uploaded-trace'&&ai&&same(ai.preview.descriptor.trace,body.trace)?ai:proofs[body?.experiment];
    if(!run||!same(run.preview.descriptor.trace,body.trace))throw new Error('This public demo replays the recorded contract runs (the two rule plans and the AI plan). '+LOCAL);
    if(body.inputDigest!==run.inputDigest)throw new Error('Preview input digest mismatch');
    return recorded(run);
  }
  if(path==='simulate'){
    exactKeys(body,['date','shockPercent','reserveM3'],'simulation request');
    if(typeof body.date!=='string'||!Number.isFinite(body.shockPercent)||!Number.isFinite(body.reserveM3))throw new Error('Invalid simulation request');
    const all=(await data('api/replay.json')).simulate,k=`${body.date}|${body.shockPercent}|${body.reserveM3}`,hit=Object.hasOwn(all,k)?all[k]:null;
    if(!hit)throw new Error('The public demo includes recorded replays with no demand shock. '+LOCAL);
    return hit;
  }
  if(path==='prove'){
    if(typeof body?.attack!=='string'||!['none','naive','debt','reserve','tamper','duplicate'].includes(body.attack))throw new Error('Unknown experiment');
    const replay=await data('api/replay.json'),attackOnly=body&&Object.keys(body).sort().join(',')==='attack,date';
    if(attackOnly){if(body.date!==replay.attackDate)throw new Error('This contract run was not recorded for the public demo. '+LOCAL);}
    else{exactKeys(body,['date','shockPercent','reserveM3','attack'],'proof request');if(typeof body.date!=='string'||!Number.isFinite(body.shockPercent)||!Number.isFinite(body.reserveM3))throw new Error('Invalid proof request');}
    const key=attackOnly?`attack|${body.attack}`:`${body.date}|${body.shockPercent}|${body.reserveM3}|${body.attack}`,hit=Object.hasOwn(replay.prove,key)?replay.prove[key]:null;
    if(!hit)throw new Error('This contract run was not recorded for the public demo. '+LOCAL);
    if(hit.error)throw new Error(hit.error);
    return recorded(hit);
  }
  throw new Error('Not available in the public demo. '+LOCAL);
}

window.fetch=async(input,init={})=>{
  const url=new URL(typeof input==='string'?input:input.url,location.href),at=url.pathname.indexOf('/api/');
  if(url.origin!==location.origin||at<0)return realFetch(input,init);
  try{const result=await route(url.pathname.slice(at+5),init.body?JSON.parse(init.body):null);return new Response(JSON.stringify(result),{status:200,headers:{'Content-Type':'application/json'}});}
  catch(e){return new Response(JSON.stringify({error:e.message}),{status:400,headers:{'Content-Type':'application/json'}});}
};

// Evidence downloads point at the recorded bundle files.
new MutationObserver(()=>{for(const a of document.querySelectorAll('a[href^="/api/export/"]'))a.setAttribute('href',`api/export/${a.getAttribute('href').slice(12)}.json`);}).observe(document.documentElement,{childList:true,subtree:true});
