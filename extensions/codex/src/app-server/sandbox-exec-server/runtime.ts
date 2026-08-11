/**
 * Runtime guards for sandbox exec-server handlers that need backend-specific
 * execution and filesystem bridges.
 */
import type { SandboxContext } from "natesclaw/plugin-sdk/sandbox";
import type { NatesclawExecServer } from "./types.js";

/** Returns the configured sandbox backend or fails the current JSON-RPC request. */
export function requireBackend(
  execServer: NatesclawExecServer,
): NonNullable<SandboxContext["backend"]> {
  const backend = execServer.sandbox.backend;
  if (!backend) {
    throw new Error("Natesclaw sandbox backend is unavailable.");
  }
  return backend;
}

/** Returns the configured filesystem bridge or fails the current JSON-RPC request. */
export function requireFsBridge(
  execServer: NatesclawExecServer,
): NonNullable<SandboxContext["fsBridge"]> {
  const fsBridge = execServer.sandbox.fsBridge;
  if (!fsBridge) {
    throw new Error("Sandbox filesystem bridge is unavailable.");
  }
  return fsBridge;
}
