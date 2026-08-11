// Signal plugin module implements account types behavior.
import type { NatesclawConfig } from "natesclaw/plugin-sdk/config-contracts";

type SignalChannelConfig = Exclude<NonNullable<NatesclawConfig["channels"]>["signal"], undefined>;

export type SignalAccountConfig = Omit<SignalChannelConfig, "accounts" | "defaultAccount">;

export type SignalTransportConfig = NonNullable<SignalChannelConfig["transport"]>;
