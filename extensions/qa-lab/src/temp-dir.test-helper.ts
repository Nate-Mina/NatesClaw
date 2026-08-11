// Qa Lab plugin module implements temp dir helper behavior.
import {
  tempWorkspace,
  resolvePreferredNatesclawTmpDir,
  type TempWorkspace,
} from "natesclaw/plugin-sdk/temp-path";

export function createTempDirHarness() {
  const tempDirs: TempWorkspace[] = [];

  return {
    cleanup: async () => {
      await Promise.all(tempDirs.splice(0).map((dir) => dir.cleanup()));
    },
    makeTempDir: async (prefix: string) => {
      const dir = await tempWorkspace({
        rootDir: resolvePreferredNatesclawTmpDir(),
        prefix,
      });
      tempDirs.push(dir);
      return dir.dir;
    },
  };
}
