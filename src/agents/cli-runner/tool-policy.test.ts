import { describe, expect, it } from "vitest";
import {
  buildCliBackendToolAvailability,
  resolveCliRuntimeToolsAllow,
  stripNatesclawMcpToolPrefix,
} from "./tool-policy.js";

describe("buildCliBackendToolAvailability", () => {
  it("keeps canonical names and projects the shipped beta MCP transport names", () => {
    expect(
      buildCliBackendToolAvailability({ native: ["Read"], Natesclaw: ["message", "write"] }),
    ).toEqual({
      native: ["Read"],
      Natesclaw: ["message", "write"],
      mcp: ["mcp__natesclaw__message", "mcp__natesclaw__write"],
    });
  });
});

describe("stripNatesclawMcpToolPrefix", () => {
  it("strips only the loopback transport prefix", () => {
    expect(stripNatesclawMcpToolPrefix("mcp__natesclaw__memory_search")).toBe("memory_search");
    expect(stripNatesclawMcpToolPrefix("memory_search")).toBe("memory_search");
    expect(stripNatesclawMcpToolPrefix("mcp__other__tool")).toBe("mcp__other__tool");
  });
});

describe("resolveCliRuntimeToolsAllow", () => {
  it("keeps every concrete restriction, including server-managed defaults", () => {
    expect(resolveCliRuntimeToolsAllow(undefined)).toBeUndefined();
    expect(resolveCliRuntimeToolsAllow(["memory_search"], true)).toEqual(["memory_search"]);
    expect(resolveCliRuntimeToolsAllow(["*"])).toBeUndefined();
    expect(resolveCliRuntimeToolsAllow(["memory_search"])).toEqual(["memory_search"]);
  });
});
