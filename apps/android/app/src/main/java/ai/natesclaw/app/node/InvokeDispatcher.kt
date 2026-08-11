package ai.natesclaw.app.node

import ai.natesclaw.app.gateway.GatewaySession
import ai.natesclaw.app.protocol.NatesclawCalendarCommand
import ai.natesclaw.app.protocol.NatesclawCallLogCommand
import ai.natesclaw.app.protocol.NatesclawCameraCommand
import ai.natesclaw.app.protocol.NatesclawCanvasA2UICommand
import ai.natesclaw.app.protocol.NatesclawCanvasCommand
import ai.natesclaw.app.protocol.NatesclawContactsCommand
import ai.natesclaw.app.protocol.NatesclawDeviceCommand
import ai.natesclaw.app.protocol.NatesclawLocationCommand
import ai.natesclaw.app.protocol.NatesclawMobileUiCommand
import ai.natesclaw.app.protocol.NatesclawMotionCommand
import ai.natesclaw.app.protocol.NatesclawNotificationsCommand
import ai.natesclaw.app.protocol.NatesclawSmsCommand
import ai.natesclaw.app.protocol.NatesclawSystemCommand
import ai.natesclaw.app.protocol.NatesclawTalkCommand
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

/** Runtime state for SMS search, split so permission prompts are not reported as hard unavailability. */
internal enum class SmsSearchAvailabilityReason {
  Available,
  PermissionRequired,
  Unavailable,
}

/**
 * Distinguish permanent SMS search unavailability from permission-gated search.
 */
internal fun classifySmsSearchAvailability(
  readSmsAvailable: Boolean,
  smsFeatureEnabled: Boolean,
  smsTelephonyAvailable: Boolean,
): SmsSearchAvailabilityReason {
  if (readSmsAvailable) return SmsSearchAvailabilityReason.Available
  if (!smsFeatureEnabled || !smsTelephonyAvailable) return SmsSearchAvailabilityReason.Unavailable
  return SmsSearchAvailabilityReason.PermissionRequired
}

internal fun smsSearchAvailabilityError(
  readSmsAvailable: Boolean,
  smsFeatureEnabled: Boolean,
  smsTelephonyAvailable: Boolean,
): GatewaySession.InvokeResult? =
  when (
    classifySmsSearchAvailability(
      readSmsAvailable = readSmsAvailable,
      smsFeatureEnabled = smsFeatureEnabled,
      smsTelephonyAvailable = smsTelephonyAvailable,
    )
  ) {
    SmsSearchAvailabilityReason.Available,
    SmsSearchAvailabilityReason.PermissionRequired,
    -> null
    SmsSearchAvailabilityReason.Unavailable ->
      GatewaySession.InvokeResult.error(
        code = "SMS_UNAVAILABLE",
        message = "SMS_UNAVAILABLE: SMS not available on this device",
      )
  }

/**
 * Gateway node.invoke command router for Android-owned capabilities.
 */
class InvokeDispatcher(
  private val canvas: CanvasController,
  private val cameraHandler: CameraHandler,
  private val locationHandler: LocationHandler,
  private val deviceHandler: DeviceHandler,
  private val notificationsHandler: NotificationsHandler,
  private val systemHandler: SystemHandler,
  private val talkHandler: TalkHandler,
  private val photosHandler: PhotosHandler,
  private val contactsHandler: ContactsHandler,
  private val calendarHandler: CalendarHandler,
  private val motionHandler: MotionHandler,
  private val smsHandler: SmsHandler,
  private val a2uiHandler: A2UIHandler,
  private val debugHandler: DebugHandler,
  private val callLogHandler: CallLogHandler,
  private val mobileUiHandler: MobileUiHandler,
  private val isForeground: () -> Boolean,
  private val cameraEnabled: () -> Boolean,
  private val locationEnabled: () -> Boolean,
  private val sendSmsAvailable: () -> Boolean,
  private val readSmsAvailable: () -> Boolean,
  private val smsFeatureEnabled: () -> Boolean,
  private val smsTelephonyAvailable: () -> Boolean,
  private val callLogAvailable: () -> Boolean,
  private val photosAvailable: () -> Boolean,
  private val installedAppsSharingEnabled: () -> Boolean,
  private val debugBuild: () -> Boolean,
  private val onCanvasA2uiPush: () -> Unit,
  private val onCanvasA2uiReset: () -> Unit,
  private val motionActivityAvailable: () -> Boolean,
  private val motionPedometerAvailable: () -> Boolean,
  private val mobileUiAvailable: () -> Boolean,
) {
  private val canvasCommandMutex = Mutex()

  /** Dispatches one gateway node.invoke command after foreground and availability gates pass. */
  suspend fun handleInvoke(
    command: String,
    paramsJson: String?,
  ): GatewaySession.InvokeResult {
    val spec =
      InvokeCommandRegistry.find(command)
        ?: return GatewaySession.InvokeResult.error(
          code = "INVALID_REQUEST",
          message = "INVALID_REQUEST: unknown command",
        )
    if (spec.requiresForeground && !isForeground()) {
      // Foreground-only commands need an active Activity surface before touching UI or capture APIs.
      return GatewaySession.InvokeResult.error(
        code = "NODE_BACKGROUND_UNAVAILABLE",
        message = "NODE_BACKGROUND_UNAVAILABLE: command requires foreground",
      )
    }
    availabilityError(spec.availability)?.let { return it }

    if (command.startsWith(NatesclawCanvasCommand.NamespacePrefix)) {
      // GatewaySession may deliver invokes concurrently. Canvas presentation, navigation, and
      // A2UI evaluation share one WebView and must observe command arrival order.
      return canvasCommandMutex.withLock { dispatchInvoke(command, paramsJson) }
    }
    return dispatchInvoke(command, paramsJson)
  }

  private suspend fun dispatchInvoke(
    command: String,
    paramsJson: String?,
  ): GatewaySession.InvokeResult {
    // Command strings come from NatesclawProtocolConstants; the registry above owns advertised availability.
    return when (command) {
      // Canvas commands
      NatesclawCanvasCommand.Present.rawValue -> {
        val url = CanvasController.parseNavigateUrl(paramsJson)
        withCanvasAvailable {
          check(canvas.showAndAwaitHost()) { "canvas host unavailable" }
          canvas.navigate(url)
          GatewaySession.InvokeResult.ok(null)
        }
      }
      NatesclawCanvasCommand.Hide.rawValue -> {
        canvas.hide()
        GatewaySession.InvokeResult.ok(null)
      }
      NatesclawCanvasCommand.Navigate.rawValue -> {
        val url = CanvasController.parseNavigateUrl(paramsJson)
        withCanvasAvailable {
          check(canvas.showAndAwaitHost()) { "canvas host unavailable" }
          canvas.navigate(url)
          GatewaySession.InvokeResult.ok(null)
        }
      }
      NatesclawCanvasCommand.Eval.rawValue -> {
        val js =
          CanvasController.parseEvalJs(paramsJson)
            ?: return GatewaySession.InvokeResult.error(
              code = "INVALID_REQUEST",
              message = "INVALID_REQUEST: javaScript required",
            )
        withCanvasAvailable {
          val result = canvas.eval(js)
          GatewaySession.InvokeResult.ok("""{"result":${result.toJsonString()}}""")
        }
      }
      NatesclawCanvasCommand.Snapshot.rawValue -> {
        val snapshotParams = CanvasController.parseSnapshotParams(paramsJson)
        withCanvasAvailable {
          val base64 =
            canvas.snapshotBase64(
              format = snapshotParams.format,
              quality = snapshotParams.quality,
              maxWidth = snapshotParams.maxWidth,
            )
          GatewaySession.InvokeResult.ok("""{"format":"${snapshotParams.format.rawValue}","base64":"$base64"}""")
        }
      }

      // A2UI commands
      NatesclawCanvasA2UICommand.Reset.rawValue ->
        withReadyA2ui {
          withCanvasAvailable {
            val res = canvas.eval(A2UIHandler.a2uiResetJS)
            onCanvasA2uiReset()
            GatewaySession.InvokeResult.ok(res)
          }
        }
      NatesclawCanvasA2UICommand.Push.rawValue, NatesclawCanvasA2UICommand.PushJSONL.rawValue -> {
        val messages =
          try {
            a2uiHandler.decodeA2uiMessages(command, paramsJson)
          } catch (err: Throwable) {
            return GatewaySession.InvokeResult.error(
              code = "INVALID_REQUEST",
              message = err.message ?: "invalid A2UI payload",
            )
          }
        withReadyA2ui {
          withCanvasAvailable {
            val js = A2UIHandler.a2uiApplyMessagesJS(messages)
            val res = canvas.eval(js)
            onCanvasA2uiPush()
            GatewaySession.InvokeResult.ok(res)
          }
        }
      }

      // Camera commands
      NatesclawCameraCommand.List.rawValue -> cameraHandler.handleList(paramsJson)
      NatesclawCameraCommand.Snap.rawValue -> cameraHandler.handleSnap(paramsJson)
      NatesclawCameraCommand.Clip.rawValue -> cameraHandler.handleClip(paramsJson)

      // Location command
      NatesclawLocationCommand.Get.rawValue -> locationHandler.handleLocationGet(paramsJson)

      // Device commands
      NatesclawDeviceCommand.Status.rawValue -> deviceHandler.handleDeviceStatus(paramsJson)
      NatesclawDeviceCommand.Info.rawValue -> deviceHandler.handleDeviceInfo(paramsJson)
      NatesclawDeviceCommand.Permissions.rawValue -> deviceHandler.handleDevicePermissions(paramsJson)
      NatesclawDeviceCommand.Health.rawValue -> deviceHandler.handleDeviceHealth(paramsJson)
      NatesclawDeviceCommand.Apps.rawValue -> deviceHandler.handleDeviceApps(paramsJson)

      // Notifications command
      NatesclawNotificationsCommand.List.rawValue -> notificationsHandler.handleNotificationsList(paramsJson)
      NatesclawNotificationsCommand.Actions.rawValue -> notificationsHandler.handleNotificationsActions(paramsJson)

      // System command
      NatesclawSystemCommand.Notify.rawValue -> systemHandler.handleSystemNotify(paramsJson)

      // Talk commands
      NatesclawTalkCommand.PttStart.rawValue -> talkHandler.handlePttStart(paramsJson)
      NatesclawTalkCommand.PttStop.rawValue -> talkHandler.handlePttStop(paramsJson)
      NatesclawTalkCommand.PttCancel.rawValue -> talkHandler.handlePttCancel(paramsJson)
      NatesclawTalkCommand.PttOnce.rawValue -> talkHandler.handlePttOnce(paramsJson)

      // Photos command
      ai.natesclaw.app.protocol.NatesclawPhotosCommand.Latest.rawValue ->
        photosHandler.handlePhotosLatest(
          paramsJson,
        )

      // Contacts command
      NatesclawContactsCommand.Search.rawValue -> contactsHandler.handleContactsSearch(paramsJson)
      NatesclawContactsCommand.Add.rawValue -> contactsHandler.handleContactsAdd(paramsJson)

      // Calendar command
      NatesclawCalendarCommand.Events.rawValue -> calendarHandler.handleCalendarEvents(paramsJson)
      NatesclawCalendarCommand.Add.rawValue -> calendarHandler.handleCalendarAdd(paramsJson)

      // Motion command
      NatesclawMotionCommand.Activity.rawValue -> motionHandler.handleMotionActivity(paramsJson)
      NatesclawMotionCommand.Pedometer.rawValue -> motionHandler.handleMotionPedometer(paramsJson)

      // SMS command
      NatesclawSmsCommand.Send.rawValue -> smsHandler.handleSmsSend(paramsJson)
      NatesclawSmsCommand.Search.rawValue -> smsHandler.handleSmsSearch(paramsJson)

      // CallLog command
      NatesclawCallLogCommand.Search.rawValue -> callLogHandler.handleCallLogSearch(paramsJson)

      // Mobile accessibility commands
      NatesclawMobileUiCommand.Observe.rawValue -> mobileUiHandler.handleObserve(paramsJson)
      NatesclawMobileUiCommand.Act.rawValue -> mobileUiHandler.handleAct(paramsJson)

      // Debug commands
      "debug.ed25519" -> debugHandler.handleEd25519()
      "debug.logs" -> debugHandler.handleLogs()
      else -> GatewaySession.InvokeResult.error(code = "INVALID_REQUEST", message = "INVALID_REQUEST: unknown command")
    }
  }

  private suspend fun withReadyA2ui(block: suspend () -> GatewaySession.InvokeResult): GatewaySession.InvokeResult {
    if (!a2uiHandler.ensureA2uiReady()) {
      return GatewaySession.InvokeResult.error(
        code = "A2UI_HOST_UNAVAILABLE",
        message = "A2UI_HOST_UNAVAILABLE: bundled A2UI host not reachable",
      )
    }
    return block()
  }

  private suspend fun withCanvasAvailable(block: suspend () -> GatewaySession.InvokeResult): GatewaySession.InvokeResult =
    try {
      block()
    } catch (_: Throwable) {
      // WebView calls throw when the Activity is backgrounded between the foreground check and execution.
      GatewaySession.InvokeResult.error(
        code = "NODE_BACKGROUND_UNAVAILABLE",
        message = "NODE_BACKGROUND_UNAVAILABLE: canvas unavailable",
      )
    }

  private fun availabilityError(availability: InvokeCommandAvailability): GatewaySession.InvokeResult? =
    when (availability) {
      InvokeCommandAvailability.Always -> null
      InvokeCommandAvailability.CameraEnabled ->
        if (cameraEnabled()) {
          null
        } else {
          GatewaySession.InvokeResult.error(
            code = "CAMERA_DISABLED",
            message = "CAMERA_DISABLED: enable Camera in Settings",
          )
        }
      InvokeCommandAvailability.LocationEnabled ->
        if (locationEnabled()) {
          null
        } else {
          GatewaySession.InvokeResult.error(
            code = "LOCATION_DISABLED",
            message = "LOCATION_DISABLED: enable Location in Settings",
          )
        }
      InvokeCommandAvailability.MotionActivityAvailable ->
        if (motionActivityAvailable()) {
          null
        } else {
          GatewaySession.InvokeResult.error(
            code = "MOTION_UNAVAILABLE",
            message = "MOTION_UNAVAILABLE: accelerometer not available",
          )
        }
      InvokeCommandAvailability.MotionPedometerAvailable ->
        if (motionPedometerAvailable()) {
          null
        } else {
          GatewaySession.InvokeResult.error(
            code = "PEDOMETER_UNAVAILABLE",
            message = "PEDOMETER_UNAVAILABLE: step counter not available",
          )
        }
      InvokeCommandAvailability.SendSmsAvailable ->
        if (sendSmsAvailable()) {
          null
        } else {
          GatewaySession.InvokeResult.error(
            code = "SMS_UNAVAILABLE",
            message = "SMS_UNAVAILABLE: SMS not available on this device",
          )
        }
      InvokeCommandAvailability.ReadSmsAvailable,
      InvokeCommandAvailability.RequestableSmsSearchAvailable,
      ->
        // SMS search may still be advertised as promptable; runtime invoke fails only on permanent unavailability.
        smsSearchAvailabilityError(
          readSmsAvailable = readSmsAvailable(),
          smsFeatureEnabled = smsFeatureEnabled(),
          smsTelephonyAvailable = smsTelephonyAvailable(),
        )
      InvokeCommandAvailability.CallLogAvailable ->
        if (callLogAvailable()) {
          null
        } else {
          GatewaySession.InvokeResult.error(
            code = "CALL_LOG_UNAVAILABLE",
            message = "CALL_LOG_UNAVAILABLE: call log not available on this build",
          )
        }
      InvokeCommandAvailability.PhotosAvailable ->
        if (photosAvailable()) {
          null
        } else {
          GatewaySession.InvokeResult.error(
            code = "PHOTOS_UNAVAILABLE",
            message = "PHOTOS_UNAVAILABLE: photos not available on this build",
          )
        }
      InvokeCommandAvailability.InstalledAppsSharingEnabled ->
        if (installedAppsSharingEnabled()) {
          null
        } else {
          GatewaySession.InvokeResult.error(
            code = "INSTALLED_APPS_SHARING_DISABLED",
            message = "INSTALLED_APPS_SHARING_DISABLED: enable Installed Apps in Settings",
          )
        }
      InvokeCommandAvailability.DebugBuild ->
        if (debugBuild()) {
          null
        } else {
          GatewaySession.InvokeResult.error(
            code = "INVALID_REQUEST",
            message = "INVALID_REQUEST: unknown command",
          )
        }
      InvokeCommandAvailability.MobileUiAvailable ->
        if (mobileUiAvailable()) {
          null
        } else {
          GatewaySession.InvokeResult.error(
            code = "MOBILE_UI_UNAVAILABLE",
            message = "MOBILE_UI_UNAVAILABLE: accessibility service is not connected",
          )
        }
    }
}

/**
 * Talk-mode command adapter implemented by the voice subsystem.
 */
interface TalkHandler {
  /** Starts a push-to-talk capture session and keeps it open until stop or cancel. */
  suspend fun handlePttStart(paramsJson: String?): GatewaySession.InvokeResult

  /** Finishes the active push-to-talk capture and submits recognized speech. */
  suspend fun handlePttStop(paramsJson: String?): GatewaySession.InvokeResult

  /** Aborts the active push-to-talk capture without submitting speech. */
  suspend fun handlePttCancel(paramsJson: String?): GatewaySession.InvokeResult

  /** Runs a bounded one-shot push-to-talk capture. */
  suspend fun handlePttOnce(paramsJson: String?): GatewaySession.InvokeResult
}
