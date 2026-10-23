import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadHydraulics} from '../src/hydraulics.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
test('hydraulic snapshot binds the data, network and executable replay',()=>{
  const {results,manifest}=loadHydraulics();
  assert.equal(results.networkSha256,manifest.files['data/hydraulics/Net3.inp']);
  assert.ok(results.cases.some(c=>c.eligible));
  assert.equal(results.cases.find(c=>c.id==='zero-carbon').eligible,false);
  assert.equal(results.cases.find(c=>c.id==='source-off').eligible,false);
  assert.ok(results.cases.some(c=>c.failures.includes('CANDIDATE_PRESSURE')));
});
test('changed results cannot be served with an unchanged evidence manifest',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pumpproof-hydraulic-'));
  try{
    const {manifest}=loadHydraulics();
    for(const file of [...Object.keys(manifest.files),'data/hydraulics/manifest.json']){
      fs.mkdirSync(path.dirname(path.join(dir,file)),{recursive:true});
      fs.copyFileSync(path.join(root,file),path.join(dir,file));
    }
    const resultPath=path.join(dir,'data/hydraulics/results.json');
    const result=JSON.parse(fs.readFileSync(resultPath));
    result.cases.find(c=>c.id==='source-off').eligible=true;
    fs.writeFileSync(resultPath,JSON.stringify(result));
    assert.throws(()=>loadHydraulics(dir),/Hydraulic evidence changed/);
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
