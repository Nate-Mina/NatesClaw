import type { NatesclawConfig } from "../../config/types.natesclaw.js";
import type { RuntimeEnv } from "../../runtime.js";
import type { ChannelSetupInput } from "./setup-input.js";

export type ChannelSetupAdapter<Input extends { name?: string } = ChannelSetupInput> = {
  resolveAccountId?: (params: { cfg: NatesclawConfig; accountId?: string; input?: Input }) => string;
  prepareAccountConfigInput?: (params: {
    cfg: NatesclawConfig;
    accountId: string;
    input: Input;
    runtime: RuntimeEnv;
  }) => Promise<Input> | Input;
  resolveBindingAccountId?: (params: {
    cfg: NatesclawConfig;
    agentId: string;
    accountId?: string;
  }) => string | undefined;
  applyAccountName?: (params: {
    cfg: NatesclawConfig;
    accountId: string;
    name?: string;
  }) => NatesclawConfig;
  applyAccountConfig: (params: {
    cfg: NatesclawConfig;
    accountId: string;
    input: Input;
  }) => NatesclawConfig;
  afterAccountConfigWritten?: (params: {
    previousCfg: NatesclawConfig;
    cfg: NatesclawConfig;
    accountId: string;
    input: Input;
    runtime: RuntimeEnv;
  }) => Promise<void> | void;
  validateInput?: (params: {
    cfg: NatesclawConfig;
    accountId: string;
    input: Input;
  }) => string | null;
  singleAccountKeysToMove?: readonly string[];
  namedAccountPromotionKeys?: readonly string[];
  resolveSingleAccountPromotionTarget?: (params: {
    channel: Record<string, unknown>;
  }) => string | undefined;
};
