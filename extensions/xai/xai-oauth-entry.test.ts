import { registerSingleProviderPlugin } from "openclaw/plugin-sdk/plugin-test-runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";

const oauthRuntimeMocks = vi.hoisted(() => ({
  loginXaiDeviceCode: vi.fn(),
  refreshXaiOAuthCredential: vi.fn(),
}));
const oauthRuntimeLoadedMock = vi.hoisted(() => vi.fn());

vi.mock("./xai-oauth.js", () => {
  oauthRuntimeLoadedMock();
  return oauthRuntimeMocks;
});

beforeEach(() => {
  vi.resetModules();
  oauthRuntimeLoadedMock.mockReset();
  oauthRuntimeMocks.loginXaiDeviceCode.mockReset();
  oauthRuntimeMocks.loginXaiDeviceCode.mockResolvedValue({ profiles: [] });
  oauthRuntimeMocks.refreshXaiOAuthCredential.mockReset();
});

describe("xAI OAuth lazy entry", () => {
  it("keeps provider registration lazy and forwards refresh cancellation", async () => {
    const { default: plugin } = await import("./index.js");
    const provider = await registerSingleProviderPlugin(plugin);
    const credential = {
      type: "oauth",
      provider: "xai",
      access: "old-access",
      refresh: "old-refresh",
      expires: 1,
    } as const;
    const refreshed = { ...credential, access: "new-access" };
    const controller = new AbortController();
    oauthRuntimeMocks.refreshXaiOAuthCredential.mockResolvedValueOnce(refreshed);

    expect(oauthRuntimeLoadedMock).not.toHaveBeenCalled();
    await expect(
      provider.refreshOAuth?.(credential, { signal: controller.signal }),
    ).resolves.toEqual(refreshed);
    expect(oauthRuntimeMocks.refreshXaiOAuthCredential).toHaveBeenCalledWith(credential, {
      signal: controller.signal,
    });
    expect(oauthRuntimeLoadedMock).toHaveBeenCalledOnce();
  });

  it("loads OAuth runtime only when an auth operation runs", async () => {
    const entry = await import("./xai-oauth-entry.js");
    const method = entry.createXaiOAuthAuthMethod();

    expect(oauthRuntimeMocks.loginXaiDeviceCode).not.toHaveBeenCalled();

    await method.run({} as never);
    expect(oauthRuntimeMocks.loginXaiDeviceCode).toHaveBeenCalledOnce();
  });
});
