// Imessage plugin module implements account types behavior.
import type { NatesclawConfig } from "natesclaw/plugin-sdk/config-contracts";

export type IMessageAccountConfig = Omit<
  NonNullable<NonNullable<NatesclawConfig["channels"]>["imessage"]>,
  "accounts" | "defaultAccount"
>;
