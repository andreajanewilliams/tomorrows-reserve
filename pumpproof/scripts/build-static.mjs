// Build the public static demo in site/. Records real responses from a freshly started local
// server (start it with `npm start` first) so every contract result shown is a genuine run.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {externalDays,carbonDay} from '../src/external-trace.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'site'),origin=process.env.ORIGIN||'http://127.0.0.1:4317';
const get=async p=>{const r=await fetch(origin+p);if(!r.ok)throw new Error(`${p}: HTTP ${r.status}`);return r.json();};
const post=async(p,body)=>{const r=await fetch(origin+p,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),d=await r.json();if(!r.ok)throw new Error(d.error||`${p}: HTTP ${r.status}`);return d;};
const write=(rel,value)=>{const file=path.join(out,rel);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,typeof value==='string'?value:JSON.stringify(value));};
const exportIds=new Set(),keep=p=>{if(p?.id&&p.exportSupported!==false)exportIds.add(p.id);return p;};

fs.rmSync(out,{recursive:true,force:true});
fs.cpSync(path.join(root,'public'),out,{recursive:true});
fs.copyFileSync(path.join(root,'src/accounting.mjs'),path.join(out,'accounting.mjs'));
fs.copyFileSync(path.join(root,'static/static-api.js'),path.join(out,'static-api.js'));

const meta=await get('/api/meta');
write('api/meta.json',meta);
write('api/comparison.json',await get('/api/comparison'));
write('api/hydraulics.json',await get('/api/hydraulics'));
write('api/hydraulics-export.json',await (await fetch(origin+'/api/hydraulics/export')).text());
write('api/days.json',Object.fromEntries(externalDays.map(d=>[d.date,{demand:d.demandM3.map(v=>Math.round(v*1000)),intensity:carbonDay(d.date)}])));

const examples=await get('/api/external/examples'),previews={},proofs={};
write('api/external/examples.json',examples);
for(const sample of examples){
  const preview=await post('/api/external/preview',{trace:sample.trace,experiment:sample.experiment});
  previews[sample.experiment]=preview;
  proofs[sample.experiment]=keep(await post('/api/external/prove',{trace:preview.descriptor.trace,inputDigest:preview.inputDigest,experiment:sample.experiment}));
  console.log('external',sample.experiment,proofs[sample.experiment].accepted?'accepted':'refused');
}
write('api/external/previews.json',previews);
write('api/external/proofs.json',proofs);

const replay={simulate:{},prove:{}},dates=meta.benchmark.days.map(d=>d.date);
for(const date of dates)for(const reserveM3 of [4000,6000,8000]){
  const request={date,shockPercent:0,reserveM3},sim=await post('/api/simulate',request);
  replay.simulate[`${date}|0|${reserveM3}`]=sim;
  if(reserveM3!==4000||!sim.feasible)continue;
  for(const attack of ['none','naive']){
    try{replay.prove[`${date}|0|${reserveM3}|${attack}`]=keep(await post('/api/prove',{...request,attack}));}
    catch(e){replay.prove[`${date}|0|${reserveM3}|${attack}`]={error:e.message};}
  }
}
const attackDate=meta.benchmark.days.find(d=>d.eligible).date;
for(const attack of ['debt','reserve','tamper','duplicate'])replay.prove[`attack|${attack}`]=keep(await post('/api/prove',{date:attackDate,attack}));
write('api/replay.json',replay);
console.log('replay',Object.keys(replay.simulate).length,'simulations,',Object.keys(replay.prove).length,'contract runs');

for(const id of exportIds){const r=await fetch(`${origin}/api/export/${encodeURIComponent(id)}`);if(r.ok)write(`api/export/${id}.json`,await r.text());}

let html=fs.readFileSync(path.join(out,'index.html'),'utf8');
const swap=(from,to)=>{if(!html.includes(from))throw new Error('index.html changed; missing: '+from);html=html.split(from).join(to);};
swap('href="/style.css"','href="style.css"');
swap('href="/favicon.svg"','href="favicon.svg"');
swap('src="/favicon.svg"','src="favicon.svg"');
swap('class="brand" href="/"','class="brand" href="./"');
swap('href="/api/hydraulics/export"','href="api/hydraulics-export.json"');
swap('<script type="module" src="/app.js"></script>','<script type="module" src="static-api.js"></script><script type="module" src="app.js"></script>');
swap('src="/external.js"','src="external.js"');
swap('src="/hydraulics.js"','src="hydraulics.js"');
swap('<span class="mono">Local EVM, chain 31337</span>','<span class="mono">Recorded runs from a local EVM</span>');
swap('<p class="hero-note reveal">The tank is simulated; the water demand and grid carbon data are real.</p>','<p class="hero-note reveal">Public demo: the whole-day check runs live in your browser, and contract results are replayed from real local runs. The tank is simulated; the water demand and grid carbon data are real.</p>');
fs.writeFileSync(path.join(out,'index.html'),html);
fs.writeFileSync(path.join(out,'.nojekyll'),'');
console.log('site/ ready:',exportIds.size,'evidence bundles');
