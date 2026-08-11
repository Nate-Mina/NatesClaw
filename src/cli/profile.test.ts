// Profile CLI tests cover profile selection, persistence, and command wiring.
import path from "node:path";
import { describe, expect, it } from "vitest";
import { formatCliCommand } from "./command-format.js";
import { applyCliProfileEnv, parseCliProfileArgs } from "./profile.js";

describe("parseCliProfileArgs", () => {
  it("leaves gateway --dev for subcommands", () => {
    const res = parseCliProfileArgs([
      "node",
      "natesclaw",
      "gateway",
      "--dev",
      "--allow-unconfigured",
    ]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBeNull();
    expect(res.argv).toEqual(["node", "natesclaw", "gateway", "--dev", "--allow-unconfigured"]);
  });

  it("leaves gateway --dev for subcommands after leading root options", () => {
    const res = parseCliProfileArgs([
      "node",
      "natesclaw",
      "--no-color",
      "gateway",
      "--dev",
      "--allow-unconfigured",
    ]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBeNull();
    expect(res.argv).toEqual([
      "node",
      "natesclaw",
      "--no-color",
      "gateway",
      "--dev",
      "--allow-unconfigured",
    ]);
  });

  it("still accepts global --dev before subcommand", () => {
    const res = parseCliProfileArgs(["node", "natesclaw", "--dev", "gateway"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("dev");
    expect(res.argv).toEqual(["node", "natesclaw", "gateway"]);
  });

  it("parses --profile value and strips it", () => {
    const res = parseCliProfileArgs(["node", "natesclaw", "--profile", "work", "status"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("work");
    expect(res.argv).toEqual(["node", "natesclaw", "status"]);
  });

  it("parses interleaved --profile after the command token", () => {
    const res = parseCliProfileArgs(["node", "natesclaw", "status", "--profile", "work", "--deep"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("work");
    expect(res.argv).toEqual(["node", "natesclaw", "status", "--deep"]);
  });

  it("preserves Matrix QA --profile for the command parser", () => {
    const res = parseCliProfileArgs([
      "node",
      "natesclaw",
      "qa",
      "matrix",
      "--profile",
      "fast",
      "--fail-fast",
    ]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBeNull();
    expect(res.argv).toEqual([
      "node",
      "natesclaw",
      "qa",
      "matrix",
      "--profile",
      "fast",
      "--fail-fast",
    ]);
  });

  it("preserves Matrix QA --profile after leading root options", () => {
    const res = parseCliProfileArgs([
      "node",
      "natesclaw",
      "--no-color",
      "qa",
      "matrix",
      "--profile=fast",
    ]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBeNull();
    expect(res.argv).toEqual(["node", "natesclaw", "--no-color", "qa", "matrix", "--profile=fast"]);
  });

  it("parses qa run --profile smoke-ci as a root profile", () => {
    const res = parseCliProfileArgs([
      "node",
      "natesclaw",
      "qa",
      "run",
      "--profile",
      "smoke-ci",
      "--category",
      "agent-runtime.agent-turn-execution",
    ]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("smoke-ci");
    expect(res.argv).toEqual([
      "node",
      "natesclaw",
      "qa",
      "run",
      "--category",
      "agent-runtime.agent-turn-execution",
    ]);
  });

  it("parses qa run --profile=release self-check invocations as root profiles", () => {
    const res = parseCliProfileArgs([
      "node",
      "natesclaw",
      "qa",
      "run",
      "--profile=release",
      "--output",
      "qa-report.md",
    ]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("release");
    expect(res.argv).toEqual(["node", "natesclaw", "qa", "run", "--output", "qa-report.md"]);
  });

  it("preserves qa run --qa-profile for the command parser", () => {
    const res = parseCliProfileArgs([
      "node",
      "natesclaw",
      "qa",
      "run",
      "--qa-profile",
      "smoke-ci",
      "--surface",
      "agent-runtime",
    ]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBeNull();
    expect(res.argv).toEqual([
      "node",
      "natesclaw",
      "qa",
      "run",
      "--qa-profile",
      "smoke-ci",
      "--surface",
      "agent-runtime",
    ]);
  });

  it("parses arbitrary qa run --profile values as root profiles", () => {
    const res = parseCliProfileArgs([
      "node",
      "natesclaw",
      "qa",
      "run",
      "--profile",
      "work",
      "--output",
      "qa-report.md",
    ]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("work");
    expect(res.argv).toEqual(["node", "natesclaw", "qa", "run", "--output", "qa-report.md"]);
  });

  it("parses arbitrary qa run --profile= values as root profiles", () => {
    const res = parseCliProfileArgs([
      "node",
      "natesclaw",
      "qa",
      "run",
      "--profile=work",
      "--output",
      "qa-report.md",
    ]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("work");
    expect(res.argv).toEqual(["node", "natesclaw", "qa", "run", "--output", "qa-report.md"]);
  });

  it("still parses root --profile before qa run", () => {
    const res = parseCliProfileArgs([
      "node",
      "natesclaw",
      "--profile",
      "work",
      "qa",
      "run",
      "--qa-profile",
      "smoke-ci",
    ]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("work");
    expect(res.argv).toEqual(["node", "natesclaw", "qa", "run", "--qa-profile", "smoke-ci"]);
  });

  it("still parses root --profile before Matrix QA", () => {
    const res = parseCliProfileArgs([
      "node",
      "natesclaw",
      "--profile",
      "work",
      "qa",
      "matrix",
      "--fail-fast",
    ]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("work");
    expect(res.argv).toEqual(["node", "natesclaw", "qa", "matrix", "--fail-fast"]);
  });

  it("parses interleaved --dev after the command token", () => {
    const res = parseCliProfileArgs(["node", "natesclaw", "status", "--dev"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("dev");
    expect(res.argv).toEqual(["node", "natesclaw", "status"]);
  });

  it("rejects missing profile value", () => {
    const res = parseCliProfileArgs(["node", "natesclaw", "--profile"]);
    expect(res.ok).toBe(false);
  });

  it.each([
    ["--dev first", ["node", "natesclaw", "--dev", "--profile", "work", "status"]],
    ["--profile first", ["node", "natesclaw", "--profile", "work", "--dev", "status"]],
    ["interleaved after command", ["node", "natesclaw", "status", "--profile", "work", "--dev"]],
  ])("rejects combining --dev with --profile (%s)", (_name, argv) => {
    const res = parseCliProfileArgs(argv);
    expect(res.ok).toBe(false);
  });
});

describe("applyCliProfileEnv", () => {
  it("fills env defaults for dev profile", () => {
    const env: Record<string, string | undefined> = {};
    applyCliProfileEnv({
      profile: "dev",
      env,
      homedir: () => "/home/peter",
    });
    const expectedStateDir = path.join(path.resolve("/home/peter"), ".natesclaw-dev");
    expect(env.NATESCLAW_PROFILE).toBe("dev");
    expect(env.NATESCLAW_STATE_DIR).toBe(expectedStateDir);
    expect(env.NATESCLAW_CONFIG_PATH).toBe(path.join(expectedStateDir, "natesclaw.json"));
    expect(env.NATESCLAW_GATEWAY_PORT).toBe("19001");
  });

  it("does not override explicit env values", () => {
    const env: Record<string, string | undefined> = {
      NATESCLAW_PROFILE: "prod",
      NATESCLAW_STATE_DIR: "/custom",
      NATESCLAW_GATEWAY_PORT: "19099",
    };
    applyCliProfileEnv({
      profile: "dev",
      env,
      homedir: () => "/home/peter",
    });
    expect(env.NATESCLAW_PROFILE).toBe("dev");
    expect(env.NATESCLAW_STATE_DIR).toBe("/custom");
    expect(env.NATESCLAW_GATEWAY_PORT).toBe("19099");
    expect(env.NATESCLAW_CONFIG_PATH).toBe(path.join("/custom", "natesclaw.json"));
  });

  it.each([
    {
      name: "the default profile without a profile marker",
      inheritedProfile: undefined,
      inheritedStateDir: "/home/peter/.natesclaw",
    },
    {
      name: "the explicitly marked default profile",
      inheritedProfile: "default",
      inheritedStateDir: "/home/peter/.natesclaw",
    },
    {
      name: "another named profile",
      inheritedProfile: "main",
      inheritedStateDir: "/home/peter/.natesclaw-main",
    },
    {
      name: "a home-relative default state directory",
      inheritedProfile: undefined,
      inheritedStateDir: "~/.natesclaw",
    },
  ])(
    "switches inherited canonical state from $name to the requested profile",
    ({ inheritedProfile, inheritedStateDir }) => {
      const env: Record<string, string | undefined> = {
        NATESCLAW_PROFILE: inheritedProfile,
        NATESCLAW_STATE_DIR: inheritedStateDir,
        NATESCLAW_CONFIG_PATH: path.join(inheritedStateDir, "natesclaw.json"),
      };

      applyCliProfileEnv({ profile: "work", env, homedir: () => "/home/peter" });

      const expectedStateDir = path.join(path.resolve("/home/peter"), ".natesclaw-work");
      expect(env.NATESCLAW_PROFILE).toBe("work");
      expect(env.NATESCLAW_STATE_DIR).toBe(expectedStateDir);
      expect(env.NATESCLAW_CONFIG_PATH).toBe(path.join(expectedStateDir, "natesclaw.json"));
    },
  );

  it("preserves an explicit config outside inherited canonical profile state", () => {
    const env: Record<string, string | undefined> = {
      NATESCLAW_PROFILE: "main",
      NATESCLAW_STATE_DIR: "/home/peter/.natesclaw-main",
      NATESCLAW_CONFIG_PATH: "/srv/natesclaw/custom.json",
    };

    applyCliProfileEnv({ profile: "work", env, homedir: () => "/home/peter" });

    expect(env.NATESCLAW_STATE_DIR).toBe("/home/peter/.natesclaw-work");
    expect(env.NATESCLAW_CONFIG_PATH).toBe("/srv/natesclaw/custom.json");
  });

  it.each(["natesclaw-gateway-main", "natesclaw-gateway-main.service"])(
    "drops inherited canonical service identities when switching profiles (%s)",
    (systemdUnit) => {
      const env: Record<string, string | undefined> = {
        NATESCLAW_PROFILE: "main",
        NATESCLAW_STATE_DIR: "/home/peter/.natesclaw-main",
        NATESCLAW_CONFIG_PATH: "/home/peter/.natesclaw-main/natesclaw.json",
        NATESCLAW_LAUNCHD_LABEL: "ai.natesclaw.main",
        NATESCLAW_SYSTEMD_UNIT: systemdUnit,
        NATESCLAW_WINDOWS_TASK_NAME: "Natesclaw Gateway (main)",
      };

      applyCliProfileEnv({ profile: "work", env, homedir: () => "/home/peter" });

      expect(env.NATESCLAW_LAUNCHD_LABEL).toBeUndefined();
      expect(env.NATESCLAW_SYSTEMD_UNIT).toBeUndefined();
      expect(env.NATESCLAW_WINDOWS_TASK_NAME).toBeUndefined();
    },
  );

  it("preserves explicit custom service identities when switching profiles", () => {
    const env: Record<string, string | undefined> = {
      NATESCLAW_PROFILE: "main",
      NATESCLAW_LAUNCHD_LABEL: "com.example.gateway",
      NATESCLAW_SYSTEMD_UNIT: "custom-gateway.service",
      NATESCLAW_WINDOWS_TASK_NAME: "Custom Gateway",
    };

    applyCliProfileEnv({ profile: "work", env, homedir: () => "/home/peter" });

    expect(env.NATESCLAW_LAUNCHD_LABEL).toBe("com.example.gateway");
    expect(env.NATESCLAW_SYSTEMD_UNIT).toBe("custom-gateway.service");
    expect(env.NATESCLAW_WINDOWS_TASK_NAME).toBe("Custom Gateway");
  });

  it.each([
    { inheritedProfile: "Main", selectedProfile: "main" },
    { inheritedProfile: "main", selectedProfile: "Main" },
  ])(
    "keeps case-distinct named profiles isolated ($inheritedProfile to $selectedProfile)",
    ({ inheritedProfile, selectedProfile }) => {
      const inheritedStateDir = `/home/peter/.natesclaw-${inheritedProfile}`;
      const env: Record<string, string | undefined> = {
        NATESCLAW_PROFILE: inheritedProfile,
        NATESCLAW_STATE_DIR: inheritedStateDir,
        NATESCLAW_CONFIG_PATH: path.join(inheritedStateDir, "natesclaw.json"),
      };

      applyCliProfileEnv({ profile: selectedProfile, env, homedir: () => "/home/peter" });

      const expectedStateDir = `/home/peter/.natesclaw-${selectedProfile}`;
      expect(env.NATESCLAW_PROFILE).toBe(selectedProfile);
      expect(env.NATESCLAW_STATE_DIR).toBe(expectedStateDir);
      expect(env.NATESCLAW_CONFIG_PATH).toBe(path.join(expectedStateDir, "natesclaw.json"));
    },
  );

  it("treats case variants of the default profile as the same canonical profile", () => {
    const stateDir = "/home/peter/.natesclaw";
    const env: Record<string, string | undefined> = {
      NATESCLAW_PROFILE: "Default",
      NATESCLAW_STATE_DIR: stateDir,
      NATESCLAW_CONFIG_PATH: path.join(stateDir, "natesclaw.json"),
    };

    applyCliProfileEnv({ profile: "default", env, homedir: () => "/home/peter" });

    expect(env.NATESCLAW_PROFILE).toBe("default");
    expect(env.NATESCLAW_STATE_DIR).toBe(stateDir);
    expect(env.NATESCLAW_CONFIG_PATH).toBe(path.join(stateDir, "natesclaw.json"));
  });

  it.each([
    {
      name: "the default profile",
      inheritedProfile: undefined,
      inheritedConfigPath: "/home/peter/.natesclaw/natesclaw.json",
    },
    {
      name: "another named profile",
      inheritedProfile: "main",
      inheritedConfigPath: "/home/peter/.natesclaw-main/natesclaw.json",
    },
    {
      name: "a home-relative named profile",
      inheritedProfile: "main",
      inheritedConfigPath: "~/.natesclaw-main/natesclaw.json",
    },
  ])(
    "switches an inherited $name config when the state directory is absent",
    ({ inheritedProfile, inheritedConfigPath }) => {
      const env: Record<string, string | undefined> = {
        NATESCLAW_PROFILE: inheritedProfile,
        NATESCLAW_CONFIG_PATH: inheritedConfigPath,
      };

      applyCliProfileEnv({ profile: "work", env, homedir: () => "/home/peter" });

      const expectedStateDir = "/home/peter/.natesclaw-work";
      expect(env.NATESCLAW_PROFILE).toBe("work");
      expect(env.NATESCLAW_STATE_DIR).toBe(expectedStateDir);
      expect(env.NATESCLAW_CONFIG_PATH).toBe(path.join(expectedStateDir, "natesclaw.json"));
    },
  );

  it("uses NATESCLAW_HOME when deriving profile state dir", () => {
    const env: Record<string, string | undefined> = {
      NATESCLAW_HOME: "/srv/natesclaw-home",
      HOME: "/home/other",
    };
    applyCliProfileEnv({
      profile: "work",
      env,
      homedir: () => "/home/fallback",
    });

    const resolvedHome = path.resolve("/srv/natesclaw-home");
    expect(env.NATESCLAW_STATE_DIR).toBe(path.join(resolvedHome, ".natesclaw-work"));
    expect(env.NATESCLAW_CONFIG_PATH).toBe(
      path.join(resolvedHome, ".natesclaw-work", "natesclaw.json"),
    );
  });
});

describe("formatCliCommand", () => {
  it.each([
    {
      name: "no profile is set",
      cmd: "natesclaw doctor --fix",
      env: {},
      expected: "natesclaw doctor --fix",
    },
    {
      name: "profile is default",
      cmd: "natesclaw doctor --fix",
      env: { NATESCLAW_PROFILE: "default" },
      expected: "natesclaw doctor --fix",
    },
    {
      name: "profile is Default (case-insensitive)",
      cmd: "natesclaw doctor --fix",
      env: { NATESCLAW_PROFILE: "Default" },
      expected: "natesclaw doctor --fix",
    },
    {
      name: "profile is invalid",
      cmd: "natesclaw doctor --fix",
      env: { NATESCLAW_PROFILE: "bad profile" },
      expected: "natesclaw doctor --fix",
    },
    {
      name: "--profile is already present",
      cmd: "natesclaw --profile work doctor --fix",
      env: { NATESCLAW_PROFILE: "work" },
      expected: "natesclaw --profile work doctor --fix",
    },
    {
      name: "--dev is already present",
      cmd: "natesclaw --dev doctor",
      env: { NATESCLAW_PROFILE: "dev" },
      expected: "natesclaw --dev doctor",
    },
  ])("returns command unchanged when $name", ({ cmd, env, expected }) => {
    expect(formatCliCommand(cmd, env)).toBe(expected);
  });

  it("inserts --profile flag when profile is set", () => {
    expect(formatCliCommand("natesclaw doctor --fix", { NATESCLAW_PROFILE: "work" })).toBe(
      "natesclaw --profile work doctor --fix",
    );
  });

  it("trims whitespace from profile", () => {
    expect(formatCliCommand("natesclaw doctor --fix", { NATESCLAW_PROFILE: "  jbnatesclaw  " })).toBe(
      "natesclaw --profile jbnatesclaw doctor --fix",
    );
  });

  it("handles command with no args after natesclaw", () => {
    expect(formatCliCommand("natesclaw", { NATESCLAW_PROFILE: "test" })).toBe(
      "natesclaw --profile test",
    );
  });

  it("handles pnpm wrapper", () => {
    expect(formatCliCommand("pnpm natesclaw doctor", { NATESCLAW_PROFILE: "work" })).toBe(
      "pnpm natesclaw --profile work doctor",
    );
  });

  it("inserts --container when a container hint is set", () => {
    expect(
      formatCliCommand("natesclaw gateway status --deep", { NATESCLAW_CONTAINER_HINT: "demo" }),
    ).toBe("natesclaw --container demo gateway status --deep");
  });

  it("ignores unsafe container hints", () => {
    expect(
      formatCliCommand("natesclaw gateway status --deep", {
        NATESCLAW_CONTAINER_HINT: "demo; rm -rf /",
      }),
    ).toBe("natesclaw gateway status --deep");
  });

  it("preserves both --container and --profile hints", () => {
    expect(
      formatCliCommand("natesclaw doctor", {
        NATESCLAW_CONTAINER_HINT: "demo",
        NATESCLAW_PROFILE: "work",
      }),
    ).toBe("natesclaw --container demo doctor");
  });

  it("does not prepend --container for update commands", () => {
    expect(formatCliCommand("natesclaw update", { NATESCLAW_CONTAINER_HINT: "demo" })).toBe(
      "natesclaw update",
    );
    expect(
      formatCliCommand("pnpm natesclaw update --channel beta", { NATESCLAW_CONTAINER_HINT: "demo" }),
    ).toBe("pnpm natesclaw update --channel beta");
  });
});
