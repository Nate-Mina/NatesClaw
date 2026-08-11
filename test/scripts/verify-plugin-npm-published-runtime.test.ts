// Verify Plugin Npm Published Runtime tests cover verify plugin npm published runtime script behavior.
import { describe, expect, it } from "vitest";
import {
  collectPluginNpmPublishedRuntimeErrors,
  findPackedPackageReadmePath,
  parseVerifyPublishedPluginRuntimeArgs,
  parseNpmReadmeMetadata,
  readPluginNpmCommandOptions,
  readPositiveIntEnv,
  resolveNpmPackFilename,
  runPluginNpmCommand,
  usage,
} from "../../scripts/verify-plugin-npm-published-runtime.mts";

describe("plugin npm publish verifier args", () => {
  it("parses help and package specs before npm calls", () => {
    expect(parseVerifyPublishedPluginRuntimeArgs(["--help"])).toEqual({ help: true, spec: "" });
    expect(parseVerifyPublishedPluginRuntimeArgs(["--", "@natesclaw/discord@2026.5.2"])).toEqual({
      help: false,
      spec: "@natesclaw/discord@2026.5.2",
    });
  });

  it("rejects unknown and extra args before npm calls", () => {
    expect(() => parseVerifyPublishedPluginRuntimeArgs([])).toThrow(usage());
    expect(() => parseVerifyPublishedPluginRuntimeArgs(["--wat"])).toThrow(
      "Unknown plugin npm verifier option: --wat",
    );
    expect(() =>
      parseVerifyPublishedPluginRuntimeArgs(["@natesclaw/discord@2026.5.2", "extra"]),
    ).toThrow("Unexpected plugin npm verifier argument: extra");
  });
});

describe("plugin npm publish verifier retry limits", () => {
  it("rejects loose numeric retry env values instead of parsing prefixes", () => {
    expect(() =>
      readPositiveIntEnv("NATESCLAW_PLUGIN_NPM_VERIFY_ATTEMPTS", 90, {
        NATESCLAW_PLUGIN_NPM_VERIFY_ATTEMPTS: "2tries",
      }),
    ).toThrow("invalid NATESCLAW_PLUGIN_NPM_VERIFY_ATTEMPTS: 2tries");
    expect(() =>
      readPositiveIntEnv("NATESCLAW_PLUGIN_NPM_VERIFY_DELAY_MS", 10000, {
        NATESCLAW_PLUGIN_NPM_VERIFY_DELAY_MS: "1e3",
      }),
    ).toThrow("invalid NATESCLAW_PLUGIN_NPM_VERIFY_DELAY_MS: 1e3");
    expect(() =>
      readPositiveIntEnv("NATESCLAW_PLUGIN_NPM_README_VERIFY_ATTEMPTS", 6, {
        NATESCLAW_PLUGIN_NPM_README_VERIFY_ATTEMPTS: "0",
      }),
    ).toThrow("invalid NATESCLAW_PLUGIN_NPM_README_VERIFY_ATTEMPTS: 0");
  });

  it("accepts strict positive retry env values and defaults", () => {
    expect(readPositiveIntEnv("NATESCLAW_PLUGIN_NPM_VERIFY_ATTEMPTS", 90, {})).toBe(90);
    expect(
      readPositiveIntEnv("NATESCLAW_PLUGIN_NPM_README_VERIFY_DELAY_MS", 10000, {
        NATESCLAW_PLUGIN_NPM_README_VERIFY_DELAY_MS: "2500",
      }),
    ).toBe(2500);
  });
});

describe("plugin npm publish verifier command limits", () => {
  it("bounds npm command runtime and captured output by default", () => {
    expect(readPluginNpmCommandOptions({})).toStrictEqual({
      encoding: "utf8",
      killSignal: "SIGKILL",
      maxBuffer: 16 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 5 * 60 * 1000,
    });
  });

  it("accepts strict npm command timeout and buffer overrides", () => {
    expect(
      readPluginNpmCommandOptions({
        NATESCLAW_PLUGIN_NPM_COMMAND_MAX_BUFFER_BYTES: "33554432",
        NATESCLAW_PLUGIN_NPM_COMMAND_TIMEOUT_MS: "120000",
      }),
    ).toMatchObject({
      maxBuffer: 32 * 1024 * 1024,
      timeout: 120000,
    });
  });

  it("rejects loose npm command timeout and buffer overrides", () => {
    expect(() =>
      readPluginNpmCommandOptions({
        NATESCLAW_PLUGIN_NPM_COMMAND_TIMEOUT_MS: "60s",
      }),
    ).toThrow("invalid NATESCLAW_PLUGIN_NPM_COMMAND_TIMEOUT_MS: 60s");
    expect(() =>
      readPluginNpmCommandOptions({
        NATESCLAW_PLUGIN_NPM_COMMAND_MAX_BUFFER_BYTES: "16mb",
      }),
    ).toThrow("invalid NATESCLAW_PLUGIN_NPM_COMMAND_MAX_BUFFER_BYTES: 16mb");
  });

  it("runs npm metadata commands with bounded exec options", () => {
    const calls: unknown[] = [];
    const output = runPluginNpmCommand(["view", "@natesclaw/discord", "readme"], {
      env: {
        NATESCLAW_PLUGIN_NPM_COMMAND_MAX_BUFFER_BYTES: "1024",
        NATESCLAW_PLUGIN_NPM_COMMAND_TIMEOUT_MS: "2500",
      },
      execFileSyncImpl(command: string, args: string[], options: unknown) {
        calls.push({ args, command, options });
        return JSON.stringify("# Discord");
      },
    });

    expect(output).toBe(JSON.stringify("# Discord"));
    expect(calls).toStrictEqual([
      {
        args: ["view", "@natesclaw/discord", "readme"],
        command: "npm",
        options: {
          encoding: "utf8",
          killSignal: "SIGKILL",
          maxBuffer: 1024,
          stdio: ["ignore", "pipe", "pipe"],
          timeout: 2500,
        },
      },
    ]);
  });
});

describe("collectPluginNpmPublishedRuntimeErrors", () => {
  it("flags published plugin packages with TypeScript entries and no compiled runtime output", () => {
    expect(
      collectPluginNpmPublishedRuntimeErrors({
        spec: "@natesclaw/discord@2026.5.2",
        packageJson: {
          name: "@natesclaw/discord",
          version: "2026.5.2",
          natesclaw: {
            extensions: ["./index.ts"],
          },
        },
        files: ["package.json", "natesclaw.plugin.json", "index.ts"],
      }),
    ).toEqual([
      "@natesclaw/discord@2026.5.2 requires compiled runtime output for TypeScript entry ./index.ts: expected ./dist/index.js, ./dist/index.mjs, ./dist/index.cjs, ./index.js, ./index.mjs, ./index.cjs",
    ]);
  });

  it("accepts published plugin packages with explicit runtimeExtensions", () => {
    expect(
      collectPluginNpmPublishedRuntimeErrors({
        packageJson: {
          name: "@natesclaw/zalo",
          version: "2026.5.3",
          natesclaw: {
            extensions: ["./index.ts"],
            runtimeExtensions: ["./dist/index.js"],
          },
        },
        files: ["package.json", "natesclaw.plugin.json", "index.ts", "dist/index.js"],
      }),
    ).toStrictEqual([]);
  });

  it("flags plugin npm packages without an Natesclaw plugin manifest", () => {
    expect(
      collectPluginNpmPublishedRuntimeErrors({
        packageJson: {
          name: "@natesclaw/searxng-plugin",
          version: "2026.6.11",
          natesclaw: {
            extensions: ["./index.ts"],
            runtimeExtensions: ["./dist/index.js"],
          },
        },
        files: ["package.json", "dist/index.js"],
      }),
    ).toEqual([
      "@natesclaw/searxng-plugin@2026.6.11 plugin npm package must include natesclaw.plugin.json",
    ]);
  });

  it("flags reservation packages before they can pass plugin runtime verification", () => {
    expect(
      collectPluginNpmPublishedRuntimeErrors({
        packageJson: {
          name: "@natesclaw/tavily-plugin",
          version: "0.0.0",
          description: "Bootstrap reservation",
        },
        files: ["package.json", "README.md"],
      }),
    ).toEqual([
      "@natesclaw/tavily-plugin@0.0.0 plugin npm package must include natesclaw.plugin.json",
    ]);
  });

  it("flags missing explicit runtimeExtensions outputs", () => {
    expect(
      collectPluginNpmPublishedRuntimeErrors({
        packageJson: {
          name: "@natesclaw/line",
          version: "2026.5.3",
          natesclaw: {
            extensions: ["./src/index.ts"],
            runtimeExtensions: ["./dist/index.js"],
          },
        },
        files: ["package.json", "natesclaw.plugin.json", "src/index.ts"],
      }),
    ).toEqual(["@natesclaw/line@2026.5.3 runtime extension entry not found: ./dist/index.js"]);
  });

  it("flags runtimeExtensions length mismatches", () => {
    expect(
      collectPluginNpmPublishedRuntimeErrors({
        packageJson: {
          name: "@natesclaw/acpx",
          version: "2026.5.3",
          natesclaw: {
            extensions: ["./index.ts", "./tools.ts"],
            runtimeExtensions: ["./dist/index.js"],
          },
        },
        files: ["package.json", "natesclaw.plugin.json", "dist/index.js"],
      }),
    ).toEqual([
      "@natesclaw/acpx@2026.5.3 package.json natesclaw.runtimeExtensions length (1) must match natesclaw.extensions length (2)",
    ]);
  });

  it("flags blank runtimeExtensions entries instead of falling back to inferred outputs", () => {
    expect(
      collectPluginNpmPublishedRuntimeErrors({
        packageJson: {
          name: "@natesclaw/whatsapp",
          version: "2026.5.3",
          natesclaw: {
            extensions: ["./src/index.ts"],
            runtimeExtensions: [" "],
          },
        },
        files: ["package.json", "natesclaw.plugin.json", "src/index.ts", "dist/index.js"],
      }),
    ).toEqual([
      "@natesclaw/whatsapp@2026.5.3 package.json natesclaw.runtimeExtensions[0] must be a non-empty string",
    ]);
  });

  it("flags published plugin packages with TypeScript setup entries and no compiled setup runtime", () => {
    expect(
      collectPluginNpmPublishedRuntimeErrors({
        packageJson: {
          name: "@natesclaw/line",
          version: "2026.5.3",
          natesclaw: {
            extensions: ["./index.ts"],
            runtimeExtensions: ["./dist/index.js"],
            setupEntry: "./setup-entry.ts",
          },
        },
        files: [
          "package.json",
          "natesclaw.plugin.json",
          "index.ts",
          "dist/index.js",
          "setup-entry.ts",
        ],
      }),
    ).toEqual([
      "@natesclaw/line@2026.5.3 requires compiled runtime output for TypeScript entry ./setup-entry.ts: expected ./dist/setup-entry.js, ./dist/setup-entry.mjs, ./dist/setup-entry.cjs, ./setup-entry.js, ./setup-entry.mjs, ./setup-entry.cjs",
    ]);
  });

  it("accepts published plugin packages with explicit runtimeSetupEntry", () => {
    expect(
      collectPluginNpmPublishedRuntimeErrors({
        packageJson: {
          name: "@natesclaw/qqbot",
          version: "2026.5.3",
          natesclaw: {
            extensions: ["./index.ts"],
            runtimeExtensions: ["./dist/index.js"],
            setupEntry: "./setup-entry.ts",
            runtimeSetupEntry: "./dist/setup-entry.js",
          },
        },
        files: ["package.json", "natesclaw.plugin.json", "dist/index.js", "dist/setup-entry.js"],
      }),
    ).toStrictEqual([]);
  });

  it("flags missing explicit runtimeSetupEntry outputs", () => {
    expect(
      collectPluginNpmPublishedRuntimeErrors({
        packageJson: {
          name: "@natesclaw/matrix",
          version: "2026.5.3",
          natesclaw: {
            extensions: ["./index.ts"],
            runtimeExtensions: ["./dist/index.js"],
            setupEntry: "./setup-entry.ts",
            runtimeSetupEntry: "./dist/setup-entry.js",
          },
        },
        files: ["package.json", "natesclaw.plugin.json", "dist/index.js"],
      }),
    ).toEqual(["@natesclaw/matrix@2026.5.3 runtime setup entry not found: ./dist/setup-entry.js"]);
  });

  it("flags runtimeSetupEntry without setupEntry", () => {
    expect(
      collectPluginNpmPublishedRuntimeErrors({
        packageJson: {
          name: "@natesclaw/twitch",
          version: "2026.5.3",
          natesclaw: {
            extensions: ["./index.ts"],
            runtimeExtensions: ["./dist/index.js"],
            runtimeSetupEntry: "./dist/setup-entry.js",
          },
        },
        files: ["package.json", "natesclaw.plugin.json", "dist/index.js", "dist/setup-entry.js"],
      }),
    ).toEqual([
      "@natesclaw/twitch@2026.5.3 package.json natesclaw.runtimeSetupEntry requires natesclaw.setupEntry",
    ]);
  });
});

describe("resolveNpmPackFilename", () => {
  it("uses the final tarball filename from plain npm pack output", () => {
    const noisyOutput = [
      "npm notice",
      "npm notice package: @natesclaw/msteams@2026.5.24-beta.1",
      "natesclaw-msteams-2026.5.24-beta.1.tgz",
      "",
    ].join("\n");

    expect(resolveNpmPackFilename(noisyOutput)).toBe("natesclaw-msteams-2026.5.24-beta.1.tgz");
  });

  it("rejects path-like tarball output instead of reading outside the pack directory", () => {
    const unsafeOutputs = [
      "../natesclaw-msteams.tgz",
      "nested/natesclaw-msteams.tgz",
      "nested\\natesclaw-msteams.tgz",
      "/tmp/natesclaw-msteams.tgz",
      "C:\\temp\\natesclaw-msteams.tgz",
      "natesclaw-msteams\u0000.tgz",
    ];

    for (const output of unsafeOutputs) {
      expect(() => resolveNpmPackFilename(output)).toThrow(
        "npm pack did not report a tarball filename",
      );
    }
  });
});

describe("findPackedPackageReadmePath", () => {
  it("finds a root package README without accepting nested documentation files", () => {
    expect(
      findPackedPackageReadmePath(["package.json", "docs/README.md", "README.md", "dist/index.js"]),
    ).toBe("README.md");
    expect(findPackedPackageReadmePath(["package.json", "docs/README.md"])).toBe("");
  });
});

describe("parseNpmReadmeMetadata", () => {
  it("accepts non-empty npm readme metadata", () => {
    expect(parseNpmReadmeMetadata(JSON.stringify("# Plugin\n\nInstall it."))).toBe(
      "# Plugin\n\nInstall it.",
    );
  });

  it("rejects empty or unsupported npm readme metadata", () => {
    expect(parseNpmReadmeMetadata(JSON.stringify(""))).toBe("");
    expect(parseNpmReadmeMetadata(JSON.stringify(null))).toBe("");
    expect(parseNpmReadmeMetadata("{")).toBe("");
  });
});
