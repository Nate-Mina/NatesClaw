import { describe, expect, it, vi } from "vitest";
import { runMainOrRootHelp } from "./entry.js";

describe("entry run-main boundary", () => {
  it("retains JSON console routing through process finalization", async () => {
    const runCli = vi.fn(async () => undefined);

    await runMainOrRootHelp(["node", "natesclaw", "status"], {
      loadRunCli: async () => ({ runCli }),
    });

    expect(runCli).toHaveBeenCalledWith(["node", "natesclaw", "status"], {
      additionalStartupTrace: expect.any(Object),
      retainConsoleRoutingUntilProcessExit: true,
    });
  });
});
