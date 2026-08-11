// Extension Package Boundary script supports Natesclaw repository automation.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, posix, resolve } from "node:path";
import { privateLocalOnlyPluginSdkEntrypoints } from "./plugin-sdk-entries.mts";

export const EXTENSION_PACKAGE_BOUNDARY_INCLUDE = ["./*.ts", "./src/**/*.ts"] as const;
export const EXTENSION_PACKAGE_BOUNDARY_EXCLUDE = [
  "./**/*.test.ts",
  "./dist/**",
  "./node_modules/**",
  "./src/test-support/**",
  "./src/**/*test-helpers.ts",
  "./src/**/*test-harness.ts",
  "./src/**/*test-support.ts",
] as const;

const privateLocalOnlyPluginSdkPackageDtsPaths = Object.fromEntries(
  privateLocalOnlyPluginSdkEntrypoints.map((entrypoint) => [
    `natesclaw/plugin-sdk/${entrypoint}`,
    [`../packages/plugin-sdk/dist/src/plugin-sdk/${entrypoint}.d.ts`],
  ]),
) as Record<string, readonly string[]>;

function buildPackageBoundaryDtsPaths(params: {
  packageName: string;
  packageDir: string;
}): Record<string, readonly string[]> {
  const packageJson = JSON.parse(
    readFileSync(join("packages", params.packageDir, "package.json"), "utf8"),
  ) as { exports?: Record<string, unknown> };
  return Object.fromEntries(
    Object.entries(packageJson.exports ?? {}).flatMap(([exportKey, value]) => {
      const subpath =
        exportKey === "." ? "" : exportKey.startsWith("./") ? exportKey.slice(2) : null;
      const importPath =
        value && typeof value === "object" && !Array.isArray(value)
          ? (value as Record<string, unknown>).import
          : value;
      if (subpath === null || subpath.includes("..") || typeof importPath !== "string") {
        return [];
      }
      if (!importPath.startsWith("./dist/") || !importPath.endsWith(".mjs")) {
        return [];
      }
      const specifier = subpath ? `${params.packageName}/${subpath}` : params.packageName;
      return [
        [
          specifier,
          [`../dist/plugin-sdk/packages/${params.packageDir}/src/${subpath || "index"}.d.ts`],
        ],
      ];
    }),
  );
}

export const EXTENSION_PACKAGE_BOUNDARY_BASE_PATHS = {
  "natesclaw/plugin-sdk/*": ["../dist/plugin-sdk/*.d.ts"],
  ...privateLocalOnlyPluginSdkPackageDtsPaths,
  "natesclaw/plugin-sdk/account-id": ["../dist/plugin-sdk/account-id.d.ts"],
  "natesclaw/plugin-sdk/channel-entry-contract": ["../dist/plugin-sdk/channel-entry-contract.d.ts"],
  "natesclaw/plugin-sdk/browser-maintenance": [
    "../packages/plugin-sdk/dist/extensions/browser/browser-maintenance.d.ts",
  ],
  "natesclaw/plugin-sdk/channel-secret-basic-runtime": [
    "../dist/plugin-sdk/channel-secret-basic-runtime.d.ts",
  ],
  "natesclaw/plugin-sdk/channel-secret-runtime": ["../dist/plugin-sdk/channel-secret-runtime.d.ts"],
  "natesclaw/plugin-sdk/channel-streaming": ["../dist/plugin-sdk/channel-streaming.d.ts"],
  "natesclaw/plugin-sdk/error-runtime": ["../dist/plugin-sdk/error-runtime.d.ts"],
  "natesclaw/plugin-sdk/secret-ref-runtime": ["../dist/plugin-sdk/secret-ref-runtime.d.ts"],
  "natesclaw/plugin-sdk/ssrf-runtime": ["../dist/plugin-sdk/ssrf-runtime.d.ts"],
  "@natesclaw/qa-channel/api.js": ["../dist/plugin-sdk/extensions/qa-channel/api.d.ts"],
  "@natesclaw/memory-core/api.js": ["../dist/plugin-sdk/extensions/memory-core/api.d.ts"],
  "@natesclaw/matrix/test-api.js": ["../dist/plugin-sdk/extensions/matrix/test-api.d.ts"],
  "@natesclaw/discord/api.js": ["../dist/plugin-sdk/extensions/discord/api.d.ts"],
  "@natesclaw/slack/api.js": ["../dist/plugin-sdk/extensions/slack/api.d.ts"],
  "@natesclaw/telegram/api.js": ["../dist/plugin-sdk/extensions/telegram/api.d.ts"],
  "@natesclaw/whatsapp/api.js": ["../dist/plugin-sdk/extensions/whatsapp/api.d.ts"],
  "@natesclaw/ai": ["../dist/plugin-sdk/packages/ai/src/index.d.ts"],
  "@natesclaw/ai/diagnostics": ["../dist/plugin-sdk/packages/ai/src/utils/diagnostics.d.ts"],
  "@natesclaw/ai/event-stream": ["../dist/plugin-sdk/packages/ai/src/utils/event-stream.d.ts"],
  "@natesclaw/ai/providers": ["../dist/plugin-sdk/packages/ai/src/providers.d.ts"],
  "@natesclaw/ai/transports": ["../dist/plugin-sdk/packages/ai/src/transports.d.ts"],
  "@natesclaw/ai/types": ["../dist/plugin-sdk/packages/ai/src/types.d.ts"],
  "@natesclaw/ai/validation": ["../dist/plugin-sdk/packages/ai/src/validation.d.ts"],
  "@natesclaw/ai/internal/anthropic": ["../dist/plugin-sdk/packages/ai/src/internal/anthropic.d.ts"],
  "@natesclaw/ai/internal/openai": ["../dist/plugin-sdk/packages/ai/src/internal/openai.d.ts"],
  "@natesclaw/ai/internal/retry-after": [
    "../dist/plugin-sdk/packages/ai/src/internal/retry-after.d.ts",
  ],
  "@natesclaw/ai/internal/runtime": ["../dist/plugin-sdk/packages/ai/src/internal/runtime.d.ts"],
  "@natesclaw/ai/internal/shared": ["../dist/plugin-sdk/packages/ai/src/internal/shared.d.ts"],
  "@natesclaw/llm-core": ["../dist/plugin-sdk/packages/llm-core/src/index.d.ts"],
  "@natesclaw/llm-core/diagnostics": [
    "../dist/plugin-sdk/packages/llm-core/src/utils/diagnostics.d.ts",
  ],
  "@natesclaw/llm-core/event-stream": [
    "../dist/plugin-sdk/packages/llm-core/src/utils/event-stream.d.ts",
  ],
  "@natesclaw/llm-core/types": ["../dist/plugin-sdk/packages/llm-core/src/types.d.ts"],
  "@natesclaw/llm-core/validation": ["../dist/plugin-sdk/packages/llm-core/src/validation.d.ts"],
  "@natesclaw/llm-core/*": ["../dist/plugin-sdk/packages/llm-core/src/*.d.ts"],
  "@natesclaw/model-catalog-core": ["../dist/plugin-sdk/packages/model-catalog-core/src/index.d.ts"],
  "@natesclaw/model-catalog-core/configured-model-refs": [
    "../dist/plugin-sdk/packages/model-catalog-core/src/configured-model-refs.d.ts",
  ],
  "@natesclaw/model-catalog-core/model-catalog-refs": [
    "../dist/plugin-sdk/packages/model-catalog-core/src/model-catalog-refs.d.ts",
  ],
  "@natesclaw/model-catalog-core/model-catalog-normalize": [
    "../dist/plugin-sdk/packages/model-catalog-core/src/model-catalog-normalize.d.ts",
  ],
  "@natesclaw/model-catalog-core/model-catalog-types": [
    "../dist/plugin-sdk/packages/model-catalog-core/src/model-catalog-types.d.ts",
  ],
  "@natesclaw/model-catalog-core/provider-id": [
    "../dist/plugin-sdk/packages/model-catalog-core/src/provider-id.d.ts",
  ],
  "@natesclaw/model-catalog-core/provider-model-id-normalization": [
    "../dist/plugin-sdk/packages/model-catalog-core/src/provider-model-id-normalization.d.ts",
  ],
  "@natesclaw/model-catalog-core/provider-model-id-normalize": [
    "../dist/plugin-sdk/packages/model-catalog-core/src/provider-model-id-normalize.d.ts",
  ],
  "@natesclaw/model-catalog-core/*": ["../dist/plugin-sdk/packages/model-catalog-core/src/*.d.ts"],
  "@natesclaw/markdown-core": ["../dist/plugin-sdk/packages/markdown-core/src/index.d.ts"],
  "@natesclaw/markdown-core/code-spans": [
    "../dist/plugin-sdk/packages/markdown-core/src/code-spans.d.ts",
  ],
  "@natesclaw/markdown-core/fences": ["../dist/plugin-sdk/packages/markdown-core/src/fences.d.ts"],
  "@natesclaw/markdown-core/frontmatter": [
    "../dist/plugin-sdk/packages/markdown-core/src/frontmatter.d.ts",
  ],
  "@natesclaw/markdown-core/ir": ["../dist/plugin-sdk/packages/markdown-core/src/ir.d.ts"],
  "@natesclaw/markdown-core/render": ["../dist/plugin-sdk/packages/markdown-core/src/render.d.ts"],
  "@natesclaw/markdown-core/render-aware-chunking": [
    "../dist/plugin-sdk/packages/markdown-core/src/render-aware-chunking.d.ts",
  ],
  "@natesclaw/markdown-core/tables": ["../dist/plugin-sdk/packages/markdown-core/src/tables.d.ts"],
  "@natesclaw/markdown-core/types": ["../dist/plugin-sdk/packages/markdown-core/src/types.d.ts"],
  "@natesclaw/markdown-core/*": ["../dist/plugin-sdk/packages/markdown-core/src/*.d.ts"],
  "@natesclaw/media-generation-core": [
    "../dist/plugin-sdk/packages/media-generation-core/src/index.d.ts",
  ],
  "@natesclaw/media-generation-core/capability-model-ref": [
    "../dist/plugin-sdk/packages/media-generation-core/src/capability-model-ref.d.ts",
  ],
  "@natesclaw/media-generation-core/catalog": [
    "../dist/plugin-sdk/packages/media-generation-core/src/catalog.d.ts",
  ],
  "@natesclaw/media-generation-core/model-ref": [
    "../dist/plugin-sdk/packages/media-generation-core/src/model-ref.d.ts",
  ],
  "@natesclaw/media-generation-core/normalization": [
    "../dist/plugin-sdk/packages/media-generation-core/src/normalization.d.ts",
  ],
  "@natesclaw/media-generation-core/*": [
    "../dist/plugin-sdk/packages/media-generation-core/src/*.d.ts",
  ],
  "@natesclaw/media-core": ["../dist/plugin-sdk/packages/media-core/src/index.d.ts"],
  "@natesclaw/media-core/attachment-classify": [
    "../dist/plugin-sdk/packages/media-core/src/attachment-classify.d.ts",
  ],
  "@natesclaw/media-core/base64": ["../dist/plugin-sdk/packages/media-core/src/base64.d.ts"],
  "@natesclaw/media-core/constants": ["../dist/plugin-sdk/packages/media-core/src/constants.d.ts"],
  "@natesclaw/media-core/content-length": [
    "../dist/plugin-sdk/packages/media-core/src/content-length.d.ts",
  ],
  "@natesclaw/media-core/file-name": ["../dist/plugin-sdk/packages/media-core/src/file-name.d.ts"],
  "@natesclaw/media-core/inbound-path-policy": [
    "../dist/plugin-sdk/packages/media-core/src/inbound-path-policy.d.ts",
  ],
  "@natesclaw/media-core/inline-image-data-url": [
    "../dist/plugin-sdk/packages/media-core/src/inline-image-data-url.d.ts",
  ],
  "@natesclaw/media-core/media-source-url": [
    "../dist/plugin-sdk/packages/media-core/src/media-source-url.d.ts",
  ],
  "@natesclaw/media-core/mime": ["../dist/plugin-sdk/packages/media-core/src/mime.d.ts"],
  "@natesclaw/media-core/read-byte-stream-with-limit": [
    "../dist/plugin-sdk/packages/media-core/src/read-byte-stream-with-limit.d.ts",
  ],
  "@natesclaw/media-core/*": ["../dist/plugin-sdk/packages/media-core/src/*.d.ts"],
  "@natesclaw/normalization-core/record-coerce": [
    "../dist/plugin-sdk/packages/normalization-core/src/record-coerce.d.ts",
  ],
  "@natesclaw/normalization-core/string-coerce": [
    "../dist/plugin-sdk/packages/normalization-core/src/string-coerce.d.ts",
  ],
  "@natesclaw/normalization-core/*": ["../dist/plugin-sdk/packages/normalization-core/src/*.d.ts"],
  "@natesclaw/retry": ["../dist/plugin-sdk/packages/retry/src/index.d.ts"],
  "@natesclaw/workboard-contract": ["../packages/workboard-contract/src/index.ts"],
  ...buildPackageBoundaryDtsPaths({
    packageName: "@natesclaw/acp-core",
    packageDir: "acp-core",
  }),
  "@natesclaw/acp-core/*": ["../dist/plugin-sdk/packages/acp-core/src/*.d.ts"],
  "@natesclaw/terminal-core": ["../dist/plugin-sdk/packages/terminal-core/src/index.d.ts"],
  "@natesclaw/terminal-core/ansi": ["../dist/plugin-sdk/packages/terminal-core/src/ansi.d.ts"],
  "@natesclaw/terminal-core/decorative-emoji": [
    "../dist/plugin-sdk/packages/terminal-core/src/decorative-emoji.d.ts",
  ],
  "@natesclaw/terminal-core/health-style": [
    "../dist/plugin-sdk/packages/terminal-core/src/health-style.d.ts",
  ],
  "@natesclaw/terminal-core/links": ["../dist/plugin-sdk/packages/terminal-core/src/links.d.ts"],
  "@natesclaw/terminal-core/note": ["../dist/plugin-sdk/packages/terminal-core/src/note.d.ts"],
  "@natesclaw/terminal-core/osc-progress": [
    "../dist/plugin-sdk/packages/terminal-core/src/osc-progress.d.ts",
  ],
  "@natesclaw/terminal-core/palette": ["../dist/plugin-sdk/packages/terminal-core/src/palette.d.ts"],
  "@natesclaw/terminal-core/progress-line": [
    "../dist/plugin-sdk/packages/terminal-core/src/progress-line.d.ts",
  ],
  "@natesclaw/terminal-core/prompt-select-styled": [
    "../dist/plugin-sdk/packages/terminal-core/src/prompt-select-styled.d.ts",
  ],
  "@natesclaw/terminal-core/prompt-select-styled-params": [
    "../dist/plugin-sdk/packages/terminal-core/src/prompt-select-styled-params.d.ts",
  ],
  "@natesclaw/terminal-core/prompt-style": [
    "../dist/plugin-sdk/packages/terminal-core/src/prompt-style.d.ts",
  ],
  "@natesclaw/terminal-core/restore": ["../dist/plugin-sdk/packages/terminal-core/src/restore.d.ts"],
  "@natesclaw/terminal-core/safe-text": [
    "../dist/plugin-sdk/packages/terminal-core/src/safe-text.d.ts",
  ],
  "@natesclaw/terminal-core/stream-writer": [
    "../dist/plugin-sdk/packages/terminal-core/src/stream-writer.d.ts",
  ],
  "@natesclaw/terminal-core/table": ["../dist/plugin-sdk/packages/terminal-core/src/table.d.ts"],
  "@natesclaw/terminal-core/terminal-link": [
    "../dist/plugin-sdk/packages/terminal-core/src/terminal-link.d.ts",
  ],
  "@natesclaw/terminal-core/theme": ["../dist/plugin-sdk/packages/terminal-core/src/theme.d.ts"],
  "@natesclaw/terminal-core/*": ["../dist/plugin-sdk/packages/terminal-core/src/*.d.ts"],
  "@natesclaw/*.js": ["../packages/plugin-sdk/dist/extensions/*.d.ts", "../extensions/*"],
  "@natesclaw/*": ["../packages/plugin-sdk/dist/extensions/*", "../extensions/*"],
  "natesclaw/plugin-sdk/qa-channel": ["../dist/plugin-sdk/src/plugin-sdk/qa-channel.d.ts"],
  "natesclaw/plugin-sdk/qa-channel-protocol": [
    "../dist/plugin-sdk/src/plugin-sdk/qa-channel-protocol.d.ts",
  ],
  "natesclaw/plugin-sdk/qa-runtime": ["../dist/plugin-sdk/src/plugin-sdk/qa-runtime.d.ts"],
  "@natesclaw/plugin-sdk/*": ["../dist/plugin-sdk/*.d.ts"],
} as const;

function prefixExtensionPackageBoundaryPaths(
  paths: Record<string, readonly string[]>,
  prefix: string,
): Record<string, readonly string[]> {
  return Object.fromEntries(
    Object.entries(paths).map(([key, values]) => [
      key,
      values.map((value) => posix.join(prefix, value)),
    ]),
  );
}

function omitExtensionPackageBoundaryPaths(
  paths: Record<string, readonly string[]>,
  omittedKeys: readonly string[],
): Record<string, readonly string[]> {
  const omitted = new Set(omittedKeys);
  return Object.fromEntries(Object.entries(paths).filter(([key]) => !omitted.has(key)));
}

export const EXTENSION_PACKAGE_BOUNDARY_XAI_PATHS = {
  ...prefixExtensionPackageBoundaryPaths(
    omitExtensionPackageBoundaryPaths(EXTENSION_PACKAGE_BOUNDARY_BASE_PATHS, [
      "natesclaw/plugin-sdk/channel-secret-basic-runtime",
      "natesclaw/plugin-sdk/channel-secret-tts-runtime",
      "@natesclaw/matrix/test-api.js",
      "@natesclaw/discord/api.js",
      "@natesclaw/slack/api.js",
      "@natesclaw/telegram/api.js",
      "@natesclaw/whatsapp/api.js",
    ]),
    "../",
  ),
  "natesclaw/plugin-sdk/channel-entry-contract": [
    "../../dist/plugin-sdk/channel-entry-contract.d.ts",
  ],
  "natesclaw/plugin-sdk/browser-maintenance": [
    "../../dist/plugin-sdk/src/plugin-sdk/browser-maintenance.d.ts",
  ],
  "@natesclaw/qa-channel/api.js": ["../../dist/plugin-sdk/extensions/qa-channel/api.d.ts"],
  "@natesclaw/*.js": ["../../packages/plugin-sdk/dist/extensions/*.d.ts", "../*"],
  "@natesclaw/*": ["../*"],
  "@natesclaw/plugin-sdk/*": ["../../dist/plugin-sdk/*.d.ts"],
  "@natesclaw/anthropic-vertex/api.js": ["./.boundary-stubs/anthropic-vertex-api.d.ts"],
  "@natesclaw/ollama/api.js": ["./.boundary-stubs/ollama-api.d.ts"],
  "@natesclaw/ollama/runtime-api.js": ["./.boundary-stubs/ollama-runtime-api.d.ts"],
} as const;

type ExtensionPackageBoundaryTsConfigJson = {
  extends?: unknown;
  compilerOptions?: {
    rootDir?: unknown;
    paths?: unknown;
  };
  include?: unknown;
  exclude?: unknown;
};

type ExtensionPackageBoundaryPackageJson = {
  devDependencies?: Record<string, string>;
};

function readJsonFile(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function collectBundledExtensionIds(rootDir = resolve(".")): string[] {
  return readdirSync(join(rootDir, "extensions"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .toSorted();
}

function resolveExtensionTsconfigPath(extensionId: string, rootDir = resolve(".")): string {
  return join(rootDir, "extensions", extensionId, "tsconfig.json");
}

function resolveExtensionPackageJsonPath(extensionId: string, rootDir = resolve(".")): string {
  return join(rootDir, "extensions", extensionId, "package.json");
}

export function readExtensionPackageBoundaryTsconfig(
  extensionId: string,
  rootDir = resolve("."),
): ExtensionPackageBoundaryTsConfigJson {
  return readJsonFile(
    resolveExtensionTsconfigPath(extensionId, rootDir),
  ) as ExtensionPackageBoundaryTsConfigJson;
}

export function readExtensionPackageBoundaryPackageJson(
  extensionId: string,
  rootDir = resolve("."),
): ExtensionPackageBoundaryPackageJson {
  return readJsonFile(
    resolveExtensionPackageJsonPath(extensionId, rootDir),
  ) as ExtensionPackageBoundaryPackageJson;
}

export function isOptInExtensionPackageBoundaryTsconfig(
  tsconfig: ExtensionPackageBoundaryTsConfigJson,
): boolean {
  return tsconfig.extends === "../tsconfig.package-boundary.base.json";
}

export function collectExtensionsWithTsconfig(rootDir = resolve(".")): string[] {
  return collectBundledExtensionIds(rootDir).filter((extensionId) =>
    existsSync(resolveExtensionTsconfigPath(extensionId, rootDir)),
  );
}

export function collectOptInExtensionPackageBoundaries(rootDir = resolve(".")): string[] {
  return collectExtensionsWithTsconfig(rootDir).filter((extensionId) =>
    isOptInExtensionPackageBoundaryTsconfig(
      readExtensionPackageBoundaryTsconfig(extensionId, rootDir),
    ),
  );
}
