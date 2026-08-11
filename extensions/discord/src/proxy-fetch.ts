import type { NatesclawConfig } from "natesclaw/plugin-sdk/config-contracts";
import { makeProxyFetch } from "natesclaw/plugin-sdk/fetch-runtime";
import { danger } from "natesclaw/plugin-sdk/runtime-env";
import type { RuntimeEnv } from "natesclaw/plugin-sdk/runtime-env";
import type { ResolvedDiscordAccount } from "./accounts.js";

function resolveDiscordProxyUrl(
  account: Pick<ResolvedDiscordAccount, "config">,
  cfg: NatesclawConfig,
): string | undefined {
  const accountProxy = account.config.proxy?.trim();
  if (accountProxy) {
    return accountProxy;
  }
  const channelProxy = cfg?.channels?.discord?.proxy;
  if (typeof channelProxy !== "string") {
    return undefined;
  }
  const trimmed = channelProxy.trim();
  return trimmed || undefined;
}

function resolveDiscordProxyFetchByUrl(
  proxyUrl: string | undefined,
  runtime?: Pick<RuntimeEnv, "error">,
): typeof fetch | undefined {
  return withValidatedDiscordProxy(proxyUrl, runtime, (proxy) => makeProxyFetch(proxy));
}

export function resolveDiscordProxyFetchForAccount(
  account: Pick<ResolvedDiscordAccount, "config">,
  cfg: NatesclawConfig,
  runtime?: Pick<RuntimeEnv, "error">,
): typeof fetch | undefined {
  return resolveDiscordProxyFetchByUrl(resolveDiscordProxyUrl(account, cfg), runtime);
}

export function withValidatedDiscordProxy<T>(
  proxyUrl: string | undefined,
  runtime: Pick<RuntimeEnv, "error"> | undefined,
  createValue: (proxyUrl: string) => T,
): T | undefined {
  const proxy = proxyUrl?.trim();
  if (!proxy) {
    return undefined;
  }
  try {
    validateDiscordProxyUrl(proxy);
    return createValue(proxy);
  } catch (err) {
    runtime?.error?.(danger(`discord: invalid rest proxy: ${String(err)}`));
    return undefined;
  }
}

export function validateDiscordProxyUrl(proxyUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(proxyUrl);
  } catch {
    throw new Error("Proxy URL must be a valid http or https URL");
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Proxy URL must use http or https");
  }
  if (!parsed.hostname) {
    throw new Error("Proxy URL must include a host");
  }
  return proxyUrl;
}
