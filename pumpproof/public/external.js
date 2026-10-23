const $=id=>document.getElementById(id),fmt=(v,d=0)=>Number(v).toLocaleString('en-GB',{maximumFractionDigits:d});
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let revision=0,preview=null,samples=[];
const key=()=>JSON.stringify({text:$('external-json').value,experiment:$('external-example').value});
function invalidate(){revision++;preview=null;$('external-preview').innerHTML='';$('external-result').innerHTML='';$('external-prove').disabled=true;}
async function api(path,body){const response=await fetch(path,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:undefined),data=await response.json();if(!response.ok)throw new Error(data.error);return data;}
const matches=(rev,input)=>revision===rev&&key()===input;
$('external-json').oninput=()=>{$('external-example').value='uploaded-trace';invalidate();};
$('external-example').onchange=()=>{invalidate();const sample=samples.find(s=>s.experiment===$('external-example').value);if(sample)$('external-json').value=JSON.stringify(sample.trace,null,2);};
$('external-upload').onchange=async()=>{
 invalidate();const rev=revision,file=$('external-upload').files[0];$('external-example').value='uploaded-trace';$('external-json').value='';
 if(!file)return;if(file.size>50000){$('external-result').textContent='JSON file is too large.';return;}
 try{const text=await file.text();if(revision!==rev)return;$('external-json').value=text;}catch(e){if(revision===rev)$('external-result').textContent=e.message;}
};
$('external-preview-button').onclick=async()=>{
 invalidate();const rev=revision,input=key();$('external-preview').textContent='Calculating the exact uploaded trace…';
 try{const result=await api('/api/external/preview',{trace:JSON.parse($('external-json').value),experiment:$('external-example').value});if(!matches(rev,input))return;preview=result;const a=result.accounting;
 $('external-preview').innerHTML=`<span class="panel-number">CALCULATED PREVIEW · NO TRANSACTION YET</span><h3>${fmt(a.display.reductionPercent,2)}% ${a.display.rawDifferenceKg>=0?'apparent reduction':'increase'}</h3><p>Start ${fmt(Number(a.initialLitres)/1000)} m³ → close ${fmt(Number(a.finalLitres)/1000,3)} m³. Water debt: <strong>${fmt(Number(a.waterDebtLitres)/1000,3)} m³</strong>. Surplus: ${fmt(Number(a.terminalSurplusLitres)/1000,3)} m³.</p><p>Hourly model constraints: ${a.hourlyModelConstraintsMet?'met':'failed'} · starting storage restored: ${a.startingStorageRestored?'yes':'no'} · positive attributed carbon difference: ${a.positiveCarbonDifference?'yes':'no'}.</p><p>${a.violations.length?a.violations.map(v=>esc(v.code)+' (hour '+v.hour+')').join(' · '):'Numerically eligible; contract execution pending.'}</p><p class="hash">Input digest: ${esc(result.inputDigest)}</p><details><summary>Exact uploaded litres, 24 UTC hours</summary><pre>${esc(JSON.stringify(result.descriptor.trace.pumpedLitres))}</pre></details>`;
 $('external-prove').disabled=false;
 }catch(e){if(matches(rev,input)){$('external-preview').textContent=e.message;$('external-prove').disabled=true;}}
};
$('external-prove').onclick=async()=>{
 if(!preview)return;const rev=revision,input=key(),expected=preview.inputDigest,trace=structuredClone(preview.descriptor.trace);$('external-prove').disabled=true;$('external-result').textContent='Committing → attesting → settling on the local EVM…';
 try{const result=await api('/api/external/prove',{trace,inputDigest:expected,experiment:$('external-example').value});if(!matches(rev,input)||result.inputDigest!==expected)return;
 $('external-result').innerHTML=`<span class="panel-number">ACTUAL LOCAL EVM RESULT · CHAIN 31337</span><h3>${result.accepted?'Receipt issued':'Refused: '+esc(result.reason)}</h3><p>Experiment: ${esc(result.experiment)}. ${esc(result.scope)} ${result.reused?'Identical request: existing result reused.':''}</p><p class="hash">Contract ${esc(result.contract)}<br>Input ${esc(result.inputDigest)}</p><ol class="trace">${result.steps.map((s,i)=>`<li><b>${i+1}</b><span>${esc(s.step)} · status ${s.status}<br>Block ${s.block}</span><code>${esc(s.tx)}</code></li>`).join('')}</ol><p><a href="/api/export/${encodeURIComponent(result.id)}" download>Download signed v3 evidence bundle ↓</a></p><p class="micro">Independent verification: <code>npm run verify -- path/to/bundle.json${result.accepted?'':' --expect rejected'}</code>. Verifying a refusal does not issue a receipt.</p>`;
 }catch(e){if(matches(rev,input))$('external-result').textContent=e.message;}finally{if(matches(rev,input))$('external-prove').disabled=false;}
};
try{samples=await api('/api/external/examples');$('external-example').value='skips-evening-refill';$('external-example').onchange();}catch(e){$('external-result').textContent=e.message;}

try{const r=await api('/api/comparison');$('comparison-table').innerHTML='<table><thead><tr><th>Policy</th><th>Gross reduction (all days)</th><th>Numerically eligible</th><th>Actual EVM runs</th></tr></thead><tbody>'+Object.entries(r.summary).map(([name,s])=>{const executed=r.rows.filter(row=>row.policy===name&&row.actualEvm);return `<tr><td>${esc(name)}</td><td>${fmt(s.allDaysGross.reductionPercent,5)}%${name==='skips-evening-refill'?' apparent':''}</td><td>${s.eligibleDays}/${r.cohort.length}</td><td>${executed.length} (${executed.filter(row=>row.actualEvm.accepted).length} accepted)</td></tr>`;}).join('')+'</tbody></table>';$('comparison-failures').textContent=r.rows.filter(row=>row.accounting&&!row.accounting.eligible&&row.policy!=='skips-evening-refill').map(row=>`${row.policy} ${row.date}: ${row.accounting.violations.map(v=>v.code).join(', ')}; surplus ${fmt(Number(row.accounting.terminalSurplusLitres)/1000,3)} m³; raw difference ${fmt(row.accounting.display.rawDifferenceKg,3)} kg.`).join(' ');}catch(e){$('comparison-failures').textContent=e.message;}
