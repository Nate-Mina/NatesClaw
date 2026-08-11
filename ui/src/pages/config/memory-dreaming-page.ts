// Dreams tab host. Agent selection is owned by the parent Memory page.
import { html, nothing } from "lit";
import { property } from "lit/decorators.js";
import { NatesclawLightDomElement } from "../../lit/natesclaw-element.ts";
import "../agents/memory/memory-panel.ts";

class MemoryDreamingSettings extends NatesclawLightDomElement {
  @property() agentId: string | null = null;

  override render() {
    return html`
      ${this.agentId
        ? html`<natesclaw-agent-memory-panel .agentId=${this.agentId}></natesclaw-agent-memory-panel>`
        : nothing}
    `;
  }
}

if (!customElements.get("natesclaw-memory-dreaming")) {
  customElements.define("natesclaw-memory-dreaming", MemoryDreamingSettings);
}
