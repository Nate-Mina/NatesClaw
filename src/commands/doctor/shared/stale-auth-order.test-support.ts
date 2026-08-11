import type { AuthProfileStore } from "../../../agents/auth-profiles/types.js";
import type { NatesclawConfig } from "../../../config/types.natesclaw.js";
import "./stale-auth-order.js";

type TestApi = {
  repairStaleConfiguredAuthOrders(params: {
    cfg: NatesclawConfig;
    stores: readonly AuthProfileStore[];
    activeStores?: readonly AuthProfileStore[];
    runtimeProfileIds?: ReadonlySet<string>;
  }): { config: NatesclawConfig; changes: string[] };
};

function getTestApi(): TestApi {
  return (globalThis as Record<PropertyKey, unknown>)[
    Symbol.for("natesclaw.staleAuthOrderTestApi")
  ] as TestApi;
}

export const repairStaleConfiguredAuthOrders: TestApi["repairStaleConfiguredAuthOrders"] = (
  params,
) => getTestApi().repairStaleConfiguredAuthOrders(params);
