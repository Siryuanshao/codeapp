import Foundation
import SwiftUI
import WebKit
import ios_system

struct CPPDebugVariable: Identifiable {
    let id: String
    let name: String
    let value: String
    let type: String
    let reference: Int
    let expanded: Bool
    let children: [CPPDebugVariable]
    let hasMore: Bool
    let error: String

    init?(_ data: [String: Any]) {
        guard let id = data["id"] as? String, let name = data["name"] as? String,
            let value = data["value"] as? String
        else { return nil }
        self.id = id
        self.name = name
        self.value = value
        type = data["type"] as? String ?? ""
        reference = data["reference"] as? Int ?? 0
        expanded = data["expanded"] as? Bool ?? false
        children = (data["children"] as? [[String: Any]] ?? []).compactMap(CPPDebugVariable.init)
        hasMore = data["hasMore"] as? Bool ?? false
        error = data["error"] as? String ?? ""
    }
}

final class CPPDebugger: NSObject, ObservableObject, WKNavigationDelegate, WKScriptMessageHandler {
    enum State {
        case idle, compiling, starting, running, paused, finished

        var isActive: Bool {
            switch self {
            case .compiling, .starting, .running, .paused: return true
            case .idle, .finished: return false
            }
        }
    }

    @Published private(set) var state: State = .idle
    @Published private(set) var output = ""
    @Published private(set) var variables: [CPPDebugVariable] = []
    @Published private(set) var currentLine: Int?
    @Published private(set) var currentFile: String?

    private let compilerQueue = DispatchQueue(label: "com.codeapp.cpp-debug-compiler", qos: .userInitiated)
    private weak var app: MainApp?
    private var sourceURL: URL?
    private var currentBreakpoints: [Int] = []
    private var revision = 0
    private var isWebViewReady = false
    private var pendingStart: [String: Any]?

    private lazy var webView: WKWebView = {
        let configuration = WKWebViewConfiguration()
        configuration.userContentController.add(self, name: "cppDebugger")
        let view = WKWebView(frame: .zero, configuration: configuration)
        view.navigationDelegate = self
        view.load(URLRequest(url: URL(string: "http://localhost:\(WASMService.PORT)/debugger/index.html")!))
        return view
    }()

    func start(app: MainApp) {
        guard !state.isActive, let editor = app.activeTextEditor,
            let monaco = app.monacoInstance as? MonacoImplementation
        else { return }

        self.app = app
        revision += 1
        let thisRun = revision
        sourceURL = editor.url
        output = ""
        variables = []
        currentLine = nil
        currentFile = nil
        state = .compiling

        Task { @MainActor in
            await app.saveCurrentFile()
            guard self.revision == thisRun else { return }
            guard editor.isSaved else {
                self.fail(NSLocalizedString("debug.save_failed", comment: ""))
                return
            }
            let breakpoints = await monaco.debugBreakpoints()
            guard self.revision == thisRun else { return }
            self.currentBreakpoints = breakpoints
            let source = editor.url
            let binary = FileManager.default.temporaryDirectory
                .appendingPathComponent("codeapp-debug-\(UUID().uuidString).wasm")
            self.compilerQueue.async {
                let result = Self.compile(source: source, binary: binary)
                let data = result.status == 0 ? try? Data(contentsOf: binary) : nil
                try? FileManager.default.removeItem(at: binary)
                DispatchQueue.main.async {
                    guard self.revision == thisRun else { return }
                    self.output += result.output
                    guard let data = data else {
                        self.fail(NSLocalizedString("debug.compile_failed", comment: ""))
                        return
                    }
                    self.state = .starting
                    let payload: [String: Any] = [
                        "sourcePath": source.path,
                        "binary": data.base64EncodedString(),
                        "breakpoints": self.currentBreakpoints,
                    ]
                    self.pendingStart = payload
                    _ = self.webView
                    self.startWhenReady()
                }
            }
        }
    }

    func stop() {
        guard state.isActive else { return }
        revision += 1
        pendingStart = nil
        if isWebViewReady {
            webView.evaluateJavaScript("window.codeappDebugger.stop()")
        }
        state = .finished
        variables = []
        clearLine()
    }

    func restart() {
        guard state.isActive, let app, let sourceURL else { return }
        stop()
        Task { @MainActor in
            do {
                let editor = try await app.openFile(url: sourceURL, alwaysInNewTab: true)
                app.setActiveEditor(editor: editor)
                await app.monacoInstance.setModel(url: sourceURL.absoluteString)
                self.start(app: app)
            } catch {
                self.fail(error.localizedDescription)
            }
        }
    }

    func command(_ name: String) {
        guard state == .paused else { return }
        webView.callAsyncJavaScript(
            "window.codeappDebugger.command(name); return true;", arguments: ["name": name], in: nil,
            in: .page)
    }

    func sendInput(_ text: String) {
        guard state.isActive, isWebViewReady else { return }
        webView.callAsyncJavaScript(
            "window.codeappDebugger.input(text); return true;", arguments: ["text": text + "\n"], in: nil,
            in: .page)
    }

    func toggleVariable(_ id: String) {
        guard state == .paused else { return }
        webView.callAsyncJavaScript(
            "window.codeappDebugger.toggleVariable(id); return true;", arguments: ["id": id], in: nil,
            in: .page)
    }

    func loadMoreVariables(_ id: String) {
        guard state == .paused else { return }
        webView.callAsyncJavaScript(
            "window.codeappDebugger.loadMoreVariables(id); return true;", arguments: ["id": id], in: nil,
            in: .page)
    }

    func breakpointsChanged(uri: String, lines: [Int]) {
        guard let sourceURL, URL(string: uri)?.path == sourceURL.path, state.isActive else { return }
        currentBreakpoints = lines
        guard isWebViewReady else { return }
        webView.callAsyncJavaScript(
            "window.codeappDebugger.setBreakpoints(lines); return true;", arguments: ["lines": lines], in: nil,
            in: .page)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        webView.callAsyncJavaScript(
            """
            const module = await import('/debugger/debugger.js');
            window.codeappDebugger = module.createDebugger();
            return true;
            """, arguments: [:], in: nil, in: .page
        ) { result in
            switch result {
            case .success:
                self.isWebViewReady = true
                self.startWhenReady()
            case .failure(let error):
                self.fail(error.localizedDescription)
            }
        }
    }

    func userContentController(
        _ userContentController: WKUserContentController, didReceive message: WKScriptMessage
    ) {
        guard let body = message.body as? [String: Any], let event = body["event"] as? String
        else { return }
        switch event {
        case "running":
            guard state.isActive else { return }
            state = .running
            variables = []
            clearLine()
        case "paused":
            guard state.isActive else { return }
            state = .paused
            let line = body["line"] as? Int ?? 0
            currentLine = line > 0 ? line : nil
            currentFile = (body["sourcePath"] as? String).map {
                URL(fileURLWithPath: $0).lastPathComponent
            }
            variables = (body["variables"] as? [[String: Any]] ?? []).compactMap(CPPDebugVariable.init)
            if let sourceURL, let path = body["sourcePath"] as? String, path == sourceURL.path,
                line > 0, let monaco = app?.monacoInstance as? MonacoImplementation
            {
                Task { await monaco.showDebugLine(url: sourceURL, line: line) }
            }
        case "variables":
            guard state == .paused else { return }
            variables = (body["variables"] as? [[String: Any]] ?? []).compactMap(CPPDebugVariable.init)
        case "output":
            output += body["text"] as? String ?? ""
        case "exited":
            state = .finished
            variables = []
            clearLine()
        case "stopped":
            state = .finished
            variables = []
            clearLine()
        case "error":
            fail(body["message"] as? String ?? "Debugger failed.")
        default:
            break
        }
    }

    private func startWhenReady() {
        guard isWebViewReady, var payload = pendingStart else { return }
        pendingStart = nil
        payload["breakpoints"] = currentBreakpoints
        webView.callAsyncJavaScript(
            "window.codeappDebugger.start(payload); return true;", arguments: ["payload": payload], in: nil,
            in: .page
        ) { result in
            if case .failure(let error) = result { self.fail(error.localizedDescription) }
        }
    }

    private func clearLine() {
        currentLine = nil
        currentFile = nil
        guard let sourceURL, let monaco = app?.monacoInstance as? MonacoImplementation else { return }
        Task { await monaco.showDebugLine(url: sourceURL, line: 0) }
    }

    private func fail(_ message: String) {
        output += "\n\(message)\n"
        state = .finished
        variables = []
        clearLine()
    }

    private static func compile(source: URL, binary: URL) -> (status: Int32, output: String) {
        guard let input = fopen("/dev/null", "r"), let out = tmpfile(), let err = tmpfile()
        else { return (1, "Unable to open compiler streams.") }
        defer {
            fclose(input)
            fclose(out)
            fclose(err)
        }

        let session = strdup("com.codeapp.cpp-debug")!
        ios_switchSession(session)
        ios_setContext(session)
        ios_setStreams(input, out, err)
        defer {
            ios_closeSession(session)
            free(session)
        }
        thread_stdin = nil
        thread_stdout = nil
        thread_stderr = nil
        let compiler = source.pathExtension.lowercased() == "c" ? "clang" : "clang++"
        let command = "\(compiler) -O0 -g -gdwarf-5 \(quote(source.path)) -o \(quote(binary.path))"
        let pid = ios_fork()
        _ = ios_system(command)
        ios_waitpid(pid)
        let status = ios_getCommandStatus()
        ios_releaseThreadId(pid)

        func read(_ stream: UnsafeMutablePointer<FILE>) -> String {
            fflush(stream)
            rewind(stream)
            let data = FileHandle(fileDescriptor: fileno(stream), closeOnDealloc: false)
                .readDataToEndOfFile()
            return String(decoding: data, as: UTF8.self)
        }
        return (status, read(out) + read(err))
    }

    private static func quote(_ argument: String) -> String {
        "'" + argument.replacingOccurrences(of: "'", with: "'\\''") + "'"
    }
}

struct CPPDebugFloatingToolbar: View {
    @ObservedObject var debugger: CPPDebugger
    let availableSize: CGSize
    @Environment(\.colorScheme) private var colorScheme
    @State private var offset: CGSize = .zero
    @GestureState private var dragOffset: CGSize = .zero

    private let toolbarWidth: CGFloat = 260
    private let toolbarHeight: CGFloat = 44

    private var position: CGSize {
        let horizontalLimit = max(0, (availableSize.width - toolbarWidth) / 2)
        let verticalLimit = max(0, availableSize.height - toolbarHeight - 6)
        return CGSize(
            width: min(horizontalLimit, max(-horizontalLimit, offset.width + dragOffset.width)),
            height: min(verticalLimit, max(0, offset.height + dragOffset.height))
        )
    }

    private var blue: Color {
        colorScheme == .dark ? Color(red: 0.40, green: 0.72, blue: 0.98)
            : Color(red: 0.02, green: 0.42, blue: 0.78)
    }

    private func button(
        _ icon: String, _ label: LocalizedStringKey, color: Color, enabled: Bool = true,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            Image(systemName: icon)
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(color)
                .frame(width: 38, height: 44)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .disabled(!enabled)
        .opacity(enabled ? 1 : 0.35)
        .accessibilityLabel(Text(label))
        .help(label)
    }

    var body: some View {
        if debugger.state.isActive {
            HStack(spacing: 0) {
                Image(systemName: "circle.grid.2x3.fill")
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)
                    .frame(width: 20, height: 44)
                    .contentShape(Rectangle())
                    .gesture(
                        DragGesture(minimumDistance: 3)
                            .updating($dragOffset) { value, state, _ in
                                state = value.translation
                            }
                            .onEnded { value in
                                offset = CGSize(
                                    width: offset.width + value.translation.width,
                                    height: offset.height + value.translation.height
                                )
                                let horizontalLimit = max(0, (availableSize.width - toolbarWidth) / 2)
                                let verticalLimit = max(0, availableSize.height - toolbarHeight - 6)
                                offset.width = min(horizontalLimit, max(-horizontalLimit, offset.width))
                                offset.height = min(verticalLimit, max(0, offset.height))
                            }
                    )
                    .accessibilityHidden(true)
                button("play.fill", "debug.continue", color: blue, enabled: debugger.state == .paused) {
                    debugger.command("continue")
                }
                button("arrow.turn.down.right", "debug.step_over", color: blue, enabled: debugger.state == .paused) {
                    debugger.command("next")
                }
                button("arrow.down.to.line", "debug.step_in", color: blue, enabled: debugger.state == .paused) {
                    debugger.command("stepIn")
                }
                button("arrow.up.to.line", "debug.step_out", color: blue, enabled: debugger.state == .paused) {
                    debugger.command("stepOut")
                }
                button("arrow.counterclockwise", "debug.restart", color: .green) {
                    debugger.restart()
                }
                button("stop.fill", "debug.stop", color: .red) {
                    debugger.stop()
                }
            }
            .padding(.horizontal, 6)
            .background(
                RoundedRectangle(cornerRadius: 10)
                    .fill(Color(uiColor: .secondarySystemBackground))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .stroke(Color.primary.opacity(0.12), lineWidth: 1)
            )
            .shadow(color: .black.opacity(0.2), radius: 8, y: 3)
            .offset(position)
        }
    }
}

struct CPPDebugPanel: View {
    @ObservedObject var debugger: CPPDebugger
    @State private var input = ""

    private var status: LocalizedStringKey {
        switch debugger.state {
        case .idle: return "debug.idle"
        case .compiling: return "debug.compiling"
        case .starting: return "debug.starting"
        case .running: return "debug.running"
        case .paused: return "debug.paused"
        case .finished: return "debug.finished"
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(status)
                if let line = debugger.currentLine {
                    Text("\(debugger.currentFile ?? ""):\(line)")
                }
                Spacer()
            }
            HStack(alignment: .top, spacing: 10) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("debug.variables").bold()
                    ScrollView {
                        VStack(alignment: .leading, spacing: 3) {
                            CPPDebugVariableTree(debugger: debugger, variables: debugger.variables)
                        }.frame(maxWidth: .infinity, alignment: .leading)
                    }
                }.frame(minWidth: 120, maxWidth: .infinity, alignment: .leading)
                Divider()
                VStack(alignment: .leading, spacing: 4) {
                    Text("debug.output").bold()
                    ScrollViewReader { proxy in
                        ScrollView {
                            VStack(alignment: .leading, spacing: 0) {
                                Text(debugger.output)
                                    .font(.system(.caption, design: .monospaced))
                                    .textSelection(.enabled)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                Color.clear.frame(height: 1).id("debug-output-bottom")
                            }
                        }
                        .onChange(of: debugger.output) { _ in
                            proxy.scrollTo("debug-output-bottom", anchor: .bottom)
                        }
                        .onAppear {
                            proxy.scrollTo("debug-output-bottom", anchor: .bottom)
                        }
                    }
                    if debugger.state.isActive {
                        HStack {
                            TextField("debug.input", text: $input)
                                .onSubmit { sendInput() }
                            Button("debug.send") { sendInput() }
                        }
                    }
                }.frame(maxWidth: .infinity, alignment: .leading)
            }
            Text("debug.temporary_filesystem").font(.caption2).foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }

    private func sendInput() {
        debugger.sendInput(input)
        input = ""
    }
}

private struct CPPDebugVariableTree: View {
    @ObservedObject var debugger: CPPDebugger
    let variables: [CPPDebugVariable]
    var depth = 0

    var body: some View {
        ForEach(variables) { variable in
            VStack(alignment: .leading, spacing: 0) {
                if variable.reference != 0 {
                    Button {
                        debugger.toggleVariable(variable.id)
                    } label: {
                        row(variable)
                    }
                    .buttonStyle(.plain)
                } else {
                    row(variable)
                }

                if variable.expanded {
                    CPPDebugVariableTree(
                        debugger: debugger, variables: variable.children, depth: depth + 1)
                    if !variable.error.isEmpty {
                        Text("debug.variable_unavailable")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                            .help(variable.error)
                            .padding(.leading, CGFloat(depth + 1) * 14 + 24)
                    }
                    if variable.hasMore {
                        Button("debug.load_more") {
                            debugger.loadMoreVariables(variable.id)
                        }
                        .font(.caption)
                        .padding(.leading, CGFloat(depth + 1) * 14 + 24)
                    }
                }
            }
        }
    }

    private func row(_ variable: CPPDebugVariable) -> some View {
        HStack(spacing: 4) {
            Image(systemName: variable.expanded ? "chevron.down" : "chevron.right")
                .font(.system(size: 10, weight: .semibold))
                .opacity(variable.reference == 0 ? 0 : 1)
                .frame(width: 24, height: 28)
            Text("\(variable.name) = \(variable.value)")
                .font(.system(.caption, design: .monospaced))
                .lineLimit(1)
            if !variable.type.isEmpty {
                Text(variable.type)
                    .font(.caption2)
                    .foregroundColor(.secondary)
                    .lineLimit(1)
                    .truncationMode(.middle)
            }
            Spacer(minLength: 0)
        }
        .padding(.leading, CGFloat(depth) * 14)
        .contentShape(Rectangle())
    }
}
