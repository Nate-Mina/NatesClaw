package ai.natesclaw.app.protocol

import org.junit.Assert.assertTrue
import org.junit.Test

class NatesclawProtocolConstantsTest {
  @Test
  fun generatedCapabilitiesAreUniqueProtocolIds() {
    val values = NatesclawCapability.entries.map { it.rawValue }

    assertTrue(values.isNotEmpty())
    assertTrue(values.all { it.isNotBlank() && "." !in it })
    assertTrue(values.size == values.toSet().size)
  }

  @Test
  fun generatedCommandGroupsMatchTheirNamespaces() {
    val groups =
      listOf(
        NatesclawCanvasCommand.NamespacePrefix to NatesclawCanvasCommand.entries.map { it.rawValue },
        NatesclawCanvasA2UICommand.NamespacePrefix to NatesclawCanvasA2UICommand.entries.map { it.rawValue },
        NatesclawCameraCommand.NamespacePrefix to NatesclawCameraCommand.entries.map { it.rawValue },
        NatesclawSmsCommand.NamespacePrefix to NatesclawSmsCommand.entries.map { it.rawValue },
        NatesclawTalkCommand.NamespacePrefix to NatesclawTalkCommand.entries.map { it.rawValue },
        NatesclawLocationCommand.NamespacePrefix to NatesclawLocationCommand.entries.map { it.rawValue },
        NatesclawDeviceCommand.NamespacePrefix to NatesclawDeviceCommand.entries.map { it.rawValue },
        NatesclawNotificationsCommand.NamespacePrefix to NatesclawNotificationsCommand.entries.map { it.rawValue },
        NatesclawSystemCommand.NamespacePrefix to NatesclawSystemCommand.entries.map { it.rawValue },
        NatesclawPhotosCommand.NamespacePrefix to NatesclawPhotosCommand.entries.map { it.rawValue },
        NatesclawContactsCommand.NamespacePrefix to NatesclawContactsCommand.entries.map { it.rawValue },
        NatesclawCalendarCommand.NamespacePrefix to NatesclawCalendarCommand.entries.map { it.rawValue },
        NatesclawMotionCommand.NamespacePrefix to NatesclawMotionCommand.entries.map { it.rawValue },
        NatesclawCallLogCommand.NamespacePrefix to NatesclawCallLogCommand.entries.map { it.rawValue },
      )

    val commands = groups.flatMap { (prefix, values) -> values.onEach { assertTrue(it.startsWith(prefix)) } }
    assertTrue(commands.size == commands.toSet().size)
  }
}
