const $=id=>document.getElementById(id);
const fmt=(x,d=0)=>Number(x).toLocaleString('en-GB',{minimumFractionDigits:d,maximumFractionDigits:d});
const dateLabel=d=>new Date(d+'T12:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let meta,sim,mode='safe',busy=false;
async function api(path,body){const r=await fetch(path,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:undefined);const result=await r.json();if(!r.ok)throw new Error(result.error);return result;}
function notice(text){$('notice').hidden=!text;$('notice').textContent=text||'';}
function view(name){document.querySelector('.hero').hidden=name==='hydraulics';for(const el of document.querySelectorAll('.view'))el.hidden=el.id!==name;for(const b of document.querySelectorAll('.nav'))b.classList.toggle('active',b.dataset.view===name);}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>view(b.dataset.view));
const options=()=>({date:$('day').value,shockPercent:Number($('shock').value),reserveM3:Number($('reserve').value)});
function setBusy(value){busy=value;document.querySelectorAll('#prove,#recalculate,#day,#shock,#reserve,#safe-mode,#naive-mode,.attack-card').forEach(b=>b.disabled=value);}
async function recalculate(){
 if(busy)return;setBusy(true);notice('');
 try{sim=await api('/api/simulate',options());$('proof-result').hidden=true;render();}
 catch(e){notice(e.message);}finally{setBusy(false);if(sim&&!sim.feasible)$('prove').disabled=true;}
}
$('recalculate').onclick=recalculate;
$('day').onchange=recalculate;$('reserve').onchange=recalculate;
$('shock').oninput=()=>{$('shock-value').textContent=$('shock').value+'%';};
$('shock').onchange=recalculate;
function setMode(name){if(busy)return;mode=name;$('safe-mode').classList.toggle('selected',name==='safe');$('naive-mode').classList.toggle('selected',name==='naive');$('safe-mode').setAttribute('aria-pressed',name==='safe');$('naive-mode').setAttribute('aria-pressed',name==='naive');render();}
$('safe-mode').onclick=()=>setMode('safe');$('naive-mode').onclick=()=>setMode('naive');$('show-naive').onclick=()=>{setMode('naive');document.querySelector('.stage').scrollIntoView({behavior:'smooth',block:'center'});};
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
 $('savings').textContent=fmt(d.savingKg);$('saving-percent').textContent=`${fmt(Math.abs(d.savingPercent),1)}% ${d.savingKg>=0?'lower':'higher'} attributed CO₂${d.eligible?'':' · invalid claim'}`;
 $('minimum').textContent=fmt(d.minStorageM3);$('reserve-state').textContent=d.minStorageM3>=sim.policy.reserveM3?'Reserve maintained':'Reserve breached';
 const level=Math.max(0,Math.min(1,d.finalStorageM3/sim.policy.capacityM3)),fill=70*level;
 $('tank').innerHTML=`<path d="M18 20v62q0 13 52 13t52-13V20" stroke="#729795" fill="#1b414a"/><path d="M19 ${88-fill}q51 12 102 0v${fill-6}q0 12-51 12T19 82Z" fill="${d.eligible?'#92cdbb':'#d39e78'}" opacity=".9"/><ellipse cx="70" cy="20" rx="52" ry="11" fill="#214a50" stroke="#729795"/><ellipse cx="70" cy="${88-fill}" rx="51" ry="10" fill="${d.eligible?'#b6eed8':'#e8ba94'}"/><text x="70" y="109" text-anchor="middle" font-size="8" fill="#a8c1bf">${fmt(d.finalStorageM3)} m³ AT CLOSE</text>`;
 storageChart(d);pumpChart(d);forecastChart();
 $('day-total').textContent=`${fmt(d.totalPumpedM3)} m³ pumped · ${fmt(sim.actualDemandM3.reduce((a,b)=>a+b,0))} m³ demand`;
 $('verdict').innerHTML=d.eligible?'The whole day.<br> Accounted for.':'This claim<br> doesn’t add up.';
 $('verdict-copy').textContent=d.eligible?'The simulated operation passes every accounting gate. Send the evidence to Solidity for an independent recomputation.':'An attractive carbon number is insufficient. This schedule fails one or more operating or comparison requirements.';
 const codes=d.violations.map(v=>v.code);
 $('checks').innerHTML=check(!codes.some(v=>['PUMP_LIMIT','BASELINE_INFEASIBLE','RESERVE_BREACH','TANK_OVERFLOW'].includes(v)),'Water service preserved',`Minimum ${fmt(d.minStorageM3)} / required ${fmt(sim.policy.reserveM3)} m³`)+check(!codes.includes('TERMINAL_MISMATCH'),'No water borrowed from tomorrow',`End ${fmt(d.finalStorageM3)} / start ${fmt(sim.policy.initialM3)} m³`)+check(d.savingKg>0,'Complete-window carbon benefit',`All 24 hours at ${sim.policy.energyWhPerM3/1000} kWh/m³`)+check(true,'Source and model traceable','Raw data + model version bound to evidence');
 $('baseline').textContent=fmt(d.baselineKg)+' kg CO₂';$('operated').textContent=fmt(d.emissionsKg)+' kg CO₂';
 $('correction').textContent=fmt(sim.adjustmentsM3.reduce((a,b)=>a+Math.abs(b),0))+' m³ schedule adjustments';
 $('prove').textContent=mode==='naive'?'Test this invalid claim ↗':'Verify on local chain ↗';
}
function proofBox(proof){return `<div class="proof-box"><p><strong>${proof.accepted?'✓ Receipt issued':'× Contract rejected: '+escape(proof.reason)}</strong></p><p>${proof.reused?'Existing receipt for this day. Change the replay day to create another.':'Executed on local chain 31337.'}</p><div class="hash">${escape(proof.evidenceDigest)}</div><a href="/api/export/${encodeURIComponent(proof.id)}" download>Download evidence bundle ↓</a></div>`;}
$('prove').onclick=async()=>{
 if(busy)return;setBusy(true);notice('');$('prove').textContent='Executing contract…';
 try{const p=await api('/api/prove',{...options(),attack:mode==='naive'?'naive':'none'});$('proof-result').innerHTML=proofBox(p);$('proof-result').hidden=false;}
 catch(e){notice(e.message);}finally{setBusy(false);render();}
};
const messages={WaterDebt:'The terminal water balance is short. The attractive carbon figure cannot earn a receipt.',ReserveBreach:'A required hourly reserve was breached. Low electricity use does not establish a valid operation.',EvidenceMismatch:'The submitted measurements no longer match the auditor’s committed evidence.',AlreadySettled:'This asset and operating day already have a receipt. A second settlement is blocked.'};
document.querySelectorAll('[data-attack]').forEach(button=>button.onclick=async()=>{
 if(busy)return;setBusy(true);notice('');$('attack-output').innerHTML='<h3>Executing the adversarial transaction…</h3><p>Deploy → commit → attest → attempt settlement.</p>';
 try{
  const p=await api('/api/prove',{date:meta.benchmark.days.find(d=>d.eligible).date,attack:button.dataset.attack});
  $('attack-output').innerHTML=`<span class="panel-number">REAL LOCAL EVM RESULT</span><h3 class="rejection">${escape(p.reason||'Unexpected acceptance')}</h3><p>${escape(messages[p.reason]||'The contract evaluated this evidence against its fixed policy.')}</p><ol class="trace">${p.steps.map((s,i)=>`<li><b>${i+1}</b><span>${escape(s.step)}<br><small>Block ${s.block}${s.status===0?' · status 0 (reverted)':''}</small></span><code>${s.tx}</code></li>`).join('')}</ol>${proofBox(p)}`;
 }catch(e){notice(e.message);$('attack-output').textContent=e.message;}finally{setBusy(false);}
});
function renderEvidence(){
 const r=meta.model,t=r.metrics.test,improvement=(1-t.maeM3/t.weeklyBaselineMaeM3)*100,b=meta.benchmark,v=meta.replication;
 $('model-cards').innerHTML=[['DEMAND FORECAST ERROR',fmt(t.maeM3)+' m³',`${fmt(improvement,1)}% lower MAE than same hour last week`],['UNTOUCHED MODEL TEST',fmt(t.hours),`${t.days} complete days · calendar year 2020`],['EMPIRICAL INTERVAL',fmt(t.intervalCoveragePercent,1)+'%',`Observed coverage · 90% calibration target`],['CONTROLLER REPLICATION',`${v.eligibleDays}/${v.totalDays}`,`Eligible days · failures remain visible below`]].map(([a,b,c])=>`<div class="stat"><span>${a}</span><strong>${b}</strong><p>${c}</p></div>`).join('');
 $('model-detail').innerHTML=[['Training',`${r.metrics.train.days} days / 2016–2018`],['Calibration',`${r.metrics.calibration.days} days / Jul–Dec 2019`],['Last-week baseline MAE',fmt(t.weeklyBaselineMaeM3,1)+' m³'],['Forecast WAPE',fmt(t.wapePercent,2)+'%'],['Empirical hourly radius','±'+fmt(r.intervalRadiusM3)+' m³'],['Excluded raw-data days',r.excludedDays],['Model SHA-256',r.modelSha256.slice(0,20)+'…']].map(([a,b])=>`<div class="data-row"><span>${a}</span><strong>${b}</strong></div>`).join('');
 $('benchmark-summary').textContent=`${b.eligibleDays+v.eligibleDays}/${b.totalDays+v.totalDays} eligible · default policy`;
 $('benchmark-body').innerHTML=[...b.days,...v.days].map(d=>`<tr><td>${dateLabel(d.date)}<br><small>${d.date<'2020-02-15'?'Development':'Replication'}</small></td><td>${fmt(d.savingKg,1)} kg CO₂${d.eligible?'':' (not claimable)'}</td><td class="${d.savingPercent>=0?'positive':'negative'}">${fmt(d.savingPercent,1)}%</td><td>${fmt(d.naiveDebtM3)} m³</td><td>${d.eligible?'✓ PASS':'× WITHHELD'}</td></tr>`).join('');
}
let tourStep=0;
const tour=[['The hidden shortcut','Switch to the short-sighted plan. Its carbon number looks better because it stops pumping early and leaves less water for tomorrow.'],['Restore the whole promise','PumpProof uses the demand forecast, retains pump headroom for uncertainty and applies ideal flow feedback. It must restore the starting water level.'],['Try the contract','Verify the valid day on the local chain. Separate demo addresses commit the plan and attest evidence; Solidity recomputes every hourly balance.'],['Break it, then inspect it','In the Attack lab, try water debt, an empty reserve, changed evidence and a duplicate receipt. Download the bundle, then inspect Model & evidence for the assumptions and all replay results.']];
function showTour(){const [title,copy]=tour[tourStep];$('tour-step').textContent=`WALKTHROUGH / ${tourStep+1} OF ${tour.length}`;$('tour-title').textContent=title;$('tour-copy').textContent=copy;$('tour-next').textContent=tourStep===tour.length-1?'Explore the attack lab ↗':'Next →';if(tourStep===0){view('operation');setMode('naive');}if(tourStep===1)setMode('safe');if(!$('tour').open)$('tour').showModal();}
$('walkthrough').onclick=()=>{tourStep=0;showTour();};$('close-tour').onclick=()=>$('tour').close();$('tour-next').onclick=()=>{if(++tourStep>=tour.length){$('tour').close();view('attacks');}else showTour();};
try{meta=await api('/api/meta');$('day').innerHTML=meta.days.map(d=>`<option value="${d}">${dateLabel(d)}</option>`).join('');renderEvidence();await recalculate();}catch(e){notice('Could not load the local service: '+e.message);}
