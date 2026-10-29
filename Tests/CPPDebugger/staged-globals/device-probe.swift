
private struct GlobalsProbeView: View {
    @StateObject private var app = MainApp()

    var body: some View {
        EditorImplementationView(implementation: app.monacoInstance)
            .environmentObject(app)
            .task { await runProbe() }
    }

    @MainActor
    private func waitUntil(_ label: String, _ predicate: () -> Bool) async throws {
        for _ in 0..<800 {
            if predicate() { return }
            try await Task.sleep(nanoseconds: 50_000_000)
        }
        throw failure("Timed out: \(label); state=\(app.cppDebugger.state), output=\(app.cppDebugger.output)")
    }

    private func failure(_ message: String) -> NSError {
        NSError(domain: "GlobalsProbe", code: 1, userInfo: [NSLocalizedDescriptionKey: message])
    }

    @MainActor
    private func find(_ name: String, _ scope: String) throws -> CPPDebugVariable {
        guard let variable = app.cppDebugger.variables.first(where: {
            $0.name == name && $0.id.contains("\"\(scope)\"")
        }) else {
            throw failure("Missing \(scope) \(name): \(app.cppDebugger.variables)")
        }
        return variable
    }

    @MainActor
    private func check(_ name: String, _ scope: String, _ expected: String) throws {
        let variable = try find(name, scope)
        guard variable.value == expected else {
            throw failure("\(scope) \(name): \(variable.value), expected \(expected)")
        }
        NSLog("GLOBALS_PROBE %@ %@ = %@ (%@)", scope, name, variable.value, variable.type)
    }

    @MainActor
    private func startSource(_ name: String, _ source: String) async throws -> Int {
        let file = FileManager.default.temporaryDirectory.appendingPathComponent(name)
        try source.write(to: file, atomically: true, encoding: .utf8)
        let line = source.components(separatedBy: "\n").firstIndex { $0.contains("// BREAK") }! + 1
        let editor = try await app.openFile(url: file, alwaysInNewTab: true)
        app.setActiveEditor(editor: editor)
        await app.monacoInstance.setModel(url: file.absoluteString)
        guard let monaco = app.monacoInstance as? MonacoImplementation,
              let webView = monaco.view as? WKWebView else { throw failure("Monaco unavailable") }
        for _ in 0..<200 {
            let uri = try? await webView.evaluateJavaScriptAsync("editor.getModel()?.uri.toString()")
            if uri as? String == file.absoluteString { break }
            try await Task.sleep(nanoseconds: 50_000_000)
        }
        _ = try await webView.evaluateJavaScriptAsync("codeAppDebugToggleBreakpoint(\(line))")
        app.cppDebugger.start(app: app)
        try await waitUntil("\(name) breakpoint") { app.cppDebugger.state == .paused && app.cppDebugger.currentLine == line }
        return line
    }

    @MainActor
    private func runProbe() async {
        do {
            try await waitUntil("Monaco initialization") { app.stateManager.isMonacoEditorInitialized }
            let cpp = #"""
            const int MAXN = 1000;
            const int NEG = -150;
            const unsigned BIG = 4000000000U;
            constexpr bool FLAG = true;
            int count = 3;
            int unusedNumber = 111;
            char unusedChars[140];
            int unusedArray[160];
            int a[MAXN];
            int small[3] = {10, 20, 30};
            int medium[150];
            int matrix[2][3] = {{1, 2, 3}, {4, 5, 6}};
            int grid[2][150];
            typedef int IntArray[150];
            IntArray aliasArray;
            namespace ns { int counter = 11; }
            static bool ready = false;
            double ratio = 1.5;
            long long negative = -5000000000LL;
            int main() {
              ::count = 5;
              a[2] = 7;
              medium[149] = 9;
              grid[1][0] = 4;
              aliasArray[1] = 8;
              ready = true;
              int local = 42;
              int count = 17;
              local += 1; // BREAK
              ::count = 9;
              return local + count + ::count + a[2] + small[0] + medium[149] + matrix[1][0] + grid[1][0] + aliasArray[1] + ns::counter + ready + (int)ratio + (int)negative + MAXN + NEG + (int)BIG + FLAG;
            }
            """#
            let line = try await startSource("globals-probe.cpp", cpp)
            try check("count", "Globals", "5")
            try check("unusedNumber", "Globals", "111")
            try check("unusedChars", "Globals", "size = 140")
            try check("unusedArray", "Globals", "size = 160")
            try check("MAXN", "Globals", "1000")
            try check("NEG", "Globals", "-150")
            try check("BIG", "Globals", "4000000000")
            try check("FLAG", "Globals", "true")
            try check("count", "Locals", "17")
            try check("local", "Locals", "42")
            guard app.cppDebugger.localsExpanded, !app.cppDebugger.globalsExpanded,
                  try !find("count", "Locals").isGlobal, try find("count", "Globals").isGlobal else {
                throw failure("Default group state or variable scopes are incorrect")
            }
            try check("a", "Globals", "size = 1000")
            try check("medium", "Globals", "size = 150")
            try check("aliasArray", "Globals", "size = 150")
            try check("grid", "Globals", "size = 300")
            try check("ns::counter", "Globals", "11")
            try check("ready", "Globals", "true")
            try check("ratio", "Globals", "1.5")
            try check("negative", "Globals", "-5000000000")
            let small = try find("small", "Globals")
            guard small.reference != 0 else { throw failure("small is not expandable") }
            app.cppDebugger.toggleVariable(small.id)
            try await waitUntil("small array") {
                (try? find("small", "Globals").children.map(\.value)) == ["10", "20", "30"]
            }
            let matrix = try find("matrix", "Globals")
            guard matrix.type == "int[2][3]", matrix.reference != 0 else {
                throw failure("matrix type or reference: \(matrix)")
            }
            app.cppDebugger.toggleVariable(matrix.id)
            try await waitUntil("matrix rows") { (try? find("matrix", "Globals").children.count) == 2 }
            let row = try find("matrix", "Globals").children[1]
            app.cppDebugger.toggleVariable(row.id)
            try await waitUntil("matrix row values") {
                (try? find("matrix", "Globals").children[1].children.map(\.value)) == ["4", "5", "6"]
            }
            app.cppDebugger.localsExpanded = false
            app.cppDebugger.globalsExpanded = true
            app.cppDebugger.command("next")
            try await waitUntil("step one") { app.cppDebugger.state == .paused && app.cppDebugger.currentLine == line + 1 }
            guard !app.cppDebugger.localsExpanded, app.cppDebugger.globalsExpanded else {
                throw failure("Group expansion did not persist after stepping")
            }
            try check("local", "Locals", "43")
            try check("count", "Globals", "5")
            app.cppDebugger.command("next")
            try await waitUntil("step two") { app.cppDebugger.state == .paused && app.cppDebugger.currentLine == line + 2 }
            try check("count", "Globals", "9")
            NSLog("GLOBALS_PROBE C++ PASS")
            app.cppDebugger.stop()

            let c = #"""
            int count = 3;
            int unusedNumber = 111;
            char unusedChars[140];
            int unusedArray[160];
            int a[1000];
            int small[3] = {10, 20, 30};
            int main(void) {
              count = 5;
              a[2] = 7;
              int local = 42;
              return local + count + a[2] + small[0]; // BREAK
            }
            """#
            _ = try await startSource("globals-probe.c", c)
            guard app.cppDebugger.localsExpanded, !app.cppDebugger.globalsExpanded else {
                throw failure("Group expansion did not reset for the next debug session")
            }
            try check("count", "Globals", "5")
            try check("unusedNumber", "Globals", "111")
            try check("unusedChars", "Globals", "size = 140")
            try check("unusedArray", "Globals", "size = 160")
            try check("local", "Locals", "42")
            try check("a", "Globals", "size = 1000")
            let cSmall = try find("small", "Globals")
            app.cppDebugger.toggleVariable(cSmall.id)
            try await waitUntil("C small array") {
                (try? find("small", "Globals").children.map(\.value)) == ["10", "20", "30"]
            }
            NSLog("GLOBALS_PROBE C PASS")
            app.cppDebugger.stop()

            let cppWithContainers = #"""
            #include <iostream>
            #include <thread>
            #include <chrono>
            #include <algorithm>
            #include <queue>
            #include <stack>
            using namespace std;
            struct Person { int age; int height; };
            int abcd = 111;
            string sbsb = "1212";
            char x[140];
            int xyz[160];
            int main(int argc, char **argv) {
              string str = "a local string";
              int a[1213] = {0, 1, 2, 3};
              int b[11] = {1, 1, 1, 1};
              priority_queue<int> que;
              vector<int> vec;
              vec.push_back(1);
              vec.push_back(2);
              Person person;
              person.age = 1; // BREAK
              return person.age;
            }
            """#
            _ = try await startSource("globals-with-containers.cpp", cppWithContainers)
            try check("abcd", "Globals", "111")
            try check("sbsb", "Globals", "\"1212\"")
            try check("x", "Globals", "size = 140")
            try check("xyz", "Globals", "size = 160")
            try check("a", "Locals", "size = 1213")
            try check("que", "Locals", "size = 0")
            try check("vec", "Locals", "size = 2")
            guard try !find("argc", "Arguments").isGlobal else {
                throw failure("Function arguments must appear with local variables")
            }
            NSLog("GLOBALS_PROBE C++ CONTAINERS PASS")
            app.cppDebugger.stop()
            NSLog("GLOBALS_PROBE ALL PASS")
            exit(0)
        } catch {
            NSLog("GLOBALS_PROBE FAILED: %@", error.localizedDescription)
            app.cppDebugger.stop()
            exit(1)
        }
    }
}
