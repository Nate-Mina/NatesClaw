/**
 * Browser plugin service factory that lazily starts the control server.
 */
import { isTruthyEnvValue } from "natesclaw/plugin-sdk/runtime-env";
import {
  startLazyPluginServiceModule,
  type LazyPluginServiceHandle,
  type NatesclawPluginService,
} from "./sdk-node-runtime.js";

type BrowserControlHandle = LazyPluginServiceHandle | null;
const EAGER_BROWSER_CONTROL_SERVICE_ENV = "NATESCLAW_EAGER_BROWSER_CONTROL_SERVER";
const UNSAFE_BROWSER_CONTROL_OVERRIDE_SPECIFIER = /^(?:data|http|https|node):/i;

function validateBrowserControlOverrideSpecifier(specifier: string): string {
  const trimmed = specifier.trim();
  if (UNSAFE_BROWSER_CONTROL_OVERRIDE_SPECIFIER.test(trimmed)) {
    throw new Error(`Refusing unsafe browser control override specifier: ${trimmed}`);
  }
  return trimmed;
}

/** Creates the Browser plugin service registered by the plugin entrypoint. */
export function createBrowserPluginService(): NatesclawPluginService {
  let handle: BrowserControlHandle = null;

  return {
    id: "browser-control",
    start: async () => {
      if (!isTruthyEnvValue(process.env[EAGER_BROWSER_CONTROL_SERVICE_ENV])) {
        return;
      }
      if (handle) {
        return;
      }
      handle = await startLazyPluginServiceModule({
        skipEnvVar: "NATESCLAW_SKIP_BROWSER_CONTROL_SERVER",
        overrideEnvVar: "NATESCLAW_BROWSER_CONTROL_MODULE",
        validateOverrideSpecifier: validateBrowserControlOverrideSpecifier,
        // Keep the default module import static so compiled builds still bundle it.
        loadDefaultModule: async () => await import("./server.js"),
        startExportNames: [
          "startBrowserControlServiceFromConfig",
          "startBrowserControlServerFromConfig",
        ],
        stopExportNames: ["stopBrowserControlService", "stopBrowserControlServer"],
      });
    },
    stop: async () => {
      const current = handle;
      if (current) {
        await current.stop();
        if (handle === current) {
          handle = null;
        }
        return;
      }
      const { stopBrowserControlService } = await import("./control-service.js");
      await stopBrowserControlService();
    },
  };
}
