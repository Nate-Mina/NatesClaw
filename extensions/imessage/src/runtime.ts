// Imessage plugin module implements runtime behavior.
import type { PluginRuntime } from "natesclaw/plugin-sdk/core";
import { createPluginRuntimeStore } from "natesclaw/plugin-sdk/runtime-store";

const {
  getRuntime: getIMessageRuntime,
  setRuntime: setIMessageRuntime,
  tryGetRuntime: getOptionalIMessageRuntime,
} = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "imessage",
  errorMessage: "iMessage runtime not initialized",
});
export { getIMessageRuntime, getOptionalIMessageRuntime, setIMessageRuntime };
