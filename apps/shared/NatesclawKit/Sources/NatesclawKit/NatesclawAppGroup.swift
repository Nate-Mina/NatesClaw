import Foundation

public enum NatesclawAppGroup {
    public static let canonicalIdentifier = "group.ai.natesclawfoundation.app.shared"

    public static var identifier: String {
        let raw = Bundle.main.object(forInfoDictionaryKey: "NatesclawAppGroupIdentifier") as? String
        let trimmed = raw?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return trimmed.isEmpty ? self.canonicalIdentifier : trimmed
    }
}
