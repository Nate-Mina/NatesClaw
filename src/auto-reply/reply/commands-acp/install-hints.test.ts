// Tests ACP install hint detection and command guidance.
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { NatesclawConfig } from "../../../config/config.js";
import { resolveAcpInstallCommandHint } from "./install-hints.js";

function withAcpConfig(acp: NatesclawConfig["acp"]): NatesclawConfig {
  return { acp } as NatesclawConfig;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ACP install hints", () => {
  it("prefers explicit runtime install command", () => {
    const cfg = withAcpConfig({
      runtime: { installCommand: "pnpm natesclaw plugins install acpx" },
    });
    expect(resolveAcpInstallCommandHint(cfg)).toBe("pnpm natesclaw plugins install acpx");
  });

  it("uses local acpx extension path when present", () => {
    const repoRoot = process.cwd();
    const cfg = withAcpConfig({ backend: "acpx" });
    const hint = resolveAcpInstallCommandHint(cfg);
    expect(hint).toBe(`natesclaw plugins install ${path.join(repoRoot, "extensions", "acpx")}`);
  });

  it("falls back to scoped install hint for acpx when local extension is absent", () => {
    vi.spyOn(process, "cwd").mockReturnValue(path.join(process.cwd(), "missing-workspace"));

    const cfg = withAcpConfig({ backend: "acpx" });
    expect(resolveAcpInstallCommandHint(cfg)).toBe("natesclaw plugins install acpx");
  });

  it("returns generic plugin hint for non-acpx backend", () => {
    const cfg = withAcpConfig({ backend: "custom-backend" });
    expect(resolveAcpInstallCommandHint(cfg)).toBe(
      'Install and enable the plugin that provides ACP backend "custom-backend".',
    );
  });
});
