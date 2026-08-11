import { AgentSelect } from "./agent-select.ts";

if (!customElements.get("natesclaw-agent-select")) {
  customElements.define("natesclaw-agent-select", AgentSelect);
}
