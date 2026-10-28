const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(
  path.join(__dirname, "../../LanguageResources/ClangLib/debugger/debugger.js"), "utf8"
).replace('import { Engine } from "./engine.js";', "")
  .replace("export function createDebugger()", "function createDebugger()");
const context = { window: { fetch() {} }, DataView, Uint8Array, TextDecoder };
vm.runInNewContext(source + "\nglobalThis.container = libcppContainerSummary;\nglobalThis.array = arraySummary;", context);

const memory = { buffer: new ArrayBuffer(4096) };
const view = new DataView(memory.buffer);
const write = (base, offset, value) => view.setUint32(base + offset, value, true);
const variable = (type, address, value = `@0x${address.toString(16)}`) => ({
  type, value, memoryReference: `0x${address.toString(16)}`,
});
const size = (type, address, value) => context.container(variable(type, address, value), memory);

write(128, 0, 1024);
write(128, 4, 1036);
assert.equal(size("std::vector<int, std::allocator<int> >", 128), "size = 3");
write(128, 4, 1044);
assert.equal(size("std::vector<int>", 128), "size = 5");
assert.equal(size("std::vector<double>", 128), "size = ?");

write(160, 0, 1200);
write(160, 4, 1236);
assert.equal(size("std::vector<std::string>", 160), "size = 3");
write(160, 4, 1224);
assert.equal(size("std::__2::vector<std::__2::vector<int> >", 160), "size = 2");
write(192, 4, 11);
assert.equal(size("std::vector<bool, std::allocator<bool> >", 192), "size = 11");

write(224, 20, 4);
assert.equal(size("std::queue<int, std::deque<int, std::allocator<int> > >", 224), "size = 4");
assert.equal(size("std::stack<int>", 224), "size = 4");
assert.equal(size("std::queue<int, MyContainer>", 224), "size = ?");
assert.equal(size("std::deque<int, std::allocator<int> >", 224), "size = 4");
assert.equal(size("std::priority_queue<int>", 128), "size = 5");
assert.equal(size("std::priority_queue<int, std::vector<int, std::allocator<int> >, std::greater<int> >", 128), "size = 5");
assert.equal(size("std::stack<int, std::vector<int, std::allocator<int> > >", 128), "size = 5");
write(352, 0, 2048);
write(352, 4, 2072);
assert.equal(size("std::vector<std::pair<int, int> >", 352), "size = 3");
assert.equal(size("std::priority_queue<std::pair<int, int>, std::vector<std::pair<int, int> > >", 352), "size = 3");
write(352, 4, 2080);
assert.equal(size("std::priority_queue<std::pair<char, double> >", 352), "size = 2");
assert.equal(size("std::priority_queue<std::pair<int, std::string> >", 352), "size = 2");
assert.equal(size("std::priority_queue<std::pair<int, Widget> >", 352), "size = ?");
write(256, 8, 7);
assert.equal(size("std::map<int, int, std::less<int>, std::allocator<std::pair<const int, int> > >", 256), "size = 7");
assert.equal(size("std::set<int, std::less<int>, std::allocator<int> >", 256), "size = 7");
assert.equal(size("std::map<int, int, CustomCompare>", 256), "size = ?");
assert.equal(size("std::list<int, std::allocator<int> >", 256), "size = 7");
assert.equal(size("std::multimap<int, int, std::greater<int> >", 256), "size = 7");
assert.equal(size("std::multiset<int, std::less<int> >", 256), "size = 7");
write(288, 12, 9);
assert.equal(size("std::unordered_map<int, int, std::hash<int>, std::equal_to<int>, std::allocator<std::pair<const int, int> > >", 288), "size = 9");
assert.equal(size("std::unordered_set<int, std::hash<int>, std::equal_to<int>, std::allocator<int> >", 288), "size = 9");
assert.equal(size("std::unordered_multiset<int>", 288), "size = 9");
assert.equal(size("std::unordered_multimap<int, int>", 288), "size = 9");
write(288, 12, 0);
assert.equal(size("std::unordered_map<std::string, int>", 288), "size = 0");

write(320, 0, 128); // reference slot; the displayed address identifies its target
assert.equal(size("const std::vector<int>&", 320, "@0x80"), "size = 5");
assert.equal(size("std::vector<int>&", 320, "<unavailable>"), "size = ?");
assert.equal(size("std::vector<Widget>", 128), "size = ?");
assert.equal(size("std::vector<int, CustomAllocator>", 128), "size = ?");
assert.equal(context.container(variable("std::vector<int>*", 128), memory), null);
assert.equal(context.container(variable("std::string", 128), memory), null);
assert.equal(context.container(variable("std::vector<int>", 128), null), "size = ?");
assert.equal(context.container({ type: "std::array<int, 4ul>" }, null), "size = 4");
assert.equal(context.container({ type: "std::array<int, 0>" }, null), "size = 0");

assert.equal(context.array({ type: "int[100]", value: "@0x80" }), null);
assert.equal(context.array({ type: "int[101]", value: "@0x80" }).value, "size = 101");
assert.equal(context.array({ type: "int[10][20]", value: "@0x80" }).value, "size = 200");
assert.equal(context.array({ type: "int[-106]", value: "@0x80" }).type, "int[?]");
assert.equal(context.array({ type: "IntArray", value: "@0x80", codeappArrayLength: 150 }).value, "size = 150");
assert.equal(context.array({ type: "int[?]", value: "@0x80", codeappArrayLength: null }).value, "size = ?");
assert.equal(context.array({ type: "int[2][3]", value: "@0x80", codeappArrayLength: 6 }), null);
console.log("libc++ container size tests passed");
