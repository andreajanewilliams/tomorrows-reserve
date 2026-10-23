import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const required = [
  'data/hydraulics/Net3.inp', 'data/hydraulics/LICENCE-WNTR.txt',
  'data/hydraulics/results.json', 'scripts/hydraulics.py', 'requirements-hydraulics.txt',
  'data/carbon-2020-01.json', 'data/carbon-2020-02.json', 'data/carbon-2020-02-validation.json',
];

export function loadHydraulics(root=fileURLToPath(new URL('../',import.meta.url))) {
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'data/hydraulics/manifest.json'),'utf8'));
  if(manifest.schemaVersion!==1||JSON.stringify(Object.keys(manifest.files).sort())!==JSON.stringify([...required].sort()))throw new Error('Invalid hydraulic manifest file set');
  let results;
  for(const file of required){
    const bytes=fs.readFileSync(path.join(root,file));
    if(createHash('sha256').update(bytes).digest('hex')!==manifest.files[file])throw new Error(`Hydraulic evidence changed: ${file}`);
    if(file==='data/hydraulics/results.json')results=JSON.parse(bytes.toString('utf8'));
  }
  if(results.schemaVersion!==1||results.networkSha256!==manifest.files['data/hydraulics/Net3.inp'])throw new Error('Invalid hydraulic evidence version');
  return {manifest,results};
}
