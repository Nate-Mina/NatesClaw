// Openrouter setup module handles plugin onboarding behavior.
import {
  createAliasOnlyPresetAppliers,
  type NatesclawConfig,
} from "natesclaw/plugin-sdk/provider-onboard";

export const OPENROUTER_DEFAULT_MODEL_REF = "openrouter/auto";
const openrouterPresetAppliers = createAliasOnlyPresetAppliers({
  modelRef: OPENROUTER_DEFAULT_MODEL_REF,
  alias: "OpenRouter",
});

export function applyOpenrouterProviderConfig(cfg: NatesclawConfig): NatesclawConfig {
  return openrouterPresetAppliers.applyProviderConfig(cfg);
}

export function applyOpenrouterConfig(cfg: NatesclawConfig): NatesclawConfig {
  return openrouterPresetAppliers.applyConfig(cfg);
}
