// Authoritative litre/score arithmetic. Strings keep every integer exact in JSON.
export function account({demand,pumped,intensity},policy){
 const initial=BigInt(Math.round(policy.initialM3*1000)),reserve=BigInt(Math.round(policy.reserveM3*1000)),capacity=BigInt(Math.round(policy.capacityM3*1000)),maxPump=BigInt(Math.round(policy.pumpMaxM3*1000));
 let level=initial,baseline=0n,operated=0n,total=0n;const storage=[level],violations=[];
 for(let h=0;h<24;h++){
  const d=BigInt(demand[h]),p=BigInt(pumped[h]),i=BigInt(intensity[h]);
  if(p>maxPump)violations.push({hour:h,code:'PUMP_LIMIT'});
  if(d>maxPump)violations.push({hour:h,code:'BASELINE_INFEASIBLE'});
  if(i>2000n)violations.push({hour:h,code:'INVALID_INTENSITY'});
  level+=p-d;storage.push(level);total+=p;baseline+=d*i;operated+=p*i;
  if(level<reserve)violations.push({hour:h,code:'RESERVE_BREACH'});
  if(level>capacity)violations.push({hour:h,code:'TANK_OVERFLOW'});
 }
 if(level<initial)violations.push({hour:24,code:'WATER_DEBT'});
 if(level>initial)violations.push({hour:24,code:'TERMINAL_SURPLUS'});
 if(operated>=baseline)violations.push({hour:24,code:'NO_CARBON_BENEFIT'});
 const wh=BigInt(policy.energyWhPerM3),difference=baseline-operated;
 // BigInt division truncates towards zero for negative previews; positive values match Solidity floor.
 const grams=score=>(score*wh/1000000n).toString();
 const min=storage.reduce((a,b)=>a<b?a:b),max=storage.reduce((a,b)=>a>b?a:b);
 return {baselineScore:baseline.toString(),operatedScore:operated.toString(),differenceScore:difference.toString(),baselineGrams:grams(baseline),operatedGrams:grams(operated),savingGrams:grams(difference),
  storageLitres:storage.map(String),initialLitres:String(initial),finalLitres:String(level),minimumLitres:String(min),maximumLitres:String(max),totalPumpedLitres:String(total),
  waterDebtLitres:String(level<initial?initial-level:0n),terminalSurplusLitres:String(level>initial?level-initial:0n),
  energyMilliWh:(total*wh).toString(),peakHourlyAverageKw:Math.max(...pumped)*policy.energyWhPerM3/1000000,
  violations,hourlyModelConstraintsMet:!violations.some(v=>v.hour<24),startingStorageRestored:level===initial,positiveCarbonDifference:difference>0n,eligible:violations.length===0,
  display:{energyKwh:Number(total*wh)/1e6,baselineKg:Number(baseline)*Number(wh)/1e9,operatedKg:Number(operated)*Number(wh)/1e9,rawDifferenceKg:Number(difference)*Number(wh)/1e9,reductionPercent:Number(difference)/Number(baseline)*100},
  rounding:'Authoritative integers are decimal strings; negative preview grams truncate towards zero. Display uses unrounded scores; event saving floors the positive score difference separately.'};
}
