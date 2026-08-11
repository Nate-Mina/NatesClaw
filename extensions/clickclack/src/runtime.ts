/**
 * Runtime store for host-provided Natesclaw services used by the ClickClack
 * bundled plugin.
 */
import { createPluginRuntimeStore } from "natesclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "natesclaw/plugin-sdk/runtime-store";

const { setRuntime: setClickClackRuntime, getRuntime: getClickClackRuntime } =
  createPluginRuntimeStore<PluginRuntime>({
    pluginId: "clickclack",
    errorMessage: "ClickClack runtime not initialized",
  });

export { getClickClackRuntime, setClickClackRuntime };
