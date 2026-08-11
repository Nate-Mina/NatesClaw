import type { ChildProcess } from "node:child_process";
import { createSubsystemLogger } from "../logging/subsystem.js";
import {
  applyNatesclawDatabaseVerificationResults,
  collectNatesclawDatabaseVerifyTargets,
  NATESCLAW_DATABASE_VERIFY_INITIAL_DELAY_MS,
  NATESCLAW_DATABASE_VERIFY_INTERVAL_MS,
  runDatabaseVerifyWorker,
  terminateDatabaseVerifyWorker,
} from "./natesclaw-database-verify.impl.js";

const log = createSubsystemLogger("state/database-verify");

/** Start the Gateway-owned delayed daily integrity verifier. */
export function startNatesclawDatabaseIntegrityVerifier(options: { env: NodeJS.ProcessEnv }): {
  stop: () => Promise<void>;
} {
  let activeWorker: ChildProcess | undefined;
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const schedule = (delayMs: number) => {
    timer = setTimeout(() => void run(), delayMs);
    timer.unref?.();
  };
  const run = async () => {
    timer = undefined;
    try {
      const targets = collectNatesclawDatabaseVerifyTargets(options);
      if (targets.length > 0) {
        const results = await runDatabaseVerifyWorker(targets, {
          onWorker: (worker) => {
            activeWorker = worker;
          },
        });
        if (!stopped) {
          applyNatesclawDatabaseVerificationResults({ ...options, results, targets });
        }
      }
    } catch (error) {
      if (!stopped) {
        log.error("database integrity verifier failed", { error: String(error) });
      }
    } finally {
      activeWorker = undefined;
      if (!stopped) {
        schedule(NATESCLAW_DATABASE_VERIFY_INTERVAL_MS);
      }
    }
  };

  schedule(NATESCLAW_DATABASE_VERIFY_INITIAL_DELAY_MS);
  return {
    stop: async () => {
      stopped = true;
      if (timer) {
        clearTimeout(timer);
        timer = undefined;
      }
      if (activeWorker) {
        await terminateDatabaseVerifyWorker(activeWorker);
      }
      activeWorker = undefined;
    },
  };
}
