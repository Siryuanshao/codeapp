//
//  LanguageService.swift
//  Code
//
//  Created by Ken Chung on 09/08/2024.
//

import Foundation
import ios_system

class LanguageService {
    struct Configuration {
        let languageIdentifier: String
        let extensions: [String]
        let args: [String]
    }

    var candidateLanguageIdentifier: String? = nil

    static let shared = LanguageService()
    static let configurations: [Configuration] = [
        Configuration(
            languageIdentifier: "python",
            extensions: ["py"],
            args: ["jedi-language-server", "-v"]),
        Configuration(
            languageIdentifier: "java",
            extensions: ["java"],
            args: ["java", "-jar", "${JAVA_LSP_FAT_JAR_PATH}"]),
    ]

    static func configurationFor(url: URL) -> Configuration? {
        return LanguageService.configurations.first(where: {
            $0.extensions.contains(url.pathExtension)
        })
    }
}

/// Uses the same on-device Clang and WASI headers as the terminal compiler.
final class ClangCompletionService {
    static let shared = ClangCompletionService()

    private let queue = DispatchQueue(label: "com.codeapp.clang-completion", qos: .userInitiated)
    private let lock = NSLock()
    private var latestRequests: [UUID: UUID] = [:]

    func complete(
        source: String, url: URL, line: Int, column: Int, client: UUID,
        completion: @escaping ([[String: String]]) -> Void
    ) {
        let request = UUID()
        lock.lock()
        latestRequests[client] = request
        lock.unlock()

        queue.async {
            self.lock.lock()
            let isLatest = self.latestRequests[client] == request
            self.lock.unlock()
            let results = isLatest
                ? self.runClang(source: source, url: url, line: line, column: column) : []
            DispatchQueue.main.async { completion(results) }
        }
    }

    private func runClang(source: String, url: URL, line: Int, column: Int) -> [[String: String]] {
        let isC = ["c", "i"].contains(url.pathExtension.lowercased())
        let snapshot = FileManager.default.temporaryDirectory
            .appendingPathComponent("codeapp-completion-\(UUID().uuidString)")
            .appendingPathExtension(isC ? "c" : "cpp")
        do {
            try source.write(to: snapshot, atomically: true, encoding: .utf8)
        } catch {
            return []
        }
        defer { try? FileManager.default.removeItem(at: snapshot) }

        guard let input = fopen("/dev/null", "r"),
            let output = tmpfile(), let errors = tmpfile()
        else { return [] }
        defer {
            fclose(input)
            fclose(output)
            fclose(errors)
        }

        // A fresh session avoids changing the terminal's working directory or streams.
        let session = strdup("com.codeapp.clang-completion")!
        ios_switchSession(session)
        ios_setContext(session)
        ios_setStreams(input, output, errors)
        defer {
            ios_closeSession(session)
            free(session)
        }

        thread_stdin = nil
        thread_stdout = nil
        thread_stderr = nil
        let location = "-code-completion-at=\(snapshot.path):\(line):\(column)"
        let compiler = isC ? "clang" : "clang++"
        let command = "\(compiler) -fsyntax-only -Xclang \(shellQuote(location)) "
            + "-iquote \(shellQuote(url.deletingLastPathComponent().path)) \(shellQuote(snapshot.path))"
        let pid = ios_fork()
        _ = ios_system(command)
        ios_waitpid(pid)
        ios_releaseThreadId(pid)

        fflush(output)
        rewind(output)
        let data = FileHandle(fileDescriptor: fileno(output), closeOnDealloc: false).readDataToEndOfFile()
        return Self.parse(String(decoding: data, as: UTF8.self))
    }

    private func shellQuote(_ argument: String) -> String {
        "'" + argument.replacingOccurrences(of: "'", with: "'\\''") + "'"
    }

    static func parse(_ output: String) -> [[String: String]] {
        output.split(separator: "\n").compactMap { line in
            let prefix = "COMPLETION: "
            guard line.hasPrefix(prefix) else { return nil }
            let entry = String(line.dropFirst(prefix.count))
            let parts = entry.components(separatedBy: " : ")
            let name = parts[0]
            guard name != "Pattern", !name.isEmpty else { return nil }
            let detail = parts.dropFirst().joined(separator: " : ")
                .replacingOccurrences(of: "[#", with: "")
                .replacingOccurrences(of: "#]", with: " ")
                .replacingOccurrences(of: "<#", with: "")
                .replacingOccurrences(of: "#>", with: "")
                .replacingOccurrences(of: "{#", with: "")
                .replacingOccurrences(of: "#}", with: "")
            return ["name": name, "detail": detail]
        }
    }
}
