// Argv tests cover CLI argument parsing helpers and platform-specific normalization.
import { describe, expect, it } from "vitest";
import {
  buildParseArgv,
  getFlagValue,
  getCommandPositionalsWithRootOptions,
  getCommandPathWithRootOptions,
  getPrimaryCommand,
  getPositiveIntFlagValue,
  getVerboseFlag,
  hasFlag,
  isHelpOrVersionInvocation,
  isRootHelpInvocation,
  isRootVersionInvocation,
  isSimpleCommandHelpInvocation,
  normalizeGeneratedHelpCommandArgv,
  normalizeRootHelpTargetArgv,
  normalizeRootLogLevelArgv,
  normalizeRootNoColorArgv,
} from "./argv.js";

describe("argv helpers", () => {
  it.each([
    {
      name: "known command group help command help flag",
      argv: ["node", "natesclaw", "backup", "help", "--help"],
      expected: ["node", "natesclaw", "backup", "help"],
    },
    {
      name: "known command group help command short help flag",
      argv: ["node", "natesclaw", "--profile", "work", "backup", "help", "-h"],
      expected: ["node", "natesclaw", "--profile", "work", "backup", "help"],
    },
    {
      name: "leaf positional help remains untouched",
      argv: ["node", "natesclaw", "docs", "help", "--help"],
      expected: ["node", "natesclaw", "docs", "help", "--help"],
    },
    {
      name: "known command group help target",
      argv: ["node", "natesclaw", "plugins", "help", "list"],
      expected: ["node", "natesclaw", "plugins", "list", "--help"],
    },
    {
      name: "known command group help target help flag",
      argv: ["node", "natesclaw", "plugins", "help", "list", "--help"],
      expected: ["node", "natesclaw", "plugins", "list", "--help"],
    },
    {
      name: "unknown plugin command group help target",
      argv: ["node", "natesclaw", "external-plugin", "help", "inspect"],
      expected: ["node", "natesclaw", "external-plugin", "inspect", "--help"],
    },
    {
      name: "unknown plugin command group help target help flag",
      argv: ["node", "natesclaw", "external-plugin", "help", "inspect", "--help"],
      expected: ["node", "natesclaw", "external-plugin", "inspect", "--help"],
    },
    {
      name: "generated help target with trailing root option",
      argv: ["node", "natesclaw", "memory", "help", "status", "--no-color"],
      expected: ["node", "natesclaw", "--no-color", "memory", "status", "--help"],
    },
    {
      name: "extra help positionals remain untouched",
      argv: ["node", "natesclaw", "backup", "help", "missing", "extra", "--help"],
      expected: ["node", "natesclaw", "backup", "help", "missing", "extra", "--help"],
    },
    {
      name: "terminator help flag remains untouched",
      argv: ["node", "natesclaw", "backup", "help", "--", "--help"],
      expected: ["node", "natesclaw", "backup", "help", "--", "--help"],
    },
  ])("normalizes generated help commands: $name", ({ argv, expected }) => {
    expect(normalizeGeneratedHelpCommandArgv(argv)).toEqual(expected);
  });

  it.each([
    {
      name: "root help target",
      argv: ["node", "natesclaw", "help", "plugins"],
      expected: ["node", "natesclaw", "plugins", "--help"],
    },
    {
      name: "root help target with help flag",
      argv: ["node", "natesclaw", "help", "plugins", "--help"],
      expected: ["node", "natesclaw", "plugins", "--help"],
    },
    {
      name: "root option before help target",
      argv: ["node", "natesclaw", "--profile", "work", "help", "memory"],
      expected: ["node", "natesclaw", "--profile", "work", "memory", "--help"],
    },
    {
      name: "bare root help remains untouched",
      argv: ["node", "natesclaw", "help"],
      expected: ["node", "natesclaw", "help"],
    },
    {
      name: "root help self-help remains untouched",
      argv: ["node", "natesclaw", "help", "--help"],
      expected: ["node", "natesclaw", "help", "--help"],
    },
    {
      name: "nested root help target",
      argv: ["node", "natesclaw", "help", "plugins", "list"],
      expected: ["node", "natesclaw", "plugins", "list", "--help"],
    },
    {
      name: "nested root help target with help flag",
      argv: ["node", "natesclaw", "help", "plugins", "list", "--help"],
      expected: ["node", "natesclaw", "plugins", "list", "--help"],
    },
    {
      name: "nested root help target with trailing root option",
      argv: ["node", "natesclaw", "help", "memory", "status", "--no-color"],
      expected: ["node", "natesclaw", "--no-color", "memory", "status", "--help"],
    },
  ])("normalizes root help targets: $name", ({ argv, expected }) => {
    expect(normalizeRootHelpTargetArgv(argv)).toEqual(expected);
  });

  it.each([
    {
      name: "subcommand trailing no-color",
      argv: ["node", "natesclaw", "doctor", "--no-color", "--post-upgrade", "--json"],
      expected: ["node", "natesclaw", "--no-color", "doctor", "--post-upgrade", "--json"],
    },
    {
      name: "keeps existing root options first",
      argv: ["node", "natesclaw", "--profile", "work", "doctor", "--no-color", "--lint", "--json"],
      expected: [
        "node",
        "natesclaw",
        "--profile",
        "work",
        "--no-color",
        "doctor",
        "--lint",
        "--json",
      ],
    },
    {
      name: "keeps no-color after possible command option value",
      argv: ["node", "natesclaw", "doctor", "--lint", "--json", "--no-color"],
      expected: ["node", "natesclaw", "doctor", "--lint", "--json", "--no-color"],
    },
    {
      name: "flag terminator leaves no-color positional",
      argv: ["node", "natesclaw", "doctor", "--", "--no-color"],
      expected: ["node", "natesclaw", "doctor", "--", "--no-color"],
    },
    {
      name: "command option value remains literal",
      argv: ["node", "natesclaw", "agent", "--message", "--no-color"],
      expected: ["node", "natesclaw", "agent", "--message", "--no-color"],
    },
    {
      name: "assigned command option value does not block no-color",
      argv: ["node", "natesclaw", "agent", "--message=hello", "--no-color"],
      expected: ["node", "natesclaw", "--no-color", "agent", "--message=hello"],
    },
  ])("normalizes root --no-color before command parsing: $name", ({ argv, expected }) => {
    expect(normalizeRootNoColorArgv(argv)).toEqual(expected);
  });

  it("allows final command metadata to lift no-color after boolean command flags", () => {
    const argv = ["node", "natesclaw", "doctor", "--lint", "--json", "--no-color"];

    expect(
      normalizeRootNoColorArgv(argv, {
        shouldPreserveNoColor: ({ remainingArgs, noColorIndex }) =>
          remainingArgs[noColorIndex - 1] === "--message",
      }),
    ).toEqual(["node", "natesclaw", "--no-color", "doctor", "--lint", "--json"]);
  });

  it.each([
    {
      name: "subcommand trailing log-level",
      argv: ["node", "natesclaw", "doctor", "--log-level", "debug", "--json"],
      expected: ["node", "natesclaw", "--log-level", "debug", "doctor", "--json"],
    },
    {
      name: "subcommand trailing log-level equals form",
      argv: ["node", "natesclaw", "doctor", "--log-level=trace", "--json"],
      expected: ["node", "natesclaw", "--log-level=trace", "doctor", "--json"],
    },
    {
      name: "keeps existing root options first",
      argv: ["node", "natesclaw", "--profile", "work", "doctor", "--log-level", "debug"],
      expected: ["node", "natesclaw", "--profile", "work", "--log-level", "debug", "doctor"],
    },
    {
      name: "keeps log-level after possible command option value",
      argv: ["node", "natesclaw", "agent", "--message", "--log-level", "debug"],
      expected: ["node", "natesclaw", "agent", "--message", "--log-level", "debug"],
    },
    {
      name: "flag terminator leaves log-level positional",
      argv: ["node", "natesclaw", "nodes", "run", "--", "--log-level", "debug"],
      expected: ["node", "natesclaw", "nodes", "run", "--", "--log-level", "debug"],
    },
    {
      name: "missing value remains command scoped",
      argv: ["node", "natesclaw", "doctor", "--log-level", "--json"],
      expected: ["node", "natesclaw", "doctor", "--log-level", "--json"],
    },
  ])("normalizes root --log-level before command parsing: $name", ({ argv, expected }) => {
    expect(normalizeRootLogLevelArgv(argv)).toEqual(expected);
  });

  it("allows final command metadata to lift log-level after boolean command flags", () => {
    const argv = ["node", "natesclaw", "doctor", "--lint", "--json", "--log-level", "debug"];

    expect(
      normalizeRootLogLevelArgv(argv, {
        shouldPreserveLogLevel: ({ remainingArgs, logLevelIndex }) =>
          remainingArgs[logLevelIndex - 1] === "--message",
      }),
    ).toEqual(["node", "natesclaw", "--log-level", "debug", "doctor", "--lint", "--json"]);
  });

  it("preserves log-level when final command metadata owns the option", () => {
    const argv = ["node", "natesclaw", "plugin-cmd", "--log-level", "debug"];

    expect(
      normalizeRootLogLevelArgv(argv, {
        shouldPreserveLogLevel: ({ remainingArgs, logLevelIndex }) =>
          remainingArgs[logLevelIndex] === "--log-level",
      }),
    ).toEqual(argv);
  });

  it.each([
    {
      name: "root help command",
      argv: ["node", "natesclaw", "help"],
      expected: true,
    },
    {
      name: "root help command with target",
      argv: ["node", "natesclaw", "help", "matrix"],
      expected: true,
    },
    {
      name: "nested help command",
      argv: ["node", "natesclaw", "matrix", "encryption", "help"],
      expected: true,
    },
    {
      name: "known subcommand root help command",
      argv: ["node", "natesclaw", "config", "help"],
      expected: true,
    },
    {
      name: "known leaf command positional help",
      argv: ["node", "natesclaw", "docs", "help"],
      expected: false,
    },
    {
      name: "known subcommand leaf positional help",
      argv: ["node", "natesclaw", "config", "set", "some.path", "help"],
      expected: false,
    },
    {
      name: "unknown plugin command help",
      argv: ["node", "natesclaw", "external-plugin", "tools", "help"],
      expected: true,
    },
    {
      name: "help flag",
      argv: ["node", "natesclaw", "matrix", "encryption", "--help"],
      expected: true,
    },
    {
      name: "help as option value",
      argv: ["node", "natesclaw", "agent", "--message", "help"],
      expected: false,
    },
    {
      name: "help after terminator",
      argv: ["node", "natesclaw", "nodes", "invoke", "--", "help"],
      expected: false,
    },
    {
      name: "help flag after terminator",
      argv: ["node", "natesclaw", "nodes", "invoke", "--", "--help"],
      expected: false,
    },
    {
      name: "version flag after terminator",
      argv: ["node", "natesclaw", "nodes", "invoke", "--", "--version"],
      expected: false,
    },
    {
      name: "root version flag",
      argv: ["node", "natesclaw", "--version"],
      expected: true,
    },
    {
      name: "root short version flag",
      argv: ["node", "natesclaw", "-V"],
      expected: true,
    },
    {
      name: "root version alias after profile",
      argv: ["node", "natesclaw", "--profile", "work", "-v"],
      expected: true,
    },
    {
      name: "root version flag after profile",
      argv: ["node", "natesclaw", "--profile", "work", "--version"],
      expected: true,
    },
    {
      name: "version-pinned skill install",
      argv: ["node", "natesclaw", "skills", "install", "@owner/weather", "--version", "1.2.3"],
      expected: false,
    },
    {
      name: "version-pinned skill verification",
      argv: ["node", "natesclaw", "skills", "verify", "@owner/weather", "--version", "1.2.3"],
      expected: false,
    },
    {
      name: "equals-form version-pinned skill install",
      argv: ["node", "natesclaw", "skills", "install", "@owner/weather", "--version=1.2.3"],
      expected: false,
    },
    {
      name: "profiled version-pinned skill verification",
      argv: [
        "node",
        "natesclaw",
        "--profile",
        "work",
        "skills",
        "verify",
        "@owner/weather",
        "--version",
        "1.2.3",
      ],
      expected: false,
    },
    {
      name: "help for a version-pinned skill command",
      argv: [
        "node",
        "natesclaw",
        "skills",
        "verify",
        "@owner/weather",
        "--version",
        "1.2.3",
        "--help",
      ],
      expected: true,
    },
    {
      name: "unknown root option does not turn version into root help",
      argv: ["node", "natesclaw", "--unknown", "--version"],
      expected: false,
    },
  ])("detects help/version invocations: $name", ({ argv, expected }) => {
    expect(isHelpOrVersionInvocation(argv)).toBe(expected);
  });

  it.each([
    {
      name: "root --version",
      argv: ["node", "natesclaw", "--version"],
      expected: true,
    },
    {
      name: "root -V",
      argv: ["node", "natesclaw", "-V"],
      expected: true,
    },
    {
      name: "root -v alias with profile",
      argv: ["node", "natesclaw", "--profile", "work", "-v"],
      expected: true,
    },
    {
      name: "subcommand version flag",
      argv: ["node", "natesclaw", "status", "--version"],
      expected: false,
    },
    {
      name: "unknown root flag with version",
      argv: ["node", "natesclaw", "--unknown", "--version"],
      expected: false,
    },
  ])("detects root-only version invocations: $name", ({ argv, expected }) => {
    expect(isRootVersionInvocation(argv)).toBe(expected);
  });

  it.each([
    {
      name: "root --help",
      argv: ["node", "natesclaw", "--help"],
      expected: true,
    },
    {
      name: "root -h",
      argv: ["node", "natesclaw", "-h"],
      expected: true,
    },
    {
      name: "root --help with profile",
      argv: ["node", "natesclaw", "--profile", "work", "--help"],
      expected: true,
    },
    {
      name: "subcommand --help",
      argv: ["node", "natesclaw", "status", "--help"],
      expected: false,
    },
    {
      name: "help before subcommand token",
      argv: ["node", "natesclaw", "--help", "status"],
      expected: false,
    },
    {
      name: "help after -- terminator",
      argv: ["node", "natesclaw", "nodes", "invoke", "--", "device.status", "--help"],
      expected: false,
    },
    {
      name: "unknown root flag before help",
      argv: ["node", "natesclaw", "--unknown", "--help"],
      expected: false,
    },
    {
      name: "unknown root flag after help",
      argv: ["node", "natesclaw", "--help", "--unknown"],
      expected: false,
    },
  ])("detects root-only help invocations: $name", ({ argv, expected }) => {
    expect(isRootHelpInvocation(argv)).toBe(expected);
  });

  it.each([
    {
      name: "single command with trailing flag",
      argv: ["node", "natesclaw", "status", "--json"],
      expected: ["status"],
    },
    {
      name: "two-part command",
      argv: ["node", "natesclaw", "agents", "list"],
      expected: ["agents", "list"],
    },
    {
      name: "terminator cuts parsing",
      argv: ["node", "natesclaw", "status", "--", "ignored"],
      expected: ["status"],
    },
  ])("extracts command path: $name", ({ argv, expected }) => {
    expect(getCommandPathWithRootOptions(argv, 2)).toEqual(expected);
  });

  it("extracts command path while skipping known root option values", () => {
    expect(
      getCommandPathWithRootOptions(
        [
          "node",
          "natesclaw",
          "--profile",
          "work",
          "--container",
          "demo",
          "--no-color",
          "config",
          "validate",
        ],
        2,
      ),
    ).toEqual(["config", "validate"]);
  });

  it("limits simple help fast paths to root options, a command, and help", () => {
    const commands = new Set(["setup"]);
    expect(
      isSimpleCommandHelpInvocation(
        ["node", "natesclaw", "--profile", "work", "setup", "--help"],
        commands,
      ),
    ).toBe(true);
    expect(
      isSimpleCommandHelpInvocation(
        ["node", "natesclaw", "setup", "--workspace", "--help"],
        commands,
      ),
    ).toBe(false);
    expect(
      isSimpleCommandHelpInvocation(
        ["node", "natesclaw", "setup", "--profile", "work", "--help"],
        commands,
      ),
    ).toBe(false);
    expect(isSimpleCommandHelpInvocation(["node", "natesclaw", "--help", "setup"], commands)).toBe(
      false,
    );
  });

  it("extracts routed config get positionals with interleaved root options", () => {
    expect(
      getCommandPositionalsWithRootOptions(
        ["node", "natesclaw", "config", "get", "--log-level", "debug", "update.channel", "--json"],
        {
          commandPath: ["config", "get"],
          booleanFlags: ["--json"],
        },
      ),
    ).toEqual(["update.channel"]);
  });

  it("extracts routed config unset positionals with interleaved root options", () => {
    expect(
      getCommandPositionalsWithRootOptions(
        ["node", "natesclaw", "config", "unset", "--profile", "work", "update.channel"],
        {
          commandPath: ["config", "unset"],
        },
      ),
    ).toEqual(["update.channel"]);
  });

  it("returns null when routed command sees unknown options", () => {
    expect(
      getCommandPositionalsWithRootOptions(
        ["node", "natesclaw", "config", "get", "--mystery", "value", "update.channel"],
        {
          commandPath: ["config", "get"],
          booleanFlags: ["--json"],
        },
      ),
    ).toBeNull();
  });

  it.each([
    {
      name: "returns first command token",
      argv: ["node", "natesclaw", "agents", "list"],
      expected: "agents",
    },
    {
      name: "returns null when no command exists",
      argv: ["node", "natesclaw"],
      expected: null,
    },
    {
      name: "skips known root option values",
      argv: ["node", "natesclaw", "--log-level", "debug", "status"],
      expected: "status",
    },
  ])("returns primary command: $name", ({ argv, expected }) => {
    expect(getPrimaryCommand(argv)).toBe(expected);
  });

  it.each([
    {
      name: "detects flag before terminator",
      argv: ["node", "natesclaw", "status", "--json"],
      flag: "--json",
      expected: true,
    },
    {
      name: "ignores flag after terminator",
      argv: ["node", "natesclaw", "--", "--json"],
      flag: "--json",
      expected: false,
    },
  ])("parses boolean flags: $name", ({ argv, flag, expected }) => {
    expect(hasFlag(argv, flag)).toBe(expected);
  });

  it.each([
    {
      name: "value in next token",
      argv: ["node", "natesclaw", "status", "--timeout", "5000"],
      expected: "5000",
    },
    {
      name: "value in equals form",
      argv: ["node", "natesclaw", "status", "--timeout=2500"],
      expected: "2500",
    },
    {
      name: "missing value",
      argv: ["node", "natesclaw", "status", "--timeout"],
      expected: null,
    },
    {
      name: "next token is another flag",
      argv: ["node", "natesclaw", "status", "--timeout", "--json"],
      expected: null,
    },
    {
      name: "flag appears after terminator",
      argv: ["node", "natesclaw", "--", "--timeout=99"],
      expected: undefined,
    },
    {
      name: "repeated flag uses final value",
      argv: ["node", "natesclaw", "status", "--timeout", "100", "--timeout=200"],
      expected: "200",
    },
    {
      name: "missing repeated value remains invalid",
      argv: ["node", "natesclaw", "status", "--timeout", "--timeout", "200"],
      expected: null,
    },
  ])("extracts flag values: $name", ({ argv, expected }) => {
    expect(getFlagValue(argv, "--timeout")).toBe(expected);
  });

  it("parses verbose flags", () => {
    expect(getVerboseFlag(["node", "natesclaw", "status", "--verbose"])).toBe(true);
    expect(getVerboseFlag(["node", "natesclaw", "status", "--debug"])).toBe(false);
    expect(getVerboseFlag(["node", "natesclaw", "status", "--debug"], { includeDebug: true })).toBe(
      true,
    );
  });

  it.each([
    {
      name: "missing flag",
      argv: ["node", "natesclaw", "status"],
      expected: undefined,
    },
    {
      name: "missing value",
      argv: ["node", "natesclaw", "status", "--timeout"],
      expected: null,
    },
    {
      name: "valid positive integer",
      argv: ["node", "natesclaw", "status", "--timeout", "5000"],
      expected: 5000,
    },
    {
      name: "valid signed decimal positive integer",
      argv: ["node", "natesclaw", "status", "--timeout", "+5000"],
      expected: 5000,
    },
    {
      name: "invalid integer",
      argv: ["node", "natesclaw", "status", "--timeout", "nope"],
      expected: null,
    },
    {
      name: "non-decimal integer",
      argv: ["node", "natesclaw", "status", "--timeout", "0x10"],
      expected: null,
    },
    {
      name: "partial integer",
      argv: ["node", "natesclaw", "status", "--timeout", "5s"],
      expected: null,
    },
    {
      name: "zero",
      argv: ["node", "natesclaw", "status", "--timeout", "0"],
      expected: null,
    },
    {
      name: "negative integer",
      argv: ["node", "natesclaw", "status", "--timeout", "-5"],
      expected: null,
    },
    {
      name: "repeated value uses final valid integer",
      argv: ["node", "natesclaw", "status", "--timeout", "nope", "--timeout", "5000"],
      expected: 5000,
    },
    {
      name: "repeated value rejects final invalid integer",
      argv: ["node", "natesclaw", "status", "--timeout", "5000", "--timeout", "nope"],
      expected: null,
    },
  ])("parses positive integer flag values: $name", ({ argv, expected }) => {
    expect(getPositiveIntFlagValue(argv, "--timeout")).toBe(expected);
  });

  it.each([
    {
      name: "keeps plain node argv",
      rawArgs: ["node", "natesclaw", "status"],
      expected: ["node", "natesclaw", "status"],
    },
    {
      name: "keeps version-suffixed node binary",
      rawArgs: ["node-22", "natesclaw", "status"],
      expected: ["node-22", "natesclaw", "status"],
    },
    {
      name: "keeps windows versioned node exe",
      rawArgs: ["node-22.2.0.exe", "natesclaw", "status"],
      expected: ["node-22.2.0.exe", "natesclaw", "status"],
    },
    {
      name: "keeps dotted node binary",
      rawArgs: ["node-22.2", "natesclaw", "status"],
      expected: ["node-22.2", "natesclaw", "status"],
    },
    {
      name: "keeps dotted node exe",
      rawArgs: ["node-22.2.exe", "natesclaw", "status"],
      expected: ["node-22.2.exe", "natesclaw", "status"],
    },
    {
      name: "keeps absolute versioned node path",
      rawArgs: ["/usr/bin/node-22.2.0", "natesclaw", "status"],
      expected: ["/usr/bin/node-22.2.0", "natesclaw", "status"],
    },
    {
      name: "keeps node24 shorthand",
      rawArgs: ["node24", "natesclaw", "status"],
      expected: ["node24", "natesclaw", "status"],
    },
    {
      name: "keeps absolute node24 shorthand",
      rawArgs: ["/usr/bin/node24", "natesclaw", "status"],
      expected: ["/usr/bin/node24", "natesclaw", "status"],
    },
    {
      name: "keeps windows node24 exe",
      rawArgs: ["node24.exe", "natesclaw", "status"],
      expected: ["node24.exe", "natesclaw", "status"],
    },
    {
      name: "keeps nodejs binary",
      rawArgs: ["nodejs", "natesclaw", "status"],
      expected: ["nodejs", "natesclaw", "status"],
    },
    {
      name: "prefixes fallback when first arg is not a node launcher",
      rawArgs: ["node-dev", "natesclaw", "status"],
      expected: ["node", "natesclaw", "node-dev", "natesclaw", "status"],
    },
    {
      name: "prefixes fallback when raw args start at program name",
      rawArgs: ["natesclaw", "status"],
      expected: ["node", "natesclaw", "status"],
    },
    {
      name: "keeps bun execution argv",
      rawArgs: ["bun", "src/entry.ts", "status"],
      expected: ["bun", "src/entry.ts", "status"],
    },
  ] as const)("builds parse argv from raw args: $name", ({ rawArgs, expected }) => {
    const parsed = buildParseArgv([...rawArgs]);
    expect(parsed).toEqual([...expected]);
  });
});
