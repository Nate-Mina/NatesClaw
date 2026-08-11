// Covers Nix integration config compatibility scenarios U3, U5, and U9.
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_GATEWAY_PORT,
  resolveConfigPathCandidate,
  resolveGatewayPort,
  resolveIsNixMode,
  resolveStateDir,
} from "./config.js";
import { withTempHome } from "./test-helpers.js";

vi.unmock("../version.js");

function envWith(overrides: Record<string, string | undefined>): NodeJS.ProcessEnv {
  // Hermetic env: don't inherit process.env because other tests may mutate it.
  return { ...overrides };
}

describe("Nix integration (U3, U5, U9)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("U3: isNixMode env var detection", () => {
    it("isNixMode is false when NATESCLAW_NIX_MODE is not set", () => {
      expect(resolveIsNixMode(envWith({ NATESCLAW_NIX_MODE: undefined }))).toBe(false);
    });

    it("isNixMode is false when NATESCLAW_NIX_MODE is empty", () => {
      expect(resolveIsNixMode(envWith({ NATESCLAW_NIX_MODE: "" }))).toBe(false);
    });

    it("isNixMode is false when NATESCLAW_NIX_MODE is not '1'", () => {
      expect(resolveIsNixMode(envWith({ NATESCLAW_NIX_MODE: "true" }))).toBe(false);
    });

    it("isNixMode is true when NATESCLAW_NIX_MODE=1", () => {
      expect(resolveIsNixMode(envWith({ NATESCLAW_NIX_MODE: "1" }))).toBe(true);
    });
  });

  describe("U5: CONFIG_PATH and STATE_DIR env var overrides", () => {
    it("STATE_DIR defaults to ~/.natesclaw when env not set", () => {
      expect(resolveStateDir(envWith({ NATESCLAW_STATE_DIR: undefined }))).toMatch(/\.natesclaw$/);
    });

    it("STATE_DIR respects NATESCLAW_STATE_DIR override", () => {
      expect(resolveStateDir(envWith({ NATESCLAW_STATE_DIR: "/custom/state/dir" }))).toBe(
        path.resolve("/custom/state/dir"),
      );
    });

    it("STATE_DIR respects NATESCLAW_HOME when state override is unset", () => {
      const customHome = path.join(path.sep, "custom", "home");
      expect(
        resolveStateDir(envWith({ NATESCLAW_HOME: customHome, NATESCLAW_STATE_DIR: undefined })),
      ).toBe(path.join(path.resolve(customHome), ".natesclaw"));
    });

    it("CONFIG_PATH defaults to NATESCLAW_HOME/.natesclaw/natesclaw.json", () => {
      const customHome = path.join(path.sep, "custom", "home");
      expect(
        resolveConfigPathCandidate(
          envWith({
            NATESCLAW_HOME: customHome,
            NATESCLAW_CONFIG_PATH: undefined,
            NATESCLAW_STATE_DIR: undefined,
          }),
        ),
      ).toBe(path.join(path.resolve(customHome), ".natesclaw", "natesclaw.json"));
    });

    it("CONFIG_PATH defaults to ~/.natesclaw/natesclaw.json when env not set", () => {
      expect(
        resolveConfigPathCandidate(
          envWith({ NATESCLAW_CONFIG_PATH: undefined, NATESCLAW_STATE_DIR: undefined }),
        ),
      ).toMatch(/\.natesclaw[\\/]natesclaw\.json$/);
    });

    it("CONFIG_PATH respects NATESCLAW_CONFIG_PATH override", () => {
      expect(
        resolveConfigPathCandidate(
          envWith({ NATESCLAW_CONFIG_PATH: "/nix/store/abc/natesclaw.json" }),
        ),
      ).toBe(path.resolve("/nix/store/abc/natesclaw.json"));
    });

    it("CONFIG_PATH expands ~ in NATESCLAW_CONFIG_PATH override", async () => {
      await withTempHome(async (home) => {
        expect(
          resolveConfigPathCandidate(
            envWith({ NATESCLAW_HOME: home, NATESCLAW_CONFIG_PATH: "~/.natesclaw/custom.json" }),
            () => home,
          ),
        ).toBe(path.join(home, ".natesclaw", "custom.json"));
      });
    });

    it("CONFIG_PATH uses STATE_DIR when only state dir is overridden", () => {
      expect(
        resolveConfigPathCandidate(
          envWith({ NATESCLAW_STATE_DIR: "/custom/state", NATESCLAW_TEST_FAST: "1" }),
          () => path.join(path.sep, "tmp", "natesclaw-config-home"),
        ),
      ).toBe(path.join(path.resolve("/custom/state"), "natesclaw.json"));
    });
  });

  describe("U6: gateway port resolution", () => {
    it("uses default when env and config are unset", () => {
      expect(resolveGatewayPort({}, envWith({ NATESCLAW_GATEWAY_PORT: undefined }))).toBe(
        DEFAULT_GATEWAY_PORT,
      );
    });

    it("prefers NATESCLAW_GATEWAY_PORT over config", () => {
      expect(
        resolveGatewayPort(
          { gateway: { port: 19002 } },
          envWith({ NATESCLAW_GATEWAY_PORT: "19001" }),
        ),
      ).toBe(19001);
    });

    it("falls back to config when env is invalid", () => {
      expect(
        resolveGatewayPort(
          { gateway: { port: 19003 } },
          envWith({ NATESCLAW_GATEWAY_PORT: "nope" }),
        ),
      ).toBe(19003);
    });
  });
});
