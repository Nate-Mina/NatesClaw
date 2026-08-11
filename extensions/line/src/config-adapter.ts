// Line helper module supports config adapter behavior.
import { createScopedChannelConfigAdapter } from "natesclaw/plugin-sdk/channel-config-helpers";
import { normalizeStringEntries } from "natesclaw/plugin-sdk/string-coerce-runtime";
import {
  listLineAccountIds,
  resolveDefaultLineAccountId,
  resolveLineAccount,
  type ResolvedLineAccount,
} from "./channel-api.js";

function normalizeLineAllowFrom(entry: string): string {
  return entry.replace(/^line:(?:user:)?/i, "");
}

export const lineConfigAdapter = createScopedChannelConfigAdapter<
  ResolvedLineAccount,
  ResolvedLineAccount
>({
  sectionKey: "line",
  listAccountIds: listLineAccountIds,
  resolveAccount: (cfg, accountId) =>
    resolveLineAccount({ cfg, accountId: accountId ?? undefined }),
  defaultAccountId: resolveDefaultLineAccountId,
  clearBaseFields: ["channelAccessToken", "channelSecret", "tokenFile", "secretFile", "name"],
  resolveAllowFrom: (account) => account.config.allowFrom,
  formatAllowFrom: (allowFrom) => normalizeStringEntries(allowFrom).map(normalizeLineAllowFrom),
});
