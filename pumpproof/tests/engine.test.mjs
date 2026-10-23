import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import {predict,demandDays,modelReport} from '../src/model.mjs';
import {simulate,optimise,replay,assess,benchmark,DEFAULT_POLICY,provenance} from '../src/engine.mjs';

test('exported runtime model matches Python reference predictions on every replay hour',()=>{
 for(const d of demandDays)for(let h=0;h<24;h++)assert.ok(Math.abs(predict(d.features[h])-d.referencePrediction[h])<1e-8);
});
test('model and raw measurement hashes match reproducibility manifest',()=>{
 for(const [file,expected] of [['model.json',modelReport.modelSha256],['water-raw.csv',modelReport.rawSha256]])
   assert.equal(createHash('sha256').update(fs.readFileSync(new URL('../data/'+file,import.meta.url))).digest('hex'),expected);
});
test('every pinned source file matches its provenance hash',()=>{
 for(const s of provenance.sources)assert.equal(createHash('sha256').update(fs.readFileSync(new URL('../data/'+s.file,import.meta.url))).digest('hex'),s.sha256);
});
test('replication includes the negative 24 February result and withholds its receipt',()=>{
 const b=benchmark('replication'),failure=b.days.find(d=>d.date==='2020-02-24');
 assert.ok(failure.savingKg<0);assert.equal(failure.eligible,false);assert.equal(b.totalDays,14);
});
test('forecaster improves over weekly persistence on chronological held-out test',()=>{
 assert.ok(modelReport.metrics.test.maeM3<modelReport.metrics.test.weeklyBaselineMaeM3);
 assert.equal(modelReport.metrics.test.days,346);
 assert.ok(modelReport.metrics.test.intervalCoveragePercent<90,'undercoverage is retained in evidence');
});
test('default operation serves demand, restores storage and conserves every litre',()=>{
 const s=simulate();assert.ok(s.safe.eligible);
 assert.equal(Math.round(s.safe.totalPumpedM3*1000),Math.round(s.actualDemandM3.reduce((a,b)=>a+b)*1000));
 assert.equal(s.safe.finalStorageM3,s.policy.initialM3);
 assert.ok(s.safe.minStorageM3>=s.policy.reserveM3);
 for(let h=0;h<24;h++)assert.ok(Math.abs(s.safe.storageM3[h]+s.safe.pumpingM3[h]-s.actualDemandM3[h]-s.safe.storageM3[h+1])<.0011);
});
test('short-sighted apparent saving is rejected for water debt',()=>{
 const s=simulate();assert.ok(s.naive.savingKg>s.safe.savingKg);assert.ok(s.naive.waterDebtM3>0);assert.equal(s.naive.eligible,false);
});
test('severe demand shock cannot receive an accounting pass',()=>{
 const s=simulate({shockPercent:150});assert.equal(s.safe.eligible,false);assert.ok(s.safe.violations.length>0);
});
test('causal replay never inspects future actual demand',()=>{
 const s=simulate();const altered=[...s.actualDemandM3];altered[18]+=3000;
 const a=replay(s.planM3,s.actualDemandM3,s.policy,s.forecastM3,s.forecastCarbon,s.bufferM3,s.headroomM3);
 const b=replay(s.planM3,altered,s.policy,s.forecastM3,s.forecastCarbon,s.bufferM3,s.headroomM3);
 assert.deepEqual(a.pumping.slice(0,18),b.pumping.slice(0,18));
});
test('infeasible forecast yields no schedule, not an invented feasible plan',()=>{
 assert.equal(optimise(Array(24).fill(7000),Array(24).fill(200),DEFAULT_POLICY),null);
});
test('linear schedule respects capacity and full-day equality',()=>{
 const p=optimise(Array(24).fill(2000),Array.from({length:24},(_,h)=>h<12?50:300),DEFAULT_POLICY);
 const a=assess(p,Array(24).fill(2000),Array.from({length:24},(_,h)=>h<12?50:300),DEFAULT_POLICY);
 assert.ok(a.eligible);assert.equal(a.totalPumpedM3,48000);assert.equal(a.finalStorageM3,12000);
});
test('invalid inputs are rejected before optimisation',()=>{
 assert.throws(()=>simulate({shockPercent:NaN}));assert.throws(()=>simulate({date:'2030-01-01'}));
 assert.throws(()=>simulate({reserveM3:13000}));assert.throws(()=>predict([1]));
});
test('benchmark retains every eligible source date and records failures',()=>{
 const b=benchmark();assert.equal(b.days.length,b.totalDays);assert.ok(b.totalDays>=11);
 assert.equal(b.totalSavingKg,b.days.reduce((a,d)=>a+d.savingKg,0));
});
