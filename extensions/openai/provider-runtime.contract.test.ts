// Openai tests cover provider runtime.contract plugin behavior.
import { describeOpenAIProviderRuntimeContract } from "natesclaw/plugin-sdk/provider-test-contracts";
import manifest from "./natesclaw.plugin.json" with { type: "json" };

describeOpenAIProviderRuntimeContract(
  () => import("./index.js"),
  manifest.modelCatalog.providers.openai,
);
