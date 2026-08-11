// Synthetic plugin entrypoint registers its Natesclaw integration.
import { defineSingleProviderPluginEntry } from "natesclaw/plugin-sdk/provider-entry";
import { applySyntheticConfig, SYNTHETIC_DEFAULT_MODEL_REF } from "./onboard.js";
import manifest from "./natesclaw.plugin.json" with { type: "json" };
import { buildSyntheticProvider } from "./provider-catalog.js";

const PROVIDER_ID = "synthetic";

export default defineSingleProviderPluginEntry({
  id: PROVIDER_ID,
  name: "Synthetic Provider",
  description: "Synthetic provider plugin",
  manifest,
  provider: {
    label: "Synthetic",
    docsPath: "/providers/synthetic",
    manifestAuth: {
      defaultModel: SYNTHETIC_DEFAULT_MODEL_REF,
      applyConfig: applySyntheticConfig,
    },
    catalog: {
      buildProvider: buildSyntheticProvider,
    },
  },
});
