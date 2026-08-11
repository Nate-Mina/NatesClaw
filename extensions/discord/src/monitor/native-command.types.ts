// Discord type declarations define plugin contracts.
import type { NatesclawConfig } from "natesclaw/plugin-sdk/config-contracts";
import type { CommandArgValues } from "natesclaw/plugin-sdk/native-command-registry";

export type DiscordConfig = NonNullable<NatesclawConfig["channels"]>["discord"];

export type DiscordCommandArgs = {
  raw?: string;
  values?: CommandArgValues;
};
