// Whatsapp plugin module implements doctor behavior.
import type {
  ChannelDoctorAdapter,
  ChannelDoctorConfigMutation,
} from "natesclaw/plugin-sdk/channel-contract";
import type { NatesclawConfig } from "natesclaw/plugin-sdk/config-contracts";

export function normalizeCompatibilityConfig({
  cfg,
}: {
  cfg: NatesclawConfig;
}): ChannelDoctorConfigMutation {
  return { config: cfg, changes: [] };
}

export const whatsappDoctor: ChannelDoctorAdapter = {
  normalizeCompatibilityConfig,
};
