// Mattermost plugin module implements secret input behavior.
export type { SecretInput } from "natesclaw/plugin-sdk/secret-input";
export {
  buildSecretInputSchema,
  hasConfiguredSecretInput,
  resolveSecretInputString,
} from "natesclaw/plugin-sdk/secret-input";
export type { SecretInputStringResolutionMode } from "natesclaw/plugin-sdk/secret-input";
