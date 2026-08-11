// Covers provider install catalog entries from plugin metadata.
import { beforeEach, describe, expect, it, vi } from "vitest";

type LoadNatesclawProviderIndex =
  typeof import("../model-catalog/index.js").loadNatesclawProviderIndex;
type LoadPluginRegistrySnapshot = typeof import("./plugin-registry.js").loadPluginRegistrySnapshot;
type ResolveManifestProviderAuthChoices =
  typeof import("./provider-auth-choices.js").resolveManifestProviderAuthChoices;
type ListOfficialExternalProviderCatalogEntries =
  typeof import("./official-external-plugin-catalog.js").listOfficialExternalProviderCatalogEntries;
type PluginInstallSourceInfo = import("./install-source-info.js").PluginInstallSourceInfo;
type InstalledPluginInstallRecordInfo =
  import("./installed-plugin-index.js").InstalledPluginInstallRecordInfo;
type InstalledPluginIndexRecord = import("./installed-plugin-index.js").InstalledPluginIndexRecord;

const loadNatesclawProviderIndex = vi.hoisted(() =>
  vi.fn<LoadNatesclawProviderIndex>(() => ({ version: 1, providers: {} })),
);
vi.mock("../model-catalog/index.js", async () => {
  const actual = await vi.importActual<typeof import("../model-catalog/index.js")>(
    "../model-catalog/index.js",
  );
  return {
    ...actual,
    loadNatesclawProviderIndex,
  };
});

const loadPluginRegistrySnapshot = vi.hoisted(() =>
  vi.fn<LoadPluginRegistrySnapshot>(() => ({
    version: 1,
    hostContractVersion: "test",
    compatRegistryVersion: "test",
    migrationVersion: 1,
    policyHash: "test",
    generatedAtMs: 0,
    installRecords: {},
    plugins: [],
    diagnostics: [],
  })),
);
vi.mock("./plugin-registry.js", () => ({
  loadPluginRegistrySnapshot,
}));

const resolveManifestProviderAuthChoices = vi.hoisted(() =>
  vi.fn<ResolveManifestProviderAuthChoices>(() => []),
);
vi.mock("./provider-auth-choices.js", () => ({
  resolveManifestProviderAuthChoices,
}));

const listOfficialExternalProviderCatalogEntries = vi.hoisted(() =>
  vi.fn<ListOfficialExternalProviderCatalogEntries>(() => []),
);
vi.mock("./official-external-plugin-catalog.js", async () => {
  const actual = await vi.importActual<typeof import("./official-external-plugin-catalog.js")>(
    "./official-external-plugin-catalog.js",
  );
  return {
    ...actual,
    listOfficialExternalProviderCatalogEntries,
  };
});

import {
  resolveDeprecatedProviderInstallCatalogEntry,
  resolveProviderInstallCatalogEntries,
  resolveProviderInstallCatalogEntry,
} from "./provider-install-catalog.js";

function registrySnapshot(
  overrides: {
    installRecords?: Record<string, InstalledPluginInstallRecordInfo>;
    plugins?: InstalledPluginIndexRecord[];
  } = {},
) {
  return {
    version: 1 as const,
    hostContractVersion: "test",
    compatRegistryVersion: "test",
    migrationVersion: 1 as const,
    policyHash: "test",
    generatedAtMs: 0,
    installRecords: overrides.installRecords ?? {},
    plugins: overrides.plugins ?? [],
    diagnostics: [],
  };
}

function vllmPluginWithPackageInstall(): InstalledPluginIndexRecord {
  return {
    pluginId: "vllm",
    origin: "global",
    manifestPath: "/Users/test/.natesclaw/plugins/vllm/natesclaw.plugin.json",
    manifestHash: "hash",
    rootDir: "/Users/test/.natesclaw/plugins/vllm",
    enabled: true,
    startup: {
      sidecar: false,
      memory: false,
      agentHarnesses: [],
    },
    compat: [],
    packageName: "@natesclaw/vllm",
    packageInstall: {
      npm: {
        spec: "@natesclaw/vllm-fork@1.0.0",
        packageName: "@natesclaw/vllm-fork",
        selector: "1.0.0",
        selectorKind: "exact-version",
        exactVersion: true,
        expectedIntegrity: "sha512-old",
        pinState: "exact-with-integrity",
      },
      warnings: [],
    },
  };
}

function mockVllmAuthChoice() {
  resolveManifestProviderAuthChoices.mockReturnValue([
    {
      pluginId: "vllm",
      providerId: "vllm",
      methodId: "server",
      choiceId: "vllm",
      choiceLabel: "vLLM",
      groupLabel: "vLLM",
    },
  ]);
}

describe("provider install catalog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadNatesclawProviderIndex.mockReturnValue({ version: 1, providers: {} });
    loadPluginRegistrySnapshot.mockReturnValue({
      version: 1,
      hostContractVersion: "test",
      compatRegistryVersion: "test",
      migrationVersion: 1,
      policyHash: "test",
      generatedAtMs: 0,
      installRecords: {},
      plugins: [],
      diagnostics: [],
    });
    resolveManifestProviderAuthChoices.mockReturnValue([]);
    listOfficialExternalProviderCatalogEntries.mockReturnValue([]);
  });

  it("merges manifest auth-choice metadata with registry install metadata", () => {
    loadPluginRegistrySnapshot.mockReturnValue({
      version: 1,
      hostContractVersion: "test",
      compatRegistryVersion: "test",
      migrationVersion: 1,
      policyHash: "test",
      generatedAtMs: 0,
      installRecords: {},
      plugins: [
        {
          pluginId: "openai",
          origin: "bundled",
          manifestPath: "/repo/extensions/openai/natesclaw.plugin.json",
          manifestHash: "hash",
          rootDir: "/repo/extensions/openai",
          enabled: true,
          startup: {
            sidecar: false,
            memory: false,
            agentHarnesses: [],
          },
          compat: [],
          packageName: "@natesclaw/openai",
          packageInstall: {
            defaultChoice: "npm",
            npm: {
              spec: "@natesclaw/openai@1.2.3",
              packageName: "@natesclaw/openai",
              selector: "1.2.3",
              selectorKind: "exact-version",
              exactVersion: true,
              expectedIntegrity: "sha512-openai",
              pinState: "exact-with-integrity",
            },
            local: {
              path: "extensions/openai",
            },
            warnings: [],
          },
        },
      ],
      diagnostics: [],
    });
    resolveManifestProviderAuthChoices.mockReturnValue([
      {
        pluginId: "openai",
        providerId: "openai",
        methodId: "api-key",
        choiceId: "openai-api-key",
        choiceLabel: "OpenAI API key",
        groupId: "openai",
        groupLabel: "OpenAI",
      },
    ]);

    expect(resolveProviderInstallCatalogEntries()).toEqual([
      {
        pluginId: "openai",
        providerId: "openai",
        methodId: "api-key",
        choiceId: "openai-api-key",
        choiceLabel: "OpenAI API key",
        groupId: "openai",
        groupLabel: "OpenAI",
        label: "OpenAI",
        origin: "bundled",
        install: {
          npmSpec: "@natesclaw/openai@1.2.3",
          localPath: "extensions/openai",
          defaultChoice: "npm",
          expectedIntegrity: "sha512-openai",
        },
        installSource: {
          defaultChoice: "npm",
          npm: {
            spec: "@natesclaw/openai@1.2.3",
            packageName: "@natesclaw/openai",
            selector: "1.2.3",
            selectorKind: "exact-version",
            exactVersion: true,
            expectedIntegrity: "sha512-openai",
            pinState: "exact-with-integrity",
          },
          local: {
            path: "extensions/openai",
          },
          warnings: [],
        },
      },
    ]);
  });

  it("prefers durable install records over package-authored install intent", () => {
    loadPluginRegistrySnapshot.mockReturnValue(
      registrySnapshot({
        installRecords: {
          vllm: {
            source: "npm",
            spec: "@natesclaw/vllm",
            resolvedSpec: "@natesclaw/vllm@2.0.0",
            integrity: "sha512-vllm",
          },
        },
        plugins: [vllmPluginWithPackageInstall()],
      }),
    );
    mockVllmAuthChoice();

    expect(resolveProviderInstallCatalogEntry("vllm")).toEqual({
      pluginId: "vllm",
      providerId: "vllm",
      methodId: "server",
      choiceId: "vllm",
      choiceLabel: "vLLM",
      groupLabel: "vLLM",
      label: "vLLM",
      origin: "global",
      install: {
        npmSpec: "@natesclaw/vllm@2.0.0",
        expectedIntegrity: "sha512-vllm",
        defaultChoice: "npm",
      },
      installSource: {
        defaultChoice: "npm",
        npm: {
          spec: "@natesclaw/vllm@2.0.0",
          packageName: "@natesclaw/vllm",
          selector: "2.0.0",
          selectorKind: "exact-version",
          exactVersion: true,
          expectedIntegrity: "sha512-vllm",
          pinState: "exact-with-integrity",
        },
        warnings: [],
      },
    });
  });

  it("preserves durable ClawHub install records for provider setup reinstall hints", () => {
    loadPluginRegistrySnapshot.mockReturnValue(
      registrySnapshot({
        installRecords: {
          vllm: {
            source: "clawhub",
            spec: "clawhub:natesclaw/vllm@2026.5.2",
            integrity: "sha256-clawpack",
            clawhubPackage: "natesclaw/vllm",
          },
        },
        plugins: [vllmPluginWithPackageInstall()],
      }),
    );
    mockVllmAuthChoice();

    expect(resolveProviderInstallCatalogEntry("vllm")).toEqual({
      pluginId: "vllm",
      providerId: "vllm",
      methodId: "server",
      choiceId: "vllm",
      choiceLabel: "vLLM",
      groupLabel: "vLLM",
      label: "vLLM",
      origin: "global",
      install: {
        clawhubSpec: "clawhub:natesclaw/vllm@2026.5.2",
        defaultChoice: "clawhub",
      },
      installSource: {
        defaultChoice: "clawhub",
        clawhub: {
          spec: "clawhub:natesclaw/vllm@2026.5.2",
          packageName: "natesclaw/vllm",
          version: "2026.5.2",
          exactVersion: true,
        },
        warnings: [],
      },
    });
  });

  it("does not expose untrusted global package install intent without an install record", () => {
    loadPluginRegistrySnapshot.mockReturnValue({
      version: 1,
      hostContractVersion: "test",
      compatRegistryVersion: "test",
      migrationVersion: 1,
      policyHash: "test",
      generatedAtMs: 0,
      installRecords: {},
      plugins: [
        {
          pluginId: "demo-provider",
          origin: "global",
          manifestPath: "/Users/test/.natesclaw/plugins/demo-provider/natesclaw.plugin.json",
          manifestHash: "hash",
          rootDir: "/Users/test/.natesclaw/plugins/demo-provider",
          enabled: true,
          startup: {
            sidecar: false,
            memory: false,
            agentHarnesses: [],
          },
          compat: [],
          packageName: "@vendor/demo-provider",
          packageInstall: {
            npm: {
              spec: "@vendor/demo-provider@1.2.3",
              packageName: "@vendor/demo-provider",
              selector: "1.2.3",
              selectorKind: "exact-version",
              exactVersion: true,
              expectedIntegrity: "sha512-demo",
              pinState: "exact-with-integrity",
            },
            warnings: [],
          },
        },
      ],
      diagnostics: [],
    });
    resolveManifestProviderAuthChoices.mockReturnValue([
      {
        pluginId: "demo-provider",
        providerId: "demo-provider",
        methodId: "api-key",
        choiceId: "demo-provider-api-key",
        choiceLabel: "Demo Provider API key",
      },
    ]);

    expect(resolveProviderInstallCatalogEntries()).toStrictEqual([]);
  });

  it("ignores malformed persisted package install metadata", () => {
    loadPluginRegistrySnapshot.mockReturnValue({
      version: 1,
      hostContractVersion: "test",
      compatRegistryVersion: "test",
      migrationVersion: 1,
      policyHash: "test",
      generatedAtMs: 0,
      installRecords: {},
      plugins: [
        {
          pluginId: "openai",
          origin: "bundled",
          manifestPath: "/repo/extensions/openai/natesclaw.plugin.json",
          manifestHash: "hash",
          rootDir: "/repo/extensions/openai",
          enabled: true,
          startup: {
            sidecar: false,
            memory: false,
            agentHarnesses: [],
          },
          compat: [],
          packageName: "@natesclaw/openai",
          packageInstall: {
            defaultChoice: "npm",
            npm: {
              spec: 12,
              packageName: "@natesclaw/openai",
              selectorKind: "exact-version",
              exactVersion: true,
              pinState: "exact-with-integrity",
            },
            warnings: [],
          } as unknown as PluginInstallSourceInfo,
        },
      ],
      diagnostics: [],
    });
    resolveManifestProviderAuthChoices.mockReturnValue([
      {
        pluginId: "openai",
        providerId: "openai",
        methodId: "api-key",
        choiceId: "openai-api-key",
        choiceLabel: "OpenAI API key",
      },
    ]);

    expect(resolveProviderInstallCatalogEntries()).toStrictEqual([]);
  });

  it("skips untrusted workspace package install metadata when the plugin is disabled", () => {
    loadPluginRegistrySnapshot.mockReturnValue({
      version: 1,
      hostContractVersion: "test",
      compatRegistryVersion: "test",
      migrationVersion: 1,
      policyHash: "test",
      generatedAtMs: 0,
      installRecords: {},
      plugins: [
        {
          pluginId: "demo-provider",
          origin: "workspace",
          manifestPath: "/repo/extensions/demo-provider/natesclaw.plugin.json",
          manifestHash: "hash",
          rootDir: "/repo/extensions/demo-provider",
          enabled: false,
          startup: {
            sidecar: false,
            memory: false,
            agentHarnesses: [],
          },
          compat: [],
          packageInstall: {
            local: {
              path: "extensions/demo-provider",
            },
            warnings: [],
          },
        },
      ],
      diagnostics: [],
    });
    resolveManifestProviderAuthChoices.mockReturnValue([
      {
        pluginId: "demo-provider",
        providerId: "demo-provider",
        methodId: "api-key",
        choiceId: "demo-provider-api-key",
        choiceLabel: "Demo Provider API key",
      },
    ]);

    expect(
      resolveProviderInstallCatalogEntries({
        config: {
          plugins: {
            enabled: false,
          },
        },
        includeUntrustedWorkspacePlugins: false,
      }),
    ).toStrictEqual([]);
  });

  it("surfaces provider-index install metadata when the provider plugin is not installed", () => {
    loadNatesclawProviderIndex.mockReturnValue({
      version: 1,
      providers: {
        moonshot: {
          id: "moonshot",
          name: "Moonshot AI",
          plugin: {
            id: "moonshot",
            package: "@natesclaw/plugin-moonshot",
            install: {
              npmSpec: "@natesclaw/plugin-moonshot@1.2.3",
              defaultChoice: "npm",
              expectedIntegrity: "sha512-moonshot",
            },
          },
          authChoices: [
            {
              method: "api-key",
              choiceId: "moonshot-api-key",
              choiceLabel: "Moonshot API key",
              groupId: "moonshot",
              groupLabel: "Moonshot AI",
              onboardingScopes: ["text-inference"],
            },
          ],
        },
      },
    });

    expect(resolveProviderInstallCatalogEntry("moonshot-api-key")).toEqual({
      pluginId: "moonshot",
      providerId: "moonshot",
      methodId: "api-key",
      choiceId: "moonshot-api-key",
      choiceLabel: "Moonshot API key",
      groupId: "moonshot",
      groupLabel: "Moonshot AI",
      onboardingScopes: ["text-inference"],
      label: "Moonshot AI",
      origin: "bundled",
      install: {
        npmSpec: "@natesclaw/plugin-moonshot@1.2.3",
        defaultChoice: "npm",
        expectedIntegrity: "sha512-moonshot",
      },
      installSource: {
        defaultChoice: "npm",
        npm: {
          spec: "@natesclaw/plugin-moonshot@1.2.3",
          packageName: "@natesclaw/plugin-moonshot",
          selector: "1.2.3",
          selectorKind: "exact-version",
          exactVersion: true,
          expectedIntegrity: "sha512-moonshot",
          pinState: "exact-with-integrity",
        },
        warnings: [],
      },
    });
  });

  it("surfaces official external provider install metadata when the provider plugin is not installed", () => {
    listOfficialExternalProviderCatalogEntries.mockReturnValue([
      {
        name: "@natesclaw/codex",
        source: "official",
        kind: "provider",
        natesclaw: {
          plugin: { id: "codex", label: "Codex" },
          providers: [
            {
              id: "codex",
              name: "Codex",
              authChoices: [
                {
                  method: "app-server",
                  choiceId: "codex",
                  choiceLabel: "Codex app-server",
                  choiceHint: "Use the Codex app-server runtime.",
                  groupId: "codex",
                  groupLabel: "Codex",
                  onboardingScopes: ["text-inference"],
                },
              ],
            },
          ],
          install: {
            npmSpec: "@natesclaw/codex",
            defaultChoice: "npm",
          },
        },
      },
    ]);

    expect(resolveProviderInstallCatalogEntry("codex")).toEqual({
      pluginId: "codex",
      providerId: "codex",
      methodId: "app-server",
      choiceId: "codex",
      choiceLabel: "Codex app-server",
      choiceHint: "Use the Codex app-server runtime.",
      groupId: "codex",
      groupLabel: "Codex",
      onboardingScopes: ["text-inference"],
      label: "Codex",
      origin: "bundled",
      install: {
        npmSpec: "@natesclaw/codex",
        defaultChoice: "npm",
      },
      installSource: {
        defaultChoice: "npm",
        npm: {
          spec: "@natesclaw/codex",
          packageName: "@natesclaw/codex",
          selectorKind: "none",
          exactVersion: false,
          pinState: "floating-without-integrity",
        },
        warnings: ["npm-spec-floating", "npm-spec-missing-integrity"],
      },
    });
  });

  it("preserves official external provider aliases for configured-plugin repair", () => {
    listOfficialExternalProviderCatalogEntries.mockReturnValue([
      {
        name: "@natesclaw/gmi-provider",
        source: "official",
        kind: "provider",
        natesclaw: {
          plugin: { id: "gmi", label: "GMI Cloud" },
          providers: [
            {
              id: "gmi",
              aliases: ["gmi-cloud", "gmicloud"],
              name: "GMI Cloud",
              authChoices: [
                {
                  method: "api-key",
                  choiceId: "gmi-api-key",
                  choiceLabel: "GMI Cloud API key",
                },
              ],
            },
          ],
          install: {
            npmSpec: "@natesclaw/gmi-provider",
            defaultChoice: "npm",
          },
        },
      },
    ]);

    expect(resolveProviderInstallCatalogEntry("gmi-api-key")).toMatchObject({
      pluginId: "gmi",
      providerId: "gmi",
      providerAliases: ["gmi-cloud", "gmicloud"],
    });
  });

  it("resolves deprecated official external auth choices before their plugin is installed", () => {
    listOfficialExternalProviderCatalogEntries.mockReturnValue([
      {
        name: "@natesclaw/qwen-provider",
        source: "official",
        kind: "provider",
        natesclaw: {
          plugin: { id: "qwen", label: "Qwen Cloud" },
          providers: [
            {
              id: "qwen",
              name: "Qwen Cloud",
              authChoices: [
                {
                  method: "api-key",
                  choiceId: "qwen-api-key",
                  deprecatedChoiceIds: ["modelstudio-api-key"],
                  choiceLabel: "Qwen Cloud API key",
                },
              ],
            },
          ],
          install: {
            npmSpec: "@natesclaw/qwen-provider",
            defaultChoice: "npm",
          },
        },
      },
    ]);

    expect(resolveDeprecatedProviderInstallCatalogEntry("modelstudio-api-key")).toMatchObject({
      pluginId: "qwen",
      choiceId: "qwen-api-key",
    });
  });

  it("surfaces provider-index ClawHub install metadata as the preferred source", () => {
    loadNatesclawProviderIndex.mockReturnValue({
      version: 1,
      providers: {
        moonshot: {
          id: "moonshot",
          name: "Moonshot AI",
          plugin: {
            id: "moonshot",
            package: "@natesclaw/plugin-moonshot",
            install: {
              clawhubSpec: "clawhub:natesclaw/moonshot@2026.5.2",
              npmSpec: "@natesclaw/plugin-moonshot@2026.5.2",
              defaultChoice: "clawhub",
              expectedIntegrity: "sha512-moonshot",
            },
          },
          authChoices: [
            {
              method: "api-key",
              choiceId: "moonshot-api-key",
              choiceLabel: "Moonshot API key",
              groupId: "moonshot",
              groupLabel: "Moonshot AI",
            },
          ],
        },
      },
    });

    expect(resolveProviderInstallCatalogEntry("moonshot-api-key")).toEqual({
      pluginId: "moonshot",
      providerId: "moonshot",
      methodId: "api-key",
      choiceId: "moonshot-api-key",
      choiceLabel: "Moonshot API key",
      groupId: "moonshot",
      groupLabel: "Moonshot AI",
      label: "Moonshot AI",
      origin: "bundled",
      install: {
        clawhubSpec: "clawhub:natesclaw/moonshot@2026.5.2",
        npmSpec: "@natesclaw/plugin-moonshot@2026.5.2",
        defaultChoice: "clawhub",
        expectedIntegrity: "sha512-moonshot",
      },
      installSource: {
        defaultChoice: "clawhub",
        clawhub: {
          spec: "clawhub:natesclaw/moonshot@2026.5.2",
          packageName: "natesclaw/moonshot",
          version: "2026.5.2",
          exactVersion: true,
        },
        npm: {
          spec: "@natesclaw/plugin-moonshot@2026.5.2",
          packageName: "@natesclaw/plugin-moonshot",
          selector: "2026.5.2",
          selectorKind: "exact-version",
          exactVersion: true,
          expectedIntegrity: "sha512-moonshot",
          pinState: "exact-with-integrity",
        },
        warnings: [],
      },
    });
  });

  it("keeps provider-index entries hidden when the plugin is already installed", () => {
    loadPluginRegistrySnapshot.mockReturnValue({
      version: 1,
      hostContractVersion: "test",
      compatRegistryVersion: "test",
      migrationVersion: 1,
      policyHash: "test",
      generatedAtMs: 0,
      installRecords: {},
      plugins: [
        {
          pluginId: "moonshot",
          origin: "bundled",
          manifestPath: "/repo/extensions/moonshot/natesclaw.plugin.json",
          manifestHash: "hash",
          rootDir: "/repo/extensions/moonshot",
          enabled: true,
          startup: {
            sidecar: false,
            memory: false,
            agentHarnesses: [],
          },
          compat: [],
        },
      ],
      diagnostics: [],
    });
    loadNatesclawProviderIndex.mockReturnValue({
      version: 1,
      providers: {
        moonshot: {
          id: "moonshot",
          name: "Moonshot AI",
          plugin: {
            id: "moonshot",
            package: "@natesclaw/plugin-moonshot",
            install: {
              npmSpec: "@natesclaw/plugin-moonshot@1.2.3",
              expectedIntegrity: "sha512-moonshot",
            },
          },
          authChoices: [
            {
              method: "api-key",
              choiceId: "moonshot-api-key",
              choiceLabel: "Moonshot API key",
            },
          ],
        },
      },
    });

    expect(resolveProviderInstallCatalogEntry("moonshot-api-key")).toBeUndefined();
  });

  it("keeps missing provider-index entries visible when only some provider plugins are installed", () => {
    loadPluginRegistrySnapshot.mockReturnValue({
      version: 1,
      hostContractVersion: "test",
      compatRegistryVersion: "test",
      migrationVersion: 1,
      policyHash: "test",
      generatedAtMs: 0,
      installRecords: {},
      plugins: [
        {
          pluginId: "moonshot",
          origin: "bundled",
          manifestPath: "/repo/extensions/moonshot/natesclaw.plugin.json",
          manifestHash: "hash",
          rootDir: "/repo/extensions/moonshot",
          enabled: true,
          startup: {
            sidecar: false,
            memory: false,
            agentHarnesses: [],
          },
          compat: [],
        },
      ],
      diagnostics: [],
    });
    loadNatesclawProviderIndex.mockReturnValue({
      version: 1,
      providers: {
        groq: {
          id: "groq",
          name: "Groq",
          plugin: {
            id: "groq",
            package: "@natesclaw/plugin-groq",
            install: {
              npmSpec: "@natesclaw/plugin-groq@1.0.0",
              defaultChoice: "npm",
            },
          },
          authChoices: [
            {
              method: "api-key",
              choiceId: "groq-api-key",
              choiceLabel: "Groq API key",
            },
          ],
        },
        moonshot: {
          id: "moonshot",
          name: "Moonshot AI",
          plugin: {
            id: "moonshot",
            package: "@natesclaw/plugin-moonshot",
            install: {
              clawhubSpec: "clawhub:natesclaw/moonshot@2026.5.2",
              npmSpec: "@natesclaw/plugin-moonshot@2026.5.2",
              defaultChoice: "clawhub",
            },
          },
          authChoices: [
            {
              method: "api-key",
              choiceId: "moonshot-api-key",
              choiceLabel: "Moonshot API key",
            },
          ],
        },
        vllm: {
          id: "vllm",
          name: "vLLM",
          plugin: {
            id: "vllm",
            package: "@natesclaw/plugin-vllm",
            install: {
              clawhubSpec: "clawhub:natesclaw/vllm@2026.5.2",
              npmSpec: "@natesclaw/plugin-vllm@2026.5.2",
              defaultChoice: "clawhub",
            },
          },
          authChoices: [
            {
              method: "server",
              choiceId: "vllm-server",
              choiceLabel: "vLLM server",
            },
          ],
        },
      },
    });

    const entries = resolveProviderInstallCatalogEntries();

    expect(entries.map((entry) => entry.choiceId)).toEqual(["groq-api-key", "vllm-server"]);
    expect(resolveProviderInstallCatalogEntry("moonshot-api-key")).toBeUndefined();
    expect(resolveProviderInstallCatalogEntry("vllm-server")).toEqual({
      pluginId: "vllm",
      providerId: "vllm",
      methodId: "server",
      choiceId: "vllm-server",
      choiceLabel: "vLLM server",
      label: "vLLM",
      origin: "bundled",
      install: {
        clawhubSpec: "clawhub:natesclaw/vllm@2026.5.2",
        npmSpec: "@natesclaw/plugin-vllm@2026.5.2",
        defaultChoice: "clawhub",
      },
      installSource: {
        defaultChoice: "clawhub",
        clawhub: {
          spec: "clawhub:natesclaw/vllm@2026.5.2",
          packageName: "natesclaw/vllm",
          version: "2026.5.2",
          exactVersion: true,
        },
        npm: {
          spec: "@natesclaw/plugin-vllm@2026.5.2",
          packageName: "@natesclaw/plugin-vllm",
          selector: "2026.5.2",
          selectorKind: "exact-version",
          exactVersion: true,
          pinState: "exact-without-integrity",
        },
        warnings: ["npm-spec-missing-integrity"],
      },
    });
  });
});
