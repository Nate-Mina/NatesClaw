// Install download test utilities provide isolated state and workspace paths.
import {
  createNatesclawTestState,
  type NatesclawTestState,
} from "../../test-utils/natesclaw-test-state.js";

/** Creates isolated Natesclaw state for install download tests. */
export async function createInstallDownloadTestState(): Promise<NatesclawTestState> {
  return await createNatesclawTestState({
    layout: "state-only",
    prefix: "natesclaw-skills-install-",
  });
}
