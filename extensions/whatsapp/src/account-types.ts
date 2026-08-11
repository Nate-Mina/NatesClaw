// Whatsapp plugin module implements account types behavior.
import type { NatesclawConfig } from "natesclaw/plugin-sdk/config-contracts";

export type WhatsAppAccountConfig = NonNullable<
  NonNullable<NonNullable<NatesclawConfig["channels"]>["whatsapp"]>["accounts"]
>[string];
