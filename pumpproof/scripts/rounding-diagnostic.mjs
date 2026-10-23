// Diagnostic only: never supplies headline results or fixture inputs.
import {inputs} from '../src/inputs.mjs';import {externalDays,EXTERNAL_POLICY,carbonDay,previousDay} from '../src/external-trace.mjs';import {optimise,replay,assess} from '../src/engine.mjs';import {predict} from '../src/model.mjs';import {ruleTrace} from '../src/rules.mjs';import fs from 'node:fs';
const margins=JSON.parse(fs.readFileSync(new URL('../data/baseline-calibration.json',import.meta.url))).policies;
const map=new Map(['2020-01','2020-02','2020-02-validation'].flatMap(m=>inputs.sources[`carbon-${m}.json`].data).map(r=>[r.from,r.intensity.actual]));
const even=n=>Number.isInteger(n-.5)?(Math.floor(n)%2===0?Math.floor(n):Math.ceil(n)):Math.round(n);
const grid=date=>Array.from({length:24},(_,h)=>{const p=`${date}T${String(h).padStart(2,'0')}`;return even((map.get(p+':00Z')+map.get(p+':30Z'))/2);});
const totals=Object.fromEntries(['model','persistence','honest-rule','skips-evening-refill'].map(k=>[k,{baselineKg:0,savingKg:0}]));let differingHours=0;
for(const day of externalDays){const actual=grid(day.date),signal=grid(previousDay(day.date));differingHours+=actual.filter((x,h)=>x!==carbonDay(day.date)[h]).length;
 for(const kind of Object.keys(totals)){let pumping;if(margins[kind]){const m=margins[kind],forecast=day.features.map(f=>Math.round((kind==='model'?predict(f):f[7])*1000)/1000),plan=optimise(forecast,signal,{...EXTERNAL_POLICY,pumpMaxM3:6000-m.headroomM3},m.bufferM3);if(!plan)throw new Error('Diagnostic infeasible');pumping=replay(plan,day.demandM3,EXTERNAL_POLICY,forecast,signal,m.bufferM3,m.headroomM3).pumping;}else pumping=ruleTrace(day.date,day.demandM3.map(v=>Math.round(v*1000)),{omitEveningRefill:kind==='skips-evening-refill'}).pumpedLitres.map(v=>v/1000);
 const a=assess(pumping,day.demandM3,actual,EXTERNAL_POLICY);totals[kind].baselineKg+=a.baselineKg;totals[kind].savingKg+=a.savingKg;
 }}
for(const t of Object.values(totals))t.reductionPercent=t.savingKg/t.baselineKg*100;
console.log(JSON.stringify({diagnosticOnly:true,differingHours,totals,conclusion:'Rule discrepancies match ties-to-even grid rounding. Optimised-policy residual is not isolated; different LP solvers/replay numerical behaviour remain plausible. Product retains native Math.round.'},null,2));
