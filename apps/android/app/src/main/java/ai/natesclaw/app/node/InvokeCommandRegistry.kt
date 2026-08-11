package ai.natesclaw.app.node

import ai.natesclaw.app.protocol.NatesclawCalendarCommand
import ai.natesclaw.app.protocol.NatesclawCallLogCommand
import ai.natesclaw.app.protocol.NatesclawCameraCommand
import ai.natesclaw.app.protocol.NatesclawCanvasA2UICommand
import ai.natesclaw.app.protocol.NatesclawCanvasCommand
import ai.natesclaw.app.protocol.NatesclawCapability
import ai.natesclaw.app.protocol.NatesclawContactsCommand
import ai.natesclaw.app.protocol.NatesclawDeviceCommand
import ai.natesclaw.app.protocol.NatesclawLocationCommand
import ai.natesclaw.app.protocol.NatesclawMobileUiCommand
import ai.natesclaw.app.protocol.NatesclawMotionCommand
import ai.natesclaw.app.protocol.NatesclawNotificationsCommand
import ai.natesclaw.app.protocol.NatesclawPhotosCommand
import ai.natesclaw.app.protocol.NatesclawSmsCommand
import ai.natesclaw.app.protocol.NatesclawSystemCommand
import ai.natesclaw.app.protocol.NatesclawTalkCommand

/** Runtime feature flags used to decide which node tools are advertised. */
data class NodeRuntimeFlags(
  val cameraEnabled: Boolean,
  val locationEnabled: Boolean,
  val sendSmsAvailable: Boolean,
  val readSmsAvailable: Boolean,
  val smsSearchPossible: Boolean,
  val callLogAvailable: Boolean,
  val photosAvailable: Boolean,
  val motionActivityAvailable: Boolean,
  val motionPedometerAvailable: Boolean,
  val installedAppsSharingEnabled: Boolean,
  val debugBuild: Boolean,
  val voiceWakeEnabled: Boolean = false,
  val mobileUiAvailable: Boolean = false,
)

/** Per-command availability gates checked before advertising invoke methods. */
enum class InvokeCommandAvailability {
  Always,
  CameraEnabled,
  LocationEnabled,
  SendSmsAvailable,
  ReadSmsAvailable,
  RequestableSmsSearchAvailable,
  CallLogAvailable,
  PhotosAvailable,
  MotionActivityAvailable,
  MotionPedometerAvailable,
  InstalledAppsSharingEnabled,
  DebugBuild,
  MobileUiAvailable,
}

/** Per-capability availability gates for the node capabilities manifest. */
enum class NodeCapabilityAvailability {
  Always,
  CameraEnabled,
  LocationEnabled,
  SmsAvailable,
  CallLogAvailable,
  PhotosAvailable,
  MotionAvailable,
  VoiceWakeEnabled,
  MobileUiAvailable,
}

/** Capability entry reported to the gateway when its availability gate passes. */
data class NodeCapabilitySpec(
  val name: String,
  val availability: NodeCapabilityAvailability = NodeCapabilityAvailability.Always,
)

/** Invoke method entry advertised to gateway plus foreground routing metadata. */
data class InvokeCommandSpec(
  val name: String,
  val requiresForeground: Boolean = false,
  val availability: InvokeCommandAvailability = InvokeCommandAvailability.Always,
)

object InvokeCommandRegistry {
  /** Capabilities mirror gateway protocol ids and are filtered by device state. */
  val capabilityManifest: List<NodeCapabilitySpec> =
    listOf(
      NodeCapabilitySpec(name = NatesclawCapability.Canvas.rawValue),
      NodeCapabilitySpec(name = NatesclawCapability.Device.rawValue),
      NodeCapabilitySpec(name = NatesclawCapability.Notifications.rawValue),
      NodeCapabilitySpec(name = NatesclawCapability.System.rawValue),
      NodeCapabilitySpec(
        name = NatesclawCapability.Camera.rawValue,
        availability = NodeCapabilityAvailability.CameraEnabled,
      ),
      NodeCapabilitySpec(
        name = NatesclawCapability.Sms.rawValue,
        availability = NodeCapabilityAvailability.SmsAvailable,
      ),
      NodeCapabilitySpec(name = NatesclawCapability.Talk.rawValue),
      NodeCapabilitySpec(
        name = NatesclawCapability.Location.rawValue,
        availability = NodeCapabilityAvailability.LocationEnabled,
      ),
      NodeCapabilitySpec(
        name = NatesclawCapability.Photos.rawValue,
        availability = NodeCapabilityAvailability.PhotosAvailable,
      ),
      NodeCapabilitySpec(name = NatesclawCapability.Contacts.rawValue),
      NodeCapabilitySpec(name = NatesclawCapability.Calendar.rawValue),
      NodeCapabilitySpec(
        name = NatesclawCapability.Motion.rawValue,
        availability = NodeCapabilityAvailability.MotionAvailable,
      ),
      NodeCapabilitySpec(
        name = NatesclawCapability.CallLog.rawValue,
        availability = NodeCapabilityAvailability.CallLogAvailable,
      ),
      NodeCapabilitySpec(
        name = NatesclawCapability.VoiceWake.rawValue,
        availability = NodeCapabilityAvailability.VoiceWakeEnabled,
      ),
      NodeCapabilitySpec(
        name = NatesclawCapability.MobileUI.rawValue,
        availability = NodeCapabilityAvailability.MobileUiAvailable,
      ),
    )

  /** Complete Android node command catalog before runtime availability filtering. */
  val all: List<InvokeCommandSpec> =
    listOf(
      InvokeCommandSpec(
        name = NatesclawCanvasCommand.Present.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = NatesclawCanvasCommand.Hide.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = NatesclawCanvasCommand.Navigate.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = NatesclawCanvasCommand.Eval.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = NatesclawCanvasCommand.Snapshot.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = NatesclawCanvasA2UICommand.Push.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = NatesclawCanvasA2UICommand.PushJSONL.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = NatesclawCanvasA2UICommand.Reset.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = NatesclawSystemCommand.Notify.rawValue,
      ),
      InvokeCommandSpec(
        name = NatesclawTalkCommand.PttStart.rawValue,
      ),
      InvokeCommandSpec(
        name = NatesclawTalkCommand.PttStop.rawValue,
      ),
      InvokeCommandSpec(
        name = NatesclawTalkCommand.PttCancel.rawValue,
      ),
      InvokeCommandSpec(
        name = NatesclawTalkCommand.PttOnce.rawValue,
        requiresForeground = true,
      ),
      InvokeCommandSpec(
        name = NatesclawCameraCommand.List.rawValue,
        requiresForeground = true,
        availability = InvokeCommandAvailability.CameraEnabled,
      ),
      InvokeCommandSpec(
        name = NatesclawCameraCommand.Snap.rawValue,
        requiresForeground = true,
        availability = InvokeCommandAvailability.CameraEnabled,
      ),
      InvokeCommandSpec(
        name = NatesclawCameraCommand.Clip.rawValue,
        requiresForeground = true,
        availability = InvokeCommandAvailability.CameraEnabled,
      ),
      InvokeCommandSpec(
        name = NatesclawLocationCommand.Get.rawValue,
        availability = InvokeCommandAvailability.LocationEnabled,
      ),
      InvokeCommandSpec(
        name = NatesclawDeviceCommand.Status.rawValue,
      ),
      InvokeCommandSpec(
        name = NatesclawDeviceCommand.Info.rawValue,
      ),
      InvokeCommandSpec(
        name = NatesclawDeviceCommand.Permissions.rawValue,
      ),
      InvokeCommandSpec(
        name = NatesclawDeviceCommand.Health.rawValue,
      ),
      InvokeCommandSpec(
        name = NatesclawDeviceCommand.Apps.rawValue,
        availability = InvokeCommandAvailability.InstalledAppsSharingEnabled,
      ),
      InvokeCommandSpec(
        name = NatesclawNotificationsCommand.List.rawValue,
      ),
      InvokeCommandSpec(
        name = NatesclawNotificationsCommand.Actions.rawValue,
      ),
      InvokeCommandSpec(
        name = NatesclawPhotosCommand.Latest.rawValue,
        availability = InvokeCommandAvailability.PhotosAvailable,
      ),
      InvokeCommandSpec(
        name = NatesclawContactsCommand.Search.rawValue,
      ),
      InvokeCommandSpec(
        name = NatesclawContactsCommand.Add.rawValue,
      ),
      InvokeCommandSpec(
        name = NatesclawCalendarCommand.Events.rawValue,
      ),
      InvokeCommandSpec(
        name = NatesclawCalendarCommand.Add.rawValue,
      ),
      InvokeCommandSpec(
        name = NatesclawMotionCommand.Activity.rawValue,
        availability = InvokeCommandAvailability.MotionActivityAvailable,
      ),
      InvokeCommandSpec(
        name = NatesclawMotionCommand.Pedometer.rawValue,
        availability = InvokeCommandAvailability.MotionPedometerAvailable,
      ),
      InvokeCommandSpec(
        name = NatesclawSmsCommand.Send.rawValue,
        availability = InvokeCommandAvailability.SendSmsAvailable,
      ),
      InvokeCommandSpec(
        name = NatesclawSmsCommand.Search.rawValue,
        availability = InvokeCommandAvailability.RequestableSmsSearchAvailable,
      ),
      InvokeCommandSpec(
        name = NatesclawCallLogCommand.Search.rawValue,
        availability = InvokeCommandAvailability.CallLogAvailable,
      ),
      InvokeCommandSpec(
        name = NatesclawMobileUiCommand.Observe.rawValue,
        availability = InvokeCommandAvailability.MobileUiAvailable,
      ),
      InvokeCommandSpec(
        name = NatesclawMobileUiCommand.Act.rawValue,
        availability = InvokeCommandAvailability.MobileUiAvailable,
      ),
      InvokeCommandSpec(
        name = "debug.logs",
        availability = InvokeCommandAvailability.DebugBuild,
      ),
      InvokeCommandSpec(
        name = "debug.ed25519",
        availability = InvokeCommandAvailability.DebugBuild,
      ),
    )

  private val byNameInternal: Map<String, InvokeCommandSpec> = all.associateBy { it.name }

  /** Finds the command metadata used by dispatch and advertised-method builders. */
  fun find(command: String): InvokeCommandSpec? = byNameInternal[command]

  /** Returns gateway capability ids the current Android device can actually serve. */
  fun advertisedCapabilities(flags: NodeRuntimeFlags): List<String> =
    capabilityManifest
      .filter { spec ->
        when (spec.availability) {
          NodeCapabilityAvailability.Always -> true
          NodeCapabilityAvailability.CameraEnabled -> flags.cameraEnabled
          NodeCapabilityAvailability.LocationEnabled -> flags.locationEnabled
          NodeCapabilityAvailability.SmsAvailable -> flags.sendSmsAvailable || flags.readSmsAvailable
          NodeCapabilityAvailability.CallLogAvailable -> flags.callLogAvailable
          NodeCapabilityAvailability.PhotosAvailable -> flags.photosAvailable
          NodeCapabilityAvailability.MotionAvailable -> flags.motionActivityAvailable || flags.motionPedometerAvailable
          NodeCapabilityAvailability.VoiceWakeEnabled -> flags.voiceWakeEnabled
          NodeCapabilityAvailability.MobileUiAvailable -> flags.mobileUiAvailable
        }
      }.map { it.name }

  /** Returns gateway invoke method ids available under current permissions/build flags. */
  fun advertisedCommands(flags: NodeRuntimeFlags): List<String> =
    all
      .filter { spec ->
        when (spec.availability) {
          InvokeCommandAvailability.Always -> true
          InvokeCommandAvailability.CameraEnabled -> flags.cameraEnabled
          InvokeCommandAvailability.LocationEnabled -> flags.locationEnabled
          InvokeCommandAvailability.SendSmsAvailable -> flags.sendSmsAvailable
          InvokeCommandAvailability.ReadSmsAvailable -> flags.readSmsAvailable
          InvokeCommandAvailability.RequestableSmsSearchAvailable -> flags.smsSearchPossible
          InvokeCommandAvailability.CallLogAvailable -> flags.callLogAvailable
          InvokeCommandAvailability.PhotosAvailable -> flags.photosAvailable
          InvokeCommandAvailability.MotionActivityAvailable -> flags.motionActivityAvailable
          InvokeCommandAvailability.MotionPedometerAvailable -> flags.motionPedometerAvailable
          InvokeCommandAvailability.InstalledAppsSharingEnabled -> flags.installedAppsSharingEnabled
          InvokeCommandAvailability.DebugBuild -> flags.debugBuild
          InvokeCommandAvailability.MobileUiAvailable -> flags.mobileUiAvailable
        }
      }.map { it.name }
}
