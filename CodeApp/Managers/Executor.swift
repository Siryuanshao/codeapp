//
//  executor.swift
//  Code App
//
//  Created by Ken Chung on 12/12/2020.
//

import Darwin
import SwiftUI
import ios_system

class Executor {

    enum State {
        case idle
        case running
        case interactive
    }

    private let sessionIdentifier: UnsafeMutablePointer<CChar>
    private var pid: pid_t? = nil

    private var stdin_file: UnsafeMutablePointer<FILE>?
    private var stdout_file: UnsafeMutablePointer<FILE>?
    private var stdin_file_input: FileHandle? = nil

    private var receivedStdout: ((_ data: Data) -> Void)
    private var receivedStderr: ((_ data: Data) -> Void)
    private var requestInput: ((_ prompt: String) -> Void)
    private var lastCommand: String? = nil
    private let END_OF_TRANSMISSION = "\u{04}"

    var currentWorkingDirectory: URL
    private var workspaceAccess: WorkspaceAccess?
    var state: State = .idle
    var prompt: String

    func setNewWorkingDirectory(url: URL, workspaceAccess: WorkspaceAccess?) {
        currentWorkingDirectory = url
        self.workspaceAccess = workspaceAccess
        prompt = "\(url.lastPathComponent) $ "
    }

    init(
        root: URL, workspaceAccess: WorkspaceAccess? = nil,
        sessionIdentifier: String = "com.thebaselab.terminal",
        onStdout: @escaping ((_ data: Data) -> Void),
        onStderr: @escaping ((_ data: Data) -> Void),
        onRequestInput: @escaping ((_ prompt: String) -> Void)
    ) {
        self.sessionIdentifier = sessionIdentifier.withCString { strdup($0)! }
        currentWorkingDirectory = root
        self.workspaceAccess = workspaceAccess
        prompt = "\(root.lastPathComponent) $ "
        receivedStdout = onStdout
        receivedStderr = onStderr
        requestInput = onRequestInput

        NotificationCenter.default.addObserver(
            self, selector: #selector(onNodeStdout), name: Notification.Name("node.stdout"),
            object: nil)
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
        free(sessionIdentifier)
    }

    func evaluateCommands(_ cmds: [String], securityScopedAccess: WorkspaceAccess? = nil) {
        guard !cmds.isEmpty else {
            return
        }
        var commands = cmds
        dispatch(
            command: commands.removeFirst(),
            completionHandler: { code in
                if !commands.isEmpty && code == 0 {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                        self.evaluateCommands(commands, securityScopedAccess: securityScopedAccess)
                    }
                } else {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                        self.requestInput(self.prompt)
                    }
                }
            })
    }

    func endOfTransmission() {
        try? stdin_file_input?.close()
    }

    func kill() {
        if stopWebAssembly(session: UnsafeRawPointer(sessionIdentifier)) {
            return
        }
        guard recoverCurrentDirectoryIfNeeded() else { return }
        ios_switchSession(sessionIdentifier)
        ios_kill()
    }

    func setWindowSize(cols: Int, rows: Int) {
        ios_setWindowSize(Int32(cols), Int32(rows), sessionIdentifier)
    }

    func sendInput(input: String) {
        guard self.state != .idle, let data = input.data(using: .utf8) else {
            return
        }

        // For wasm
        if state == .running {
            stdinString += input + "\n"
        }

        guard recoverCurrentDirectoryIfNeeded() else { return }
        ios_switchSession(sessionIdentifier)

        stdin_file_input?.write(data)

        if state == .running {
            if let endData = "\n".data(using: .utf8) {
                stdin_file_input?.write(endData)
            }
        }

    }

    @discardableResult
    private func _onStdout(data: Data) -> Bool {
        let finished = data.contains(0x04)
        let output = finished ? Data(data.filter { $0 != 0x04 }) : data
        let str = String(decoding: output, as: UTF8.self)

        if !output.isEmpty {
            DispatchQueue.main.async {
                if self.state == .running {
                    // Interactive Commands /with control characters
                    if str.contains("\u{8}") || str.contains("\u{13}") || str.contains("\r") {
                        self.receivedStdout(output)
                        return
                    }
                    self.requestInput(str)
                    if let prom = str.components(separatedBy: "\n").last {
                        self.prompt = prom
                    }
                } else {
                    self.receivedStdout(output)
                }
            }
        }

        return finished
    }

    // Called when the stderr file handle is written to
    private func onStderr(_ stderr: FileHandle) {
        let data = stderr.availableData
        DispatchQueue.main.async {
            if self.state == .running {
                let str = String(decoding: data, as: UTF8.self)
                self.requestInput(str)
                if let prom = str.components(separatedBy: "\n").last {
                    self.prompt = prom
                }
            } else {
                self.receivedStdout(data)
            }
        }
    }

    func dispatch(
        command: String, isInteractive: Bool = false, completionHandler: @escaping (Int32) -> Void
    ) {
        guard command != "" else {
            completionHandler(0)
            return
        }

        var stdin_pipe = Pipe()
        stdin_file = fdopen(stdin_pipe.fileHandleForReading.fileDescriptor, "r")
        while stdin_file == nil {
            stdin_pipe = Pipe()
            stdin_file = fdopen(stdin_pipe.fileHandleForReading.fileDescriptor, "r")
        }
        stdin_file_input = stdin_pipe.fileHandleForWriting

        var stdout_pipe = Pipe()
        stdout_file = fdopen(stdout_pipe.fileHandleForWriting.fileDescriptor, "w")
        while stdout_file == nil {
            stdout_pipe = Pipe()
            stdout_file = fdopen(stdout_pipe.fileHandleForWriting.fileDescriptor, "w")
        }
        let stdoutLock = NSLock()
        let stdoutFinished = DispatchSemaphore(value: 0)
        var stdoutClosed = false
        stdout_pipe.fileHandleForReading.readabilityHandler = { handle in
            stdoutLock.lock()
            defer { stdoutLock.unlock() }
            guard !stdoutClosed else { return }
            if self._onStdout(data: handle.availableData) {
                stdoutClosed = true
                stdoutFinished.signal()
            }
        }

        let commandDirectory = currentWorkingDirectory
        let commandAccess = workspaceAccess
        let queue = DispatchQueue(label: "\(command)", qos: .utility)

        queue.async {
            defer { withExtendedLifetime(commandAccess) {} }
            if isInteractive {
                self.state = .interactive
            } else {
                self.state = .running
            }

            self.lastCommand = command
            Thread.current.name = command

            let directoryAvailable = FileManager.default.changeCurrentDirectoryPath(
                commandDirectory.path)
            let code: Int32
            if directoryAvailable {
                ios_switchSession(self.sessionIdentifier)
                ios_setDirectoryURL(commandDirectory)
                ios_setContext(self.sessionIdentifier)
                ios_setStreams(self.stdin_file, self.stdout_file, self.stdout_file)
                code = self.run(command: command)
            } else {
                _ = self.recoverCurrentDirectoryIfNeeded()
                let message = String(
                    format: NSLocalizedString("terminal.directory_unavailable", comment: ""),
                    commandDirectory.lastPathComponent)
                DispatchQueue.main.async {
                    self.receivedStderr(Data("\(message)\r\n".utf8))
                }
                code = 1
            }

            try? stdin_pipe.fileHandleForReading.close()
            self.stdin_file_input = nil

            // Send info to the stdout handler that the command has finished:
            let writeOpen = fcntl(stdout_pipe.fileHandleForWriting.fileDescriptor, F_GETFD)
            if writeOpen >= 0 {
                // Pipe is still open, send information to close it, once all output has been processed.
                stdout_pipe.fileHandleForWriting.write(self.END_OF_TRANSMISSION.data(using: .utf8)!)
                stdoutFinished.wait()
            }

            stdoutLock.lock()
            stdoutClosed = true
            stdout_pipe.fileHandleForReading.readabilityHandler = nil
            try? stdout_pipe.fileHandleForReading.close()
            stdoutLock.unlock()

            DispatchQueue.main.async {
                self.state = .idle
            }

            if directoryAvailable {
                var url = URL(fileURLWithPath: FileManager().currentDirectoryPath)

                // Sometimes pip would change the working directory to an inaccesible location,
                // we need to verify that the current directory is readable.
                if (try? FileManager.default.contentsOfDirectory(
                    at: url, includingPropertiesForKeys: nil)) == nil
                {
                    url = commandDirectory
                }

                ios_setMiniRootURL(url)

                DispatchQueue.main.async {
                    guard self.currentWorkingDirectory == commandDirectory else { return }
                    self.prompt = "\(url.lastPathComponent.removingPercentEncoding ?? "") $ "
                    self.currentWorkingDirectory = url
                }
            }

            completionHandler(code)
        }
    }

    private func recoverCurrentDirectoryIfNeeded() -> Bool {
        var path = [CChar](repeating: 0, count: Int(PATH_MAX))
        if getcwd(&path, path.count) != nil { return true }
        return FileManager.default.changeCurrentDirectoryPath(currentWorkingDirectory.path)
            || FileManager.default.changeCurrentDirectoryPath(getRootDirectory().path)
    }

    private func run(command: String) -> Int32 {
        NSLog("Running command: \(command)")

        // ios_system requires these to be set to nil before command execution
        thread_stdin = nil
        thread_stdout = nil
        thread_stderr = nil

        pid = ios_fork()
        _ = ios_system(command)
        ios_waitpid(pid!)
        let returnCode = ios_getCommandStatus()
        ios_releaseThreadId(pid!)
        pid = nil

        // Flush pipes to make sure all data is read
        fflush(thread_stdout)
        fflush(thread_stderr)

        return returnCode
    }

    @objc private func onNodeStdout(_ notification: Notification) {
        guard let content = notification.userInfo?["content"] as? String else {
            return
        }
        if let data = content.data(using: .utf8) {
            _onStdout(data: data)
        }
    }
}

extension Executor.State {
    var displayName: String {
        switch self {
        case .idle:
            return NSLocalizedString("Idle", comment: "Executor state label")
        case .running:
            return NSLocalizedString("Running", comment: "Executor state label")
        case .interactive:
            return NSLocalizedString("Interactive", comment: "Executor state label")
        }
    }
}
