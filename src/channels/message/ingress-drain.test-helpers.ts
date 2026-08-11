import fs from "node:fs/promises";
import path from "node:path";
import { resolvePreferredNatesclawTmpDir } from "../../infra/tmp-natesclaw-dir.js";
import { closeNatesclawStateDatabaseForTest } from "../../state/natesclaw-state-db.js";
import { createChannelIngressQueue } from "./ingress-queue.js";

export type IngressDrainTestPayload = { text: string };

export function createTestIngressQueue(
  stateDir: string,
  options: Omit<
    Parameters<typeof createChannelIngressQueue>[0],
    "channelId" | "accountId" | "stateDir"
  > = {},
) {
  return createChannelIngressQueue<IngressDrainTestPayload>({
    channelId: "test",
    accountId: "a",
    stateDir,
    ...options,
  });
}

export async function withTempState<T>(fn: (stateDir: string) => Promise<T>): Promise<T> {
  const stateDir = await fs.mkdtemp(
    path.join(resolvePreferredNatesclawTmpDir(), "natesclaw-ingress-drain-"),
  );
  try {
    return await fn(stateDir);
  } finally {
    closeNatesclawStateDatabaseForTest();
    await fs.rm(stateDir, { recursive: true, force: true });
  }
}
