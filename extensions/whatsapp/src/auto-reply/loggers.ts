// Whatsapp plugin module implements loggers behavior.
import { createSubsystemLogger } from "natesclaw/plugin-sdk/runtime-env";

export const whatsappLog = createSubsystemLogger("gateway/channels/whatsapp");
export const whatsappInboundLog = whatsappLog.child("inbound");
export const whatsappOutboundLog = whatsappLog.child("outbound");
export const whatsappHeartbeatLog = whatsappLog.child("heartbeat");
