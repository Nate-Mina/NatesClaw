import Foundation

// Stable identifier used for both the macOS LaunchAgent label and Nix-managed defaults suite.
// nix-natesclaw writes app defaults into this suite to survive app bundle identifier churn.
let launchdLabel = "ai.natesclaw.mac"
var gatewayLaunchdLabel: String {
    AppProfile.current.gatewayLaunchAgentLabel
}

let nodeLaunchdLabel = "ai.natesclaw.node"
let onboardingVersionKey = "natesclaw.onboardingVersion"
let onboardingSeenKey = "natesclaw.onboardingSeen"
let onboardingSystemAgentPendingKey = "natesclaw.onboardingSystemAgentPending"
// Pre-rename releases persisted pending activations under the Crestodian key.
let onboardingSystemAgentPendingRetiredKey = "natesclaw.onboardingCrestodianPending"
let currentOnboardingVersion = 8
let pauseDefaultsKey = "natesclaw.pauseEnabled"
let iconAnimationsEnabledKey = "natesclaw.iconAnimationsEnabled"
let swabbleEnabledKey = "natesclaw.swabbleEnabled"
let swabbleTriggersKey = "natesclaw.swabbleTriggers"
let voiceWakeTriggerChimeKey = "natesclaw.voiceWakeTriggerChime"
let voiceWakeSendChimeKey = "natesclaw.voiceWakeSendChime"
let showDockIconKey = "natesclaw.showDockIcon"
let defaultVoiceWakeTriggers = ["natesclaw"]
let voiceWakeMaxWords = 32
let voiceWakeMaxWordLength = 64
let voiceWakeMicKey = "natesclaw.voiceWakeMicID"
let voiceWakeMicNameKey = "natesclaw.voiceWakeMicName"
let voiceWakeLocaleKey = "natesclaw.voiceWakeLocaleID"
let voiceWakeAdditionalLocalesKey = "natesclaw.voiceWakeAdditionalLocaleIDs"
let voicePushToTalkEnabledKey = "natesclaw.voicePushToTalkEnabled"
let voiceWakeTriggersTalkModeKey = "natesclaw.voiceWakeTriggersTalkMode"
let talkEnabledKey = "natesclaw.talkEnabled"
let talkPhaseSoundsEnabledKey = "natesclaw.talkPhaseSoundsEnabled"
let talkShiftToStopEnabledKey = "natesclaw.talkShiftToStopEnabled"
let iconOverrideKey = "natesclaw.iconOverride"
let connectionModeKey = "natesclaw.connectionMode"
let remoteTargetKey = "natesclaw.remoteTarget"
let remoteIdentityKey = "natesclaw.remoteIdentity"
let remoteProjectRootKey = "natesclaw.remoteProjectRoot"
let remoteCliPathKey = "natesclaw.remoteCliPath"
let canvasEnabledKey = "natesclaw.canvasEnabled"
let quickChatEnabledKey = "natesclaw.quickChatEnabled"
let cameraEnabledKey = "natesclaw.cameraEnabled"
let computerControlEnabledKey = "natesclaw.computerControlEnabled"

func isComputerControlEnabled(defaults: UserDefaults = AppDefaults.standard) -> Bool {
    // object(forKey:) preserves an explicit false; bool(forKey:) would conflate it with an unset default.
    defaults.object(forKey: computerControlEnabledKey) as? Bool ?? true
}

let activeComputerPresenceEnabledKey = "natesclaw.activeComputerPresenceEnabled"
let locationModeKey = "natesclaw.locationMode"
let locationPreciseKey = "natesclaw.locationPreciseEnabled"
let peekabooBridgeEnabledKey = "natesclaw.peekabooBridgeEnabled"
let deepLinkKeyKey = "natesclaw.deepLinkKey"
let cliInstallPromptedVersionKey = "natesclaw.cliInstallPromptedVersion"
let cliInstallPolicyKey = "natesclaw.cliInstallPolicy"
let cliManagedRestartPendingKey = "natesclaw.cliManagedRestartPending"
let postAppUpdateReceiptKey = "natesclaw.postAppUpdateReceipt"
let lastLaunchedAppVersionKey = "natesclaw.lastLaunchedAppVersion"
let cliValidatedExecutableKey = "natesclaw.cliValidatedExecutable"
let cliValidatedVersionKey = "natesclaw.cliValidatedVersion"
let macNodeIdentityProfileKey = "natesclaw.macNodeIdentityProfile"
let heartbeatsEnabledKey = "natesclaw.heartbeatsEnabled"
let debugPaneEnabledKey = "natesclaw.debugPaneEnabled"
let nativeSettingsPanesEnabledKey = "natesclaw.nativeSettingsPanesEnabled"
let debugFileLogEnabledKey = "natesclaw.debug.fileLogEnabled"
let appLogLevelKey = "natesclaw.debug.appLogLevel"
let voiceWakeSupported: Bool = ProcessInfo.processInfo.operatingSystemVersion.majorVersion >= 26
