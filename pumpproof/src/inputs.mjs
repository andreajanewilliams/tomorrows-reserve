import fs from 'node:fs';
import {createHash} from 'node:crypto';

const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const required=['water-raw.csv','carbon-2020-01.json','carbon-2020-02.json','carbon-2020-02-validation.json','demand-days.json'];
function freeze(value){
  if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}
  return value;
}
export function loadInputs(directory=new URL('../data/',import.meta.url)){
  const read=name=>fs.readFileSync(new URL(name,directory));
  const provenanceBytes=read('provenance.json'),provenance=JSON.parse(provenanceBytes);
  const names=provenance.sources?.map(s=>s.file);
  if(!names||names.length!==required.length||new Set(names).size!==required.length||required.some(name=>!names.includes(name)))throw new Error('Provenance must list every required source exactly once');
  const sources={};
  for(const source of provenance.sources){
    const bytes=read(source.file);
    if(hash(bytes)!==source.sha256)throw new Error('Source hash mismatch: '+source.file);
    // Consume these exact checked bytes, rather than reopening the file later.
    sources[source.file]=source.file.endsWith('.json')?JSON.parse(bytes):bytes.toString('utf8');
  }
  const modelBytes=read('model.json'),modelReport=JSON.parse(read('model-report.json'));
  if(hash(modelBytes)!==modelReport.modelSha256)throw new Error('Model hash mismatch: model.json');
  if(provenance.sources.find(s=>s.file==='water-raw.csv').sha256!==modelReport.rawSha256)throw new Error('Training source hash mismatch');
  return freeze({model:JSON.parse(modelBytes),modelReport,provenance,sourceHash:hash(provenanceBytes),sources});
}
export const inputs=loadInputs();
