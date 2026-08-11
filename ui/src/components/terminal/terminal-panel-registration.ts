import { NatesclawTerminalPanel } from "./terminal-panel.ts";

// Guarded define so shared registries can retain this module across reloads.
if (!customElements.get("natesclaw-terminal-panel")) {
  customElements.define("natesclaw-terminal-panel", NatesclawTerminalPanel);
}
