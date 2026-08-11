// Natesclaw MCP tools tests cover core tool server startup and registration.
import { afterEach, describe, expect, it, vi } from "vitest";
import { hashSystemAgentOperation } from "../agents/tools/system-agent-tool.js";
import {
  buildSystemAgentToolsMcpServerConfig,
  NATESCLAW_TOOLS_MCP_SYSTEM_AGENT_APPROVAL_ARMED_ENV,
  NATESCLAW_TOOLS_MCP_SYSTEM_AGENT_PROPOSAL_ENV,
  NATESCLAW_TOOLS_MCP_SYSTEM_AGENT_SURFACE_ENV,
  NATESCLAW_TOOLS_MCP_TOOLS_ENV,
  resolveNatesclawToolsMcpSystemAgentSurface,
  resolveNatesclawToolsMcpToolSelection,
} from "./natesclaw-tools-serve-config.js";
import {
  NATESCLAW_TOOLS_MCP_AGENT_SESSION_KEY_ENV,
  resolveNatesclawToolsForMcp,
  resolveNatesclawToolsMcpAgentSessionKey,
} from "./natesclaw-tools-serve.js";
import { createPluginToolsMcpHandlers } from "./plugin-tools-handlers.js";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Natesclaw tools MCP server", () => {
  it("exposes cron", async () => {
    const handlers = createPluginToolsMcpHandlers(
      resolveNatesclawToolsForMcp({ agentSessionKey: "agent:worker:main" }),
    );

    const listed = await handlers.listTools();
    expect(listed.tools.map((tool) => tool.name)).toContain("automations");
  });

  it("requires the managed bridge to pass a real agent session key", () => {
    expect(() => resolveNatesclawToolsForMcp({ agentSessionKey: "" })).toThrow(
      NATESCLAW_TOOLS_MCP_AGENT_SESSION_KEY_ENV,
    );
  });

  it("reads the managed bridge agent session key from env", () => {
    expect(
      resolveNatesclawToolsMcpAgentSessionKey({
        [NATESCLAW_TOOLS_MCP_AGENT_SESSION_KEY_ENV]: " agent:worker:main ",
      }),
    ).toBe("agent:worker:main");
  });

  it("serves the ring-zero natesclaw tool without an agent session key", async () => {
    const handlers = createPluginToolsMcpHandlers(
      resolveNatesclawToolsForMcp({ tools: ["natesclaw"], systemAgentSurface: "cli" }),
    );

    const listed = await handlers.listTools();
    expect(listed.tools.map((tool) => tool.name)).toEqual(["natesclaw"]);
  });

  it("returns approved CLI MCP mutations to the host instead of applying them", async () => {
    const operation = { kind: "config-set", path: "gateway.port", value: "19001" } as const;
    vi.stubEnv(NATESCLAW_TOOLS_MCP_SYSTEM_AGENT_APPROVAL_ARMED_ENV, "1");
    vi.stubEnv(NATESCLAW_TOOLS_MCP_SYSTEM_AGENT_PROPOSAL_ENV, hashSystemAgentOperation(operation));
    const handlers = createPluginToolsMcpHandlers(
      resolveNatesclawToolsForMcp({ tools: ["natesclaw"], systemAgentSurface: "cli" }),
    );

    const result = await handlers.callTool({
      name: "natesclaw",
      arguments: {
        action: "config_set",
        path: "gateway.port",
        value: "19001",
        approved: true,
      },
    });

    expect(JSON.stringify(result)).toContain("directive:approved-operation:");
  });

  it("parses the served tool selection from env and defaults to cron", () => {
    expect(resolveNatesclawToolsMcpToolSelection({})).toEqual(["cron"]);
    expect(
      resolveNatesclawToolsMcpToolSelection({
        [NATESCLAW_TOOLS_MCP_TOOLS_ENV]: " natesclaw , cron ",
      }),
    ).toEqual(["natesclaw", "cron"]);
    expect(() =>
      resolveNatesclawToolsMcpToolSelection({ [NATESCLAW_TOOLS_MCP_TOOLS_ENV]: "exec" }),
    ).toThrow(NATESCLAW_TOOLS_MCP_TOOLS_ENV);
  });

  it("parses the natesclaw surface from env and defaults to cli", () => {
    expect(resolveNatesclawToolsMcpSystemAgentSurface({})).toBe("cli");
    expect(
      resolveNatesclawToolsMcpSystemAgentSurface({
        [NATESCLAW_TOOLS_MCP_SYSTEM_AGENT_SURFACE_ENV]: "gateway",
      }),
    ).toBe("gateway");
    expect(() =>
      resolveNatesclawToolsMcpSystemAgentSurface({
        [NATESCLAW_TOOLS_MCP_SYSTEM_AGENT_SURFACE_ENV]: "remote",
      }),
    ).toThrow(NATESCLAW_TOOLS_MCP_SYSTEM_AGENT_SURFACE_ENV);
  });

  it("builds a natesclaw-only stdio server config under the natesclaw name", () => {
    const config = buildSystemAgentToolsMcpServerConfig({ surface: "gateway" });

    expect(Object.keys(config.mcpServers)).toEqual(["natesclaw"]);
    const server = config.mcpServers.natesclaw as {
      command?: string;
      args?: string[];
      env?: Record<string, string>;
    };
    expect(server.command).toBe(process.execPath);
    expect(server.args?.at(-1)).toMatch(/natesclaw-tools-serve\.(js|ts)$/);
    expect(server.env).toEqual({
      [NATESCLAW_TOOLS_MCP_TOOLS_ENV]: "natesclaw",
      [NATESCLAW_TOOLS_MCP_SYSTEM_AGENT_SURFACE_ENV]: "gateway",
    });
  });
});
