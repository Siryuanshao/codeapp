const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(
  path.join(__dirname, "../../LanguageResources/ClangLib/debugger/debugger.js"), "utf8"
).replace('import { Engine } from "./engine.js";', "")
  .replace("export function createDebugger()", "function createDebugger()");

const events = [];
let engine;

class TestEngine {
  static async create() {
    engine = new TestEngine();
    return engine;
  }

  constructor() {
    this.step = 0;
    this.stdout = { on() {} };
    this.stderr = { on() {} };
    this.stdin = { write() {} };
    this.debugger = {
      on: (_, listener) => { this.listener = listener; },
      send: request => this.send(request),
    };
  }

  run() {
    setTimeout(() => this.emit("initialized"), 0);
    return new Promise(() => {});
  }

  stop() {}

  emit(event) {
    this.listener({ type: "event", event, body: { reason: "breakpoint" } });
  }

  send({ command, arguments: args }) {
    const response = body => ({ success: true, body });
    switch (command) {
      case "configurationDone":
        setTimeout(() => this.emit("stopped"), 0);
        return response({});
      case "stackTrace":
        return response({ stackFrames: [{ id: 1, name: "main", line: 10 + this.step }] });
      case "scopes":
        return response({ scopes: [{ name: "Locals", variablesReference: 1 }] });
      case "variables": {
        const variables = {
          1: [
            { name: "person", value: "@10", type: "Person", variablesReference: 2, namedVariables: 2 },
            { name: "numbers", value: "@20", type: "int[120]", variablesReference: 4, indexedVariables: 120 },
          ],
          2: [
            { name: "age", value: String(25 + this.step), type: "int", variablesReference: 0 },
            { name: "position", value: "@14", type: "Point", variablesReference: 3, namedVariables: 1 },
          ],
          3: [{ name: "x", value: "1", type: "int", variablesReference: 0 }],
          4: Array.from({ length: 120 }, (_, i) => ({
            name: `[${i}]`, value: String(i), type: "int", variablesReference: 0,
          })),
        }[args.variablesReference];
        const start = args.start || 0;
        return response({ variables: variables.slice(start, start + (args.count || variables.length)) });
      }
      case "next":
        this.step++;
        setTimeout(() => this.emit("stopped"), 0);
        return response({});
      default:
        return response({});
    }
  }
}

const window = {
  fetch() {},
  webkit: { messageHandlers: { cppDebugger: {
    postMessage: value => events.push(JSON.parse(JSON.stringify(value))),
  } } },
};
const context = { window, Engine: TestEngine, TextDecoder, setTimeout };
vm.runInNewContext(source + "\nglobalThis.createDebugger = createDebugger;", context);

async function waitFor(event, after = 0) {
  for (let i = 0; i < 100; i++) {
    const match = events.slice(after).find(item => item.event === event);
    if (match) return match;
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  throw new Error(`Timed out waiting for ${event}`);
}

function find(variables, name) {
  const variable = variables.find(item => item.name === name);
  assert.ok(variable, `Missing variable: ${name}`);
  return variable;
}

async function main() {
  const debuggerInstance = context.createDebugger();
  void debuggerInstance.start({ binary: "", sourcePath: "/main.cpp", breakpoints: [10] });
  let variables = (await waitFor("paused")).variables;

  async function toggle(variable) {
    const before = events.length;
    debuggerInstance.toggleVariable(variable.id);
    return (await waitFor("variables", before)).variables;
  }

  variables = await toggle(find(variables, "person"));
  let person = find(variables, "person");
  assert.equal(find(person.children, "age").value, "25");
  variables = await toggle(find(person.children, "position"));
  person = find(variables, "person");
  assert.equal(find(find(person.children, "position").children, "x").value, "1");

  variables = await toggle(find(variables, "numbers"));
  let numbers = find(variables, "numbers");
  assert.equal(numbers.children.length, 100);
  assert.equal(numbers.hasMore, true);
  let before = events.length;
  debuggerInstance.loadMoreVariables(numbers.id);
  variables = (await waitFor("variables", before)).variables;
  numbers = find(variables, "numbers");
  assert.equal(numbers.children.length, 120);
  assert.equal(find(numbers.children, "[119]").value, "119");
  assert.equal(numbers.hasMore, false);

  before = events.length;
  debuggerInstance.command("next");
  variables = (await waitFor("paused", before)).variables;
  person = find(variables, "person");
  assert.equal(person.expanded, true);
  assert.equal(find(person.children, "age").value, "26");
  assert.equal(find(person.children, "position").expanded, true);
  assert.equal(find(variables, "numbers").children.length, 120);

  variables = await toggle(person);
  assert.equal(find(variables, "person").expanded, false);
  variables = await toggle(find(variables, "person"));
  assert.equal(find(find(variables, "person").children, "position").expanded, true);
  debuggerInstance.stop();
  console.log("Variable tree tests passed");
}

main().catch(error => { console.error(error); process.exitCode = 1; });
