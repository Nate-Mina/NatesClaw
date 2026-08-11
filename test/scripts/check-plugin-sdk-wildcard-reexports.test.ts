// Check Plugin Sdk Wildcard Reexports tests cover check plugin sdk wildcard reexports script behavior.
import { describe, expect, it } from "vitest";
import { findPluginSdkWildcardReexports } from "../../scripts/check-plugin-sdk-wildcard-reexports.mts";

describe("check-plugin-sdk-wildcard-reexports", () => {
  it("flags wildcard re-exports from plugin-sdk subpaths", () => {
    expect(
      findPluginSdkWildcardReexports(
        [
          'export * from "natesclaw/plugin-sdk/foo";',
          'export * as sdk from "natesclaw/plugin-sdk/foo";',
          'export type * from "natesclaw/plugin-sdk/bar";',
          'export type * as sdkTypes from "natesclaw/plugin-sdk/bar";',
          'export { named } from "natesclaw/plugin-sdk/foo";',
        ].join("\n"),
      ),
    ).toEqual([
      { line: 1, text: 'export * from "natesclaw/plugin-sdk/foo";' },
      { line: 2, text: 'export * as sdk from "natesclaw/plugin-sdk/foo";' },
      { line: 3, text: 'export type * from "natesclaw/plugin-sdk/bar";' },
      { line: 4, text: 'export type * as sdkTypes from "natesclaw/plugin-sdk/bar";' },
    ]);
  });

  it("allows explicit SDK exports and local wildcard barrels", () => {
    expect(
      findPluginSdkWildcardReexports(
        [
          'export { named } from "natesclaw/plugin-sdk/foo";',
          'export type { Named } from "natesclaw/plugin-sdk/foo";',
          'export * from "./src/runtime-api.js";',
          'export * as runtime from "./src/runtime-api.js";',
        ].join("\n"),
      ),
    ).toStrictEqual([]);
  });
});
