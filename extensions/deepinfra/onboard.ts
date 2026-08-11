// Deepinfra setup module handles plugin onboarding behavior.
import {
  createAliasOnlyPresetAppliers,
  type NatesclawConfig,
} from "natesclaw/plugin-sdk/provider-onboard";
import { DEEPINFRA_DEFAULT_MODEL_REF } from "./provider-models.js";

export function applyDeepInfraConfig(
  cfg: NatesclawConfig,
  modelRef: string = DEEPINFRA_DEFAULT_MODEL_REF,
): NatesclawConfig {
  return createAliasOnlyPresetAppliers({ modelRef, alias: "DeepInfra" }).applyConfig(cfg);
}
