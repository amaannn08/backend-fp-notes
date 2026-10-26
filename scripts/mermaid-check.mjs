import fs from 'node:fs';
const dp = (await import('/home/amann/Projects/Learn Vault/node_modules/dompurify/dist/purify.es.mjs')).default; dp.addHook=()=>{}; dp.removeHook=()=>{}; dp.removeHooks=()=>{}; dp.sanitize=(s)=>s;
const mod = await import('/home/amann/Projects/Learn Vault/node_modules/mermaid/dist/mermaid.core.mjs').catch(e=>{console.error('import fail',e.message);process.exit(1)});
const mermaid = mod.default;
for (const f of process.argv.slice(2)) {
  const txt = fs.readFileSync(f,'utf8');
  const blocks = [...txt.matchAll(/```mermaid\n([\s\S]*?)```/g)].map(m=>m[1]);
  let i=0;
  for (const b of blocks) { i++;
    try { await mermaid.parse(b); console.log(f, i, 'OK'); }
    catch(e){ console.log(f, i, 'FAIL', e.message.split('\n').slice(0,4).join(' | ')); }
  }
}
