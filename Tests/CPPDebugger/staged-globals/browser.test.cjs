const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const engineRoot = process.env.DEBUGGER_SH_COMPILER_DIST;
if (!engineRoot) throw new Error('Set DEBUGGER_SH_COMPILER_DIST to debugger-sh 0.3.15 dist with llvm.core.wasm and llvm-resources.tar.gz');
const debuggerRoot = path.resolve(__dirname, '../../../LanguageResources/ClangLib/debugger');
const source = fs.readFileSync(path.join(__dirname, 'fixtures/globals.cpp'), 'utf8').trimEnd();
const cppBreakpoint = source.split('\n').findIndex(line => line.trim() === 'local += 1;') + 1;
assert.ok(cppBreakpoint, 'C++ breakpoint missing');
const headers = {'Cross-Origin-Opener-Policy':'same-origin','Cross-Origin-Embedder-Policy':'require-corp','Cross-Origin-Resource-Policy':'same-origin'};
const server = http.createServer((req,res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/') {res.writeHead(200,{...headers,'Content-Type':'text/html'}).end('<!doctype html>');return;}
  const parts = url.pathname.split('/');
  const root = parts[1] === 'engine' ? engineRoot : parts[1] === 'debugger' ? debuggerRoot : null;
  if (!root || parts.length !== 3 || parts[2].includes('..')) {res.writeHead(404).end();return;}
  const file = path.join(root, parts[2]);
  if (parts[1] === 'engine' && parts[2] === 'engine-local.js') {
    let data = fs.readFileSync(path.join(root, 'debugger-sh.js'),'utf8');
    const wasmUrl = 'https://cdn.jsdelivr.net/npm/debugger-sh@0.3.15/dist/engine_bg.wasm';
    const marker = 'new Blob([\"URL.revokeObjectURL(import.meta.url);\", CA]';
    const shim = "const nativeFetch=self.fetch.bind(self);self.fetch=(input,options)=>{const u=typeof input==='string'?input:input.url||String(input);const p='https://fabioibanez.github.io/website/';return nativeFetch(u.startsWith(p)?'http://localhost:20233/engine/'+u.slice(p.length):input,options);};";
    assert.equal(data.split(wasmUrl).length - 1, 2, 'Unexpected compiler bundle');
    assert.ok(data.includes(marker), 'Unexpected compiler worker bundle');
    data = data.replaceAll(wasmUrl, 'http://localhost:20233/engine/engine_bg.wasm')
      .replace(marker, `new Blob([\"URL.revokeObjectURL(import.meta.url);\", ${JSON.stringify(shim)}, CA]`);
    res.writeHead(200,{...headers,'Content-Type':'text/javascript'}).end(data);return;
  }
  const type = file.endsWith('.wasm') ? 'application/wasm' : file.endsWith('.gz') ? 'application/gzip' : 'text/javascript';
  if (!fs.existsSync(file)) {res.writeHead(404).end();return;}
  res.writeHead(200,{...headers,'Content-Type':type});fs.createReadStream(file).pipe(res);
});
function removeArrayCounts(input) {
  const bytes = Buffer.from(input);
  let pos = 8;
  const uleb = () => {let value=0, shift=0, b; do {b=bytes[pos++];value+=(b&127)*2**shift;shift+=7;} while(b&128);return value;};
  let changed = 0;
  while (pos < bytes.length) {
    const id = bytes[pos++], size = uleb(), end = pos + size;
    if (id === 0) {
      const len = uleb(), name = bytes.toString('utf8',pos,pos+len);pos += len;
      if (name === '.debug_abbrev') {
        while (pos < end) {
          const code = uleb(); if (!code) continue;
          const tag = uleb(); pos++;
          while (pos < end) {
            const attrPos = pos, attr = uleb(), form = uleb();
            if (!attr && !form) break;
            if (form === 0x21) { do {} while (bytes[pos++] & 128); }
            if (tag === 0x21 && attr === 0x37) {bytes[attrPos] = 0x0b; changed++;}
          }
        }
      }
    }
    pos = end;
  }
  assert.ok(changed > 0, 'No DW_AT_count found to remove');
  return bytes.toString('base64');
}
function corruptFirstDebugAddress(input) {
  const bytes=Buffer.from(input); let pos=8;
  const uleb=()=>{let value=0,shift=0,b;do {b=bytes[pos++];value+=(b&127)*2**shift;shift+=7;}while(b&128);return value;};
  while(pos<bytes.length) {
    const id=bytes[pos++],size=uleb(),end=pos+size;
    if(id===0) {
      const len=uleb(),name=bytes.toString('utf8',pos,pos+len);pos+=len;
      if(name==='.debug_addr') {assert.ok(pos+12<=end);bytes.writeUInt32LE(0xffffffff,pos+8);return bytes.toString('base64');}
    }
    pos=end;
  }
  throw new Error('missing .debug_addr');
}
let browser;
(async () => {
  await new Promise((resolve,reject) => {server.once('error',reject);server.listen(20233,'127.0.0.1',resolve);});
  const chrome = process.env.CHROME_PATH || (fs.existsSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome') ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : undefined);
  browser = await chromium.launch({executablePath:chrome,headless:true,args:['--no-sandbox']});
  const page = await browser.newPage();
  page.on('pageerror', error => console.error('PAGE ERROR:',error));
  await page.goto('http://localhost:20233/');
  const compile = source => page.evaluate(async source => {
    const nativeFetch = window.fetch.bind(window);
    window.fetch = (input,options) => {
      const url = typeof input === 'string' ? input : input.url || String(input);
      const prefix = 'https://fabioibanez.github.io/website/';
      return nativeFetch(url.startsWith(prefix) ? '/engine/' + url.slice(prefix.length) : input, options);
    };
    const {Engine} = await import('/engine/engine-local.js');
    const engine = await Engine.create('c');
    engine.fs = {'main.cpp':source};
    let stderr='';engine.stderr.on('data', bytes => {stderr += new TextDecoder().decode(bytes);});
    const artifact = new Promise(resolve => engine.debugger.on('artifact', item => {if(item.name==='pre.wasm') resolve(item.data);}));
    const run = engine.run();
    const bytes = await Promise.race([artifact,run.then(result=>{throw new Error(JSON.stringify(result)+' '+stderr);})]);
    let data='';for(let i=0;i<bytes.length;i+=8192)data+=String.fromCharCode(...bytes.subarray(i,i+8192));
    engine.stop();return btoa(data);
  }, source);
  const binary = await compile(source);
  const localSource = fs.readFileSync(path.join(__dirname, 'fixtures/variable-tree.cpp'), 'utf8').trimEnd();
  const localBinary = await compile(localSource);
  async function start(binary,sourcePath,line) {
    await page.evaluate(async ({binary,sourcePath,line}) => {
      window.testEvents=[];
      window.webkit={messageHandlers:{cppDebugger:{postMessage:data=>window.testEvents.push(JSON.parse(JSON.stringify(data)))}}};
      const {createDebugger}=await import('/debugger/debugger.js');
      window.testDebugger=createDebugger();
      void window.testDebugger.start({binary,sourcePath,breakpoints:[line]});
    },{binary,sourcePath,line});
    return waitEvent('paused');
  }
  async function waitEvent(event,after=0) {
    await page.waitForFunction(({event,after})=>window.testEvents.slice(after).some(item=>item.event===event||item.event==='error'),{event,after},{timeout:15000});
    const events=await page.evaluate(()=>window.testEvents);
    const index=events.findIndex((item,i)=>i>=after&&(item.event===event||item.event==='error'));
    const result=events[index]; if(result.event==='error')throw new Error(JSON.stringify(result));
    return {result,index};
  }
  function node(roots,scope,name) {
    const result=roots.find(n=>n.name===name && n.path[1]===scope);
    assert.ok(result,`Missing ${scope} ${name}: ${JSON.stringify(roots)}`);return result;
  }
  async function expand(item) {
    const before=await page.evaluate(()=>window.testEvents.length);
    await page.evaluate(id=>window.testDebugger.toggleVariable(id),item.id);
    return (await waitEvent('variables',before)).result.variables;
  }
  async function step() {
    const before=await page.evaluate(()=>window.testEvents.length);
    await page.evaluate(()=>window.testDebugger.command('next'));
    return (await waitEvent('paused',before)).result;
  }
  let stop=(await start(binary,'/main.cpp',cppBreakpoint)).result;
  let roots=stop.variables;
  assert.equal(stop.line,cppBreakpoint);
  assert.equal(node(roots,'Globals','count').value,'5');
  assert.equal(node(roots,'Globals','MAXN').value,'1000');
  assert.equal(node(roots,'Globals','NEG').value,'-150');
  assert.equal(node(roots,'Globals','BIG').value,'4000000000');
  assert.equal(node(roots,'Globals','FLAG').value,'true');
  assert.equal(node(roots,'Locals','count').value,'17');
  assert.equal(node(roots,'Locals','local').value,'42');
  assert.equal(node(roots,'Globals','a').value,'size = 1000');
  assert.equal(node(roots,'Globals','a').reference,0);
  assert.equal(node(roots,'Globals','medium').value,'size = 150');
  assert.equal(node(roots,'Globals','aliasArray').value,'size = 150');
  assert.equal(node(roots,'Globals','grid').value,'size = 300');
  assert.equal(node(roots,'Globals','grid').type,'int[2][150]');
  assert.equal(node(roots,'Globals','ns::counter').value,'11');
  assert.equal(node(roots,'Globals','ready').value,'true');
  assert.equal(node(roots,'Globals','ratio').value,'1.5');
  assert.equal(node(roots,'Globals','negative').value,'-5000000000');
  roots=await expand(node(roots,'Globals','small'));
  assert.deepEqual(node(roots,'Globals','small').children.map(v=>v.value),['10','20','30']);
  roots=await expand(node(roots,'Globals','matrix'));
  let matrix=node(roots,'Globals','matrix');
  assert.equal(matrix.type,'int[2][3]');
  assert.equal(matrix.children.length,2);
  assert.equal(matrix.children[1].type,'int[3]');
  roots=await expand(matrix.children[1]);
  matrix=node(roots,'Globals','matrix');
  assert.deepEqual(matrix.children[1].children.map(v=>v.value),['4','5','6']);
  stop=await step();assert.equal(stop.line,cppBreakpoint+1);assert.equal(node(stop.variables,'Locals','local').value,'43');
  assert.equal(node(stop.variables,'Globals','count').value,'5');
  stop=await step();assert.equal(stop.line,cppBreakpoint+2);assert.equal(node(stop.variables,'Globals','count').value,'9');
  assert.equal(node(stop.variables,'Globals','matrix').children[1].expanded,true);
  await page.evaluate(()=>window.testDebugger.stop());
  console.log('PASS C++: globals, namespaces, scalar types, shadowing, typedef, 150/1000 element arrays, 2-D arrays, nested expansion, steps');

  const cBinary=fs.readFileSync(path.join(__dirname,'fixtures/globals-dwarf5.wasm')).toString('base64');
  stop=(await start(cBinary,'/Tests/CPPDebugger/staged-globals/fixtures/globals.c',8)).result;
  assert.equal(stop.line,8);
  assert.equal(node(stop.variables,'Locals','local').value,'42');
  assert.equal(node(stop.variables,'Globals','count').value,'5');
  assert.equal(node(stop.variables,'Globals','a').value,'size = 1000');
  roots=await expand(node(stop.variables,'Globals','small'));
  assert.deepEqual(node(roots,'Globals','small').children.map(v=>v.value),['10','20','30']);
  await page.evaluate(()=>window.testDebugger.stop());
  console.log('PASS C: Clang C11 fixture, indexed DWARF addresses, scalar, large and small arrays');

  const dwarf4=fs.readFileSync(path.join(__dirname,'fixtures/globals-dwarf4.wasm')).toString('base64');
  stop=(await start(dwarf4,'/Tests/CPPDebugger/staged-globals/fixtures/globals.c',8)).result;
  assert.equal(node(stop.variables,'Globals','count').value,'5');
  assert.equal(node(stop.variables,'Globals','a').value,'size = 1000');
  await page.evaluate(()=>window.testDebugger.stop());
  console.log('PASS C: direct DW_OP_addr locations');

  const invalid=corruptFirstDebugAddress(fs.readFileSync(path.join(__dirname,'fixtures/globals-dwarf5.wasm')));
  stop=(await start(invalid,'/Tests/CPPDebugger/staged-globals/fixtures/globals.c',8)).result;
  assert.equal(stop.variables.find(n=>n.name==='count' && n.path[1]==='Globals'),undefined);
  assert.equal(node(stop.variables,'Globals','a').value,'size = 1000');
  assert.equal(node(stop.variables,'Locals','local').value,'42');
  await page.evaluate(()=>window.testDebugger.stop());
  console.log('PASS invalid debug address: no guessed value or local regression');

  const unknown=removeArrayCounts(Buffer.from(binary,'base64'));
  stop=(await start(unknown,'/main.cpp',cppBreakpoint)).result;
  const unknownArray=node(stop.variables,'Globals','a');
  assert.equal(unknownArray.value,'size = ?');
  assert.equal(unknownArray.type,'int[?]');
  assert.equal(unknownArray.reference,0);
  await page.evaluate(()=>window.testDebugger.stop());
  console.log('PASS unknown DWARF bounds: size = ?, not expandable');

  stop=(await start(localBinary,'/main.cpp',11)).result;
  roots=stop.variables;
  assert.equal(node(roots,'Locals','large').value,'size = 120');
  assert.equal(node(roots,'Locals','numbers').value,'size = 3');
  assert.equal(node(roots,'Locals','greeting').value,'"hello"');
  roots=await expand(node(roots,'Locals','person'));
  let person=node(roots,'Locals','person');
  assert.equal(person.children.find(v=>v.name==='age').value,'25');
  roots=await expand(person.children.find(v=>v.name==='position'));
  person=node(roots,'Locals','person');
  assert.equal(person.children.find(v=>v.name==='position').children.find(v=>v.name==='x').value,'1');
  roots=await expand(person.children.find(v=>v.name==='marks'));
  person=node(roots,'Locals','person');
  assert.deepEqual(person.children.find(v=>v.name==='marks').children.map(v=>v.value),['3','4','5']);
  stop=await step();assert.equal(stop.line,12);
  person=node(stop.variables,'Locals','person');
  assert.equal(person.children.find(v=>v.name==='age').value,'26');
  assert.equal(person.children.find(v=>v.name==='position').expanded,true);
  assert.equal(node(stop.variables,'Locals','numbers').value,'size = 3');
  assert.equal(node(stop.variables,'Locals','greeting').value,'"hello"');
  await page.evaluate(()=>window.testDebugger.stop());
  console.log('PASS existing locals: structures, nested arrays, string, vector, step and retained expansion');
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.close();});
