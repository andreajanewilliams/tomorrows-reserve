import fs from 'node:fs';
import {createHash} from 'node:crypto';
const sources=[
 {file:'water-raw.csv',source:'https://zenodo.org/records/11045013',creator:'Weyrauch, Taubert, Götz, Streit, Götz, Debus and Wolter; supplied by Siemens AG',licence:'CC BY 4.0',kind:'Raw hourly German district consumption'},
 ...['2020-01','2020-02','2020-02-validation'].map(period=>({file:`carbon-${period}.json`,source:'https://carbon-intensity.github.io/api-definitions/',creator:'National Energy System Operator (NESO)',licence:'CC BY 4.0',kind:'GB half-hourly estimated actual carbon intensity'})),
 {file:'demand-days.json',source:'Derived locally by scripts/train.py',creator:'PumpProof transformation of Weyrauch et al.',licence:'CC BY 4.0',kind:'Complete-day features and measured demand; no imputation'}
].map(s=>({...s,sha256:createHash('sha256').update(fs.readFileSync(new URL('../data/'+s.file,import.meta.url))).digest('hex')}));
const manifest={retrieved:'2026-10-18',sources,alignment:'German local clock hour is mapped by hour index to a GB UTC scenario. This is an intentional transfer scenario, not a co-located or timezone-aligned utility record.'};
fs.writeFileSync(new URL('../data/provenance.json',import.meta.url),JSON.stringify(manifest,null,2));
console.log('Source provenance pinned for '+sources.length+' input files.');
