/**
 * Standalone MCP server for selected built-in Natesclaw tools.
 *
 * Run via: node --import tsx src/mcp/natesclaw-tools-serve.ts
 * Or: bun src/mcp/natesclaw-tools-serve.ts
 */
import { pathToFileURL } from "node:url";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { AUTOMATIONS_TOOL_NAME } from "../agents/tools/automations-tool-name.js";
import type { AnyAgentTool } from "../agents/tools/common.js";
import { createCronTool } from "../agents/tools/cron-tool.js";
import { createSystemAgentTool } from "../agents/tools/system-agent-tool.js";
import type { SystemAgentToolOptions } from "../agents/tools/system-agent-tool.js";
import { formatErrorMessage } from "../infra/errors.js";
import {
  NATESCLAW_TOOLS_MCP_AGENT_SESSION_KEY_ENV,
  resolveToolsMcpAgentSessionKey,
} from "./agent-session-env.js";
import {
  resolveNatesclawToolsMcpSystemAgentApproval,
  resolveNatesclawToolsMcpSystemAgentSurface,
  resolveNatesclawToolsMcpToolSelection,
  type NatesclawToolsMcpToolId,
} from "./natesclaw-tools-serve-config.js";
import { connectToolsMcpServerToStdio, createToolsMcpServer } from "./tools-stdio-server.js";

export {
  NATESCLAW_TOOLS_MCP_SYSTEM_AGENT_SURFACE_ENV,
  NATESCLAW_TOOLS_MCP_TOOLS_ENV,
} from "./natesclaw-tools-serve-config.js";

export { NATESCLAW_TOOLS_MCP_AGENT_SESSION_KEY_ENV } from "./agent-session-env.js";

export function resolveNatesclawToolsMcpAgentSessionKey(
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  return resolveToolsMcpAgentSessionKey(env);
}

export function resolveNatesclawToolsForMcp(
  params: {
    agentSessionKey?: string;
    tools?: NatesclawToolsMcpToolId[];
    systemAgentSurface?: SystemAgentToolOptions["surface"];
  } = {},
): AnyAgentTool[] {
  const selection = params.tools ?? resolveNatesclawToolsMcpToolSelection();
  return selection.map((tool) => {
    if (tool === "natesclaw") {
      return createSystemAgentTool({
        surface: params.systemAgentSurface ?? resolveNatesclawToolsMcpSystemAgentSurface(),
        ...resolveNatesclawToolsMcpSystemAgentApproval(),
      });
    }
    const agentSessionKey = (
      params.agentSessionKey ?? resolveNatesclawToolsMcpAgentSessionKey()
    )?.trim();
    if (!agentSessionKey) {
      throw new Error(`${NATESCLAW_TOOLS_MCP_AGENT_SESSION_KEY_ENV} is required`);
    }
    return createCronTool({
      agentSessionKey,
      creatorToolAllowlist: [{ name: AUTOMATIONS_TOOL_NAME }],
    });
  });
}

function createNatesclawToolsMcpServer(
  params: {
    tools?: AnyAgentTool[];
  } = {},
): Server {
  const tools = params.tools ?? resolveNatesclawToolsForMcp();
  return createToolsMcpServer({ name: "natesclaw-tools", tools });
}

async function serveNatesclawToolsMcp(): Promise<void> {
  const server = createNatesclawToolsMcpServer();
  await connectToolsMcpServerToStdio(server);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  serveNatesclawToolsMcp().catch((err: unknown) => {
    process.stderr.write(`natesclaw-tools-serve: ${formatErrorMessage(err)}\n`);
    process.exit(1);
  });
}
