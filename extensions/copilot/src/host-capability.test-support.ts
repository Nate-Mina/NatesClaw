import type { AgentHarnessAttemptParamsV2 } from "natesclaw/plugin-sdk/agent-harness-runtime";

/** Minimal host authority for tests that do not exercise host policy or approvals. */
export function createCopilotTestHostCapabilities(): AgentHarnessAttemptParamsV2["hostCapabilities"] {
  return Object.freeze({
    kind: "agent-harness-host-capability",
    version: 1,
    assertActive: () => {},
    bindToolSurface: (tools) => tools,
    runBeforeToolCall: async (request) => ({ blocked: false, params: request.params }),
    requestApproval: async () => undefined,
    waitForApproval: async () => undefined,
  });
}
