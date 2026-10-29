import SwiftUI
import WebKit

// Append to a test build's CodeApp.swift and replace MainScene with BreakpointProbeView.
// Launch with --breakpoint-phase-1, -2, and -3 in order; the last phase cleans up.
private struct BreakpointProbeView: View {
    @StateObject private var app = MainApp()

    private let root = FileManager.default.temporaryDirectory
        .appendingPathComponent("codex-breakpoint-device-probe-2d91e7a7", isDirectory: true)
    private let source = "int main() {\n  int x = 1;\n  x += 2;\n  return x;\n}\n"

    private func cleanProbeBreakpoints() {
        let defaults = UserDefaults.standard
        var workspaces = defaults.dictionary(forKey: "cppDebugBreakpoints") as? [String: [String: [Int]]] ?? [:]
        var changed = false
        for (workspace, files) in workspaces {
            let remaining = files.filter { path, _ in
                !URL(fileURLWithPath: path).pathComponents.contains("codex-breakpoint-device-probe-2d91e7a7")
            }
            if remaining.count != files.count {
                changed = true
                workspaces[workspace] = remaining.isEmpty ? nil : remaining
            }
        }
        if changed { defaults.set(workspaces, forKey: "cppDebugBreakpoints") }
    }

    var body: some View {
        EditorImplementationView(implementation: app.monacoInstance)
            .environmentObject(app)
            .task { await runProbe() }
    }

    private func failure(_ message: String) -> NSError {
        NSError(domain: "BreakpointProbe", code: 1, userInfo: [NSLocalizedDescriptionKey: message])
    }

    @MainActor
    private func waitUntil(_ label: String, _ predicate: () -> Bool) async throws {
        for _ in 0..<800 {
            if predicate() { return }
            try await Task.sleep(nanoseconds: 50_000_000)
        }
        throw failure("Timed out: \(label); debugger=\(app.cppDebugger.state), output=\(app.cppDebugger.output)")
    }

    @MainActor
    private var webView: WKWebView {
        (app.monacoInstance as! MonacoImplementation).view as! WKWebView
    }

    @MainActor
    private func open(_ file: URL) async throws {
        let editor = try await app.openFile(url: file, alwaysInNewTab: true)
        app.setActiveEditor(editor: editor)
        for _ in 0..<200 {
            if (try? await webView.evaluateJavaScriptAsync("editor.getModel()?.uri.toString()") as? String)
                == file.standardizedFileURL.absoluteString { return }
            try await Task.sleep(nanoseconds: 50_000_000)
        }
        throw failure("Could not open \(file.path)")
    }

    @MainActor
    private func editorLines() async throws -> [Int] {
        guard let lines = try await webView.evaluateJavaScriptAsync("codeAppDebugBreakpoints()") as? [Int] else {
            throw failure("Could not read editor breakpoints")
        }
        return lines
    }

    @MainActor
    private func check(_ actual: [Int], _ expected: [Int], _ message: String) throws {
        guard actual == expected else { throw failure("\(message): got \(actual), expected \(expected)") }
        NSLog("BREAKPOINT_PROBE %@ = %@", message, String(describing: actual))
    }

    @MainActor
    private func toggle(_ line: Int) async throws {
        _ = try await webView.evaluateJavaScriptAsync("codeAppDebugToggleBreakpoint(\(line))")
    }

    @MainActor
    private func runProbe() async {
        let fileA = root.appendingPathComponent("a/main.cpp")
        let fileB = root.appendingPathComponent("b/main.cpp")
        let fileC = root.appendingPathComponent("a/main.c")
        let store = CPPBreakpointStore()
        let phase = ProcessInfo.processInfo.arguments.last ?? ""
        do {
            try await waitUntil("Monaco initialization") { app.stateManager.isMonacoEditorInitialized }
            let workspace = { (file: URL) in
                store.workspace(for: file, root: app.currentWorkspaceBookmarkURL ?? app.workSpaceStorage.currentDirectory._url)
            }
            switch phase {
            case "--breakpoint-phase-1":
                cleanProbeBreakpoints()
                try? FileManager.default.removeItem(at: root)
                try FileManager.default.createDirectory(at: fileA.deletingLastPathComponent(), withIntermediateDirectories: true)
                try FileManager.default.createDirectory(at: fileB.deletingLastPathComponent(), withIntermediateDirectories: true)
                try source.write(to: fileA, atomically: true, encoding: .utf8)
                try source.write(to: fileB, atomically: true, encoding: .utf8)
                try source.write(to: fileC, atomically: true, encoding: .utf8)

                try await open(fileA)
                try await toggle(3)
                try await waitUntil("persist newly set breakpoint") { store.lines(for: fileA, workspace: workspace(fileA)) == [3] }
                _ = try await webView.evaluateJavaScriptAsync(
                    "editor.getModel().applyEdits([{range: new monaco.Range(3, 1, 3, 1), text: '\\n'}])")
                try await waitUntil("persist shifted breakpoint") { store.lines(for: fileA, workspace: workspace(fileA)) == [4] }
                try await waitUntil("source edit received") { app.activeTextEditor?.isSaved == false }
                await app.saveCurrentFile()
                guard app.activeTextEditor?.isSaved == true else { throw failure("Source did not save") }
                try check(try await editorLines(), [4], "edited C++")

                try await open(fileB)
                try await toggle(2)
                try await waitUntil("persist second file") { store.lines(for: fileB, workspace: workspace(fileB)) == [2] }
                try await open(fileC)
                try await toggle(3)
                try await waitUntil("persist C file") { store.lines(for: fileC, workspace: workspace(fileC)) == [3] }
                app.closeAllEditors()
                try await Task.sleep(nanoseconds: 500_000_000)
                try await open(fileA)
                try check(try await editorLines(), [4], "after closing editors")
                try await open(fileB)
                try check(try await editorLines(), [2], "same name in another folder")
                NSLog("BREAKPOINT_PROBE PHASE 1 PASS")

            case "--breakpoint-phase-2":
                try await open(fileA)
                try check(try await editorLines(), [4], "C++ restored after app restart")
                app.cppDebugger.start(app: app)
                try await waitUntil("restored C++ breakpoint hits") {
                    app.cppDebugger.state == .paused && app.cppDebugger.currentLine == 4
                }
                NSLog("BREAKPOINT_PROBE C++ breakpoint hit at line 4")
                app.cppDebugger.stop()
                try await open(fileC)
                try check(try await editorLines(), [3], "C restored after app restart")
                app.cppDebugger.start(app: app)
                try await waitUntil("restored C breakpoint hits") {
                    app.cppDebugger.state == .paused && app.cppDebugger.currentLine == 3
                }
                NSLog("BREAKPOINT_PROBE C breakpoint hit at line 3")
                app.cppDebugger.stop()
                try await open(fileB)
                try check(try await editorLines(), [2], "second file restored")
                try await toggle(2)
                try await waitUntil("persist breakpoint removal") { store.lines(for: fileB, workspace: workspace(fileB)).isEmpty }
                try await toggle(2)
                try await waitUntil("restore breakpoint before deleting file") { store.lines(for: fileB, workspace: workspace(fileB)) == [2] }
                if !app.confirmBeforeDelete {
                    let storedURL = fileB.standardizedFileURL
                    let storedWorkspace = workspace(fileB)
                    app.trashItem(url: fileB)
                    try await waitUntil("delete file and saved breakpoint") {
                        !FileManager.default.fileExists(atPath: fileB.path)
                            && store.lines(for: storedURL, workspace: storedWorkspace).isEmpty
                    }
                    try await Task.sleep(nanoseconds: 500_000_000)
                    try source.write(to: fileB, atomically: true, encoding: .utf8)
                    try await open(fileB)
                    try check(try await editorLines(), [], "recreated file after deletion")
                } else {
                    NSLog("BREAKPOINT_PROBE deletion integration skipped because confirmation is enabled")
                    try await toggle(2)
                    try await waitUntil("persist breakpoint removal") { store.lines(for: fileB, workspace: workspace(fileB)).isEmpty }
                }
                NSLog("BREAKPOINT_PROBE PHASE 2 PASS")

            case "--breakpoint-phase-3":
                try await open(fileA)
                try check(try await editorLines(), [4], "C++ survives second restart")
                try await open(fileB)
                try check(try await editorLines(), [], "removed breakpoint stays removed")
                cleanProbeBreakpoints()
                try FileManager.default.removeItem(at: root)
                NSLog("BREAKPOINT_PROBE PHASE 3 PASS")

            default:
                throw failure("Missing phase argument")
            }
        } catch {
            NSLog("BREAKPOINT_PROBE FAILED: %@", error.localizedDescription)
            app.cppDebugger.stop()
        }
    }
}
