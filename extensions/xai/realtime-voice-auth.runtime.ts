import type { NatesclawConfig } from "natesclaw/plugin-sdk/provider-auth";
import { resolveApiKeyForProvider } from "natesclaw/plugin-sdk/provider-auth-runtime";
import { normalizeOptionalString } from "natesclaw/plugin-sdk/string-coerce-runtime";

export async function resolveXaiRealtimeApiKey(
  configApiKey: string | undefined,
  cfg: NatesclawConfig | undefined,
): Promise<string> {
  const direct =
    normalizeOptionalString(configApiKey) ?? normalizeOptionalString(process.env.XAI_API_KEY);
  if (direct) {
    return direct;
  }
  const auth = await resolveApiKeyForProvider({ provider: "xai", cfg });
  const oauthKey = normalizeOptionalString(auth?.apiKey);
  if (oauthKey) {
    return oauthKey;
  }
  throw new Error(
    "xAI credentials missing for realtime voice. Sign in with `natesclaw onboard --auth-choice xai-oauth`, run `natesclaw onboard --auth-choice xai-api-key`, or set XAI_API_KEY.",
  );
}
