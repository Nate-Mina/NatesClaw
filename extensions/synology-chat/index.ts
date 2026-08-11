// Synology Chat plugin entrypoint registers its Natesclaw integration.
import { defineBundledChannelEntry } from "natesclaw/plugin-sdk/channel-entry-contract";

export default defineBundledChannelEntry({
  id: "synology-chat",
  name: "Synology Chat",
  description: "Native Synology Chat channel plugin for Natesclaw",
  importMetaUrl: import.meta.url,
  plugin: {
    specifier: "./channel-plugin-api.js",
    exportName: "synologyChatPlugin",
  },
  runtime: {
    specifier: "./api.js",
    exportName: "setSynologyRuntime",
  },
});
