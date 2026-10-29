import Foundation
import SwiftUI
import WebKit
import ios_system

struct CPPDebugVariable: Identifiable {
    let id: String
    let name: String
    let value: String
    let type: String
    let isGlobal: Bool
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
        isGlobal = (data["path"] as? [String])?.dropFirst().first == "Globals"
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
    @Published var localsExpanded = true
    @Published var globalsExpanded = false

    private let compilerQueue = DispatchQueue(
        label: "com.codeapp.cpp-debug-compiler", qos: .userInitiated)
    private weak var app: MainApp?
    private var sourceURL: URL?
    private var sourceAccess: WorkspaceAccess?
    private var currentBreakpoints: [Int] = []
    private var revision = 0
    private var isWebViewReady = false
    private var pendingStart: [String: Any]?

    private lazy var webView: WKWebView = {
        let configuration = WKWebViewConfiguration()
        configuration.userContentController.add(self, name: "cppDebugger")
        let view = WKWebView(frame: .zero, configuration: configuration)
        view.navigationDelegate = self
        view.load(
            URLRequest(
                url: URL(string: "http://localhost:\(WASMService.PORT)/debugger/index.html")!))
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
        sourceAccess = editor.securityScopedAccess
        output = ""
        variables = []
        currentLine = nil
        currentFile = nil
        localsExpanded = true
        globalsExpanded = false
        state = .compiling
        let workspaceAccess = app.currentWorkspaceAccess
        let fileAccess = sourceAccess

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
                defer { withExtendedLifetime((workspaceAccess, fileAccess)) {} }
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
        sourceAccess = nil
    }

    func restart() {
        guard state.isActive, let app, let sourceURL else { return }
        let fileAccess = sourceAccess
        stop()
        Task { @MainActor in
            do {
                let editor = try await app.openFile(
                    url: sourceURL, alwaysInNewTab: true, securityScopedAccess: fileAccess)
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
            "window.codeappDebugger.command(name); return true;", arguments: ["name": name],
            in: nil,
            in: .page)
    }

    func sendInput(_ text: String) {
        guard state.isActive, isWebViewReady else { return }
        webView.callAsyncJavaScript(
            "window.codeappDebugger.input(text); return true;", arguments: ["text": text + "\n"],
            in: nil,
            in: .page)
    }

    func toggleVariable(_ id: String) {
        guard state == .paused else { return }
        webView.callAsyncJavaScript(
            "window.codeappDebugger.toggleVariable(id); return true;", arguments: ["id": id],
            in: nil,
            in: .page)
    }

    func loadMoreVariables(_ id: String) {
        guard state == .paused else { return }
        webView.callAsyncJavaScript(
            "window.codeappDebugger.loadMoreVariables(id); return true;", arguments: ["id": id],
            in: nil,
            in: .page)
    }

    func breakpointsChanged(uri: String, lines: [Int]) {
        guard let sourceURL, URL(string: uri)?.path == sourceURL.path, state.isActive else {
            return
        }
        currentBreakpoints = lines
        guard isWebViewReady else { return }
        webView.callAsyncJavaScript(
            "window.codeappDebugger.setBreakpoints(lines); return true;",
            arguments: ["lines": lines], in: nil,
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
            variables = (body["variables"] as? [[String: Any]] ?? []).compactMap(
                CPPDebugVariable.init)
            if let sourceURL, let path = body["sourcePath"] as? String, path == sourceURL.path,
                line > 0, let monaco = app?.monacoInstance as? MonacoImplementation
            {
                Task { await monaco.showDebugLine(url: sourceURL, line: line) }
            }
        case "variables":
            guard state == .paused else { return }
            variables = (body["variables"] as? [[String: Any]] ?? []).compactMap(
                CPPDebugVariable.init)
        case "output":
            output += body["text"] as? String ?? ""
        case "exited":
            state = .finished
            variables = []
            clearLine()
            sourceAccess = nil
        case "stopped":
            state = .finished
            variables = []
            clearLine()
            sourceAccess = nil
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
            "window.codeappDebugger.start(payload); return true;", arguments: ["payload": payload],
            in: nil,
            in: .page
        ) { result in
            if case .failure(let error) = result { self.fail(error.localizedDescription) }
        }
    }

    private func clearLine() {
        currentLine = nil
        currentFile = nil
        guard let sourceURL, let monaco = app?.monacoInstance as? MonacoImplementation else {
            return
        }
        Task { await monaco.showDebugLine(url: sourceURL, line: 0) }
    }

    private func fail(_ message: String) {
        output += "\n\(message)\n"
        state = .finished
        variables = []
        clearLine()
        sourceAccess = nil
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
        func read(_ stream: UnsafeMutablePointer<FILE>) -> String {
            fflush(stream)
            rewind(stream)
            let data = FileHandle(fileDescriptor: fileno(stream), closeOnDealloc: false)
                .readDataToEndOfFile()
            return String(decoding: data, as: UTF8.self)
        }

        func run(_ command: String) -> Int32 {
            let pid = ios_fork()
            _ = ios_system(command)
            ios_waitpid(pid)
            let status = ios_getCommandStatus()
            ios_releaseThreadId(pid)
            return status
        }

        let compiler = source.pathExtension.lowercased() == "c" ? "clang" : "clang++"
        let object = binary.deletingPathExtension().appendingPathExtension("o")
        defer { try? FileManager.default.removeItem(at: object) }
        var status = run(
            "\(compiler) -O0 -g -gdwarf-5 -c \(quote(source.path)) -o \(quote(object.path))")
        if status == 0 {
            do {
                try DebugWasmObject.retainDataSymbols(in: object)
                status = run(
                    "\(compiler) -O0 -g -gdwarf-5 \(quote(object.path)) -o \(quote(binary.path))")
            } catch {
                let message = "\nUnable to preserve debug globals: \(error.localizedDescription)\n"
                return (1, read(out) + read(err) + message)
            }
        }
        return (status, read(out) + read(err))
    }

    private static func quote(_ argument: String) -> String {
        "'" + argument.replacingOccurrences(of: "'", with: "'\\''") + "'"
    }
}

// The WebAssembly linker removes unreferenced data even in a debug build. Mark
// data symbols from the user's source as NO_STRIP before linking, so globals
// remain inspectable without keeping every unused function in the standard library.
private enum DebugWasmObject {
    private struct InvalidObject: Error {}

    static func retainDataSymbols(in object: URL) throws {
        let bytes = Array(try Data(contentsOf: object))
        var cursor = 8
        while cursor < bytes.count {
            let sectionStart = cursor
            let sectionID = try byte(bytes, &cursor)
            let size = try integer(bytes, &cursor)
            let payloadStart = cursor
            let sectionEnd = payloadStart + size
            guard sectionEnd <= bytes.count else { throw InvalidObject() }
            if sectionID == 0, try name(bytes, &cursor) == "linking" {
                guard try integer(bytes, &cursor) == 2 else { throw InvalidObject() }
                var payload = Array(bytes[payloadStart..<cursor])
                var foundSymbols = false
                while cursor < sectionEnd {
                    let subsectionStart = cursor
                    let subsectionID = try byte(bytes, &cursor)
                    let subsectionSize = try integer(bytes, &cursor)
                    let subsectionEnd = cursor + subsectionSize
                    guard subsectionEnd <= sectionEnd else { throw InvalidObject() }
                    if subsectionID == 8 {
                        let symbols = try retainSymbols(bytes, start: cursor, end: subsectionEnd)
                        payload.append(subsectionID)
                        payload.append(contentsOf: encodedInteger(symbols.count))
                        payload.append(contentsOf: symbols)
                        foundSymbols = true
                    } else {
                        payload.append(contentsOf: bytes[subsectionStart..<subsectionEnd])
                    }
                    cursor = subsectionEnd
                }
                guard foundSymbols else { throw InvalidObject() }
                var result = Array(bytes[..<sectionStart])
                result.append(sectionID)
                result.append(contentsOf: encodedInteger(payload.count))
                result.append(contentsOf: payload)
                result.append(contentsOf: bytes[sectionEnd...])
                try Data(result).write(to: object)
                return
            }
            cursor = sectionEnd
        }
        throw InvalidObject()
    }

    private static func retainSymbols(_ bytes: [UInt8], start: Int, end: Int) throws -> [UInt8] {
        var cursor = start
        let count = try integer(bytes, &cursor)
        var result = Array(bytes[start..<cursor])
        for _ in 0..<count {
            let symbolStart = cursor
            let kind = try byte(bytes, &cursor)
            let flagsStart = cursor
            let flags = try integer(bytes, &cursor)
            let flagsEnd = cursor
            let undefined = flags & 0x10 != 0
            switch kind {
            case 1:  // Data: name, then segment, offset and size when defined.
                _ = try name(bytes, &cursor)
                if !undefined {
                    if flags & 3 == 3 {  // Common symbols have size and alignment instead.
                        _ = try integer(bytes, &cursor)
                        _ = try byte(bytes, &cursor)
                    } else {
                        _ = try integer(bytes, &cursor)
                        _ = try integer(bytes, &cursor)
                        _ = try integer(bytes, &cursor)
                    }
                }
            case 0, 2, 4, 5:  // Function, global, tag or table.
                _ = try integer(bytes, &cursor)
                if !undefined || flags & 0x40 != 0 { _ = try name(bytes, &cursor) }
            case 3:  // Section.
                _ = try integer(bytes, &cursor)
            default:
                throw InvalidObject()
            }
            guard cursor <= end else { throw InvalidObject() }
            result.append(contentsOf: bytes[symbolStart..<flagsStart])
            let retainedFlags = kind == 1 && !undefined ? flags | 0x80 : flags
            result.append(contentsOf: encodedInteger(retainedFlags))
            result.append(contentsOf: bytes[flagsEnd..<cursor])
        }
        guard cursor == end else { throw InvalidObject() }
        return result
    }

    private static func byte(_ bytes: [UInt8], _ cursor: inout Int) throws -> UInt8 {
        guard cursor < bytes.count else { throw InvalidObject() }
        defer { cursor += 1 }
        return bytes[cursor]
    }

    private static func integer(_ bytes: [UInt8], _ cursor: inout Int) throws -> Int {
        var result = 0
        for shift in stride(from: 0, through: 28, by: 7) {
            let part = try byte(bytes, &cursor)
            result |= Int(part & 0x7f) << shift
            if part & 0x80 == 0 { return result }
        }
        throw InvalidObject()
    }

    private static func name(_ bytes: [UInt8], _ cursor: inout Int) throws -> String {
        let size = try integer(bytes, &cursor)
        let end = cursor + size
        guard end <= bytes.count else { throw InvalidObject() }
        defer { cursor = end }
        return String(decoding: bytes[cursor..<end], as: UTF8.self)
    }

    private static func encodedInteger(_ value: Int) -> [UInt8] {
        var value = value
        var result: [UInt8] = []
        repeat {
            var part = UInt8(value & 0x7f)
            value >>= 7
            if value != 0 { part |= 0x80 }
            result.append(part)
        } while value != 0
        return result
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
        colorScheme == .dark
            ? Color(red: 0.40, green: 0.72, blue: 0.98)
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
                                let horizontalLimit = max(
                                    0, (availableSize.width - toolbarWidth) / 2)
                                let verticalLimit = max(0, availableSize.height - toolbarHeight - 6)
                                offset.width = min(
                                    horizontalLimit, max(-horizontalLimit, offset.width))
                                offset.height = min(verticalLimit, max(0, offset.height))
                            }
                    )
                    .accessibilityHidden(true)
                button(
                    "play.fill", "debug.continue", color: blue, enabled: debugger.state == .paused
                ) {
                    debugger.command("continue")
                }
                button(
                    "arrow.turn.down.right", "debug.step_over", color: blue,
                    enabled: debugger.state == .paused
                ) {
                    debugger.command("next")
                }
                button(
                    "arrow.down.to.line", "debug.step_in", color: blue,
                    enabled: debugger.state == .paused
                ) {
                    debugger.command("stepIn")
                }
                button(
                    "arrow.up.to.line", "debug.step_out", color: blue,
                    enabled: debugger.state == .paused
                ) {
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
                            let locals = debugger.variables.filter { !$0.isGlobal }
                            let globals = debugger.variables.filter(\.isGlobal)
                            if !locals.isEmpty {
                                CPPDebugVariableGroup(
                                    debugger: debugger, title: "debug.local_variables",
                                    isExpanded: $debugger.localsExpanded, variables: locals)
                            }
                            if !globals.isEmpty {
                                CPPDebugVariableGroup(
                                    debugger: debugger, title: "debug.global_variables",
                                    isExpanded: $debugger.globalsExpanded, variables: globals)
                            }
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

private struct CPPDebugVariableGroup: View {
    @ObservedObject var debugger: CPPDebugger
    let title: LocalizedStringKey
    @Binding var isExpanded: Bool
    let variables: [CPPDebugVariable]

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Button {
                isExpanded.toggle()
            } label: {
                HStack(spacing: 4) {
                    Image(systemName: isExpanded ? "chevron.down" : "chevron.right")
                        .font(.system(size: 10, weight: .semibold))
                        .frame(width: 24, height: 28)
                        .accessibilityHidden(true)
                    Text(title).font(.caption.weight(.semibold))
                    Spacer(minLength: 0)
                }
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityValue(isExpanded ? Text("debug.expanded") : Text("debug.collapsed"))

            if isExpanded {
                CPPDebugVariableTree(debugger: debugger, variables: variables)
                    .padding(.leading, 14)
            }
        }
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
