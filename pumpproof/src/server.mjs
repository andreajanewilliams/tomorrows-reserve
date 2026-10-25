import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {simulate,benchmark,availableDays,DEFAULT_POLICY} from './engine.mjs';
import {modelReport} from './model.mjs';
import {createChain,issue,digestOffline} from './chain.mjs';
import {previewTrace,strictKeys,EXTERNAL_POLICY} from './external-trace.mjs';
import {executeExternal,EXPERIMENTS} from './external-chain.mjs';
import {loadHydraulics} from './hydraulics.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const port=Number(process.env.PORT||4317);
const hydraulics=loadHydraulics();
const chain=await createChain();
const contracts=new Map(),receipts=new Map(),byDay=new Map(),externalExperiments=new Map();
let queue=Promise.resolve();
const enqueue=fn=>{const next=queue.then(fn);queue=next.catch(()=>{});return next;};
const evaluation=benchmark();
const replication=benchmark('replication');
const send=(res,status,body,type='application/json')=>{res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(type==='application/json'?JSON.stringify(body):body);};
async function body(req){
  if(!req.headers['content-type']?.startsWith('application/json'))throw new Error('JSON content type required');
  let data='';for await(const chunk of req){data+=chunk;if(data.length>50000)throw new Error('Request too large');}
  return JSON.parse(data||'{}');
}
const server=http.createServer(async(req,res)=>{
 try{
  if(![`127.0.0.1:${port}`,`localhost:${port}`].includes(req.headers.host))return send(res,403,{error:'Local host required'});
  if(req.headers.origin&&!['http://127.0.0.1:'+port,'http://localhost:'+port].includes(req.headers.origin))return send(res,403,{error:'Same-origin requests only'});
  const url=new URL(req.url,`http://127.0.0.1:${port}`);
  if(req.method==='GET'&&url.pathname==='/api/meta')return send(res,200,{days:availableDays.map(d=>d.date),model:modelReport,benchmark:evaluation,replication,policy:DEFAULT_POLICY,chainId:31337});
  if(req.method==='GET'&&url.pathname==='/api/hydraulics')return send(res,200,hydraulics);
  if(req.method==='GET'&&url.pathname==='/api/hydraulics/export'){
    res.setHeader('Content-Disposition','attachment; filename="pumpproof-hydraulic-results.json"');
    return send(res,200,hydraulics.results);
  }
  if(req.method==='GET'&&url.pathname==='/api/comparison')return send(res,200,JSON.parse(fs.readFileSync(path.join(root,'data/comparison-evaluation.json'))));
  if(req.method==='GET'&&url.pathname==='/api/external/examples'){
    return send(res,200,['honest-rule','skips-evening-refill'].map(experiment=>({experiment,trace:JSON.parse(fs.readFileSync(path.join(root,'examples/external',experiment+'-2020-02-04.json')))})));
  }
  if(req.method==='POST'&&url.pathname==='/api/external/preview'){
    const request=await body(req);strictKeys(request,['trace','experiment'],'external preview request');
    return send(res,200,previewTrace(request.trace,{experiment:request.experiment}));
  }
  if(req.method==='POST'&&url.pathname==='/api/external/prove'){
    const request=await body(req);strictKeys(request,['trace','inputDigest','experiment'],'external request');
    if(!EXPERIMENTS.includes(request.experiment))throw new Error('Unknown external experiment');
    const preview=previewTrace(request.trace,{experiment:request.experiment}),key=request.experiment+':'+preview.descriptor.trace.date;
    if(request.inputDigest!==preview.inputDigest)throw new Error('Preview input digest mismatch');
    const result=await enqueue(async()=>{
      const previous=externalExperiments.get(key);
      if(previous){if(previous.inputDigest!==preview.inputDigest)throw new Error('This experiment/day already binds different inputs. Changed traces cannot replace its commitment.');return {...previous,reused:true};}
      const contract=await chain.deploy(EXTERNAL_POLICY);
      const proof=await executeExternal(chain,contract,request.trace,{experiment:request.experiment});
      externalExperiments.set(key,proof);receipts.set(proof.id,proof);return proof;
    });return send(res,200,result);
  }
  if(req.method==='POST'&&url.pathname==='/api/simulate')return send(res,200,simulate(await body(req)));
  if(req.method==='POST'&&url.pathname==='/api/prove'){
    const input=await body(req),sim=simulate(input);
    if(!sim.feasible)throw new Error(sim.message);
    const attack=input.attack||'none';
    if(!['none','naive','debt','reserve','tamper','duplicate'].includes(attack))throw new Error('Unknown experiment');
    const result=await enqueue(async()=>{
      if(attack==='none'&&byDay.has(sim.date)){
        const previous=byDay.get(sim.date);
        if(JSON.stringify(previous.simulation)!==JSON.stringify(sim))throw new Error('This asset and day already have a receipt for different inputs. Select another day; changed inputs cannot create a second claim.');
        return {...previous,reused:true};
      }
      const key=createHash('sha256').update(JSON.stringify(sim.policy)).digest('hex');
      let contract;
      if(attack==='none'&&sim.safe.eligible){
        if(!contracts.has(key))contracts.set(key,await chain.deploy(sim.policy));
        contract=contracts.get(key);
      }else contract=await chain.deploy(sim.policy);
      let pumping;
      if(attack==='naive')pumping=sim.naive.pumpingM3;
      if(attack==='debt'){
        pumping=[...sim.safe.pumpingM3];
        let remaining=1000;
        for(let i=23;i>=0&&remaining>0;i--){const take=Math.min(pumping[i],remaining);pumping[i]-=take;remaining-=take;}
      }
      if(attack==='reserve')pumping=sim.safe.pumpingM3.map((p,h)=>h<12?0:p);
      const proof=await issue(chain,contract,sim,{pumping,tamper:attack==='tamper',replay:attack==='duplicate',attack});
      receipts.set(proof.id,proof);
      if(attack==='none'&&proof.accepted)byDay.set(sim.date,proof);
      return proof;
    });
    return send(res,200,result);
  }
  if(req.method==='GET'&&url.pathname.startsWith('/api/export/')){
    const proof=receipts.get(url.pathname.split('/').at(-1));
    if(!proof)return send(res,404,{error:'Receipt not found in this local session'});
    res.setHeader('Content-Disposition',`attachment; filename="pumpproof-${proof.schema==='pumpproof-evidence-v3'?proof.preview.descriptor.trace.date+'-'+proof.experiment:proof.simulation.date+'-'+proof.attack}.json"`);
    return send(res,200,proof);
  }
  if(req.method==='GET'&&url.pathname==='/api/health')return send(res,200,{ok:true,localOnly:true});
  if(req.method!=='GET')return send(res,405,{error:'Method not allowed'});
  const files={'/':'index.html','/app.js':'app.js','/external.js':'external.js','/hydraulics.js':'hydraulics.js','/style.css':'style.css','/favicon.svg':'favicon.svg'};
  if(!files[url.pathname])return send(res,404,{error:'Not found'});
  const file=files[url.pathname],type=file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.svg')?'image/svg+xml':'text/html';
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
  return send(res,200,fs.readFileSync(path.join(root,'public',file)),type);
 }catch(e){send(res,400,{error:e.shortMessage||e.message||'Request failed'});}
});
server.listen(port,'127.0.0.1',()=>console.log(`Tomorrow’s Reserve local demo: http://127.0.0.1:${port}`));
async function shutdown(){server.close();await chain.close();process.exit(0);}
process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
