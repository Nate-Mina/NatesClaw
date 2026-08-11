// Qqbot plugin module implements qqbot test support behavior.
import type { NatesclawConfig } from "natesclaw/plugin-sdk/config-contracts";

export function makeQqbotSecretRefConfig(): NatesclawConfig {
  return {
    channels: {
      qqbot: {
        appId: "123456",
        clientSecret: {
          source: "env",
          provider: "default",
          id: "QQBOT_CLIENT_SECRET",
        },
      },
    },
  } as NatesclawConfig;
}

export function makeQqbotDefaultAccountConfig(): NatesclawConfig {
  return {
    channels: {
      qqbot: {
        defaultAccount: "bot2",
        accounts: {
          bot2: { appId: "123456" },
        },
      },
    },
  } as NatesclawConfig;
}
