import fs from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useAutoCleanupTempDirTracker } from "../../test/helpers/temp-dir.js";

const resolvePreferredNatesclawTmpDirMock = vi.hoisted(() => vi.fn());

vi.mock("./tmp-natesclaw-dir.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./tmp-natesclaw-dir.js")>();
  return {
    ...actual,
    resolvePreferredNatesclawTmpDir: resolvePreferredNatesclawTmpDirMock,
  };
});

import { withInstallWorkspace } from "./install-source-utils.js";

describe("withInstallWorkspace private root", () => {
  const tempDirs = useAutoCleanupTempDirTracker(afterEach);

  it.runIf(process.platform !== "win32")(
    "preserves parent temp root permissions when using private Natesclaw temp root",
    async () => {
      const mockParentRoot = tempDirs.make("natesclaw-chmod-test-");
      const mockNatesclawDir = path.join(mockParentRoot, "natesclaw");

      await fs.mkdir(mockNatesclawDir, { recursive: true });
      await fs.chmod(mockParentRoot, 0o1777);
      const canonicalNatesclawDir = await fs.realpath(mockNatesclawDir);

      resolvePreferredNatesclawTmpDirMock.mockReturnValue(mockNatesclawDir);

      let observedDir = "";
      const value = await withInstallWorkspace("natesclaw-test-", async (tmpDir) => {
        observedDir = tmpDir;
        expect(path.dirname(tmpDir)).toBe(canonicalNatesclawDir);
        await fs.writeFile(path.join(tmpDir, "marker.txt"), "ok");
        return "done";
      });

      expect(value).toBe("done");

      await expect(
        fs.stat(observedDir).then(
          () => true,
          () => false,
        ),
      ).resolves.toBe(false);

      const privateRootStat = await fs.stat(mockNatesclawDir);
      expect(privateRootStat.mode & 0o7777).toBe(0o700);

      const parentStat = await fs.stat(mockParentRoot);
      expect(parentStat.mode & 0o7777).toBe(0o1777);
    },
  );
});
