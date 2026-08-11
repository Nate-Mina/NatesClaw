import { spawnSync } from "node:child_process";
// Check Codex App Server Protocol script supports Natesclaw repository automation.
import fs from "node:fs/promises";
import path from "node:path";
import {
  codexAppServerSharedDefinitionsSchema,
  compactCodexAppServerProtocolJsonSchemas,
  expandCodexAppServerProtocolJsonSchema,
  generateExperimentalCodexAppServerProtocolSource,
  normalizeCodexAppServerProtocolJsonText,
  selectedCodexAppServerJsonSchemas,
} from "./lib/codex-app-server-protocol-source.js";

const generatedRoot = path.resolve(
  process.cwd(),
  "extensions/codex/src/app-server/protocol-generated",
);

const checks: Array<{ file: string; snippets: string[] }> = [
  {
    file: "ServerRequest.ts",
    snippets: [
      '"item/commandExecution/requestApproval"',
      '"item/fileChange/requestApproval"',
      '"item/permissions/requestApproval"',
      '"item/tool/call"',
    ],
  },
  {
    file: "v2/ThreadItem.ts",
    snippets: [
      'type: "contextCompaction"',
      'type: "dynamicToolCall"',
      'type: "commandExecution"',
      'type: "mcpToolCall"',
    ],
  },
  {
    file: "v2/DynamicToolSpec.ts",
    snippets: [
      '"function"',
      "& DynamicToolFunctionSpec",
      '"namespace"',
      "& DynamicToolNamespaceSpec",
    ],
  },
  {
    file: "v2/DynamicToolFunctionSpec.ts",
    snippets: ["name: string", "description: string", "inputSchema: JsonValue"],
  },
  {
    file: "v2/DynamicToolNamespaceSpec.ts",
    snippets: ["name: string", "description: string", "tools: Array<DynamicToolNamespaceTool>"],
  },
  {
    file: "v2/CommandExecutionApprovalDecision.ts",
    snippets: ['"accept"', '"acceptForSession"', '"decline"', '"cancel"'],
  },
  {
    file: "v2/Account.ts",
    snippets: ['type: "apiKey"', 'type: "chatgpt"', 'type: "amazonBedrock"'],
  },
  {
    file: "v2/AppSummary.ts",
    snippets: [
      "description: string | null",
      "installUrl: string | null",
      "category: string | null",
    ],
  },
  {
    file: "v2/AppsInstalledParams.ts",
    snippets: ["threadId?: string | null", "forceRefresh?: boolean"],
  },
  {
    file: "v2/AppsInstalledResponse.ts",
    snippets: ["apps: Array<InstalledApp>"],
  },
  {
    file: "v2/AppsReadParams.ts",
    snippets: ["appIds: Array<string>", "includeTools?: boolean"],
  },
  {
    file: "v2/AppsReadResponse.ts",
    snippets: ["apps: Array<ConnectorMetadata>", "missingAppIds: Array<string>"],
  },
  {
    file: "v2/CommandExecParams.ts",
    snippets: [
      "command: Array<string>",
      "outputBytesCap?: number | null",
      "timeoutMs?: number | null",
      "env?: { [key in string]?: string | null } | null",
    ],
  },
  {
    file: "v2/CommandExecResponse.ts",
    snippets: ["exitCode: number", "stdout: string", "stderr: string"],
  },
  {
    file: "v2/ConfigBatchWriteParams.ts",
    snippets: [
      "edits: Array<ConfigEdit>",
      "filePath?: string | null",
      "expectedVersion?: string | null",
      "reloadUserConfig?: boolean",
    ],
  },
  {
    file: "v2/ConfigEdit.ts",
    snippets: ["keyPath: string", "value: JsonValue", "mergeStrategy: MergeStrategy"],
  },
  {
    file: "v2/ConfigValueWriteParams.ts",
    snippets: [
      "keyPath: string",
      "value: JsonValue",
      "mergeStrategy: MergeStrategy",
      "filePath?: string | null",
      "expectedVersion?: string | null",
    ],
  },
  {
    file: "v2/ConfigWriteResponse.ts",
    snippets: [
      "status: WriteStatus",
      "version: string",
      "filePath: AbsolutePathBuf",
      "overriddenMetadata: OverriddenMetadata | null",
    ],
  },
  {
    file: "v2/InstalledApp.ts",
    snippets: ["runtimeName: string | null", "enabled: boolean", "callable: boolean"],
  },
  {
    file: "v2/MarketplaceLoadErrorInfo.ts",
    snippets: ["marketplacePath: AbsolutePathBuf", "message: string"],
  },
  {
    file: "v2/MergeStrategy.ts",
    snippets: ['"replace"', '"upsert"'],
  },
  {
    file: "v2/OverriddenMetadata.ts",
    snippets: [
      "message: string",
      "overridingLayer: ConfigLayerMetadata",
      "effectiveValue: JsonValue",
    ],
  },
  {
    file: "v2/PluginSummary.ts",
    snippets: ["remotePluginId: string | null"],
  },
  {
    file: "v2/PluginListParams.ts",
    snippets: ["forceRefetch?: boolean"],
  },
  {
    file: "v2/PluginInstalledParams.ts",
    snippets: [
      "cwds?: Array<AbsolutePathBuf> | null",
      "installSuggestionPluginNames?: Array<string> | null",
    ],
  },
  {
    file: "v2/PluginInstalledResponse.ts",
    snippets: [
      "marketplaces: Array<PluginMarketplaceEntry>",
      "marketplaceLoadErrors: Array<MarketplaceLoadErrorInfo>",
    ],
  },
  {
    file: "v2/PluginListResponse.ts",
    snippets: [
      "marketplaces: Array<PluginMarketplaceEntry>",
      "marketplaceLoadErrors: Array<MarketplaceLoadErrorInfo>",
      "featuredPluginIds: Array<string>",
    ],
  },
  {
    file: "v2/PluginReadParams.ts",
    snippets: ["pluginName: string"],
  },
  {
    file: "v2/PluginReadResponse.ts",
    snippets: ["plugin: PluginDetail"],
  },
  {
    file: "v2/PluginInstallParams.ts",
    snippets: ["pluginName: string"],
  },
  {
    file: "v2/PluginInstallResponse.ts",
    snippets: ["appsNeedingAuth: Array<AppSummary>"],
  },
  {
    file: "v2/ThreadStartParams.ts",
    snippets: [
      "permissions?: string | null",
      "dynamicTools?: Array<DynamicToolSpec> | null",
      "experimentalRawEvents",
    ],
  },
  {
    file: "v2/TurnStartParams.ts",
    snippets: ["permissions?: string | null", "serviceTier?: string | null"],
  },
  {
    file: "v2/WriteStatus.ts",
    snippets: ['"ok"', '"okOverridden"'],
  },
  {
    file: "ReviewDecision.ts",
    snippets: ['"approved"', '"approved_for_session"', "denied: { rejection: string }", '"abort"'],
  },
  {
    file: "v2/PlanDeltaNotification.ts",
    snippets: ["itemId: string", "delta: string"],
  },
  {
    file: "v2/TurnPlanUpdatedNotification.ts",
    snippets: ["explanation: string | null", "plan: Array<TurnPlanStep>"],
  },
];

const failures: string[] = [];
await main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

async function main(): Promise<void> {
  const source = await generateExperimentalCodexAppServerProtocolSource();

  try {
    await compareGeneratedProtocolMirror(source.jsonRoot);
    await checkMaintainedProtocolTypes(source.typescriptRoot);

    for (const check of checks) {
      const filePath = path.join(source.typescriptRoot, check.file);
      let text: string;
      try {
        text = await fs.readFile(filePath, "utf8");
      } catch (error) {
        failures.push(`${check.file}: missing (${String(error)})`);
        continue;
      }
      for (const snippet of check.snippets) {
        if (!text.includes(snippet)) {
          failures.push(`${check.file}: missing ${snippet}`);
        }
      }
    }
  } finally {
    await source.cleanup();
  }

  if (failures.length > 0) {
    console.error("Codex app-server generated protocol drift:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    console.error(
      `Run \`pnpm codex-app-server:protocol:sync\` after refreshing the Codex checkout at ${source.codexRepo}.`,
    );
    process.exit(1);
  }

  console.log(
    `Codex app-server generated protocol matches Natesclaw bridge assumptions: ${source.codexRepo}`,
  );
}

async function checkMaintainedProtocolTypes(sourceRoot: string): Promise<void> {
  // Raw requests go to Codex; raw responses flow into Natesclaw. Keep the
  // assignability direction explicit so the probe permits deliberate projections.
  const probePath = path.join(sourceRoot, "natesclaw-protocol-compatibility.ts");
  const protocolPath = path.resolve(process.cwd(), "extensions/codex/src/app-server/protocol.ts");
  const protocolImport = relativeTypeScriptImport(probePath, protocolPath);
  const generatedImport = (file: string) =>
    relativeTypeScriptImport(probePath, path.join(sourceRoot, file));
  const probe = `
import type {
  CodexAppServerRequestParams,
  CodexAppServerRequestResult,
  CodexConfigEdit,
  CodexDynamicToolSpec,
  CodexDynamicToolCallParams,
  CodexErrorNotification,
  CodexGetAccountResponse,
  CodexModelListResponse,
  CodexThreadForkParams,
  CodexThreadForkResponse,
  CodexThreadResumeParams,
  CodexThreadResumeResponse,
  CodexThreadStartParams,
  CodexThreadStartResponse,
  CodexTurnEnvironmentParams,
  CodexTurnStartParams,
  v2,
} from ${JSON.stringify(protocolImport)};
import type { AppSummary } from ${JSON.stringify(generatedImport("v2/AppSummary.ts"))};
import type { AppsInstalledParams } from ${JSON.stringify(generatedImport("v2/AppsInstalledParams.ts"))};
import type { AppsInstalledResponse } from ${JSON.stringify(generatedImport("v2/AppsInstalledResponse.ts"))};
import type { AppsListParams } from ${JSON.stringify(generatedImport("v2/AppsListParams.ts"))};
import type { AppsListResponse } from ${JSON.stringify(generatedImport("v2/AppsListResponse.ts"))};
import type { AppsReadParams } from ${JSON.stringify(generatedImport("v2/AppsReadParams.ts"))};
import type { AppsReadResponse } from ${JSON.stringify(generatedImport("v2/AppsReadResponse.ts"))};
import type { CommandExecParams } from ${JSON.stringify(generatedImport("v2/CommandExecParams.ts"))};
import type { CommandExecResponse } from ${JSON.stringify(generatedImport("v2/CommandExecResponse.ts"))};
import type { ConfigBatchWriteParams } from ${JSON.stringify(generatedImport("v2/ConfigBatchWriteParams.ts"))};
import type { ConfigEdit } from ${JSON.stringify(generatedImport("v2/ConfigEdit.ts"))};
import type { ConfigValueWriteParams } from ${JSON.stringify(generatedImport("v2/ConfigValueWriteParams.ts"))};
import type { ConfigWriteResponse } from ${JSON.stringify(generatedImport("v2/ConfigWriteResponse.ts"))};
import type { DynamicToolCallParams } from ${JSON.stringify(generatedImport("v2/DynamicToolCallParams.ts"))};
import type { DynamicToolSpec } from ${JSON.stringify(generatedImport("v2/DynamicToolSpec.ts"))};
import type { ErrorNotification } from ${JSON.stringify(generatedImport("v2/ErrorNotification.ts"))};
import type { GetAccountResponse } from ${JSON.stringify(generatedImport("v2/GetAccountResponse.ts"))};
import type { MarketplaceLoadErrorInfo } from ${JSON.stringify(generatedImport("v2/MarketplaceLoadErrorInfo.ts"))};
import type { ModelListResponse } from ${JSON.stringify(generatedImport("v2/ModelListResponse.ts"))};
import type { PluginInstalledParams } from ${JSON.stringify(generatedImport("v2/PluginInstalledParams.ts"))};
import type { PluginInstalledResponse } from ${JSON.stringify(generatedImport("v2/PluginInstalledResponse.ts"))};
import type { PluginInstallParams } from ${JSON.stringify(generatedImport("v2/PluginInstallParams.ts"))};
import type { PluginInstallResponse } from ${JSON.stringify(generatedImport("v2/PluginInstallResponse.ts"))};
import type { PluginListParams } from ${JSON.stringify(generatedImport("v2/PluginListParams.ts"))};
import type { PluginListResponse } from ${JSON.stringify(generatedImport("v2/PluginListResponse.ts"))};
import type { PluginReadParams } from ${JSON.stringify(generatedImport("v2/PluginReadParams.ts"))};
import type { PluginReadResponse } from ${JSON.stringify(generatedImport("v2/PluginReadResponse.ts"))};
import type { ThreadDeleteParams } from ${JSON.stringify(generatedImport("v2/ThreadDeleteParams.ts"))};
import type { ThreadDeleteResponse } from ${JSON.stringify(generatedImport("v2/ThreadDeleteResponse.ts"))};
import type { ThreadForkParams } from ${JSON.stringify(generatedImport("v2/ThreadForkParams.ts"))};
import type { ThreadForkResponse } from ${JSON.stringify(generatedImport("v2/ThreadForkResponse.ts"))};
import type { ThreadResumeParams } from ${JSON.stringify(generatedImport("v2/ThreadResumeParams.ts"))};
import type { ThreadResumeResponse } from ${JSON.stringify(generatedImport("v2/ThreadResumeResponse.ts"))};
import type { ThreadStartParams } from ${JSON.stringify(generatedImport("v2/ThreadStartParams.ts"))};
import type { ThreadStartResponse } from ${JSON.stringify(generatedImport("v2/ThreadStartResponse.ts"))};
import type { TurnEnvironmentParams } from ${JSON.stringify(generatedImport("v2/TurnEnvironmentParams.ts"))};
import type { TurnInterruptParams } from ${JSON.stringify(generatedImport("v2/TurnInterruptParams.ts"))};
import type { TurnStartParams } from ${JSON.stringify(generatedImport("v2/TurnStartParams.ts"))};

declare const NatesclawAppsInstalledParams: CodexAppServerRequestParams<"app/installed">;
const generatedAppsInstalledParams: AppsInstalledParams = NatesclawAppsInstalledParams;
declare const NatesclawAppsListParams: CodexAppServerRequestParams<"app/list">;
const generatedAppsListParams: AppsListParams = NatesclawAppsListParams;
declare const NatesclawAppsReadParams: CodexAppServerRequestParams<"app/read">;
const generatedAppsReadParams: AppsReadParams = NatesclawAppsReadParams;
declare const NatesclawAppSummary: v2.AppSummary;
const generatedAppSummary: AppSummary = NatesclawAppSummary;
declare const NatesclawCommandExecParams: CodexAppServerRequestParams<"command/exec">;
const generatedCommandExecParams: CommandExecParams = NatesclawCommandExecParams;
declare const generatedNullableCommandExecParams: CommandExecParams;
const NatesclawNullableCommandExecParams: CodexAppServerRequestParams<"command/exec"> =
  generatedNullableCommandExecParams;
declare const NatesclawConfigBatchWriteParams: CodexAppServerRequestParams<"config/batchWrite">;
const generatedConfigBatchWriteParams: ConfigBatchWriteParams = NatesclawConfigBatchWriteParams;
declare const NatesclawConfigEdit: CodexConfigEdit;
const generatedConfigEdit: ConfigEdit = NatesclawConfigEdit;
declare const NatesclawConfigValueWriteParams: CodexAppServerRequestParams<"config/value/write">;
const generatedConfigValueWriteParams: ConfigValueWriteParams = NatesclawConfigValueWriteParams;
declare const NatesclawPluginInstalledParams: CodexAppServerRequestParams<"plugin/installed">;
const generatedPluginInstalledParams: PluginInstalledParams = NatesclawPluginInstalledParams;
declare const NatesclawPluginInstallParams: CodexAppServerRequestParams<"plugin/install">;
const generatedPluginInstallParams: PluginInstallParams = NatesclawPluginInstallParams;
declare const NatesclawPluginListParams: CodexAppServerRequestParams<"plugin/list">;
const generatedPluginListParams: PluginListParams = NatesclawPluginListParams;
declare const NatesclawPluginReadParams: CodexAppServerRequestParams<"plugin/read">;
const generatedPluginReadParams: PluginReadParams = NatesclawPluginReadParams;
declare const NatesclawDynamicToolSpec: CodexDynamicToolSpec;
const generatedDynamicToolSpec: DynamicToolSpec = NatesclawDynamicToolSpec;
declare const NatesclawTurnEnvironmentParams: CodexTurnEnvironmentParams;
const generatedTurnEnvironmentParams: TurnEnvironmentParams = NatesclawTurnEnvironmentParams;
declare const NatesclawThreadStartParams: CodexThreadStartParams;
const generatedThreadStartParams: ThreadStartParams = NatesclawThreadStartParams;
declare const NatesclawThreadResumeParams: CodexThreadResumeParams;
const generatedThreadResumeParams: ThreadResumeParams = NatesclawThreadResumeParams;
declare const NatesclawThreadForkParams: CodexThreadForkParams;
const generatedThreadForkParams: ThreadForkParams = NatesclawThreadForkParams;
declare const NatesclawThreadDeleteParams: CodexAppServerRequestParams<"thread/delete">;
const generatedThreadDeleteParams: ThreadDeleteParams = NatesclawThreadDeleteParams;
declare const NatesclawTurnInterruptParams: CodexAppServerRequestParams<"turn/interrupt">;
const generatedTurnInterruptParams: TurnInterruptParams = NatesclawTurnInterruptParams;
declare const NatesclawTurnStartParams: CodexTurnStartParams;
const generatedTurnStartParams: TurnStartParams = NatesclawTurnStartParams;

declare const generatedAppsInstalledResponse: AppsInstalledResponse;
const NatesclawAppsInstalledResponse: CodexAppServerRequestResult<"app/installed"> =
  generatedAppsInstalledResponse;
declare const generatedAppsListResponse: AppsListResponse;
const NatesclawAppsListResponse: CodexAppServerRequestResult<"app/list"> =
  generatedAppsListResponse;
declare const generatedAppsReadResponse: AppsReadResponse;
const NatesclawAppsReadResponse: CodexAppServerRequestResult<"app/read"> =
  generatedAppsReadResponse;
declare const generatedAppSummaryResponse: AppSummary;
const NatesclawAppSummaryResponse: v2.AppSummary = generatedAppSummaryResponse;
declare const generatedCommandExecResponse: CommandExecResponse;
const NatesclawCommandExecResponse: CodexAppServerRequestResult<"command/exec"> =
  generatedCommandExecResponse;
declare const generatedConfigWriteResponse: ConfigWriteResponse;
const NatesclawConfigBatchWriteResponse: CodexAppServerRequestResult<"config/batchWrite"> =
  generatedConfigWriteResponse;
const NatesclawConfigValueWriteResponse: CodexAppServerRequestResult<"config/value/write"> =
  generatedConfigWriteResponse;
const generatedExactConfigBatchWriteResponse: ConfigWriteResponse =
  NatesclawConfigBatchWriteResponse;
const generatedExactConfigValueWriteResponse: ConfigWriteResponse =
  NatesclawConfigValueWriteResponse;
declare const generatedPluginInstalledResponse: PluginInstalledResponse;
const NatesclawPluginInstalledResponse: CodexAppServerRequestResult<"plugin/installed"> =
  generatedPluginInstalledResponse;
const generatedPluginInstalledMarketplaceLoadErrors: MarketplaceLoadErrorInfo[] =
  NatesclawPluginInstalledResponse.marketplaceLoadErrors;
type InstalledPluginResponseHasNoFeaturedCatalog =
  "featuredPluginIds" extends keyof v2.PluginInstalledResponse ? never : true;
const installedPluginResponseHasNoFeaturedCatalog: InstalledPluginResponseHasNoFeaturedCatalog =
  true;
declare const generatedPluginInstallResponse: PluginInstallResponse;
const NatesclawPluginInstallResponse: CodexAppServerRequestResult<"plugin/install"> =
  generatedPluginInstallResponse;
declare const generatedPluginListResponse: PluginListResponse;
const NatesclawPluginListResponse: CodexAppServerRequestResult<"plugin/list"> =
  generatedPluginListResponse;
const generatedPluginListMarketplaceLoadErrors: MarketplaceLoadErrorInfo[] =
  NatesclawPluginListResponse.marketplaceLoadErrors;
const generatedPluginListFeaturedPluginIds: string[] = NatesclawPluginListResponse.featuredPluginIds;
declare const generatedPluginReadResponse: PluginReadResponse;
const NatesclawPluginReadResponse: CodexAppServerRequestResult<"plugin/read"> =
  generatedPluginReadResponse;
declare const generatedDynamicToolCallParams: Omit<DynamicToolCallParams, "arguments">;
const NatesclawDynamicToolCallParams: Omit<CodexDynamicToolCallParams, "arguments"> =
  generatedDynamicToolCallParams;
declare const generatedErrorNotification: ErrorNotification;
const NatesclawErrorNotification: CodexErrorNotification = generatedErrorNotification;
declare const generatedGetAccountResponse: GetAccountResponse;
const NatesclawGetAccountResponse: CodexGetAccountResponse = generatedGetAccountResponse;
declare const generatedModelListResponse: ModelListResponse;
const NatesclawModelListResponse: CodexModelListResponse = generatedModelListResponse;
declare const generatedThreadDeleteResponse: ThreadDeleteResponse;
const NatesclawThreadDeleteResponse: CodexAppServerRequestResult<"thread/delete"> =
  generatedThreadDeleteResponse;

// Thread and turn bodies are normalized behind checked-in JSON schemas. Their
// raw generated shapes must not be confused with the projector-facing types.
declare const generatedThreadForkResponse: Omit<ThreadForkResponse, "thread">;
const NatesclawThreadForkResponse: Omit<CodexThreadForkResponse, "thread"> =
  generatedThreadForkResponse;
declare const generatedThreadResumeResponse: Omit<ThreadResumeResponse, "thread">;
const NatesclawThreadResumeResponse: Omit<CodexThreadResumeResponse, "thread"> =
  generatedThreadResumeResponse;
declare const generatedThreadStartResponse: Omit<ThreadStartResponse, "thread">;
const NatesclawThreadStartResponse: Omit<CodexThreadStartResponse, "thread"> =
  generatedThreadStartResponse;

export {};
`;
  await fs.writeFile(probePath, probe);
  const result = spawnSync(
    process.execPath,
    [
      "scripts/run-tsgo.mjs",
      "--ignoreConfig",
      "--noEmit",
      "--allowImportingTsExtensions",
      "--strict",
      "--skipLibCheck",
      "--module",
      "nodenext",
      "--moduleResolution",
      "nodenext",
      probePath,
    ],
    { cwd: process.cwd(), encoding: "utf8" },
  );
  if (result.error) {
    failures.push(`maintained protocol types: failed to start tsgo (${result.error.message})`);
    return;
  }
  if (result.status !== 0) {
    const output = `${result.stdout}${result.stderr}`.trim();
    failures.push(`maintained protocol types differ from generated Codex types\n${output}`);
  }
}

function relativeTypeScriptImport(fromFile: string, toFile: string): string {
  const relative = path.relative(path.dirname(fromFile), toFile).replaceAll(path.sep, "/");
  return relative.startsWith(".") ? relative : `./${relative}`;
}

async function compareGeneratedProtocolMirror(sourceJsonRoot: string): Promise<void> {
  const sourceSchemas = new Map<string, unknown>();
  for (const schema of selectedCodexAppServerJsonSchemas) {
    const sourcePath = path.join(sourceJsonRoot, schema);
    try {
      sourceSchemas.set(schema, JSON.parse(await fs.readFile(sourcePath, "utf8")));
    } catch (error) {
      failures.push(
        `protocol-generated/json/${schema}: missing upstream schema (${String(error)})`,
      );
    }
  }
  if (sourceSchemas.size !== selectedCodexAppServerJsonSchemas.length) {
    return;
  }

  const expected = compactCodexAppServerProtocolJsonSchemas(sourceSchemas);
  const local = new Map<string, unknown>();
  for (const [schema, expectedValue] of expected) {
    const targetPath = path.join(generatedRoot, "json", schema);
    try {
      const target = await fs.readFile(targetPath, "utf8");
      local.set(schema, JSON.parse(target));
      if (normalizeJsonSchema(JSON.stringify(expectedValue)) !== normalizeJsonSchema(target)) {
        failures.push(`protocol-generated/json/${schema}: differs from compacted source schema`);
      }
    } catch (error) {
      failures.push(`protocol-generated/json/${schema}: missing local schema (${String(error)})`);
    }
  }

  const sharedSchema = local.get(codexAppServerSharedDefinitionsSchema);
  if (sharedSchema === undefined) {
    return;
  }
  for (const schema of selectedCodexAppServerJsonSchemas) {
    const compactSchema = local.get(schema);
    const sourceSchema = sourceSchemas.get(schema);
    if (compactSchema === undefined || sourceSchema === undefined) {
      continue;
    }
    try {
      const expanded = expandCodexAppServerProtocolJsonSchema({
        schema: compactSchema,
        schemaPath: schema,
        sharedSchema,
      });
      if (
        normalizeJsonSchema(JSON.stringify(expanded)) !==
        normalizeJsonSchema(JSON.stringify(sourceSchema))
      ) {
        failures.push(
          `protocol-generated/json/${schema}: compact schema does not expand to its source schema`,
        );
      }
    } catch (error) {
      failures.push(`protocol-generated/json/${schema}: cannot expand (${String(error)})`);
    }
  }
}

function normalizeJsonSchema(sourceLocal: string): string {
  return normalizeCodexAppServerProtocolJsonText(sourceLocal);
}
