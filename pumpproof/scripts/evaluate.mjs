import fs from 'node:fs';
import {benchmark,simulate,availableDays} from '../src/engine.mjs';
const report={generatedAt:new Date().toISOString(),development:benchmark(),replication:benchmark('replication'),
 shockExperiments:[0,50,100,150].map(shockPercent=>{const s=simulate({shockPercent});return {shockPercent,eligible:s.safe.eligible,savingKg:s.safe.savingKg,violations:s.safe.violations};}),
 limits:'Historical transferred-grid simulation; controller was developed on 4–14 February, then evaluated without parameter changes on later source-complete February dates. No causal avoided-emissions or field-safety claim.'};
fs.writeFileSync(new URL('../data/evaluation.json',import.meta.url),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
