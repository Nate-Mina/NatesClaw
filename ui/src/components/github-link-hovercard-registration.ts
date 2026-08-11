import { GitHubLinkHovercardProvider } from "./github-link-hovercard.ts";

if (!customElements.get("natesclaw-github-link-hovercard-provider")) {
  customElements.define("natesclaw-github-link-hovercard-provider", GitHubLinkHovercardProvider);
}
