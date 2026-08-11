/** CLI integration coverage for plugin commands, setup, status, and registry flows. */
import { Command } from "commander";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { NatesclawConfig } from "../config/config.js";

const mocks = vi.hoisted(() => ({
  memoryRegister: vi.fn(),
  otherRegister: vi.fn(),
  memoryListAction: vi.fn(),
  loadNatesclawPluginCliRegistry: vi.fn(),
  loadNatesclawPlugins: vi.fn(),
  resolveManifestActivationPluginIds: vi.fn(),
  applyPluginAutoEnable: vi.fn(),
  resolvePluginMetadataSnapshot: vi.fn(),
  loadConfig: vi.fn(),
  getRuntimeConfigSnapshot: vi.fn(),
  readConfigFileSnapshot: vi.fn(),
}));

vi.mock("./loader.js", () => ({
  loadNatesclawPluginCliRegistry: (...args: unknown[]) =>
    mocks.loadNatesclawPluginCliRegistry(...args),
  loadNatesclawPlugins: (...args: unknown[]) => mocks.loadNatesclawPlugins(...args),
  loadPluginRegistryHandle: (options: Record<string, unknown> = {}) =>
    mocks.loadNatesclawPlugins({ ...options, activate: false }),
}));

vi.mock("./activation-planner.js", () => ({
  resolveManifestActivationPluginIds: (...args: unknown[]) =>
    mocks.resolveManifestActivationPluginIds(...args),
}));

vi.mock("../config/plugin-auto-enable.js", () => ({
  applyPluginAutoEnable: (...args: unknown[]) => mocks.applyPluginAutoEnable(...args),
}));

vi.mock("./plugin-metadata-snapshot.js", () => ({
  resolvePluginMetadataSnapshot: (...args: unknown[]) =>
    mocks.resolvePluginMetadataSnapshot(...args),
}));

vi.mock("../config/config.js", () => ({
  getRuntimeConfig: (...args: unknown[]) => mocks.loadConfig(...args),
  getRuntimeConfigSnapshot: (...args: unknown[]) => mocks.getRuntimeConfigSnapshot(...args),
  loadConfig: (...args: unknown[]) => mocks.loadConfig(...args),
  readConfigFileSnapshot: (...args: unknown[]) => mocks.readConfigFileSnapshot(...args),
}));

let getPluginCliCommandDescriptors: typeof import("./cli.js").getPluginCliCommandDescriptors;
let loadValidatedConfigForPluginRegistration: typeof import("./cli.js").loadValidatedConfigForPluginRegistration;
let registerPluginCliCommands: typeof import("./cli.js").registerPluginCliCommands;
let registerPluginCliCommandsFromValidatedConfig: typeof import("./cli.js").registerPluginCliCommandsFromValidatedConfig;

function createProgram(existingCommandName?: string) {
  const program = new Command();
  if (existingCommandName) {
    program.command(existingCommandName);
  }
  return program;
}

function createCliRegistry(params?: {
  memoryCommands?: string[];
  memoryDescriptors?: Array<{
    name: string;
    description: string;
    hasSubcommands: boolean;
  }>;
  memoryParentPath?: string[];
}) {
  return {
    cliRegistrars: [
      {
        pluginId: "memory-core",
        register: mocks.memoryRegister,
        parentPath: params?.memoryParentPath ?? [],
        commands: params?.memoryCommands ?? ["memory"],
        descriptors: params?.memoryDescriptors ?? [
          {
            name: "memory",
            description: "Memory commands",
            hasSubcommands: true,
          },
        ],
        source: "bundled",
      },
      {
        pluginId: "other",
        register: mocks.otherRegister,
        parentPath: [],
        commands: ["other"],
        descriptors: [],
        source: "bundled",
      },
    ],
  };
}

function createAutoEnabledCliFixture() {
  const rawConfig = {
    plugins: {},
    channels: { demo: { enabled: true } },
  } as NatesclawConfig;
  const autoEnabledConfig = {
    ...rawConfig,
    plugins: {
      entries: {
        demo: { enabled: true },
      },
    },
  } as NatesclawConfig;
  return { rawConfig, autoEnabledConfig };
}

function getMockCallObject(mock: ReturnType<typeof vi.fn>, callIndex = 0, argIndex = 0) {
  const value = mock.mock.calls[callIndex]?.[argIndex];
  if (!value || typeof value !== "object") {
    throw new Error(`expected mock call ${callIndex} arg ${argIndex} object`);
  }
  return value as Record<string, unknown>;
}

function expectAutoEnabledCliLoad(params: {
  rawConfig: NatesclawConfig;
  autoEnabledConfig: NatesclawConfig;
  autoEnabledReasons?: Record<string, string[]>;
}) {
  expect(mocks.applyPluginAutoEnable).toHaveBeenCalledWith(
    expect.objectContaining({
      config: params.rawConfig,
      env: process.env,
    }),
  );
  const loadOptions = getMockCallObject(mocks.loadNatesclawPlugins);
  expect(loadOptions.config).toBe(params.autoEnabledConfig);
  expect(loadOptions.activationSourceConfig).toBe(params.rawConfig);
  expect(loadOptions.autoEnabledReasons).toEqual(params.autoEnabledReasons ?? {});
}

describe("registerPluginCliCommands", () => {
  beforeAll(async () => {
    ({
      getPluginCliCommandDescriptors,
      loadValidatedConfigForPluginRegistration,
      registerPluginCliCommands,
      registerPluginCliCommandsFromValidatedConfig,
    } = await import("./cli.js"));
  });

  beforeEach(() => {
    mocks.memoryRegister.mockReset();
    mocks.memoryRegister.mockImplementation(({ program }: { program: Command }) => {
      const memory = program.command("memory").description("Memory commands");
      memory.command("list").action(mocks.memoryListAction);
    });
    mocks.otherRegister.mockReset();
    mocks.otherRegister.mockImplementation(({ program }: { program: Command }) => {
      program.command("other").description("Other commands");
    });
    mocks.memoryListAction.mockReset();
    mocks.loadNatesclawPluginCliRegistry.mockReset();
    mocks.loadNatesclawPluginCliRegistry.mockResolvedValue(createCliRegistry());
    mocks.loadNatesclawPlugins.mockReset();
    mocks.loadNatesclawPlugins.mockReturnValue({
      ...createCliRegistry(),
      diagnostics: [],
    });
    mocks.resolveManifestActivationPluginIds.mockReset();
    mocks.resolveManifestActivationPluginIds.mockReturnValue([]);
    mocks.applyPluginAutoEnable.mockReset();
    mocks.resolvePluginMetadataSnapshot.mockReset();
    mocks.resolvePluginMetadataSnapshot.mockReturnValue(undefined);
    mocks.applyPluginAutoEnable.mockImplementation(({ config }) => ({
      config,
      changes: [],
      autoEnabledReasons: {},
    }));
    mocks.loadConfig.mockReset();
    mocks.loadConfig.mockReturnValue({} as NatesclawConfig);
    mocks.getRuntimeConfigSnapshot.mockReset();
    mocks.getRuntimeConfigSnapshot.mockReturnValue(null);
    mocks.readConfigFileSnapshot.mockReset();
    mocks.readConfigFileSnapshot.mockResolvedValue({
      valid: true,
      config: {},
      runtimeConfig: {},
    });
  });

  it("skips plugin CLI registrars when commands already exist", async () => {
    const program = createProgram("memory");

    await registerPluginCliCommands(program, {} as NatesclawConfig);

    expect(mocks.memoryRegister).not.toHaveBeenCalled();
    expect(mocks.otherRegister).toHaveBeenCalledTimes(1);
  });

  it("skips plugin CLI registrars when an existing command alias matches", async () => {
    const program = createProgram();
    // Alias-only root names (e.g. cron|automations) are owned commands too.
    program.command("mem-core").alias("memory");

    await registerPluginCliCommands(program, {} as NatesclawConfig);

    expect(mocks.memoryRegister).not.toHaveBeenCalled();
    expect(mocks.otherRegister).toHaveBeenCalledTimes(1);
  });

  it("forwards an explicit env to plugin loading", async () => {
    const env = { NATESCLAW_HOME: "/srv/natesclaw-home" } as NodeJS.ProcessEnv;

    await registerPluginCliCommands(createProgram(), {} as NatesclawConfig, env);

    const loadOptions = getMockCallObject(mocks.loadNatesclawPlugins);
    expect(loadOptions.env).toBe(env);
  });

  it("injects gateway-backed node runtime into plugin CLI commands", async () => {
    await registerPluginCliCommands(createProgram(), {} as NatesclawConfig);

    const loadOptions = getMockCallObject(mocks.loadNatesclawPlugins) as {
      runtimeOptions?: { nodes?: { list?: unknown; invoke?: unknown } };
    };
    expect(typeof loadOptions.runtimeOptions?.nodes?.list).toBe("function");
    expect(typeof loadOptions.runtimeOptions?.nodes?.invoke).toBe("function");
  });

  it("reuses loaded plugin CLI entries on repeat calls for the same program", async () => {
    const program = createProgram();

    await registerPluginCliCommands(program, {} as NatesclawConfig);
    await registerPluginCliCommands(program, {} as NatesclawConfig);

    expect(mocks.loadNatesclawPlugins).toHaveBeenCalledTimes(1);
  });

  it("reloads plugin CLI entries when the requested primary command changes", async () => {
    const program = createProgram();

    await registerPluginCliCommands(program, {} as NatesclawConfig, undefined, undefined, {
      primary: "memory",
    });
    await registerPluginCliCommands(program, {} as NatesclawConfig);

    expect(mocks.loadNatesclawPlugins).toHaveBeenCalledTimes(2);
  });

  it("reloads plugin CLI entries when config or environment identity changes", async () => {
    const program = createProgram();
    const configA = {} as NatesclawConfig;
    const configB = { plugins: {} } as NatesclawConfig;
    const envA = { NATESCLAW_HOME: "/tmp/a" } as NodeJS.ProcessEnv;
    const envB = { NATESCLAW_HOME: "/tmp/b" } as NodeJS.ProcessEnv;

    await registerPluginCliCommands(program, configA, envA);
    await registerPluginCliCommands(program, configA, envB);
    await registerPluginCliCommands(program, configB, envB);

    expect(mocks.loadNatesclawPlugins).toHaveBeenCalledTimes(3);
  });

  it("loads plugin CLI commands from the auto-enabled config snapshot", async () => {
    const { rawConfig, autoEnabledConfig } = createAutoEnabledCliFixture();
    mocks.applyPluginAutoEnable.mockReturnValue({
      config: autoEnabledConfig,
      changes: [],
      autoEnabledReasons: {
        demo: ["demo configured"],
      },
    });

    await registerPluginCliCommands(createProgram(), rawConfig);

    expectAutoEnabledCliLoad({
      rawConfig,
      autoEnabledConfig,
      autoEnabledReasons: {
        demo: ["demo configured"],
      },
    });
    const registerOptions = getMockCallObject(mocks.memoryRegister);
    expect(registerOptions.config).toBe(autoEnabledConfig);
  });

  it("loads root-help descriptors through the dedicated non-activating CLI collector", async () => {
    const { rawConfig, autoEnabledConfig } = createAutoEnabledCliFixture();
    mocks.applyPluginAutoEnable.mockReturnValue({
      config: autoEnabledConfig,
      changes: [],
      autoEnabledReasons: {
        demo: ["demo configured"],
      },
    });
    mocks.loadNatesclawPluginCliRegistry.mockResolvedValue({
      cliRegistrars: [
        {
          pluginId: "matrix",
          register: vi.fn(),
          commands: ["matrix"],
          descriptors: [
            {
              name: "matrix",
              description: "Matrix channel utilities",
              hasSubcommands: true,
            },
          ],
          source: "bundled",
        },
        {
          pluginId: "duplicate-matrix",
          register: vi.fn(),
          commands: ["matrix"],
          descriptors: [
            {
              name: "matrix",
              description: "Duplicate Matrix channel utilities",
              hasSubcommands: true,
            },
          ],
          source: "bundled",
        },
      ],
    });

    await expect(getPluginCliCommandDescriptors(rawConfig)).resolves.toEqual([
      {
        name: "matrix",
        description: "Matrix channel utilities",
        hasSubcommands: true,
      },
    ]);
    const registryOptions = getMockCallObject(mocks.loadNatesclawPluginCliRegistry);
    expect(registryOptions.config).toBe(autoEnabledConfig);
    expect(registryOptions.activationSourceConfig).toBe(rawConfig);
    expect(registryOptions.autoEnabledReasons).toEqual({
      demo: ["demo configured"],
    });
  });

  it("keeps root-help descriptor load failures quiet", async () => {
    const stderrWrite = vi
      .spyOn(process.stderr, "write")
      .mockImplementation((() => true) as unknown as typeof process.stderr.write);
    mocks.loadNatesclawPluginCliRegistry.mockImplementationOnce((options: { logger?: unknown }) => {
      const logger = options.logger as { error?: (message: string) => void };
      logger.error?.("[plugins] stale failed to load from /tmp/stale: boom");
      throw new Error("boom");
    });

    await expect(
      getPluginCliCommandDescriptors({ plugins: { entries: { stale: {} } } } as NatesclawConfig),
    ).resolves.toEqual([]);

    expect(stderrWrite).not.toHaveBeenCalled();
  });

  it("keeps runtime CLI command registration on the full plugin loader for legacy channel plugins", async () => {
    const { rawConfig, autoEnabledConfig } = createAutoEnabledCliFixture();
    mocks.applyPluginAutoEnable.mockReturnValue({
      config: autoEnabledConfig,
      changes: [],
      autoEnabledReasons: {
        demo: ["demo configured"],
      },
    });
    mocks.loadNatesclawPlugins.mockReturnValue(
      createCliRegistry({
        memoryCommands: ["legacy-channel"],
        memoryDescriptors: [
          {
            name: "legacy-channel",
            description: "Legacy channel commands",
            hasSubcommands: true,
          },
        ],
      }),
    );

    await registerPluginCliCommands(createProgram(), rawConfig, undefined, undefined, {
      mode: "lazy",
    });

    const loadOptions = getMockCallObject(mocks.loadNatesclawPlugins);
    expect(loadOptions.config).toBe(autoEnabledConfig);
    expect(loadOptions.activationSourceConfig).toBe(rawConfig);
    expect(loadOptions.autoEnabledReasons).toEqual({
      demo: ["demo configured"],
    });
    expect(loadOptions.cache).toBe(false);
    expect(loadOptions.channelPluginLoadIntent).toBe("full");
    expect(mocks.loadNatesclawPluginCliRegistry).not.toHaveBeenCalled();
  });

  it("lazy-registers descriptor-backed plugin commands on first invocation", async () => {
    const program = createProgram();
    program.exitOverride();

    await registerPluginCliCommands(program, {} as NatesclawConfig, undefined, undefined, {
      mode: "lazy",
    });

    expect(program.commands.map((command) => command.name())).toEqual(["memory", "other"]);
    expect(mocks.memoryRegister).not.toHaveBeenCalled();
    expect(mocks.otherRegister).toHaveBeenCalledTimes(1);

    await program.parseAsync(["memory", "list"], { from: "user" });

    expect(mocks.memoryRegister).toHaveBeenCalledTimes(1);
    expect(mocks.memoryListAction).toHaveBeenCalledTimes(1);
  });

  it("falls back to eager registration when descriptors do not cover every command root", async () => {
    mocks.loadNatesclawPlugins.mockReturnValue(
      createCliRegistry({
        memoryCommands: ["memory", "memory-admin"],
        memoryDescriptors: [
          {
            name: "memory",
            description: "Memory commands",
            hasSubcommands: true,
          },
        ],
      }),
    );
    mocks.memoryRegister.mockImplementation(({ program }: { program: Command }) => {
      program.command("memory");
      program.command("memory-admin");
    });

    await registerPluginCliCommands(createProgram(), {} as NatesclawConfig, undefined, undefined, {
      mode: "lazy",
    });

    expect(mocks.memoryRegister).toHaveBeenCalledTimes(1);
  });

  it("registers a selected plugin primary eagerly during lazy startup", async () => {
    const program = createProgram();
    program.exitOverride();
    mocks.resolveManifestActivationPluginIds.mockReturnValue(["memory-core"]);

    await registerPluginCliCommands(program, {} as NatesclawConfig, undefined, undefined, {
      mode: "lazy",
      primary: "memory",
    });

    expect(
      program.commands.reduce((count, command) => count + (command.name() === "memory" ? 1 : 0), 0),
    ).toBe(1);
    const loadOptions = getMockCallObject(mocks.loadNatesclawPlugins);
    expect(loadOptions.onlyPluginIds).toEqual(["memory-core"]);

    await program.parseAsync(["memory", "list"], { from: "user" });

    expect(mocks.memoryRegister).toHaveBeenCalledTimes(1);
    expect(mocks.memoryListAction).toHaveBeenCalledTimes(1);
  });

  it("registers nested plugin commands against their parent command", async () => {
    const program = createProgram("nodes");
    program.exitOverride();
    mocks.resolveManifestActivationPluginIds.mockReturnValue(["memory-core"]);
    mocks.loadNatesclawPlugins.mockReturnValue(
      createCliRegistry({
        memoryParentPath: ["nodes"],
        memoryCommands: ["canvas"],
        memoryDescriptors: [
          {
            name: "canvas",
            description: "Canvas commands",
            hasSubcommands: true,
          },
        ],
      }),
    );
    mocks.memoryRegister.mockImplementation(({ program: programLocal }: { program: Command }) => {
      const canvas = programLocal.command("canvas").description("Canvas commands");
      canvas.command("snapshot").action(mocks.memoryListAction);
    });

    await registerPluginCliCommands(program, {} as NatesclawConfig, undefined, undefined, {
      mode: "lazy",
      primary: "nodes",
    });

    const nodes = program.commands.find((command) => command.name() === "nodes");
    expect(nodes?.commands.map((command) => command.name())).toEqual(["canvas"]);

    await program.parseAsync(["nodes", "canvas", "snapshot"], { from: "user" });

    expect(mocks.memoryRegister).toHaveBeenCalledTimes(1);
    expect(getMockCallObject(mocks.memoryRegister).program).toBe(nodes);
    expect(mocks.memoryListAction).toHaveBeenCalledTimes(1);
  });

  it("scopes full CLI loading through CLI metadata when manifest planning finds no plugin match", async () => {
    const program = createProgram();
    program.exitOverride();

    await registerPluginCliCommands(program, {} as NatesclawConfig, undefined, undefined, {
      mode: "lazy",
      primary: "memory",
    });

    expect(mocks.loadNatesclawPluginCliRegistry).toHaveBeenCalled();
    const loadOptions = getMockCallObject(mocks.loadNatesclawPlugins);
    expect(loadOptions.onlyPluginIds).toEqual(["memory-core"]);
  });

  it("scopes nested CLI loading through CLI metadata parent paths", async () => {
    const nestedRegistry = createCliRegistry({
      memoryParentPath: ["nodes"],
      memoryCommands: ["canvas"],
      memoryDescriptors: [
        {
          name: "canvas",
          description: "Canvas commands",
          hasSubcommands: true,
        },
      ],
    });
    mocks.loadNatesclawPluginCliRegistry.mockResolvedValue(nestedRegistry);
    mocks.loadNatesclawPlugins.mockReturnValue(nestedRegistry);
    const program = createProgram("nodes");
    program.exitOverride();

    await registerPluginCliCommands(program, {} as NatesclawConfig, undefined, undefined, {
      mode: "lazy",
      primary: "nodes",
    });

    const loadOptions = getMockCallObject(mocks.loadNatesclawPlugins);
    expect(loadOptions.onlyPluginIds).toEqual(["memory-core"]);
  });

  it("skips full plugin runtime loading when no metadata owns the requested primary", async () => {
    const program = createProgram();
    program.exitOverride();

    await registerPluginCliCommands(program, {} as NatesclawConfig, undefined, undefined, {
      mode: "lazy",
      primary: "missing-command",
    });

    expect(mocks.loadNatesclawPluginCliRegistry).toHaveBeenCalled();
    expect(mocks.loadNatesclawPlugins).not.toHaveBeenCalled();
    expect(program.commands.map((command) => command.name())).not.toContain("missing-command");
  });

  it("reuses the validated cold snapshot runtime config without a second config read", async () => {
    const snapshotConfig = { plugins: { enabled: true } } as NatesclawConfig;
    mocks.readConfigFileSnapshot.mockResolvedValueOnce({
      valid: true,
      config: {},
      runtimeConfig: snapshotConfig,
    });

    await expect(loadValidatedConfigForPluginRegistration()).resolves.toBe(snapshotConfig);
    expect(mocks.getRuntimeConfigSnapshot).toHaveBeenCalledTimes(1);
    expect(mocks.loadConfig).not.toHaveBeenCalled();
  });

  it("skips unrelated plugin validation for cold plugin-owned CLI commands", async () => {
    const snapshotConfig = { plugins: { enabled: true } } as NatesclawConfig;
    mocks.readConfigFileSnapshot.mockResolvedValueOnce({
      valid: true,
      config: {},
      runtimeConfig: snapshotConfig,
    });

    await expect(
      loadValidatedConfigForPluginRegistration({ skipPluginValidation: true }),
    ).resolves.toBe(snapshotConfig);
    expect(mocks.readConfigFileSnapshot).toHaveBeenCalledWith({ skipPluginValidation: true });
  });

  it("preserves an already-active runtime config snapshot", async () => {
    const snapshotConfig = { plugins: { enabled: true } } as NatesclawConfig;
    const activeConfig = { plugins: { enabled: false } } as NatesclawConfig;
    mocks.readConfigFileSnapshot.mockResolvedValueOnce({
      valid: true,
      config: {},
      runtimeConfig: snapshotConfig,
    });
    mocks.getRuntimeConfigSnapshot.mockReturnValueOnce(activeConfig);

    await expect(loadValidatedConfigForPluginRegistration()).resolves.toBe(activeConfig);
    expect(mocks.loadConfig).not.toHaveBeenCalled();
  });

  it("short-circuits validated plugin CLI config when the snapshot is invalid", async () => {
    mocks.readConfigFileSnapshot.mockResolvedValueOnce({
      valid: false,
      config: { plugins: { load: { paths: ["/tmp/evil"] } } },
    });

    await expect(loadValidatedConfigForPluginRegistration()).resolves.toBeNull();
    expect(mocks.getRuntimeConfigSnapshot).not.toHaveBeenCalled();
    expect(mocks.loadConfig).not.toHaveBeenCalled();
  });

  it("skips plugin CLI registration from validated config when the snapshot is invalid", async () => {
    mocks.readConfigFileSnapshot.mockResolvedValueOnce({
      valid: false,
      config: {},
    });

    await expect(registerPluginCliCommandsFromValidatedConfig(createProgram())).resolves.toBeNull();
    expect(mocks.getRuntimeConfigSnapshot).not.toHaveBeenCalled();
    expect(mocks.loadNatesclawPlugins).not.toHaveBeenCalled();
  });
});
