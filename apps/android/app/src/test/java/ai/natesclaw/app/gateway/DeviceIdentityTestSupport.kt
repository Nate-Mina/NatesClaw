package ai.natesclaw.app.gateway

import ai.natesclaw.app.SecurePrefs
import android.content.Context

internal fun testDeviceIdentityStore(context: Context): DeviceIdentityStore {
  val backing =
    context.getSharedPreferences(
      "natesclaw.node.secure.test.device-identity",
      Context.MODE_PRIVATE,
    )
  return DeviceIdentityStore.withPrefs(
    context,
    SecurePrefs(context, securePrefsOverride = backing),
  )
}
