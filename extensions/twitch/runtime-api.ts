// Private runtime barrel for the bundled Twitch extension.
// Keep this barrel thin and aligned with the local extension surface.

export type {
  ChannelAccountSnapshot,
  ChannelCapabilities,
  ChannelGatewayContext,
  ChannelLogSink,
  ChannelMessageActionAdapter,
  ChannelMessageActionContext,
  ChannelMeta,
  ChannelOutboundAdapter,
  ChannelOutboundContext,
  ChannelResolveKind,
  ChannelResolveResult,
  ChannelStatusAdapter,
} from "natesclaw/plugin-sdk/channel-contract";
export type { ChannelPlugin } from "natesclaw/plugin-sdk/channel-core";
export type { OutboundDeliveryResult } from "natesclaw/plugin-sdk/channel-send-result";
export type { NatesclawConfig } from "natesclaw/plugin-sdk/config-contracts";
export type { RuntimeEnv } from "natesclaw/plugin-sdk/runtime";
export type { WizardPrompter } from "natesclaw/plugin-sdk/setup";
