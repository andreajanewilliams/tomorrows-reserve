import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
export async function verifyBundle(bundle,{expect='accepted'}={}){
 if(!['accepted','rejected'].includes(expect))throw new Error('Expected mode must be accepted or rejected');
 if(bundle.schema==='pumpproof-evidence-v3')return (await import('./verify-external.mjs')).verifyExternal(bundle,{expect});
 if(expect!=='accepted')throw new Error('Rejection verification requires external v3 evidence');
 return (await import('./verify-v2.mjs')).verifyBundle(bundle);
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 try{const [file,...flags]=process.argv.slice(2);if(!file||!(flags.length===0||(flags.length===2&&flags[0]==='--expect')))throw new Error('Usage: npm run verify -- evidence.json [--expect accepted|rejected]');
 console.log(JSON.stringify(await verifyBundle(JSON.parse(fs.readFileSync(file,'utf8')),{expect:flags[1]||'accepted'}),null,2));}
 catch(e){console.error('Verification failed: '+e.message);process.exitCode=1;}
}
