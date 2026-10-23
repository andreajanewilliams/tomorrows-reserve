import fs from 'node:fs';import {execFile} from 'node:child_process';import {promisify} from 'node:util';
const run=promisify(execFile);import {fileURLToPath} from 'node:url';import assert from 'node:assert/strict';
const origin='http://127.0.0.1:4317',post=(path,value)=>fetch(origin+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(value)});
const results=[];
const spoof=JSON.parse(fs.readFileSync(new URL('../examples/external/skips-evening-refill-2020-02-04.json',import.meta.url)));
assert.equal((await post('/api/external/preview',{trace:spoof,experiment:'honest-rule'})).status,400);
const spoofPreview=await(await post('/api/external/preview',{trace:spoof,experiment:'uploaded-trace'})).json();
assert.equal((await post('/api/external/prove',{trace:spoof,experiment:'honest-rule',inputDigest:spoofPreview.inputDigest})).status,400);
for(const experiment of ['skips-evening-refill','honest-rule']){
 const trace=JSON.parse(fs.readFileSync(new URL(`../examples/external/${experiment}-2020-02-04.json`,import.meta.url))),preview=await(await post('/api/external/preview',{trace,experiment})).json();assert.equal(preview.receiptIssued,false);
 const request={trace,inputDigest:preview.inputDigest,experiment},response=await post('/api/external/prove',request);assert.equal(response.status,200);const result=await response.json();results.push(result);assert.deepEqual(result.evidence.pumped,trace.pumpedLitres);assert.equal(result.accepted,experiment==='honest-rule');assert.equal(result.steps.at(-1).status,result.accepted?1:0);if(!result.accepted)assert.equal(result.reason,'WaterDebt');
 const exported=await fetch(origin+'/api/export/'+result.id);assert.equal(exported.status,200);assert.match(exported.headers.get('content-disposition'),/attachment/);const bundle=await exported.json();const file=fileURLToPath(new URL('../verification/http-'+experiment+'.json',import.meta.url));fs.writeFileSync(file,JSON.stringify(bundle,null,2)+'\n');
 const verified=await run(process.execPath,['--experimental-loader',fileURLToPath(new URL('../tests/no-optimiser-loader.mjs',import.meta.url)),fileURLToPath(new URL('./verify-bundle.mjs',import.meta.url)),file,'--expect',result.accepted?'accepted':'rejected'],{encoding:'utf8'});const verification=JSON.parse(verified.stdout);assert.equal(verification.evidenceValid,true);assert.equal(verification.accountingAccepted,result.accepted);
 const reused=await(await post('/api/external/prove',request)).json();assert.equal(reused.id,result.id);assert.equal(reused.reused,true);
 const changed=structuredClone(trace);changed.pumpedLitres[0]++;assert.equal((await post('/api/external/preview',{trace:changed,experiment})).status,400);assert.equal((await post('/api/external/prove',{trace:changed,inputDigest:preview.inputDigest,experiment})).status,400);
 assert.equal((await post('/api/external/prove',{...request,inputDigest:'wrong'})).status,400);
}
const edited=structuredClone(spoof);edited.pumpedLitres[0]--;
const uploadedPreview=await(await post('/api/external/preview',{trace:edited,experiment:'uploaded-trace'})).json();
const uploadedResponse=await post('/api/external/prove',{trace:edited,experiment:'uploaded-trace',inputDigest:uploadedPreview.inputDigest});assert.equal(uploadedResponse.status,200);
const uploaded=await uploadedResponse.json();assert.equal(uploaded.experiment,'uploaded-trace');assert.equal(uploaded.preview.descriptor.generation,null);assert.deepEqual(uploaded.evidence.pumped,edited.pumpedLitres);
assert.equal((await post('/api/external/prove',{trace:spoof,experiment:'uploaded-trace',inputDigest:spoofPreview.inputDigest})).status,400);
assert.notEqual(results[0].contract,results[1].contract);fs.writeFileSync(new URL('../verification/tier2-http-experiments.json',import.meta.url),JSON.stringify(results,null,2)+'\n');console.log('PASS: exact external preview, real honest acceptance/WaterDebt refusal, v3 export and separate-process verification without optimiser, distinct labelled contracts, reuse, changed-input and stale-digest rejection.');
