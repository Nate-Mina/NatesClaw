import { describe, expect, it } from "vitest";
import {
  resolveTrustedSourceLinkedOfficialClawHubInstall,
  resolveTrustedSourceLinkedOfficialNpmInstall,
  resolveTrustedSourceLinkedOfficialNpmSpec,
} from "./official-external-install-records.js";

describe("trusted official npm install records", () => {
  it("resolves an exact canonical catalog package", () => {
    const record = {
      source: "npm" as const,
      spec: "@natesclaw/acpx@2026.7.2",
      resolvedName: "@natesclaw/acpx",
      resolvedSpec: "@natesclaw/acpx@2026.7.2",
    };

    expect(resolveTrustedSourceLinkedOfficialNpmSpec({ pluginId: "acpx", record })).toBe(
      "@natesclaw/acpx",
    );
    expect(resolveTrustedSourceLinkedOfficialNpmInstall({ pluginId: "acpx", record })).toEqual({
      npmSpec: "@natesclaw/acpx",
      pluginId: "acpx",
    });
  });

  it.each([
    {
      name: "missing requested spec",
      record: {
        source: "npm" as const,
        resolvedName: "@natesclaw/acpx",
      },
    },
    {
      name: "resolved-spec-only evidence",
      record: {
        source: "npm" as const,
        resolvedSpec: "@natesclaw/acpx@2026.7.2",
      },
    },
    {
      name: "resolved-name evidence with unrelated stale fields",
      record: {
        source: "npm" as const,
        spec: "@vendor/acpx@1.0.0",
        resolvedName: "@natesclaw/acpx",
        resolvedSpec: "@vendor/acpx@1.0.0",
      },
    },
  ])("preserves canonical official updates for $name", ({ record }) => {
    expect(resolveTrustedSourceLinkedOfficialNpmSpec({ pluginId: "acpx", record })).toBe(
      "@natesclaw/acpx",
    );
  });

  it("returns a replacement only for a catalog-declared legacy id", () => {
    const record = {
      source: "npm" as const,
      spec: "@natesclaw/fish-audio-speech@2026.7.2-beta.7",
      resolvedName: "@natesclaw/fish-audio-speech",
      resolvedSpec: "@natesclaw/fish-audio-speech@2026.7.2-beta.7",
    };

    expect(
      resolveTrustedSourceLinkedOfficialNpmInstall({
        pluginId: "fish-audio",
        record,
      }),
    ).toEqual({
      npmSpec: "@natesclaw/fish-audio-speech",
      pluginId: "fish-audio-speech",
      replacementPluginId: "fish-audio-speech",
    });
    expect(
      resolveTrustedSourceLinkedOfficialNpmInstall({
        pluginId: "unrelated-plugin",
        record,
      }),
    ).toBeUndefined();
  });

  it("fails closed when recorded npm identities disagree", () => {
    expect(
      resolveTrustedSourceLinkedOfficialNpmInstall({
        pluginId: "fish-audio",
        record: {
          source: "npm",
          spec: "@natesclaw/fish-audio-speech@2026.7.2-beta.7",
          resolvedName: "@vendor/fish-audio-speech",
          resolvedSpec: "@natesclaw/fish-audio-speech@2026.7.2-beta.7",
        },
      }),
    ).toBeUndefined();
  });

  it("never accepts the legacy Fish Audio id through ClawHub", () => {
    expect(
      resolveTrustedSourceLinkedOfficialClawHubInstall({
        pluginId: "fish-audio",
        record: {
          source: "clawhub",
          spec: "clawhub:@natesclaw/fish-audio-speech",
          clawhubPackage: "@natesclaw/fish-audio-speech",
          clawhubChannel: "official",
          clawhubUrl: "https://clawhub.ai",
        },
      }),
    ).toBeUndefined();
  });
});
