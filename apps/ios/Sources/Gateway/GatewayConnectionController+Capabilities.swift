import AVFoundation
import Contacts
import CoreLocation
import CoreMotion
import EventKit
import Foundation
import NatesclawKit
import ReplayKit
import Speech
import UIKit

struct GatewayManualTransportPresentation: Equatable {
    let requiresTLS: Bool
    let effectiveTLS: Bool
    let helperText: String?
}

extension GatewayConnectionController {
    func buildGatewayURL(host: String, port: Int, useTLS: Bool) -> URL? {
        let scheme = useTLS ? "wss" : "ws"
        var components = URLComponents()
        components.scheme = scheme
        components.host = host
        components.port = port
        return components.url
    }

    func resolveManualUseTLS(host: String, useTLS: Bool) -> Bool {
        Self.manualTransportPresentation(
            host: host,
            requestedTLS: useTLS).effectiveTLS
    }

    static func manualTransportPresentation(
        host: String,
        requestedTLS: Bool) -> GatewayManualTransportPresentation
    {
        let trimmedHost = host.trimmingCharacters(in: .whitespacesAndNewlines)
        let requiresTLS = !trimmedHost.isEmpty && !LoopbackHost.isLocalNetworkHost(trimmedHost)
        let effectiveTLS = requestedTLS || requiresTLS
        let helperText: String? = if requiresTLS {
            String(localized: "Secure connection is required for this host.")
        } else if effectiveTLS {
            nil
        } else {
            String(localized: "Use only on a trusted private network.")
        }
        return GatewayManualTransportPresentation(
            requiresTLS: requiresTLS,
            effectiveTLS: effectiveTLS,
            helperText: helperText)
    }

    func manualStableID(host: String, port: Int) -> String {
        ManualAuthOverride.manualStableID(host: host, port: port)
    }

    func makeConnectOptions(
        stableID: String?,
        deviceAuthGatewayID: String?,
        allowStoredDeviceAuth: Bool = true) async -> GatewayConnectOptions
    {
        let defaults = UserDefaults.standard
        let displayName = self.resolvedDisplayName(defaults: defaults)
        let resolvedClientId = self.resolvedClientId(defaults: defaults, stableID: stableID)
        let permissions = await self.currentPermissions()

        return GatewayConnectOptions(
            role: "node",
            scopes: [],
            caps: self.currentCaps(),
            commands: self.currentCommands(),
            permissions: permissions,
            clientId: resolvedClientId,
            clientMode: "node",
            clientDisplayName: displayName,
            allowStoredDeviceAuth: allowStoredDeviceAuth,
            deviceAuthGatewayID: GatewayStableIdentifier.exact(deviceAuthGatewayID))
    }

    private func resolvedClientId(defaults: UserDefaults, stableID: String?) -> String {
        if let stableID,
           let override = GatewaySettingsStore.loadGatewayClientIdOverride(stableID: stableID)
        {
            return override
        }
        let manualClientId = defaults.string(forKey: "gateway.manual.clientId")?
            .trimmingCharacters(in: .whitespacesAndNewlines)
        if manualClientId?.isEmpty == false {
            return manualClientId!
        }
        return "natesclaw-ios"
    }

    private func resolvedDisplayName(defaults: UserDefaults) -> String {
        let key = "node.displayName"
        let existingRaw = defaults.string(forKey: key)
        let resolved = NodeDisplayName.resolve(
            existing: existingRaw,
            deviceName: UIDevice.current.name,
            interfaceIdiom: UIDevice.current.userInterfaceIdiom)
        let existing = existingRaw?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        if existing.isEmpty || NodeDisplayName.isGeneric(existing) {
            defaults.set(resolved, forKey: key)
        }
        return resolved
    }

    private func currentCaps() -> [String] {
        var caps = [
            NatesclawCapability.canvas.rawValue,
            NatesclawCapability.screen.rawValue,
        ]

        // Default-on: if the key doesn't exist yet, treat it as enabled.
        let cameraEnabled =
            UserDefaults.standard.object(forKey: "camera.enabled") == nil
                ? true
                : UserDefaults.standard.bool(forKey: "camera.enabled")
        if cameraEnabled { caps.append(NatesclawCapability.camera.rawValue) }

        let voiceWakeEnabled = UserDefaults.standard.bool(forKey: VoiceWakePreferences.enabledKey)
        if voiceWakeEnabled { caps.append(NatesclawCapability.voiceWake.rawValue) }

        let locationModeRaw = UserDefaults.standard.string(forKey: "location.enabledMode") ?? "off"
        let locationMode = NatesclawLocationMode(rawValue: locationModeRaw) ?? .off
        if locationMode != .off { caps.append(NatesclawCapability.location.rawValue) }

        caps.append(NatesclawCapability.device.rawValue)
        caps.append(NatesclawCapability.talk.rawValue)
        if WatchMessagingService.isSupportedOnDevice() {
            caps.append(NatesclawCapability.watch.rawValue)
        }
        caps.append(NatesclawCapability.photos.rawValue)
        caps.append(NatesclawCapability.contacts.rawValue)
        caps.append(NatesclawCapability.calendar.rawValue)
        caps.append(NatesclawCapability.reminders.rawValue)
        if Self.motionAvailable() {
            caps.append(NatesclawCapability.motion.rawValue)
        }
        if HealthAuthorization.isEnabled {
            caps.append(NatesclawCapability.health.rawValue)
        }

        return caps
    }

    private func currentCommands() -> [String] {
        var commands: [String] = [
            NatesclawCanvasCommand.present.rawValue,
            NatesclawCanvasCommand.hide.rawValue,
            NatesclawCanvasCommand.navigate.rawValue,
            NatesclawCanvasCommand.evalJS.rawValue,
            NatesclawCanvasCommand.snapshot.rawValue,
            NatesclawCanvasA2UICommand.push.rawValue,
            NatesclawCanvasA2UICommand.pushJSONL.rawValue,
            NatesclawCanvasA2UICommand.reset.rawValue,
            NatesclawScreenCommand.record.rawValue,
            NatesclawSystemCommand.notify.rawValue,
            NatesclawChatCommand.push.rawValue,
            NatesclawTalkCommand.pttStart.rawValue,
            NatesclawTalkCommand.pttStop.rawValue,
            NatesclawTalkCommand.pttCancel.rawValue,
            NatesclawTalkCommand.pttOnce.rawValue,
        ]

        let caps = Set(self.currentCaps())
        if caps.contains(NatesclawCapability.camera.rawValue) {
            commands.append(NatesclawCameraCommand.list.rawValue)
            commands.append(NatesclawCameraCommand.snap.rawValue)
            commands.append(NatesclawCameraCommand.clip.rawValue)
        }
        if caps.contains(NatesclawCapability.location.rawValue) {
            commands.append(NatesclawLocationCommand.get.rawValue)
        }
        if caps.contains(NatesclawCapability.device.rawValue) {
            commands.append(NatesclawDeviceCommand.status.rawValue)
            commands.append(NatesclawDeviceCommand.info.rawValue)
        }
        if caps.contains(NatesclawCapability.watch.rawValue) {
            commands.append(NatesclawWatchCommand.status.rawValue)
            commands.append(NatesclawWatchCommand.notify.rawValue)
        }
        if caps.contains(NatesclawCapability.photos.rawValue) {
            commands.append(NatesclawPhotosCommand.latest.rawValue)
        }
        if caps.contains(NatesclawCapability.contacts.rawValue) {
            commands.append(NatesclawContactsCommand.search.rawValue)
            commands.append(NatesclawContactsCommand.add.rawValue)
        }
        if caps.contains(NatesclawCapability.calendar.rawValue) {
            commands.append(NatesclawCalendarCommand.events.rawValue)
            commands.append(NatesclawCalendarCommand.add.rawValue)
        }
        if caps.contains(NatesclawCapability.reminders.rawValue) {
            commands.append(NatesclawRemindersCommand.list.rawValue)
            commands.append(NatesclawRemindersCommand.add.rawValue)
        }
        if caps.contains(NatesclawCapability.motion.rawValue) {
            commands.append(NatesclawMotionCommand.activity.rawValue)
            commands.append(NatesclawMotionCommand.pedometer.rawValue)
        }
        if caps.contains(NatesclawCapability.health.rawValue) {
            commands.append(NatesclawHealthCommand.summary.rawValue)
        }

        return commands
    }

    private func currentPermissions() async -> [String: Bool] {
        var permissions: [String: Bool] = [:]
        permissions["camera"] = AVCaptureDevice.authorizationStatus(for: .video) == .authorized
        permissions["microphone"] = AVCaptureDevice.authorizationStatus(for: .audio) == .authorized
        permissions["speechRecognition"] = SFSpeechRecognizer.authorizationStatus() == .authorized
        let locationStatus = self.locationAuthorizationSnapshot.authorizationStatus
        let locationServicesEnabled = await Self.locationServicesEnabled()
        permissions["location"] = Self.isLocationAvailable(
            servicesEnabled: locationServicesEnabled,
            status: locationStatus)
        permissions["screenRecording"] = RPScreenRecorder.shared().isAvailable

        permissions["photos"] = PhotoLibraryAccess.canRead(PhotoLibraryAccess.authorizationStatus())
        let contactsStatus = CNContactStore.authorizationStatus(for: .contacts)
        permissions["contacts"] = contactsStatus == .authorized || contactsStatus == .limited

        let calendarStatus = EKEventStore.authorizationStatus(for: .event)
        permissions["calendar"] = Self.hasEventKitReadAccess(calendarStatus)
        let remindersStatus = EKEventStore.authorizationStatus(for: .reminder)
        permissions["reminders"] = Self.hasEventKitReadAccess(remindersStatus)

        let motionStatus = CMMotionActivityManager.authorizationStatus()
        let pedometerStatus = CMPedometer.authorizationStatus()
        permissions["motion"] =
            motionStatus == .authorized || pedometerStatus == .authorized

        return permissions
    }

    private static func locationServicesEnabled() async -> Bool {
        await Task.detached(priority: .utility) {
            CLLocationManager.locationServicesEnabled()
        }.value
    }

    private static func isLocationAvailable(servicesEnabled: Bool, status: CLAuthorizationStatus) -> Bool {
        guard servicesEnabled else { return false }
        switch status {
        case .authorizedAlways, .authorizedWhenInUse:
            return true
        default:
            return false
        }
    }

    private static func hasEventKitReadAccess(_ status: EKAuthorizationStatus) -> Bool {
        status == .fullAccess
    }

    private static func motionAvailable() -> Bool {
        CMMotionActivityManager.isActivityAvailable() || CMPedometer.isStepCountingAvailable()
    }
}

#if DEBUG
extension GatewayConnectionController {
    func _test_resolvedDisplayName(defaults: UserDefaults) -> String {
        self.resolvedDisplayName(defaults: defaults)
    }

    func _test_currentCaps() -> [String] {
        self.currentCaps()
    }

    func _test_currentCommands() -> [String] {
        self.currentCommands()
    }

    func _test_currentPermissions() async -> [String: Bool] {
        await self.currentPermissions()
    }

    static func _test_hasEventKitReadAccess(_ status: EKAuthorizationStatus) -> Bool {
        self.hasEventKitReadAccess(status)
    }

    static func _test_isLocationAvailable(servicesEnabled: Bool, status: CLAuthorizationStatus) -> Bool {
        self.isLocationAvailable(servicesEnabled: servicesEnabled, status: status)
    }

    func _test_resolveManualUseTLS(host: String, useTLS: Bool) -> Bool {
        self.resolveManualUseTLS(host: host, useTLS: useTLS)
    }
}
#endif
