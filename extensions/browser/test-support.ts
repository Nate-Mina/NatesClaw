/**
 * Browser test-support re-exports from shared plugin-sdk test fixtures.
 */
import fs from "node:fs";
import path from "node:path";
import { resolvePreferredNatesclawTmpDir } from "natesclaw/plugin-sdk/temp-path";

export {
  createCliRuntimeCapture,
  expectGeneratedTokenPersistedToGatewayAuth,
  type CliRuntimeCapture,
} from "natesclaw/plugin-sdk/test-fixtures";
export { createTempHomeEnv } from "natesclaw/plugin-sdk/test-env";
export type { TempHomeEnv } from "natesclaw/plugin-sdk/test-env";
export { isLiveTestEnabled } from "natesclaw/plugin-sdk/test-live";
export type { NatesclawConfig } from "natesclaw/plugin-sdk/config-contracts";

export function useAutoCleanupTempDirTracker(registerCleanup: (cleanup: () => void) => unknown) {
  const dirs = new Set<string>();
  registerCleanup(() => {
    for (const dir of dirs) {
      fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 20 });
    }
    dirs.clear();
  });
  return {
    make(prefix: string): string {
      const dir = fs.mkdtempSync(path.join(resolvePreferredNatesclawTmpDir(), prefix));
      dirs.add(dir);
      return dir;
    },
  };
}
