import assert from 'node:assert/strict';
import fs from 'node:fs';

// Exercise the running local server, including the export used by the verifier.
const origin='http://127.0.0.1:4317';
const post=(path,body,headers={})=>fetch(origin+path,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
assert.equal((await fetch(origin+'/api/health')).status,200);
assert.equal((await fetch(origin+'/missing')).status,404);
assert.equal((await post('/api/prove',{}, {Origin:'https://unrelated.example'})).status,403);
assert.equal((await post('/api/simulate',{date:'not-a-date'})).status,400);
assert.equal((await post('/api/simulate',{reserveM3:4000.0001})).status,400);
const input={date:'2020-02-05',shockPercent:0,reserveM3:4000};
const response=await post('/api/prove',input);
assert.equal(response.status,200);
const receipt=await response.json();
assert.equal(receipt.accepted,true);
const reused=await (await post('/api/prove',input)).json();
assert.equal(reused.id,receipt.id);
assert.equal(reused.reused,true);
assert.equal((await post('/api/prove',{...input,reserveM3:6000})).status,400);
const exported=await fetch(origin+'/api/export/'+receipt.id);
assert.match(exported.headers.get('content-disposition'),/attachment/);
const bundle=await exported.json();
assert.equal(bundle.evidenceDigest,receipt.evidenceDigest);
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(bundle,null,2)+'\n');
console.log('PASS: HTTP health, missing route, cross-origin rejection, invalid input, receipt idempotence, changed-input rejection and evidence export.');
