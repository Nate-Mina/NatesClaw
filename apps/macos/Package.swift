// swift-tools-version: 6.2
// Package manifest for the Natesclaw macOS companion (menu bar app + IPC library).

import PackageDescription

let package = Package(
    name: "Natesclaw",
    platforms: [
        .macOS(.v15),
    ],
    products: [
        .library(name: "NatesclawIPC", targets: ["NatesclawIPC"]),
        .library(name: "NatesclawDiscovery", targets: ["NatesclawDiscovery"]),
        .executable(name: "Natesclaw", targets: ["Natesclaw"]),
        .executable(name: "natesclaw-mac", targets: ["NatesclawMacCLI"]),
    ],
    dependencies: [
        .package(url: "https://github.com/sindresorhus/KeyboardShortcuts", exact: "3.0.1"),
        .package(url: "https://github.com/orchetect/MenuBarExtraAccess", exact: "1.3.0"),
        .package(url: "https://github.com/swiftlang/swift-subprocess.git", from: "0.4.0"),
        .package(url: "https://github.com/apple/swift-log.git", from: "1.12.0"),
        .package(url: "https://github.com/sparkle-project/Sparkle", from: "2.9.0"),
        .package(url: "https://github.com/steipete/Peekaboo.git", exact: "3.9.8"),
        .package(url: "https://github.com/pointfreeco/swift-concurrency-extras", from: "1.3.1"),
        .package(path: "../shared/NatesclawKit"),
        .package(path: "../shared/NatesclawMLXTTSProtocol"),
        .package(path: "../swabble"),
    ],
    targets: [
        .target(
            name: "NatesclawCameraPTZNative",
            path: "Sources/NatesclawCameraPTZNative",
            publicHeadersPath: "include",
            linkerSettings: [
                .linkedFramework("CoreFoundation"),
                .linkedFramework("IOKit"),
            ]),
        .target(
            name: "NatesclawIPC",
            dependencies: [],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "NatesclawDiscovery",
            dependencies: [
                .product(name: "NatesclawKit", package: "NatesclawKit"),
                .product(name: "Subprocess", package: "swift-subprocess"),
            ],
            path: "Sources/NatesclawDiscovery",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "Natesclaw",
            dependencies: [
                "NatesclawIPC",
                "NatesclawDiscovery",
                "NatesclawCameraPTZNative",
                .product(name: "NatesclawNativeState", package: "NatesclawKit"),
                .product(name: "NatesclawKit", package: "NatesclawKit"),
                .product(name: "NatesclawChatUI", package: "NatesclawKit"),
                .product(name: "NatesclawMLXTTSProtocol", package: "NatesclawMLXTTSProtocol"),
                .product(name: "NatesclawProtocol", package: "NatesclawKit"),
                .product(name: "SwabbleKit", package: "swabble"),
                .product(name: "MenuBarExtraAccess", package: "MenuBarExtraAccess"),
                .product(name: "Subprocess", package: "swift-subprocess"),
                .product(name: "Logging", package: "swift-log"),
                .product(name: "Sparkle", package: "Sparkle"),
                .product(name: "PeekabooBridge", package: "Peekaboo"),
                .product(name: "PeekabooAutomationKit", package: "Peekaboo"),
                .product(name: "ConcurrencyExtras", package: "swift-concurrency-extras"),
                .product(name: "KeyboardShortcuts", package: "KeyboardShortcuts"),
            ],
            exclude: [
                "Resources/Info.plist",
                "Resources/Localizable.xcstrings",
            ],
            resources: [
                .copy("Resources/Natesclaw.icns"),
                .copy("Resources/DeviceModels"),
                .copy("Resources/ProviderIcons"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "NatesclawMacCLI",
            dependencies: [
                "NatesclawDiscovery",
                .product(name: "NatesclawKit", package: "NatesclawKit"),
                .product(name: "NatesclawProtocol", package: "NatesclawKit"),
            ],
            path: "Sources/NatesclawMacCLI",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .testTarget(
            name: "NatesclawIPCTests",
            dependencies: [
                "NatesclawIPC",
                "Natesclaw",
                "NatesclawMacCLI",
                "NatesclawDiscovery",
                .product(name: "NatesclawChatUI", package: "NatesclawKit"),
                .product(name: "NatesclawKit", package: "NatesclawKit"),
                .product(name: "NatesclawMLXTTSProtocol", package: "NatesclawMLXTTSProtocol"),
                .product(name: "NatesclawProtocol", package: "NatesclawKit"),
                .product(name: "SwabbleKit", package: "swabble"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableExperimentalFeature("SwiftTesting"),
            ]),
    ])
