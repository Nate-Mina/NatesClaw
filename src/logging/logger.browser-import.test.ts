// Logger browser import tests cover safe import behavior in browser-like runtimes.
import { importFreshModule } from "natesclaw/plugin-sdk/test-fixtures";
import { afterEach, describe, expect, it, vi } from "vitest";

type LoggerModule = typeof import("./logger.js");

const originalGetBuiltinModule = (
  process as NodeJS.Process & { getBuiltinModule?: (id: string) => unknown }
).getBuiltinModule;

async function importBrowserSafeLogger(params?: {
  resolvePreferredNatesclawTmpDir?: ReturnType<typeof vi.fn>;
}): Promise<{
  module: LoggerModule;
  resolvePreferredNatesclawTmpDir: ReturnType<typeof vi.fn>;
}> {
  const resolvePreferredNatesclawTmpDir =
    params?.resolvePreferredNatesclawTmpDir ??
    vi.fn(() => {
      throw new Error("resolvePreferredNatesclawTmpDir should not run during browser-safe import");
    });

  vi.doMock("../infra/tmp-natesclaw-dir.js", async () => {
    const actual = await vi.importActual<typeof import("../infra/tmp-natesclaw-dir.js")>(
      "../infra/tmp-natesclaw-dir.js",
    );
    return {
      ...actual,
      resolvePreferredNatesclawTmpDir,
    };
  });

  Object.defineProperty(process, "getBuiltinModule", {
    configurable: true,
    value: undefined,
  });

  const module = await importFreshModule<LoggerModule>(
    import.meta.url,
    "./logger.js?scope=browser-safe",
  );
  return { module, resolvePreferredNatesclawTmpDir };
}

describe("logging/logger browser-safe import", () => {
  afterEach(() => {
    vi.doUnmock("../infra/tmp-natesclaw-dir.js");
    Object.defineProperty(process, "getBuiltinModule", {
      configurable: true,
      value: originalGetBuiltinModule,
    });
  });

  it("does not resolve the preferred temp dir at import time when node fs is unavailable", async () => {
    const { module, resolvePreferredNatesclawTmpDir } = await importBrowserSafeLogger();

    expect(resolvePreferredNatesclawTmpDir).not.toHaveBeenCalled();
    expect(module.DEFAULT_LOG_DIR).toBe("/tmp/natesclaw");
    expect(module.DEFAULT_LOG_FILE).toBe("/tmp/natesclaw/natesclaw.log");
  });

  it("disables file logging when imported in a browser-like environment", async () => {
    const { module, resolvePreferredNatesclawTmpDir } = await importBrowserSafeLogger();

    expect(module.getResolvedLoggerSettings()).toStrictEqual({
      level: "silent",
      file: "/tmp/natesclaw/natesclaw.log",
      maxFileBytes: 100 * 1024 * 1024,
    });
    expect(module.isFileLogLevelEnabled("info")).toBe(false);
    expect(module.getLogger().info("browser-safe")).toBeUndefined();
    expect(resolvePreferredNatesclawTmpDir).not.toHaveBeenCalled();
  });
});
