import Foundation

@main
struct WorkspaceAccessTests {
    static func main() throws {
        let base = FileManager.default.temporaryDirectory
            .appendingPathComponent("workspace-access-tests-\(UUID().uuidString)", isDirectory: true)
        let root = base.appendingPathComponent("project", isDirectory: true)
        let child = root.appendingPathComponent("nested/child", isDirectory: true)
        let sibling = base.appendingPathComponent("project-other", isDirectory: true)
        try FileManager.default.createDirectory(at: child, withIntermediateDirectories: true)
        try FileManager.default.createDirectory(at: sibling, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: base) }

        var started = 0
        var stopped = 0
        var workspace: WorkspaceAccess? = WorkspaceAccess(
            url: root,
            startAccess: { _ in started += 1; return true },
            stopAccess: { _ in stopped += 1 })
        var runningCommand = workspace
        precondition(started == 1 && stopped == 0)
        precondition(workspace!.contains(child))
        precondition(!workspace!.contains(sibling))
        workspace = nil
        precondition(stopped == 0, "An active command must retain the folder access")
        precondition(runningCommand != nil)
        runningCommand = nil
        precondition(stopped == 1, "The last user must release the folder access")

        var failedAccess: WorkspaceAccess? = WorkspaceAccess(
            url: root,
            startAccess: { _ in false },
            stopAccess: { _ in stopped += 1 })
        precondition(failedAccess?.isAccessing == false)
        failedAccess = nil
        precondition(stopped == 1, "An unsuccessful start must not be stopped")

        let legacy = try root.bookmarkData()
        let legacyLocation = try WorkspaceBookmark.resolve(legacy)
        precondition(legacyLocation.url.resolvingSymlinksInPath() == root.resolvingSymlinksInPath())

        let nested = try WorkspaceBookmark.make(url: child, accessURL: root)
        let nestedLocation = try WorkspaceBookmark.resolve(nested)
        precondition(nestedLocation.url.resolvingSymlinksInPath() == child.resolvingSymlinksInPath())
        precondition(nestedLocation.accessURL.resolvingSymlinksInPath() == root.resolvingSymlinksInPath())

        let separate = try WorkspaceBookmark.make(url: sibling, accessURL: root)
        let separateLocation = try WorkspaceBookmark.resolve(separate)
        precondition(separateLocation.url.resolvingSymlinksInPath() == sibling.resolvingSymlinksInPath())
        precondition(separateLocation.accessURL.resolvingSymlinksInPath() == sibling.resolvingSymlinksInPath())
        print("Workspace access tests passed")
    }
}
