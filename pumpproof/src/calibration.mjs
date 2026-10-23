import {inputs} from './inputs.mjs';
import {predict} from './model.mjs';
const before=(d,k)=>new Date(Date.parse(d+'T00:00Z')-k*86400000).toISOString().slice(0,10);
const mean=a=>a.reduce((a,b)=>a+b,0)/a.length;
export function reconstruct(){
 const buckets=new Map(),invalid=new Set();
 for(const row of inputs.sources['water-raw.csv'].trim().split(/\r?\n/).slice(1)){
  const [date,time,consumption]=row.split(','),[month,day,year]=date.split('/').map(Number),iso=`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  const h=Number(time.trim().split(':')[0]),v=Number(consumption),b=buckets.get(iso)||new Map();
  if(b.has(h)||!Number.isFinite(v)||v<=0)invalid.add(iso);b.set(h,v);buckets.set(iso,b);
 }
 const valid=new Map([...buckets].filter(([date,b])=>!invalid.has(date)&&b.size===24&&Array.from({length:24},(_,h)=>h).every(h=>b.has(h))).map(([d,b])=>[d,Array.from({length:24},(_,h)=>b.get(h))]));
 const eligible=[...valid.keys()].sort().filter(d=>[1,2,7,14].every(k=>valid.has(before(d,k))));
 function features(d,h){
  const t=new Date(d+'T00:00Z'),weekday=(t.getUTCDay()+6)%7,dayOfYear=(t-Date.UTC(t.getUTCFullYear(),0,1))/86400000+1,yearpos=dayOfYear/365.25,prior=[1,2,7,14].map(k=>valid.get(before(d,k)));
  return [h,weekday,Number(weekday>=5),Math.sin(2*Math.PI*yearpos),Math.cos(2*Math.PI*yearpos),...prior.map(p=>p[h]),mean(prior[0]),mean(prior[2]),...[1,2].map(k=>Math.sin(2*Math.PI*h*k/24)),...[1,2].map(k=>Math.cos(2*Math.PI*h*k/24))];
 }
 const records=eligible.filter(date=>date>='2019-07-01'&&date<'2021-01-01').map(date=>({date,demand:valid.get(date),model:Array.from({length:24},(_,h)=>predict(features(date,h))),persistence:valid.get(before(date,7))}));
 return {records,validDays:valid.size,excludedDays:buckets.size-valid.size};
}
const quantile=(values,q)=>[...values].sort((a,b)=>a-b)[Math.ceil((values.length-1)*q)];
function errors(records,kind){return records.map(r=>{let sum=0,max=0;const hourly=r.demand.map((v,h)=>{const e=v-r[kind][h];sum+=e;max=Math.max(max,sum);return Math.abs(e);});return {max,hourly};});}
export function calibrate(){
 const {records,validDays,excludedDays}=reconstruct(),cal=records.filter(r=>r.date<'2020-01-01'),test=records.filter(r=>r.date>='2020-01-01');
 const policies={};
 for(const kind of ['model','persistence']){const e=errors(cal,kind),hourly=e.flatMap(e=>e.hourly),bufferM3=quantile(e.map(e=>e.max),.9),headroomM3=quantile(hourly,Math.min(1,Math.ceil((hourly.length+1)*.9)/hourly.length));
 const coverage=rows=>{const e=errors(rows,kind);return {days:rows.length,dailyCumulativePercent:100*e.filter(e=>e.max<=bufferM3).length/e.length,hourlyAbsolutePercent:100*e.flatMap(e=>e.hourly).filter(v=>v<=headroomM3).length/(rows.length*24)};};
 policies[kind]={bufferM3,headroomM3,calibrationDates:cal.map(r=>r.date),fullYearCoverage:coverage(test),februaryCoverage:coverage(test.filter(r=>r.date>='2020-02-01'&&r.date<'2020-03-01'))};}
 return {schema:'pumpproof-calibration-v1',validDays,excludedDays,calibrationDays:cal.length,testDays:test.length,policies,sourceHash:inputs.sourceHash,modelHash:inputs.modelReport.modelSha256,method:'Native exported-model inference; unrounded calibration predictions; train.py higher quantiles; no retraining or test fitting.',limitations:'Forecast-margin coverage is not outage frequency or physical safety. Both storage buffer and pump headroom change.'};
}
