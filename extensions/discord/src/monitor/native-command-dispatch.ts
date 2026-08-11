// Discord plugin module implements native command dispatch behavior.
import type { ChatCommandDefinition, CommandArgs } from "natesclaw/plugin-sdk/command-auth-native";
import type { NatesclawConfig } from "natesclaw/plugin-sdk/config-contracts";
import type { PluginCommandCatalogDecision } from "natesclaw/plugin-sdk/plugin-command-runtime";
import type { ReplyPayload } from "natesclaw/plugin-sdk/reply-dispatch-runtime";
import type { ResolvedAgentRoute } from "natesclaw/plugin-sdk/routing";
import type {
  ButtonInteraction,
  CommandInteraction,
  StringSelectMenuInteraction,
} from "../internal/discord.js";
import type { ThreadBindingManager } from "./thread-bindings.js";

type DiscordConfig = NonNullable<NatesclawConfig["channels"]>["discord"];

type DispatchDiscordCommandInteractionParams = {
  interaction: CommandInteraction | ButtonInteraction | StringSelectMenuInteraction;
  prompt: string;
  command: ChatCommandDefinition;
  commandArgs?: CommandArgs;
  cfg: NatesclawConfig;
  discordConfig: DiscordConfig;
  accountId: string;
  sessionPrefix: string;
  preferFollowUp: boolean;
  threadBindings: ThreadBindingManager;
  responseEphemeral?: boolean;
  suppressReplies?: boolean;
  pluginCommandDispatch: PluginCommandCatalogDecision;
};

export type DispatchDiscordCommandInteractionResult = {
  accepted: boolean;
  effectiveRoute?: ResolvedAgentRoute;
  hiddenFinalReply?: ReplyPayload;
};

export type DispatchDiscordCommandInteraction = (
  params: DispatchDiscordCommandInteractionParams,
) => Promise<DispatchDiscordCommandInteractionResult>;
