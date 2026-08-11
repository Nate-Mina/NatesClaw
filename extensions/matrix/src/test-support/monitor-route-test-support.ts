// Matrix plugin module implements monitor route test support behavior.
export {
  registerSessionBindingAdapter,
  testing,
} from "natesclaw/plugin-sdk/session-binding-runtime";
export { resolveAgentRoute } from "natesclaw/plugin-sdk/routing";
export {
  createTestRegistry,
  setActivePluginRegistry,
} from "natesclaw/plugin-sdk/plugin-test-runtime";
export type { NatesclawConfig } from "natesclaw/plugin-sdk/config-contracts";
