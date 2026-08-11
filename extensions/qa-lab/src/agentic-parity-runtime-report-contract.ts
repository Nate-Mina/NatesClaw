import type { QaRuntimeParityCacheUsage } from "./agentic-parity-cache-usage.js";
import type { RuntimeParityCacheDiagnostics } from "./runtime-parity-cache-diagnostics.js";
import type { QaRuntimeTiming } from "./runtime-parity-timing.js";
import type { RuntimeId, RuntimeParityDrift, RuntimeParityUsagePolicy } from "./runtime-parity.js";

export type QaRuntimeParityScenarioReport = {
  name: string;
  status: "pass" | "fail";
  runtimeParityUsage: RuntimeParityUsagePolicy;
  drift: RuntimeParityDrift | "missing";
  driftDetails?: string;
  natesclawStatus: "pass" | "fail" | "missing";
  codexStatus: "pass" | "fail" | "missing";
  natesclawTokens: number;
  codexTokens: number;
  natesclawUsage: QaRuntimeParityCacheUsage | null;
  codexUsage: QaRuntimeParityCacheUsage | null;
  natesclawCacheDiagnostics?: RuntimeParityCacheDiagnostics;
  codexCacheDiagnostics?: RuntimeParityCacheDiagnostics;
  natesclawToolCalls: number;
  codexToolCalls: number;
  natesclawWallClockMs: number | null;
  codexWallClockMs: number | null;
  natesclawBootstrapWallClockMs?: number;
  codexBootstrapWallClockMs?: number;
  fasterRuntime: RuntimeId | "tie" | null;
  speedupPercent: number | null;
};

export type QaRuntimeParityReport = {
  runtimePair: [RuntimeId, RuntimeId];
  comparedAt: string;
  providerMode?: string;
  primaryModel?: string;
  totalScenarios: number;
  passedScenarios: number;
  failedScenarios: number;
  driftCounts: Record<RuntimeParityDrift, number>;
  scenarios: QaRuntimeParityScenarioReport[];
  timing: QaRuntimeTiming;
  usage: {
    natesclaw: QaRuntimeParityCacheUsage | null;
    codex: QaRuntimeParityCacheUsage | null;
  };
  pass: boolean;
  failures: string[];
  notes: string[];
};
