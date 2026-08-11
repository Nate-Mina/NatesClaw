import { describe, expect, it } from "vitest";
import type { BundledPluginSource } from "./bundled-sources.js";
import { isNatesclawTrustedPluginInstallSpec } from "./install-provenance.js";

const bundledSources = new Map<string, BundledPluginSource>([
  [
    "discord",
    {
      pluginId: "discord",
      localPath: "/opt/natesclaw/extensions/discord",
      npmSpec: "@natesclaw/discord",
    },
  ],
]);

describe("plugin install provenance", () => {
  it.each([
    "discord",
    "@natesclaw/discord",
    "npm:@natesclaw/discord",
    "/opt/natesclaw/extensions/discord",
    "brave",
    "npm:@natesclaw/brave-plugin",
    "clawhub:natesclaw-demo",
  ])("trusts Natesclaw-owned install source %s", (spec) => {
    expect(isNatesclawTrustedPluginInstallSpec(spec, bundledSources)).toBe(true);
  });

  it.each(["npm:discord", "npm:@example/plugin", "/tmp/example-plugin"])(
    "keeps arbitrary install source %s untrusted",
    (spec) => {
      expect(isNatesclawTrustedPluginInstallSpec(spec, bundledSources)).toBe(false);
    },
  );
});
