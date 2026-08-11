// Packed Plugin Sdk Type Smoke script supports Natesclaw repository automation.
type PublicPluginSdkModules = [
  typeof import("natesclaw/plugin-sdk/core"),
  typeof import("natesclaw/plugin-sdk/channel-entry-contract"),
  typeof import("natesclaw/plugin-sdk/config-contracts"),
  typeof import("natesclaw/plugin-sdk/plugin-entry"),
  typeof import("natesclaw/plugin-sdk/runtime-env"),
];

const resolvedModules = null as unknown as PublicPluginSdkModules;

void resolvedModules;
