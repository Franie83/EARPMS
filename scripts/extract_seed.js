
const fs=require('fs'), vm=require('vm');
const src=fs.readFileSync('/mnt/data/earpms-flask/frontend/src/lib/store.ts','utf8');
const names=[]; const blocks={};
const re=/^const (INITIAL_\w+)[^=]*=\s*/gm; let m;
while((m=re.exec(src))){
  const name=m[1], start=m.index+m[0].length;
  const rest=src.slice(start); const nm=rest.search(/^const (?:INITIAL_\w+|STORAGE_KEY)\b/m);
  const end=nm<0?src.length:start+nm;
  blocks[name]=src.slice(start,end).trim().replace(/;\s*$/,''); names.push(name);
}
const ctx={}; const data={};
for(const name of names){
  ctx[name]=vm.runInNewContext('('+blocks[name]+')',ctx);
  data[name]=ctx[name];
}
fs.writeFileSync('/mnt/data/earpms-flask/backend/seed.json',JSON.stringify(data,null,2));
console.log(names.join('\n'));
