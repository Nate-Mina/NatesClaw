import type { NatesclawConfig } from "../../config/types.natesclaw.js";
import "./local.js";

type GatewayHealthProbeAuth = {
  token?: string;
  password?: string;
  unresolvedRefReason?: string;
};

type TestApi = {
  resolveGatewayHealthProbeToken(nextConfig: NatesclawConfig): Promise<GatewayHealthProbeAuth>;
  resolveInstallDaemonGatewayHealthTiming(platform?: NodeJS.Platform): {
    deadlineMs: number;
    probeTimeoutMs: number;
    healthCommandTimeoutMs: number;
  };
};

function getTestApi(): TestApi {
  return (globalThis as Record<PropertyKey, unknown>)[
    Symbol.for("natesclaw.onboardNonInteractiveLocalTestApi")
  ] as TestApi;
}

export const resolveGatewayHealthProbeToken: TestApi["resolveGatewayHealthProbeToken"] = (
  nextConfig,
) => getTestApi().resolveGatewayHealthProbeToken(nextConfig);

export const resolveInstallDaemonGatewayHealthTiming: TestApi["resolveInstallDaemonGatewayHealthTiming"] =
  (platform) => getTestApi().resolveInstallDaemonGatewayHealthTiming(platform);
