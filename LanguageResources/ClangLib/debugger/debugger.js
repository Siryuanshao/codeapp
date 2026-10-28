// debugger-sh also prefetches its toolchain on the page. The worker has the
// same local mapping in engine.js, so debugging works without a network.
const nativeFetch = window.fetch.bind(window);
window.fetch = (input, options) => {
  const url = typeof input === "string" ? input : input.url || String(input);
  const upstream = "https://fabioibanez.github.io/website/";
  if (!url.startsWith(upstream)) return nativeFetch(input, options);
  const name = url.slice(upstream.length);
  const asset = name === "llvm.core.wasm" ? "adapter.wasm"
    : name === "llvm-resources.tar.gz" ? "empty.tar.gz" : name;
  return nativeFetch(`/debugger/${asset}`, options);
};

import { Engine } from "./engine.js";

// The app's libc++ ABI stores characters inline with a trailing size byte, or
// a pointer, size and tagged capacity when the string is heap allocated.
function formatLibcppString(variable, memory) {
  const type = variable.type || "";
  if (!(type === "std::string" || /^std::(?:__\d+::)?basic_string<char(?:,|>)/.test(type)) ||
      !variable.value?.startsWith("<error:") || !memory?.buffer || !variable.memoryReference) {
    return variable.value;
  }

  const address = Number(variable.memoryReference);
  const buffer = memory.buffer;
  if (!Number.isSafeInteger(address) || address < 0 || address + 12 > buffer.byteLength) {
    return variable.value;
  }
  const view = new DataView(buffer);
  const tag = view.getUint8(address + 11);
  let start = address;
  let length = tag;
  if (tag & 0x80) {
    const capacity = view.getUint32(address + 8, true) & 0x7fffffff;
    length = view.getUint32(address + 4, true);
    start = view.getUint32(address, true);
    if (length >= capacity || (length && !start)) return variable.value;
  } else if (length > 10) {
    return variable.value;
  }
  if (start + length > buffer.byteLength) return variable.value;

  const limit = 4096;
  const truncated = length > limit;
  const bytes = new Uint8Array(buffer, start, Math.min(length, limit));
  let value;
  try {
    value = JSON.stringify(new TextDecoder("utf-8", { fatal: true }).decode(bytes, { stream: truncated }));
  } catch (_) {
    value = '"' + Array.from(bytes, byte => {
      if (byte === 34 || byte === 92) return "\\" + String.fromCharCode(byte);
      if (byte >= 32 && byte <= 126) return String.fromCharCode(byte);
      return "\\x" + byte.toString(16).padStart(2, "0");
    }).join("") + '"';
  }
  return value + (truncated ? "…" : "");
}

// Code App uses the wasm32 libc++ shipped with the app. Its standard
// containers keep their size in memory even when the engine cannot expand them.
function cppTemplate(type) {
  type = type.replace(/std::__\d+::/g, "std::").replace(/^\s*(?:const|volatile)\s+/, "")
    .replace(/\s*&&?\s*$/, "").trim();
  const open = type.indexOf("<");
  if (open < 0 || !type.endsWith(">")) return null;
  const args = [];
  let depth = 0, start = open + 1;
  for (let i = start; i < type.length - 1; i++) {
    if (type[i] === "<") depth++;
    else if (type[i] === ">") depth--;
    else if (type[i] === "," && depth === 0) {
      args.push(type.slice(start, i).trim());
      start = i + 1;
    }
  }
  args.push(type.slice(start, -1).trim());
  return { name: type.slice(0, open).trim(), args };
}

function cppElementLayout(type) {
  type = type.replace(/std::__\d+::/g, "std::").replace(/^\s*(?:const|volatile)\s+/, "").trim();
  if (type.endsWith("*")) return { size: 4, align: 4 };
  const sizes = {
    bool: 1, char: 1, "signed char": 1, "unsigned char": 1,
    short: 2, "short int": 2, "unsigned short": 2, "unsigned short int": 2, "short unsigned int": 2,
    int: 4, "unsigned int": 4, unsigned: 4, long: 4, "long int": 4,
    "unsigned long": 4, "unsigned long int": 4, "long unsigned int": 4, float: 4,
    "long long": 8, "long long int": 8, "unsigned long long": 8,
    "unsigned long long int": 8, "long long unsigned int": 8, double: 8,
  };
  if (typeof sizes[type] === "number") return { size: sizes[type], align: sizes[type] };
  if (type === "std::string") return { size: 12, align: 4 };
  const template = cppTemplate(type);
  if (template?.name === "std::basic_string" && template.args[0] === "char" &&
      (template.args.length < 3 || template.args[2].startsWith("std::allocator<"))) return { size: 12, align: 4 };
  if (template?.name === "std::vector" &&
      (template.args.length === 1 || template.args[1].startsWith("std::allocator<"))) return { size: 12, align: 4 };
  if (template?.name === "std::pair" && template.args.length === 2) {
    const first = cppElementLayout(template.args[0]), second = cppElementLayout(template.args[1]);
    if (!first || !second) return null;
    const align = Math.max(first.align, second.align);
    const secondOffset = Math.ceil(first.size / second.align) * second.align;
    return { size: Math.ceil((secondOffset + second.size) / align) * align, align };
  }
  return null;
}

function libcppContainerSummary(variable, memory) {
  const type = variable.type || "";
  const template = cppTemplate(type);
  const kinds = ["std::array", "std::vector", "std::deque", "std::list", "std::queue", "std::stack", "std::priority_queue",
    "std::map", "std::multimap", "std::set", "std::multiset",
    "std::unordered_map", "std::unordered_multimap", "std::unordered_set", "std::unordered_multiset"];
  if (!template || !kinds.includes(template.name)) return null;

  const unavailable = "size = ?";
  if (template.name === "std::array") {
    const count = /^(\d+)(?:u|l|ul|lu|ull|llu)?$/i.exec(template.args[1] || "");
    return count ? `size = ${count[1]}` : unavailable;
  }
  if (!memory?.buffer || !variable.memoryReference) return unavailable;
  // References are represented by a pointer slot; their displayed address is
  // the address of the referred-to container.
  const isReference = /&\s*$/.test(type);
  const displayedAddress = isReference && /^@(0x[\da-f]+|\d+)$/i.exec(variable.value || "");
  if (isReference && !displayedAddress) return unavailable;
  const address = Number(displayedAddress ? displayedAddress[1] : variable.memoryReference);
  const buffer = memory.buffer;
  let storage = template;
  if (["std::queue", "std::stack", "std::priority_queue"].includes(template.name)) {
    storage = template.args.length > 1 ? cppTemplate(template.args[1])
      : { name: template.name === "std::priority_queue" ? "std::vector" : "std::deque", args: [template.args[0]] };
    if (!storage || !["std::vector", "std::deque", "std::list"].includes(storage.name)) return unavailable;
  }
  const name = storage.name, args = storage.args;
  const hashed = name.startsWith("std::unordered_");
  const set = name.endsWith("set");
  const bytesNeeded = name === "std::deque" ? 24 : hashed ? 16 : name === "std::vector" ? 8 : 12;
  if (!Number.isSafeInteger(address) || address < 0 || address + bytesNeeded > buffer.byteLength) return unavailable;
  const view = new DataView(buffer);
  const at = offset => view.getUint32(address + offset, true);
  let size;
  if (name === "std::vector") {
    if (args.length > 1 && !args[1].startsWith("std::allocator<")) return unavailable;
    if (args[0] === "bool") size = at(4);
    else {
      const begin = at(0), end = at(4), elementSize = cppElementLayout(args[0])?.size;
      if (begin === end) size = 0;
      else if (elementSize && end > begin && (end - begin) % elementSize === 0) size = (end - begin) / elementSize;
    }
  } else if (name === "std::deque" || name === "std::list") {
    if (args.length > 1 && !args[1].startsWith("std::allocator<")) return unavailable;
    size = at(name === "std::deque" ? 20 : 8);
  } else {
    const allocatorIndex = (set ? 1 : 2) + (hashed ? 2 : 1);
    if (args.length > allocatorIndex && !args[allocatorIndex].startsWith("std::allocator<")) return unavailable;
    const compareIndex = set ? 1 : 2;
    if (args.length > compareIndex && !(hashed ? args[compareIndex].startsWith("std::hash<")
      : /^(?:std::less|std::greater)</.test(args[compareIndex]))) return unavailable;
    if (hashed && args.length > compareIndex + 1 && !args[compareIndex + 1].startsWith("std::equal_to<")) return unavailable;
    size = at(hashed ? 12 : 8);
  }
  return size === undefined ? unavailable : `size = ${size}`;
}

function arraySummary(variable) {
  const type = variable.type || "";
  if (!/\[\s*-?\d+\s*\]\s*$/.test(type) || !String(variable.value || "").startsWith("@")) return null;
  const dimensions = [...type.matchAll(/\[\s*(-?\d+)\s*\]/g)].map(match => Number(match[1]));
  if (dimensions.some(size => size < 0)) {
    return { type: type.replace(/\[\s*-\d+\s*\]/g, "[?]"), value: "size = ?" };
  }
  const count = dimensions.reduce((total, size) => total * size, 1);
  return count > 100 ? { type, value: `size = ${count}` } : null;
}

export function createDebugger() {
  let current = null;
  let sequence = 0;
  const childrenPerPage = 100;

  const emit = (event, data = {}) => {
    window.webkit.messageHandlers.cppDebugger.postMessage({ event, ...data });
  };

  function request(session, command, args = {}) {
    return session.engine.debugger.send({
      type: "request", seq: ++sequence, command, arguments: args,
    });
  }

  function updateBreakpoints(session) {
    return request(session, "setBreakpoints", {
      source: { path: session.sourcePath },
      breakpoints: session.breakpoints.map(line => ({ line })),
    });
  }

  function schedule(session, action, delay = 0) {
    setTimeout(() => {
      if (current !== session) return;
      try {
        action();
      } catch (error) {
        current = null;
        session.engine.stop();
        emit("error", { message: String(error) });
      }
    }, delay);
  }

  function configure(session) {
    if (current !== session || session.configured) return;
    const points = updateBreakpoints(session);
    request(session, "setExceptionBreakpoints", { filters: [] });
    const done = request(session, "configurationDone");
    if (!done?.success) {
      schedule(session, () => configure(session), 50);
      return;
    }
    session.configured = true;
    emit("running", { breakpoints: points?.body?.breakpoints || [] });
  }

  function variableNode(session, variable, path) {
    const variablePath = [...path, variable.name];
    const id = JSON.stringify(variablePath);
    const container = libcppContainerSummary(variable, session.engine.debuggeeMemory);
    const array = arraySummary(variable);
    const node = {
      id,
      path: variablePath,
      name: variable.name,
      value: container ?? array?.value ?? formatLibcppString(variable, session.engine.debuggeeMemory),
      type: array?.type || variable.type || "",
      reference: container !== null || array ? 0 : variable.variablesReference || 0,
      childCount: (variable.namedVariables || 0) + (variable.indexedVariables || 0),
      expanded: session.expanded.has(id),
      children: [],
      hasMore: false,
      error: "",
    };
    session.nodes.set(id, node);
    if (node.expanded && node.reference) {
      readChildren(session, node, session.expanded.get(id));
    }
    return node;
  }

  function readChildren(session, node, count) {
    try {
      const response = request(session, "variables", {
        variablesReference: node.reference, start: 0, count,
      });
      if (!response?.success) throw new Error(response?.message || "Unable to read variable");
      node.error = "";
      node.children = (response.body?.variables || []).map(variable =>
        variableNode(session, variable, node.path));
      node.hasMore = node.children.length < node.childCount;
    } catch (error) {
      node.error = String(error);
      node.children = [];
      node.hasMore = false;
    }
  }

  function toggleVariable(id) {
    const session = current;
    const node = session?.nodes.get(id);
    if (!session?.paused || !node?.reference) return;
    node.expanded = !node.expanded;
    if (node.expanded) {
      const count = Math.max(childrenPerPage, node.children.length);
      session.expanded.set(id, count);
      readChildren(session, node, count);
    } else {
      session.expanded.delete(id);
    }
    emit("variables", { variables: session.variables });
  }

  function loadMoreVariables(id) {
    const session = current;
    const node = session?.nodes.get(id);
    if (!session?.paused || !node?.expanded || !node.hasMore) return;
    const count = node.children.length + childrenPerPage;
    session.expanded.set(id, count);
    readChildren(session, node, count);
    emit("variables", { variables: session.variables });
  }

  function onStopped(session, event) {
    if (current !== session) return;
    session.paused = true;
    session.nodes = new Map();
    const stack = request(session, "stackTrace", { threadId: 1 });
    const frame = stack?.body?.stackFrames?.[0];
    if (!frame) {
      emit("paused", { reason: event.body?.reason, line: 0, variables: [] });
      return;
    }
    const scopes = request(session, "scopes", { frameId: frame.id });
    const variables = (scopes?.body?.scopes || []).flatMap(scope => {
      const result = request(session, "variables", { variablesReference: scope.variablesReference });
      return (result?.body?.variables || []).map(variable =>
        variableNode(session, variable, [frame.name, scope.name]));
    });
    session.variables = variables;
    emit("paused", {
      reason: event.body?.reason,
      line: frame.line,
      sourcePath: frame.source?.path,
      variables,
    });
  }

  async function start({ binary, sourcePath, breakpoints }) {
    const session = {
      sourcePath, breakpoints, configured: false, stopped: false, paused: false,
      expanded: new Map(), nodes: new Map(), variables: [],
    };
    current = session;
    try {
      session.engine = await Engine.create("c");
      if (session.stopped) return;
      // The adapter supplies the native Clang output at the engine's link step.
      session.engine.fs = {
        "main.cpp": "int main() { return 0; }",
        "codeapp-debug-program.b64": binary,
      };
      const outDecoder = new TextDecoder();
      const errDecoder = new TextDecoder();
      session.engine.stdout.on("data", bytes => emit("output", {
        text: outDecoder.decode(bytes, { stream: true }),
      }));
      session.engine.stderr.on("data", bytes => emit("output", {
        text: errDecoder.decode(bytes, { stream: true }),
      }));
      session.engine.debugger.on("event", event => {
        if (current !== session || event.type !== "event") return;
        // DAP events are emitted while the adapter is handling a message;
        // send the next request after that handler has returned.
        if (event.event === "initialized") schedule(session, () => configure(session));
        if (event.event === "stopped") schedule(session, () => onStopped(session, event));
      });
      const run = session.engine.run();
      request(session, "initialize");
      const result = await run;
      if (current !== session) return;
      current = null;
      if (result.type === "completed") emit("exited", { code: result.exitCode });
      else if (result.type === "stopped") emit("stopped");
      else emit("error", { message: result.error?.message || "Debugger failed." });
    } catch (error) {
      if (current !== session) return;
      current = null;
      emit("error", { message: String(error) });
    }
  }

  function stop() {
    if (!current) return;
    const session = current;
    current = null;
    session.stopped = true;
    if (session.engine) session.engine.stop();
  }

  function command(name) {
    if (!current?.configured) return;
    const response = request(current, name, { threadId: 1 });
    if (response?.success) {
      current.paused = false;
      emit("running");
    }
  }

  function setBreakpoints(lines) {
    if (!current) return;
    current.breakpoints = lines;
    if (current.configured) updateBreakpoints(current);
  }

  function input(text) {
    if (current?.engine) void current.engine.stdin.write(text);
  }

  return { start, stop, command, setBreakpoints, input, toggleVariable, loadMoreVariables };
}
