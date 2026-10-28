const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(
  path.join(__dirname, "../../LanguageResources/ClangLib/debugger/debugger.js"), "utf8"
).replace('import { Engine } from "./engine.js";', "")
  .replace("export function createDebugger()", "function createDebugger()");
const context = {
  window: { fetch() {} }, TextDecoder, DataView, Uint8Array,
};
vm.runInNewContext(source + "\nglobalThis.formatString = formatLibcppString;", context);

const memory = { buffer: new ArrayBuffer(16384) };
const bytes = new Uint8Array(memory.buffer);
const view = new DataView(memory.buffer);
const encoder = new TextEncoder();
const variable = { type: "std::string", value: "<error: __rep_>", memoryReference: "0x80" };

function short(value) {
  bytes.fill(0, 128, 140);
  const data = encoder.encode(value);
  bytes[139] = data.length;
  bytes.set(data, 128);
}

function long(data) {
  bytes.fill(0, 128, 140);
  const capacity = Math.ceil((data.length + 1) / 2) * 2;
  view.setUint32(128, 256, true);
  view.setUint32(132, data.length, true);
  view.setUint32(136, capacity | 0x80000000, true);
  bytes.set(data, 256);
}

for (const value of ["", "abc", "0123456789", "中文", "a\0b", '"\\\n']) {
  short(value);
  assert.equal(context.formatString(variable, memory), JSON.stringify(value));
}
for (const value of ["01234567890", "a longer string", "你好，调试器！"]) {
  long(encoder.encode(value));
  assert.equal(context.formatString(variable, memory), JSON.stringify(value));
}

long(Uint8Array.from([65, 128]));
assert.equal(context.formatString(variable, memory), '"A\\x80"');
long(encoder.encode("x".repeat(4095) + "中more"));
assert.equal(context.formatString(variable, memory), JSON.stringify("x".repeat(4095)) + "…");

view.setUint32(128, 16384, true);
assert.equal(context.formatString(variable, memory), variable.value);
assert.equal(context.formatString({ ...variable, type: "int" }, memory), variable.value);
assert.equal(context.formatString({ ...variable, value: '"upstream"' }, memory), '"upstream"');
assert.equal(context.formatString(variable, null), variable.value);
console.log("libc++ string formatter tests passed");
