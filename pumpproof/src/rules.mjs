// Executable illustrative E4 clock/tank rule; independent of model and optimiser.
export function ruleTrace(date,demandLitres,{omitEveningRefill=false}={}){
 let level=12000000;const pumpedLitres=[];
 for(let h=0;h<24;h++){
  const target=h<6?22000000:h<16?12000000:h<19||omitEveningRefill?5000000:12000000;
  const p=Math.max(0,Math.min(target-level+demandLitres[h],6000000,24000000-level+demandLitres[h]));
  pumpedLitres.push(p);level+=p-demandLitres[h];
 }
 return {schema:'pumpproof-external-trace-v1',date,pumpedLitres};
}
