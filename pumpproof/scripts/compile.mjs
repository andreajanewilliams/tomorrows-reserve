import fs from 'node:fs';
import solc from 'solc';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url);
export function compile(){
  const source=fs.readFileSync(new URL('contracts/PumpProof.sol',root),'utf8');
  const input={language:'Solidity',sources:{'PumpProof.sol':{content:source}},settings:{optimizer:{enabled:true,runs:200},viaIR:true,evmVersion:'shanghai',outputSelection:{'*':{'*':['abi','evm.bytecode.object','evm.deployedBytecode.object']}}}};
  const output=JSON.parse(solc.compile(JSON.stringify(input)));
  const errors=(output.errors||[]).filter(e=>e.severity==='error');
  if(errors.length)throw new Error(errors.map(e=>e.formattedMessage).join('\n'));
  const c=output.contracts['PumpProof.sol'].PumpProof;
  const artifact={compiler:solc.version(),abi:c.abi,bytecode:`0x${c.evm.bytecode.object}`,deployedBytecode:`0x${c.evm.deployedBytecode.object}`};
  fs.writeFileSync(new URL('data/contract.json',root),JSON.stringify(artifact));
  return artifact;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const a=compile();console.log(`Compiled PumpProof with ${a.compiler}; ${a.bytecode.length/2-1} byte deployment`);}
