import Foundation

/// Holds one successful security-scoped access until its last user is finished.
final class WorkspaceAccess {
    let url: URL
    let isAccessing: Bool
    private let stopAccess: (URL) -> Void

    init(
        url: URL,
        startAccess: (URL) -> Bool = { $0.startAccessingSecurityScopedResource() },
        stopAccess: @escaping (URL) -> Void = { $0.stopAccessingSecurityScopedResource() }
    ) {
        self.url = url
        self.isAccessing = startAccess(url)
        self.stopAccess = stopAccess
    }

    deinit {
        if isAccessing {
            stopAccess(url)
        }
    }

    func contains(_ target: URL) -> Bool {
        WorkspaceBookmark.relativePath(from: url, to: target) != nil
    }
}

struct WorkspaceLocation {
    let url: URL
    let accessURL: URL
    let isStale: Bool
}

enum WorkspaceBookmark {
    private struct NestedBookmark: Codable {
        let bookmark: Data
        let relativePath: [String]
    }

    static func relativePath(from root: URL, to target: URL) -> [String]? {
        guard root.isFileURL && target.isFileURL else { return nil }
        let rootComponents = root.resolvingSymlinksInPath().standardizedFileURL.pathComponents
        let targetComponents = target.resolvingSymlinksInPath().standardizedFileURL.pathComponents
        guard targetComponents.starts(with: rootComponents) else { return nil }
        return Array(targetComponents.dropFirst(rootComponents.count))
    }

    static func make(url: URL, accessURL: URL?) throws -> Data {
        guard let accessURL, let relativePath = relativePath(from: accessURL, to: url) else {
            return try url.bookmarkData()
        }
        let bookmark = try accessURL.bookmarkData()
        guard !relativePath.isEmpty else { return bookmark }
        return try PropertyListEncoder().encode(
            NestedBookmark(bookmark: bookmark, relativePath: relativePath))
    }

    static func resolve(_ data: Data) throws -> WorkspaceLocation {
        let nested = try? PropertyListDecoder().decode(NestedBookmark.self, from: data)
        var isStale = false
        let accessURL = try URL(
            resolvingBookmarkData: nested?.bookmark ?? data,
            options: .withoutImplicitStartAccessing,
            relativeTo: nil,
            bookmarkDataIsStale: &isStale)
        let url = (nested?.relativePath ?? []).reduce(accessURL) {
            $0.appendingPathComponent($1, isDirectory: true)
        }
        return WorkspaceLocation(url: url, accessURL: accessURL, isStale: isStale)
    }
}
