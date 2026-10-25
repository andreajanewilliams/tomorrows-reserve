import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {simulate} from '../src/engine.mjs';

const source=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8').split("try{meta=await api('/api/meta')")[0];
function ui(){
 const elements=new Map();
 const node=id=>{if(!elements.has(id))elements.set(id,{value:({day:'2020-02-04',shock:'0',reserve:'4000'})[id]||'',hidden:true,innerHTML:'',textContent:'',classList:{toggle(){}},setAttribute(){},scrollIntoView(){}});return elements.get(id);};
 const requests=[];
 const context=vm.createContext({document:{getElementById:node,querySelector:selector=>node(selector),querySelectorAll:()=>[]},fetch:(url,options)=>new Promise((resolve,reject)=>requests.push({url,options,resolve:body=>resolve({ok:true,json:async()=>body}),reject}))});
 vm.runInContext(source+'\nglobalThis.testApi={setMode,recalculate};',context);
 return {node,requests,api:context.testApi,context};
}
const proof={accepted:true,id:'receipt',evidenceDigest:'digest'};
async function ready(u){const pending=u.api.recalculate();u.requests.shift().resolve(simulate());await pending;}
async function accepted(u){const pending=u.node('prove').onclick();u.requests.shift().resolve(proof);await pending;assert.equal(u.node('proof-result').hidden,false);}
function cleared(u){assert.equal(u.node('proof-result').hidden,true);assert.equal(u.node('proof-result').innerHTML,'');}
test('actual UI handlers clear proof/export on mode, slider and failed date/reserve changes',async()=>{
 const u=ui();await ready(u);await accepted(u);u.api.setMode('naive');cleared(u);
 await accepted(u);u.node('shock').value='10';u.node('shock').oninput();cleared(u);assert.equal(u.node('prove').disabled,true);assert.equal(u.node('.workspace').hidden,true);
 for(const id of ['day','reserve']){await ready(u);await accepted(u);u.node(id).value=id==='day'?'2020-02-05':'5000';const p=u.node(id).onchange();cleared(u);u.requests.shift().reject(new Error('invalid simulation'));await p;cleared(u);assert.equal(u.node('prove').disabled,true);}
});
test('late proof cannot restore an export even after returning to original inputs',async()=>{
 const u=ui();await ready(u);const p=u.node('prove').onclick();u.api.setMode('naive');u.api.setMode('safe');u.requests.shift().resolve(proof);await p;cleared(u);
});
test('late simulation cannot authorise proving after an input change',async()=>{
 const u=ui();const p=u.api.recalculate();u.node('shock').value='20';u.node('shock').oninput();u.requests.shift().resolve(simulate());await p;assert.equal(u.node('prove').disabled,true);cleared(u);
 const count=u.requests.length;await u.node('prove').onclick();assert.equal(u.requests.length,count);
});
test('AI replay link restores its day and policy after exploring other settings and clears the old proof',async()=>{
 const u=ui();await ready(u);u.api.setMode('naive');await accepted(u);
 vm.runInContext('meta={policy:{reserveM3:4000}}',u.context);
 u.node('external-json').value=JSON.stringify({date:'2020-02-04'});
 u.node('day').value='2020-02-05';u.node('shock').value='50';u.node('reserve').value='8000';
 const pending=u.node('.ai-link').onclick();
 cleared(u);assert.equal(u.node('prove').disabled,true);
 const request=u.requests.shift();
 assert.deepEqual(JSON.parse(request.options.body),{date:'2020-02-04',shockPercent:0,reserveM3:4000});
 assert.equal(u.node('shock-value').textContent,'0%');
 request.resolve(simulate());await pending;
 assert.equal(u.node('prove').disabled,false);cleared(u);
 assert.equal(vm.runInContext('mode',u.context),'safe');
});
