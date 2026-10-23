import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {loadInputs} from '../src/inputs.mjs';

test('runtime refuses changed model or source bytes under stale provenance',()=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'pumpproof-inputs-'));
  try{
    for(const name of ['provenance.json','model-report.json','model.json','water-raw.csv','demand-days.json','carbon-2020-01.json','carbon-2020-02.json','carbon-2020-02-validation.json'])fs.copyFileSync(new URL('../data/'+name,import.meta.url),path.join(directory,name));
    const root=pathToFileURL(directory+path.sep);
    assert.ok(loadInputs(root).model);
    for(const name of ['model.json','water-raw.csv','demand-days.json','carbon-2020-02.json']){
      const file=path.join(directory,name),original=fs.readFileSync(file);
      fs.appendFileSync(file,' ');
      assert.throws(()=>loadInputs(root),/hash mismatch/);
      fs.writeFileSync(file,original);
    }
    const file=path.join(directory,'provenance.json'),manifest=JSON.parse(fs.readFileSync(file));
    manifest.sources.pop();fs.writeFileSync(file,JSON.stringify(manifest));
    assert.throws(()=>loadInputs(root),/every required source/);
  }finally{fs.rmSync(directory,{recursive:true,force:true});}
});
