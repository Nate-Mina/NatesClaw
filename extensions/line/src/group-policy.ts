// Line plugin module implements group policy behavior.
import {
  buildChannelGroupsScopeTree,
  resolveScopeRequireMention,
} from "natesclaw/plugin-sdk/channel-policy";
import { resolveExactLineGroupConfigKey, type NatesclawConfig } from "./channel-api.js";

type LineGroupContext = { cfg: NatesclawConfig; accountId?: string | null; groupId?: string | null };

export function resolveLineGroupRequireMention(params: LineGroupContext): boolean {
  const tree = buildChannelGroupsScopeTree(params.cfg, "line", params.accountId);
  const matchedKey = resolveExactLineGroupConfigKey({
    groups: tree.scopes,
    groupId: params.groupId,
  });
  return resolveScopeRequireMention({
    tree,
    path: matchedKey ? [matchedKey] : [],
  });
}
