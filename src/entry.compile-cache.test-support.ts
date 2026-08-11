import type { ChildProcess } from "node:child_process";
import type { RespawnChildRuntime } from "./process/respawn-child-runner.js";
import "./entry.compile-cache.js";

type CompileCacheParams = {
  env?: NodeJS.ProcessEnv;
  installRoot: string;
  nodeVersion?: string;
  platform?: NodeJS.Platform;
};

type CompileCacheRespawnPlan = {
  command: string;
  args: string[];
  env: NodeJS.ProcessEnv;
  detachForProcessTree: boolean;
};

type CompileCacheTestApi = {
  buildNatesclawCompileCacheRespawnPlan(params: {
    currentFile: string;
    env?: NodeJS.ProcessEnv;
    execArgv?: string[];
    execPath?: string;
    installRoot: string;
    argv?: string[];
    compileCacheDir?: string;
    nodeVersion?: string;
    platform?: NodeJS.Platform;
  }): CompileCacheRespawnPlan | undefined;
  isNodeVersionAffectedByCompileCacheDeadlock(nodeVersion: string | undefined): boolean;
  isSourceCheckoutInstallRoot(installRoot: string): boolean;
  resolveNatesclawCompileCacheDirectory(params: {
    env?: NodeJS.ProcessEnv;
    installRoot: string;
  }): string;
  runNatesclawCompileCacheRespawnPlan(
    plan: CompileCacheRespawnPlan,
    runtime?: RespawnChildRuntime & { writeError(message: string): void },
  ): ChildProcess;
  shouldEnableNatesclawCompileCache(params: CompileCacheParams): boolean;
};

function getTestApi(): CompileCacheTestApi {
  return (globalThis as Record<PropertyKey, unknown>)[
    Symbol.for("natesclaw.entryCompileCacheTestApi")
  ] as CompileCacheTestApi;
}

export function buildNatesclawCompileCacheRespawnPlan(
  params: Parameters<CompileCacheTestApi["buildNatesclawCompileCacheRespawnPlan"]>[0],
): CompileCacheRespawnPlan | undefined {
  return getTestApi().buildNatesclawCompileCacheRespawnPlan(params);
}

export function isNodeVersionAffectedByCompileCacheDeadlock(
  nodeVersion: string | undefined,
): boolean {
  return getTestApi().isNodeVersionAffectedByCompileCacheDeadlock(nodeVersion);
}

export function isSourceCheckoutInstallRoot(installRoot: string): boolean {
  return getTestApi().isSourceCheckoutInstallRoot(installRoot);
}

export function resolveNatesclawCompileCacheDirectory(
  params: Parameters<CompileCacheTestApi["resolveNatesclawCompileCacheDirectory"]>[0],
): string {
  return getTestApi().resolveNatesclawCompileCacheDirectory(params);
}

export function runNatesclawCompileCacheRespawnPlan(
  ...args: Parameters<CompileCacheTestApi["runNatesclawCompileCacheRespawnPlan"]>
): ChildProcess {
  return getTestApi().runNatesclawCompileCacheRespawnPlan(...args);
}

export function shouldEnableNatesclawCompileCache(params: CompileCacheParams): boolean {
  return getTestApi().shouldEnableNatesclawCompileCache(params);
}
