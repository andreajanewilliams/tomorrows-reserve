import {inputs} from './inputs.mjs';
import solver from 'javascript-lp-solver';
import {predict, model, modelReport, demandDays} from './model.mjs';

export const DEFAULT_POLICY = Object.freeze({initialM3:12000,reserveM3:4000,capacityM3:24000,pumpMaxM3:6000,energyWhPerM3:500});
export const {provenance}=inputs;
const {sourceHash}=inputs;
const carbonRows = ['2020-01','2020-02','2020-02-validation'].flatMap(month => inputs.sources[`carbon-${month}.json`].data);
const carbon = new Map();
for (const r of carbonRows) {
  if (Number.isFinite(r.intensity.actual)) carbon.set(r.from, r.intensity.actual);
}
function carbonDay(date) {
  const values=[];
  for (let h=0;h<24;h++) {
    const prefix=`${date}T${String(h).padStart(2,'0')}`;
    const a=carbon.get(`${prefix}:00Z`),b=carbon.get(`${prefix}:30Z`);
    if (!Number.isFinite(a)||!Number.isFinite(b)) return null;
    values.push(Math.round((a+b)/2));
  }
  return values;
}
const previous = date => new Date(Date.parse(`${date}T00:00Z`)-86400000).toISOString().slice(0,10);
export const availableDays = demandDays.filter(d=>carbonDay(d.date)&&carbonDay(previous(d.date)));
const round = n=>Math.round(n*1000)/1000;

export function validatePolicy(policy) {
  for (const key of Object.keys(DEFAULT_POLICY)) if (!Number.isFinite(policy[key])) throw new Error(`Invalid ${key}`);
  if (policy.reserveM3<0||policy.reserveM3>=policy.initialM3||policy.initialM3>policy.capacityM3||policy.capacityM3>100000||policy.pumpMaxM3<100||policy.pumpMaxM3>20000||policy.energyWhPerM3<1||policy.energyWhPerM3>5000) throw new Error('Invalid reservoir or pump limits');
}

export function optimise(demand, signal, policy, buffer=0, terminal=true, startM3=policy.initialM3) {
  validatePolicy(policy);
  const hours=demand.length;
  if(hours<1||hours>24||signal.length!==hours||!demand.every(x=>Number.isFinite(x)&&x>=0)||!signal.every(x=>Number.isFinite(x)&&x>=0)) throw new Error('Expected 1–24 valid hourly values');
  const constraints={}, variables={};
  let cumulative=0;
  const floor=Math.min(policy.initialM3,policy.reserveM3+buffer);
  for(let h=0;h<hours;h++) {
    cumulative+=demand[h];
    constraints[`tank${h}`]={min:cumulative+floor-startM3,max:cumulative+policy.capacityM3-startM3};
    constraints[`pump${h}`]={max:policy.pumpMaxM3};
  }
  if(terminal) constraints.end={equal:demand.reduce((a,b)=>a+b,0)+policy.initialM3-startM3};
  for(let h=0;h<hours;h++) {
    const v={carbon:signal[h]+h*1e-7,[`pump${h}`]:1};
    if(terminal)v.end=1;
    for(let t=h;t<hours;t++)v[`tank${t}`]=1;
    variables[`p${h}`]=v;
  }
  const answer=solver.Solve({optimize:'carbon',opType:'min',constraints,variables});
  if(!answer.feasible||!answer.bounded) return null;
  const pumping=Array.from({length:hours},(_,h)=>round(Math.max(0,answer[`p${h}`]||0)));
  // Close sub-litre rounding at the last pump with headroom.
  if(terminal){
    const delta=round(demand.reduce((a,b)=>a+b,0)+policy.initialM3-startM3-pumping.reduce((a,b)=>a+b,0));
    const k=pumping.findLastIndex(x=>x+delta>=0&&x+delta<=policy.pumpMaxM3);
    if(k>=0)pumping[k]=round(pumping[k]+delta);
  }
  return pumping;
}

export function assess(pumping,demand,intensity,policy) {
  let level=policy.initialM3,emissionsKg=0,baselineKg=0;
  const storage=[level],violations=[];
  for(let h=0;h<24;h++){
    level=round(level+pumping[h]-demand[h]);storage.push(level);
    emissionsKg+=pumping[h]*policy.energyWhPerM3*intensity[h]/1e6;
    baselineKg+=demand[h]*policy.energyWhPerM3*intensity[h]/1e6;
    if(pumping[h]<0||pumping[h]>policy.pumpMaxM3+.0001)violations.push({hour:h,code:'PUMP_LIMIT'});
    if(demand[h]>policy.pumpMaxM3)violations.push({hour:h,code:'BASELINE_INFEASIBLE'});
    if(level<policy.reserveM3-.0001)violations.push({hour:h,code:'RESERVE_BREACH'});
    if(level>policy.capacityM3+.0001)violations.push({hour:h,code:'TANK_OVERFLOW'});
  }
  if(Math.round(level*1000)!==Math.round(policy.initialM3*1000))violations.push({hour:24,code:'TERMINAL_MISMATCH'});
  const savingKg=baselineKg-emissionsKg;
  if(savingKg<=0)violations.push({hour:24,code:'NO_CARBON_BENEFIT'});
  return {pumpingM3:pumping,storageM3:storage,emissionsKg,baselineKg,savingKg,savingPercent:savingKg/baselineKg*100,
    totalPumpedM3:pumping.reduce((a,b)=>a+b,0),waterDebtM3:Math.max(0,policy.initialM3-level),
    minStorageM3:Math.min(...storage),finalStorageM3:level,violations,eligible:violations.length===0};
}

// Ideal flow-following feedback within each hour. Uses that hour's measured draw,
// never a later hour's actual demand. This is a simulation, not a hydraulic controller.
export function replay(plan,demand,policy,forecast,signal,buffer=0,headroom=0){
  let level=policy.initialM3;
  const pumping=[],adjustments=[];
  for(let h=0;h<24;h++){
    const remaining=forecast.slice(h);remaining[0]=demand[h];
    const corrected=optimise(remaining,signal.slice(h),{...policy,pumpMaxM3:policy.pumpMaxM3-headroom},buffer,true,level);
    let p=corrected?corrected[0]:plan[h];
    p=Math.max(p,demand[h]+policy.reserveM3-level);
    p=Math.min(p,demand[h]+policy.capacityM3-level);
    if(h===23)p=demand[h]+policy.initialM3-level;
    p=round(Math.max(0,Math.min(policy.pumpMaxM3,p)));
    pumping.push(p);adjustments.push(round(p-plan[h]));
    level=round(level+p-demand[h]);
  }
  return {pumping,adjustments};
}

export function simulate({date=availableDays[0]?.date,shockPercent=0,reserveM3=4000,capacityM3=24000}={}){
  if(!Number.isFinite(shockPercent)||shockPercent<0||shockPercent>150)throw new Error('Demand shock must be between 0 and 150%');
  const day=availableDays.find(d=>d.date===date);
  if(!day)throw new Error('Unknown replay day');
  if(!Number.isFinite(reserveM3)||!Number.isFinite(capacityM3)||Math.abs(reserveM3-round(reserveM3))>1e-9||Math.abs(capacityM3-round(capacityM3))>1e-9)throw new Error('Storage settings must be finite values with at most three decimal places');
  const policy={...DEFAULT_POLICY,reserveM3,capacityM3};validatePolicy(policy);
  const forecast=day.features.map(f=>round(predict(f)));
  const demand=day.demandM3.map((x,h)=>round(x*(h>=6&&h<=11?1+shockPercent/100:1)));
  const actualCarbon=carbonDay(date),forecastCarbon=carbonDay(previous(date));
  const buffer=Math.min(model.calibratedBufferM3,policy.initialM3-policy.reserveM3);
  const headroom=Math.min(model.intervalRadiusM3,policy.pumpMaxM3*.2);
  const plan=optimise(forecast,forecastCarbon,{...policy,pumpMaxM3:policy.pumpMaxM3-headroom},buffer,true);
  if(!plan)return {date,policy,feasible:false,message:'No feasible day-ahead schedule for these storage and pump limits.'};
  const naivePlan=optimise(forecast,forecastCarbon,policy,0,false);
  const controlled=replay(plan,demand,policy,forecast,forecastCarbon,buffer,headroom);
  const safe=assess(controlled.pumping,demand,actualCarbon,policy);
  const openLoop=assess(plan,demand,actualCarbon,policy);
  const naive=assess(naivePlan||Array(24).fill(0),demand,actualCarbon,policy);
  return {date,feasible:true,policy,shockPercent,forecastM3:forecast,actualDemandM3:demand,
    forecastCarbon,actualCarbon,planM3:plan,bufferM3:buffer,headroomM3:headroom,intervalRadiusM3:model.intervalRadiusM3,
    safe,naive,openLoop,adjustmentsM3:controlled.adjustments,modelHash:modelReport.modelSha256,
    sourceHash,
    context:'Measured German demand replayed under a transplanted GB grid scenario. Pumping and tank behaviour are simulated.',
    carbonMethod:'Plan: previous-day measured intensity persistence; evaluate: same-day actual estimate. No future grid observations used in planning.'};
}

export function benchmark(partition='development'){
  const days=availableDays.filter(d=>partition==='replication'?d.date>='2020-02-15':d.date<'2020-02-15').map(d=>simulate({date:d.date}));
  const valid=days.filter(d=>d.feasible);
  const savings=valid.map(d=>d.safe.savingPercent).sort((a,b)=>a-b);
  return {days:valid.map(d=>({date:d.date,savingPercent:d.safe.savingPercent,savingKg:d.safe.savingKg,
      baselineKg:d.safe.baselineKg,eligible:d.safe.eligible,violations:d.safe.violations,
      naiveDebtM3:d.naive.waterDebtM3,correctionM3:d.adjustmentsM3.reduce((a,b)=>a+Math.abs(b),0)})),
    eligibleDays:valid.filter(d=>d.safe.eligible).length,totalDays:days.length,
    totalSavingKg:valid.reduce((a,d)=>a+d.safe.savingKg,0),
    totalBaselineKg:valid.reduce((a,d)=>a+d.safe.baselineKg,0),
    worstSavingPercent:savings[0],medianSavingPercent:savings[Math.floor(savings.length/2)]};
}
