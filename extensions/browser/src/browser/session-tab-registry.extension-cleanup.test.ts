// Browser tests cover extension-tab cleanup through live runtime-owned credentials.
import type { NatesclawConfig } from "natesclaw/plugin-sdk/config-contracts";
import type {
  OpenKeyedStoreOptions,
  PluginStateSyncKeyedStore,
} from "natesclaw/plugin-sdk/plugin-state-runtime";
import {
  createPluginStateKeyedStoreForTests,
  createPluginStateSyncKeyedStoreForTests,
  resetPluginStateStoreForTests,
} from "natesclaw/plugin-sdk/plugin-state-test-runtime";
import { createTestPluginApi } from "natesclaw/plugin-sdk/plugin-test-api";
import {
  clearRuntimeConfigSnapshot,
  setRuntimeConfigSnapshot,
} from "natesclaw/plugin-sdk/runtime-config-snapshot";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerBrowserPlugin } from "../../plugin-registration.js";
import type { NatesclawPluginApi } from "../../runtime-api.js";
import { useAutoCleanupTempDirTracker } from "../../test-support.js";
import type { CloseTrackedCdpTargetResult } from "./cdp.helpers.js";
import { resolveBrowserConfig, type ResolvedBrowserConfig } from "./config.js";
import { BROWSER_TAB_UNREACHABLE_RETIRE_MS } from "./constants.js";
import { durableOwnership } from "./session-tab-registry.sqlite.test-helpers.js";

const tempDirs = useAutoCleanupTempDirTracker(afterEach);
const cdpMocks = vi.hoisted(() => ({
  closeTrackedCdpTarget: vi.fn<() => Promise<CloseTrackedCdpTargetResult>>(),
}));

vi.mock("./cdp.helpers.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./cdp.helpers.js")>()),
  closeTrackedCdpTarget: cdpMocks.closeTrackedCdpTarget,
}));

import {
  closeTrackedBrowserTabsForSessions,
  sweepTrackedBrowserTabs,
  trackSessionBrowserTab,
} from "./session-tab-registry.js";

const config = {
  browser: {
    defaultProfile: "chrome",
    profiles: {
      chrome: {
        driver: "extension",
        cdpPort: 18_799,
        color: "#123456",
      },
    },
  },
} satisfies NatesclawConfig;

function clearProcessLocalTabState(): void {
  const state = globalThis as Record<symbol, unknown>;
  for (const name of [
    "natesclaw.browser.session-tabs.volatile",
    "natesclaw.browser.session-tabs.volatile-cleanup",
    "natesclaw.browser.session-tabs.active-durable-keys",
    "natesclaw.browser.session-tabs.cold-native-activity",
    "natesclaw.browser.session-tabs.interaction-storage-keys",
    "natesclaw.browser.session-tabs.exact-interaction-storage-keys",
    "natesclaw.browser.session-tabs.volatile-aliases",
    "natesclaw.browser.session-tabs.exact-volatile-aliases",
  ]) {
    delete state[Symbol.for(name)];
  }
}

function installRuntime(): void {
  registerBrowserPlugin(
    createTestPluginApi({
      id: "browser",
      name: "Browser",
      source: "test",
      rootDir: "/plugins/browser",
      config: {},
      runtime: {
        state: {
          openKeyedStore: (options: OpenKeyedStoreOptions) =>
            createPluginStateKeyedStoreForTests("browser", options),
          openSyncKeyedStore: (options: OpenKeyedStoreOptions) =>
            createPluginStateSyncKeyedStoreForTests("browser", options),
        },
      } as unknown as NatesclawPluginApi["runtime"],
    }),
  );
}

function openStore(): PluginStateSyncKeyedStore<unknown> {
  return createPluginStateSyncKeyedStoreForTests("browser", {
    namespace: "browser.session-tabs",
    maxEntries: 5_000,
    overflowPolicy: "reject-new",
  });
}

describe("durable extension session tab cleanup", () => {
  const originalStateDir = process.env.NATESCLAW_STATE_DIR;
  let resolved: ResolvedBrowserConfig;

  beforeEach(() => {
    clearRuntimeConfigSnapshot();
    clearProcessLocalTabState();
    process.env.NATESCLAW_STATE_DIR = tempDirs.make("natesclaw-browser-extension-tabs-");
    resetPluginStateStoreForTests();
    installRuntime();
    openStore().clear();
    cdpMocks.closeTrackedCdpTarget.mockReset().mockResolvedValue({ status: "closed" });
    setRuntimeConfigSnapshot(config, config);
    resolved = resolveBrowserConfig(config.browser, config);
  });

  afterEach(() => {
    clearRuntimeConfigSnapshot();
    clearProcessLocalTabState();
    resetPluginStateStoreForTests();
    if (originalStateDir === undefined) {
      delete process.env.NATESCLAW_STATE_DIR;
    } else {
      process.env.NATESCLAW_STATE_DIR = originalStateDir;
    }
  });

  it("uses the live process-only extension credential for lifecycle cleanup", async () => {
    expect(resolved.extensionRelayInternalTokens).toEqual({});
    trackSessionBrowserTab({
      sessionKey: "agent:main:main",
      targetId: "extension-tab",
      profile: "chrome",
      ownership: durableOwnership("NATIVE-EXTENSION"),
      now: 1_000,
    });
    const internalToken = "process-only-test-credential";
    const liveResolved: ResolvedBrowserConfig = {
      ...resolved,
      extensionRelayInternalTokens: { chrome: internalToken },
    };
    expect(JSON.stringify(openStore().entries())).not.toContain(internalToken);

    await expect(
      closeTrackedBrowserTabsForSessions({
        sessionKeys: ["agent:main:main"],
        getResolvedBrowserConfig: () => liveResolved,
      }),
    ).resolves.toBe(1);
    expect(cdpMocks.closeTrackedCdpTarget).toHaveBeenCalledWith(
      expect.objectContaining({
        profileName: "chrome",
        cdpUrl: `http://natesclaw-internal:${internalToken}@127.0.0.1:18799`,
        nativeTargetId: "NATIVE-EXTENSION",
      }),
    );
    expect(openStore().entries()).toEqual([]);
  });

  it("retains cleanup without a runtime and closes it after reconnect", async () => {
    trackSessionBrowserTab({
      sessionKey: "agent:main:main",
      targetId: "extension-tab",
      profile: "chrome",
      ownership: durableOwnership("NATIVE-EXTENSION"),
      now: 1_000,
    });
    let liveResolved: ResolvedBrowserConfig | null = null;
    const warnings: string[] = [];
    const getResolvedBrowserConfig = () => liveResolved;
    const afterRetireAge = 1_000 + BROWSER_TAB_UNREACHABLE_RETIRE_MS;

    await expect(
      sweepTrackedBrowserTabs({
        now: afterRetireAge,
        idleMs: 1,
        getResolvedBrowserConfig,
        onWarn: (message) => warnings.push(message),
      }),
    ).resolves.toBe(0);
    expect(cdpMocks.closeTrackedCdpTarget).not.toHaveBeenCalled();
    expect(openStore().entries()).toHaveLength(1);
    expect(warnings).toContain(
      "deferred tracked browser tab NATIVE-EXTENSION: extension relay runtime unavailable",
    );

    const internalToken = "reconnected-process-only-credential";
    liveResolved = {
      ...resolved,
      extensionRelayInternalTokens: { chrome: internalToken },
    };
    await expect(
      sweepTrackedBrowserTabs({
        now: afterRetireAge + 1,
        idleMs: 1,
        getResolvedBrowserConfig,
      }),
    ).resolves.toBe(1);
    expect(cdpMocks.closeTrackedCdpTarget).toHaveBeenCalledWith(
      expect.objectContaining({
        cdpUrl: `http://natesclaw-internal:${internalToken}@127.0.0.1:18799`,
      }),
    );
    expect(openStore().entries()).toEqual([]);
  });
});
