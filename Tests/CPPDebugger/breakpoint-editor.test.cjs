const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

// MONACO_BUNDLE points to the monaco-textmate.bundle from a built app.
const bundle = process.env.MONACO_BUNDLE;
if (!bundle) throw new Error('Set MONACO_BUNDLE to the built monaco-textmate.bundle directory');
const script = fs.readFileSync(path.join(__dirname, '../../LanguageResources/ClangLib/debugger/editor.js'), 'utf8');
const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const file = path.join(bundle, pathname === '/' ? 'index.html' : pathname);
  if (!file.startsWith(path.resolve(bundle) + path.sep) || !fs.existsSync(file)) {
    response.writeHead(404).end();
    return;
  }
  const type = file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html';
  response.writeHead(200, {'Content-Type': type});
  fs.createReadStream(file).pipe(response);
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.addInitScript(() => {
      window.breakpointEvents = [];
      window.webkit = {messageHandlers: {toggleMessageHandler: {postMessage: event => {
        if (event.Event === 'C++ Breakpoints Changed') window.breakpointEvents.push(event);
      }}}};
    });
    await page.goto(`http://127.0.0.1:${server.address().port}/`, {waitUntil: 'domcontentloaded'});
    await page.waitForFunction(() => window.editor && window.monaco, null, {timeout: 20000});
    await page.addScriptTag({content: script});
    const result = await page.evaluate(async () => {
      const uriA = 'file:///tmp/project-a/main.cpp';
      const uriB = 'file:///tmp/project-b/main.cpp';
      const source = 'int main() {\n  int x = 1;\n  x++;\n  return x;\n}';
      const create = uri => monaco.editor.createModel(source, 'cpp', monaco.Uri.parse(uri));
      const lines = () => codeAppDebugBreakpoints();
      const events = () => window.breakpointEvents.splice(0);
      const edit = (model, range, text) => model.applyEdits([{range, text}]);
      const range = (startLine, startCol, endLine, endCol) =>
        new monaco.Range(startLine, startCol, endLine, endCol);
      const settle = () => new Promise(resolve => setTimeout(resolve, 50));
      const checks = [];
      const check = (label, actual, expected) => {
        checks.push({label, actual, expected});
      };

      let first = create(uriA);
      editor.setModel(first);
      codeAppDebugRestoreBreakpoints(uriA, [3], '/tmp/project-a');
      await settle();
      check('restore without notifying', [lines(), events().length], [[3], 0]);

      edit(first, range(3, 1, 3, 1), '\n');
      await settle();
      check('newline inserted at breakpoint follows original code', lines(), [4]);
      let messages = events();
      check('move reports new line and original workspace', messages.map(e => [e.reason, e.workspace, e.lines]),
        [['move', '/tmp/project-a', [4]]]);

      edit(first, range(2, 1, 2, 1), '// new line\n');
      await settle();
      check('line inserted above breakpoint', lines(), [5]);
      check('insertion notifies once', events().map(e => e.lines), [[5]]);
      edit(first, range(2, 1, 3, 1), '');
      await settle();
      check('line removed above breakpoint', lines(), [4]);
      check('removal notifies once', events().map(e => e.lines), [[4]]);
      edit(first, range(2, 3, 2, 3), ' ');
      await settle();
      check('ordinary edit sends no breakpoint update', events().length, 0);
      codeAppDebugRestoreBreakpoints(uriA, [3], '/tmp/project-a');
      check('reopening existing model preserves live position', lines(), [4]);

      codeAppDebugShowLine(uriA, 4);
      await settle();
      check('painting execution line does not notify', events().length, 0);
      codeAppDebugToggleBreakpoint(4);
      await settle();
      check('toggle while paused notifies as toggle', events().map(e => [e.reason, e.lines]), [['toggle', []]]);
      codeAppDebugToggleBreakpoint(4);
      await settle();
      check('setting while paused notifies as toggle', events().map(e => [e.reason, e.lines]), [['toggle', [4]]]);
      codeAppDebugShowLine(uriA, 0);
      await settle();
      check('clearing execution line does not notify', events().length, 0);

      const second = create(uriB);
      editor.setModel(second);
      codeAppDebugRestoreBreakpoints(uriB, [2], '/tmp/project-b');
      await settle();
      check('same name in another directory is independent', [lines(), events().length], [[2], 0]);
      codeAppDebugToggleBreakpoint(3);
      await settle();
      check('toggle identifies its workspace', events().map(e => [e.workspace, e.lines]),
        [['/tmp/project-b', [2, 3]]]);
      editor.setModel(first);
      check('switching models preserves first breakpoints', lines(), [4]);

      codeAppDebugForgetBreakpoints('file:///tmp/project-b');
      editor.setModel(second);
      await settle();
      check('deleting folder clears its open model', [lines(), events().length], [[], 0]);
      editor.setModel(first);
      check('deleting another folder leaves first model alone', lines(), [4]);
      first.dispose();
      first = create(uriA);
      editor.setModel(first);
      codeAppDebugRestoreBreakpoints(uriA, [4], '/tmp/project-a');
      await settle();
      check('new model restores saved line', [lines(), events().length], [[4], 0]);
      return checks;
    });
    for (const check of result) assert.deepEqual(check.actual, check.expected, check.label);
    console.log(`PASS: ${result.length} real Monaco breakpoint restoration, editing, and debug marker checks`);
  } finally {
    await browser.close();
    server.close();
  }
})().catch(error => {
  console.error(error);
  server.close();
  process.exitCode = 1;
});
