(() => {
  if (window.codeAppDebugEditorInstalled) return;
  window.codeAppDebugEditorInstalled = true;
  editor.updateOptions({ glyphMargin: true });

  const style = document.createElement("style");
  style.textContent = `
    .codeapp-breakpoint { background: #e04b45; border-radius: 50%;
      width: 12px !important; height: 12px !important; margin: 4px; }
    .codeapp-debug-line { background: rgba(255, 210, 70, 0.22); }
    .codeapp-debug-arrow, .codeapp-debug-arrow-breakpoint {
      background-repeat: no-repeat; background-position: center; background-size: 18px 18px;
    }
    .codeapp-debug-arrow {
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M4 2.75h7l5.75 7.25L11 17.25H4a1 1 0 0 1-1-1V3.75a1 1 0 0 1 1-1Z' fill='%23ffcc00' stroke='%23ffcc00' stroke-width='1.5' stroke-linejoin='round'/%3E%3C/svg%3E");
    }
    .codeapp-debug-arrow-breakpoint {
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M4 2.75h7l5.75 7.25L11 17.25H4a1 1 0 0 1-1-1V3.75a1 1 0 0 1 1-1Z' fill='none' stroke='%23ffcc00' stroke-width='1.8' stroke-linejoin='round'/%3E%3Ccircle cx='8.5' cy='10' r='3' fill='%23e04b45'/%3E%3C/svg%3E");
    }
  `;
  document.head.appendChild(style);

  const decorations = new Map();
  let execution = null;

  function linesFor(model) {
    const ids = decorations.get(model.uri.toString()) || [];
    return ids.map(id => model.getDecorationRange(id)?.startLineNumber)
      .filter(line => line !== undefined);
  }

  function notify(model) {
    window.webkit.messageHandlers.toggleMessageHandler.postMessage({
      Event: "C++ Breakpoints Changed", URI: model.uri.toString(), lines: linesFor(model),
    });
  }

  function pausedLineFor(model) {
    if (!execution || execution.model !== model) return null;
    return model.getDecorationRange(execution.ids[0])?.startLineNumber ?? execution.line;
  }

  function showBreakpoints(model, lines) {
    const uri = model.uri.toString();
    const pausedLine = pausedLineFor(model);
    const items = lines.map(number => ({
      range: new monaco.Range(number, 1, number, 1),
      options: {
        isWholeLine: true,
        glyphMarginClassName: number === pausedLine ? "" : "codeapp-breakpoint",
      },
    }));
    decorations.set(uri, model.deltaDecorations(decorations.get(uri) || [], items));
  }

  function showExecution() {
    if (!execution) return;
    const { model } = execution;
    const line = pausedLineFor(model);
    const hasBreakpoint = linesFor(model).includes(line);
    execution.line = line;
    execution.ids = model.deltaDecorations(execution.ids, [{
      range: new monaco.Range(line, 1, line, 1),
      options: {
        isWholeLine: true,
        className: "codeapp-debug-line",
        glyphMarginClassName: hasBreakpoint ? "codeapp-debug-arrow-breakpoint" : "codeapp-debug-arrow",
      },
    }]);
  }

  function toggleBreakpoint(line) {
    const model = editor.getModel();
    if (!model || !line || !["c", "cpp"].includes(model.getLanguageId())) return;
    const lines = linesFor(model);
    const index = lines.indexOf(line);
    if (index < 0) lines.push(line); else lines.splice(index, 1);
    showBreakpoints(model, lines);
    if (execution?.model === model) showExecution();
    notify(model);
  }

  editor.onMouseDown(event => {
    if (event.target.type !== monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) return;
    toggleBreakpoint(event.target.position?.lineNumber);
  });

  window.codeAppDebugToggleBreakpoint = toggleBreakpoint;

  window.codeAppDebugBreakpoints = () => {
    const model = editor.getModel();
    return model ? linesFor(model) : [];
  };

  window.codeAppDebugShowLine = (uri, line) => {
    if (execution) {
      const previousModel = execution.model;
      previousModel.deltaDecorations(execution.ids, []);
      execution = null;
      showBreakpoints(previousModel, linesFor(previousModel));
    }
    if (!line) return;
    const model = monaco.editor.getModel(monaco.Uri.parse(uri));
    if (!model) return;
    execution = { model, line, ids: [] };
    showBreakpoints(model, linesFor(model));
    showExecution();
    if (editor.getModel() === model) editor.revealLineInCenterIfOutsideViewport(line);
  };
})();
