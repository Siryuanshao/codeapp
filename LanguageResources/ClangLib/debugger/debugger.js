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

  function onStopped(session, event) {
    if (current !== session) return;
    const stack = request(session, "stackTrace", { threadId: 1 });
    const frame = stack?.body?.stackFrames?.[0];
    if (!frame) {
      emit("paused", { reason: event.body?.reason, line: 0, variables: [] });
      return;
    }
    const scopes = request(session, "scopes", { frameId: frame.id });
    const variables = (scopes?.body?.scopes || []).flatMap(scope => {
      const result = request(session, "variables", { variablesReference: scope.variablesReference });
      return result?.body?.variables || [];
    });
    emit("paused", {
      reason: event.body?.reason,
      line: frame.line,
      sourcePath: frame.source?.path,
      variables,
    });
  }

  async function start({ binary, sourcePath, breakpoints }) {
    const session = { sourcePath, breakpoints, configured: false, stopped: false };
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
    if (response?.success) emit("running");
  }

  function setBreakpoints(lines) {
    if (!current) return;
    current.breakpoints = lines;
    if (current.configured) updateBreakpoints(current);
  }

  function input(text) {
    if (current?.engine) void current.engine.stdin.write(text);
  }

  return { start, stop, command, setBreakpoints, input };
}
