const $=id=>document.getElementById(id);
const n=(x,d=1)=>Number(x).toLocaleString('en-GB',{maximumFractionDigits:d,minimumFractionDigits:d});
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let data;
const names={CANDIDATE_PRESSURE:'Pressure below 20 m',BASELINE_PRESSURE:'Comparator pressure below 20 m',CANDIDATE_UNMET_DEMAND:'Demand was not fully delivered',BASELINE_UNMET_DEMAND:'Comparator did not deliver all demand',NO_CARBON_BENEFIT:'No positive carbon difference',SCENARIO_COST_INCREASE:'Illustrative electricity bill increased'};
function reason(s){return names[s]||(s.startsWith('TANK_')?`Tank ${s.split('_')[1]} ends below its required volume`:s);}
function label(c){if(c.kind==='historical-grid')return `${c.date} · ${c.billProtected?'bill protected':'carbon first'} · ${c.eligible?'qualifies':c.run==='native'?'keep native controls':'withheld'}`;return {'stress-1.25':'Stress test · 25% extra demand','stress-2.0':'Stress test · double demand','source-off':'Adversarial · source pump off','zero-carbon':'Control · zero-carbon grid'}[c.id]||c.id;}
function schedule(r){const s=r.schedule;return s.start===null?'Native time and tank-level controls':s.duration===0?'Source pump 10 off; other controls retained':`Pump 10 runs ${String(s.start).padStart(2,'0')}:00–${String(s.start+s.duration).padStart(2,'0')}:00; pump 335 keeps its usual level controls`;}
function network(run){
 const nodes=data.topology.nodes, lookup=new Map(nodes.map(v=>[v.id,v]));
 const xs=nodes.map(v=>v.xy[0]),ys=nodes.map(v=>v.xy[1]);
 const x=v=>28+(v.xy[0]-Math.min(...xs))/(Math.max(...xs)-Math.min(...xs))*604;
 const y=v=>324-(v.xy[1]-Math.min(...ys))/(Math.max(...ys)-Math.min(...ys))*296;
 let svg=data.topology.links.map(e=>{const a=lookup.get(e.from),b=lookup.get(e.to);return `<line x1="${x(a)}" y1="${y(a)}" x2="${x(b)}" y2="${y(b)}" stroke="${e.type==='Pump'?'#e3ca7a':'#3c626c'}" stroke-width="${e.type==='Pump'?4:1.5}"/>`;}).join('');
 svg+=nodes.map(v=>{const p=run.pressureByNodeM[v.id],type=v.type;const fill=type==='Tank'?'#e3ca7a':p===undefined?'#71949d':p<20?'#ff9e7c':'#b6eed8';return `<circle cx="${x(v)}" cy="${y(v)}" r="${type==='Junction'?3:7}" fill="${fill}"><title>${esc(type)} ${esc(v.id)}${p===undefined?'':` · minimum ${n(p,2)} m pressure head`}</title></circle>${type==='Tank'?`<text x="${x(v)+10}" y="${y(v)-8}" fill="#e3ca7a" font-size="11">Tank ${esc(v.id)}</text>`:''}`;}).join('');
 $('hydro-map').innerHTML=svg;
}
function pressureChart(r,b){
 const all=[...r.trace,...b.trace].map(v=>v.minPressureM),min=Math.min(0,...all),max=Math.max(35,...all)+3;
 const y=v=>130-(v-min)/(max-min)*110,x=h=>40+h*24;
 const path=a=>a.map((v,i)=>`${i?'L':'M'}${x(v.hour)},${y(v.minPressureM)}`).join(' ');
 let out=`<line x1="40" x2="616" y1="${y(20)}" y2="${y(20)}" stroke="#b5663e" stroke-dasharray="5 4"/><text x="2" y="${y(20)+4}" font-size="10" fill="#a45a3b">20 m</text><path d="${path(b.trace)}" stroke="#a1b0a8" fill="none" stroke-width="2" stroke-dasharray="4 3"/><path d="${path(r.trace)}" stroke="#235b48" fill="none" stroke-width="2.5"/>`;
 for(let h=0;h<=24;h+=4)out+=`<text x="${x(h)}" y="153" text-anchor="middle" font-size="10" fill="#647676">${h}:00</text>`;
 $('hydro-pressure').innerHTML=out;
}
function render(){
 const c=data.cases.find(c=>c.id===$('hydro-case').value),r=data.runs[c.run],b=data.runs[c.baseline];
 $('hydro-status').textContent=c.eligible?'Benchmark qualifies':c.run==='native'?'No change recommended':'Claim withheld';
 $('hydro-status').className='hydro-verdict '+(c.eligible?'pass':'withheld');
 $('hydro-title').textContent=c.eligible?'Lower carbon. Water protected. A visible trade-off.':c.run==='native'?'Keep the existing controls under this policy.':'A lower number must pass every check.';
 $('hydro-schedule').textContent=schedule(r);
 $('hydro-reasons').textContent=(c.eligible?'Water, pressure and carbon checks all pass. ':c.failures.map(reason).join(' · ')+'. ')+(c.billIncreases?`The illustrative bill increases by £${n(-c.costSavingGBP,2)}. ${c.billProtected?'This policy refuses it.':'This policy allows that only when the carbon and water checks all pass.'}`:c.billProtected?'The bill-protected policy permits no scenario cost increase.':'The illustrative bill does not increase.');
 $('hydro-metrics').innerHTML=[['Carbon difference',`${n(c.savingKg)} kg`,c.eligible?'Qualifies in this benchmark':'Not a claimable saving'],['Lowest pressure anywhere',`${n(r.minPressureM)} m`,'20 m declared scenario threshold'],['Water not delivered',`${n(r.unmetM3,2)} m³`,`Of ${n(r.requestedM3,0)} m³ requested`],['Electricity bill (illustrative)',`£${n(c.operationCostGBP,2)}`,`Existing controls £${n(c.baselineCostGBP,2)}`]].map(([a,v,d])=>`<div class="stat"><span>${a}</span><strong>${v}</strong><p>${d}</p></div>`).join('');
 $('hydro-tanks').innerHTML=Object.keys(r.finalTankM3).map(id=>{const target=Math.max(r.initialTankM3[id],b.finalTankM3[id]),end=r.finalTankM3[id];return `<tr><td>Tank ${esc(id)}</td><td>${n(r.initialTankM3[id])}</td><td>${n(b.finalTankM3[id])}</td><td>${n(end)}</td><td class="${end>=target-.001?'positive':'negative'}">${end>=target-.001?'✓':'×'} ${n(end-target)} m³</td></tr>`;}).join('');
 $('hydro-energy').textContent=`${n(r.energyKWh)} kWh selected / ${n(b.energyKWh)} kWh native · peak ${n(r.peakKW)} kW · ${r.switches} pump status changes`;
 $('hydro-detail').textContent=`Pressure checked at all ${Object.keys(r.pressureByNodeM).length} demand-bearing junctions whenever they request water, across ${r.solverSteps} solver states.${r.multiplier===1?'':` Demand ×${n(r.multiplier,2)}.`}`;
 network(r);pressureChart(r,b);
}
try{
 const response=await fetch('/api/hydraulics');if(!response.ok)throw new Error('Evidence snapshot unavailable');
 const payload=await response.json();data=payload.results;
 $('hydro-case').innerHTML=data.cases.map(c=>`<option value="${esc(c.id)}">${esc(label(c))}</option>`).join('');
 $('hydro-case').value=data.cases.some(c=>c.id==='2020-02-05')?'2020-02-05':data.cases[0].id;
 $('hydro-case').onchange=render;
 $('hydro-off').onclick=()=>{$('hydro-case').value='source-off';render();};
 $('hydro-stress').onclick=()=>{$('hydro-case').value='stress-2.0';render();};
 const historical=data.cases.filter(c=>c.kind==='historical-grid'&&!c.billProtected);
 $('hydro-summary').textContent=`Carbon first: ${historical.filter(c=>c.eligible).length}/${historical.length} qualify · bill protected: ${data.cases.filter(c=>c.billProtected&&c.eligible).length}/${historical.length}`;
 $('hydro-case-table').innerHTML=data.cases.map(c=>`<tr><td>${esc(label(c))}</td><td>${n(c.savingKg)} kg</td><td>£${n(c.costSavingGBP,2)}</td><td>${c.eligible?'✓ QUALIFIES':esc(c.failures.map(reason).join('; '))}</td></tr>`).join('');
 $('hydro-hash').textContent=payload.manifest.files['data/hydraulics/results.json'];
 render();
}catch(e){$('hydro-title').textContent='Hydraulic evidence could not be loaded.';$('hydro-reasons').textContent=e.message;}
