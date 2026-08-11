import { ApprovalPage } from "./approval-page.ts";

if (!customElements.get("natesclaw-approval-page")) {
  customElements.define("natesclaw-approval-page", ApprovalPage);
}
