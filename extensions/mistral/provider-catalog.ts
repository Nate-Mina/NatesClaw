// Mistral provider module implements model/runtime integration.
import { buildManifestModelProviderConfig } from "natesclaw/plugin-sdk/provider-catalog-shared";
import type { ModelProviderConfig } from "natesclaw/plugin-sdk/provider-model-shared";
import manifest from "./natesclaw.plugin.json" with { type: "json" };

export function buildMistralProvider(): ModelProviderConfig {
  return buildManifestModelProviderConfig({
    providerId: "mistral",
    catalog: manifest.modelCatalog.providers.mistral,
  });
}
