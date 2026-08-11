// Minimal-gateway boot smoke: guards the startup path the Control UI e2e suites
// depend on. Bundled plugins stay enabled on purpose — disabling them (as other
// gateway boot tests do) hides startup work that materializes plugin runtime,
// which is exactly how a startup stall shipped green while hanging every
// ui-e2e suite that boots a minimal test gateway.
import { describe, expect, it } from "vitest";
import { createNatesclawTestState } from "../test-utils/natesclaw-test-state.js";
import { getFreePort } from "../test-utils/ports.js";

// Local boot completes in ~10s; the budget only buys headroom for loaded CI
// runners. A stall exhausts it and fails in the gateway lane instead of first
// surfacing on unrelated UI PRs.
const BOOT_BUDGET_MS = 90_000;

describe("gateway minimal boot smoke", () => {
  it("boots a minimal test gateway within budget", { timeout: BOOT_BUDGET_MS }, async () => {
    const port = await getFreePort();
    const state = await createNatesclawTestState({
      label: "gateway-minimal-boot-smoke",
      layout: "home",
      env: {
        NATESCLAW_GATEWAY_PASSWORD: undefined,
        NATESCLAW_GATEWAY_TOKEN: undefined,
        NATESCLAW_SKIP_BROWSER_CONTROL_SERVER: "1",
        NATESCLAW_SKIP_CANVAS_HOST: "1",
        NATESCLAW_SKIP_CHANNELS: "1",
        NATESCLAW_SKIP_CRON: "1",
        NATESCLAW_SKIP_GMAIL_WATCHER: "1",
        NATESCLAW_SKIP_PROVIDERS: "1",
        NATESCLAW_TEST_MINIMAL_GATEWAY: "1",
        VITEST: "1",
      },
    });
    const token = "gateway-minimal-boot-smoke-token";
    await state.writeConfig({
      gateway: {
        auth: { mode: "token", token },
        controlUi: { enabled: false },
        port,
      },
    });
    state.applyEnv();
    try {
      const { startGatewayServer } = await import("./server.js");
      const server = await startGatewayServer(port, {
        auth: { mode: "token", token },
        bind: "loopback",
        controlUiEnabled: false,
        sidecarStartup: "defer",
      });
      expect(server).toBeTruthy();
      await server.close({ reason: "minimal boot smoke complete" });
    } finally {
      await state.cleanup();
    }
  });
});
