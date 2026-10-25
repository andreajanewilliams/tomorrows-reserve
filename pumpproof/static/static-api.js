// Public static demo. Answers the page's /api requests from runs recorded on a real local EVM,
// and runs the whole-day accounting for uploaded plans in the browser with the project's own code.
import {account} from './accounting.mjs';

const realFetch=window.fetch.bind(window),base=new URL('./',location.href);
const load=path=>realFetch(new URL(path,base)).then(r=>{if(!r.ok)throw new Error('Missing recorded data: '+path);return r.json();});
const cache=new Map(),data=path=>{if(!cache.has(path))cache.set(path,load(path));return cache.get(path);};
const LOCAL='Run the project locally (npm ci, npm start) for live contract checks.';
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

async function preview(body){
  const trace=body?.trace,policy={initialM3:12000,reserveM3:4000,capacityM3:24000,pumpMaxM3:6000,energyWhPerM3:500};
  if(!trace||typeof trace!=='object'||Array.isArray(trace))throw new Error('Invalid external trace');
  if(trace.schema!=='pumpproof-external-trace-v1')throw new Error('Unsupported external trace schema');
  const days=await data('api/days.json'),day=days[trace.date];
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
    const proofs=await data('api/external/proofs.json'),previews=await data('api/external/previews.json');
    const ai=proofs['ai-plan'],run=body?.experiment==='uploaded-trace'&&ai&&same(ai.preview.descriptor.trace,body.trace)?ai:proofs[body?.experiment];
    if(!run||!same(run.preview.descriptor.trace,body.trace))throw new Error('This public demo replays the recorded contract runs (the two rule plans and the AI plan). '+LOCAL);
    return {...run,scope:'Recorded from a real run on a local EVM. '+run.scope};
  }
  if(path==='simulate'){
    const hit=(await data('api/replay.json')).simulate[`${body.date}|${body.shockPercent}|${body.reserveM3}`];
    if(!hit)throw new Error('The public demo includes recorded replays with no demand shock. '+LOCAL);
    return hit;
  }
  if(path==='prove'){
    const replay=await data('api/replay.json'),key=body.shockPercent===undefined?`attack|${body.attack}`:`${body.date}|${body.shockPercent}|${body.reserveM3}|${body.attack}`,hit=replay.prove[key];
    if(!hit)throw new Error('This contract run was not recorded for the public demo. '+LOCAL);
    if(hit.error)throw new Error(hit.error);
    return hit;
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
