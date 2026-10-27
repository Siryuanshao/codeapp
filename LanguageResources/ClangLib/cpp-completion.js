(() => {
  if (window.codeAppClangCompletion) return;
  window.codeAppClangCompletion = true;

  const provider = {
    triggerCharacters: [".", ">", ":"],
    provideCompletionItems(model, position, _context, token) {
      return new Promise((resolve) => {
        const timer = setTimeout(async () => {
          if (token.isCancellationRequested) return resolve({ suggestions: [] });
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };
          // Monaco uses UTF-16 columns; Clang expects a 1-based UTF-8 byte offset.
          const prefix = model.getLineContent(position.lineNumber).slice(0, position.column - 1);
          const column = new TextEncoder().encode(prefix).length + 1;
          try {
            const items = await window.webkit.messageHandlers.cppCompletion.postMessage({
              uri: model.uri.toString(), source: model.getValue(),
              line: position.lineNumber, column,
            });
            if (token.isCancellationRequested) return resolve({ suggestions: [] });
            resolve({ suggestions: items.map(({ name, detail }) => ({
              label: name,
              detail,
              kind: detail.includes(name + "(")
                ? monaco.languages.CompletionItemKind.Function
                : monaco.languages.CompletionItemKind.Variable,
              insertText: name,
              range,
            })) });
          } catch (_) {
            resolve({ suggestions: [] });
          }
        }, 250);
        token.onCancellationRequested(() => {
          clearTimeout(timer);
          resolve({ suggestions: [] });
        });
      });
    },
  };
  monaco.languages.registerCompletionItemProvider({ language: "c", scheme: "file" }, provider);
  monaco.languages.registerCompletionItemProvider({ language: "cpp", scheme: "file" }, provider);
})();
