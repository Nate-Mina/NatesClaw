// Defines plugin install security scan result types.
import type { NatesclawConfig } from "../config/types.natesclaw.js";

/** Overrides that intentionally loosen install safety policy for trusted/operator paths. */
export type InstallSafetyOverrides = {
  config?: NatesclawConfig;
  dangerouslyForceUnsafeInstall?: boolean;
  trustedSourceLinkedOfficialInstall?: boolean;
};
