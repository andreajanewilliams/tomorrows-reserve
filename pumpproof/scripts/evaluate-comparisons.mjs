import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {calibrate} from '../src/calibration.mjs';
import {externalDays,carbonDay,previousDay,previewTrace,EXTERNAL_POLICY} from '../src/external-trace.mjs';
import {optimise,replay} from '../src/engine.mjs';
import {predict} from '../src/model.mjs';
import {ruleTrace} from '../src/rules.mjs';
import {inputs} from '../src/inputs.mjs';
const root=new URL('../',import.meta.url),write=(p,value)=>fs.writeFileSync(new URL(p,root),JSON.stringify(value,null,2)+'\n');
const sha=file=>createHash('sha256').update(fs.readFileSync(new URL(file,root))).digest('hex');
const calibration=calibrate();write('data/baseline-calibration.json',calibration);
const methods=Object.fromEntries(['src/rules.mjs','src/calibration.mjs','src/engine.mjs','src/accounting.mjs','scripts/evaluate-comparisons.mjs'].map(f=>[f,sha(f)]));
fs.mkdirSync(new URL('examples/external/',root),{recursive:true});
const rows=[],fixtures=[];
for(const day of externalDays){
 const demand=day.demandM3,demandLitres=demand.map(v=>Math.round(v*1000)),signal=carbonDay(previousDay(day.date));
 for(const policy of ['model','persistence','honest-rule','skips-evening-refill']){
  let trace,margins=null,plan=null;
  if(policy==='model'||policy==='persistence'){
   margins=calibration.policies[policy];const forecast=day.features.map(f=>Math.round((policy==='model'?predict(f):f[7])*1000)/1000);
   plan=optimise(forecast,signal,{...EXTERNAL_POLICY,pumpMaxM3:6000-margins.headroomM3},margins.bufferM3,true);
   if(plan){const operation=replay(plan,demand,EXTERNAL_POLICY,forecast,signal,margins.bufferM3,margins.headroomM3);trace={schema:'pumpproof-external-trace-v1',date:day.date,pumpedLitres:operation.pumping.map(v=>Math.round(v*1000))};}
  }else{trace=ruleTrace(day.date,demandLitres,{omitEveningRefill:policy==='skips-evening-refill'});const file=`examples/external/${policy}-${day.date}.json`;write(file,trace);fixtures.push({file,sha256:sha(file),policy,date:day.date,methodSha256:methods['src/rules.mjs'],sourceHash:inputs.sourceHash});}
  if(!trace){rows.push({date:day.date,policy,planningFeasible:false,accounting:null,actualEvm:null});continue;}
  const p=previewTrace(trace);rows.push({date:day.date,policy,planningFeasible:true,trace,demandLitres,initialLitres:p.accounting.initialLitres,accounting:p.accounting,inputDigest:p.inputDigest,margins:margins?{bufferM3:margins.bufferM3,headroomM3:margins.headroomM3}:null,actualEvm:null});
 }
}
function aggregate(rows){const included=rows.filter(r=>r.planningFeasible),baselineKg=included.reduce((a,r)=>a+r.accounting.display.baselineKg,0),operatedKg=included.reduce((a,r)=>a+r.accounting.display.operatedKg,0);return {dates:included.map(r=>r.date),days:included.length,baselineKg,operatedKg,savingKg:baselineKg-operatedKg,reductionPercent:100*(baselineKg-operatedKg)/baselineKg};}
const policies=['model','persistence','honest-rule','skips-evening-refill'];
const commonDates=externalDays.map(d=>d.date).filter(date=>policies.slice(0,3).every(p=>rows.find(r=>r.date===date&&r.policy===p)?.accounting?.eligible));
const summary=Object.fromEntries(policies.map(policy=>{const selected=rows.filter(r=>r.policy===policy);return [policy,{eligibleDays:selected.filter(r=>r.accounting?.eligible).length,allDaysGross:aggregate(selected),eligibleOnly:aggregate(selected.filter(r=>r.accounting?.eligible)),commonEligible:aggregate(selected.filter(r=>commonDates.includes(r.date))),infeasibleDates:selected.filter(r=>!r.planningFeasible).map(r=>r.date)}];}));
const report={schema:'pumpproof-comparison-v1',sourceHash:inputs.sourceHash,modelHash:inputs.modelReport.modelSha256,methods,cohort:externalDays.map(d=>d.date),excludedFebruaryDates:Array.from({length:29},(_,i)=>`2020-02-${String(i+1).padStart(2,'0')}`).filter(d=>!externalDays.some(x=>x.date===d)),summary,commonEligibleDefinition:'Intersection of model, persistence and honest rule; debt rule has no eligible days.',rows,execution:'Numerical eligibility only. actualEvm remains null until real fixture execution.',assumptions:['Exploratory retrospective February comparison; repeatedly inspected during development.','All policies have idealised current-hour demand feedback.','Both forecast buffer and pump headroom differ; equivalent operational safety is not established.','Demand is German; GB grid paired by hour index. Hypothetical tank/pump, constant 0.5 kWh/m³.','Equal-volume operations use equal energy; attributed CO2 timing difference is not causal avoided emissions.']};
write('data/comparison-evaluation.json',report);write('examples/external/manifest.json',{schema:'pumpproof-fixture-manifest-v1',method:'E4 clock/tank rule; targets 22000/12000/5000/12000 m³; debt variant keeps 5000 after 19:00.',methods,fixtures});
console.log(JSON.stringify(summary,null,2));
