// Venice tests cover provider runtime.contract plugin behavior.
import { describeVeniceProviderRuntimeContract } from "natesclaw/plugin-sdk/provider-test-contracts";
import manifest from "./natesclaw.plugin.json" with { type: "json" };

describeVeniceProviderRuntimeContract(
  () => import("./index.js"),
  manifest.modelCatalog.providers.venice,
);
