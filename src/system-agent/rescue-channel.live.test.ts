// Natesclaw live rescue channel tests cover live-channel rescue message delivery.
import fs from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { CommandContext } from "../auto-reply/reply/commands-types.js";
import { clearConfigCache } from "../config/config.js";
import type { NatesclawConfig } from "../config/types.natesclaw.js";
import { resetPluginStateStoreForTests } from "../plugin-state/plugin-state-store.js";
import { withTestDir } from "../test-helpers/temp-dir.js";
import { deleteTestEnvValue, setTestEnvValue } from "../test-utils/env.js";
import { listSystemAgentAuditEntriesForTests } from "./audit.test-support.js";
import { runSystemAgentRescueMessage } from "./rescue-message.js";

const originalStateDir = process.env.NATESCLAW_STATE_DIR;
const originalConfigPath = process.env.NATESCLAW_CONFIG_PATH;

function truthy(value: string | undefined): boolean {
  return /^(1|true|yes|on)$/i.test(value?.trim() ?? "");
}

const runLive =
  truthy(process.env.NATESCLAW_LIVE_TEST) &&
  truthy(process.env.NATESCLAW_LIVE_SYSTEM_AGENT_RESCUE_CHANNEL);
const describeLive = runLive ? describe : describe.skip;

function commandContext(channel = process.env.NATESCLAW_LIVE_SYSTEM_AGENT_CHANNEL ?? "whatsapp") {
  return {
    surface: channel,
    channel,
    channelId: channel,
    ownerList: ["user:owner"],
    senderIsOwner: true,
    isAuthorizedSender: true,
    senderId: "user:owner",
    rawBodyNormalized: "/natesclaw status",
    commandBodyNormalized: "/natesclaw status",
    from: "user:owner",
    to: "account:default",
  } satisfies CommandContext;
}

async function runRescue(params: {
  commandBody: string;
  cfg: NatesclawConfig;
  ctx?: CommandContext;
}) {
  const ctx = params.ctx ?? commandContext();
  return await runSystemAgentRescueMessage({
    cfg: params.cfg,
    command: { ...ctx, commandBodyNormalized: params.commandBody },
    commandBody: params.commandBody,
    isGroup: false,
  });
}

describeLive("Natesclaw live rescue channel smoke", () => {
  afterEach(() => {
    resetPluginStateStoreForTests();
    clearConfigCache();
    if (originalStateDir === undefined) {
      deleteTestEnvValue("NATESCLAW_STATE_DIR");
    } else {
      setTestEnvValue("NATESCLAW_STATE_DIR", originalStateDir);
    }
    if (originalConfigPath === undefined) {
      deleteTestEnvValue("NATESCLAW_CONFIG_PATH");
    } else {
      setTestEnvValue("NATESCLAW_CONFIG_PATH", originalConfigPath);
    }
  });

  it("handles /natesclaw status and a persistent approval roundtrip", async () => {
    await withTestDir({ prefix: "natesclaw-live-rescue-" }, async (tempDir) => {
      const configPath = path.join(tempDir, "natesclaw.json");
      setTestEnvValue("NATESCLAW_STATE_DIR", tempDir);
      setTestEnvValue("NATESCLAW_CONFIG_PATH", configPath);
      await fs.writeFile(
        configPath,
        JSON.stringify(
          {
            meta: { lastTouchedVersion: "live-test", lastTouchedAt: new Date(0).toISOString() },
            agents: { defaults: {} },
            tools: { exec: { mode: "full" } },
          },
          null,
          2,
        ),
      );

      const cfg: NatesclawConfig = {
        tools: { exec: { mode: "full" } },
      };

      await expect(runRescue({ commandBody: "/natesclaw status", cfg })).resolves.toContain(
        "[natesclaw] done: status.check",
      );
      await expect(
        runRescue({ commandBody: "/natesclaw set default model openai/gpt-5.5", cfg }),
      ).resolves.toContain("Reply /natesclaw yes to apply");
      await expect(runRescue({ commandBody: "/natesclaw yes", cfg })).resolves.toContain(
        "Default model: openai/gpt-5.5",
      );

      const config = JSON.parse(await fs.readFile(configPath, "utf8")) as NatesclawConfig;
      const defaultModel = config.agents?.defaults?.model;
      if (!defaultModel || typeof defaultModel !== "object") {
        throw new Error("expected default model object");
      }
      expect(defaultModel.primary).toBe("openai/gpt-5.5");
      expect(
        listSystemAgentAuditEntriesForTests().some(
          (entry) => entry.value.operation === "config.setDefaultModel",
        ),
      ).toBe(true);
    });
  });
});
