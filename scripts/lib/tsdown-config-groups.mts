// Shared config names let the build wrapper isolate the large unified DTS graph.
export const TSDOWN_PACKAGE_CONFIG_GROUP = "natesclaw-packages";
export const TSDOWN_UNIFIED_CONFIG_GROUP = "natesclaw-unified";
export const TSDOWN_UNIFIED_DTS_CONFIG_GROUPS = [
  "natesclaw-dts-base",
  "natesclaw-dts-plugin-sdk-1",
  "natesclaw-dts-plugin-sdk-2",
  "natesclaw-dts-extensions-1",
  "natesclaw-dts-extensions-2",
  "natesclaw-dts-extensions-3",
  "natesclaw-dts-extensions-4",
  "natesclaw-dts-extensions-5",
] as const;
