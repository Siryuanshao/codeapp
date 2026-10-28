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
    const node = {
      id,
      path: variablePath,
      name: variable.name,
      value: variable.value,
      type: variable.type || "",
      reference: variable.variablesReference || 0,
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
