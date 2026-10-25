const $=id=>document.getElementById(id);
const fmt=(x,d=0)=>Number(x).toLocaleString('en-GB',{minimumFractionDigits:d,maximumFractionDigits:d});
const dateLabel=d=>new Date(d+'T12:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let meta,sim,mode='safe',busy=false,revision=0,simulationKey=null;
const inputKey=()=>JSON.stringify({...options(),mode});
function invalidateProof(){revision++;$('proof-result').hidden=true;$('proof-result').innerHTML='';$('attack-output').innerHTML='';}
const recordedDemo=()=>globalThis.document?.documentElement?.dataset?.demo==='recorded';
function stale(value){for(const s of ['.workspace','.below-grid'])document.querySelector(s).classList.toggle('stale',value);}
function invalidateInputs(){invalidateProof();simulationKey=null;$('prove').disabled=true;document.querySelector('.workspace').hidden=true;document.querySelector('.below-grid').hidden=true;stale(true);}
const current=(rev,key)=>revision===rev&&inputKey()===key;
async function api(path,body){const r=await fetch(path,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:undefined);const result=await r.json();if(!r.ok)throw new Error(result.error);return result;}
function notice(text){$('notice').hidden=!text;$('notice').textContent=text||'';}
function view(name){document.getElementById('explore-toggle')?.classList.toggle('active',name!=='external');document.querySelector('.hero').hidden=name!=='external';if(name!=='external')globalThis.scrollTo?.({top:0});for(const el of document.querySelectorAll('.view'))el.hidden=el.id!==name;for(const b of document.querySelectorAll('.nav'))b.classList.toggle('active',b.dataset.view===name);}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>view(b.dataset.view));
const options=()=>({date:$('day').value,shockPercent:Number($('shock').value),reserveM3:Number($('reserve').value)});
function setBusy(value){busy=value;document.querySelectorAll('#prove,#recalculate,#day,#shock,#reserve,#safe-mode,#naive-mode,.attack-card,.ai-link').forEach(b=>b.disabled=value);}
async function recalculate(){
 invalidateInputs();if(busy)return;setBusy(true);notice('');
 const rev=revision,key=inputKey(),request=options();
 try{const result=await api('/api/simulate',request);if(!current(rev,key)){stale(false);return;}stale(false);sim=result;simulationKey=JSON.stringify(request);document.querySelector('.workspace').hidden=!result.feasible;document.querySelector('.below-grid').hidden=!result.feasible;render();}
 catch(e){stale(false);if(current(rev,key))notice(e.message);}finally{setBusy(false);$('prove').disabled=!sim?.feasible||simulationKey!==JSON.stringify(options());}
}
$('recalculate').onclick=recalculate;
$('day').onchange=recalculate;$('reserve').onchange=recalculate;
$('shock').oninput=()=>{invalidateInputs();$('shock-value').textContent=$('shock').value+'%';};
$('shock').onchange=recalculate;
function setMode(name){invalidateProof();mode=name;$('safe-mode').classList.toggle('selected',name==='safe');$('naive-mode').classList.toggle('selected',name==='naive');$('safe-mode').setAttribute('aria-pressed',name==='safe');$('naive-mode').setAttribute('aria-pressed',name==='naive');render();}
$('safe-mode').onclick=()=>setMode('safe');$('naive-mode').onclick=()=>setMode('naive');$('show-naive').onclick=()=>{setMode('naive');document.querySelector('.stage').scrollIntoView({behavior:'smooth',block:'center'});};
document.querySelector('.ai-link').onclick=async()=>{
 if(!meta||busy)return;
 const trace=JSON.parse($('external-json').value);
 $('day').value=trace.date;$('shock').value='0';$('shock-value').textContent='0%';$('reserve').value=String(meta.policy.reserveM3);
 setMode('safe');view('operation');await recalculate();
};
const linePath=(values,width,height,min,max,left=42,top=10)=>values.map((v,i)=>`${i?'L':'M'}${(left+i*(width-left-15)/(values.length-1)).toFixed(2)},${(top+(height-top-25)*(1-(v-min)/(max-min))).toFixed(2)}`).join(' ');
function storageChart(data){
 const w=850,h=230,left=42,top=10,plotH=h-top-25,min=Math.min(0,...data.storageM3),max=sim.policy.capacityM3;
 const y=v=>top+plotH*(1-(v-min)/(max-min)),x=i=>left+i*(w-left-15)/24;
 let out='<defs><linearGradient id="water-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#b6eed8" stop-opacity=".18"/><stop offset="100%" stop-color="#b6eed8" stop-opacity=".01"/></linearGradient></defs>';
 for(const v of [0,8000,16000,24000])out+=`<line x1="${left}" x2="${w-15}" y1="${y(v)}" y2="${y(v)}" stroke="#34515b" stroke-width=".7"/><text x="0" y="${y(v)+3}" fill="#8aa4ab" font-size="8">${v/1000}k</text>`;
 out+=`<line x1="${left}" x2="${w-15}" y1="${y(sim.policy.reserveM3)}" y2="${y(sim.policy.reserveM3)}" stroke="#e3bb79" stroke-dasharray="5 5"/>`;
 const path=linePath(data.storageM3,w,h,min,max);
 out+=`<path d="${path} L${x(24)},${y(min)} L${x(0)},${y(min)} Z" fill="url(#water-fill)"/><path d="${path}" fill="none" stroke="${data.eligible?'#b6eed8':'#efb484'}" stroke-width="2.5" stroke-linejoin="round"/>`;
 data.storageM3.forEach((v,i)=>{out+=`<circle cx="${x(i)}" cy="${y(v)}" r="${i===24?4:2}" fill="${v<sim.policy.reserveM3?'#f2ad83':'#b6eed8'}"><title>${String(i).padStart(2,'0')}:00 · ${fmt(v)} m³ stored</title></circle>`;});
 for(let i=0;i<=24;i+=4)out+=`<text x="${x(i)}" y="${h-2}" fill="#91aeb4" font-size="8" text-anchor="middle">${String(i).padStart(2,'0')}:00</text>`;
 $('storage-chart').innerHTML=out;
}
function pumpChart(data){
 const w=850,h=145,left=42,base=118,max=sim.policy.pumpMaxM3,bw=(w-left-15)/24;
 let out='';
 data.pumpingM3.forEach((p,i)=>{const bh=Math.max(0,p/max*95);out+=`<rect x="${left+i*bw+3}" y="${base-bh}" width="${bw-6}" height="${bh}" rx="2" fill="#547e7f"><title>${i}:00 · ${fmt(p)} m³ pumped · ${sim.actualCarbon[i]} g CO₂/kWh</title></rect>`;});
 const maxC=Math.max(...sim.actualCarbon)*1.15;
 out+=`<path d="${linePath(sim.actualCarbon,w,h,0,maxC,left+bw/2)}" fill="none" stroke="#e3ca7a" stroke-width="2"/>`;
 out+=`<text x="0" y="20" fill="#91aeb4" font-size="8">6k m³</text><text x="0" y="${base}" fill="#91aeb4" font-size="8">0</text>`;
 for(let i=0;i<24;i+=4)out+=`<text x="${left+i*bw+bw/2}" y="${h-2}" fill="#91aeb4" font-size="8" text-anchor="middle">${String(i).padStart(2,'0')}:00</text>`;
 $('pump-chart').innerHTML=out;
}
function forecastChart(){
 const max=Math.max(...sim.actualDemandM3,...sim.forecastM3)*1.2,w=600,h=165;
 let out='';for(const ratio of [.25,.5,.75]){const y=10+130*(1-ratio);out+=`<line x1="42" x2="585" y1="${y}" y2="${y}" stroke="#d7dfd3"/><text x="0" y="${y+3}" font-size="8" fill="#8a9a8d">${fmt(max*ratio)}</text>`;}
 out+=`<path d="${linePath(sim.actualDemandM3,w,h,0,max)}" fill="none" stroke="#9ba8a8" stroke-width="2"/><path d="${linePath(sim.forecastM3,w,h,0,max)}" fill="none" stroke="#26745f" stroke-width="2.5" stroke-dasharray="5 3"/>`;
 for(let i=0;i<24;i+=4)out+=`<text x="${42+i*543/23}" y="162" fill="#88998a" font-size="8" text-anchor="middle">${String(i).padStart(2,'0')}:00</text>`;
 $('forecast-chart').innerHTML=out;
}
function check(ok,title,detail){return `<li class="${ok?'':'fail'}"><b>${ok?'✓':'×'}</b><span>${title}<small>${detail}</small></span></li>`;}
function render(){
 if(!sim)return;
 if(!sim.feasible){notice(sim.message);$('prove').disabled=true;return;}
 const d=sim[mode];
 $('stage-date').textContent=dateLabel(sim.date);
 $('savings').textContent=fmt(d.savingKg);$('saving-percent').textContent=`${fmt(Math.abs(d.savingPercent),1)}% ${d.savingKg>=0?'lower':'higher'} attributed CO₂${d.eligible?'':d.violations?.some(v=>v.code==='BASELINE_INFEASIBLE')?' · normal pumping can’t meet this demand, so no fair comparison':' · invalid claim'}`;
 $('minimum').textContent=fmt(d.minStorageM3);$('reserve-state').textContent=d.minStorageM3>=sim.policy.reserveM3?'Reserve maintained':'Reserve breached';
 const level=Math.max(0,Math.min(1,d.finalStorageM3/sim.policy.capacityM3)),fill=70*level;
 $('tank').innerHTML=`<path d="M18 20v62q0 13 52 13t52-13V20" stroke="#729795" fill="#1b414a"/><path d="M19 ${88-fill}q51 12 102 0v${fill-6}q0 12-51 12T19 82Z" fill="${d.eligible?'#92cdbb':'#d39e78'}" opacity=".9"/><ellipse cx="70" cy="20" rx="52" ry="11" fill="#214a50" stroke="#729795"/><ellipse cx="70" cy="${88-fill}" rx="51" ry="10" fill="${d.eligible?'#b6eed8':'#e8ba94'}"/><text x="70" y="109" text-anchor="middle" font-size="8" fill="#a8c1bf">${fmt(d.finalStorageM3)} m³ AT CLOSE</text>`;
 storageChart(d);pumpChart(d);forecastChart();
 $('day-total').textContent=`${fmt(d.totalPumpedM3)} m³ pumped · ${fmt(sim.actualDemandM3.reduce((a,b)=>a+b,0))} m³ demand`;
 $('verdict').innerHTML=d.eligible?'The whole day.<br> Accounted for.':'This claim<br> doesn’t add up.';
 $('verdict-copy').textContent=d.eligible?'This plan passes every check. Run the contract to confirm it on the chain.':'A lower carbon number isn’t enough: this plan fails at least one check below.';
 const codes=d.violations.map(v=>v.code);
 $('checks').innerHTML=check(!codes.some(v=>['PUMP_LIMIT','BASELINE_INFEASIBLE','RESERVE_BREACH','TANK_OVERFLOW'].includes(v)),'Hourly limits met',`Minimum ${fmt(d.minStorageM3)} / required ${fmt(sim.policy.reserveM3)} m³`)+check(!codes.includes('TERMINAL_MISMATCH'),'Tank refilled by midnight',`End ${fmt(d.finalStorageM3)} / start ${fmt(sim.policy.initialM3)} m³`)+check(d.savingKg>0,'Less carbon over the whole day',`All 24 hours at ${sim.policy.energyWhPerM3/1000} kWh/m³`)+check(true,'Data and model traceable','Data and model version are in the evidence');
 $('baseline').textContent=fmt(d.baselineKg)+' kg CO₂';$('operated').textContent=fmt(d.emissionsKg)+' kg CO₂';
 $('correction').textContent=fmt(sim.adjustmentsM3.reduce((a,b)=>a+Math.abs(b),0))+' m³ schedule adjustments';
 $('prove').textContent=mode==='naive'?'Test this invalid claim':(recordedDemo()?'Show recorded contract run':'Run the contract check');
}
function proofBox(proof){return `<div class="proof-box"><p><strong>${proof.accepted?'✓ Receipt issued':'× Contract rejected: '+escape(proof.reason)}</strong></p><p>${proof.recorded?'Recorded run on local chain 31337, replayed in this public demo.':proof.reused?'Existing receipt for this day. Change the replay day to create another.':'Executed on local chain 31337.'}</p><div class="hash">${escape(proof.evidenceDigest)}</div><a href="/api/export/${encodeURIComponent(proof.id)}" download>Download evidence bundle ↓</a></div>`;}
$('prove').onclick=async()=>{
 if(busy||simulationKey!==JSON.stringify(options()))return;invalidateProof();setBusy(true);notice('');$('prove').textContent=recordedDemo()?'Loading recorded run…':'Executing contract…';
 const rev=revision,key=inputKey(),request={...options(),attack:mode==='naive'?'naive':'none'};
 try{const p=await api('/api/prove',request);if(!current(rev,key))return;$('proof-result').innerHTML=proofBox(p);$('proof-result').hidden=false;}
 catch(e){if(current(rev,key))notice(e.message);}finally{setBusy(false);render();$('prove').disabled=!sim?.feasible||simulationKey!==JSON.stringify(options());}
};
const messages={WaterDebt:'The terminal water balance is short. The attractive carbon figure cannot earn a receipt.',ReserveBreach:'A required hourly reserve was breached. Low electricity use does not establish a valid operation.',EvidenceMismatch:'The submitted measurements no longer match the auditor’s committed evidence.',AlreadySettled:'This asset and operating day already have a receipt. A second settlement is blocked.'};
document.querySelectorAll('[data-attack]').forEach(button=>button.onclick=async()=>{
 if(busy)return;invalidateProof();const rev=revision,key=inputKey();setBusy(true);notice('');$('attack-output').innerHTML=recordedDemo()?'<h3>Loading the recorded attempt…</h3>':'<h3>Executing the adversarial transaction…</h3><p>Deploy → commit → attest → attempt settlement.</p>';
 try{
  const p=await api('/api/prove',{date:meta.benchmark.days.find(d=>d.eligible).date,attack:button.dataset.attack});
  if(!current(rev,key))return;
  $('attack-output').innerHTML=`${p.recorded?'<p class="recorded-note">Recorded run from a real local contract, replayed in this public demo.</p>':''}<div class="decision ${p.accepted?'good':'bad'}"><span class="decision-icon">${p.accepted?'✓':'✕'}</span><div><h3>${p.accepted?'Unexpectedly accepted':'Refused by the contract'}</h3><p>${escape(messages[p.reason]||'The contract evaluated this evidence against its fixed policy.')}</p>${p.reason?`<code class="revert">Refused: ${escape(p.reason)}</code>`:''}</div></div><ol class="steps-plain">${p.steps.map(s=>`<li class="${s.status===0?'no':'ok'}"><b>${s.status===0?'✕':'✓'}</b><span>${escape(s.step)}</span><small>Block ${s.block}${s.status===0?' · status 0 (reverted)':''}</small></li>`).join('')}</ol><details class="tech"><summary>Technical details</summary><dl class="hashes">${p.steps.map(s=>`<dt>${escape(s.step)}</dt><dd>${escape(s.tx)}</dd>`).join('')}</dl>${proofBox(p)}</details>`;
 }catch(e){if(current(rev,key)){notice(e.message);$('attack-output').textContent=e.message;}}finally{setBusy(false);$('prove').disabled=!sim?.feasible||simulationKey!==JSON.stringify(options());}
});
function renderEvidence(){
 const r=meta.model,t=r.metrics.test,improvement=(1-t.maeM3/t.weeklyBaselineMaeM3)*100,b=meta.benchmark,v=meta.replication;
 $('model-cards').innerHTML=[['Typical forecast error',fmt(t.maeM3)+' m³',`${fmt(improvement,1)}% better than “same hour last week”`],['Hours tested on unseen data',fmt(t.hours),`${t.days} days in 2020 the model never saw`],['Forecast range held',fmt(t.intervalCoveragePercent,1)+'%',`of hours (target 90%)`],['Test-period days that pass',`${v.eligibleDays}/${v.totalDays}`,`Planner fixed before 15–28 Feb; failures shown`]].map(([a,b,c])=>`<div class="stat"><span>${a}</span><strong>${b}</strong><p>${c}</p></div>`).join('');
 $('model-detail').innerHTML=[['Training',`${r.metrics.train.days} days / 2016–2018`],['Calibration',`${r.metrics.calibration.days} days / Jul–Dec 2019`],['Last-week baseline MAE',fmt(t.weeklyBaselineMaeM3,1)+' m³'],['Forecast WAPE',fmt(t.wapePercent,2)+'%'],['Empirical hourly radius','±'+fmt(r.intervalRadiusM3)+' m³'],['Excluded raw-data days',r.excludedDays],['Model SHA-256',r.modelSha256.slice(0,20)+'…']].map(([a,b])=>`<div class="data-row"><span>${a}</span><strong>${b}</strong></div>`).join('');
 $('benchmark-summary').textContent=`${b.eligibleDays+v.eligibleDays}/${b.totalDays+v.totalDays} eligible · default policy`;
 $('benchmark-body').innerHTML=[...b.days,...v.days].map(d=>`<tr><td>${dateLabel(d.date)}<br><small>${d.date<'2020-02-15'?'Development':'Replication'}</small></td><td>${fmt(d.savingKg,1)} kg CO₂${d.eligible?'':' (not claimable)'}</td><td class="${d.savingPercent>=0?'positive':'negative'}">${fmt(d.savingPercent,1)}%</td><td>${fmt(d.naiveDebtM3)} m³</td><td>${d.eligible?'✓ PASS':'× WITHHELD'}</td></tr>`).join('');
}
// Guided walkthrough of the main journey: a floating card, a highlight on each part, and real actions.
let tourStep=0,tourMark=null,tourRun=0;
const until=async(test,ms=4000)=>{const t0=Date.now();while(!test()&&Date.now()-t0<ms)await new Promise(r=>setTimeout(r,100));};
// Each tour action runs only while its own tour run is still live (not closed or restarted).
const pickPlan=async(plan,live)=>{const card=document.querySelector(`.plan-card[data-plan="${plan}"]`);if(!live()||!card||card.disabled)return false;if(card.classList.contains('active')&&document.querySelector('#external-preview .verdict'))return true;card.click();await until(()=>!live()||(card.classList.contains('active')&&document.querySelector('#external-preview .verdict')));return live()&&card.classList.contains('active');};
// What the contract panel actually shows: accepted, refused, an error message, or still pending.
function contractOutcome(){const r=$('external-result'),h=r.querySelector('.decision h3');
 if(h)return{state:h.textContent.startsWith('Accepted')?'accepted':'refused',reason:r.querySelector('.decision p')?.textContent||'',recorded:!!r.querySelector('.recorded-note'),reused:/existing result reused/i.test(r.textContent)};
 const text=r.textContent.trim();return text&&!/settling|Loading the recorded/.test(text)?{state:'error',message:text}:{state:'pending'};}
const planFacts=()=>{let date='';try{date=dateLabel(JSON.parse($('external-json').value).date);}catch{}return{date,carbon:document.querySelector('#external-preview .kpi strong')?.textContent||'',verdict:document.querySelector('#external-preview .verdict-tag')?.textContent||''};};
const proveNow=async live=>{await until(()=>!live()||!$('external-prove').disabled);if(!live()||$('external-prove').disabled)return false;$('external-prove').click();await until(()=>!live()||contractOutcome().state!=='pending',9000);return true;};
const how=o=>o.recorded?' This is a recorded run, replayed in the public demo.':o.reused?' This local demo session had already checked the same plan, so the earlier result is shown.':'';
const tour=[
 {target:'.compare',title:'The trick',copy:'A pumping plan can look 20% greener just by not refilling the tank. Tomorrow then starts 7,000 m³ short.'},
 {target:'#external-preview',title:'Check the whole day',copy:'Following the tank hour by hour until midnight…',run:async live=>({picked:await pickPlan('skips-evening-refill',live)}),
  describe:({picked})=>{const f=planFacts();return picked?`Tomorrow’s Reserve follows the tank hour by hour until midnight. On ${f.date} this plan claims ${f.carbon.replace('−','')} less carbon, but it ${f.verdict.toLowerCase()==='holds water'?'holds water':'doesn’t hold water'}.`:'The plan couldn’t be selected just now. Close the tour and pick it on the left.';}},
 {target:'.flow-contract',title:'The contract decides',copy:'Running the contract check…',run:async live=>({ran:await pickPlan('skips-evening-refill',live)&&await proveNow(live)}),
  describe:({ran})=>{const o=contractOutcome();if(!ran)return'The contract check didn’t start. Close the tour and press “Run the contract check”.';
   if(o.state==='refused')return`The smart contract re-checked every hour and refused the claim: ${o.reason}${how(o)}`;
   if(o.state==='accepted')return`The contract accepted this plan.${how(o)}`;
   if(o.state==='error')return`The contract check didn’t complete: ${o.message.replace(/[.\s]*$/,".")} Nothing was accepted.`;
   return'The contract hasn’t answered yet; its result will appear in this panel.';}},
 {target:'.flow-contract',title:'A plan that passes?',copy:'Checking the AI-optimised plan…',run:async live=>{const picked=await pickPlan('ai-plan',live);return{picked,ran:picked&&await proveNow(live)};},
  describe:({picked,ran})=>{const o=contractOutcome(),f=planFacts();
   if(!picked)return'The AI-optimised plan isn’t available yet (its results are still loading). Try this step again in a moment.';
   if(!ran)return'The contract check for the AI plan didn’t start. Press “Run the contract check” to try it.';
   if(o.state==='accepted')return`Our AI forecaster’s plan for ${f.date}: ${f.carbon.replace('−','')} less carbon, the tank refilled, and the contract accepts it.${how(o)} This is one day; across all 25 days the model’s gain over a simple baseline is smaller.`;
   if(o.state==='refused')return`The contract refused the AI plan: ${o.reason}${how(o)}`;
   if(o.state==='error')return`The contract didn’t accept the AI plan this time: ${o.message}`;
   return'The contract hasn’t answered yet; its result will appear in this panel.';}},
 {target:'.glance',title:'Across 25 days',copy:'',describe:()=>`Across 25 simulated days, skipping the refill makes the saving look ${$('overstate-glance')?.textContent||'3.9'}× bigger than the honest rule, and no depleted plan qualifies.`},
 {target:'.flow-contract',title:'Check it yourself',copy:'Download the one-page report or the signed evidence file. Anyone can replay it on a fresh chain.'}
];
async function showTour(){
 const step=tour[tourStep],run=++tourRun,live=()=>run===tourRun&&$('tour').open;view('external');clearTourMarks();
 $('tour-step').textContent=`${tourStep+1} of ${tour.length}`;$('tour-title').textContent=step.title;$('tour-copy').textContent=step.copy;
 $('tour-next').textContent=tourStep===tour.length-1?'Finish':'Next';$('tour-back').hidden=tourStep===0;
 $('tour-dots').innerHTML=tour.map((_,i)=>`<i class="${i===tourStep?'on':i<tourStep?'done':''}"></i>`).join('');
 if(!$('tour').open)$('tour').show();
 $('tour-next').disabled=true;$('tour-back').disabled=true;
 let result={};try{result=await step.run?.(live)||{};}finally{if(run===tourRun){$('tour-next').disabled=false;$('tour-back').disabled=false;}}
 if(!live())return;if(step.describe)$('tour-copy').textContent=step.describe(result);$('tour-next').focus();
 tourMark=document.querySelector(step.target);tourMark?.classList.add('tour-focus');
 const box=tourMark?.getBoundingClientRect(),inView=box&&box.top>=0&&box.top<innerHeight*.45;
 if(tourMark&&!inView)tourMark.scrollIntoView({behavior:'smooth',block:tourMark.offsetHeight>innerHeight*.6?'start':'center'});
}
function clearTourMarks(){tourMark=null;for(const el of document.querySelectorAll('.tour-focus'))el.classList.remove('tour-focus');}
function endTour(){tourRun++;$('tour').close();clearTourMarks();$('tour-next').disabled=false;$('tour-back').disabled=false;}
$('walkthrough').onclick=()=>{tourStep=0;showTour();};$('close-tour').onclick=endTour;
$('tour-next').onclick=()=>{if(++tourStep>=tour.length)endTour();else showTour();};
$('tour-back').onclick=()=>{if(tourStep>0){tourStep--;showTour();}};
$('tour').onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();endTour();$('walkthrough').focus();}};
try{meta=await api('/api/meta');$('day').innerHTML=meta.days.map(d=>`<option value="${d}">${dateLabel(d)}</option>`).join('');renderEvidence();await recalculate();}catch(e){notice('Could not load the local service: '+e.message);}
