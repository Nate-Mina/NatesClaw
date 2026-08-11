import type { resolveApprovalOverGateway } from "natesclaw/plugin-sdk/approval-gateway-runtime";

export type IMessageApprovalGatewayRuntime = NonNullable<
  Parameters<typeof resolveApprovalOverGateway>[0]["gatewayRuntime"]
>;
